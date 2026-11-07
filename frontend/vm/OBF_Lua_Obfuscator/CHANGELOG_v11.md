# Changelog — v11

## Heavy thickness build

- Transport layers around the payload raised from 6 to 10 chained-byte rounds;
  chunk size halved so the embedded data table has roughly twice the entries,
  emitted in shuffled logical order.
- Opcode handler state machines now randomize between 5 and 7 states per
  handler (previously always 3), with per-build multipliers and salts.
- New junk farm: 24 branded junk functions plus inline blocks, totalling at
  least 240 blocks (scaling with payload size, capped at 1200). Every block
  declares throwaway locals, runs small bounded loops and arithmetic on local
  tables only. No globals, no side effects, no unbounded loops.
- Every junk call site and many blocks carry Flexozy credit strings (padded
  with random hex filler); each build embeds thousands of them.
- Runtime loop now maintains a per-fetch checksum over masked operands.
- Whole runtime wrapped in a two-deep extra IIFE wrapper chain on top of the
  existing entry.
- Identifier pool widened (2-4 character unique names) to support the large
  junk variable population.

## Verified

- All sample programs pass repeated randomized equivalence runs against the
  original under the Luau CLI (stdout and exit code identical).
- Byte-value round-trip, bounded-handler single-execution and thickness
  assertions included in the test suite.

## Hotfix — return of multi-value calls

- Fixed `return f(...)` / `return ...` (and any `return` whose final expression
  is a call or vararg) producing an extra leading `nil`. The compiler reserved a
  register before the final call, so the call's results landed one slot above
  where RETURN read them. Symptoms: intermittent or wrong values, `nil` where a
  table was expected (e.g. `return setmetatable(...)` followed by field access).
- Added `tests/samples/returns.luau` as a regression sample.
