"""Flexozy Executor VM pipeline: source -> encrypted bytecode + embedded VM."""
from __future__ import annotations
import secrets

from core.luaparse import LuaSyntaxError
from core.compile import Compiler, OPNAMES
from core.serialize import serialize, encrypt
from core.vmgen import build_runtime


def random_opmap() -> dict:
    nums = list(range(1, len(OPNAMES) + 1))
    secrets.SystemRandom().shuffle(nums)
    return dict(zip(OPNAMES, nums))


def obfuscate_source(source: str) -> str:
    """Compile Luau source into a single-line executor script with an embedded VM."""
    if not isinstance(source, str):
        raise TypeError('source must be str')
    if not source.strip():
        raise ValueError('Input source is empty')
    opmap = random_opmap()
    comp = Compiler(opmap)
    main = comp.compile_chunk(source)
    flat = comp.flatten(main)
    payload = serialize(flat)
    payload_hex, k1, k2 = encrypt(payload)
    out = build_runtime(payload_hex, k1, k2, opmap)
    assert '\n' not in out and '\r' not in out
    return out


def obfuscate_stats(source: str):
    """Obfuscate and also return build statistics."""
    opmap = random_opmap()
    comp = Compiler(opmap)
    main = comp.compile_chunk(source)
    flat = comp.flatten(main)
    instrs = sum(len(fs.code) for fs in flat)
    consts = sum(len(fs.consts) for fs in flat)
    payload = serialize(flat)
    payload_hex, k1, k2 = encrypt(payload)
    out = build_runtime(payload_hex, k1, k2, opmap)
    assert '\n' not in out and '\r' not in out
    return out, {'protos': len(flat), 'instructions': instrs,
                 'constants': consts, 'payload_bytes': len(payload)}
