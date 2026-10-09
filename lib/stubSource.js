import { stubGamesLua } from './games';
const STUB = String.raw`local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local env = getgenv()
local api = "https://api.flexozy.xyz"
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
    local url = string.format("%s/bootstrap-info?universeId=%s&placeId=%s&gameName=%s", api,
        HttpService:UrlEncode(tostring(game.GameId)), HttpService:UrlEncode(tostring(game.PlaceId)), HttpService:UrlEncode(gameName))
    local ok, info = pcall(function() return HttpService:JSONDecode(game:HttpGet(url)) end)
    scriptId = ok and type(info) == "table" and info.scriptId or "default"
end
if not scriptId or scriptId == "" then return end
env.FlexozyScriptId = scriptId
env.FlexozyScriptVersion = "1.0.0"
loadstring(game:HttpGet(api .. "/bootstrap-source"))()
`;
export const buildStub = async () => STUB.replace('--@@GAMES@@', await stubGamesLua());
