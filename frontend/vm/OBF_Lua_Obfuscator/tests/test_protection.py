"""Regression checks for layered generation under many randomized builds."""
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.pipeline import obfuscate_source
from core.protection import PAYLOAD_ROUNDS, protect_payload, flatten_handler
from test_vm_equivalence import LUAU, normalize

@unittest.skipUnless(os.path.exists(LUAU), 'Luau CLI required')
class ProtectionTests(unittest.TestCase):
    def evaluate(self, code):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / 'probe.luau'
            path.write_text(code)
            result = subprocess.run([LUAU, str(path)], capture_output=True, text=True, timeout=20)
            self.assertEqual(result.returncode, 0, result.stderr[-2000:])
            return normalize(result.stdout)

    def test_ten_transport_rounds_preserve_all_bytes(self):
        self.assertEqual(PAYLOAD_ROUNDS, 10)
        data = bytes(range(256)) * 3
        output = self.evaluate('print(' + protect_payload(data.hex()) + ')')
        self.assertEqual(output.strip(), data.hex().upper())

    def test_bounded_handler_runs_body_once(self):
        for _ in range(10):
            code = 'local n=0 ' + flatten_handler('n=n+1', 'state', 'scratch') + ' print(n)'
            self.assertEqual(self.evaluate(code).strip(), '1')

    def test_repeated_randomized_equivalence(self):
        samples = sorted((ROOT / 'tests/samples').glob('*.luau'))
        for sample in samples:
            source = sample.read_text()
            expected = self.evaluate(source)
            for iteration in range(20):
                with self.subTest(sample=sample.name, build=iteration):
                    self.assertEqual(self.evaluate(obfuscate_source(source)), expected)

if __name__ == '__main__':
    unittest.main(verbosity=2)
