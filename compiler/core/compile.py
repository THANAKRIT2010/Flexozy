"""Compile a Luau AST into Flexozy VM bytecode (register-based, Lua-5.1-style ISA)."""
from __future__ import annotations
from core.luaparse import LuaSyntaxError

OPNAMES = [
    'MOVE', 'LOADK', 'LOADNIL', 'LOADBOOL', 'GETGLOBAL', 'SETGLOBAL',
    'GETFIELD', 'SETFIELD', 'GETTABLE', 'SETTABLE', 'NEWTABLE', 'SETLIST',
    'CALL', 'SELF', 'CONCAT', 'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW',
    'UNM', 'NOT', 'LEN', 'EQ', 'LT', 'LE', 'JMP', 'TEST', 'FORPREP',
    'FORLOOP', 'TFORCALL', 'TFORLOOP', 'CLOSURE', 'SETUPVAL', 'GETUPVAL',
    'VARARG', 'RETURN', 'CLOSE', 'ITERPREP',
]

MULTI_KINDS = ('Call', 'Method', 'Vararg')

ARITH_OPS = {'+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD', '^': 'POW'}
COMPOUND_OPS = {'+=': 'ADD', '-=': 'SUB', '*=': 'MUL', '/=': 'DIV',
                '%=': 'MOD', '^=': 'POW', '..=': 'CONCAT'}


class FuncState:
    def __init__(self, comp, parent):
        self.comp = comp
        self.parent = parent
        self.code = []
        self.consts = []
        self.kmap = {}
        self.protos = []
        self.closures = []  # (instr_index, child_fs)
        self.upvals = []    # (name, instack, idx)
        self.blocks = []
        self.loops = []
        self.free = 0
        self.nparams = 0
        self.isvararg = False
        self.labels = {}
        self.pend_goto = []
        self.flat_index = None

    # -- emission -----------------------------------------------------------
    def E(self, opname, a=0, b=0, c=0) -> int:
        self.code.append([self.comp.opmap[opname], a, b, c])
        return len(self.code) - 1

    def patch(self, idx: int, target: int):
        self.code[idx][2] = target - idx - 1

    def pc(self) -> int:
        return len(self.code)

    def temp(self) -> int:
        r = self.free
        self.free += 1
        return r

    def fr(self, r: int):
        self.free = r

    def kstr(self, data: bytes) -> int:
        key = ('s', bytes(data))
        if key in self.kmap:
            return self.kmap[key]
        self.kmap[key] = len(self.consts) + 1
        self.consts.append(('s', bytes(data)))
        return self.kmap[key]

    def knum(self, v: float) -> int:
        key = ('n', float(v))
        if key in self.kmap:
            return self.kmap[key]
        self.kmap[key] = len(self.consts) + 1
        self.consts.append(('n', float(v)))
        return self.kmap[key]

    # -- blocks & locals ----------------------------------------------------
    def push_block(self):
        self.blocks.append({'free0': self.free, 'top': self.free, 'vars': {}, 'hascap': False})

    def pop_block(self):
        b = self.blocks.pop()
        if b['hascap']:
            self.E('CLOSE', b['free0'])
        self.free = b['free0']

    def alloc_local(self, name: str) -> int:
        r = self.free
        self.free += 1
        b = self.blocks[-1]
        b['vars'][name] = r
        b['top'] = self.free
        return r

    def start_statement(self):
        if self.blocks:
            self.free = self.blocks[-1]['top']

    # -- name resolution ----------------------------------------------------
    def find_local(self, name):
        for b in reversed(self.blocks):
            if name in b['vars']:
                return b, b['vars'][name]
        return None, None

    def resolve(self, name: str):
        b, reg = self.find_local(name)
        if b is not None:
            return ('L', reg)
        idx = self.resolve_upval(self, name)
        if idx is not None:
            return ('U', idx)
        return ('G', self.kstr(name.encode('utf-8')))

    def resolve_upval(self, fs, name):
        for i, (n, instack, idx) in enumerate(fs.upvals, start=1):
            if n == name:
                return i
        if fs.parent is None:
            return None
        b, reg = fs.parent.find_local(name)
        if b is not None:
            b['hascap'] = True
            return self.add_upval(fs, name, True, reg)
        idx = self.resolve_upval(fs.parent, name)
        if idx is None:
            return None
        return self.add_upval(fs, name, False, idx)

    def add_upval(self, fs, name, instack, idx):
        for i, (n, s, i2) in enumerate(fs.upvals, start=1):
            if n == name and s == instack and i2 == idx:
                return i
        fs.upvals.append((name, instack, idx))
        return len(fs.upvals)

    # -- expressions --------------------------------------------------------
    def expr(self, e) -> int:
        """Compile an expression to a single value in a fresh temp (caller frees)."""
        k = e[0]
        if k == 'Num':
            r = self.temp()
            self.E('LOADK', r, self.knum(e[1]))
            return r
        if k == 'Str':
            r = self.temp()
            self.E('LOADK', r, self.kstr(e[1]))
            return r
        if k == 'True':
            r = self.temp()
            self.E('LOADBOOL', r, 1)
            return r
        if k == 'False':
            r = self.temp()
            self.E('LOADBOOL', r, 0)
            return r
        if k == 'Nil':
            r = self.temp()
            self.E('LOADNIL', r)
            return r
        if k == 'Var':
            return self.read_var(e[1])
        if k == 'Paren':
            return self.expr(e[1])
        if k == 'Index':
            tr = self.expr(e[1])
            key = e[2]
            if key[0] == 'Str':
                self.E('GETFIELD', tr, tr, self.kstr(key[1]))
            else:
                kr = self.expr(key)
                self.E('GETTABLE', tr, tr, kr)
                self.fr(kr)
            return tr
        if k in ('Call', 'Method'):
            return self.compile_call(e, 1)
        if k == 'Func':
            return self.compile_func_expr(e)
        if k == 'Vararg':
            self.require_vararg()
            r = self.temp()
            self.E('VARARG', r, 2)
            return r
        if k == 'Bin':
            return self.compile_bin(e)
        if k == 'Cmp':
            return self.compile_cmp(e)
        if k == 'Concat':
            return self.compile_concat(e)
        if k == 'Un':
            return self.compile_un(e)
        if k == 'And':
            return self.compile_and(e)
        if k == 'Or':
            return self.compile_or(e)
        if k == 'IfExpr':
            return self.compile_ifexpr(e)
        if k == 'Table':
            return self.compile_table(e)
        raise LuaSyntaxError(f'cannot compile expression kind {k}')

    def require_vararg(self):
        if not self.isvararg:
            raise LuaSyntaxError('cannot use "..." outside a vararg function')

    def read_var(self, name: str) -> int:
        res = self.resolve(name)
        r = self.temp()
        if res[0] == 'L':
            self.E('MOVE', r, res[1])
        elif res[0] == 'U':
            self.E('GETUPVAL', r, res[1])
        else:
            self.E('GETGLOBAL', r, res[1])
        return r

    def compile_table(self, e) -> int:
        r = self.temp()
        self.E('NEWTABLE', r)
        fields = e[1]
        run: list[int] = []
        base_free = r + 1

        def flush(multi=False):
            if run:
                self.E('SETLIST', r, 0 if multi else len(run))
            self.free = base_free
            run.clear()

        for idx, f in enumerate(fields):
            if f[0] == 'v':
                is_last = idx == len(fields) - 1
                if is_last and f[1][0] in MULTI_KINDS:
                    s = self.compile_multi_at(f[1])
                    run.append(s)
                    flush(multi=True)
                else:
                    ar = self.temp()
                    v = self.expr(f[1])
                    self.E('MOVE', ar, v)
                    self.free = ar + 1
                    run.append(ar)
            else:
                flush()
                key = f[1]
                if key[0] == 'Str':
                    vr = self.expr(f[2])
                    self.E('SETFIELD', vr, r, self.kstr(key[1]))
                    self.fr(vr)
                else:
                    kr = self.expr(key)
                    vr = self.expr(f[2])
                    self.E('SETTABLE', vr, r, kr)
                    self.fr(vr)
                    self.fr(kr)
        flush()
        return r

    def compile_bin(self, e) -> int:
        op = e[1]
        if op in ARITH_OPS and e[2][0] == 'Num' and e[3][0] == 'Num':
            try:
                a, b = e[2][1], e[3][1]
                if op == '+':
                    v = a + b
                elif op == '-':
                    v = a - b
                elif op == '*':
                    v = a * b
                elif op == '/':
                    v = a / b
                elif op == '^':
                    v = a ** b
                else:
                    v = None
                if v is not None:
                    r = self.temp()
                    self.E('LOADK', r, self.knum(float(v)))
                    return r
            except (ZeroDivisionError, OverflowError, ValueError):
                pass
        if op == '..' and e[2][0] == 'Str' and e[3][0] == 'Str':
            r = self.temp()
            self.E('LOADK', r, self.kstr(e[2][1] + e[3][1]))
            return r
        l = self.expr(e[2])
        r2 = self.expr(e[3])
        self.E(ARITH_OPS[op], l, l, r2)
        self.fr(r2)
        return l

    def compile_concat(self, e) -> int:
        l = self.expr(e[1])
        r2 = self.expr(e[2])
        self.E('CONCAT', l, l, r2)
        self.fr(r2)
        return l

    def compile_un(self, e) -> int:
        op = e[1]
        if op == 'not' and e[2][0] == 'True':
            r = self.temp()
            self.E('LOADBOOL', r, 0)
            return r
        if op == 'not' and e[2][0] == 'False':
            r = self.temp()
            self.E('LOADBOOL', r, 1)
            return r
        if op == '-' and e[2][0] == 'Num':
            r = self.temp()
            self.E('LOADK', r, self.knum(-e[2][1]))
            return r
        src = self.expr(e[2])
        self.E({'-': 'UNM', 'not': 'NOT', '#': 'LEN'}[op], src, src)
        return src

    def compile_cmp(self, e) -> int:
        op, l, r = e[1], e[2], e[3]
        lb = self.expr(l)
        rb = self.expr(r)
        dst = self.temp()
        if op == '==':
            self.E('EQ', 1, lb, rb)
        elif op == '~=':
            self.E('EQ', 1, lb, rb)
        elif op == '<':
            self.E('LT', 1, lb, rb)
        elif op == '>':
            self.E('LT', 1, rb, lb)
        elif op == '<=':
            self.E('LE', 1, lb, rb)
        else:  # >=
            self.E('LE', 1, rb, lb)
        j = self.E('JMP')
        if op == '~=':
            self.E('LOADBOOL', dst, 0, 1)   # equal -> false, skip next
            self.E('LOADBOOL', dst, 1, 0)   # not equal -> true
        else:
            self.E('LOADBOOL', dst, 1, 1)   # comparison true -> true, skip next
            self.E('LOADBOOL', dst, 0, 0)
        self.patch(j, self.pc() - 1)
        self.fr(lb)
        self.fr(rb)
        return dst

    def compile_and(self, e) -> int:
        dst = self.temp()
        a = self.expr(e[1])
        self.E('TEST', a, 1)      # skip next instruction when truthy
        jf = self.E('JMP')
        self.fr(a)
        b = self.expr(e[2])
        self.E('MOVE', dst, b)
        self.fr(b)
        je = self.E('JMP')
        lfalse = self.E('MOVE', dst, a)   # falsy -> result is a's value
        self.patch(jf, lfalse)
        self.patch(je, lfalse + 1)
        return dst

    def compile_or(self, e) -> int:
        dst = self.temp()
        a = self.expr(e[1])
        self.E('TEST', a, 1)
        jb = self.E('JMP')
        jtrue = self.E('MOVE', dst, a)    # truthy -> result is a's value
        je = self.E('JMP')
        self.fr(a)
        bstart = self.pc()
        b = self.expr(e[2])
        self.E('MOVE', dst, b)
        self.fr(b)
        self.patch(je, self.pc())
        self.patch(jb, bstart)
        return dst

    def compile_ifexpr(self, e) -> int:
        dst = self.temp()
        end_jumps = []
        arms, els = e[1], e[2]
        for cond, then in arms:
            c = self.expr(cond)
            self.E('TEST', c, 1)
            jn = self.E('JMP')
            self.fr(c)
            t = self.expr(then)
            self.E('MOVE', dst, t)
            self.fr(t)
            end_jumps.append(self.E('JMP'))
            self.patch(jn, self.pc())
        t = self.expr(els)
        self.E('MOVE', dst, t)
        self.fr(t)
        target = self.pc()
        for j in end_jumps:
            self.patch(j, target)
        return dst

    def compile_func_expr(self, e) -> int:
        child = FuncState(self.comp, self)
        self.comp.compile_function(child, e)
        self.protos.append(child)
        r = self.temp()
        idx = self.E('CLOSURE', r, 0)
        self.closures.append((idx, child))
        return r

    # -- calls ---------------------------------------------------------------
    def compile_multi_at(self, e) -> int:
        """Compile a multi-value expression; results start at the returned reg."""
        if e[0] == 'Vararg':
            self.require_vararg()
            s = self.temp()
            self.E('VARARG', s, 0)
            return s
        return self.compile_call(e, 0)

    def compile_call(self, e, nres) -> int:
        """nres: 1 -> one result, 0 -> all results, 2 -> no results."""
        if e[0] == 'Method':
            oreg = self.expr(e[1])
            base = oreg  # SELF rewrites this slot in place: R[A+1]=obj, R[A]=method
            self.E('SELF', base, oreg, self.kstr(e[2].encode('utf-8')))
            self.free = base + 2  # args start after the self slot
            args = e[3]
            extra = 1  # self counts as first argument
        else:
            freg = self.expr(e[1])
            base = freg
            args = e[2]
            extra = 0
        n = len(args)
        multi_tail = n > 0 and args[-1][0] in MULTI_KINDS
        arg_base = base + 1 + extra
        if multi_tail:
            for k, a in enumerate(args[:-1]):
                ar = self.temp()
                v = self.expr(a)
                self.E('MOVE', ar, v)
                self.free = ar + 1
            self.compile_multi_at(args[-1])
            B = 0
        else:
            for k, a in enumerate(args):
                ar = self.temp()
                v = self.expr(a)
                self.E('MOVE', ar, v)
                self.free = ar + 1
            B = n + extra + 1
        self.E('CALL', base, B, nres)
        self.free = base + 1
        return base

    # -- value movement ------------------------------------------------------
    def store(self, tdesc, src: int):
        kind = tdesc[0]
        if kind == 'L':
            self.E('MOVE', tdesc[1], src)
        elif kind == 'U':
            self.E('SETUPVAL', src, tdesc[1])
        elif kind == 'G':
            self.E('SETGLOBAL', src, tdesc[1])
        elif kind == 'F':
            self.E('SETFIELD', src, tdesc[1], tdesc[2])
        else:  # 'T'
            self.E('SETTABLE', src, tdesc[1], tdesc[2])

    def store_nil(self, tdesc):
        if tdesc[0] == 'L':
            self.E('LOADNIL', tdesc[1])
        elif tdesc[0] == 'U':
            r = self.temp()
            self.E('LOADNIL', r)
            self.E('SETUPVAL', r, tdesc[1])
            self.fr(r)
        elif tdesc[0] == 'G':
            r = self.temp()
            self.E('LOADNIL', r)
            self.E('SETGLOBAL', r, tdesc[1])
            self.fr(r)
        else:
            r = self.temp()
            self.E('LOADNIL', r)
            if tdesc[0] == 'F':
                self.E('SETFIELD', r, tdesc[1], tdesc[2])
            else:
                self.E('SETTABLE', r, tdesc[1], tdesc[2])
            self.fr(r)

    def move_values(self, exprs, dests):
        """Assign an expression list to plain register destinations.

        All RHS expressions are evaluated before any assignment so that
        swaps like `local a, b = b, a` keep Lua evaluation semantics.
        """
        n, d = len(exprs), len(dests)
        if n == 0:
            if d:
                self.E('LOADNIL', dests[0], d - 1)
            return
        if n > d:
            vals = [self.expr(e) for e in exprs[:d]]
            for e in exprs[d:]:
                v = self.expr(e)
                self.fr(v)
            for i in range(d):
                self.E('MOVE', dests[i], vals[i])
            return
        if n < d and exprs[-1][0] in MULTI_KINDS:
            vals = [self.expr(e) for e in exprs[:-1]]
            s = self.compile_multi_at(exprs[-1])
            for i in range(n - 1):
                self.E('MOVE', dests[i], vals[i])
            for k in range(d - n + 1):
                self.E('MOVE', dests[n - 1 + k], s + k)
            return
        vals = [self.expr(e) for e in exprs]
        for i in range(n):
            self.E('MOVE', dests[i], vals[i])
        if n < d:
            self.E('LOADNIL', dests[n], d - n - 1)

    def assign_values(self, tdescs, exprs):
        n, d = len(exprs), len(tdescs)
        if n == 0:
            for t in tdescs:
                self.store_nil(t)
            return
        if n > d:
            vals = [self.expr(e) for e in exprs[:d]]
            for e in exprs[d:]:
                v = self.expr(e)
                self.fr(v)
            for i in range(d):
                self.store(tdescs[i], vals[i])
            return
        if n < d and exprs[-1][0] in MULTI_KINDS:
            vals = [self.expr(e) for e in exprs[:-1]]
            s = self.compile_multi_at(exprs[-1])
            for i in range(n - 1):
                self.store(tdescs[i], vals[i])
            for k in range(d - n + 1):
                self.store(tdescs[n - 1 + k], s + k)
            return
        vals = [self.expr(e) for e in exprs]
        for i in range(n):
            self.store(tdescs[i], vals[i])
        for j in range(n, d):
            self.store_nil(tdescs[j])

    # -- target descriptors ---------------------------------------------------
    def target_desc(self, var):
        if var[0] == 'Var':
            res = self.resolve(var[1])
            if res[0] == 'L':
                return ('L', res[1])
            if res[0] == 'U':
                return ('U', res[1])
            return ('G', res[1])
        tab = self.expr(var[1])
        key = var[2]
        if key[0] == 'Str':
            return ('F', tab, self.kstr(key[1]))
        kr = self.expr(key)
        return ('T', tab, kr)

    def compound(self, var, opname, rhs):
        tdesc = self.target_desc(var)
        op = COMPOUND_OPS[opname]
        kind = tdesc[0]
        if kind == 'L':
            reg = tdesc[1]
            er = self.expr(rhs)
            self.E(op, reg, reg, er)
            self.fr(er)
        elif kind in ('G', 'U'):
            r = self.temp()
            if kind == 'G':
                self.E('GETGLOBAL', r, tdesc[1])
            else:
                self.E('GETUPVAL', r, tdesc[1])
            er = self.expr(rhs)
            self.E(op, r, r, er)
            self.fr(er)
            if kind == 'G':
                self.E('SETGLOBAL', r, tdesc[1])
            else:
                self.E('SETUPVAL', r, tdesc[1])
            self.fr(r)
        else:
            tab, key = tdesc[1], tdesc[2]
            keep = self.free
            r = self.temp()
            if kind == 'F':
                self.E('GETFIELD', r, tab, key)
            else:
                self.E('GETTABLE', r, tab, key)
            er = self.expr(rhs)
            self.E(op, r, r, er)
            self.fr(er)
            if kind == 'F':
                self.E('SETFIELD', r, tab, key)
            else:
                self.E('SETTABLE', r, tab, key)
            self.free = keep

    # -- statements -----------------------------------------------------------
    def compile_stats(self, stats, ret):
        for st in stats:
            self.start_statement()
            self.compile_stat(st)
        if ret is not None:
            self.start_statement()
            self.compile_stat(ret)

    def compile_stat(self, st):
        k = st[0]
        if k == 'Local':
            _, names, exprs = st
            dests = [self.alloc_local(nm) for nm in names]
            if exprs:
                self.move_values(exprs, dests)
            elif dests:
                self.E('LOADNIL', dests[0], len(dests) - 1)
        elif k == 'Assign':
            _, targets, exprs = st
            tdescs = []
            keep = self.free
            for t in targets:
                tdescs.append(self.target_desc(t))
            self.assign_values(tdescs, exprs)
            self.free = keep
        elif k == 'Compound':
            _, var, opname, rhs = st
            self.compound(var, opname, rhs)
        elif k in ('Call', 'Method'):
            self.compile_call(st, 2)
        elif k == 'Do':
            self.push_block()
            self.compile_stats(st[1][1], st[1][2])
            self.pop_block()
        elif k == 'While':
            self.compile_while(st)
        elif k == 'Repeat':
            self.compile_repeat(st)
        elif k == 'If':
            self.compile_if(st)
        elif k == 'ForNum':
            self.compile_fornum(st)
        elif k == 'ForIn':
            self.compile_forin(st)
        elif k == 'FuncDecl':
            self.compile_funcdecl(st)
        elif k == 'Return':
            self.compile_return(st)
        elif k == 'Break':
            if not self.loops:
                raise LuaSyntaxError('break outside a loop')
            self.emit_exit_closes(self.loops[-1])
            j = self.E('JMP')
            self.loops[-1]['breaks'].append(j)
        elif k == 'Continue':
            if not self.loops:
                raise LuaSyntaxError('continue outside a loop')
            self.emit_exit_closes(self.loops[-1])
            j = self.E('JMP')
            self.loops[-1]['continues'].append(j)
        elif k == 'Goto':
            name = st[1]
            if name in self.labels:
                j = self.E('JMP')
                self.patch(j, self.labels[name])
            else:
                j = self.E('JMP')
                self.pend_goto.append((name, j))
        elif k == 'Label':
            name = st[1]
            if name in self.labels:
                raise LuaSyntaxError(f'duplicate label {name}')
            self.labels[name] = self.pc()
            for nm, j in [p for p in self.pend_goto if p[0] == name]:
                self.patch(j, self.labels[name])
            self.pend_goto = [p for p in self.pend_goto if p[0] != name]
        else:
            raise LuaSyntaxError(f'unsupported statement {k}')

    def emit_exit_closes(self, loop):
        depth = loop['depth']
        for b in reversed(self.blocks[depth:]):
            if b['hascap']:
                self.E('CLOSE', b['free0'])

    def compile_while(self, st):
        _, cond, body = st
        loop = {'breaks': [], 'continues': [], 'depth': len(self.blocks)}
        self.loops.append(loop)
        start = self.pc()
        r = self.expr(cond)
        self.E('TEST', r, 1)
        jend = self.E('JMP')
        self.fr(r)
        self.push_block()
        self.compile_stats(body[1], body[2])
        blk = self.blocks[-1]
        hadcap = blk['hascap']
        self.pop_block()            # CLOSE at body end runs every iteration
        back = self.E('JMP')
        self.patch(back, start)
        if hadcap:
            self.E('CLOSE', blk['free0'])  # CLOSE on the fall-through exit path
        lend = self.pc()
        for j in loop['continues']:
            self.patch(j, back)
        for j in loop['breaks']:
            self.patch(j, lend)
        self.patch(jend, lend)
        self.loops.pop()

    def compile_repeat(self, st):
        _, body, cond = st
        loop = {'breaks': [], 'continues': [], 'depth': len(self.blocks)}
        self.loops.append(loop)
        self.push_block()
        start = self.pc()
        self.compile_stats(body[1], body[2])
        cond_at = self.pc()
        r = self.expr(cond)
        self.E('TEST', r, 1)
        blk = self.blocks[-1]
        if blk['hascap']:
            self.E('CLOSE', blk['free0'])  # freeze before looping back
        back = self.E('JMP')
        self.patch(back, start)
        self.pop_block()            # CLOSE on the exit path
        lend = self.pc()
        for j in loop['continues']:
            self.patch(j, cond_at)
        for j in loop['breaks']:
            self.patch(j, lend)
        self.loops.pop()

    def compile_if(self, st):
        _, arms, els = st
        end_jumps = []
        for i, (cond, body) in enumerate(arms):
            r = self.expr(cond)
            self.E('TEST', r, 1)
            jn = self.E('JMP')
            self.fr(r)
            self.push_block()
            self.compile_stats(body[1], body[2])
            self.pop_block()
            if i < len(arms) - 1 or els is not None:
                end_jumps.append(self.E('JMP'))
            self.patch(jn, self.pc())
        if els is not None:
            self.push_block()
            self.compile_stats(els[1], els[2])
            self.pop_block()
        target = self.pc()
        for j in end_jumps:
            self.patch(j, target)

    def compile_fornum(self, st):
        _, var, init, limit, step, body = st
        A = self.temp()
        self.temp()
        self.temp()
        self.temp()  # A..A+3
        v = self.expr(init)
        self.E('MOVE', A, v)
        self.fr(v)
        v = self.expr(limit)
        self.E('MOVE', A + 1, v)
        self.fr(v)
        if step is not None:
            v = self.expr(step)
            self.E('MOVE', A + 2, v)
            self.fr(v)
        else:
            self.E('LOADK', A + 2, self.knum(1.0))
        self.E('FORPREP', A, 0)  # jumps to the next instruction (body start)
        loop = {'breaks': [], 'continues': [], 'depth': len(self.blocks)}
        self.loops.append(loop)
        body_start = self.pc()
        blk = {'free0': A + 3, 'top': A + 4, 'vars': {var: A + 3}, 'hascap': False}
        self.blocks.append(blk)
        self.free = A + 4
        self.compile_stats(body[1], body[2])
        self.pop_block()  # CLOSE for a captured loop var, runs per iteration
        floop = self.E('FORLOOP', A, 0)
        self.patch(floop, body_start)
        self.free = A
        for j in loop['continues']:
            self.patch(j, floop)
        for j in loop['breaks']:
            self.patch(j, self.pc())
        self.loops.pop()

    def compile_forin(self, st):
        _, names, exprs, body = st
        A = self.temp()
        self.temp()
        self.temp()  # A..A+2
        self.move_values(exprs, [A, A + 1, A + 2])
        if len(exprs) == 1:
            self.E('ITERPREP', A)
        elif len(exprs) == 2:
            self.E('LOADNIL', A + 2)
        tcall = self.E('TFORCALL', A, 0, len(names))
        loop = {'breaks': [], 'continues': [], 'depth': len(self.blocks)}
        self.loops.append(loop)
        # check-before-body: TFORLOOP exits when the iterator yielded nil
        chk = self.E('TFORLOOP', A, 0)
        blk = {'free0': A + 3, 'top': A + 3 + len(names),
               'vars': {nm: A + 3 + i for i, nm in enumerate(names)}, 'hascap': False}
        self.blocks.append(blk)
        self.free = A + 3 + len(names)
        self.compile_stats(body[1], body[2])
        self.pop_block()
        back = self.E('JMP')
        self.patch(back, tcall)
        self.patch(chk, self.pc())
        self.free = A
        for j in loop['continues']:
            self.patch(j, tcall)
        for j in loop['breaks']:
            self.patch(j, self.pc())
        self.loops.pop()

    def compile_funcdecl(self, st):
        _, target, fn = st
        if target[0] == 'local':
            reg = self.alloc_local(target[1])
            child = FuncState(self.comp, self)
            self.comp.compile_function(child, fn)
            self.protos.append(child)
            idx = self.E('CLOSURE', reg, 0)
            self.closures.append((idx, child))
            return
        _, names, ismethod = target
        if len(names) == 1:
            tdesc = self.target_desc(('Var', names[0]))
        else:
            prefix = ('Var', names[0])
            for nm in names[1:-1]:
                prefix = ('Index', prefix, ('Str', nm.encode('utf-8')))
            tab = self.expr(prefix)
            tdesc = ('F', tab, self.kstr(names[-1].encode('utf-8')))
        child = FuncState(self.comp, self)
        params = (['self'] if ismethod else []) + fn[1]
        fnode = ('Func', params, fn[2], fn[3])
        self.comp.compile_function(child, fnode)
        self.protos.append(child)
        r = self.temp()
        idx = self.E('CLOSURE', r, 0)
        self.closures.append((idx, child))
        self.store(tdesc, r)
        self.free = r

    def compile_return(self, st):
        exprs = st[1]
        if not exprs:
            r = self.temp()
            self.E('RETURN', r, 1)
            self.fr(r)
            return
        if exprs[-1][0] in MULTI_KINDS:
            d0 = self.free  # results of the final call must start exactly here
            for i, e in enumerate(exprs[:-1]):
                v = self.expr(e)
                self.E('MOVE', d0 + i, v)
                self.free = d0 + i + 1
            self.compile_multi_at(exprs[-1])
            self.E('RETURN', d0, 0)
            self.free = d0
            return
        dests = [self.temp() for _ in exprs]
        self.move_values(exprs, dests)
        self.E('RETURN', dests[0], len(dests) + 1)
        self.free = dests[0]

    def finish(self):
        ret_op = self.comp.opmap['RETURN']
        if not self.code or self.code[-1][0] != ret_op:
            r = self.free
            self.free += 1
            self.E('RETURN', r, 1)
            self.free = r


class Compiler:
    def __init__(self, opmap: dict):
        self.opmap = opmap
        self.flat = []

    def compile_function(self, fs: FuncState, fnode):
        _, params, isvararg, body = fnode
        fs.nparams = len(params)
        fs.isvararg = bool(isvararg) or fs.parent is None
        fs.push_block()
        blk = fs.blocks[-1]
        for i, p in enumerate(params):
            blk['vars'][p] = i
        blk['top'] = fs.nparams
        fs.free = fs.nparams
        fs.compile_stats(body[1], body[2])
        fs.pop_block()
        fs.finish()
        if fs.pend_goto:
            raise LuaSyntaxError(f'unresolved goto {fs.pend_goto[0][0]}')

    def compile_chunk(self, source: str) -> FuncState:
        from core.luaparse import parse_source
        ast = parse_source(source)
        main = FuncState(self, None)
        self.compile_function(main, ('Func', [], False, ast))
        return main

    def flatten(self, main: FuncState):
        def visit(fs):
            for c in fs.protos:
                visit(c)
            fs.flat_index = len(self.flat) + 1
            self.flat.append(fs)
        visit(main)
        for fs in self.flat:
            for idx, child in fs.closures:
                fs.code[idx][2] = child.flat_index
        return self.flat
