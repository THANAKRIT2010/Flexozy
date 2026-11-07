"""Integration tests: obfuscated output must behave exactly like the source.

Runs every sample under a real Luau runtime twice (original vs obfuscated) and
compares stdout and exit codes. Set LUAU_BIN if the runtime is elsewhere.
"""
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.pipeline import obfuscate_source  # noqa: E402
from core.luaparse import LuaSyntaxError  # noqa: E402

LUAU = os.environ.get('LUAU_BIN', '/tmp/luau-bin/bin/luau')


def run_file(path: Path, tmp: Path, name: str):
    out = tmp / name
    proc = subprocess.run([LUAU, str(path)], capture_output=True, text=True, timeout=120)
    return proc.returncode, proc.stdout, proc.stderr


import re  # noqa: E402

# Error text carries the source path and line of whichever file raised it;
# original and obfuscated files legitimately differ there, so normalize both.
_ERR_LOC = re.compile(r'\S*\.luau:\d+: ')


def normalize(s: str) -> str:
    return _ERR_LOC.sub('<loc>: ', s)


@unittest.skipIf(not os.path.exists(LUAU), f'Luau runtime not found at {LUAU}')
class VmEquivalenceTests(unittest.TestCase):
    def test_samples_match_original(self):
        samples = sorted((ROOT / 'tests' / 'samples').glob('*.luau'))
        self.assertTrue(samples, 'no samples found')
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            for sample in samples:
                with self.subTest(sample=sample.name):
                    src = sample.read_text(encoding='utf-8')
                    obf = obfuscate_source(src)
                    self.assertNotIn('\n', obf)
                    self.assertNotIn('\r', obf)
                    obf_path = tmp / ('obf_' + sample.name)
                    obf_path.write_text(obf + '\n', encoding='utf-8')
                    rc1, so1, se1 = run_file(sample, tmp, 'orig.luau')
                    rc2, so2, se2 = run_file(obf_path, tmp, 'obf.luau')
                    self.assertEqual(rc2, 0,
                                     f'{sample.name}: obfuscated exited {rc2}\nstderr: {se2[-2000:]}')
                    self.assertEqual(rc1, 0, f'{sample.name}: original exited {rc1}')
                    self.assertEqual(normalize(so1), normalize(so2),
                                     f'{sample.name}: stdout differs\n--- original ---\n{so1}\n--- obfuscated ---\n{so2}')

    def test_vm_build_is_nondeterministic(self):
        src = 'print("x")'
        self.assertNotEqual(obfuscate_source(src), obfuscate_source(src))

    def test_syntax_error_rejected(self):
        with self.assertRaises(LuaSyntaxError):
            obfuscate_source('local x = do end then')

    def test_empty_rejected(self):
        with self.assertRaises(ValueError):
            obfuscate_source('   ')

    def test_no_leftover_source_identifiers(self):
        src = 'local secretName = "hidden"\nprint(secretName)\n'
        out = obfuscate_source(src)
        self.assertNotIn('secretName', out)
        self.assertNotIn('hidden', out)


if __name__ == '__main__':
    unittest.main(verbosity=2)
