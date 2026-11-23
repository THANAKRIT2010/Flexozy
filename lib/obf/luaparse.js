'use strict';
// Luau lexer + recursive-descent parser — faithful JS port of core/luaparse.py.
// Lua "strings" (bytes) are represented here as JS "binary strings": each char code is one byte (0-255).
// utf8Bytes() converts a normal JS string (e.g. Lua source text) into that binary-string byte representation.

function utf8Bytes(str) {
  // Equivalent of Python's str.encode('utf-8') -> bytes, but returned as a JS string where
  // each character is one byte (code 0-255), i.e. the common "binary string" convention.
  let out = '';
  for (let i = 0; i < str.length; i++) {
    let cp = str.codePointAt(i);
    if (cp > 0xffff) i++; // consumed a surrogate pair
    if (cp < 0x80) {
      out += String.fromCharCode(cp);
    } else if (cp < 0x800) {
      out += String.fromCharCode(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out += String.fromCharCode(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else {
      out += String.fromCharCode(
        0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f)
      );
    }
  }
  return out;
}
function byteChr(n) { return String.fromCharCode(n & 0xff); }
function isDigit(c) { return c >= '0' && c <= '9'; }
function isAlpha(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c.codePointAt(0) > 127; }
function isAlnum(c) { return isDigit(c) || isAlpha(c); }
function isSpace(c) { return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\v' || c === '\f'; }
function isHex(c) { return /[0-9a-fA-F]/.test(c); }
function countNl(s, from, to) { let n = 0; for (let i = from; i < to; i++) if (s[i] === '\n') n++; return n; }

const KEYWORDS = new Set((
  'and break do else elseif end false for function goto if in local nil not or ' +
  'repeat return then true until while continue'
).split(' '));

const OPERATORS = [
  '...', '==', '~=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '^=', '..=',
  '->', '::', '..', '#', '(', ')', '{', '}', '[', ']', ';', ':', ',', '.',
  '+', '-', '*', '/', '%', '^', '=', '<', '>',
];

// mirrors _NUM_RE: hex (with optional frac/exp) | binary | decimal (with optional frac/exp)
const NUM_RE = /^(?:0[xX][0-9a-fA-F]+(?:\.[0-9a-fA-F]*)?(?:[pP][-+]?\d+)?|0[bB][01]+|(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/;

const SIMPLE_ESCAPES = {
  a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11,
  '\\': 92, '"': 34, "'": 39, '`': 96, '{': 123, '}': 125,
};

class Token {
  constructor(kind, value, line) { this.kind = kind; this.value = value; this.line = line; }
}

class LuaSyntaxError extends Error {}

function decodeEscapes(body) {
  // body is a plain JS string (as sliced from source); returns a binary-string of decoded bytes.
  let out = '';
  let i = 0, n = body.length;
  while (i < n) {
    const c = body[i];
    if (c !== '\\') { out += utf8Bytes(c); i += 1; continue; }
    i += 1;
    if (i >= n) throw new LuaSyntaxError('unfinished escape sequence');
    const c2 = body[i];
    if (Object.prototype.hasOwnProperty.call(SIMPLE_ESCAPES, c2)) {
      out += byteChr(SIMPLE_ESCAPES[c2]); i += 1;
    } else if (c2 === 'z') {
      i += 1;
      while (i < n && isSpace(body[i])) i += 1;
    } else if (c2 === 'x' && i + 2 < n) {
      out += byteChr(parseInt(body.slice(i + 1, i + 3), 16)); i += 3;
    } else if (c2 === 'u' && i + 1 < n && body[i + 1] === '{') {
      const close = body.indexOf('}', i + 2);
      if (close < 0) throw new LuaSyntaxError('invalid \\u escape');
      out += utf8Bytes(String.fromCodePoint(parseInt(body.slice(i + 2, close), 16)));
      i = close + 1;
    } else if (isDigit(c2)) {
      let j = i;
      while (j < n && j < i + 3 && isDigit(body[j])) j += 1;
      out += byteChr(parseInt(body.slice(i, j), 10)); i = j;
    } else if (c2 === '\n') {
      out += byteChr(10); i += 1;
    } else if (c2 === '\r') {
      out += byteChr(10); i += 1;
      if (i < n && body[i] === '\n') i += 1;
    } else {
      out += utf8Bytes(c2); i += 1;
    }
  }
  return out;
}

function hexFloat(text) {
  let body = text.slice(2);
  let mant, expp = '';
  if (body.includes('p') || body.includes('P')) {
    const parts = body.replace('P', 'p').split('p');
    mant = parts[0]; expp = 'p' + (parts[1] || '');
  } else {
    mant = body;
  }
  let ip, fp;
  if (mant.includes('.')) { const [a, b] = mant.split('.'); ip = a; fp = b; } else { ip = mant; fp = ''; }
  let v = 0.0;
  for (const ch of (ip + fp)) v = v * 16 + parseInt(ch, 16);
  if (fp) v /= Math.pow(16, fp.length);
  if (expp) v *= Math.pow(2.0, parseInt(expp.slice(1), 10));
  return v;
}

function lex(src) {
  const toks = [];
  let i = 0, n = src.length, line = 1;

  function longOpen(pos) {
    if (pos >= n || src[pos] !== '[') return null;
    let j = pos + 1;
    while (j < n && src[j] === '=') j += 1;
    if (j < n && src[j] === '[') return [j + 1, ']' + '='.repeat(j - pos - 1) + ']'];
    return null;
  }

  while (i < n) {
    const c = src[i];
    if (c === '\n') { line += 1; i += 1; continue; }
    if (isSpace(c)) { i += 1; continue; }
    if (c === '-' && src[i + 1] === '-') {
      const lb = longOpen(i + 2);
      if (lb) {
        const [b, close] = lb;
        const e = src.indexOf(close, b);
        if (e < 0) throw new LuaSyntaxError(`line ${line}: unterminated long comment`);
        line += countNl(src, i, e + close.length);
        i = e + close.length;
        continue;
      }
      let e = src.indexOf('\n', i);
      i = e < 0 ? n : e;
      continue;
    }
    if (src.startsWith('#!', i) && i === 0) {
      let e = src.indexOf('\n', i);
      i = e < 0 ? n : e;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c; i += 1; const start = i;
      let closed = false;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === q) { closed = true; break; }
        if (src[i] === '\n') line += 1;
        i += 1;
      }
      if (!closed) throw new LuaSyntaxError(`line ${line}: unterminated string`);
      const body = src.slice(start, i);
      i += 1;
      toks.push(new Token('str', decodeEscapes(body), line));
      continue;
    }
    if (c === '`') {
      i += 1; const start = i;
      let closed = false;
      while (i < n) {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '`') { closed = true; break; }
        if (src[i] === '\n') line += 1;
        i += 1;
      }
      if (!closed) throw new LuaSyntaxError(`line ${line}: unterminated interpolated string`);
      const inner = src.slice(start, i);
      i += 1;
      toks.push(new Token('interp', inner, line));
      continue;
    }
    const lb = longOpen(i);
    if (lb) {
      const [b, close] = lb;
      const e = src.indexOf(close, b);
      if (e < 0) throw new LuaSyntaxError(`line ${line}: unterminated long string`);
      const body = src.slice(b, e);
      line += countNl(src, i, e + close.length);
      i = e + close.length;
      toks.push(new Token('str', utf8Bytes(body), line));
      continue;
    }
    const m = NUM_RE.exec(src.slice(i));
    if (m && m[0].length > 0 && (isDigit(c) || (c === '.' && i + 1 < n && isDigit(src[i + 1])))) {
      const text = m[0];
      i += text.length;
      let v;
      const lead = text.slice(0, 2);
      if (lead === '0x' || lead === '0X') {
        if (!/[pP.]/.test(text)) v = parseInt(text.slice(2).split(/[pP]/)[0], 16);
        else v = hexFloat(text);
      } else if (lead === '0b' || lead === '0B') {
        v = parseInt(text.slice(2), 2);
      } else {
        v = parseFloat(text);
      }
      toks.push(new Token('num', v, line));
      continue;
    }
    if (isAlpha(c) || c === '_') {
      let j = i;
      while (j < n && (isAlnum(src[j]) || src[j] === '_')) j += 1;
      const word = src.slice(i, j);
      toks.push(new Token(KEYWORDS.has(word) ? 'kw' : 'name', word, line));
      i = j;
      continue;
    }
    let matched = false;
    for (const op of OPERATORS) {
      if (src.startsWith(op, i)) { toks.push(new Token('op', op, line)); i += op.length; matched = true; break; }
    }
    if (!matched) throw new LuaSyntaxError(`line ${line}: unexpected character ${JSON.stringify(c)}`);
  }
  toks.push(new Token('eof', null, line));
  return toks;
}

function splitInterp(inner) {
  const parts = [];
  let buf = '';
  let i = 0, n = inner.length;
  function flush() { if (buf) { parts.push(['lit', decodeEscapes(buf)]); buf = ''; } }
  while (i < n) {
    const c = inner[i];
    if (c === '\\' && i + 1 < n) { buf += inner.slice(i, i + 2); i += 2; continue; }
    if (c === '{') {
      let j = i + 1, depth = 1, q = null;
      while (j < n && depth) {
        const ch = inner[j];
        if (q) {
          if (ch === '\\') { j += 2; continue; }
          if (ch === q) q = null;
        } else if (ch === '"' || ch === "'" || ch === '`') {
          q = ch;
        } else if (ch === '[' && j + 1 < n && (inner[j + 1] === '[' || inner[j + 1] === '=')) {
          let k = j + 1;
          while (k < n && inner[k] === '=') k += 1;
          if (k < n && inner[k] === '[') {
            const close = ']' + '='.repeat(k - j - 1) + ']';
            const e = inner.indexOf(close, k + 1);
            j = (e >= 0 ? e + close.length - 1 : n);
          }
        } else if (ch === '{') {
          depth += 1;
        } else if (ch === '}') {
          depth -= 1;
        }
        j += 1;
      }
      if (depth) throw new LuaSyntaxError('unterminated interpolated expression');
      flush();
      parts.push(['expr', inner.slice(i + 1, j - 1)]);
      i = j;
      continue;
    }
    buf += c; i += 1;
  }
  flush();
  if (!parts.length) parts.push(['lit', '']);
  return parts;
}

class Parser {
  constructor(src) { this.toks = lex(src); this.pos = 0; this._interp_depth = 0; }

  peek(k = 0) { return this.toks[Math.min(this.pos + k, this.toks.length - 1)]; }
  kind(k = 0) { return this.peek(k).kind; }
  val(k = 0) { return this.peek(k).value; }
  line() { return this.peek().line; }
  next() { const t = this.toks[this.pos]; this.pos += 1; return t; }

  accept(kind, value = undefined) {
    const t = this.peek();
    if (t.kind === kind && (value === undefined || t.value === value)) { this.pos += 1; return true; }
    return false;
  }
  acceptOp(...ops) {
    const t = this.peek();
    if (t.kind === 'op' && ops.includes(t.value)) { this.pos += 1; return true; }
    return false;
  }
  acceptKw(...kws) {
    const t = this.peek();
    if (t.kind === 'kw' && kws.includes(t.value)) { this.pos += 1; return true; }
    return false;
  }
  expect(kind, value = undefined) {
    const t = this.peek();
    if (t.kind !== kind || (value !== undefined && t.value !== value)) {
      throw new LuaSyntaxError(`line ${t.line}: expected ${value !== undefined ? value : kind}, got ${JSON.stringify(t.value)}`);
    }
    return this.next();
  }
  expectOp(op) {
    const t = this.peek();
    if (t.kind !== 'op' || t.value !== op) throw new LuaSyntaxError(`line ${t.line}: expected ${JSON.stringify(op)}, got ${JSON.stringify(t.value)}`);
    return this.next();
  }
  expectKw(kw) {
    const t = this.peek();
    if (t.kind !== 'kw' || t.value !== kw) throw new LuaSyntaxError(`line ${t.line}: expected ${JSON.stringify(kw)}, got ${JSON.stringify(t.value)}`);
    return this.next();
  }
  error(msg) { throw new LuaSyntaxError(`line ${this.line()}: ${msg}`); }

  // -- type annotations (parsed and discarded) --
  skipType() { this.skipTypeAtom(); while (this.acceptOp('|', '&')) this.skipTypeAtom(); }
  skipTypeList() {
    if (this.acceptOp('...')) { this.skipTypePostfix(); return; }
    this.skipType();
    while (this.acceptOp(',')) this.skipType();
  }
  skipTypePostfix() {
    for (;;) {
      if (this.acceptOp('?')) continue;
      if (this.acceptOp('[')) { this.expectOp(']'); continue; }
      break;
    }
  }
  skipTypeAtom() {
    const t = this.peek();
    if (this.acceptOp('(')) {
      if (!this.acceptOp(')')) { this.skipTypeList(); this.expectOp(')'); }
      if (this.acceptOp('->')) this.skipTypeList();
      this.skipTypePostfix();
      return;
    }
    if (this.acceptOp('{')) {
      let depth = 1;
      while (depth) {
        const tk = this.next();
        if (tk.kind === 'eof') throw new LuaSyntaxError(`line ${tk.line}: unterminated table type`);
        if (tk.kind === 'op') {
          if (tk.value === '{') depth += 1;
          else if (tk.value === '}') depth -= 1;
          else if (tk.value === '(') depth += 1;
          else if (tk.value === ')') depth -= 1;
        }
      }
      this.skipTypePostfix();
      return;
    }
    if (this.acceptKw('typeof')) {
      this.expectOp('(');
      let depth = 1;
      while (depth) {
        const tk = this.next();
        if (tk.kind === 'eof') throw new LuaSyntaxError(`line ${tk.line}: unterminated typeof`);
        if (tk.kind === 'op') {
          if (tk.value === '(') depth += 1;
          else if (tk.value === ')') depth -= 1;
        }
      }
      this.skipTypePostfix();
      return;
    }
    if (t.kind === 'str' || t.kind === 'num' || (t.kind === 'kw' && ['nil', 'true', 'false'].includes(t.value))) {
      this.next(); this.skipTypePostfix(); return;
    }
    if (this.acceptOp('...')) { this.skipTypePostfix(); return; }
    if (this.acceptOp('<')) {
      let depth = 1;
      while (depth) {
        const tk = this.next();
        if (tk.kind === 'eof') throw new LuaSyntaxError(`line ${tk.line}: unterminated generics`);
        if (tk.kind === 'op') { if (tk.value === '<') depth += 1; else if (tk.value === '>') depth -= 1; }
      }
      this.skipTypePostfix();
      return;
    }
    if (t.kind === 'name' || t.kind === 'kw') {
      this.next();
      while (this.acceptOp('.')) this.expectKindName();
      if (this.acceptOp('<')) {
        let depth = 1;
        while (depth) {
          const tk = this.next();
          if (tk.kind === 'eof') throw new LuaSyntaxError(`line ${tk.line}: unterminated generics`);
          if (tk.kind === 'op') { if (tk.value === '<') depth += 1; else if (tk.value === '>') depth -= 1; }
        }
      }
      this.skipTypePostfix();
      return;
    }
    if (t.kind !== 'eof') { this.next(); this.skipTypePostfix(); }
  }
  expectKindName() {
    const t = this.peek();
    if (t.kind === 'name' || t.kind === 'kw') this.next();
    else throw new LuaSyntaxError(`line ${t.line}: expected name in type, got ${JSON.stringify(t.value)}`);
  }

  // -- statements --
  parseBlock() {
    const stats = [];
    for (;;) {
      const t = this.peek();
      if (t.kind === 'eof') break;
      if (t.kind === 'kw' && ['end', 'else', 'elseif', 'until', 'return'].includes(t.value)) break;
      if (this.acceptOp(';')) continue;
      const st = this.parseStatement();
      if (st !== null) stats.push(st);
    }
    let ret = null;
    if (this.acceptKw('return')) {
      let exprs = [];
      if (!(this.kind() === 'kw' && ['end', 'else', 'elseif'].includes(this.val())) &&
          !this.acceptOp(';') && this.peek().kind !== 'eof') {
        exprs = this.parseExplist();
      }
      this.acceptOp(';');
      ret = ['Return', exprs];
    }
    return [stats, ret];
  }

  parseStatement() {
    const t = this.peek();
    if (t.kind === 'kw') {
      const v = t.value;
      if (v === 'do') {
        this.next();
        const [body, ret] = this.parseBlock();
        this.expectKw('end');
        return ['Do', ['Block', body, ret]];
      }
      if (v === 'while') {
        this.next();
        const cond = this.parseExpr();
        this.expectKw('do');
        const [body, ret] = this.parseBlock();
        this.expectKw('end');
        return ['While', cond, ['Block', body, ret]];
      }
      if (v === 'repeat') {
        this.next();
        const [body, ret] = this.parseBlock();
        this.expectKw('until');
        const cond = this.parseExpr();
        return ['Repeat', ['Block', body, ret], cond];
      }
      if (v === 'if') { this.next(); return this.parseIf(); }
      if (v === 'for') { this.next(); return this.parseFor(); }
      if (v === 'function') { this.next(); return this.parseFuncdecl(); }
      if (v === 'local') {
        this.next();
        if (this.acceptKw('function')) {
          const name = this.expectName();
          const fn = this.parseFuncbody([]);
          this.skipReturnType();
          return ['FuncDecl', ['local', name], fn];
        }
        const names = [];
        for (;;) {
          names.push(this.expectName());
          if (this.acceptOp(':')) this.skipType();
          if (!this.acceptOp(',')) break;
        }
        let exprs = null;
        if (this.acceptOp('=')) exprs = this.parseExplist();
        return ['Local', names, exprs];
      }
      if (v === 'return') this.error('unexpected return');
      if (v === 'break') { this.next(); return ['Break']; }
      if (v === 'continue') { this.next(); return ['Continue']; }
    }
    if (t.kind === 'kw' && t.value === 'export' && this.kind(1) === 'name' && this.val(1) === 'type') {
      this.next(); this.next();
      this.expectName();
      if (this.acceptOp('<')) this.skipGenericsDecl();
      this.expectOp('=');
      this.skipType();
      return null;
    }
    if (t.kind === 'name' && t.value === 'type' && this.kind(1) === 'name' &&
        this.kind(2) === 'op' && this.val(2) === '=') {
      this.next(); this.next();
      this.expectOp('=');
      this.skipType();
      return null;
    }
    return this.parseExprStatement();
  }

  skipGenericsDecl() {
    let depth = 1;
    while (depth) {
      const tk = this.next();
      if (tk.kind === 'eof') this.error('unterminated generics');
      if (tk.kind === 'op') { if (tk.value === '<') depth += 1; else if (tk.value === '>') depth -= 1; }
    }
  }
  expectName() {
    const t = this.peek();
    if (t.kind !== 'name') throw new LuaSyntaxError(`line ${t.line}: expected name, got ${JSON.stringify(t.value)}`);
    this.next();
    return t.value;
  }
  skipReturnType() { if (this.acceptOp(':')) this.skipType(); }

  parseIf() {
    const arms = [];
    let cond = this.parseExpr();
    this.expectKw('then');
    let [body, ret] = this.parseBlock();
    arms.push([cond, ['Block', body, ret]]);
    while (this.acceptKw('elseif')) {
      const c = this.parseExpr();
      this.expectKw('then');
      const [b, r] = this.parseBlock();
      arms.push([c, ['Block', b, r]]);
    }
    let els = null;
    if (this.acceptKw('else')) {
      const [b, r] = this.parseBlock();
      els = ['Block', b, r];
    }
    this.expectKw('end');
    return ['If', arms, els];
  }

  parseFor() {
    const name = this.expectName();
    if (this.acceptOp('=')) {
      const init = this.parseExpr();
      this.expectOp(',');
      const limit = this.parseExpr();
      let step = null;
      if (this.acceptOp(',')) step = this.parseExpr();
      this.expectKw('do');
      const [body, ret] = this.parseBlock();
      this.expectKw('end');
      return ['ForNum', name, init, limit, step, ['Block', body, ret]];
    }
    if (this.acceptOp(':')) this.skipType();
    const names = [name];
    while (this.acceptOp(',')) {
      names.push(this.expectName());
      if (this.acceptOp(':')) this.skipType();
    }
    this.expectKw('in');
    const exprs = this.parseExplist();
    this.expectKw('do');
    const [body, ret] = this.parseBlock();
    this.expectKw('end');
    return ['ForIn', names, exprs, ['Block', body, ret]];
  }

  parseFuncdecl() {
    const names = [this.expectName()];
    let ismethod = false;
    while (this.acceptOp('.')) names.push(this.expectName());
    if (this.acceptOp(':')) { names.push(this.expectName()); ismethod = true; }
    const [params, isvararg] = this.parseParams();
    this.skipReturnType();
    const [body, ret] = this.parseBlock();
    this.expectKw('end');
    const fn = ['Func', params, isvararg, ['Block', body, ret]];
    return ['FuncDecl', ['path', names, ismethod], fn];
  }

  parseParams() {
    this.expectOp('(');
    const params = [];
    let isvararg = false;
    if (!this.acceptOp(')')) {
      for (;;) {
        if (this.acceptOp('...')) { isvararg = true; break; }
        params.push(this.expectName());
        if (this.acceptOp(':')) this.skipType();
        if (!this.acceptOp(',')) break;
      }
      this.expectOp(')');
    }
    return [params, isvararg];
  }

  parseFuncbody(params) {
    this.expectOp('(');
    let isvararg = false;
    if (!this.acceptOp(')')) {
      for (;;) {
        if (this.acceptOp('...')) { isvararg = true; break; }
        params.push(this.expectName());
        if (this.acceptOp(':')) this.skipType();
        if (!this.acceptOp(',')) break;
      }
      this.expectOp(')');
    }
    this.skipReturnType();
    const [body, ret] = this.parseBlock();
    this.expectKw('end');
    return ['Func', params, isvararg, ['Block', body, ret]];
  }

  parseExprStatement() {
    const t = this.peek();
    if (t.kind === 'kw' && t.value === 'goto') { this.next(); const name = this.expectName(); return ['Goto', name]; }
    if (t.kind === 'op' && t.value === '::') { this.next(); const name = this.expectName(); this.expectOp('::'); return ['Label', name]; }
    const e = this.parseSuffixed();
    const k = e[0];
    if (k === 'Call' || k === 'Method') return e;
    if (k === 'Var' || k === 'Index') {
      const targets = [e];
      let op = null;
      if (this.acceptOp('=')) {
        // fallthrough to explist below
      } else if (this.peek().kind === 'op' && ['+=', '-=', '*=', '/=', '%=', '^=', '..='].includes(this.val())) {
        op = this.next().value;
      } else {
        while (this.acceptOp(',')) targets.push(this.parseSuffixed());
        this.expectOp('=');
      }
      if (op) { const rhs = this.parseExpr(); return ['Compound', e, op, rhs]; }
      const exprs = this.parseExplist();
      for (const tv of targets) if (!['Var', 'Index'].includes(tv[0])) this.error('cannot assign to this expression');
      return ['Assign', targets, exprs];
    }
    this.error('unexpected expression statement');
  }

  // -- expressions --
  parseExplist() {
    const exprs = [this.parseExpr()];
    while (this.acceptOp(',')) exprs.push(this.parseExpr());
    return exprs;
  }
  parseExpr() { return this.parseSubexpr(0); }

  parseSubexpr(limit) {
    let t = this.peek();
    let e;
    if ((t.kind === 'op' && (t.value === '-' || t.value === '#')) || (t.kind === 'kw' && t.value === 'not')) {
      this.next();
      const uop = t.value;
      const sub = this.parseSubexpr(Parser.UNARY_PRIO);
      e = ['Un', uop, sub];
    } else if (t.kind === 'kw' && t.value === 'if') {
      e = this.parseIfExpr();
    } else {
      e = this.parseSimple();
    }
    for (;;) {
      t = this.peek();
      const isOpPrio = t.kind === 'op' && Object.prototype.hasOwnProperty.call(Parser.PRIORITIES, t.value);
      const isKwPrio = t.kind === 'kw' && (t.value === 'and' || t.value === 'or');
      if (isOpPrio || isKwPrio) {
        const [lp, rp] = Parser.PRIORITIES[t.value] || [2, 2];
        if (lp <= limit) break;
        this.next();
        const rhs = this.parseSubexpr(rp);
        const v = t.value;
        if (v === 'and') e = ['And', e, rhs];
        else if (v === 'or') e = ['Or', e, rhs];
        else if (['==', '~=', '<', '<=', '>', '>='].includes(v)) e = ['Cmp', v, e, rhs];
        else if (v === '..') e = ['Concat', e, rhs];
        else e = ['Bin', v, e, rhs];
      } else break;
    }
    if (this.acceptOp('::')) this.skipType();
    return e;
  }

  parseIfExpr() {
    this.expectKw('if');
    const arms = [];
    const cond = this.parseExpr();
    this.expectKw('then');
    const then = this.parseExpr();
    arms.push([cond, then]);
    while (this.acceptKw('elseif')) {
      const c = this.parseExpr();
      this.expectKw('then');
      const b = this.parseExpr();
      arms.push([c, b]);
    }
    this.expectKw('else');
    const els = this.parseExpr();
    return ['IfExpr', arms, els];
  }

  parseSimple() {
    const t = this.peek();
    if (t.kind === 'num') { this.next(); return ['Num', t.value]; }
    if (t.kind === 'str') { this.next(); return ['Str', t.value]; }
    if (t.kind === 'interp') { this.next(); return this.interpExpr(t.value); }
    if (t.kind === 'kw') {
      if (t.value === 'nil') { this.next(); return ['Nil']; }
      if (t.value === 'true') { this.next(); return ['True']; }
      if (t.value === 'false') { this.next(); return ['False']; }
      if (t.value === 'function') { this.next(); return this.parseSuffixes(this.parseFuncbody([])); }
      throw new LuaSyntaxError(`line ${t.line}: unexpected keyword ${t.value}`);
    }
    if (t.kind === 'op' && t.value === '...') { this.next(); return ['Vararg']; }
    if (t.kind === 'op' && t.value === '{') return this.parseTable();
    if (t.kind === 'op' && t.value === '(') {
      this.next();
      const e = this.parseExpr();
      this.expectOp(')');
      return this.parseSuffixes(['Paren', e]);
    }
    if (t.kind === 'name') { this.next(); return this.parseSuffixes(['Var', t.value]); }
    throw new LuaSyntaxError(`line ${t.line}: unexpected symbol ${JSON.stringify(t.value)}`);
  }

  interpExpr(inner) {
    const parts = splitInterp(inner);
    if (parts.length === 1 && parts[0][0] === 'lit') return ['Str', parts[0][1]];
    const items = [];
    for (const [kind, payload] of parts) {
      if (kind === 'lit') items.push(['Str', payload]);
      else {
        const sub = new Parser(payload);
        sub._interp_depth = this._interp_depth + 1;
        items.push(['Call', ['Var', 'tostring'], [sub.parseExpr()]]);
      }
    }
    let node = items[0];
    for (let k = 1; k < items.length; k++) node = ['Concat', node, items[k]];
    return node;
  }

  parseSuffixed() {
    const t = this.peek();
    let e;
    if (t.kind === 'name') { this.next(); e = ['Var', t.value]; }
    else if (t.kind === 'op' && t.value === '(') {
      this.next();
      const inner = this.parseExpr();
      this.expectOp(')');
      e = ['Paren', inner];
    } else throw new LuaSyntaxError(`line ${t.line}: unexpected symbol ${JSON.stringify(t.value)}`);
    return this.parseSuffixes(e);
  }

  parseSuffixes(e) {
    for (;;) {
      const t = this.peek();
      if (t.kind === 'op' && t.value === '.') {
        this.next();
        const name = this.expectName();
        e = ['Index', e, ['Str', utf8Bytes(name)]];
      } else if (t.kind === 'op' && t.value === '[') {
        this.next();
        const k = this.parseExpr();
        this.expectOp(']');
        e = ['Index', e, k];
      } else if (t.kind === 'op' && t.value === ':') {
        this.next();
        const name = this.expectName();
        const args = this.parseCallargs();
        e = ['Method', e, name, args];
      } else if (t.kind === 'str' || t.kind === 'interp' || (t.kind === 'op' && (t.value === '{' || t.value === '('))) {
        const args = this.parseCallargs();
        e = ['Call', e, args];
      } else break;
    }
    return e;
  }

  parseCallargs() {
    const t = this.peek();
    if (t.kind === 'str') { this.next(); return [['Str', t.value]]; }
    if (t.kind === 'interp') { this.next(); return [this.interpExpr(t.value)]; }
    if (t.kind === 'op' && t.value === '{') return [this.parseTable()];
    this.expectOp('(');
    if (this.acceptOp(')')) return [];
    const exprs = this.parseExplist();
    this.expectOp(')');
    return exprs;
  }

  parseTable() {
    this.expectOp('{');
    const fields = [];
    while (!this.acceptOp('}')) {
      const t = this.peek();
      if (t.kind === 'op' && t.value === '[') {
        this.next();
        const k = this.parseExpr();
        this.expectOp(']');
        this.expectOp('=');
        const v = this.parseExpr();
        fields.push(['k', k, v]);
      } else if (t.kind === 'name' && this.kind(1) === 'op' && this.val(1) === '=') {
        this.next(); this.next();
        const v = this.parseExpr();
        fields.push(['k', ['Str', utf8Bytes(t.value)], v]);
      } else {
        const v = this.parseExpr();
        fields.push(['v', v]);
      }
      if (!this.acceptOp(',')) {
        this.acceptOp(';');
        if (!(this.kind() === 'op' && this.val() === '}')) this.error("expected ',' or '}' in table constructor");
      }
    }
    return ['Table', fields];
  }
}
Parser.PRIORITIES = {
  or: [1, 1], and: [2, 2],
  '<': [3, 3], '>': [3, 3], '<=': [3, 3], '>=': [3, 3],
  '~=': [3, 3], '==': [3, 3],
  '..': [5, 4],
  '+': [6, 6], '-': [6, 6],
  '*': [7, 7], '/': [7, 7], '%': [7, 7],
  '^': [12, 11],
};
Parser.UNARY_PRIO = 8;

function parseSource(src) {
  const p = new Parser(src);
  const [stats, ret] = p.parseBlock();
  if (p.peek().kind !== 'eof') {
    const t = p.peek();
    throw new LuaSyntaxError(`line ${t.line}: unexpected ${JSON.stringify(t.value)} after block`);
  }
  return ['Block', stats, ret];
}

module.exports = { Parser, parseSource, LuaSyntaxError, Token, lex, utf8Bytes, byteChr, decodeEscapes };
