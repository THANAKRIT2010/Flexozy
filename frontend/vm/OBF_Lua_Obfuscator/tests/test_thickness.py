"""Thickness checks for the v11 heavy build."""
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys_path = str(ROOT)
import sys  # noqa: E402

sys.path.insert(0, sys_path)

from core.pipeline import obfuscate_source  # noqa: E402
from test_vm_equivalence import LUAU, normalize  # noqa: E402


@unittest.skipUnless(os.path.exists(LUAU), 'Luau CLI required')
class ThicknessTests(unittest.TestCase):
    def build(self, source):
        out = obfuscate_source(source)
        self.assertNotIn('\n', out)
        self.assertNotIn('\r', out)
        return out

    def test_credit_density_and_size(self):
        source = (ROOT / 'tests/samples/basics.luau').read_text()
        out = self.build(source)
        # Heavy build: well over 100k chars and hundreds of Flexozy credits.
        self.assertGreater(len(out), 100000)
        self.assertGreaterEqual(out.count('Flexozy'), 300)
        self.assertGreaterEqual(out.count('do local'), 200)

    def test_obfuscated_sample_still_matches_original(self):
        sample = ROOT / 'tests/samples/advanced.luau'
        source = sample.read_text()
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td)
            a = tmp / 'orig.luau'
            a.write_text(source)
            b = tmp / 'heavy.luau'
            b.write_text(self.build(source) + '\n')
            for path in (a, b):
                proc = subprocess.run([LUAU, str(path)], capture_output=True,
                                      text=True, timeout=120)
                self.assertEqual(proc.returncode, 0, proc.stderr[-2000:])
            orig = subprocess.run([LUAU, str(a)], capture_output=True,
                                  text=True, timeout=120).stdout
            heavy = subprocess.run([LUAU, str(b)], capture_output=True,
                                   text=True, timeout=120).stdout
            self.assertEqual(normalize(orig), normalize(heavy))


if __name__ == '__main__':
    unittest.main(verbosity=2)
