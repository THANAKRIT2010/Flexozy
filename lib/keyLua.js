// โค้ด Lua ฝั่ง executor ที่ใช้ร่วมกัน (stub ของลิงก์ที่ต้องใช้ key + loader หลัก) — ห้าม import อะไร
// ผู้ใช้ตั้ง getgenv().Key = "FX-...." ก่อนรัน
const API = () => 'https://' + (process.env.API_HOST || 'api.flexozy.xyz');
export const fxApiLua = () => String.raw`
local FxApi = {}
local FX_API = "${API()}"
function FxApi.hwid()
    local h
    pcall(function() h = gethwid() end)
    if type(h) ~= "string" or h == "" then pcall(function() h = game:GetService("RbxAnalyticsService"):GetClientId() end) end
    return type(h) == "string" and h ~= "" and h or nil
end
-- ขอ token (อายุ 60 วิ ใช้ได้ครั้งเดียว) จาก /auth ด้วย key + HWID — คืน token หรือ nil, ข้อความผิดพลาด
function FxApi.auth(scope)
    local G = (getgenv and getgenv()) or _G
    local rq = (syn and syn.request) or request or http_request or (http and http.request)
    if not rq then return nil, "executor not supported" end
    local key = tostring(G.Key or G.key or "")
    if key == "" then return nil, "missing key: getgenv().Key = \"FX-...\"" end
    local hw = FxApi.hwid()
    if not hw then return nil, "hwid unavailable" end
    local H = game:GetService("HttpService")
    local ok, res = pcall(rq, { Url = FX_API .. "/auth", Method = "POST", Headers = { ["Content-Type"] = "application/json" },
        Body = H:JSONEncode({ key = key, hwid = hw, scope = scope }) })
    if not ok or type(res) ~= "table" then return nil, "auth request failed" end
    local d; pcall(function() d = H:JSONDecode(res.Body) end)
    if res.StatusCode ~= 200 or type(d) ~= "table" or not d.token then
        return nil, tostring(type(d) == "table" and d.error or ("auth " .. tostring(res.StatusCode)))
    end
    return d.token
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
-- ขอ token แล้วดึงซอสจาก path ที่ได้ token (เช่น "stage/CODE" หรือ "game-script/ID") — คืนซอส หรือ nil, error
function FxApi.fetch(scope, path)
    local t, e = FxApi.auth(scope)
    if not t then return nil, e end
    local ok, s = pcall(function() return game:HttpGet(FX_API .. "/" .. path .. "?t=" .. t) end)
    if not ok or type(s) ~= "string" or #s == 0 then return nil, "download failed" end
    if s:byte(1) == 33 then return nil, s:sub(2) end
    return FxApi.dec(s, t:match("^(%x+)%."))
end
`;
