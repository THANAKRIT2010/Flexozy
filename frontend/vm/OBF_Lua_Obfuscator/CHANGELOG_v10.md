# v10 — Layered protection

- Six chained-byte outer transport rounds and shuffled indexed payload chunks.
- Per-position instruction operand masking in decoded prototype arrays.
- Randomized bounded state loops around every opcode operation.
- Fixed randomized runtime names colliding with literal helper locals.
- Fixed live upvalues losing false/nil values through an and/or expression.
- Added multi-build equivalence, transport and loop regression tests.
- Remains one genuine program VM; not a clone or security equivalent of Luraph.
