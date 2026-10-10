import { stubGamesLua } from './games';
import { hostsLua } from './keyLua';
// ตัวสั้นที่ /loader ส่งให้ executor: ระบุเกม → ดึงตัวหลักจาก /bootstrap-source ด้วย token ที่ /loader เพิ่งออกให้ (ใช้ได้ครั้งเดียว 2 นาที)
// มี failover: โดเมนหลักถูก Cloudflare บล็อก (ได้ HTML/ว่าง/ล่ม) → ลองโดเมนสำรองเอง
const STUB = String.raw`local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local env = getgenv()
local HOSTS = --@@HOSTS@@
local BOOT = "--@@BOOT@@"
local function get(path)
    for _, h in ipairs(HOSTS) do
        local ok, s = pcall(function() return game:HttpGet(h .. path) end)
        if ok and type(s) == "string" and #s > 0 and s:byte(1) ~= 60 then return s end -- 60 = "<" → หน้า HTML ของ Cloudflare
    end
end
local games = {
--@@GAMES@@
}
local scriptId = games[game.GameId] or games[game.PlaceId]
if not scriptId then
    local gameName = tostring(game.Name or "")
    pcall(function()
        local info = MarketplaceService:GetProductInfo(game.PlaceId)
        if info and info.Name then gameName = info.Name end
    end)
    local body = get(string.format("/bootstrap-info?universeId=%s&placeId=%s&gameName=%s",
        HttpService:UrlEncode(tostring(game.GameId)), HttpService:UrlEncode(tostring(game.PlaceId)), HttpService:UrlEncode(gameName)))
    local ok, info = pcall(function() return HttpService:JSONDecode(body) end)
    scriptId = ok and type(info) == "table" and info.scriptId or "default"
end
if not scriptId or scriptId == "" then return end
env.FlexozyScriptId = scriptId
env.FlexozyScriptVersion = "1.1.0"
local src = get("/bootstrap-source?t=" .. BOOT)
if not src then warn("[Flexozy] cannot reach server (blocked?)") return end
local fn, err = loadstring(src)
if not fn then warn("[Flexozy] " .. tostring(err)) return end
fn()
`;
export const buildStub = async (bootToken) => {
  const rows = await stubGamesLua();
  return STUB.replace('--@@HOSTS@@', () => hostsLua()).replace('--@@BOOT@@', () => bootToken).replace('--@@GAMES@@', () => rows);
};
