'use strict';
// Faithful JS port of core/buildflags.py.
// NOTE on porting approach: Python's AST uses tuples for nodes and lists for child
// sequences, and _fold/_check_reserved there exploit that type difference to know when to
// treat element 0 as a tag vs. just another child. In this JS port every AST node is a
// plain array (see luaparse.js), so that trick isn't available — instead this is an
// explicit, shape-aware walk over every node kind the parser can produce. It implements
// exactly the same two behaviours as the Python version: (1) reject any source that
// declares/assigns/parameterizes a variable named FLE_OBFUSCATED, (2) fold FLE_OBFUSCATED
// references to `true` and simplify `if`-statements whose condition becomes a compile-time
// constant, dropping the unreachable arm entirely. Nothing else in the tree is touched.
const LuaSyntaxError = require('./luaparse.js').LuaSyntaxError;

const FLAG_NAME = 'FLE_OBFUSCATED';

class BuildFlagError extends LuaSyntaxError {}

function checkReservedBlock(block) {
  const [, stats, ret] = block;
  for (const st of stats) checkReservedStat(st);
  if (ret) checkReservedExprs(ret[1]);
}
function checkReservedStat(st) {
  const k = st[0];
  if (k === 'Local') {
    if (st[1].includes(FLAG_NAME)) throw new BuildFlagError(`${FLAG_NAME} is reserved and cannot be declared`);
    if (st[2]) checkReservedExprs(st[2]);
  } else if (k === 'Assign') {
    for (const t of st[1]) if (t[0] === 'Var' && t[1] === FLAG_NAME) throw new BuildFlagError(`${FLAG_NAME} is reserved and cannot be assigned`);
    for (const t of st[1]) checkReservedExpr(t);
    checkReservedExprs(st[2]);
  } else if (k === 'Compound') {
    if (st[1][0] === 'Var' && st[1][1] === FLAG_NAME) throw new BuildFlagError(`${FLAG_NAME} is reserved and cannot be assigned`);
    checkReservedExpr(st[1]); checkReservedExpr(st[3]);
  } else if (k === 'Call' || k === 'Method') {
    checkReservedExpr(st);
  } else if (k === 'Do') {
    checkReservedBlock(st[1]);
  } else if (k === 'While') {
    checkReservedExpr(st[1]); checkReservedBlock(st[2]);
  } else if (k === 'Repeat') {
    checkReservedBlock(st[1]); checkReservedExpr(st[2]);
  } else if (k === 'If') {
    for (const [cond, body] of st[1]) { checkReservedExpr(cond); checkReservedBlock(body); }
    if (st[2]) checkReservedBlock(st[2]);
  } else if (k === 'ForNum') {
    checkReservedExpr(st[2]); checkReservedExpr(st[3]); if (st[4]) checkReservedExpr(st[4]);
    checkReservedBlock(st[5]);
  } else if (k === 'ForIn') {
    checkReservedExprs(st[2]); checkReservedBlock(st[3]);
  } else if (k === 'FuncDecl') {
    checkReservedFunc(st[2]);
  }
  // Break/Continue/Goto/Label: nothing to check
}
function checkReservedExprs(exprs) { for (const e of exprs) checkReservedExpr(e); }
function checkReservedFunc(fn) {
  if (fn[1].includes(FLAG_NAME)) throw new BuildFlagError(`${FLAG_NAME} is reserved and cannot be a parameter`);
  checkReservedBlock(fn[3]);
}
function checkReservedExpr(e) {
  if (!Array.isArray(e)) return;
  const k = e[0];
  if (k === 'Index') { checkReservedExpr(e[1]); checkReservedExpr(e[2]); }
  else if (k === 'Call') { checkReservedExpr(e[1]); checkReservedExprs(e[2]); }
  else if (k === 'Method') { checkReservedExpr(e[1]); checkReservedExprs(e[3]); }
  else if (k === 'Func') checkReservedFunc(e);
  else if (k === 'Bin' || k === 'And' || k === 'Or' || k === 'Concat') { checkReservedExpr(e[2] ?? e[1]); checkReservedExpr(e[3] ?? e[2]); }
  else if (k === 'Cmp') { checkReservedExpr(e[2]); checkReservedExpr(e[3]); }
  else if (k === 'Un') checkReservedExpr(e[2]);
  else if (k === 'Paren') checkReservedExpr(e[1]);
  else if (k === 'IfExpr') {
    for (const [cond, then] of e[1]) { checkReservedExpr(cond); checkReservedExpr(then); }
    checkReservedExpr(e[2]);
  } else if (k === 'Table') {
    for (const f of e[1]) { if (f[0] === 'k') { checkReservedExpr(f[1]); checkReservedExpr(f[2]); } else checkReservedExpr(f[1]); }
  }
}

function constTruth(node) {
  if (!Array.isArray(node) || !node.length) return null;
  const tag = node[0];
  if (tag === 'True') return true;
  if (tag === 'False' || tag === 'Nil') return false;
  if (tag === 'Un' && node[1] === 'not') {
    const inner = constTruth(node[2]);
    if (inner !== null) return !inner;
  }
  return null;
}

function foldBlock(block) {
  const [, stats, ret] = block;
  const newStats = [];
  for (const st of stats) newStats.push(foldStat(st));
  const newRet = ret ? ['Return', ret[1].map(foldExpr)] : ret ?? null;
  return ['Block', newStats, newRet];
}
function foldStat(st) {
  const k = st[0];
  if (k === 'Local') return ['Local', st[1], st[2] ? st[2].map(foldExpr) : st[2]];
  if (k === 'Assign') return ['Assign', st[1].map(foldExpr), st[2].map(foldExpr)];
  if (k === 'Compound') return ['Compound', foldExpr(st[1]), st[2], foldExpr(st[3])];
  if (k === 'Call' || k === 'Method') return foldExpr(st);
  if (k === 'Do') return ['Do', foldBlock(st[1])];
  if (k === 'While') return ['While', foldExpr(st[1]), foldBlock(st[2])];
  if (k === 'Repeat') return ['Repeat', foldBlock(st[1]), foldExpr(st[2])];
  if (k === 'If') return foldIf(st);
  if (k === 'ForNum') return ['ForNum', st[1], foldExpr(st[2]), foldExpr(st[3]), st[4] ? foldExpr(st[4]) : st[4], foldBlock(st[5])];
  if (k === 'ForIn') return ['ForIn', st[1], st[2].map(foldExpr), foldBlock(st[3])];
  if (k === 'FuncDecl') return ['FuncDecl', st[1], foldFunc(st[2])];
  return st; // Break/Continue/Goto/Label
}
function foldIf(st) {
  const [, arms, els] = st;
  const kept = [];
  for (const [cond, body] of arms) {
    const fc = foldExpr(cond);
    const truth = constTruth(fc);
    if (truth === null) { kept.push([fc, foldBlock(body)]); continue; }
    if (truth) {
      if (!kept.length) return ['Do', foldBlock(body)];
      return ['If', kept, foldBlock(body)];
    }
    // always-false arm: drop it
  }
  if (!kept.length) return ['Do', els ? foldBlock(els) : ['Block', [], null]];
  return ['If', kept, els ? foldBlock(els) : null];
}
function foldFunc(fn) { return ['Func', fn[1], fn[2], foldBlock(fn[3])]; }
function foldExpr(e) {
  if (!Array.isArray(e)) return e;
  const k = e[0];
  if (k === 'Var' && e[1] === FLAG_NAME) return ['True'];
  if (k === 'Un' && e[1] === 'not') {
    const folded = ['Un', 'not', foldExpr(e[2])];
    const truth = constTruth(folded);
    if (truth !== null) return truth ? ['True'] : ['False'];
    return folded;
  }
  if (k === 'Index') return ['Index', foldExpr(e[1]), foldExpr(e[2])];
  if (k === 'Call') return ['Call', foldExpr(e[1]), e[2].map(foldExpr)];
  if (k === 'Method') return ['Method', foldExpr(e[1]), e[2], e[3].map(foldExpr)];
  if (k === 'Func') return foldFunc(e);
  if (k === 'Bin') return ['Bin', e[1], foldExpr(e[2]), foldExpr(e[3])];
  if (k === 'Cmp') return ['Cmp', e[1], foldExpr(e[2]), foldExpr(e[3])];
  if (k === 'Concat') return ['Concat', foldExpr(e[1]), foldExpr(e[2])];
  if (k === 'And') return ['And', foldExpr(e[1]), foldExpr(e[2])];
  if (k === 'Or') return ['Or', foldExpr(e[1]), foldExpr(e[2])];
  if (k === 'Un') return ['Un', e[1], foldExpr(e[2])];
  if (k === 'Paren') return ['Paren', foldExpr(e[1])];
  if (k === 'IfExpr') return ['IfExpr', e[1].map(([c, t]) => [foldExpr(c), foldExpr(t)]), foldExpr(e[2])];
  if (k === 'Table') return ['Table', e[1].map((f) => (f[0] === 'k' ? ['k', foldExpr(f[1]), foldExpr(f[2])] : ['v', foldExpr(f[1])]))];
  return e; // Num/Str/Nil/True/False/Vararg
}

function applyBuildFlags(ast) {
  checkReservedBlock(ast);
  return foldBlock(ast);
}

module.exports = { applyBuildFlags, BuildFlagError, FLAG_NAME };
