'use strict';
// Faithful JS port of core/pipeline.py's public obfuscate() entry point (the only one the
// CLI / website need — obfuscate_source, obfuscate_source_cps and obfuscate_stats are other
// backends the Python project also exposes but the default tool never calls).
const { Compiler, OPNAMES } = require('./compile.js');
const { applyBuildFlags } = require('./buildflags.js');
const { buildRuntimeMixed } = require('./vmgen_mixed.js');
const { shuffle } = require('./vmgen.js');
const { LuaSyntaxError } = require('./luaparse.js');
const { BuildFlagError } = require('./buildflags.js');

function randomOpmap() {
  const nums = [];
  for (let i = 1; i <= OPNAMES.length; i++) nums.push(i);
  shuffle(nums);
  const map = {};
  OPNAMES.forEach((name, i) => { map[name] = nums[i]; });
  return map;
}

const DEFAULT_MAX_CHARS = 6000000;
const PRESETS = { DEFAULT: [1.0, 0.5, 0.0], FAST: [0.5] };

// Throws LuaSyntaxError (parse error) or BuildFlagError (used FLE_OBFUSCATED as a name) on bad input.
function obfuscate(source, maxChars = DEFAULT_MAX_CHARS, preset = 'DEFAULT') {
  if (typeof source !== 'string') throw new TypeError('source must be str');
  if (!source.trim()) throw new RangeError('Input source is empty');
  if (maxChars <= 0) throw new RangeError('max_chars must be positive');
  if (!Object.prototype.hasOwnProperty.call(PRESETS, preset)) {
    throw new RangeError(`unknown preset ${JSON.stringify(preset)}; choose one of ${Object.keys(PRESETS).sort()}`);
  }
  const opmap = randomOpmap();
  const comp = new Compiler(opmap);
  const main = comp.compileChunk(source, applyBuildFlags);
  const flat = comp.flatten(main);
  let out = '';
  for (const ratio of PRESETS[preset]) {
    out = buildRuntimeMixed(flat, opmap, ratio);
    if (out.length <= maxChars) break;
  }
  if (out.includes('\n') || out.includes('\r')) throw new Error('internal: output is not single-line');
  return out;
}

module.exports = { obfuscate, randomOpmap, DEFAULT_MAX_CHARS, PRESETS, LuaSyntaxError, BuildFlagError };
