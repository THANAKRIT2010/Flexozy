from http.server import BaseHTTPRequestHandler
import hmac
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from core.pipeline import obfuscate_stats
from core.luaparse import LuaSyntaxError

MAX_SOURCE_CHARS = 200_000
MAX_OUTPUT_CHARS = 1_500_000

class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path.split('?', 1)[0] != '/api/compile':
            return self._send(404, {'error': 'not_found'})

        expected = os.environ.get('FLEXOZY_VM_COMPILER_SECRET', '')
        supplied = self.headers.get('x-flexozy-compiler-secret', '')
        if not expected or not hmac.compare_digest(supplied, expected):
            return self._send(404, {'error': 'not_found'})

        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 1_000_000:
                return self._send(413, {'error': 'request_too_large'})
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            source = payload.get('source') if isinstance(payload, dict) else None
            if not isinstance(source, str) or not source.strip():
                return self._send(400, {'error': 'empty_script'})
            if len(source) > MAX_SOURCE_CHARS:
                return self._send(413, {'error': 'too_large'})

            output, stats = obfuscate_stats(source)
            if not output or len(output) > MAX_OUTPUT_CHARS or '\n' in output or '\r' in output:
                return self._send(422, {'error': 'vm_invalid_output'})
            return self._send(200, {'ok': True, 'output': output, 'stats': stats})
        except LuaSyntaxError as exc:
            return self._send(422, {'error': 'lua_syntax_error', 'message': str(exc)[:800]})
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
            return self._send(400, {'error': 'bad_request', 'message': str(exc)[:300]})
        except Exception as exc:
            return self._send(500, {'error': 'vm_compile_failed', 'message': str(exc)[:500]})

    def do_GET(self):
        return self._send(405, {'error': 'method_not_allowed'})

    def log_message(self, fmt, *args):
        # Avoid logging submitted source or secret-bearing headers.
        sys.stderr.write('[Flexozy VM service] ' + (fmt % args) + '\n')
