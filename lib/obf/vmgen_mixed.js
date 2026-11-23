'use strict';
// Faithful JS port of core/vmgen_mixed.py — the "mixed" runtime backend, which is what
// the default obfuscate() entry point (and so the website's Obfuscate button) uses.
const { genNames, junkPreamble, junkFunctions, lit, secretsRandbelow, shuffle } = require('./vmgen.js');
const { instrBody, CPS_RESERVED_TEMPS } = require('./vmgen_cps.js');
const { flattenHandler } = require('./protection.js');

const DEC_STRIDE = 7;
const DEFAULT_DECOY_RATIO = 1.0;

function encStr(data, key) {
  // hex-encode with additive key stream: (b + key + j*STRIDE) % 256, matching _enc_str byte-for-byte
  let out = '';
  for (let j = 0; j < data.length; j++) {
    const b = data.charCodeAt(j);
    const v = (b + key + j * DEC_STRIDE) % 256;
    out += v.toString(16).toUpperCase().padStart(2, '0');
  }
  return out;
}

function decoderSrc(name, h, k, o, j, i) {
  return `local function ${name}(${h},${k}) local ${o}={} local ${j}=0 ` +
    `for ${i}=1,#${h},2 do ${o}[#${o}+1]=string.char((tonumber(string.sub(${h},${i},${i}+1),16)` +
    `-(${k}+${j}*${DEC_STRIDE}))%256) ${j}=${j}+1 end return table.concat(${o}) end`;
}

function buildRuntimeMixed(flat, opmap, decoyRatio = DEFAULT_DECOY_RATIO) {
  const rev = {};
  for (const name in opmap) rev[opmap[name]] = name;

  const poolSize = 3 * flat.length + 40;
  const pool = genNames(poolSize, CPS_RESERVED_TEMPS);
  let pi = 0;
  const next = () => pool[pi++];
  const protoNames = {}, stateNames = {}, ktNames = {};
  for (const fs of flat) protoNames[fs.flat_index] = next();
  for (const fs of flat) stateNames[fs.flat_index] = next();
  for (const fs of flat) ktNames[fs.flat_index] = next();
  const [nR, nTP, nO, nVA, nVN, nUS] = [next(), next(), next(), next(), next(), next()];
  const [nENV, npk, nup, nmkup] = [next(), next(), next(), next()];
  const [nic, nlk, ni3, nres2, nok2] = [next(), next(), next(), next(), next()];
  const [nstate, nscratch, nok, nmkr] = [next(), next(), next(), next()];
  const [nDEC, dh, dk, do_, dj, di] = [next(), next(), next(), next(), next(), next()];

  const names = { sig: [nR, nTP, nO, nVA, nVN, nUS], env: nENV, mkup: nmkup, pk: npk, up: nup };

  const parts = [];
  parts.push(`local ${nENV}`);
  parts.push(`local ${nok},${nENV}=pcall(getfenv)`);
  parts.push(`if not ${nok} then ${nENV}=setmetatable({},{__index=_G}) end`);
  parts.push(
    `local ${npk}=table.pack or function(...) local T={} local n=select('#',...) ` +
    `for i=1,n do T[i]=select(i,...) end T.n=n return T end`
  );
  parts.push(`local ${nup}=table.unpack or unpack`);
  parts.push(
    `local function ${nmkup}(${nO},${nR},${nmkr}) local o=${nO}[${nmkr}] ` +
    `if not o then o={l=true,R=${nR},r=${nmkr},v=nil} ${nO}[${nmkr}]=o end return o end`
  );
  parts.push(decoderSrc(nDEC, dh, dk, do_, dj, di));
  parts.push('do');
  parts.push(` local ${nic}=iscclosure`);
  parts.push(` if type(${nic})=='function' then`);
  parts.push(`  local ${nlk}={pcall,type,setmetatable,rawget,tostring,error}`);
  parts.push(`  for ${ni3}=1,#${nlk} do`);
  parts.push(`   local ${nok2},${nres2}=pcall(${nic},${nlk}[${ni3}])`);
  parts.push(`   if ${nok2} and ${nres2}==false then error("integrity check failed") end`);
  parts.push('  end');
  parts.push(' end');
  parts.push('end');

  const allProtoLocals = flat.map((fs) => protoNames[fs.flat_index]).join(',');
  parts.push(`local ${allProtoLocals}`);

  const junkExcl = new Set([...pool, nstate, nscratch, nok]);
  parts.push('do');
  parts.push(junkPreamble(junkExcl));
  parts.push(junkFunctions(junkExcl));
  parts.push('end');

  for (const fs of flat) {
    const sname = stateNames[fs.flat_index];
    const pname = protoNames[fs.flat_index];
    const ktname = ktNames[fs.flat_index];

    const strEntries = [];
    fs.consts.forEach(([kind, val], i0) => {
      const ci = i0 + 1;
      if (kind === 's') {
        const key = secretsRandbelow(256);
        strEntries.push(`[${ci}]=${nDEC}("${encStr(val, key)}",${key})`);
      }
    });
    const kref = (i) => `${ktname}[${i}]`;
    const hasPool = strEntries.length > 0;

    const entries = [];
    for (let idx = 0; idx < fs.code.length; idx++) {
      const body = instrBody(fs, idx, rev, flat, protoNames, names, kref);
      const fnBody = flattenHandler(body, nstate, nscratch);
      entries.push(`[${lit(idx)}]=function(${nR},${nTP},${nO},${nVA},${nVN},${nUS})\n${fnBody}\nend`);
    }

    const nDecoys = Math.round(fs.code.length * decoyRatio);
    const usedKeys = new Set();
    for (let d = 0; d < nDecoys; d++) {
      let dkey;
      for (;;) {
        dkey = -(secretsRandbelow(900000) + 1);
        if (!usedKeys.has(dkey)) { usedKeys.add(dkey); break; }
      }
      const ka = secretsRandbelow(65000) + 2, kb = secretsRandbelow(65000) + 2, kc = secretsRandbelow(65000) + 2;
      const retTo = secretsRandbelow(Math.max(1, fs.code.length));
      const body = `local Q=(${nTP}*${ka}+${kb})%65521 ` +
        `local W=(Q*${kc})%65537 ` +
        `if W%2==0 then W=W+${ka} end ` +
        `return ${retTo},${nTP}`;
      const fnBody = flattenHandler(body, nstate, nscratch);
      entries.push(`[${dkey}]=function(${nR},${nTP},${nO},${nVA},${nVN},${nUS})\n${fnBody}\nend`);
    }
    shuffle(entries);

    parts.push('do');
    if (hasPool) parts.push(`local ${ktname}={` + strEntries.join(',') + '}');
    parts.push(`local ${sname}={` + entries.join(',') + '}');
    parts.push(
      `${pname}=function(${nUS},...)\n` +
      ` local ${nR}={}\n local ${nO}={}\n local ${nVA}={...}\n` +
      ` local ${nVN}=select('#',...)\n` +
      ` for i=1,${fs.nparams} do ${nR}[i-1]=${nVA}[i] end\n` +
      ` local ${nTP}=0\n local st=0\n` +
      ` while true do\n` +
      `  local p1,p2,p3,p4=${sname}[st](${nR},${nTP},${nO},${nVA},${nVN},${nUS})\n` +
      `  if p3 then return ${nup}(p4,1,p4.n) end\n` +
      `  st,${nTP}=p1,p2\n` +
      ` end\n` +
      `end`
    );
    parts.push('end');
  }

  const mainName = protoNames[flat[flat.length - 1].flat_index];
  const bodySrc = parts.join('\n');
  let src = `return(function(...)\n${bodySrc}\nreturn ${mainName}({},...)\nend)(...)\n`;
  src = src.trim().split(/\s+/).join(' ');
  if (src.includes('@')) throw new Error('internal: unexpected @ in generated source');
  return src;
}

module.exports = { buildRuntimeMixed, encStr, decoderSrc, DEC_STRIDE, DEFAULT_DECOY_RATIO };
