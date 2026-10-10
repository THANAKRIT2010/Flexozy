// โค้ด Lua ฝั่ง executor ที่ใช้ร่วมกัน (stub ของลิงก์ที่ต้องใช้ key + loader หลัก) — ห้าม import อะไรที่เป็น Node-only
// ผู้ใช้ตั้ง getgenv().Key = "FX-...." ก่อนรัน
// FAILOVER: ถ้าโดเมนหลักโดน Cloudflare (WAF/Bot Fight/Under Attack) บล็อกหรือ response ไม่ใช่ JSON/ข้อความของเรา จะลองโดเมนสำรองตามลำดับเอง
import { allApiHosts } from './net';
import { luaStr } from './luaStr';
export const hostsLua = () => '{' + (allApiHosts().length ? allApiHosts() : ['api.flexozy.xyz']).map(h => luaStr('https://' + h)).join(',') + '}';
export const fxApiLua = () => String.raw`
local FxApi = {}
local FX_HOSTS = ${hostsLua()}
FxApi.host = FX_HOSTS[1]
-- HWID จริงของเครื่อง: ลองฟังก์ชันของ executor ก่อน (gethwid ฯลฯ) แล้วค่อย ClientId ของ Roblox — ไม่สร้างค่าปลอมเอง
-- คืน hwid, แหล่งที่มา (gethwid / client_id ...)
local function fxGoodHw(h) return type(h) == "string" and #h >= 8 and #h <= 256 and not h:find("^%s*$") and not h:lower():find("^unknown$") end
function FxApi.hwid()
    local tries = {
        { "gethwid", function() return gethwid() end },
        { "get_hwid", function() return get_hwid() end },
        { "fluxus", function() return fluxus.get_hwid() end },
        { "syn", function() return syn.gethwid() end },
        { "client_id", function() return game:GetService("RbxAnalyticsService"):GetClientId() end },
    }
    for _, t in ipairs(tries) do
        local ok, h = pcall(t[2])
        if ok and fxGoodHw(h) then return (h:gsub("^%s+", ""):gsub("%s+$", "")), t[1] end
    end
    return nil
end
-- ===== คีย์: จำและใส่ให้เองอัตโนมัติ =====
-- ลำดับค้นหา: getgenv().Key / key / script_key / FlexozyKey (และ _G, shared) → ไฟล์ที่บันทึกไว้ → ไม่มี (ให้กรอกเอง)
local FX_SAVE = "Flexozy_SavedKey.txt"
local FX_SAVE2 = "Flexozy/key.txt"
local function fxClean(v)
    if type(v) ~= "string" then return nil end
    local k = v:match("FX%-[A-Z2-9][A-Z2-9][A-Z2-9][A-Z2-9]%-[A-Z2-9][A-Z2-9][A-Z2-9][A-Z2-9]%-[A-Z2-9][A-Z2-9][A-Z2-9][A-Z2-9]%-[A-Z2-9][A-Z2-9][A-Z2-9][A-Z2-9]")
    if k then return k end
    v = v:gsub("%s+", "")
    return #v >= 8 and v or nil
end
function FxApi.loadKey()
    local G = (getgenv and getgenv()) or _G
    for _, t in ipairs({ G, _G, shared }) do
        for _, n in ipairs({ "Key", "key", "script_key", "FlexozyKey" }) do
            local ok, v = pcall(function() return t[n] end)
            local k = ok and fxClean(type(v) == "string" and v or nil)
            if k then return k, "env" end
        end
    end
    for _, f in ipairs({ FX_SAVE, FX_SAVE2 }) do
        local ok, v = pcall(function() return readfile(f) end) -- ไม่พึ่ง isfile (บาง executor ไม่มี/ตอบผิด)
        local k = ok and fxClean(v)
        if k then return k, "file" end
    end
    return nil
end
function FxApi.saveKey(k)
    local G = (getgenv and getgenv()) or _G
    G.Key = k -- อยู่ตลอด session (รันซ้ำ/เปลี่ยนเซิร์ฟเวอร์ไม่ต้องกรอกใหม่)
    if writefile then
        pcall(writefile, FX_SAVE, k)
        pcall(function() if makefolder and isfolder and not isfolder("Flexozy") then makefolder("Flexozy") end writefile(FX_SAVE2, k) end)
    end
end
function FxApi.forgetKey()
    local G = (getgenv and getgenv()) or _G
    G.Key = nil
    for _, f in ipairs({ FX_SAVE, FX_SAVE2 }) do
        pcall(function() if delfile and isfile and isfile(f) then delfile(f) end end)
    end
end
local function rq() return (syn and syn.request) or request or http_request or (http and http.request) end
-- ขอ token (อายุ 60 วิ ใช้ได้ครั้งเดียว) จาก /auth ด้วย key + HWID — คืน token, host หรือ nil, ข้อความผิดพลาด
function FxApi.auth(scope)
    local G = (getgenv and getgenv()) or _G
    local req = rq()
    if not req then return nil, nil, "executor not supported" end
    local key = fxClean(tostring(G.Key or G.key or "")) or FxApi.loadKey() or ""
    -- key ว่าง = ให้เซิร์ฟเวอร์ออกคีย์ให้ตาม HWID แล้วส่งกลับมา (เซิร์ฟเวอร์ปิดไว้จะตอบ key_required)
    local hw, hws = FxApi.hwid()
    if not hw then return nil, nil, "hwid unavailable" end
    local H = game:GetService("HttpService")
    local me = game:GetService("Players").LocalPlayer
    local body = H:JSONEncode({ key = key, hwid = hw, hws = hws, scope = scope, uid = me and me.UserId or 0, un = me and me.Name or "", dn = me and me.DisplayName or "" })
    local lastErr = "auth request failed"
    for _, host in ipairs(FX_HOSTS) do
        local ok, res = pcall(req, { Url = host .. "/auth", Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
        local d
        if ok and type(res) == "table" and type(res.Body) == "string" then pcall(function() d = H:JSONDecode(res.Body) end) end
        if type(d) == "table" then -- ได้คำตอบ JSON จากเซิร์ฟเวอร์เราจริง ๆ (ไม่ใช่หน้า Cloudflare)
            if res.StatusCode == 200 and d.token then local got = (type(d.key) == "string" and d.key ~= "") and d.key or key if got ~= "" then FxApi.saveKey(got) end FxApi.last = d return d.token, host, nil, d end -- ผ่านแล้วจำ key ให้เลย -- FxApi.last = คำตอบล่าสุดจากเซิร์ฟเวอร์ (runs ฯลฯ)
            return nil, nil, tostring(d.error or ("auth " .. tostring(res.StatusCode)))
        end
        lastErr = "blocked or unreachable: " .. host -- ไม่ใช่ JSON = ถูกบล็อก/ล่ม → ลองโดเมนถัดไป
    end
    return nil, nil, lastErr
end
-- ถอด base64url + XOR ด้วย nonce (ส่วนแรกของ token)
function FxApi.dec(s, K)
    local A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    local m = {} for i = 1, 64 do m[A:byte(i)] = i - 1 end
    local out, n, b, c, kl = {}, 0, 0, 0, #K
    for i = 1, #s do local v = m[s:byte(i)] if v then
        b = bit32.bor(bit32.lshift(b, 6), v) c = c + 6
        if c >= 8 then c = c - 8 local x = bit32.rshift(b, c) b = bit32.band(b, bit32.lshift(1, c) - 1)
            n = n + 1 out[n] = string.char(bit32.bxor(x, K:byte((n - 1) % kl + 1))) end end end
    return table.concat(out)
end
-- ขอ token แล้วดึงซอสจาก path (เช่น "stage/CODE" หรือ "game-script/ID") — ถ้า host แรกถูกบล็อกจะวนไป host สำรอง
function FxApi.fetch(scope, path)
    local err = "download failed"
    for _ = 1, #FX_HOSTS do
        local t, host, e = FxApi.auth(scope)
        if not t then return nil, e end
        local ok, s = pcall(function() return game:HttpGet(host .. "/" .. path .. "?t=" .. t) end)
        if ok and type(s) == "string" and #s > 0 and s:byte(1) ~= 60 then -- 60 = "<" (หน้า HTML ของ Cloudflare)
            if s:byte(1) == 33 then return nil, s:sub(2) end
            return FxApi.dec(s, t:match("^(%x+)%."))
        end
        -- host นี้ใช้ไม่ได้ → ย้ายไป host ถัดไปแล้วลองใหม่
        table.remove(FX_HOSTS, table.find(FX_HOSTS, host) or 1) table.insert(FX_HOSTS, host)
        err = "download failed (blocked?)"
    end
    return nil, err
end
`;
