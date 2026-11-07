# Flexozy v11 — Heavy Layered Executor VM

Executor-only Luau obfuscator. Requires Python 3.10+; no pip dependencies.
Produces a single physical line containing custom bytecode, its interpreter,
and a heavy junk/credit layer for maximum thickness.

## Run

Extract the ZIP, open a terminal in `OBF_Lua_Obfuscator`, then run:

```sh
python obf.py input.luau -o output.luau
```

On Windows, `py` can replace `python`. Paste the contents of the generated
output file into your target executor. Test with your own authorized scripts.
Keep the original source separately.

## v11 layers (always enabled)

1. Parse and compile source into a custom register-based instruction set.
2. Randomize opcode numbers, handler order, generated names and keys each build.
3. Apply the existing two keyed XOR/additive payload transforms.
4. Apply ten chained-byte transport rounds, each with a fresh key, stride and
   initial value. Each byte depends on the preceding ciphertext byte.
5. Split the resulting data into explicitly indexed chunks (48 bytes each) and
   shuffle their physical order before embedding.
6. Mask opcode/register/branch arrays with per-build, position-dependent offsets
   after loading, and remove masks at instruction fetch.
7. Execute each opcode inside its own shuffled 5-7-state bounded loop.
   The actual operation runs once; arithmetic state transitions surround it.
8. Junk farm: 24 branded junk functions plus inline blocks (at least 240 and up
   to 1200 per build, scaled with payload size), each full of throwaway locals,
   small bounded loops and local-only arithmetic. No side effects.
9. Thousands of Flexozy credit strings are embedded across junk blocks, junk
   call sites and dedicated locals; every build rewrites them with new random
   hex filler.
10. The interpreter loop maintains a per-fetch checksum over masked operands,
    and the whole runtime sits inside a two-deep extra wrapper chain.

These are additional layers around ONE actual program VM, not six nested VMs.
The junk and loops intentionally terminate; they are not infinite loops or
runtime heavyweights — the thickness is structural and load-time only. More
output bytes do not prove stronger security. No loadstring, remote loader,
anti-debug, or executor-specific bypass is added.

## Tests

Install the official Luau CLI separately. Point `LUAU_BIN` to it, then run:

```sh
python -m unittest discover -s tests -v
```

Windows PowerShell example:

```powershell
$env:LUAU_BIN = 'C:\\tools\\luau.exe'
python -m unittest discover -s tests -v
```

Tests compare original and protected stdout and exit status. Layer regressions
also exercise all byte values, bounded handler execution and 20 independently
randomized builds of each sample. Thickness tests assert output size and credit
density. Luau is NOT included in this ZIP.

## Limits and honest expectations

- This is an independent implementation, NOT Luraph 15.1 or an equivalent
  security guarantee. Output is intentionally thicker than typical Luraph
  files, but thickness is not strength.
- Embedded keys and decode routines can be recovered. Client-side protection
  cannot prevent a determined analyst from inspecting execution or dumping data.
- Added junk raises load time and file size (typically 100-400 KB for small
  scripts), particularly for large scripts; the interpreter loop itself gains
  only one checksum line per instruction.
- The custom parser implements a subset of Luau, not all syntax or every runtime
  behavior. Do not assume it accepts already-obfuscated Luraph scripts.
- `goto` is unsupported; Roblox/executor APIs require the actual host environment.
- Local CLI tests do NOT verify any Roblox executor. No universal compatibility
  claim is made; test your chosen executor before distribution.
- Metatable/reflection/debug features, environment mutation and unusual scope
  patterns can expose VM differences not covered by the fixtures.
