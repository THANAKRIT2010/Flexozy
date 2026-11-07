#!/usr/bin/env python3
"""Flexozy Executor VM obfuscator (v11 heavy).

Compiles Luau source into layered encoded bytecode with bounded dispatch loops,
a branded junk farm and thousands of embedded Flexozy credits. Output is a
single physical line for executor paste fields.
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from core.pipeline import obfuscate_stats  # noqa: E402
from core.luaparse import LuaSyntaxError  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(
        description='Flexozy v11 Heavy Layered Executor VM (single-line output)')
    p.add_argument('input', help='Input .lua/.luau file')
    p.add_argument('-o', '--output', required=True, help='Output file (one line)')
    args = p.parse_args()
    src_path = Path(args.input)
    if not src_path.exists():
        print(f'error: input not found: {src_path}', file=sys.stderr)
        return 1
    source = src_path.read_text(encoding='utf-8')
    try:
        out, stats = obfuscate_stats(source)
    except LuaSyntaxError as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 1
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out + '\n', encoding='utf-8')
    print(f'VM build OK: {stats["protos"]} protos, {stats["instructions"]} instructions, '
          f'{stats["constants"]} constants, payload {stats["payload_bytes"]} bytes, '
          f'output {len(out)} chars, 1 line')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
