"""Serialize Flexozy VM bytecode and encrypt it for embedding."""
from __future__ import annotations
import secrets


def _uvarint(out: bytearray, n: int):
    while True:
        x = n & 127
        n >>= 7
        if n:
            out.append(x | 128)
        else:
            out.append(x)
            return


def _zigzag(n: int) -> int:
    return (n << 1) if n >= 0 else ((-n) << 1) - 1


def _num_bytes(v: float) -> bytes:
    return ('%.17g' % v).encode('ascii')


def serialize(flat) -> bytes:
    out = bytearray()
    _uvarint(out, len(flat))
    for fs in flat:
        _uvarint(out, fs.nparams)
        out.append(1 if fs.isvararg else 0)
        _uvarint(out, len(fs.upvals))
        for _, instack, idx in fs.upvals:
            out.append(1 if instack else 0)
            _uvarint(out, idx)
        _uvarint(out, len(fs.code))
        for op, a, b, c in fs.code:
            _uvarint(out, op)
            _uvarint(out, a)
            _uvarint(out, _zigzag(b))
            _uvarint(out, _zigzag(c))
        _uvarint(out, len(fs.consts))
        for kind, val in fs.consts:
            if kind == 's':
                out.append(3)
                _uvarint(out, len(val))
                out.extend(val)
            else:
                out.append(4)
                nb = _num_bytes(val)
                _uvarint(out, len(nb))
                out.extend(nb)
    return bytes(out)


def encrypt(data: bytes):
    """Two-layer stream cipher; returns (payload_hex, key1_hex, key2_hex)."""
    k1 = secrets.token_bytes(24)
    k2 = secrets.token_bytes(16)
    out = bytearray(len(data))
    for i, x in enumerate(data):
        y = x ^ k1[i % len(k1)]
        y = (y + (i % 251)) & 255
        y = y ^ k2[i % len(k2)]
        out[i] = y
    return out.hex().upper(), k1.hex().upper(), k2.hex().upper()
