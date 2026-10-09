import { sourceGamesLua } from './games';
import { fxApiLua } from './keyLua';
// โค้ด Lua ตัวหลัก (ส่งผ่าน GET /bootstrap-source) — รายชื่อเกมถูกฝังจาก lib/games.js แทน --@@GAMES@@
const LUA = String.raw`
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

local SERVER_URL = "http://78.154.103.8:15218/nexus-runner"
local NEXUS_SECRET = "LUADER"
local WEBSITE_NAME = "Flexozy"

--@@GAMES@@
--@@FXAPI@@

local env = (getgenv and getgenv()) or _G
local ScriptId = env.FlexozyScriptId

local PlaceName = tostring(game.Name or game.PlaceId)

pcall(function()
    local Info = MarketplaceService:GetProductInfo(game.PlaceId)
    if Info and Info.Name then
        PlaceName = tostring(Info.Name)
    end
end)

local function IsBladeBall()
    if tonumber(game.GameId) == BLADE_BALL_GAME_ID then
        return true
    end
    return string.find(string.lower(PlaceName), "blade ball", 1, true) ~= nil
end

local function IsBlockSpin()
    local LowerName = string.lower(PlaceName)
    return string.find(LowerName, "blockspin", 1, true) ~= nil
        or string.find(LowerName, "block spin", 1, true) ~= nil
end

local CurrentScript

if IsBladeBall() then
    CurrentScript = BLADE_BALL
elseif IsBlockSpin() then
    CurrentScript = BLOCKSPIN
else
    CurrentScript = SCRIPTS[ScriptId] or SCRIPTS.default
end

local SCRIPT_NAME = CurrentScript.Name
local LOAD_URL = CurrentScript.URL

local function GetRunner()
    local Runner = "Unknown"

    pcall(function()
        if typeof(identifyexecutor) == "function" then
            local Name, Version = identifyexecutor()
            if Name and tostring(Name) ~= "" then
                Runner = tostring(Name)
                if Version and tostring(Version) ~= "" then
                    Runner = Runner .. " " .. tostring(Version)
                end
            end
        end
    end)

    if Runner == "Unknown" then
        pcall(function()
            if typeof(getexecutorname) == "function" then
                local Name = getexecutorname()
                if Name and tostring(Name) ~= "" then
                    Runner = tostring(Name)
                end
            end
        end)
    end

    if Runner == "Unknown" then
        pcall(function()
            if syn and typeof(syn.getexecutorname) == "function" then
                local Name = syn.getexecutorname()
                if Name and tostring(Name) ~= "" then
                    Runner = tostring(Name)
                end
            end
        end)
    end

    return Runner
end

local function GetRequestFunction()
    if typeof(request) == "function" then return request end
    if typeof(http_request) == "function" then return http_request end
    if syn and typeof(syn.request) == "function" then return syn.request end
    if http and typeof(http.request) == "function" then return http.request end
    return nil
end

local function SendNexusData()
    local RequestFunction = GetRequestFunction()
    if not RequestFunction then
        return false
    end

    local Data = {
        userId = tostring(Player.UserId),
        username = tostring(Player.Name),
        placeId = tostring(game.PlaceId),
        gameId = tostring(game.GameId),
        placeName = tostring(PlaceName),
        playerCount = #Players:GetPlayers(),
        runner = tostring(GetRunner()),
        scriptName = tostring(SCRIPT_NAME),
        website = tostring(WEBSITE_NAME)
    }

    local Success = pcall(function()
        RequestFunction({
            Url = SERVER_URL,
            Method = "POST",
            Headers = {
                ["Content-Type"] = "application/json",
                ["x-secret"] = NEXUS_SECRET
            },
            Body = HttpService:JSONEncode(Data)
        })
    end)

    return Success
end

task.spawn(function()
    task.wait(0.2)
    SendNexusData()
end)

local LOGO_ID = "rbxassetid://135253158468501"
local LOADING_TIME = 6

local DISCORD_CODE = "WFUejxeggt"
local DISCORD_LINK = "discord.gg/" .. DISCORD_CODE

local COLOR_CARD = Color3.fromRGB(10, 10, 10)
local COLOR_SIDE = Color3.fromRGB(22, 22, 22)
local COLOR_STROKE = Color3.fromRGB(255, 255, 255)
local COLOR_TEXT = Color3.fromRGB(255, 255, 255)
local COLOR_MUTED = Color3.fromRGB(165, 165, 165)
local COLOR_ACCENT = Color3.fromRGB(255, 255, 255)
local COLOR_ONLINE = Color3.fromRGB(46, 204, 113)
local COLOR_DIVIDER = Color3.fromRGB(55, 55, 55)

local OldGui = PlayerGui:FindFirstChild("HubLoader")
if OldGui then
    OldGui:Destroy()
end

local function Tween(Object, Time, Props, Style, Direction)
    local T = TweenService:Create(
        Object,
        TweenInfo.new(Time, Style or Enum.EasingStyle.Quad, Direction or Enum.EasingDirection.Out),
        Props
    )
    T:Play()
    return T
end

local Fades = {}

local function Track(Object, Property, Target)
    Object[Property] = 1
    table.insert(Fades, {Object, Property, Target})
end

local function FadeAll(ToHidden, Time)
    for _, Item in ipairs(Fades) do
        Tween(Item[1], Time, {
            [Item[2]] = ToHidden and 1 or Item[3]
        })
    end
end

local function FormatNumber(N)
    local S = tostring(math.floor(N))
    local Result = S:reverse():gsub("(%d%d%d)", "%1,"):reverse()
    return (Result:gsub("^,", ""))
end

local function LoadScript(URL)
    if not URL or URL == "" then
        return false
    end

    local Success, Err = pcall(function()
        local Source
        if URL:sub(1, 3) == "fx:" then
            local why
            Source, why = FxApi.fetch("hub:" .. URL:sub(4), "game-script/" .. URL:sub(4))
            if not Source then error(why or "key check failed") end
        else
            Source = game:HttpGet(URL, true)
        end

        if not Source or Source == "" then
            error("Script source is empty")
        end

        if typeof(loadstring) ~= "function" then
            error("loadstring is not supported")
        end

        local LoadedFunction, CompileError = loadstring(Source)

        if not LoadedFunction then
            error(CompileError or "Compile failed")
        end

        LoadedFunction()
    end)

    if not Success then warn("[Flexozy] " .. tostring(Err)) end
    return Success
end

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "HubLoader"
ScreenGui.ResetOnSpawn = false
ScreenGui.DisplayOrder = 999
ScreenGui.IgnoreGuiInset = true
ScreenGui.Parent = PlayerGui

local Background = Instance.new("Frame")
Background.Name = "Background"
Background.Size = UDim2.fromScale(1, 1)
Background.BackgroundTransparency = 1
Background.BorderSizePixel = 0
Background.Parent = ScreenGui

local Card = Instance.new("Frame")
Card.Name = "Card"
Card.AnchorPoint = Vector2.new(0.5, 0.5)
Card.Size = UDim2.fromOffset(540, 200)
Card.Position = UDim2.fromScale(0.5, 0.5)
Card.BackgroundColor3 = COLOR_CARD
Card.BorderSizePixel = 0
Card.Parent = Background

Track(Card, "BackgroundTransparency", 0)

Instance.new("UICorner", Card).CornerRadius = UDim.new(0, 16)

local CardStroke = Instance.new("UIStroke")
CardStroke.Thickness = 1.5
CardStroke.Color = COLOR_STROKE
CardStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
CardStroke.Parent = Card

Track(CardStroke, "Transparency", 0)

local CardScale = Instance.new("UIScale")
CardScale.Parent = Card

local CARD_WIDTH = 540
local CARD_HEIGHT = 200
local SCREEN_MARGIN = 40
local MIN_SCALE = 0.45
local MAX_SCALE = 1.25

local ScaleConnections = {}
local BoundCamera = nil
local CameraSizeConnection = nil

local function UpdateScale()
    local Camera = workspace.CurrentCamera
    if not Camera then return end

    local Viewport = Camera.ViewportSize
    if Viewport.X <= 0 or Viewport.Y <= 0 then return end

    local ScaleX = (Viewport.X - SCREEN_MARGIN) / CARD_WIDTH
    local ScaleY = (Viewport.Y - SCREEN_MARGIN) / CARD_HEIGHT

    CardScale.Scale = math.clamp(math.min(ScaleX, ScaleY), MIN_SCALE, MAX_SCALE)
end

local function BindCamera()
    local Camera = workspace.CurrentCamera
    if not Camera or Camera == BoundCamera then return end

    BoundCamera = Camera

    if CameraSizeConnection then
        CameraSizeConnection:Disconnect()
        CameraSizeConnection = nil
    end

    UpdateScale()

    CameraSizeConnection = Camera:GetPropertyChangedSignal("ViewportSize"):Connect(UpdateScale)
end

pcall(BindCamera)

table.insert(
    ScaleConnections,
    workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(function()
        pcall(BindCamera)
    end)
)

local function DisconnectScale()
    for _, Connection in ipairs(ScaleConnections) do
        pcall(function() Connection:Disconnect() end)
    end

    if CameraSizeConnection then
        pcall(function() CameraSizeConnection:Disconnect() end)
        CameraSizeConnection = nil
    end
end

local SidePanel = Instance.new("Frame")
SidePanel.Name = "SidePanel"
SidePanel.Position = UDim2.fromOffset(1, 1)
SidePanel.Size = UDim2.fromOffset(169, 198)
SidePanel.BackgroundColor3 = COLOR_SIDE
SidePanel.BorderSizePixel = 0
SidePanel.Parent = Card

Track(SidePanel, "BackgroundTransparency", 0)

Instance.new("UICorner", SidePanel).CornerRadius = UDim.new(0, 15)

local SideFiller = Instance.new("Frame")
SideFiller.Position = UDim2.fromOffset(140, 1)
SideFiller.Size = UDim2.fromOffset(30, 198)
SideFiller.BackgroundColor3 = COLOR_SIDE
SideFiller.BorderSizePixel = 0
SideFiller.Parent = Card

Track(SideFiller, "BackgroundTransparency", 0)

local Logo = Instance.new("ImageLabel")
Logo.Name = "Logo"
Logo.AnchorPoint = Vector2.new(0.5, 0)
Logo.Size = UDim2.fromOffset(92, 86)
Logo.Position = UDim2.new(0.5, 0, 0, 30)
Logo.BackgroundTransparency = 1
Logo.Image = LOGO_ID
Logo.ScaleType = Enum.ScaleType.Fit
Logo.Parent = SidePanel

Track(Logo, "ImageTransparency", 0)

local SpinnerHolder = Instance.new("Frame")
SpinnerHolder.Name = "Spinner"
SpinnerHolder.AnchorPoint = Vector2.new(0.5, 0.5)
SpinnerHolder.Size = UDim2.fromOffset(36, 36)
SpinnerHolder.Position = UDim2.new(0.5, 0, 0, 150)
SpinnerHolder.BackgroundTransparency = 1
SpinnerHolder.BorderSizePixel = 0
SpinnerHolder.Parent = SidePanel

local function MakeRing(Color, Transparency)
    local RingFrame = Instance.new("Frame")
    RingFrame.AnchorPoint = Vector2.new(0.5, 0.5)
    RingFrame.Position = UDim2.fromScale(0.5, 0.5)
    RingFrame.Size = UDim2.fromOffset(24, 24)
    RingFrame.BackgroundTransparency = 1
    RingFrame.BorderSizePixel = 0
    RingFrame.Parent = SpinnerHolder

    Instance.new("UICorner", RingFrame).CornerRadius = UDim.new(1, 0)

    local Stroke = Instance.new("UIStroke")
    Stroke.Thickness = 2.5
    Stroke.Color = Color
    Stroke.Transparency = Transparency
    Stroke.Parent = RingFrame

    return RingFrame, Stroke
end

local _, TrackStroke = MakeRing(Color3.fromRGB(90, 90, 90), 0.4)

Track(TrackStroke, "Transparency", 0.4)

local SpinnerRing, SpinnerStroke = MakeRing(COLOR_ACCENT, 0)

Track(SpinnerStroke, "Transparency", 0)

local CometGradient = Instance.new("UIGradient")
CometGradient.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0),
    NumberSequenceKeypoint.new(0.35, 0),
    NumberSequenceKeypoint.new(0.7, 1),
    NumberSequenceKeypoint.new(1, 1)
})

CometGradient.Parent = SpinnerStroke

local SpinTween = TweenService:Create(
    SpinnerRing,
    TweenInfo.new(0.9, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, -1),
    { Rotation = 360 }
)

local function MakeLabel(Text, X, Y, W, H, Size, Color, Font)
    local L = Instance.new("TextLabel")
    L.Position = UDim2.fromOffset(X, Y)
    L.Size = UDim2.fromOffset(W, H)
    L.BackgroundTransparency = 1
    L.Text = Text
    L.TextColor3 = Color
    L.TextSize = Size
    L.Font = Font
    L.TextXAlignment = Enum.TextXAlignment.Left
    L.TextYAlignment = Enum.TextYAlignment.Center
    L.TextTruncate = Enum.TextTruncate.AtEnd
    L.Parent = Card

    Track(L, "TextTransparency", 0)

    return L
end

local function MakeBox(X, Y, W, H, Color)
    local F = Instance.new("Frame")
    F.Position = UDim2.fromOffset(X, Y)
    F.Size = UDim2.fromOffset(W, H)
    F.BackgroundColor3 = Color
    F.BorderSizePixel = 0
    F.Parent = Card

    Track(F, "BackgroundTransparency", 0)

    return F
end

MakeLabel(PlaceName, 192, 20, 328, 24, 18, COLOR_TEXT, Enum.Font.GothamBold)
MakeLabel("Script: " .. SCRIPT_NAME, 192, 46, 328, 18, 13, COLOR_MUTED, Enum.Font.Gotham)
MakeLabel("กำลังโหลด...", 192, 66, 328, 16, 12, COLOR_ACCENT, Enum.Font.GothamMedium)
MakeBox(192, 92, 328, 1, COLOR_DIVIDER)

local DiscordIcon = Instance.new("ImageLabel")
DiscordIcon.Name = "DiscordIcon"
DiscordIcon.Position = UDim2.fromOffset(192, 106)
DiscordIcon.Size = UDim2.fromOffset(52, 52)
DiscordIcon.BackgroundColor3 = COLOR_SIDE
DiscordIcon.BorderSizePixel = 0
DiscordIcon.Image = ""
DiscordIcon.ScaleType = Enum.ScaleType.Crop
DiscordIcon.Parent = Card

Track(DiscordIcon, "BackgroundTransparency", 0)
Track(DiscordIcon, "ImageTransparency", 0)

Instance.new("UICorner", DiscordIcon).CornerRadius = UDim.new(0, 12)

local ServerName = MakeLabel("Discord", 254, 104, 266, 20, 15, COLOR_TEXT, Enum.Font.GothamBold)

local OnlineDot = MakeBox(254, 133, 8, 8, COLOR_ONLINE)
Instance.new("UICorner", OnlineDot).CornerRadius = UDim.new(1, 0)

local OnlineLabel = MakeLabel("...", 268, 128, 92, 18, 12, COLOR_MUTED, Enum.Font.Gotham)

local MemberDot = MakeBox(366, 133, 8, 8, COLOR_ACCENT)
Instance.new("UICorner", MemberDot).CornerRadius = UDim.new(1, 0)

local MemberLabel = MakeLabel("...", 380, 128, 140, 18, 12, COLOR_MUTED, Enum.Font.Gotham)
local InviterLabel = MakeLabel("Invite by: ...", 254, 148, 266, 18, 12, COLOR_MUTED, Enum.Font.Gotham)

MakeLabel(WEBSITE_NAME .. "   •   " .. DISCORD_LINK, 192, 174, 328, 16, 11, COLOR_ACCENT, Enum.Font.GothamMedium)

local DiscordDone = false

local function DiscordFail()
    OnlineLabel.Text = "N/A"
    MemberLabel.Text = "N/A"
    InviterLabel.Text = "Invite by: -"
end

local function FetchDiscord()
    local Req = GetRequestFunction()

    if not Req then
        DiscordFail()
        return
    end

    local Ok, Res = pcall(Req, {
        Url = "https://discord.com/api/v10/invites/" .. DISCORD_CODE .. "?with_counts=true",
        Method = "GET"
    })

    if not (Ok and Res and Res.StatusCode == 200 and Res.Body) then
        DiscordFail()
        return
    end

    local OkJson, Data = pcall(function()
        return HttpService:JSONDecode(Res.Body)
    end)

    if not OkJson or type(Data) ~= "table" then
        DiscordFail()
        return
    end

    local Guild = Data.guild

    if type(Guild) == "table" and Guild.name then
        ServerName.Text = tostring(Guild.name)
    end

    OnlineLabel.Text = FormatNumber(Data.approximate_presence_count or 0) .. " Online"
    MemberLabel.Text = FormatNumber(Data.approximate_member_count or 0) .. " Members"

    local Inviter = Data.inviter

    if type(Inviter) == "table" then
        InviterLabel.Text = "Invite by: " .. tostring(Inviter.global_name or Inviter.username or "Unknown")
    else
        InviterLabel.Text = "Invite by: -"
    end

    local GetAsset = getcustomasset or getsynasset

    if type(Guild) == "table" and Guild.icon and writefile and GetAsset then
        pcall(function()
            local IconUrl = string.format(
                "https://cdn.discordapp.com/icons/%s/%s.png?size=128",
                tostring(Guild.id),
                tostring(Guild.icon)
            )

            local IconRes = Req({ Url = IconUrl, Method = "GET" })

            if IconRes and IconRes.StatusCode == 200 and IconRes.Body and #IconRes.Body > 0 then
                local FileName = "hubloader_discord_" .. DISCORD_CODE .. ".png"
                writefile(FileName, IconRes.Body)
                DiscordIcon.Image = GetAsset(FileName)
            end
        end)
    end
end

task.spawn(function()
    pcall(FetchDiscord)

    if DiscordIcon.Image == "" then
        DiscordIcon.Image = LOGO_ID
    end

    DiscordDone = true
end)

local function ShowLoader()
    Card.Position = UDim2.new(0.5, 0, 0.5, 14)

    FadeAll(false, 0.5)

    Tween(Card, 0.6, { Position = UDim2.fromScale(0.5, 0.5) }, Enum.EasingStyle.Quint)

    task.wait(0.35)

    SpinTween:Play()

    task.wait(LOADING_TIME)

    local Waited = 0

    while not DiscordDone and Waited < 4 do
        task.wait(0.1)
        Waited = Waited + 0.1
    end

    task.wait(0.6)

    Tween(
        Card,
        0.45,
        { Position = UDim2.new(0.5, 0, 0.5, -10) },
        Enum.EasingStyle.Quad,
        Enum.EasingDirection.In
    )

    FadeAll(true, 0.4)

    task.wait(0.5)

    SpinTween:Cancel()
    DisconnectScale()
    ScreenGui:Destroy()

    task.spawn(function()
        LoadScript(LOAD_URL)
    end)
end

ShowLoader()
`;

// REQUIRE_KEY_HUB=1: URL สคริปต์เกมไม่ถูกฝังใน loader อีก — ต้องมี getgenv().Key ถึงจะโหลดเกมได้ (ผ่าน /game-script)
export const hubKeyed = () => process.env.REQUIRE_KEY_HUB === '1';
export const buildLoader = () => LUA.replace('--@@FXAPI@@', () => hubKeyed() ? fxApiLua() : 'local FxApi = {}').replace('--@@GAMES@@', () => sourceGamesLua(hubKeyed()));
