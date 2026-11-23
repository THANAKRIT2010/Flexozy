'use strict';
// Faithful JS port of the parts of core/vmgen_cps.py that vmgen_mixed.py actually uses:
// _const_lit and _instr_body (the real per-opcode -> Lua-source translation) and the
// reserved-temp-name set. build_runtime_cps itself isn't ported since the mixed backend
// (what the website's "Obfuscate" button uses) doesn't call it.
const { luaNumLit } = require('./vmgen.js');

function luaStrLit(data) {
  // Render arbitrary bytes (a binary-string, one char code 0-255 per byte) as a safe
  // double-quoted Lua string literal: printable ASCII kept as-is, everything else
  // decimal-escaped — mirrors core/vmgen.py's _lua_str_lit byte-for-byte.
  const out = ['"'];
  for (let i = 0; i < data.length; i++) {
    const b = data.charCodeAt(i);
    const ch = String.fromCharCode(b);
    if (b >= 32 && b <= 126 && ch !== '"' && ch !== '\\') out.push(ch);
    else out.push('\\' + b);
  }
  out.push('"');
  return out.join('');
}

function constLit(c) {
  const [kind, val] = c;
  if (kind === 's') return luaStrLit(val);
  return luaNumLit(val);
}

const CPS_RESERVED_TEMPS = new Set([
  'M', 'Z', 'AG', 'RS', 'S', 'ST', 'GO', 'IT', 'T', 'o', 'kk', 'i', 'st', 'RET', 'USn', 'US',
]);

// fs: {code, consts, nparams}; idx: instruction index; rev: {opnum -> name}; flat: all FuncStates
// (for CLOSURE's child lookup); protoNames: {flat_index -> generated local name}; names: layout;
// kref: optional (constIndex)=>string override for string constants (used by the mixed backend's
// per-function decoded string pool).
function instrBody(fs, idx, rev, flat, protoNames, names, kref) {
  const [op, a, b, c] = fs.code[idx];
  const name = rev[op];
  const NEXT = idx + 1;
  const [R, TP, O, VA, VN, US] = names.sig;
  const mkup = names.mkup;
  const pk = names.pk, up = names.up;
  const ENV = names.env;

  const k = (i) => {
    if (kref && fs.consts[i - 1][0] === 's') return kref(i);
    return constLit(fs.consts[i - 1]);
  };

  if (name === 'MOVE') return `${R}[${a}]=${R}[${b}]\nreturn ${NEXT},${TP}`;
  if (name === 'LOADK') return `${R}[${a}]=${k(b)}\nreturn ${NEXT},${TP}`;
  if (name === 'GETFIELD') return `${R}[${a}]=${R}[${b}][${k(c)}]\nreturn ${NEXT},${TP}`;
  if (name === 'SETFIELD') return `${R}[${b}][${k(c)}]=${R}[${a}]\nreturn ${NEXT},${TP}`;
  if (name === 'GETGLOBAL') return `${R}[${a}]=${ENV}[${k(b)}]\nreturn ${NEXT},${TP}`;
  if (name === 'SETGLOBAL') return `${ENV}[${k(b)}]=${R}[${a}]\nreturn ${NEXT},${TP}`;
  if (name === 'GETTABLE') return `${R}[${a}]=${R}[${b}][${R}[${c}]]\nreturn ${NEXT},${TP}`;
  if (name === 'SETTABLE') return `${R}[${b}][${R}[${c}]]=${R}[${a}]\nreturn ${NEXT},${TP}`;
  if (name === 'NEWTABLE') return `${R}[${a}]={}\nreturn ${NEXT},${TP}`;
  if (name === 'SETLIST') {
    if (b !== 0) return `for i=1,${b} do ${R}[${a}][i]=${R}[${a}+i] end\nreturn ${NEXT},${TP}`;
    return `local M=${TP}-${a}\nfor i=1,M do ${R}[${a}][i]=${R}[${a}+i] end\nreturn ${NEXT},${TP}`;
  }
  if (name === 'CALL') {
    let args;
    if (b !== 0) {
      const m = b - 1;
      if (m > 0) args = `local AG={}\nfor i=1,${m} do AG[i]=${R}[${a}+i] end\nlocal RS=${pk}(${R}[${a}](${up}(AG,1,${m})))`;
      else args = `local RS=${pk}(${R}[${a}]())`;
    } else {
      args = `local M=${TP}-${a}\nlocal AG={}\nfor i=1,M do AG[i]=${R}[${a}+i] end\nlocal RS=${pk}(${R}[${a}](${up}(AG,1,M)))`;
    }
    let tail;
    if (c === 0) tail = `local Z=RS.n\nfor i=1,Z do ${R}[${a}+i-1]=RS[i] end\nreturn ${NEXT},(${a}+Z-1)`;
    else if (c === 1) tail = `${R}[${a}]=RS[1]\nreturn ${NEXT},${TP}`;
    else tail = `return ${NEXT},${a - 1}`;
    return `${args}\n${tail}`;
  }
  if (name === 'SELF') return `${R}[${a}+1]=${R}[${b}]\n${R}[${a}]=${R}[${b}][${k(c)}]\nreturn ${NEXT},${TP}`;
  if (name === 'CONCAT') return `local S=${R}[${b}]\nfor i=${b}+1,${c} do S=S..${R}[i] end\n${R}[${a}]=S\nreturn ${NEXT},${TP}`;
  if (name === 'ADD' || name === 'SUB' || name === 'MUL' || name === 'DIV' || name === 'MOD' || name === 'POW') {
    const opch = { ADD: '+', SUB: '-', MUL: '*', DIV: '/', MOD: '%', POW: '^' }[name];
    return `${R}[${a}]=${R}[${b}]${opch}${R}[${c}]\nreturn ${NEXT},${TP}`;
  }
  if (name === 'UNM') return `${R}[${a}]=-${R}[${b}]\nreturn ${NEXT},${TP}`;
  if (name === 'NOT') return `${R}[${a}]=not ${R}[${b}]\nreturn ${NEXT},${TP}`;
  if (name === 'LEN') return `${R}[${a}]=#${R}[${b}]\nreturn ${NEXT},${TP}`;
  if (name === 'EQ' || name === 'LT' || name === 'LE') {
    const opch = { EQ: '==', LT: '<', LE: '<=' }[name];
    const cond = `${R}[${b}]${opch}${R}[${c}]`;
    const skip = idx + 2;
    if (a !== 0) return `if ${cond} then return ${skip},${TP} else return ${NEXT},${TP} end`;
    return `if not(${cond}) then return ${skip},${TP} else return ${NEXT},${TP} end`;
  }
  if (name === 'JMP') return `return ${idx + 1 + b},${TP}`;
  if (name === 'TEST') {
    const skip = idx + 2;
    const truthy = `(${R}[${a}]~=nil and ${R}[${a}]~=false)`;
    if (b !== 0) return `if ${truthy} then return ${skip},${TP} else return ${NEXT},${TP} end`;
    return `if not ${truthy} then return ${skip},${TP} else return ${NEXT},${TP} end`;
  }
  if (name === 'LOADBOOL') {
    const target = c !== 0 ? idx + 2 : NEXT;
    const boolean = b !== 0 ? 'true' : 'false';
    return `${R}[${a}]=${boolean}\nreturn ${target},${TP}`;
  }
  if (name === 'LOADNIL') return `for i=${a},${a + b} do ${R}[i]=nil end\nreturn ${NEXT},${TP}`;
  if (name === 'FORPREP') {
    const target = idx + 1 + b;
    return `local ST=${R}[${a}+2]\nif ST==0 then error("'for' step is zero") end\n` +
      `${R}[${a}+3]=${R}[${a}]\nreturn ${target},${TP}`;
  }
  if (name === 'FORLOOP') {
    const target = idx + 1 + b;
    return `${R}[${a}]=${R}[${a}]+${R}[${a}+2]\nlocal ST=${R}[${a}+2]\nlocal GO\n` +
      `if ST>0 then GO=${R}[${a}]<=${R}[${a}+1] else GO=${R}[${a}]>=${R}[${a}+1] end\n` +
      `if GO then ${R}[${a}+3]=${R}[${a}] return ${target},${TP} else return ${NEXT},${TP} end`;
  }
  if (name === 'TFORCALL') {
    let body = `local IT=${R}[${a}]\nlocal RS=${pk}(IT(${R}[${a}+1],${R}[${a}+2]))\n`;
    const assigns = [];
    for (let i = 1; i <= c; i++) assigns.push(`${R}[${a}+2+${i}]=RS[${i}]`);
    body += assigns.join('\n');
    return body + `\nreturn ${NEXT},${TP}`;
  }
  if (name === 'TFORLOOP') {
    const target = idx + 1 + b;
    return `if ${R}[${a}+3]==nil then return ${target},${TP} ` +
      `else ${R}[${a}+2]=${R}[${a}+3] return ${NEXT},${TP} end`;
  }
  if (name === 'CLOSURE') {
    const child = flat[b - 1];
    const parts = [];
    for (const [, instack, uidx] of child.upvals) {
      if (instack) parts.push(`${mkup}(${O},${R},${uidx})`);
      else parts.push(`${US}[${uidx}]`);
    }
    const usTbl = '{' + parts.join(',') + '}';
    const pname = protoNames[child.flat_index];
    return `local USn=${usTbl}\n${R}[${a}]=function(...) return ${pname}(USn,...) end\nreturn ${NEXT},${TP}`;
  }
  if (name === 'SETUPVAL') return `local o=${US}[${b}]\nif o.l then o.R[o.r]=${R}[${a}] else o.v=${R}[${a}] end\nreturn ${NEXT},${TP}`;
  if (name === 'GETUPVAL') return `local o=${US}[${b}]\nif o.l then ${R}[${a}]=o.R[o.r] else ${R}[${a}]=o.v end\nreturn ${NEXT},${TP}`;
  if (name === 'NILTO') return `for i=${TP}+1,${a + b - 1} do ${R}[i]=nil end\nreturn ${NEXT},${TP}`;
  if (name === 'VARARG') {
    if (c === 0) return `for i=1,${VN} do ${R}[${a}+i-1]=${VA}[i] end\nreturn ${NEXT},(${a}+${VN}-1)`;
    return `for i=1,${c - 1} do ${R}[${a}+i-1]=${VA}[i] end\nreturn ${NEXT},${TP}`;
  }
  if (name === 'RETURN') {
    const mDecl = b === 0 ? `local M=${TP}-${a}+1` : `local M=${b - 1}`;
    return `${mDecl}\nfor kk,o in pairs(${O}) do o.l=false o.v=o.R[o.r] end\n` +
      `local RET={n=M}\nfor i=1,M do RET[i]=${R}[${a}+i-1] end\n` +
      `return nil,${TP},true,RET`;
  }
  if (name === 'CLOSE') {
    return `for kk,o in pairs(${O}) do if kk>=${a} then o.l=false o.v=o.R[o.r] ${O}[kk]=nil end end\n` +
      `return ${NEXT},${TP}`;
  }
  if (name === 'ITERPREP') {
    return `local T=${R}[${a}]\nif type(T)~='function' then ${R}[${a}]=next ${R}[${a}+1]=T ${R}[${a}+2]=nil end\n` +
      `return ${NEXT},${TP}`;
  }
  throw new Error(`unhandled opcode ${name}`);
}

module.exports = { instrBody, constLit, luaStrLit, CPS_RESERVED_TEMPS };
