"""Luau lexer + recursive-descent parser for the Flexozy Executor VM pipeline."""
from __future__ import annotations
import re
from dataclasses import dataclass

KEYWORDS = set(
    'and break do else elseif end false for function goto if in local nil not or '
    'repeat return then true until while continue'.split())

OPERATORS = [
    '...', '==', '~=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '^=', '..=',
    '->', '::', '..', '#', '(', ')', '{', '}', '[', ']', ';', ':', ',', '.',
    '+', '-', '*', '/', '%', '^', '=', '<', '>',
]

_NUM_RE = re.compile(
    r'0[xX][0-9a-fA-F]+(?:\.[0-9a-fA-F]*)?(?:[pP][-+]?\d+)?'
    r'|0[bB][01]+'
    r'|(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')

_SIMPLE_ESCAPES = {
    'a': 7, 'b': 8, 'f': 12, 'n': 10, 'r': 13, 't': 9, 'v': 11,
    '\\': 92, '"': 34, "'": 39, '`': 96, '{': 123, '}': 125,
}


@dataclass
class Token:
    kind: str  # name kw num str interp op eof
    value: object
    line: int


class LuaSyntaxError(Exception):
    pass


def decode_escapes(body: str) -> bytes:
    """Decode a Luau short-string body (between the quotes) into raw bytes."""
    out = bytearray()
    i, n = 0, len(body)
    while i < n:
        c = body[i]
        if c != '\\':
            out.extend(c.encode('utf-8'))
            i += 1
            continue
        i += 1
        if i >= n:
            raise LuaSyntaxError('unfinished escape sequence')
        c = body[i]
        if c in _SIMPLE_ESCAPES:
            out.append(_SIMPLE_ESCAPES[c])
            i += 1
        elif c == 'z':
            i += 1
            while i < n and body[i].isspace():
                i += 1
        elif c == 'x' and i + 2 < n:
            out.append(int(body[i + 1:i + 3], 16))
            i += 3
        elif c == 'u' and i + 1 < n and body[i + 1] == '{':
            close = body.find('}', i + 2)
            if close < 0:
                raise LuaSyntaxError('invalid \\u escape')
            out.extend(chr(int(body[i + 2:close], 16)).encode('utf-8'))
            i = close + 1
        elif c.isdigit():
            j = i
            while j < n and j < i + 3 and body[j].isdigit():
                j += 1
            out.append(int(body[i:j]))
            i = j
        elif c == '\n':
            out.append(10)
            i += 1
        elif c == '\r':
            out.append(10)
            i += 1
            if i < n and body[i] == '\n':
                i += 1
        else:
            out.extend(c.encode('utf-8'))
            i += 1
    return bytes(out)


def lex(src: str) -> list[Token]:
    toks: list[Token] = []
    i, n, line = 0, len(src), 1

    def long_open(pos: int):
        if pos >= n or src[pos] != '[':
            return None
        j = pos + 1
        while j < n and src[j] == '=':
            j += 1
        if j < n and src[j] == '[':
            return j + 1, ']' + '=' * (j - pos - 1) + ']'
        return None

    while i < n:
        c = src[i]
        if c.isspace():
            if c == '\n':
                line += 1
            i += 1
            continue
        if src.startswith('--', i):
            lb = long_open(i + 2)
            if lb:
                b, close = lb
                e = src.find(close, b)
                if e < 0:
                    raise LuaSyntaxError(f'line {line}: unterminated long comment')
                line += src.count('\n', i, e + len(close))
                i = e + len(close)
            else:
                e = src.find('\n', i)
                i = n if e < 0 else e
            continue
        if src.startswith('#!', i) and i == 0:
            e = src.find('\n', i)
            i = n if e < 0 else e
            continue
        if c in '"\'':
            q = c
            i += 1
            start = i
            while i < n:
                if src[i] == '\\':
                    i += 2
                    continue
                if src[i] == q:
                    break
                if src[i] == '\n':
                    line += 1
                i += 1
            else:
                raise LuaSyntaxError(f'line {line}: unterminated string')
            body = src[start:i]
            i += 1
            toks.append(Token('str', decode_escapes(body), line))
            continue
        if c == '`':
            i += 1
            start = i
            while i < n:
                if src[i] == '\\':
                    i += 2
                    continue
                if src[i] == '`':
                    break
                if src[i] == '\n':
                    line += 1
                i += 1
            else:
                raise LuaSyntaxError(f'line {line}: unterminated interpolated string')
            inner = src[start:i]
            i += 1
            toks.append(Token('interp', inner, line))
            continue
        lb = long_open(i)
        if lb:
            b, close = lb
            e = src.find(close, b)
            if e < 0:
                raise LuaSyntaxError(f'line {line}: unterminated long string')
            body = src[b:e]
            line += src.count('\n', i, e + len(close))
            i = e + len(close)
            toks.append(Token('str', body.encode('utf-8'), line))
            continue
        m = _NUM_RE.match(src, i)
        if m and (c.isdigit() or (c == '.' and i + 1 < n and src[i + 1].isdigit())):
            text = m.group(0)
            i = m.end()
            if text[:2] in ('0x', '0X'):
                v = float(int(text[2:].split('p', 1)[0].split('P', 1)[0], 16)) if not any(
                    ch in text for ch in 'pP.') else _hex_float(text)
            elif text[:2] in ('0b', '0B'):
                v = float(int(text[2:], 2))
            else:
                v = float(text)
            toks.append(Token('num', v, line))
            continue
        if c.isalpha() or c == '_':
            j = i
            while j < n and (src[j].isalnum() or src[j] == '_'):
                j += 1
            word = src[i:j]
            toks.append(Token('kw' if word in KEYWORDS else 'name', word, line))
            i = j
            continue
        for op in OPERATORS:
            if src.startswith(op, i):
                toks.append(Token('op', op, line))
                i += len(op)
                break
        else:
            raise LuaSyntaxError(f'line {line}: unexpected character {c!r}')
    toks.append(Token('eof', None, line))
    return toks


def _hex_float(text: str) -> float:
    body = text[2:]
    if 'p' in body or 'P' in body:
        mant, _, expp = body.replace('P', 'p').partition('p')
    else:
        mant, expp = body, ''
    if '.' in mant:
        ip, fp = mant.split('.', 1)
    else:
        ip, fp = mant, ''
    v = 0.0
    for ch in (ip + fp):
        v = v * 16 + int(ch, 16)
    if fp:
        v /= 16 ** len(fp)
    if expp:
        v *= 2.0 ** int(expp[1:])
    return v


def split_interp(inner: str):
    """Split backtick-string inner text into ('lit', bytes) and ('expr', src)."""
    parts = []
    buf: list[str] = []
    i, n = 0, len(inner)

    def flush():
        if buf:
            parts.append(('lit', decode_escapes(''.join(buf))))
            buf.clear()

    while i < n:
        c = inner[i]
        if c == '\\' and i + 1 < n:
            buf.append(inner[i:i + 2])
            i += 2
            continue
        if c == '{':
            j = i + 1
            depth = 1
            q = None
            while j < n and depth:
                ch = inner[j]
                if q:
                    if ch == '\\':
                        j += 2
                        continue
                    if ch == q:
                        q = None
                elif ch in '"\'`':
                    q = ch
                elif ch == '[' and j + 1 < n and inner[j + 1] in '[=':
                    k = j + 1
                    while k < n and inner[k] == '=':
                        k += 1
                    if k < n and inner[k] == '[':
                        close = ']' + '=' * (k - j - 1) + ']'
                        e = inner.find(close, k + 1)
                        j = (e + len(close) - 1) if e >= 0 else n
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                j += 1
            if depth:
                raise LuaSyntaxError('unterminated interpolated expression')
            flush()
            parts.append(('expr', inner[i + 1:j - 1]))
            i = j
            continue
        buf.append(c)
        i += 1
    flush()
    if not parts:
        parts.append(('lit', b''))
    return parts


class Parser:
    def __init__(self, src: str):
        self.toks = lex(src)
        self.pos = 0
        self._interp_depth = 0

    # -- token helpers ------------------------------------------------------
    def peek(self, k: int = 0) -> Token:
        return self.toks[min(self.pos + k, len(self.toks) - 1)]

    def kind(self, k: int = 0) -> str:
        return self.peek(k).kind

    def val(self, k: int = 0):
        return self.peek(k).value

    def line(self) -> int:
        return self.peek().line

    def next(self) -> Token:
        t = self.toks[self.pos]
        self.pos += 1
        return t

    def accept(self, kind: str, value=None) -> bool:
        t = self.peek()
        if t.kind == kind and (value is None or t.value == value):
            self.pos += 1
            return True
        return False

    def accept_op(self, *ops) -> bool:
        t = self.peek()
        if t.kind == 'op' and t.value in ops:
            self.pos += 1
            return True
        return False

    def accept_kw(self, *kws) -> bool:
        t = self.peek()
        if t.kind == 'kw' and t.value in kws:
            self.pos += 1
            return True
        return False

    def expect(self, kind: str, value=None) -> Token:
        t = self.peek()
        if t.kind != kind or (value is not None and t.value != value):
            raise LuaSyntaxError(f'line {t.line}: expected {value or kind}, got {t.value!r}')
        return self.next()

    def expect_op(self, op) -> Token:
        t = self.peek()
        if t.kind != 'op' or t.value != op:
            raise LuaSyntaxError(f'line {t.line}: expected {op!r}, got {t.value!r}')
        return self.next()

    def expect_kw(self, kw) -> Token:
        t = self.peek()
        if t.kind != 'kw' or t.value != kw:
            raise LuaSyntaxError(f'line {t.line}: expected {kw!r}, got {t.value!r}')
        return self.next()

    def error(self, msg: str):
        raise LuaSyntaxError(f'line {self.line()}: {msg}')

    # -- type annotations ---------------------------------------------------
    def skip_type(self):
        self.skip_type_atom()
        while self.accept_op('|', '&'):
            self.skip_type_atom()

    def skip_type_list(self):
        if self.accept_op('...'):
            self.skip_type_postfix()
            return
        self.skip_type()
        while self.accept_op(','):
            self.skip_type()

    def skip_type_postfix(self):
        while True:
            if self.accept_op('?'):
                continue
            if self.accept_op('['):
                self.expect_op(']')
                continue
            break

    def skip_type_atom(self):
        t = self.peek()
        if self.accept_op('('):
            if not self.accept_op(')'):
                self.skip_type_list()
                self.expect_op(')')
            if self.accept_op('->'):
                self.skip_type_list()
            self.skip_type_postfix()
            return
        if self.accept_op('{'):
            depth = 1
            while depth:
                tk = self.next()
                if tk.kind == 'eof':
                    raise LuaSyntaxError(f'line {tk.line}: unterminated table type')
                if tk.kind == 'op':
                    if tk.value == '{':
                        depth += 1
                    elif tk.value == '}':
                        depth -= 1
                    elif tk.value == '(':
                        depth += 1
                    elif tk.value == ')':
                        depth -= 1
            self.skip_type_postfix()
            return
        if self.accept_kw('typeof'):
            self.expect_op('(')
            depth = 1
            while depth:
                tk = self.next()
                if tk.kind == 'eof':
                    raise LuaSyntaxError(f'line {tk.line}: unterminated typeof')
                if tk.kind == 'op':
                    if tk.value == '(':
                        depth += 1
                    elif tk.value == ')':
                        depth -= 1
            self.skip_type_postfix()
            return
        if t.kind in ('str', 'num') or (t.kind == 'kw' and t.value in ('nil', 'true', 'false')):
            self.next()
            self.skip_type_postfix()
            return
        if self.accept_op('...'):
            self.skip_type_postfix()
            return
        # named type with optional generics and field paths
        if self.accept_op('<'):
            depth = 1
            while depth:
                tk = self.next()
                if tk.kind == 'eof':
                    raise LuaSyntaxError(f'line {tk.line}: unterminated generics')
                if tk.kind == 'op':
                    if tk.value == '<':
                        depth += 1
                    elif tk.value == '>':
                        depth -= 1
            self.skip_type_postfix()
            return
        if t.kind == 'name' or t.kind == 'kw':
            self.next()
            while self.accept_op('.'):
                self.expect_kind_name()
            if self.accept_op('<'):
                depth = 1
                while depth:
                    tk = self.next()
                    if tk.kind == 'eof':
                        raise LuaSyntaxError(f'line {tk.line}: unterminated generics')
                    if tk.kind == 'op':
                        if tk.value == '<':
                            depth += 1
                        elif tk.value == '>':
                            depth -= 1
            self.skip_type_postfix()
            return
        # be lenient: consume one token
        if t.kind != 'eof':
            self.next()
            self.skip_type_postfix()

    def expect_kind_name(self):
        t = self.peek()
        if t.kind in ('name', 'kw'):
            self.next()
        else:
            raise LuaSyntaxError(f'line {t.line}: expected name in type, got {t.value!r}')

    def skip_type_annotations(self, names: list[str]):
        """After parsing namelist entries, skip `: Type` after each name."""
        # names already consumed one by one by caller; caller checks ':'

    # -- statements ---------------------------------------------------------
    def parse_block(self):
        stats = []
        while True:
            t = self.peek()
            if t.kind == 'eof':
                break
            if t.kind == 'kw':
                if t.value in ('end', 'else', 'elseif', 'until', 'return'):
                    break
            if self.accept_op(';'):
                continue
            st = self.parse_statement()
            if st is not None:
                stats.append(st)
        ret = None
        if self.accept_kw('return'):
            exprs = []
            if not (self.kind() == 'kw' and self.val() in ('end', 'else', 'elseif')) \
                    and not self.accept_op(';') and self.peek().kind != 'eof':
                exprs = self.parse_explist()
            self.accept_op(';')
            ret = ('Return', exprs)
        return stats, ret

    def parse_statement(self):
        t = self.peek()
        if t.kind == 'kw':
            v = t.value
            if v == 'do':
                self.next()
                body, ret = self.parse_block()
                self.expect_kw('end')
                blk = ('Block', body, ret)
                return ('Do', blk)
            if v == 'while':
                self.next()
                cond = self.parse_expr()
                self.expect_kw('do')
                body, ret = self.parse_block()
                self.expect_kw('end')
                return ('While', cond, ('Block', body, ret))
            if v == 'repeat':
                self.next()
                body, ret = self.parse_block()
                self.expect_kw('until')
                cond = self.parse_expr()
                return ('Repeat', ('Block', body, ret), cond)
            if v == 'if':
                self.next()
                return self.parse_if()
            if v == 'for':
                self.next()
                return self.parse_for()
            if v == 'function':
                self.next()
                return self.parse_funcdecl()
            if v == 'local':
                self.next()
                if self.accept_kw('function'):
                    name = self.expect_name()
                    fn = self.parse_funcbody([])
                    self.skip_return_type()
                    return ('FuncDecl', ('local', name), fn)
                names = []
                while True:
                    names.append(self.expect_name())
                    if self.accept_op(':'):
                        self.skip_type()
                    if not self.accept_op(','):
                        break
                exprs = None
                if self.accept_op('='):
                    exprs = self.parse_explist()
                return ('Local', names, exprs)
            if v == 'return':
                # handled in parse_block; a bare return here is an error
                self.error('unexpected return')
            if v == 'break':
                self.next()
                return ('Break',)
            if v == 'continue':
                self.next()
                return ('Continue',)
            if v == 'nil' or v == 'true' or v == 'false':
                pass  # start of expression statement
            if v == 'function':
                pass
        # type declarations
        if t.kind == 'kw' and t.value == 'export' and self.kind(1) == 'name' and self.val(1) == 'type':
            self.next()
            self.next()
            name = self.expect_name()
            if self.accept_op('<'):
                self.skip_generics_decl()
            self.expect_op('=')
            self.skip_type()
            return None
        if t.kind == 'name' and t.value == 'type' and self.kind(1) == 'name' and \
                self.kind(2) == 'op' and self.val(2) == '=':
            self.next()
            name = self.next()
            self.expect_op('=')
            self.skip_type()
            return None
        # expression statements: assignment or call
        return self.parse_expr_statement()

    def skip_generics_decl(self):
        depth = 1
        while depth:
            tk = self.next()
            if tk.kind == 'eof':
                self.error('unterminated generics')
            if tk.kind == 'op':
                if tk.value == '<':
                    depth += 1
                elif tk.value == '>':
                    depth -= 1

    def expect_name(self) -> str:
        t = self.peek()
        if t.kind != 'name':
            raise LuaSyntaxError(f'line {t.line}: expected name, got {t.value!r}')
        self.next()
        return t.value

    def skip_return_type(self):
        if self.accept_op(':'):
            self.skip_type()

    def parse_if(self):
        arms = []
        cond = self.parse_expr()
        self.expect_kw('then')
        body, ret = self.parse_block()
        arms.append((cond, ('Block', body, ret)))
        while self.accept_kw('elseif'):
            c = self.parse_expr()
            self.expect_kw('then')
            b, r = self.parse_block()
            arms.append((c, ('Block', b, r)))
        els = None
        if self.accept_kw('else'):
            b, r = self.parse_block()
            els = ('Block', b, r)
        self.expect_kw('end')
        return ('If', arms, els)

    def parse_for(self):
        name = self.expect_name()
        if self.accept_op('='):
            init = self.parse_expr()
            self.expect_op(',')
            limit = self.parse_expr()
            step = None
            if self.accept_op(','):
                step = self.parse_expr()
            self.expect_kw('do')
            body, ret = self.parse_block()
            self.expect_kw('end')
            return ('ForNum', name, init, limit, step, ('Block', body, ret))
        if self.accept_op(':'):
            self.skip_type()
        names = [name]
        while self.accept_op(','):
            names.append(self.expect_name())
            if self.accept_op(':'):
                self.skip_type()
        self.expect_kw('in')
        exprs = self.parse_explist()
        self.expect_kw('do')
        body, ret = self.parse_block()
        self.expect_kw('end')
        return ('ForIn', names, exprs, ('Block', body, ret))

    def parse_funcdecl(self):
        names = [self.expect_name()]
        ismethod = False
        while self.accept_op('.'):
            names.append(self.expect_name())
        if self.accept_op(':'):
            names.append(self.expect_name())
            ismethod = True
        params, isvararg = self.parse_params()
        self.skip_return_type()
        body, ret = self.parse_block()
        self.expect_kw('end')
        fn = ('Func', params, isvararg, ('Block', body, ret))
        return ('FuncDecl', ('path', names, ismethod), fn)

    def parse_params(self):
        self.expect_op('(')
        params = []
        isvararg = False
        if not self.accept_op(')'):
            while True:
                if self.accept_op('...'):
                    isvararg = True
                    break
                params.append(self.expect_name())
                if self.accept_op(':'):
                    self.skip_type()
                if not self.accept_op(','):
                    break
            self.expect_op(')')
        return params, isvararg

    def parse_funcbody(self, params):
        self.expect_op('(')
        isvararg = False
        if not self.accept_op(')'):
            while True:
                if self.accept_op('...'):
                    isvararg = True
                    break
                params.append(self.expect_name())
                if self.accept_op(':'):
                    self.skip_type()
                if not self.accept_op(','):
                    break
            self.expect_op(')')
        self.skip_return_type()
        body, ret = self.parse_block()
        self.expect_kw('end')
        return ('Func', params, isvararg, ('Block', body, ret))

    def parse_expr_statement(self):
        t = self.peek()
        if t.kind == 'kw' and t.value == 'goto':
            self.next()
            name = self.expect_name()
            return ('Goto', name)
        if t.kind == 'op' and t.value == '::':
            self.next()
            name = self.expect_name()
            self.expect_op('::')
            return ('Label', name)
        # parse a suffixed expression
        e = self.parse_suffixed()
        k = e[0]
        if k == 'Call' or k == 'Method':
            return e
        if k == 'Var' or k == 'Index':
            # assignment or compound assignment
            targets = [e]
            op = None
            if self.accept_op('='):
                pass
            elif self.peek().kind == 'op' and self.val() in ('+=', '-=', '*=', '/=', '%=', '^=', '..='):
                op = self.next().value
            else:
                while self.accept_op(','):
                    targets.append(self.parse_suffixed())
                self.expect_op('=')
            if op:
                rhs = self.parse_expr()
                return ('Compound', e, op, rhs)
            exprs = self.parse_explist()
            for tv in targets:
                if tv[0] not in ('Var', 'Index'):
                    self.error('cannot assign to this expression')
            return ('Assign', targets, exprs)
        self.error('unexpected expression statement')

    # -- expressions --------------------------------------------------------
    def parse_explist(self):
        exprs = [self.parse_expr()]
        while self.accept_op(','):
            exprs.append(self.parse_expr())
        return exprs

    def parse_expr(self):
        return self.parse_subexpr(0)

    PRIORITIES = {
        'or': (1, 1), 'and': (2, 2),
        '<': (3, 3), '>': (3, 3), '<=': (3, 3), '>=': (3, 3),
        '~=': (3, 3), '==': (3, 3),
        '..': (5, 4),
        '+': (6, 6), '-': (6, 6),
        '*': (7, 7), '/': (7, 7), '%': (7, 7),
        '^': (12, 11),  # right assoc, binds tighter than unary
    }
    UNARY_PRIO = 8

    def parse_subexpr(self, limit: int):
        t = self.peek()
        uop = None
        if (t.kind == 'op' and t.value in ('-', '#')) or (t.kind == 'kw' and t.value == 'not'):
            self.next()
            uop = t.value
            e = self.parse_subexpr(self.UNARY_PRIO)
            e = ('Un', uop, e)
        elif t.kind == 'kw' and t.value == 'if':
            e = self.parse_if_expr()
        else:
            e = self.parse_simple()
        while True:
            t = self.peek()
            if (t.kind == 'op' and t.value in self.PRIORITIES) or \
                    (t.kind == 'kw' and t.value in ('and', 'or')):
                lp, rp = self.PRIORITIES.get(t.value, (2, 2))
                if lp <= limit:
                    break
                self.next()
                rhs = self.parse_subexpr(rp)
                v = t.value
                if v == 'and':
                    e = ('And', e, rhs)
                elif v == 'or':
                    e = ('Or', e, rhs)
                elif v in ('==', '~=', '<', '<=', '>', '>='):
                    e = ('Cmp', v, e, rhs)
                elif v == '..':
                    e = ('Concat', e, rhs)
                else:
                    e = ('Bin', v, e, rhs)
            else:
                break
        # cast operator
        if self.accept_op('::'):
            self.skip_type()
        return e

    def parse_if_expr(self):
        self.expect_kw('if')
        arms = []
        cond = self.parse_expr()
        self.expect_kw('then')
        then = self.parse_expr()
        arms.append((cond, then))
        while self.accept_kw('elseif'):
            c = self.parse_expr()
            self.expect_kw('then')
            b = self.parse_expr()
            arms.append((c, b))
        self.expect_kw('else')
        els = self.parse_expr()
        return ('IfExpr', arms, els)

    def parse_simple(self):
        t = self.peek()
        if t.kind == 'num':
            self.next()
            return ('Num', t.value)
        if t.kind == 'str':
            self.next()
            return ('Str', t.value)
        if t.kind == 'interp':
            self.next()
            return self.interp_expr(t.value)
        if t.kind == 'kw':
            if t.value == 'nil':
                self.next()
                return ('Nil',)
            if t.value == 'true':
                self.next()
                return ('True',)
            if t.value == 'false':
                self.next()
                return ('False',)
            if t.value == 'function':
                self.next()
                return self.parse_suffixes(self.parse_funcbody([]))
            raise LuaSyntaxError(f'line {t.line}: unexpected keyword {t.value}')
        if t.kind == 'op' and t.value == '...':
            self.next()
            return ('Vararg',)
        if t.kind == 'op' and t.value == '{':
            return self.parse_table()
        if t.kind == 'op' and t.value == '(':
            self.next()
            e = self.parse_expr()
            self.expect_op(')')
            return self.parse_suffixes(('Paren', e))
        if t.kind == 'name':
            self.next()
            return self.parse_suffixes(('Var', t.value))
        raise LuaSyntaxError(f'line {t.line}: unexpected symbol {t.value!r}')

    def interp_expr(self, inner: str):
        parts = split_interp(inner)
        if len(parts) == 1 and parts[0][0] == 'lit':
            return ('Str', parts[0][1])
        # build concat chain with tostring() around expressions
        items = []
        for kind, payload in parts:
            if kind == 'lit':
                items.append(('Str', payload))
            else:
                sub = Parser(payload)
                sub._interp_depth = self._interp_depth + 1
                items.append(('Call', ('Var', 'tostring'), [sub.parse_expr()]))
        node = items[0]
        for it in items[1:]:
            node = ('Concat', node, it)
        return node

    def parse_suffixed(self):
        t = self.peek()
        if t.kind == 'name':
            self.next()
            e = ('Var', t.value)
        elif t.kind == 'op' and t.value == '(':
            self.next()
            e = self.parse_expr()
            self.expect_op(')')
            e = ('Paren', e)
        else:
            raise LuaSyntaxError(f'line {t.line}: unexpected symbol {t.value!r}')
        return self.parse_suffixes(e)

    def parse_suffixes(self, e):
        while True:
            t = self.peek()
            if t.kind == 'op' and t.value == '.':
                self.next()
                name = self.expect_name()
                e = ('Index', e, ('Str', name.encode('utf-8')))
            elif t.kind == 'op' and t.value == '[':
                self.next()
                k = self.parse_expr()
                self.expect_op(']')
                e = ('Index', e, k)
            elif t.kind == 'op' and t.value == ':':
                self.next()
                name = self.expect_name()
                args = self.parse_callargs()
                e = ('Method', e, name, args)
            elif t.kind in ('str', 'interp') or \
                    (t.kind == 'op' and t.value == '{') or \
                    (t.kind == 'op' and t.value == '('):
                args = self.parse_callargs()
                e = ('Call', e, args)
            else:
                break
        return e

    def parse_callargs(self):
        t = self.peek()
        if t.kind == 'str':
            self.next()
            return [('Str', t.value)]
        if t.kind == 'interp':
            self.next()
            return [self.interp_expr(t.value)]
        if t.kind == 'op' and t.value == '{':
            return [self.parse_table()]
        self.expect_op('(')
        if self.accept_op(')'):
            return []
        exprs = self.parse_explist()
        self.expect_op(')')
        return exprs

    def parse_table(self):
        self.expect_op('{')
        fields = []
        while not self.accept_op('}'):
            t = self.peek()
            if t.kind == 'op' and t.value == '[':
                self.next()
                k = self.parse_expr()
                self.expect_op(']')
                self.expect_op('=')
                v = self.parse_expr()
                fields.append(('k', k, v))
            elif (t.kind == 'name') and self.kind(1) == 'op' and self.val(1) == '=':
                self.next()
                self.next()
                v = self.parse_expr()
                fields.append(('k', ('Str', t.value.encode('utf-8')), v))
            else:
                v = self.parse_expr()
                fields.append(('v', v))
            if not self.accept_op(','):
                self.accept_op(';')
                if not (self.kind() == 'op' and self.val() == '}'):
                    self.error("expected ',' or '}' in table constructor")
        return ('Table', fields)


def parse_source(src: str):
    p = Parser(src)
    stats, ret = p.parse_block()
    if p.peek().kind != 'eof':
        t = p.peek()
        raise LuaSyntaxError(f'line {t.line}: unexpected {t.value!r} after block')
    return ('Block', stats, ret)
