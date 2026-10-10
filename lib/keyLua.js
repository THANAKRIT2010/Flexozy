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
function FxApi.hwid()
    local h
    pcall(function() h = gethwid() end)
    if type(h) ~= "string" or h == "" then pcall(function() h = game:GetService("RbxAnalyticsService"):GetClientId() end) end
    return type(h) == "string" and h ~= "" and h or nil
end
local function rq() return (syn and syn.request) or request or http_request or (http and http.request) end
-- ขอ token (อายุ 60 วิ ใช้ได้ครั้งเดียว) จาก /auth ด้วย key + HWID — คืน token, host หรือ nil, ข้อความผิดพลาด
function FxApi.auth(scope)
    local G = (getgenv and getgenv()) or _G
    local req = rq()
    if not req then return nil, nil, "executor not supported" end
    local key = tostring(G.Key or G.key or "")
    if key == "" then return nil, nil, "missing key: getgenv().Key = \"FX-...\"" end
    local hw = FxApi.hwid()
    if not hw then return nil, nil, "hwid unavailable" end
    local H = game:GetService("HttpService")
    local body = H:JSONEncode({ key = key, hwid = hw, scope = scope })
    local lastErr = "auth request failed"
    for _, host in ipairs(FX_HOSTS) do
        local ok, res = pcall(req, { Url = host .. "/auth", Method = "POST", Headers = { ["Content-Type"] = "application/json" }, Body = body })
        local d
        if ok and type(res) == "table" and type(res.Body) == "string" then pcall(function() d = H:JSONDecode(res.Body) end) end
        if type(d) == "table" then -- ได้คำตอบ JSON จากเซิร์ฟเวอร์เราจริง ๆ (ไม่ใช่หน้า Cloudflare)
            if res.StatusCode == 200 and d.token then return d.token, host end
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
