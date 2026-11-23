'use strict';
// Faithful JS port of flatten_handler from core/protection.py.
const { secretsRandbelow, randrange, shuffle } = require('./vmgen.js');

const MIN_DECOY_STATES = 6, MAX_DECOY_STATES = 14;

// Unique random samples from [lo, hi) without replacement, mirroring Python's random.sample(range(lo,hi), k).
function sampleRange(lo, hi, k) {
  const seen = new Set();
  const out = [];
  while (out.length < k) {
    const v = lo + secretsRandbelow(hi - lo);
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function flattenHandler(body, stateName, scratchName) {
  const decoyCount = randrange(MIN_DECOY_STATES, MAX_DECOY_STATES + 1);
  const labels = sampleRange(1000, 900000, decoyCount + 3);
  const first = labels[0], execute = labels[labels.length - 2], finish = labels[labels.length - 1];
  const decoys = labels.slice(1, 1 + decoyCount);
  const chain = [first, ...decoys, execute];
  const branches = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const cur = chain[i], nxt = chain[i + 1];
    const salt = randrange(0, 10000) + 1;
    const op = secretsRandbelow(2) === 0
      ? `(${scratchName}+${salt})%65521`
      : `(${scratchName}-${salt})%65521`;
    branches.push(`${stateName}==${cur} then ${scratchName}=${op} ${stateName}=${nxt}`);
  }
  branches.push(`${stateName}==${execute} then do ${body} end ${stateName}=${finish}`);
  shuffle(branches);
  return (
    `do local ${stateName}=${first} local ${scratchName}=0 ` +
    `while ${stateName}~=${finish} do if ` + branches.join(' elseif ') +
    ' else error("invalid dispatch state") end end end'
  );
}

module.exports = { flattenHandler, MIN_DECOY_STATES, MAX_DECOY_STATES };
