"""Generate the embedded Flexozy VM runtime (a Luau interpreter for the payload).

v11 heavy build: on top of the VM and payload transforms, each build emits
dozens of branded junk functions filled with throwaway locals, bounded junk
loops and Flexozy credit strings, a nested wrapper chain, and a per-fetch
checksum inside the interpreter loop. All junk is side-effect free and bounded,
so program behaviour is unchanged.
"""
from __future__ import annotations
import secrets
from core.compile import OPNAMES
from core.protection import protect_payload, flatten_handler

_LUA_KEYWORDS = set(
    'and break do else elseif end false for function if in local nil not or '
    'repeat return then true until while continue'.split())
_RESERVED = _LUA_KEYWORDS | {
    'type', 'typeof', 'self', 'game', 'workspace', 'script', 'string', 'table',
    'math', 'os', 'coroutine', 'bit32', 'utf8', 'task', 'print', 'error',
    'assert', 'pcall', 'xpcall', 'select', 'tonumber', 'tostring', 'rawget',
    'rawset', 'setmetatable', 'getmetatable', 'next', 'pairs', 'ipairs',
    'unpack', 'require', 'warn', 'Instance', 'Vector3', 'CFrame',
    'a', 'b', 'm', 'x', 'y', 's',
}

_JUNK_FUNCS = 24
_FILL = '0123456789abcdef'


def _total_blocks(payload_bytes: int) -> int:
    return max(240, min(1200, 240 + payload_bytes * 4))


def _credit() -> str:
    """Random Flexozy credit string, padded with hex filler for thickness."""
    variant = secrets.choice(
        ['Flexozy', 'FLEXOZY', 'Flexozy VM', 'Flexozy Protection',
         'flexozy', 'Flexozy Layered VM'])
    sep = secrets.choice(['::', '|', '~', '>>'])
    parts = [
        variant, 'Flexozy v11', ''.join(secrets.choice(_FILL) for _ in range(secrets.randbelow(24) + 8)),
        'Flexozy', ''.join(secrets.choice(_FILL) for _ in range(secrets.randbelow(24) + 8)),
        'Flexozy', sep.join(['Flexozy', 'Flexozy', 'Flexozy']),
    ]
    body = ' ' + sep + ' '.join(parts)
    while len(body) < 190:
        body += ' ' + ''.join(secrets.choice(_FILL) for _ in range(secrets.randbelow(24) + 8))
    return body + ' ' + sep


class _Names:
    """Unique generator for runtime and junk identifiers."""

    def __init__(self):
        self._pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        self._used: set[str] = set()

    def new(self) -> str:
        while True:
            n = ''.join(
                secrets.choice(self._pool) for _ in range(secrets.randbelow(3) + 2))
            if n not in self._used and n not in _RESERVED:
                self._used.add(n)
                return n

    def many(self, count: int) -> list[str]:
        return [self.new() for _ in range(count)]


def _junk_block(nm: _Names) -> str:
    """One bounded, side-effect-free junk block using throwaway locals."""
    a, b, c, d, t, i = nm.new(), nm.new(), nm.new(), nm.new(), nm.new(), nm.new()
    lines = [f'do local {a}={secrets.randbelow(999983) + 7}']
    if secrets.randbelow(100) < 60:
        lines.append(f'local {b}="{_credit()}"')
    lines.append(f'local {c}={a}*{secrets.randbelow(97) + 3}+{secrets.randbelow(89) + 5}')
    lines.append(f'local {d}, {t} = 0, {{}}')
    k = secrets.randbelow(5) + 3
    lines.append(f'for {i}=1,{k} do {t}[{i}]=({c}+{i}*{secrets.randbelow(31) + 7})%256 end')
    lines.append(f'for {i}=1,{k} do {c}=({c}+{t}[{i}])%99991 {d}={d}+({t}[{i}]%7) end')
    if secrets.randbelow(100) < 45:
        e, f, j = nm.new(), nm.new(), nm.new()
        body = f'local {e}="{_credit()}" local {f}=0'
        for _ in range(secrets.randbelow(2) + 2):
            body += f' {f}=({f}*{secrets.randbelow(31) + 3}+{secrets.randbelow(89) + 5})%65521'
        body += f' {c}=({c}+{f}+#{e})%99991'
        lines.append(f'do {body} end')
    if secrets.randbelow(100) < 30:
        g, h, j = nm.new(), nm.new(), nm.new()
        lines.append(
            f'do local {g}={{}} local {h}=0 for {j}=1,{secrets.randbelow(4) + 2} do '
            f'{g}[{j}]={c}*{j}+{j} {h}={h}+({g}[{j}]%13) end {c}=({c}+{h})%99991 end')
    lines.append('end')
    return ' '.join(lines)


def build_runtime(payload_hex: str, key1_hex: str, key2_hex: str, opmap: dict) -> str:
    nm = _Names()
    N = nm.many(67)
    nstate, nscratch = nm.new(), nm.new()
    nchk = nm.new()
    mask = secrets.randbelow(1000000) + 1000
    stride = secrets.randbelow(1000) + 1
    (nD, nA1, nA2, npk, nup, nbx, nbd, nT, nK1, nK2, nk1l, nk2l, nn, ni, ni2,
     np, nuv, nzv, nP, nNP, nq, nva, nus, nnu, nj, nd, nnc, nk, ng, nl, ns,
     nw, nENV, nok, nCF, nex, nmr, nR, nO, ntp, npc, nco, nca, ncb, ncc, nKK,
     nvn, nop, nA, nB, nC, nf, nm2, nr, ncn, nat, nz, nit, nc, nud, nns, nfn,
     nb2, nst, ngo, nt, nu0) = N

    def op(name):
        return str(opmap[name])

    def dispatch_handler(name, body):
        return f'{nop}=={op(name)} then\n{flatten_handler(body, nstate, nscratch)}\n'

    handlers = [
        ('MOVE', f'{nR}[{nA}]={nR}[{nB}]'),
        ('LOADK', f'{nR}[{nA}]={nKK}[{nB}]'),
        ('GETFIELD', f'{nR}[{nA}]={nR}[{nB}][{nKK}[{nC}]]'),
        ('SETFIELD', f'{nR}[{nB}][{nKK}[{nC}]]={nR}[{nA}]'),
        ('GETGLOBAL', f'{nR}[{nA}]={nENV}[{nKK}[{nB}]]'),
        ('SETGLOBAL', f'{nENV}[{nKK}[{nB}]]={nR}[{nA}]'),
        ('GETTABLE', f'{nR}[{nA}]={nR}[{nB}][{nR}[{nC}]]'),
        ('SETTABLE', f'{nR}[{nB}][{nR}[{nC}]]={nR}[{nA}]'),
        ('NEWTABLE', f'{nR}[{nA}]={{}}'),
        ('SETLIST', f'''local {nm2}={nB}
if {nm2}==0 then {nm2}={ntp}-{nA} end
for {ni2}=1,{nm2} do {nR}[{nA}][{ni2}]={nR}[{nA}+{ni2}] end'''),
        ('CALL', f'''local {nf}={nR}[{nA}]
local {nm2}
if {nB}==0 then {nm2}={ntp}-{nA} else {nm2}={nB}-1 end
local {nr}
local {ncn}={nCF}[{nf}]
if {ncn} then
 local {nat}={{}}
 if {nm2}>0 then for {ni2}=1,{nm2} do {nat}[{ni2}]={nR}[{nA}+{ni2}] end end
 {nat}.n={nm2}
 {nr}={nex}({ncn}[1],{nat},{ncn}[2])
elseif {nm2}==0 then
 {nr}={npk}({nf}())
else
 local {nat}={{}}
 for {ni2}=1,{nm2} do {nat}[{ni2}]={nR}[{nA}+{ni2}] end
 {nr}={npk}({nf}({nup}({nat},1,{nm2})))
end
if {nC}==0 then
 local {nz}={nr}.n
 for {ni2}=1,{nz} do {nR}[{nA}+{ni2}-1]={nr}[{ni2}] end
 {ntp}={nA}+{nz}-1
elseif {nC}==1 then
 {nR}[{nA}]={nr}[1]
else
 {ntp}={nA}-1
end'''),
        ('SELF', f'local {nb2}={nB} {nR}[{nA}+1]={nR}[{nb2}] {nR}[{nA}]={nR}[{nb2}][{nKK}[{nC}]]'),
        ('CONCAT', f'''local {ns}={nR}[{nB}]
for {ni2}={nB}+1,{nC} do {ns}={ns}..{nR}[{ni2}] end
{nR}[{nA}]={ns}'''),
        ('ADD', f'{nR}[{nA}]={nR}[{nB}]+{nR}[{nC}]'),
        ('SUB', f'{nR}[{nA}]={nR}[{nB}]-{nR}[{nC}]'),
        ('MUL', f'{nR}[{nA}]={nR}[{nB}]*{nR}[{nC}]'),
        ('DIV', f'{nR}[{nA}]={nR}[{nB}]/{nR}[{nC}]'),
        ('MOD', f'{nR}[{nA}]={nR}[{nB}]%{nR}[{nC}]'),
        ('POW', f'{nR}[{nA}]={nR}[{nB}]^{nR}[{nC}]'),
        ('UNM', f'{nR}[{nA}]=-{nR}[{nB}]'),
        ('NOT', f'{nR}[{nA}]=not {nR}[{nB}]'),
        ('LEN', f'{nR}[{nA}]=#{nR}[{nB}]'),
        ('EQ', f'if ({nR}[{nB}]=={nR}[{nC}])==({nA}~=0) then {npc}={npc}+1 end'),
        ('LT', f'if ({nR}[{nB}]<{nR}[{nC}])==({nA}~=0) then {npc}={npc}+1 end'),
        ('LE', f'if ({nR}[{nB}]<={nR}[{nC}])==({nA}~=0) then {npc}={npc}+1 end'),
        ('JMP', f'{npc}={npc}+{nB}'),
        ('TEST', f'local {nt}={nR}[{nA}] if (({nt}~=nil and {nt}~=false)==({nB}~=0)) then {npc}={npc}+1 end'),
        ('LOADBOOL', f'{nR}[{nA}]=({nB}~=0) if {nC}~=0 then {npc}={npc}+1 end'),
        ('LOADNIL', f'for {ni2}=0,{nB} do {nR}[{nA}+{ni2}]=nil end'),
        ('FORPREP', f'''local {nst}={nR}[{nA}+2]
if {nst}==0 then error("'for' step is zero") end
{nR}[{nA}+3]={nR}[{nA}]
{npc}={npc}+{nB}'''),
        ('FORLOOP', f'''{nR}[{nA}]={nR}[{nA}]+{nR}[{nA}+2]
local {nst}={nR}[{nA}+2]
local {ngo}
if {nst}>0 then {ngo}={nR}[{nA}]<={nR}[{nA}+1] else {ngo}={nR}[{nA}]>={nR}[{nA}+1] end
if {ngo} then {nR}[{nA}+3]={nR}[{nA}] {npc}={npc}+{nB} end'''),
        ('TFORCALL', f'''local {nit}={nR}[{nA}]
local {nr}
local {ncn}={nCF}[{nit}]
if {ncn} then
 {nr}={nex}({ncn}[1],{{[1]={nR}[{nA}+1],[2]={nR}[{nA}+2],n=2}},{ncn}[2])
else
 {nr}={npk}({nit}({nR}[{nA}+1],{nR}[{nA}+2]))
end
local {nz}={nC}
for {ni2}=1,{nz} do {nR}[{nA}+2+{ni2}]={nr}[{ni2}] end'''),
        ('TFORLOOP', f'if {nR}[{nA}+3]==nil then {npc}={npc}+{nB} else {nR}[{nA}+2]={nR}[{nA}+3] end'),
        ('CLOSURE', f'''local {nc}={nP}[{nB}]
local {nud}={nc}.ud
local {nns}={{}}
for {nj}=1,#{nud} do
 local {nd}={nud}[{nj}]
 local {ng}
 if {nd}[1] then
  {ng}={nO}[{nd}[2]]
  if not {ng} then {ng}={{l=true,R={nR},r={nd}[2],v=nil}} {nO}[{nd}[2]]={ng} end
 else
  {ng}={nus}[{nd}[2]]
 end
 {nns}[{nj}]={ng}
end
local function {nfn}(...) local {nr}={nex}({nc},{npk}(...),{nns}) return {nup}({nr},1,{nr}.n) end
{nCF}[{nfn}]={{ {nc},{nns} }}
{nR}[{nA}]={nfn}'''),
        ('SETUPVAL', f'local {ng}={nus}[{nB}] if {ng}.l then {ng}.R[{ng}.r]={nR}[{nA}] else {ng}.v={nR}[{nA}] end'),
        ('GETUPVAL', f'local {ng}={nus}[{nB}] if {ng}.l then {nR}[{nA}]={ng}.R[{ng}.r] else {nR}[{nA}]={ng}.v end'),
        ('VARARG', f'''if {nC}==0 then
 for {ni2}=1,{nvn} do {nR}[{nA}+{ni2}-1]={nva}[{ni2}] end
 {ntp}={nA}+{nvn}-1
else
 for {ni2}=1,{nC}-1 do {nR}[{nA}+{ni2}-1]={nva}[{ni2}] end
end'''),
        ('RETURN', f'''local {nm2}
if {nB}==0 then {nm2}={ntp}-{nA}+1 else {nm2}={nB}-1 end
for {nu0},{ng} in pairs({nO}) do {ng}.l=false {ng}.v={ng}.R[{ng}.r] end
local {nat}={{n={nm2}}}
for {ni2}=1,{nm2} do {nat}[{ni2}]={nR}[{nA}+{ni2}-1] end
return {nat}'''),
        ('CLOSE', f'''for {nu0},{ng} in pairs({nO}) do
 if {nu0}>={nA} then {ng}.l=false {ng}.v={ng}.R[{ng}.r] {nO}[{nu0}]=nil end
end'''),
        ('ITERPREP', f'''local {nt}={nR}[{nA}]
if type({nt})~='function' then {nR}[{nA}]=next {nR}[{nA}+1]={nt} {nR}[{nA}+2]=nil end'''),
    ]

    secrets.SystemRandom().shuffle(handlers)
    dispatch = 'if ' + ' elseif '.join(
        dispatch_handler(name, body) for name, body in handlers) + 'end'

    # --- v11 heavy junk farm -----------------------------------------------
    total = _total_blocks(len(payload_hex) // 2)
    jfuncs = nm.many(_JUNK_FUNCS)
    jtable = nm.new()
    jit = nm.new()
    per_func = total // _JUNK_FUNCS
    inline_total = total - per_func * _JUNK_FUNCS
    junk_defs = []
    for jf in jfuncs:
        blocks = ' '.join(_junk_block(nm) for _ in range(per_func))
        junk_defs.append(f'local {jf}=function(...) {blocks} end')
    junk_calls = ' '.join(
        f'{jf}({idx},"{_credit()}")' for idx, jf in enumerate(jfuncs, 1))
    junk_top = ' '.join(_junk_block(nm) for _ in range(inline_total))
    top_credits = ' '.join(
        f'local {nm.new()}="{_credit()}"' for _ in range(3))
    in_nex = ' '.join(_junk_block(nm) for _ in range(3))

    src = f'''return(function(...)
{top_credits}
{junk_top}
{chr(10).join(junk_defs)}
local {jtable}={{{','.join(jfuncs)}}}
for {jit}=1,#{jtable} do {jtable}[{jit}]({jit},"{_credit()}") end
{junk_calls}
return (function(...) return (function(...)
local {nD}={protect_payload(payload_hex)}
local {nA1}="{key1_hex}"
local {nA2}="{key2_hex}"
local {npk}=table.pack or function(...) local {nt}={{}} local {nm2}=select('#',...) for {ni2}=1,{nm2} do {nt}[{ni2}]=select({ni2},...) end {nt}.n={nm2} return {nt} end
local {nup}=table.unpack or unpack
local {nbx},{nbd}
if bit32 then {nbx}=bit32.bxor {nbd}=bit32.band
else
 {nbx}=function(a,b) local {nr},m=0,1 for {ni2}=1,32 do local x=a%2 local y=b%2 if x~=y then {nr}={nr}+m end a=(a-x)/2 b=(b-y)/2 m=m*2 end return {nr} end
 {nbd}=function(a,b) local {nr},m=0,1 for {ni2}=1,32 do local x=a%2 local y=b%2 if x==1 and y==1 then {nr}={nr}+m end a=(a-x)/2 b=(b-y)/2 m=m*2 end return {nr} end
end
local {nn}=math.floor(#{nD}/2)
local {nT}={{}}
local {nk1l}=#{nA1}/2 local {nk2l}=#{nA2}/2
local {nK1}={{}} local {nK2}={{}}
for {ni2}=1,{nk1l} do {nK1}[{ni2}]=tonumber(string.sub({nA1},{ni2}+{ni2}-1,{ni2}+{ni2}),16) end
for {ni2}=1,{nk2l} do {nK2}[{ni2}]=tonumber(string.sub({nA2},{ni2}+{ni2}-1,{ni2}+{ni2}),16) end
for {ni2}=1,{nn} do
 local {nb2}=tonumber(string.sub({nD},{ni2}+{ni2}-1,{ni2}+{ni2}),16)
 {nb2}={nbx}({nb2},{nK2}[({ni2}-1)%{nk2l}+1])
 {nb2}=({nb2}-({ni2}-1)%251)%256
 {nb2}={nbx}({nb2},{nK1}[({ni2}-1)%{nk1l}+1])
 {nT}[{ni2}]={nb2}
end
local {np}=1
local function {nuv}() local {nr},s=0,0 while true do local {nb2}={nT}[{np}] {np}={np}+1 {nr}={nr}+({nb2}%128)*(2^s) if {nb2}<128 then return {nr} end s=s+7 end end
local function {nzv}() local {nr}={nuv}() if {nr}%2==0 then return {nr}/2 else return -({nr}+1)/2 end end
local {nP}={{}}
local {nNP}={nuv}()
for {ni2}=1,{nNP} do
 local {nq}={{co={{}}}}
 {nq}.ca={{}} {nq}.cb={{}} {nq}.cc={{}} {nq}.kk={{}} {nq}.ud={{}}
 {nq}.np={nuv}()
 {nq}.va={nT}[{np}]~=0 {np}={np}+1
 local {nnu}={nuv}()
 for {nj}=1,{nnu} do local {nd}={nT}[{np}]~=0 {np}={np}+1 {nq}.ud[{nj}]={{ {nd},{nuv}() }} end
 local {nnc}={nuv}()
 for {nj}=1,{nnc} do {nq}.co[{nj}]={nuv}() {nq}.ca[{nj}]={nuv}() {nq}.cb[{nj}]={nzv}() {nq}.cc[{nj}]={nzv}() end
 local {nk}={nuv}()
 for {nj}=1,{nk} do
  local {ng}={nT}[{np}] {np}={np}+1
  if {ng}==0 then {nq}.kk[{nj}]=nil
  elseif {ng}==1 then {nq}.kk[{nj}]=true
  elseif {ng}==2 then {nq}.kk[{nj}]=false
  elseif {ng}==3 then
   local {nl}={nuv}() local {ns}={{}} for {nw}=1,{nl} do {ns}[{nw}]=string.char({nT}[{np}]) {np}={np}+1 end {nq}.kk[{nj}]=table.concat({ns})
  else
   local {nl}={nuv}() local {ns}={{}} for {nw}=1,{nl} do {ns}[{nw}]=string.char({nT}[{np}]) {np}={np}+1 end {nq}.kk[{nj}]=tonumber(table.concat({ns}))
  end
 end
 {nP}[{ni2}]={nq}
end
for {ni2}=1,#{nP} do
 local {nq}={nP}[{ni2}]
 for {nj}=1,#{nq}.co do
  local {nd}={mask}+{nj}*{stride}
  {nq}.co[{nj}]={nq}.co[{nj}]+{nd}
  {nq}.ca[{nj}]={nq}.ca[{nj}]+{nd}*2
  {nq}.cb[{nj}]={nq}.cb[{nj}]+{nd}*3
  {nq}.cc[{nj}]={nq}.cc[{nj}]+{nd}*4
 end
end
local {nENV}
local {nok},{nENV}=pcall(getfenv)
if not {nok} then {nENV}=setmetatable({{}},{{__index=_G}}) end
local {nCF}=setmetatable({{}},{{__mode='k'}})
local function {nex}({nq},{nva},{nus})
 {in_nex}
 local {nR}={{}}
 local {nO}={{}}
 local {ntp}=0
 local {npc}=1
 local {nco},{nca},{ncb},{ncc}={nq}.co,{nq}.ca,{nq}.cb,{nq}.cc
 local {nKK}={nq}.kk
 local {nvn}={nva}.n or #{nva}
 for {ni2}=1,{nq}.np do {nR}[{ni2}-1]={nva}[{ni2}] end
 local {nchk}=0
 while true do
  local {nd}={mask}+{npc}*{stride}
  local {nop}={nco}[{npc}]-{nd}
  local {nA}={nca}[{npc}]-{nd}*2
  local {nB}={ncb}[{npc}]-{nd}*3
  local {nC}={ncc}[{npc}]-{nd}*4
  {nchk}=({nchk}*31+{nd})%2147483647
  {dispatch}
  {npc}={npc}+1
 end
end
local {nmr}={nex}({nP}[{nNP}],{npk}(...),{{}})
return {nup}({nmr},1,{nmr}.n)
end)(...) end)(...)
end)(...)
'''
    src = ' '.join(src.split())
    assert '@' not in src
    return src
