/**
 * Compile Luau through the private Vercel Python service binding.
 * Local development may use the original Python CLI as a fallback.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = promisify(execFile);
const MAX_SOURCE_CHARS = 200_000;
const MAX_OUTPUT_CHARS = 1_500_000;

async function compileLocally(source) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'flexozy-vm-'));
  const input = path.join(dir, 'input.luau');
  const output = path.join(dir, 'output.luau');
  const root = process.cwd();
  const compiler = path.join(root, 'vm', 'OBF_Lua_Obfuscator', 'obf.py');
  const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
  try {
    await writeFile(input, source, 'utf8');
    const { stdout } = await execFileAsync(python, [compiler, input, '-o', output], {
      timeout: 120000, maxBuffer: 8 * 1024 * 1024, windowsHide: true
    });
    const result = (await readFile(output, 'utf8')).trim();
    if (!result || /[\r\n]/.test(result) || result.length > MAX_OUTPUT_CHARS) {
      throw new Error('vm_invalid_output');
    }
    console.info('[Flexozy VM local]', stdout.trim());
    return result;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function compileWithFlexozyVM(source) {
  if (typeof source !== 'string' || !source.trim()) throw new Error('empty_script');
  if (source.length > MAX_SOURCE_CHARS) throw new Error('too_large');

  const serviceBase = process.env.FLEXOZY_VM_SERVICE_URL;
  if (!serviceBase) {
    if (process.env.VERCEL) throw new Error('vm_service_not_configured');
    return compileLocally(source);
  }

  const secret = process.env.FLEXOZY_VM_COMPILER_SECRET;
  if (!secret) throw new Error('vm_service_secret_not_configured');
  const endpoint = new URL('api/compile', serviceBase.endsWith('/') ? serviceBase : `${serviceBase}/`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flexozy-compiler-secret': secret
      },
      body: JSON.stringify({ source }),
      cache: 'no-store',
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = String(result.message || result.error || `http_${response.status}`).slice(0, 900);
      throw new Error(`vm_compile_failed: ${message}`);
    }
    const output = result.output;
    if (typeof output !== 'string' || !output || output.length > MAX_OUTPUT_CHARS || /[\r\n]/.test(output)) {
      throw new Error('vm_invalid_output');
    }
    return output;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('vm_compile_timeout');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
