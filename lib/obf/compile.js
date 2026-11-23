'use strict';
// Faithful JS port of core/compile.py — compiles a Luau AST (from luaparse.js) into
// Flexozy VM bytecode (register-based, Lua-5.1-style ISA).
const { LuaSyntaxError, parseSource, utf8Bytes } = require('./luaparse.js');

const OPNAMES = [
  'MOVE', 'LOADK', 'LOADNIL', 'LOADBOOL', 'GETGLOBAL', 'SETGLOBAL',
  'GETFIELD', 'SETFIELD', 'GETTABLE', 'SETTABLE', 'NEWTABLE', 'SETLIST',
  'CALL', 'SELF', 'CONCAT', 'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'POW',
  'UNM', 'NOT', 'LEN', 'EQ', 'LT', 'LE', 'JMP', 'TEST', 'FORPREP',
  'FORLOOP', 'TFORCALL', 'TFORLOOP', 'CLOSURE', 'SETUPVAL', 'GETUPVAL',
  'VARARG', 'RETURN', 'CLOSE', 'ITERPREP', 'NILTO',
];

const MULTI_KINDS = new Set(['Call', 'Method', 'Vararg']);

const ARITH_OPS = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD', '^': 'POW' };
const COMPOUND_OPS = { '+=': 'ADD', '-=': 'SUB', '*=': 'MUL', '/=': 'DIV', '%=': 'MOD', '^=': 'POW', '..=': 'CONCAT' };

class FuncState {
  constructor(comp, parent) {
    this.comp = comp;
    this.parent = parent;
    this.code = [];
    this.consts = [];
    this.kmap = new Map();
    this.protos = [];
    this.closures = []; // [instrIndex, childFs]
    this.upvals = [];   // [name, instack, idx]
    this.blocks = [];
    this.loops = [];
    this.free = 0;
    this.nparams = 0;
    this.isvararg = false;
    this.labels = {};
    this.pend_goto = [];
    this.flat_index = null;
  }

  E(opname, a = 0, b = 0, c = 0) {
    this.code.push([this.comp.opmap[opname], a, b, c]);
    return this.code.length - 1;
  }
  patch(idx, target) { this.code[idx][2] = target - idx - 1; }
  pc() { return this.code.length; }
  temp() { const r = this.free; this.free += 1; return r; }
  fr(r) { this.free = r; }

  kstr(data) {
    const key = 's:' + data;
    if (this.kmap.has(key)) return this.kmap.get(key);
    const id = this.consts.length + 1;
    this.kmap.set(key, id);
    this.consts.push(['s', data]);
    return id;
  }
  knum(v) {
    v = Number(v);
    const key = 'n:' + v;
    if (this.kmap.has(key)) return this.kmap.get(key);
    const id = this.consts.length + 1;
    this.kmap.set(key, id);
    this.consts.push(['n', v]);
    return id;
  }

  pushBlock() { this.blocks.push({ free0: this.free, top: this.free, vars: {}, hascap: false }); }
  popBlock() {
    const b = this.blocks.pop();
    if (b.hascap) this.E('CLOSE', b.free0);
    this.free = b.free0;
  }
  allocLocal(name) {
    const r = this.free;
    this.free += 1;
    const b = this.blocks[this.blocks.length - 1];
    b.vars[name] = r;
    b.top = this.free;
    return r;
  }
  startStatement() { if (this.blocks.length) this.free = this.blocks[this.blocks.length - 1].top; }

  findLocal(name) {
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (Object.prototype.hasOwnProperty.call(b.vars, name)) return [b, b.vars[name]];
    }
    return [null, null];
  }

  resolve(name) {
    const [b, reg] = this.findLocal(name);
    if (b !== null) return ['L', reg];
    const idx = this.resolveUpval(this, name);
    if (idx !== null) return ['U', idx];
    return ['G', this.kstr(utf8Bytes(name))];
  }

  resolveUpval(fs, name) {
    for (let i = 0; i < fs.upvals.length; i++) {
      const [n] = fs.upvals[i];
      if (n === name) return i + 1;
    }
    if (fs.parent === null) return null;
    const [b, reg] = fs.parent.findLocal(name);
    if (b !== null) { b.hascap = true; return this.addUpval(fs, name, true, reg); }
    const idx = this.resolveUpval(fs.parent, name);
    if (idx === null) return null;
    return this.addUpval(fs, name, false, idx);
  }

  addUpval(fs, name, instack, idx) {
    for (let i = 0; i < fs.upvals.length; i++) {
      const [n, s, i2] = fs.upvals[i];
      if (n === name && s === instack && i2 === idx) return i + 1;
    }
    fs.upvals.push([name, instack, idx]);
    return fs.upvals.length;
  }

  // -- expressions --
  expr(e) {
    const k = e[0];
    if (k === 'Num') { const r = this.temp(); this.E('LOADK', r, this.knum(e[1])); return r; }
    if (k === 'Str') { const r = this.temp(); this.E('LOADK', r, this.kstr(e[1])); return r; }
    if (k === 'True') { const r = this.temp(); this.E('LOADBOOL', r, 1); return r; }
    if (k === 'False') { const r = this.temp(); this.E('LOADBOOL', r, 0); return r; }
    if (k === 'Nil') { const r = this.temp(); this.E('LOADNIL', r); return r; }
    if (k === 'Var') return this.readVar(e[1]);
    if (k === 'Paren') return this.expr(e[1]);
    if (k === 'Index') {
      const tr = this.expr(e[1]);
      const key = e[2];
      if (key[0] === 'Str') {
        this.E('GETFIELD', tr, tr, this.kstr(key[1]));
      } else {
        const kr = this.expr(key);
        this.E('GETTABLE', tr, tr, kr);
        this.fr(kr);
      }
      return tr;
    }
    if (k === 'Call' || k === 'Method') return this.compileCall(e, 1);
    if (k === 'Func') return this.compileFuncExpr(e);
    if (k === 'Vararg') { this.requireVararg(); const r = this.temp(); this.E('VARARG', r, 2); return r; }
    if (k === 'Bin') return this.compileBin(e);
    if (k === 'Cmp') return this.compileCmp(e);
    if (k === 'Concat') return this.compileConcat(e);
    if (k === 'Un') return this.compileUn(e);
    if (k === 'And') return this.compileAnd(e);
    if (k === 'Or') return this.compileOr(e);
    if (k === 'IfExpr') return this.compileIfexpr(e);
    if (k === 'Table') return this.compileTable(e);
    throw new LuaSyntaxError(`cannot compile expression kind ${k}`);
  }

  requireVararg() { if (!this.isvararg) throw new LuaSyntaxError('cannot use "..." outside a vararg function'); }

  readVar(name) {
    const res = this.resolve(name);
    const r = this.temp();
    if (res[0] === 'L') this.E('MOVE', r, res[1]);
    else if (res[0] === 'U') this.E('GETUPVAL', r, res[1]);
    else this.E('GETGLOBAL', r, res[1]);
    return r;
  }

  compileTable(e) {
    const r = this.temp();
    this.E('NEWTABLE', r);
    const fields = e[1];
    let run = [];
    const baseFree = r + 1;
    const flush = (multi = false) => {
      if (run.length) this.E('SETLIST', r, multi ? 0 : run.length);
      this.free = baseFree;
      run = [];
    };
    for (let idx = 0; idx < fields.length; idx++) {
      const f = fields[idx];
      if (f[0] === 'v') {
        const isLast = idx === fields.length - 1;
        if (isLast && MULTI_KINDS.has(f[1][0])) {
          const s = this.compileMultiAt(f[1]);
          run.push(s);
          flush(true);
        } else {
          const ar = this.temp();
          const v = this.expr(f[1]);
          this.E('MOVE', ar, v);
          this.free = ar + 1;
          run.push(ar);
        }
      } else {
        flush();
        const key = f[1];
        if (key[0] === 'Str') {
          const vr = this.expr(f[2]);
          this.E('SETFIELD', vr, r, this.kstr(key[1]));
          this.fr(vr);
        } else {
          const kr = this.expr(key);
          const vr = this.expr(f[2]);
          this.E('SETTABLE', vr, r, kr);
          this.fr(vr);
          this.fr(kr);
        }
      }
    }
    flush();
    return r;
  }

  compileBin(e) {
    const op = e[1];
    if (Object.prototype.hasOwnProperty.call(ARITH_OPS, op) && e[2][0] === 'Num' && e[3][0] === 'Num') {
      const a = e[2][1], b = e[3][1];
      let v = null;
      if (op === '+') v = a + b;
      else if (op === '-') v = a - b;
      else if (op === '*') v = a * b;
      else if (op === '/') v = a / b;
      else if (op === '^') v = Math.pow(a, b);
      if (v !== null && Number.isFinite(v)) {
        const r = this.temp();
        this.E('LOADK', r, this.knum(v));
        return r;
      }
    }
    if (op === '..' && e[2][0] === 'Str' && e[3][0] === 'Str') {
      const r = this.temp();
      this.E('LOADK', r, this.kstr(e[2][1] + e[3][1]));
      return r;
    }
    const l = this.expr(e[2]);
    const r2 = this.expr(e[3]);
    this.E(ARITH_OPS[op], l, l, r2);
    this.fr(r2);
    return l;
  }

  compileConcat(e) {
    const l = this.expr(e[1]);
    const r2 = this.expr(e[2]);
    this.E('CONCAT', l, l, r2);
    this.fr(r2);
    return l;
  }

  compileUn(e) {
    const op = e[1];
    if (op === 'not' && e[2][0] === 'True') { const r = this.temp(); this.E('LOADBOOL', r, 0); return r; }
    if (op === 'not' && e[2][0] === 'False') { const r = this.temp(); this.E('LOADBOOL', r, 1); return r; }
    if (op === '-' && e[2][0] === 'Num') { const r = this.temp(); this.E('LOADK', r, this.knum(-e[2][1])); return r; }
    const src = this.expr(e[2]);
    this.E({ '-': 'UNM', not: 'NOT', '#': 'LEN' }[op], src, src);
    return src;
  }

  compileCmp(e) {
    const [, op, l, r] = e;
    const lb = this.expr(l);
    const rb = this.expr(r);
    const dst = this.temp();
    if (op === '==') this.E('EQ', 1, lb, rb);
    else if (op === '~=') this.E('EQ', 1, lb, rb);
    else if (op === '<') this.E('LT', 1, lb, rb);
    else if (op === '>') this.E('LT', 1, rb, lb);
    else if (op === '<=') this.E('LE', 1, lb, rb);
    else this.E('LE', 1, rb, lb);
    const j = this.E('JMP');
    if (op === '~=') { this.E('LOADBOOL', dst, 0, 1); this.E('LOADBOOL', dst, 1, 0); }
    else { this.E('LOADBOOL', dst, 1, 1); this.E('LOADBOOL', dst, 0, 0); }
    this.patch(j, this.pc() - 1);
    this.fr(lb);
    this.fr(rb);
    return dst;
  }

  compileAnd(e) {
    const dst = this.temp();
    const a = this.expr(e[1]);
    this.E('TEST', a, 1);
    const jf = this.E('JMP');
    this.fr(a);
    const b = this.expr(e[2]);
    this.E('MOVE', dst, b);
    this.fr(b);
    const je = this.E('JMP');
    const lfalse = this.E('MOVE', dst, a);
    this.patch(jf, lfalse);
    this.patch(je, lfalse + 1);
    return dst;
  }

  compileOr(e) {
    const dst = this.temp();
    const a = this.expr(e[1]);
    this.E('TEST', a, 1);
    const jb = this.E('JMP');
    this.E('MOVE', dst, a);
    const je = this.E('JMP');
    this.fr(a);
    const bstart = this.pc();
    const b = this.expr(e[2]);
    this.E('MOVE', dst, b);
    this.fr(b);
    this.patch(je, this.pc());
    this.patch(jb, bstart);
    return dst;
  }

  compileIfexpr(e) {
    const dst = this.temp();
    const endJumps = [];
    const [, arms, els] = e;
    for (const [cond, then] of arms) {
      const c = this.expr(cond);
      this.E('TEST', c, 1);
      const jn = this.E('JMP');
      this.fr(c);
      const t = this.expr(then);
      this.E('MOVE', dst, t);
      this.fr(t);
      endJumps.push(this.E('JMP'));
      this.patch(jn, this.pc());
    }
    const t = this.expr(els);
    this.E('MOVE', dst, t);
    this.fr(t);
    const target = this.pc();
    for (const j of endJumps) this.patch(j, target);
    return dst;
  }

  compileFuncExpr(e) {
    const child = new FuncState(this.comp, this);
    this.comp.compileFunction(child, e);
    this.protos.push(child);
    const r = this.temp();
    const idx = this.E('CLOSURE', r, 0);
    this.closures.push([idx, child]);
    return r;
  }

  compileMultiAt(e) {
    if (e[0] === 'Vararg') { this.requireVararg(); const s = this.temp(); this.E('VARARG', s, 0); return s; }
    return this.compileCall(e, 0);
  }

  compileCall(e, nres) {
    let base, args, extra;
    if (e[0] === 'Method') {
      const oreg = this.expr(e[1]);
      base = oreg;
      this.E('SELF', base, oreg, this.kstr(utf8Bytes(e[2])));
      this.free = base + 2;
      args = e[3];
      extra = 1;
    } else {
      const freg = this.expr(e[1]);
      base = freg;
      args = e[2];
      extra = 0;
    }
    const n = args.length;
    const multiTail = n > 0 && MULTI_KINDS.has(args[n - 1][0]);
    let B;
    if (multiTail) {
      for (let k = 0; k < n - 1; k++) {
        const ar = this.temp();
        const v = this.expr(args[k]);
        this.E('MOVE', ar, v);
        this.free = ar + 1;
      }
      this.compileMultiAt(args[n - 1]);
      B = 0;
    } else {
      for (let k = 0; k < n; k++) {
        const ar = this.temp();
        const v = this.expr(args[k]);
        this.E('MOVE', ar, v);
        this.free = ar + 1;
      }
      B = n + extra + 1;
    }
    this.E('CALL', base, B, nres);
    this.free = base + 1;
    return base;
  }

  // -- value movement --
  store(tdesc, src) {
    const kind = tdesc[0];
    if (kind === 'L') this.E('MOVE', tdesc[1], src);
    else if (kind === 'U') this.E('SETUPVAL', src, tdesc[1]);
    else if (kind === 'G') this.E('SETGLOBAL', src, tdesc[1]);
    else if (kind === 'F') this.E('SETFIELD', src, tdesc[1], tdesc[2]);
    else this.E('SETTABLE', src, tdesc[1], tdesc[2]);
  }

  storeNil(tdesc) {
    if (tdesc[0] === 'L') { this.E('LOADNIL', tdesc[1]); return; }
    if (tdesc[0] === 'U') { const r = this.temp(); this.E('LOADNIL', r); this.E('SETUPVAL', r, tdesc[1]); this.fr(r); return; }
    if (tdesc[0] === 'G') { const r = this.temp(); this.E('LOADNIL', r); this.E('SETGLOBAL', r, tdesc[1]); this.fr(r); return; }
    const r = this.temp();
    this.E('LOADNIL', r);
    if (tdesc[0] === 'F') this.E('SETFIELD', r, tdesc[1], tdesc[2]);
    else this.E('SETTABLE', r, tdesc[1], tdesc[2]);
    this.fr(r);
  }

  multiFixed(e, want) {
    let s;
    if (e[0] === 'Vararg') { this.requireVararg(); s = this.temp(); this.E('VARARG', s, 0); }
    else s = this.compileCall(e, 0);
    this.E('NILTO', s, want);
    return s;
  }

  moveValues(exprs, dests) {
    const n = exprs.length, d = dests.length;
    if (n === 0) { if (d) this.E('LOADNIL', dests[0], d - 1); return; }
    if (n > d) {
      const vals = exprs.slice(0, d).map((e) => this.expr(e));
      for (const e of exprs.slice(d)) { const v = this.expr(e); this.fr(v); }
      for (let i = 0; i < d; i++) this.E('MOVE', dests[i], vals[i]);
      return;
    }
    if (n < d && MULTI_KINDS.has(exprs[exprs.length - 1][0])) {
      const vals = exprs.slice(0, -1).map((e) => this.expr(e));
      const want = d - n + 1;
      const s = this.multiFixed(exprs[exprs.length - 1], want);
      for (let i = 0; i < n - 1; i++) this.E('MOVE', dests[i], vals[i]);
      for (let k = 0; k < want; k++) this.E('MOVE', dests[n - 1 + k], s + k);
      return;
    }
    const vals = exprs.map((e) => this.expr(e));
    for (let i = 0; i < n; i++) this.E('MOVE', dests[i], vals[i]);
    if (n < d) this.E('LOADNIL', dests[n], d - n - 1);
  }

  assignValues(tdescs, exprs) {
    const n = exprs.length, d = tdescs.length;
    if (n === 0) { for (const t of tdescs) this.storeNil(t); return; }
    if (n > d) {
      const vals = exprs.slice(0, d).map((e) => this.expr(e));
      for (const e of exprs.slice(d)) { const v = this.expr(e); this.fr(v); }
      for (let i = 0; i < d; i++) this.store(tdescs[i], vals[i]);
      return;
    }
    if (n < d && MULTI_KINDS.has(exprs[exprs.length - 1][0])) {
      const vals = exprs.slice(0, -1).map((e) => this.expr(e));
      const want = d - n + 1;
      const s = this.multiFixed(exprs[exprs.length - 1], want);
      for (let i = 0; i < n - 1; i++) this.store(tdescs[i], vals[i]);
      for (let k = 0; k < want; k++) this.store(tdescs[n - 1 + k], s + k);
      return;
    }
    const vals = exprs.map((e) => this.expr(e));
    for (let i = 0; i < n; i++) this.store(tdescs[i], vals[i]);
    for (let j = n; j < d; j++) this.storeNil(tdescs[j]);
  }

  // -- target descriptors --
  targetDesc(v) {
    if (v[0] === 'Var') {
      const res = this.resolve(v[1]);
      if (res[0] === 'L') return ['L', res[1]];
      if (res[0] === 'U') return ['U', res[1]];
      return ['G', res[1]];
    }
    const tab = this.expr(v[1]);
    const key = v[2];
    if (key[0] === 'Str') return ['F', tab, this.kstr(key[1])];
    const kr = this.expr(key);
    return ['T', tab, kr];
  }

  compound(v, opname, rhs) {
    const tdesc = this.targetDesc(v);
    const op = COMPOUND_OPS[opname];
    const kind = tdesc[0];
    if (kind === 'L') {
      const reg = tdesc[1];
      const er = this.expr(rhs);
      this.E(op, reg, reg, er);
      this.fr(er);
    } else if (kind === 'G' || kind === 'U') {
      const r = this.temp();
      if (kind === 'G') this.E('GETGLOBAL', r, tdesc[1]); else this.E('GETUPVAL', r, tdesc[1]);
      const er = this.expr(rhs);
      this.E(op, r, r, er);
      this.fr(er);
      if (kind === 'G') this.E('SETGLOBAL', r, tdesc[1]); else this.E('SETUPVAL', r, tdesc[1]);
      this.fr(r);
    } else {
      const tab = tdesc[1], key = tdesc[2];
      const keep = this.free;
      const r = this.temp();
      if (kind === 'F') this.E('GETFIELD', r, tab, key); else this.E('GETTABLE', r, tab, key);
      const er = this.expr(rhs);
      this.E(op, r, r, er);
      this.fr(er);
      if (kind === 'F') this.E('SETFIELD', r, tab, key); else this.E('SETTABLE', r, tab, key);
      this.free = keep;
    }
  }

  // -- statements --
  compileStats(stats, ret) {
    for (const st of stats) { this.startStatement(); this.compileStat(st); }
    if (ret !== null && ret !== undefined) { this.startStatement(); this.compileStat(ret); }
  }

  compileStat(st) {
    const k = st[0];
    if (k === 'Local') {
      const [, names, exprs] = st;
      const dests = names.map((nm) => this.allocLocal(nm));
      if (exprs) this.moveValues(exprs, dests);
      else if (dests.length) this.E('LOADNIL', dests[0], dests.length - 1);
    } else if (k === 'Assign') {
      const [, targets, exprs] = st;
      const tdescs = [];
      const keep = this.free;
      for (const t of targets) tdescs.push(this.targetDesc(t));
      this.assignValues(tdescs, exprs);
      this.free = keep;
    } else if (k === 'Compound') {
      const [, v, opname, rhs] = st;
      this.compound(v, opname, rhs);
    } else if (k === 'Call' || k === 'Method') {
      this.compileCall(st, 2);
    } else if (k === 'Do') {
      this.pushBlock();
      this.compileStats(st[1][1], st[1][2]);
      this.popBlock();
    } else if (k === 'While') {
      this.compileWhile(st);
    } else if (k === 'Repeat') {
      this.compileRepeat(st);
    } else if (k === 'If') {
      this.compileIf(st);
    } else if (k === 'ForNum') {
      this.compileFornum(st);
    } else if (k === 'ForIn') {
      this.compileForin(st);
    } else if (k === 'FuncDecl') {
      this.compileFuncdecl(st);
    } else if (k === 'Return') {
      this.compileReturn(st);
    } else if (k === 'Break') {
      if (!this.loops.length) throw new LuaSyntaxError('break outside a loop');
      this.emitExitCloses(this.loops[this.loops.length - 1]);
      const j = this.E('JMP');
      this.loops[this.loops.length - 1].breaks.push(j);
    } else if (k === 'Continue') {
      if (!this.loops.length) throw new LuaSyntaxError('continue outside a loop');
      this.emitExitCloses(this.loops[this.loops.length - 1]);
      const j = this.E('JMP');
      this.loops[this.loops.length - 1].continues.push(j);
    } else if (k === 'Goto') {
      const name = st[1];
      if (Object.prototype.hasOwnProperty.call(this.labels, name)) {
        const j = this.E('JMP');
        this.patch(j, this.labels[name]);
      } else {
        const j = this.E('JMP');
        this.pend_goto.push([name, j]);
      }
    } else if (k === 'Label') {
      const name = st[1];
      if (Object.prototype.hasOwnProperty.call(this.labels, name)) throw new LuaSyntaxError(`duplicate label ${name}`);
      this.labels[name] = this.pc();
      for (const [, j] of this.pend_goto.filter((p) => p[0] === name)) this.patch(j, this.labels[name]);
      this.pend_goto = this.pend_goto.filter((p) => p[0] !== name);
    } else {
      throw new LuaSyntaxError(`unsupported statement ${k}`);
    }
  }

  emitExitCloses(loop) {
    const depth = loop.depth;
    for (let i = this.blocks.length - 1; i >= depth; i--) {
      if (this.blocks[i].hascap) this.E('CLOSE', this.blocks[i].free0);
    }
  }

  compileWhile(st) {
    const [, cond, body] = st;
    const loop = { breaks: [], continues: [], depth: this.blocks.length };
    this.loops.push(loop);
    const start = this.pc();
    const r = this.expr(cond);
    this.E('TEST', r, 1);
    const jend = this.E('JMP');
    this.fr(r);
    this.pushBlock();
    this.compileStats(body[1], body[2]);
    const blk = this.blocks[this.blocks.length - 1];
    const hadcap = blk.hascap;
    this.popBlock();
    const back = this.E('JMP');
    this.patch(back, start);
    if (hadcap) this.E('CLOSE', blk.free0);
    const lend = this.pc();
    for (const j of loop.continues) this.patch(j, back);
    for (const j of loop.breaks) this.patch(j, lend);
    this.patch(jend, lend);
    this.loops.pop();
  }

  compileRepeat(st) {
    const [, body, cond] = st;
    const loop = { breaks: [], continues: [], depth: this.blocks.length };
    this.loops.push(loop);
    this.pushBlock();
    const start = this.pc();
    this.compileStats(body[1], body[2]);
    const condAt = this.pc();
    const r = this.expr(cond);
    this.E('TEST', r, 1);
    const blk = this.blocks[this.blocks.length - 1];
    if (blk.hascap) this.E('CLOSE', blk.free0);
    const back = this.E('JMP');
    this.patch(back, start);
    this.popBlock();
    const lend = this.pc();
    for (const j of loop.continues) this.patch(j, condAt);
    for (const j of loop.breaks) this.patch(j, lend);
    this.loops.pop();
  }

  compileIf(st) {
    const [, arms, els] = st;
    const endJumps = [];
    for (let i = 0; i < arms.length; i++) {
      const [cond, body] = arms[i];
      const r = this.expr(cond);
      this.E('TEST', r, 1);
      const jn = this.E('JMP');
      this.fr(r);
      this.pushBlock();
      this.compileStats(body[1], body[2]);
      this.popBlock();
      if (i < arms.length - 1 || els !== null) endJumps.push(this.E('JMP'));
      this.patch(jn, this.pc());
    }
    if (els !== null) {
      this.pushBlock();
      this.compileStats(els[1], els[2]);
      this.popBlock();
    }
    const target = this.pc();
    for (const j of endJumps) this.patch(j, target);
  }

  compileFornum(st) {
    const [, varName, init, limit, step, body] = st;
    const A = this.temp(); this.temp(); this.temp(); this.temp();
    let v = this.expr(init);
    this.E('MOVE', A, v);
    this.fr(v);
    v = this.expr(limit);
    this.E('MOVE', A + 1, v);
    this.fr(v);
    if (step !== null) {
      v = this.expr(step);
      this.E('MOVE', A + 2, v);
      this.fr(v);
    } else {
      this.E('LOADK', A + 2, this.knum(1.0));
    }
    this.E('FORPREP', A, 0);
    const loop = { breaks: [], continues: [], depth: this.blocks.length };
    this.loops.push(loop);
    const bodyStart = this.pc();
    const blk = { free0: A + 3, top: A + 4, vars: { [varName]: A + 3 }, hascap: false };
    this.blocks.push(blk);
    this.free = A + 4;
    this.compileStats(body[1], body[2]);
    this.popBlock();
    const floop = this.E('FORLOOP', A, 0);
    this.patch(floop, bodyStart);
    this.free = A;
    for (const j of loop.continues) this.patch(j, floop);
    for (const j of loop.breaks) this.patch(j, this.pc());
    this.loops.pop();
  }

  compileForin(st) {
    const [, names, exprs, body] = st;
    const A = this.temp(); this.temp(); this.temp();
    this.moveValues(exprs, [A, A + 1, A + 2]);
    if (exprs.length === 1) this.E('ITERPREP', A);
    else if (exprs.length === 2) this.E('LOADNIL', A + 2);
    const tcall = this.E('TFORCALL', A, 0, names.length);
    const loop = { breaks: [], continues: [], depth: this.blocks.length };
    this.loops.push(loop);
    const chk = this.E('TFORLOOP', A, 0);
    const vars = {};
    names.forEach((nm, i) => { vars[nm] = A + 3 + i; });
    const blk = { free0: A + 3, top: A + 3 + names.length, vars, hascap: false };
    this.blocks.push(blk);
    this.free = A + 3 + names.length;
    this.compileStats(body[1], body[2]);
    this.popBlock();
    const back = this.E('JMP');
    this.patch(back, tcall);
    this.patch(chk, this.pc());
    this.free = A;
    for (const j of loop.continues) this.patch(j, tcall);
    for (const j of loop.breaks) this.patch(j, this.pc());
    this.loops.pop();
  }

  compileFuncdecl(st) {
    const [, target, fn] = st;
    if (target[0] === 'local') {
      const reg = this.allocLocal(target[1]);
      const child = new FuncState(this.comp, this);
      this.comp.compileFunction(child, fn);
      this.protos.push(child);
      const idx = this.E('CLOSURE', reg, 0);
      this.closures.push([idx, child]);
      return;
    }
    const [, names, ismethod] = target;
    let tdesc;
    if (names.length === 1) {
      tdesc = this.targetDesc(['Var', names[0]]);
    } else {
      let prefix = ['Var', names[0]];
      for (let i = 1; i < names.length - 1; i++) prefix = ['Index', prefix, ['Str', utf8Bytes(names[i])]];
      const tab = this.expr(prefix);
      tdesc = ['F', tab, this.kstr(utf8Bytes(names[names.length - 1]))];
    }
    const child = new FuncState(this.comp, this);
    const params = (ismethod ? ['self'] : []).concat(fn[1]);
    const fnode = ['Func', params, fn[2], fn[3]];
    this.comp.compileFunction(child, fnode);
    this.protos.push(child);
    const r = this.temp();
    const idx = this.E('CLOSURE', r, 0);
    this.closures.push([idx, child]);
    this.store(tdesc, r);
    this.free = r;
  }

  compileReturn(st) {
    const exprs = st[1];
    if (!exprs.length) { const r = this.temp(); this.E('RETURN', r, 1); this.fr(r); return; }
    if (MULTI_KINDS.has(exprs[exprs.length - 1][0])) {
      const d0 = this.temp();
      for (let i = 0; i < exprs.length - 1; i++) {
        const v = this.expr(exprs[i]);
        this.E('MOVE', d0 + i, v);
        this.free = d0 + i + 1;
      }
      this.free = d0 + exprs.length - 1;
      const base = this.compileMultiAt(exprs[exprs.length - 1]);
      if (base !== d0 + exprs.length - 1) throw new LuaSyntaxError('internal: multi-return base mismatch');
      this.E('RETURN', d0, 0);
      this.free = d0;
      return;
    }
    const dests = exprs.map(() => this.temp());
    this.moveValues(exprs, dests);
    this.E('RETURN', dests[0], dests.length + 1);
    this.free = dests[0];
  }

  finish() {
    const retOp = this.comp.opmap.RETURN;
    if (!this.code.length || this.code[this.code.length - 1][0] !== retOp) {
      const r = this.free;
      this.free += 1;
      this.E('RETURN', r, 1);
      this.free = r;
    }
  }
}

class Compiler {
  constructor(opmap) { this.opmap = opmap; this.flat = []; }

  compileFunction(fs, fnode) {
    const [, params, isvararg, body] = fnode;
    fs.nparams = params.length;
    fs.isvararg = !!isvararg || fs.parent === null;
    fs.pushBlock();
    const blk = fs.blocks[fs.blocks.length - 1];
    params.forEach((p, i) => { blk.vars[p] = i; });
    blk.top = fs.nparams;
    fs.free = fs.nparams;
    fs.compileStats(body[1], body[2]);
    fs.popBlock();
    fs.finish();
    if (fs.pend_goto.length) throw new LuaSyntaxError(`unresolved goto ${fs.pend_goto[0][0]}`);
  }

  compileChunk(source, transform = null) {
    let ast = parseSource(source);
    if (transform !== null) ast = transform(ast);
    const main = new FuncState(this, null);
    this.compileFunction(main, ['Func', [], false, ast]);
    return main;
  }

  flatten(main) {
    const visit = (fs) => {
      for (const c of fs.protos) visit(c);
      fs.flat_index = this.flat.length + 1;
      this.flat.push(fs);
    };
    visit(main);
    for (const fs of this.flat) {
      for (const [idx, child] of fs.closures) fs.code[idx][2] = child.flat_index;
    }
    return this.flat;
  }
}

module.exports = { Compiler, FuncState, OPNAMES, MULTI_KINDS, ARITH_OPS, COMPOUND_OPS };
