import { stubGamesLua } from './games';
// /loader — ตัวสั้น เลือก scriptId ตามเกม แล้วโหลดตัวหลักจาก /bootstrap-source
const STUB = String.raw`local HttpService = game:GetService("HttpService")
local env = getgenv()
local api = "https://api.flexozy.xyz"

local games = {
--@@GAMES@@
}

local scriptId = games[game.GameId] or games[game.PlaceId]
if not scriptId then
    local url = string.format(
        "%s/bootstrap-info?universeId=%s&placeId=%s",
        api,
        HttpService:UrlEncode(tostring(game.GameId)),
        HttpService:UrlEncode(tostring(game.PlaceId))
    )

    local ok, info = pcall(function()
        return HttpService:JSONDecode(game:HttpGet(url))
    end)

    scriptId = ok and type(info) == "table" and info.scriptId or "default"
end

if not scriptId or scriptId == "" then return end

env.FlexozyScriptId = scriptId
env.FlexozyScriptVersion = "1.0.0"

loadstring(game:HttpGet(api .. "/bootstrap-source"))()
`;
export const buildStub = () => STUB.replace('--@@GAMES@@', () => stubGamesLua());
