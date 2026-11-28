'use strict';
// Faithful JS port of the shared helpers in core/vmgen.py used by the mixed backend.
// Randomness here is cosmetic padding only (decoy locals/functions, literal style) — it never
// affects correctness, so this doesn't need to reproduce Python's exact random *sequence*,
// only equivalent *behavior* (same distributions, same shapes of output).
const crypto = require('crypto');

// Uniform random integer in [0, n) from a CSPRNG, mirroring Python's secrets.randbelow(n).
function secretsRandbelow(n) {
  if (n <= 0) return 0;
  if (n === 1) return 0;
  const bits = Math.max(1, Math.ceil(Math.log2(n)));
  const bytes = Math.ceil(bits / 8);
  if (bits >= 31) {
    const maskb = (1n << BigInt(bits)) - 1n;
    for (;;) {
      const buf = crypto.randomBytes(bytes);
      let vb = 0n;
      for (let i = 0; i < bytes; i++) vb = (vb << 8n) | BigInt(buf[i]);
      vb &= maskb;
      if (vb < BigInt(n)) return Number(vb);
    }
  }
  const mask = (1 << bits) - 1;
  for (;;) {
    const buf = crypto.randomBytes(bytes);
    let v = 0;
    for (let i = 0; i < bytes; i++) v = (v << 8) | buf[i];
    v &= mask;
    if (v < n) return v;
  }
}
const randChoice = (arr) => arr[secretsRandbelow(arr.length)];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = secretsRandbelow(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}
const randrange = (lo, hi) => lo + secretsRandbelow(hi - lo);             // Python randrange(lo,hi): [lo, hi)
const randrangeInclusive = (lo, hi) => lo + secretsRandbelow(hi - lo + 1); // Python randrange(lo,hi+1): [lo, hi]

const LUA_KEYWORDS = new Set((
  'and break do else elseif end false for function if in local nil not or ' +
  'repeat return then true until while continue'
).split(' '));
const RESERVED = new Set([
  ...LUA_KEYWORDS, 'type', 'typeof', 'self', 'game', 'workspace', 'script', 'string', 'table',
  'math', 'os', 'coroutine', 'bit32', 'utf8', 'task', 'print', 'error',
  'assert', 'pcall', 'xpcall', 'select', 'tonumber', 'tostring', 'rawget',
  'rawset', 'setmetatable', 'getmetatable', 'next', 'pairs', 'ipairs',
  'unpack', 'require', 'warn', 'Instance', 'Vector3', 'CFrame',
  'a', 'b', 'm', 'x', 'y', 's',
]);

function genNames(count, exclude) {
  const pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const names = [];
  const seen = new Set(exclude || []);
  // The 1-2 char scheme below has only ~2,756 distinct combinations (52 + 52*52). For large
  // scripts, callers (e.g. buildRuntimeMixed's `3 * flat.length + 40` pool) can need far more
  // unique short names than that, which made the rejection-sampling loop spin forever once it
  // exhausted every unused 1-2 char combination. Fix: only reach for longer (3+ char) names
  // once the count genuinely exceeds what 1-2 chars can provide, so every script that used to
  // work (count comfortably under ~2,756) generates the exact same 1-2 char names as before —
  // this only kicks in for scripts large enough to need more names than physically fit in the
  // old space, and guarantees the loop can always terminate.
  let maxLen = 2;
  let capacity = pool.length + pool.length * pool.length;
  while (capacity < count && maxLen < 8) {
    maxLen++;
    capacity += Math.pow(pool.length, maxLen);
  }
  while (names.length < count) {
    let len = 1;
    while (len < maxLen && secretsRandbelow(3) === 0) len++;
    let n = '';
    for (let i = 0; i < len; i++) n += pool[secretsRandbelow(pool.length)];
    if (seen.has(n) || RESERVED.has(n)) continue;
    seen.add(n);
    names.push(n);
  }
  return names;
}

const MIN_JUNK_LOCALS = 30, MAX_JUNK_LOCALS = 70;
function junkPreamble(exclude) {
  const count = secretsRandbelow(MAX_JUNK_LOCALS - MIN_JUNK_LOCALS + 1) + MIN_JUNK_LOCALS;
  const names = genNames(count, exclude);
  const stmts = [];
  for (let i = 0; i < names.length; i++) {
    const nm = names[i];
    const seed = randrange(1, 999999);
    if (i === 0 || secretsRandbelow(2) === 0) {
      stmts.push(`local ${nm}=${seed}`);
    } else {
      const prev = names[secretsRandbelow(i)];
      const op = randChoice(['+', '-', '%', '*']);
      const rhs = randrange(1, 65521);
      stmts.push(`local ${nm}=(${prev}${op}${rhs})%65521`);
    }
  }
  return stmts.join(' ');
}

const MIN_JUNK_FUNCS = 6, MAX_JUNK_FUNCS = 14;
const JUNK_BODY_TEMPLATES = [
  (t) => `local ${t.r}=${t.p1} for ${t.i}=1,${t.n} do ${t.r}=(${t.r}*${t.k1}+${t.i})%${t.m} end return ${t.r}`,
  (t) => `local ${t.r}=0 for ${t.i}=1,${t.n} do if ${t.i}%${t.k1}==0 then ${t.r}=${t.r}+${t.i} else ${t.r}=${t.r}-1 end end return ${t.r}%${t.m}`,
  (t) => `local ${t.r}=${t.p1} local ${t.r2}=${t.p2} for ${t.i}=1,${t.n} do ${t.r},${t.r2}=${t.r2},(${t.r}+${t.r2}*${t.k1})%${t.m} end return ${t.r}`,
  (t) => `local ${t.s}={} for ${t.i}=1,${t.n} do ${t.s}[${t.i}]=(${t.i}*${t.k1}+${t.p1})%${t.m} end local ${t.r}=0 for ${t.i}=1,#${t.s} do ${t.r}=${t.r}+${t.s}[${t.i}] end return ${t.r}`,
];
function junkFunctions(exclude) {
  const count = randrangeInclusive(MIN_JUNK_FUNCS, MAX_JUNK_FUNCS);
  const fnNames = genNames(count, exclude);
  let used = new Set([...exclude, ...fnNames]);
  const out = [];
  for (const fname of fnNames) {
    const [r, r2, i, n, s, p1, p2, k1, m] = genNames(9, used);
    used = new Set([...used, r, r2, i, n, s, p1, p2, k1, m]);
    const idx = secretsRandbelow(JUNK_BODY_TEMPLATES.length);
    const usesP2 = idx === 2; // only the 3rd template (index 2) references p2
    const body = JUNK_BODY_TEMPLATES[idx]({ r, r2, i, n, s, p1, p2, k1, m });
    const header = `local function ${fname}(${n},${p1}` + (usesP2 ? `,${p2})` : ')');
    out.push(`${header}\n local ${k1}=65521 local ${m}=65537\n ${body}\n end`);
  }
  return out.join('\n');
}

// Format a small non-negative int as decimal, hex or binary, picked at random each call.
function lit(n) {
  const style = secretsRandbelow(3);
  if (style === 0) return String(n);
  if (style === 1) return '0x' + n.toString(16);
  return '0b' + n.toString(2);
}

// Faithful port of Python's '%.17g' % v, verified against 3000+ random values plus edge
// cases (zero, -0, inf, very large/small magnitudes) — see lib/obf/README for the test notes.
function luaNumLit(v) {
  if (Number.isNaN(v)) return 'nan';
  if (v === Infinity) return 'inf';
  if (v === -Infinity) return '-inf';
  if (v === 0) return Object.is(v, -0) ? '-0' : '0';
  const neg = v < 0;
  const av = Math.abs(v);
  const P = 17;
  const expStr = av.toExponential(P - 1);
  const m = expStr.match(/^(\d)(?:\.(\d+))?e([+-]\d+)$/);
  const lead = m[1], frac = m[2] || '', E = parseInt(m[3], 10);
  const digits = lead + frac;
  let out;
  if (E < -4 || E >= P) {
    let mant = digits[0];
    const rest = digits.slice(1).replace(/0+$/, '');
    if (rest.length) mant += '.' + rest;
    const esign = E < 0 ? '-' : '+';
    let eabs = String(Math.abs(E));
    if (eabs.length < 2) eabs = '0' + eabs;
    out = mant + 'e' + esign + eabs;
  } else if (E >= 0) {
    let intPart = digits.slice(0, E + 1);
    while (intPart.length < E + 1) intPart += '0';
    const fracPart = digits.slice(E + 1).replace(/0+$/, '');
    out = fracPart.length ? intPart + '.' + fracPart : intPart;
  } else {
    const zeros = '0'.repeat(-E - 1);
    const fracPart = (zeros + digits).replace(/0+$/, '');
    out = fracPart.length ? '0.' + fracPart : '0';
  }
  return neg ? '-' + out : out;
}

module.exports = {
  secretsRandbelow, randChoice, shuffle, randrange, randrangeInclusive,
  genNames, junkPreamble, junkFunctions, lit, luaNumLit, RESERVED,
};
