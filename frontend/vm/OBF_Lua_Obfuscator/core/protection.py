"""Additional bounded protection transforms; no dynamic source evaluation."""
from __future__ import annotations

import secrets

PAYLOAD_ROUNDS = 10
CHUNK_BYTES = 48


def protect_payload(payload_hex: str) -> str:
    """Return a Luau expression reversing ten chained-byte transport rounds.

    Keys are embedded and recoverable: this raises analysis effort, not a
    cryptographic confidentiality boundary. Each round depends on the previous
    ciphertext byte, and chunks are emitted out of logical order.
    """
    data = bytes.fromhex(payload_hex)
    rounds = []
    for _ in range(PAYLOAD_ROUNDS):
        key, stride, seed = (secrets.randbelow(251) + 1 for _ in range(3))
        rounds.append((key, stride, seed))
        previous = seed
        encoded = bytearray()
        for index, value in enumerate(data, 1):
            cipher = (value + key + index * stride + previous) % 256
            encoded.append(cipher)
            previous = cipher
        data = bytes(encoded)
    chunks = [data[i:i + CHUNK_BYTES].hex() for i in range(0, len(data), CHUNK_BYTES)]
    indexed = list(enumerate(chunks, 1))
    secrets.SystemRandom().shuffle(indexed)
    entries = ','.join('[%d]="%s"' % item for item in indexed)
    stages = []
    for key, stride, seed in reversed(rounds):
        stages.append(
            f'do local p={seed} for i=1,#b do local c=b[i] '
            f'b[i]=(c-{key}-i*{stride}-p)%256 p=c end end')
    return ('(function() local t={' + entries + '} local h=table.concat(t) '
            'local b={} for i=1,#h,2 do b[#b+1]=tonumber(string.sub(h,i,i+1),16) end '
            + ' '.join(stages) +
            ' local r={} for i=1,#b do r[i]=string.format("%02X",b[i]) end '
            'return table.concat(r) end)()')


def flatten_handler(body: str, state_name: str, scratch_name: str) -> str:
    """Wrap each actual opcode body in a randomized, bounded state machine.

    Five to seven states are generated per handler; each state has exactly one
    reachable successor and the real opcode body runs exactly once. RETURN and
    coroutine yield stay in the interpreter frame; no extra function boundary
    surrounds opcode bodies.
    """
    n_states = secrets.randbelow(3) + 5
    labels = secrets.SystemRandom().sample(range(1000, 900000), n_states + 1)
    entry, execute, finish = labels[0], labels[n_states // 2], labels[n_states]
    chain = labels[:n_states + 1]
    salt = secrets.randbelow(10000) + 1
    branches = []
    for i, state in enumerate(chain[:-1]):
        nxt = chain[i + 1]
        if state == execute:
            branches.append(
                f'{state_name}=={state} then do {body} end {state_name}={finish}')
        else:
            op = '+' if secrets.randbelow(2) == 0 else '-'
            mul = secrets.randbelow(89) + 3
            branches.append(
                f'{state_name}=={state} then {scratch_name}=({scratch_name}{op}{mul}*{salt})%65521 {state_name}={nxt}')
    secrets.SystemRandom().shuffle(branches)
    return (f'do local {state_name}={entry} local {scratch_name}=0 '
            f'while {state_name}~={finish} do if ' + ' elseif '.join(branches) +
            ' else error("invalid dispatch state") end end end')
