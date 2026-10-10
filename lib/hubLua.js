// สร้างอัตโนมัติจาก lua/hub.lua ด้วย `npm run build:lua` — อย่าแก้ไฟล์นี้ตรง ๆ
export const HUB_LUA = String.raw`-- Flexozy Hub v9 (UI = v8 เดิมทุกอย่าง / แก้ logic + เพิ่ม Run by Map Name ในหน้า Settings)
if getgenv and getgenv().__FLEXOZY_LOADED then return end
if getgenv then getgenv().__FLEXOZY_LOADED = true end

local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local Lighting = game:GetService("Lighting")
local UIS = game:GetService("UserInputService")
local Workspace = game:GetService("Workspace")
local SoundService = game:GetService("SoundService")
local CoreGui = game:GetService("CoreGui")
local Marketplace = game:GetService("MarketplaceService")
local ContentProvider = game:GetService("ContentProvider")
local HttpService = game:GetService("HttpService")

local LocalPlayer = Players.LocalPlayer
local env = (getgenv and getgenv()) or _G

local SAVE_FILE = "Flexozy_SavedKey.txt"
local KEYED = --@@KEYED@@
local KEY_LINK = --@@KEYLINK@@
local SUPPORT_LINK = --@@SUPPORTLINK@@
local blurEnabled = true
local AUTO_RUN = true

local SND_TOGGLE = "rbxassetid://111174530730534"
local SND_NOTIFY = "rbxassetid://6436188054"
local SND_CLICK = "rbxassetid://91660275693179"
local SND_INTRO = "rbxassetid://140419294351439"

local LOGO_ID = "112028775617493"
local ICON_RECOMMEND = "9405930424"
local ICON_ALL = "79159724721875"
local ICON_CREDITS = "104769040369946"
local ICON_SETTINGS = "87350324375899"
local ICON_CHECK = "8215093320"
local ICON_DEV = "9405930424"
local DEV_NAME = "Flexozy"
local DEV_ROBLOX_ID = 8986753840
local DISCORD_CODE = --@@DISCORDCODE@@
local DISCORD_LINK = "discord.gg/" .. DISCORD_CODE

--@@GAMES@@

--@@FXAPI@@

local C = {
    bg = Color3.fromRGB(20, 20, 28),
    dock = Color3.fromRGB(10, 10, 16),
    modal = Color3.fromRGB(32, 33, 44),
    white = Color3.fromRGB(255, 255, 255),
    muted = Color3.fromRGB(140, 145, 165),
    soft = Color3.fromRGB(160, 165, 185),
    blue = Color3.fromRGB(10, 132, 255),
    green = Color3.fromRGB(48, 209, 88),
    red = Color3.fromRGB(255, 69, 58),
    off = Color3.fromRGB(60, 60, 70),
    btn = Color3.fromRGB(50, 52, 68),
}

local function make(class, props, parent)
    local o = Instance.new(class)
    for k, v in pairs(props or {}) do o[k] = v end
    o.Parent = parent
    return o
end

local function corner(o, r)
    return make("UICorner", { CornerRadius = UDim.new(0, r) }, o)
end

local function stroke(o, thick, trans, color)
    return make("UIStroke", {
        Color = color or C.white,
        Thickness = thick,
        Transparency = trans,
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
    }, o)
end

local function tween(o, t, props, style, dir)
    local tw = TweenService:Create(o, TweenInfo.new(t, style or Enum.EasingStyle.Quart, dir or Enum.EasingDirection.Out), props)
    tw:Play()
    return tw
end

local function label(parent, txt, size, pos, dim, opts)
    opts = opts or {}
    return make("TextLabel", {
        BackgroundTransparency = 1,
        Text = txt,
        Font = opts.font or Enum.Font.GothamMedium,
        TextSize = size,
        TextColor3 = opts.color or C.white,
        TextXAlignment = opts.align or Enum.TextXAlignment.Left,
        TextYAlignment = opts.yalign or Enum.TextYAlignment.Center,
        TextWrapped = opts.wrapped or false,
        TextTruncate = opts.truncate and Enum.TextTruncate.AtEnd or Enum.TextTruncate.None,
        Position = pos,
        Size = dim,
    }, parent)
end

local function playSound(id)
    pcall(function()
        local s = Instance.new("Sound")
        s.SoundId = id
        s.Volume = 0.5
        s.Parent = SoundService
        s:Play()
        s.Ended:Connect(function() s:Destroy() end)
        task.delay(8, function() if s.Parent then s:Destroy() end end)
    end)
end

local function setImage(obj, assetId)
    obj.Image = "rbxassetid://" .. tostring(assetId)
    task.spawn(function()
        pcall(function() ContentProvider:PreloadAsync({ obj }) end)
    end)
end

local function copyText(txt)
    local fn = setclipboard or toclipboard
    if fn then return (pcall(fn, txt)) end
    return false
end

local function saveKey(k)
    if writefile then pcall(writefile, SAVE_FILE, k) end
end

local function loadKey()
    if not (readfile and isfile) then return nil end
    local ok, v = pcall(function()
        if isfile(SAVE_FILE) then return readfile(SAVE_FILE) end
        return nil
    end)
    if ok and type(v) == "string" then return (string.gsub(v, "%s+", "")) end
    return nil
end

local function deleteKey()
    if delfile and isfile then
        pcall(function() if isfile(SAVE_FILE) then delfile(SAVE_FILE) end end)
    end
end

local function requestFn()
    return request or http_request or (syn and syn.request) or (http and http.request)
end

local function httpGet(url)
    local req = requestFn()
    if req then
        local ok, res = pcall(req, { Url = url, Method = "GET" })
        if ok and res then
            local body = res.Body or res.body
            if body and body ~= "" then return body end
        end
    end
    local ok, body = pcall(function() return game:HttpGet(url) end)
    if ok and body and body ~= "" then return body end
    return nil, "เชื่อมต่อล้มเหลว"
end

local function formatNumber(n)
    local s = tostring(math.floor(n or 0))
    local result = s:reverse():gsub("(%d%d%d)", "%1,"):reverse()
    return (result:gsub("^,", ""))
end

local function fetchDiscordInfo()
    local req = requestFn()
    if not req then return nil end
    local ok, res = pcall(req, {
        Url = "https://discord.com/api/v10/invites/" .. DISCORD_CODE .. "?with_counts=true",
        Method = "GET",
    })
    if not ok or not res or res.StatusCode ~= 200 or not res.Body then return nil end
    local okJson, data = pcall(function() return HttpService:JSONDecode(res.Body) end)
    if not okJson or type(data) ~= "table" then return nil end
    return data
end

-- ===== จับคู่แมพ: PlaceId / UniverseId (GameId) / ชื่อแมพ / alias =====
local function normName(s)
    return (string.lower(tostring(s or "")):gsub("[^%w\128-\255]", ""))
end

local currentName = tostring(game.Name or "")
pcall(function()
    local info = Marketplace:GetProductInfo(game.PlaceId)
    if info and info.Name and tostring(info.Name) ~= "" then currentName = info.Name end
end)

local function matchesIds(g)
    local pid, gid = tonumber(game.PlaceId), tonumber(game.GameId)
    if g.PlaceId and g.PlaceId ~= 0 and (g.PlaceId == pid or g.PlaceId == gid) then return true end
    if g.PlaceIds then
        for _, id in ipairs(g.PlaceIds) do
            id = tonumber(id)
            if id and (id == pid or id == gid) then return true end
        end
    end
    return false
end

-- ชื่อแมพปัจจุบันตรงกับชื่อ/alias ของสคริปต์ไหม (ต้องยาว >= 3 ตัว กันกรณีชื่อว่างแล้วตรงทุกอัน)
local function matchesName(g)
    local cn = normName(currentName)
    if #cn < 3 then return false end
    local names = { g.Title }
    if g.Aliases then for _, a in ipairs(g.Aliases) do names[#names + 1] = a end end
    for _, n in ipairs(names) do
        local nn = normName(n)
        if #nn >= 3 and (nn == cn or string.find(cn, nn, 1, true) or string.find(nn, cn, 1, true)) then return true end
    end
    return false
end

local function matchesCurrent(g)
    local noPlace = (not g.PlaceId or g.PlaceId == 0) and (not g.PlaceIds or #g.PlaceIds == 0)
    return noPlace or matchesIds(g) or matchesName(g)
end

-- คะแนนความเหมือนระหว่างข้อความที่พิมพ์กับชื่อแมพ (ตรงทั้งคำ > ขึ้นต้น > มีอยู่ในชื่อ)
local function nameScore(query, g)
    local q = normName(query)
    if #q < 2 then return 0 end
    local best = 0
    local names = { g.Title }
    if g.Aliases then for _, a in ipairs(g.Aliases) do names[#names + 1] = a end end
    for _, n in ipairs(names) do
        local nn = normName(n)
        if nn ~= "" then
            if nn == q then best = math.max(best, 100)
            elseif string.sub(nn, 1, #q) == q then best = math.max(best, 70)
            elseif string.find(nn, q, 1, true) then best = math.max(best, 50)
            elseif #nn >= 3 and string.find(q, nn, 1, true) then best = math.max(best, 30) end
        end
    end
    return best
end

local function findGameByName(query)
    local best, bestScore = nil, 0
    for _, g in ipairs(GAMES) do
        local s = nameScore(query, g)
        if s > bestScore then best, bestScore = g, s end
    end
    return best, bestScore
end

local detected = nil
for _, g in ipairs(GAMES) do
    if g.PlaceId ~= 0 or (g.PlaceIds and #g.PlaceIds > 0) then
        if matchesIds(g) then detected = g break end
    end
end
if not detected then
    for _, g in ipairs(GAMES) do
        if (g.PlaceId ~= 0 or (g.PlaceIds and #g.PlaceIds > 0) or (g.Aliases and #g.Aliases > 0)) and matchesName(g) then detected = g break end
    end
end

local gui = Instance.new("ScreenGui")
gui.Name = "Flexozy_Hub"
gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.DisplayOrder = 999

local mounted = pcall(function()
    if gethui then
        gui.Parent = gethui()
    elseif syn and syn.protect_gui then
        syn.protect_gui(gui)
        gui.Parent = CoreGui
    else
        gui.Parent = LocalPlayer:WaitForChild("PlayerGui")
    end
end)
if not mounted or not gui.Parent then
    gui.Parent = LocalPlayer:WaitForChild("PlayerGui")
end

gui.Destroying:Connect(function()
    if getgenv then getgenv().__FLEXOZY_LOADED = nil end
end)

local uiScale = make("UIScale", { Scale = 1 }, gui)
local userScale = 1

local function applyScale()
    local cam = Workspace.CurrentCamera
    local fit = 1
    if cam then
        local v = cam.ViewportSize
        fit = math.clamp(math.min(v.X / 900, v.Y / 620), 0.5, 1)
    end
    uiScale.Scale = fit * userScale
end
applyScale()
do
    local cam = Workspace.CurrentCamera
    if cam then cam:GetPropertyChangedSignal("ViewportSize"):Connect(applyScale) end
end

local function makeDraggable(frame, handle)
    handle = handle or frame
    local dragging = false
    local startPos, startFramePos
    handle.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            startPos = input.Position
            startFramePos = frame.Position
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then dragging = false end
            end)
        end
    end)
    UIS.InputChanged:Connect(function(input)
        if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
            local d = (input.Position - startPos) / uiScale.Scale
            frame.Position = UDim2.new(
                startFramePos.X.Scale, startFramePos.X.Offset + d.X,
                startFramePos.Y.Scale, startFramePos.Y.Offset + d.Y
            )
        end
    end)
end

local banner = make("Frame", {
    Name = "NotificationBanner",
    AnchorPoint = Vector2.new(0.5, 0),
    Size = UDim2.fromOffset(250, 38),
    Position = UDim2.new(0.5, 0, 0, -100),
    BackgroundColor3 = Color3.fromRGB(15, 15, 22),
    BackgroundTransparency = 1,
    Visible = false,
    ClipsDescendants = true,
    ZIndex = 400,
}, gui)
corner(banner, 18)
make("UIGradient", {
    Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(35, 38, 55)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(18, 18, 26)),
    }),
    Rotation = 90,
}, banner)
local bannerStroke = stroke(banner, 1, 1)

local bannerIconBg = make("Frame", {
    Size = UDim2.fromOffset(30, 30),
    Position = UDim2.new(0, 8, 0.5, -15),
    BackgroundColor3 = C.green,
    BackgroundTransparency = 1,
}, banner)
corner(bannerIconBg, 8)
local bannerIcon = make("ImageLabel", {
    Size = UDim2.fromOffset(16, 16),
    Position = UDim2.new(0.5, -8, 0.5, -8),
    BackgroundTransparency = 1,
    Image = "rbxassetid://" .. ICON_CHECK,
    ImageColor3 = C.white,
    ImageTransparency = 1,
}, bannerIconBg)
local bannerTitle = label(banner, "Flexozy Hub", 10, UDim2.new(0, 46, 0, 8), UDim2.new(1, -54, 0, 14), { font = Enum.Font.GothamBold })
bannerTitle.TextTransparency = 1
local bannerMsg = label(banner, "", 9, UDim2.new(0, 46, 0, 22), UDim2.new(1, -54, 0, 14), { color = Color3.fromRGB(180, 185, 205), truncate = true })
bannerMsg.TextTransparency = 1

local notifQueue, notifBusy = {}, false
local function notify(title, message)
    if #notifQueue > 20 then table.remove(notifQueue, 1) end
    table.insert(notifQueue, { title = title, message = message })
    if notifBusy then return end
    notifBusy = true
    task.spawn(function()
        while #notifQueue > 0 do
            local n = table.remove(notifQueue, 1)
            bannerTitle.Text = n.title or "Flexozy Hub"
            bannerMsg.Text = n.message or ""
            banner.Size = UDim2.fromOffset(250, 38)
            banner.Position = UDim2.new(0.5, 0, 0, -100)
            banner.BackgroundTransparency = 1
            bannerIconBg.BackgroundTransparency = 1
            bannerIcon.ImageTransparency = 1
            bannerTitle.TextTransparency = 1
            bannerMsg.TextTransparency = 1
            bannerStroke.Transparency = 1
            banner.Visible = true
            playSound(SND_NOTIFY)
            tween(banner, 0.4, { Position = UDim2.new(0.5, 0, 0, 16), Size = UDim2.fromOffset(300, 46), BackgroundTransparency = 0.15 }, Enum.EasingStyle.Back)
            tween(bannerIconBg, 0.35, { BackgroundTransparency = 0.15 })
            tween(bannerIcon, 0.3, { ImageTransparency = 0 })
            tween(bannerTitle, 0.3, { TextTransparency = 0 })
            tween(bannerMsg, 0.3, { TextTransparency = 0 })
            tween(bannerStroke, 0.3, { Transparency = 0.75 })
            task.wait(2.6)
            tween(banner, 0.35, { Position = UDim2.new(0.5, 0, 0, -100), Size = UDim2.fromOffset(250, 38), BackgroundTransparency = 1 }, Enum.EasingStyle.Quart, Enum.EasingDirection.In)
            tween(bannerIconBg, 0.2, { BackgroundTransparency = 1 })
            tween(bannerIcon, 0.2, { ImageTransparency = 1 })
            tween(bannerTitle, 0.2, { TextTransparency = 1 })
            tween(bannerMsg, 0.2, { TextTransparency = 1 })
            tween(bannerStroke, 0.2, { Transparency = 1 })
            task.wait(0.45)
            banner.Visible = false
        end
        notifBusy = false
    end)
end

-- ===== โหลด/รันสคริปต์ของแมพ =====
-- Url ขึ้นต้น "fx:" = ลิงก์ถูกซ่อน ดึงผ่านเซิร์ฟเวอร์ด้วย key (ผู้ใช้/บอทไม่เห็น URL จริง)
local function fetchGameCode(g)
    if g.Url and string.sub(g.Url, 1, 3) == "fx:" then
        if not FxApi or not FxApi.fetch then return nil, "ระบบ Key API ไม่พร้อม" end
        local id = string.sub(g.Url, 4)
        return FxApi.fetch("hub:" .. id, "game-script/" .. id)
    end
    return httpGet(g.Url)
end

-- จำนวนการรัน (นับที่เซิร์ฟเวอร์ ผูกกับ key) — แสดงใต้โปรไฟล์ Roblox ด้านซ้าย
local runsLabel
local function refreshRuns()
    if not KEYED or not runsLabel then return end
    local d = FxApi and FxApi.last
    if type(d) == "table" and d.runs ~= nil then runsLabel.Text = "Runs: " .. tostring(d.runs) end
end

local running = false
local function runGame(g, byName)
    if not g or not g.Url or g.Url == "" then
        notify("ไม่มีลิงก์", "แมพนี้ยังไม่ได้ใส่ Url")
        return
    end
    if not byName and not matchesCurrent(g) then
        notify("ไม่ตรงแมพ", "[" .. g.Title .. "] รันไม่ได้ ไม่ถูกแมพ")
        return
    end
    if running then
        notify("Please wait", "กำลังโหลดสคริปต์อื่นอยู่")
        return
    end
    running = true
    notify("Loading", "กำลังโหลด " .. g.Title)
    task.spawn(function()
        local code, err = fetchGameCode(g)
        refreshRuns()
        if not code then
            running = false
            notify("Load Failed", tostring(err))
            return
        end
        local head = string.lower(string.sub(code, 1, 200))
        if string.find(head, "<!doctype", 1, true) or string.find(head, "<html", 1, true) then
            running = false
            notify("Invalid Script", "ลิงก์นี้ไม่ใช่ raw script")
            return
        end
        local fn, cerr = loadstring(code, "=" .. g.Title)
        if not fn then
            running = false
            notify("Compile Error", tostring(cerr))
            return
        end
        local ok, rerr = pcall(fn)
        running = false
        if ok then
            notify("Executed", "รัน " .. g.Title .. " สำเร็จ")
        else
            notify("Runtime Error", tostring(rerr))
        end
    end)
end

local blur = Lighting:FindFirstChild("UIBlurEffect")
if not blur then
    blur = Instance.new("BlurEffect")
    blur.Name = "UIBlurEffect"
    blur.Size = 0
    blur.Parent = Lighting
end

local hubOpen, settingsOpen, loginOpen = false, false, false
local effectsOn = false
local baseFOV = 70

local function updateEffects()
    local want = blurEnabled and (hubOpen or settingsOpen or loginOpen)
    local cam = Workspace.CurrentCamera
    if want then
        if not effectsOn then
            effectsOn = true
            if cam then baseFOV = cam.FieldOfView end
        end
        tween(blur, 0.4, { Size = 18 })
        if cam then tween(cam, 0.4, { FieldOfView = baseFOV - 2 }) end
    elseif effectsOn then
        effectsOn = false
        tween(blur, 0.35, { Size = 0 })
        if cam then tween(cam, 0.35, { FieldOfView = baseFOV }) end
    end
end

local WIN_W, WIN_H = 820, 520

local main = make("Frame", {
    Name = "MainFrame",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    Size = UDim2.fromOffset(WIN_W, WIN_H),
    BackgroundColor3 = C.bg,
    BackgroundTransparency = 0.2,
    Active = true,
    Visible = false,
    ClipsDescendants = true,
}, gui)
corner(main, 22)
stroke(main, 1.2, 0.8)
local mainScale = make("UIScale", { Scale = 0.85 }, main)
make("UIGradient", {
    Color = ColorSequence.new({
        ColorSequenceKeypoint.new(0, Color3.fromRGB(255, 255, 255)),
        ColorSequenceKeypoint.new(1, Color3.fromRGB(120, 125, 165)),
    }),
    Rotation = 45,
}, main)

local sidebar = make("Frame", {
    Name = "Sidebar",
    Position = UDim2.fromOffset(8, 8),
    Size = UDim2.new(0, 170, 1, -16),
    BackgroundColor3 = C.dock,
    BackgroundTransparency = 0.35,
}, main)
corner(sidebar, 16)
stroke(sidebar, 1, 0.88)

local logo = make("ImageLabel", {
    Size = UDim2.fromOffset(38, 38),
    Position = UDim2.fromOffset(14, 14),
    BackgroundTransparency = 1,
}, sidebar)
corner(logo, 10)
setImage(logo, LOGO_ID)
label(sidebar, "Flexozy", 14, UDim2.fromOffset(60, 16), UDim2.new(1, -66, 0, 18), { font = Enum.Font.GothamBold })
label(sidebar, "SCRIPT HUB", 9, UDim2.fromOffset(60, 34), UDim2.new(1, -66, 0, 14), { color = C.blue, font = Enum.Font.GothamBold })

local tabsFrame = make("Frame", {
    Name = "TabList",
    Position = UDim2.fromOffset(8, 74),
    Size = UDim2.new(1, -16, 0, 200),
    BackgroundTransparency = 1,
}, sidebar)
make("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, tabsFrame)

local profile = make("Frame", {
    Name = "Profile",
    Position = UDim2.new(0, 8, 1, -70),
    Size = UDim2.new(1, -16, 0, 62),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.92,
}, sidebar)
corner(profile, 12)
local avatar = make("ImageLabel", {
    Size = UDim2.fromOffset(32, 32),
    Position = UDim2.new(0, 9, 0.5, -16),
    BackgroundColor3 = Color3.fromRGB(30, 30, 40),
}, profile)
corner(avatar, 16)
task.spawn(function()
    local ok, content, ready = pcall(function()
        return Players:GetUserThumbnailAsync(LocalPlayer.UserId, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size100x100)
    end)
    if ok and ready then avatar.Image = content end
end)
label(profile, LocalPlayer.DisplayName, 10, UDim2.fromOffset(49, 10), UDim2.new(1, -55, 0, 14), { font = Enum.Font.GothamBold, truncate = true })
label(profile, "@" .. LocalPlayer.Name, 9, UDim2.fromOffset(49, 26), UDim2.new(1, -55, 0, 12), { color = C.soft, truncate = true })
runsLabel = label(profile, KEYED and "Runs: ..." or "", 9, UDim2.fromOffset(49, 40), UDim2.new(1, -55, 0, 12), { color = C.green, font = Enum.Font.GothamBold, truncate = true })

local content = make("Frame", {
    Name = "Content",
    Position = UDim2.fromOffset(190, 14),
    Size = UDim2.new(1, -204, 1, -28),
    BackgroundTransparency = 1,
}, main)
local pageTitle = label(content, "Recommend", 18, UDim2.fromOffset(0, 0), UDim2.new(1, -44, 0, 26), { font = Enum.Font.GothamBold })
local pageSub = label(content, "", 10, UDim2.fromOffset(0, 27), UDim2.new(1, -44, 0, 16), { color = C.muted })

local closeBtn = make("TextButton", {
    Text = "×",
    Font = Enum.Font.GothamBold,
    TextSize = 18,
    TextColor3 = C.white,
    Size = UDim2.fromOffset(30, 30),
    Position = UDim2.new(1, -30, 0, 0),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.9,
    AutoButtonColor = false,
}, content)
corner(closeBtn, 10)

local pages, tabs = {}, {}
local function selectTab(name)
    for key, t in pairs(tabs) do
        local on = key == name
        pages[key].Visible = on
        tween(t.button, 0.25, { BackgroundTransparency = on and 0.84 or 1 })
        tween(t.icon, 0.2, { ImageColor3 = on and C.white or C.soft })
        tween(t.label, 0.2, { TextColor3 = on and C.white or C.soft })
    end
    pageTitle.Text = name
    pageSub.Text = tabs[name].subtitle
end

local tabCount = 0
local function addTab(name, iconId, subtitle)
    tabCount = tabCount + 1
    local b = make("TextButton", {
        Name = name .. "Tab",
        Text = "",
        Size = UDim2.new(1, 0, 0, 40),
        BackgroundColor3 = C.white,
        BackgroundTransparency = 1,
        AutoButtonColor = false,
        LayoutOrder = tabCount,
    }, tabsFrame)
    corner(b, 10)
    local icon = make("ImageLabel", {
        Size = UDim2.fromOffset(18, 18),
        Position = UDim2.new(0, 12, 0.5, -9),
        BackgroundTransparency = 1,
        ImageColor3 = C.soft,
    }, b)
    setImage(icon, iconId)
    local lbl = label(b, name, 11, UDim2.fromOffset(40, 0), UDim2.new(1, -46, 1, 0), { font = Enum.Font.GothamBold, color = C.soft })
    tabs[name] = { button = b, icon = icon, label = lbl, subtitle = subtitle }
    local page = make("Frame", {
        Name = name .. "Page",
        Position = UDim2.fromOffset(0, 56),
        Size = UDim2.new(1, 0, 1, -56),
        BackgroundTransparency = 1,
        Visible = false,
    }, content)
    pages[name] = page
    b.MouseButton1Click:Connect(function()
        playSound(SND_TOGGLE)
        selectTab(name)
    end)
    return page
end

local recommendPage = addTab("Recommend", ICON_RECOMMEND, "Games detected for your current experience")
local allPage = addTab("All Scripts", ICON_ALL, "Search and browse all supported games")
local creditsPage = addTab("Credits", ICON_CREDITS, "Hub information and contributors")
local devPage = addTab("DEV", ICON_DEV, "Developer information")

local hubToken = 0
local function openMain()
    if hubOpen then return end
    hubOpen = true
    hubToken = hubToken + 1
    mainScale.Scale = 0.85
    main.Visible = true
    tween(mainScale, 0.45, { Scale = 1 }, Enum.EasingStyle.Back)
    updateEffects()
end

local function closeMain()
    if not hubOpen then return end
    hubOpen = false
    hubToken = hubToken + 1
    local my = hubToken
    tween(mainScale, 0.25, { Scale = 0.85 }, Enum.EasingStyle.Quart, Enum.EasingDirection.In)
    task.delay(0.27, function()
        if hubToken == my then main.Visible = false end
    end)
    updateEffects()
end

closeBtn.MouseButton1Click:Connect(function()
    playSound(SND_TOGGLE)
    closeMain()
end)

local function createSearchPage(page)
    local entries = {}
    local searchFrame = make("Frame", {
        Name = "SearchFrame",
        Size = UDim2.new(1, -6, 0, 34),
        BackgroundColor3 = C.white,
        BackgroundTransparency = 0.9,
    }, page)
    corner(searchFrame, 10)
    local box = make("TextBox", {
        Name = "SearchBox",
        Size = UDim2.new(1, -28, 1, 0),
        Position = UDim2.fromOffset(14, 0),
        BackgroundTransparency = 1,
        Text = "",
        PlaceholderText = "Search games...",
        PlaceholderColor3 = Color3.fromRGB(120, 125, 145),
        TextColor3 = C.white,
        Font = Enum.Font.GothamMedium,
        TextSize = 11,
        ClearTextOnFocus = false,
        TextXAlignment = Enum.TextXAlignment.Left,
    }, searchFrame)

    local scroll = make("ScrollingFrame", {
        Name = "CardsContainer",
        Position = UDim2.fromOffset(0, 44),
        Size = UDim2.new(1, 0, 1, -44),
        BackgroundTransparency = 1,
        BorderSizePixel = 0,
        ScrollBarThickness = 4,
        ScrollBarImageColor3 = C.white,
        ScrollBarImageTransparency = 0.5,
        CanvasSize = UDim2.new(),
        AutomaticCanvasSize = Enum.AutomaticSize.Y,
    }, page)
    make("UIGridLayout", {
        CellSize = UDim2.new(0.5, -9, 0, 92),
        CellPadding = UDim2.fromOffset(12, 12),
        SortOrder = Enum.SortOrder.LayoutOrder,
    }, scroll)

    box:GetPropertyChangedSignal("Text"):Connect(function()
        local q = string.lower(box.Text)
        for _, e in ipairs(entries) do
            e.card.Visible = q == "" or string.find(e.name, q, 1, true) ~= nil
        end
    end)
    return scroll, entries
end

local recList, recEntries = createSearchPage(recommendPage)
local allList, allEntries = createSearchPage(allPage)

-- แคชไอคอนแมพ: เดิมยิง GetProductInfo ซ้ำทุกการ์ด (Recommend + All = 2 เท่า) ตอนนี้ยิงครั้งเดียวต่อ PlaceId
local iconCache = {}
local function loadCardIcon(img, placeId)
    local c = iconCache[placeId]
    if c == nil then
        iconCache[placeId] = false
        task.spawn(function()
            local url = "rbxthumb://type=Asset&id=" .. tostring(placeId) .. "&w=150&h=150"
            local ok, info = pcall(function() return Marketplace:GetProductInfo(placeId) end)
            if ok and info and tonumber(info.IconImageAssetId) and tonumber(info.IconImageAssetId) > 0 then
                url = "rbxassetid://" .. tostring(info.IconImageAssetId)
            end
            iconCache[placeId] = url
        end)
    end
    task.spawn(function()
        local waited = 0
        while iconCache[placeId] == false and waited < 8 do task.wait(0.2) waited = waited + 0.2 end
        if img.Parent and type(iconCache[placeId]) == "string" then img.Image = iconCache[placeId] end
    end)
end

local function createCard(container, entries, g, current, order)
    local card = make("TextButton", {
        Name = "GameCard",
        Text = "",
        AutoButtonColor = false,
        BackgroundColor3 = current and C.green or C.white,
        BackgroundTransparency = current and 0.88 or 0.93,
        LayoutOrder = order,
    }, container)
    corner(card, 14)
    stroke(card, current and 1.3 or 1, current and 0.45 or 0.88, current and C.green or C.white)

    local img = make("ImageLabel", {
        Name = "CardImg",
        Size = UDim2.fromOffset(60, 60),
        Position = UDim2.new(0, 12, 0.5, -30),
        BackgroundColor3 = Color3.fromRGB(30, 30, 40),
        ScaleType = Enum.ScaleType.Crop,
    }, card)
    corner(img, 12)
    setImage(img, LOGO_ID)

    if g.PlaceId and g.PlaceId ~= 0 then
        loadCardIcon(img, g.PlaceId)
    end

    label(card, g.Title, 12, UDim2.fromOffset(84, 16), UDim2.new(1, -96, 0, 34), {
        font = Enum.Font.GothamBold,
        wrapped = true,
        truncate = true,
        yalign = Enum.TextYAlignment.Top,
    })
    if current then
        local dot = make("Frame", {
            Size = UDim2.fromOffset(6, 6),
            Position = UDim2.fromOffset(84, 61),
            BackgroundColor3 = C.green,
        }, card)
        corner(dot, 3)
        label(card, "PLAYING NOW", 9, UDim2.fromOffset(96, 56), UDim2.new(1, -108, 0, 16), { color = C.green, font = Enum.Font.GothamBold })
    else
        local hasUrl = g.Url and g.Url ~= ""
        label(card, hasUrl and "พร้อมรัน" or "ยังไม่มีลิงก์", 9, UDim2.fromOffset(84, 56), UDim2.new(1, -96, 0, 16), {
            color = hasUrl and C.soft or C.muted,
            truncate = true,
        })
    end

    local baseTrans = current and 0.88 or 0.93
    card.MouseEnter:Connect(function() tween(card, 0.15, { BackgroundTransparency = baseTrans - 0.06 }) end)
    card.MouseLeave:Connect(function() tween(card, 0.15, { BackgroundTransparency = baseTrans }) end)
    card.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        if not g.Url or g.Url == "" then
            notify("ยังไม่มีลิงก์", "[" .. g.Title .. "] ยังไม่ได้ใส่ Url")
            return
        end
        if not matchesCurrent(g) then
            notify("ไม่ตรงแมพ", "[" .. g.Title .. "] รันไม่ได้ ไม่ถูกแมพ")
            return
        end
        closeMain()
        runGame(g)
    end)

    table.insert(entries, { card = card, name = string.lower(g.Title) })
end

local recLimit = detected and 3 or 4
local recCount = 0
for i, g in ipairs(GAMES) do
    if g.Title then
        local current = detected == g
        createCard(allList, allEntries, g, current, i)
        if current then
            createCard(recList, recEntries, g, true, -1)
        elseif recCount < recLimit then
            recCount = recCount + 1
            createCard(recList, recEntries, g, false, i)
        end
    end
end

local creditsScroll = make("ScrollingFrame", {
    Size = UDim2.fromScale(1, 1),
    BackgroundTransparency = 1,
    BorderSizePixel = 0,
    ScrollBarThickness = 4,
    ScrollBarImageColor3 = C.white,
    ScrollBarImageTransparency = 0.5,
    CanvasSize = UDim2.new(),
    AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, creditsPage)
make("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }, creditsScroll)

local function creditRow(role, name)
    local row = make("Frame", {
        Size = UDim2.new(1, -8, 0, 58),
        BackgroundColor3 = C.white,
        BackgroundTransparency = 0.92,
    }, creditsScroll)
    corner(row, 12)
    stroke(row, 1, 0.88)
    label(row, string.upper(role), 9, UDim2.fromOffset(16, 10), UDim2.new(1, -32, 0, 14), { color = Color3.fromRGB(160, 165, 205), font = Enum.Font.GothamBold })
    label(row, name, 13, UDim2.fromOffset(16, 28), UDim2.new(1, -32, 0, 20), { font = Enum.Font.GothamBold })
end
creditRow("Official Script Hub", "Flexozy Hub")
creditRow("Lead Developer", "Flexozy")
creditRow("Script Provider", "LoaderHub1990")

local devScroll = make("ScrollingFrame", {
    Size = UDim2.fromScale(1, 1),
    BackgroundTransparency = 1,
    BorderSizePixel = 0,
    ScrollBarThickness = 4,
    ScrollBarImageColor3 = C.white,
    ScrollBarImageTransparency = 0.5,
    CanvasSize = UDim2.new(),
    AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, devPage)
make("UIListLayout", { Padding = UDim.new(0, 10), SortOrder = Enum.SortOrder.LayoutOrder }, devScroll)

local profileCard = make("Frame", {
    Size = UDim2.new(1, -8, 0, 210),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.92,
    LayoutOrder = 1,
}, devScroll)
corner(profileCard, 14)
stroke(profileCard, 1, 0.88)

local robloxAvatar = make("ImageLabel", {
    Size = UDim2.fromOffset(96, 96),
    Position = UDim2.new(0.5, -48, 0, 18),
    BackgroundColor3 = Color3.fromRGB(30, 30, 40),
    ScaleType = Enum.ScaleType.Crop,
}, profileCard)
corner(robloxAvatar, 48)

task.spawn(function()
    local ok, avatarUrl, ready = pcall(function()
        return Players:GetUserThumbnailAsync(DEV_ROBLOX_ID, Enum.ThumbnailType.HeadShot, Enum.ThumbnailSize.Size150x150)
    end)
    if ok and ready and avatarUrl then
        robloxAvatar.Image = avatarUrl
    else
        robloxAvatar.Image = "rbxthumb://type=AvatarHeadShot&id=" .. tostring(DEV_ROBLOX_ID) .. "&w=150&h=150"
    end
end)

label(profileCard, DEV_NAME, 18, UDim2.new(0, 0, 0, 122), UDim2.new(1, 0, 0, 22), {
    font = Enum.Font.GothamBold,
    align = Enum.TextXAlignment.Center,
})

label(profileCard, "Lead Developer", 10, UDim2.new(0, 0, 0, 146), UDim2.new(1, 0, 0, 16), {
    color = C.blue,
    font = Enum.Font.GothamBold,
    align = Enum.TextXAlignment.Center,
})

local profileBtn = make("TextButton", {
    Size = UDim2.new(1, -32, 0, 34),
    Position = UDim2.new(0, 16, 0, 168),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.88,
    Text = "Roblox Profile  •  " .. tostring(DEV_ROBLOX_ID),
    Font = Enum.Font.GothamBold,
    TextSize = 11,
    TextColor3 = C.white,
    AutoButtonColor = false,
}, profileCard)
corner(profileBtn, 10)
stroke(profileBtn, 1, 0.8)
profileBtn.MouseButton1Click:Connect(function()
    playSound(SND_CLICK)
    local profileUrl = "https://www.roblox.com/users/" .. tostring(DEV_ROBLOX_ID) .. "/profile"
    if copyText(profileUrl) then
        notify("Profile Copied", "คัดลอกลิงก์โปรไฟล์แล้ว")
    else
        notify("Roblox Profile", profileUrl)
    end
end)

local discordCard = make("Frame", {
    Size = UDim2.new(1, -8, 0, 170),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.92,
    LayoutOrder = 2,
}, devScroll)
corner(discordCard, 14)
stroke(discordCard, 1, 0.88)

local discordIcon = make("ImageLabel", {
    Size = UDim2.fromOffset(56, 56),
    Position = UDim2.fromOffset(16, 16),
    BackgroundColor3 = Color3.fromRGB(88, 101, 242),
    BackgroundTransparency = 0.1,
    Image = "",
    ScaleType = Enum.ScaleType.Crop,
}, discordCard)
corner(discordIcon, 12)

local discordName = label(discordCard, "Discord Server", 14, UDim2.fromOffset(84, 18), UDim2.new(1, -100, 0, 20), {
    font = Enum.Font.GothamBold,
    truncate = true,
})

local onlineDot = make("Frame", {
    Size = UDim2.fromOffset(8, 8),
    Position = UDim2.fromOffset(84, 50),
    BackgroundColor3 = C.green,
}, discordCard)
corner(onlineDot, 4)

local onlineLabel = label(discordCard, "Loading...", 11, UDim2.fromOffset(98, 44), UDim2.new(1, -110, 0, 18), {
    color = C.soft,
})

local totalDot = make("Frame", {
    Size = UDim2.fromOffset(8, 8),
    Position = UDim2.fromOffset(84, 72),
    BackgroundColor3 = C.blue,
}, discordCard)
corner(totalDot, 4)

local totalLabel = label(discordCard, "...", 11, UDim2.fromOffset(98, 66), UDim2.new(1, -110, 0, 18), {
    color = C.soft,
})

local offlineDot = make("Frame", {
    Size = UDim2.fromOffset(8, 8),
    Position = UDim2.fromOffset(84, 94),
    BackgroundColor3 = Color3.fromRGB(120, 125, 145),
}, discordCard)
corner(offlineDot, 4)

local offlineLabel = label(discordCard, "...", 11, UDim2.fromOffset(98, 88), UDim2.new(1, -110, 0, 18), {
    color = C.soft,
})

local copyDiscordBtn = make("TextButton", {
    Size = UDim2.new(1, -32, 0, 34),
    Position = UDim2.new(0, 16, 0, 126),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.88,
    Text = "Copy Discord  •  " .. DISCORD_LINK,
    Font = Enum.Font.GothamBold,
    TextSize = 11,
    TextColor3 = C.white,
    AutoButtonColor = false,
}, discordCard)
corner(copyDiscordBtn, 10)
stroke(copyDiscordBtn, 1, 0.8)
copyDiscordBtn.MouseButton1Click:Connect(function()
    playSound(SND_CLICK)
    local fullLink = "https://" .. DISCORD_LINK
    if copyText(fullLink) then
        notify("Discord Copied", "คัดลอก: " .. DISCORD_LINK)
    else
        notify("Discord", DISCORD_LINK)
    end
end)

task.spawn(function()
    local data = fetchDiscordInfo()
    if not data then
        onlineLabel.Text = "N/A"
        totalLabel.Text = "N/A"
        offlineLabel.Text = "N/A"
        return
    end

    if data.guild and data.guild.name then
        discordName.Text = tostring(data.guild.name)
    end

    local online = tonumber(data.approximate_presence_count) or 0
    local total = tonumber(data.approximate_member_count) or 0
    local offline = math.max(total - online, 0)

    onlineLabel.Text = formatNumber(online) .. " Online"
    totalLabel.Text = formatNumber(total) .. " Members"
    offlineLabel.Text = formatNumber(offline) .. " Offline"

    if data.guild and data.guild.icon then
        local req = requestFn()
        if req then
            pcall(function()
                local iconUrl = string.format(
                    "https://cdn.discordapp.com/icons/%s/%s.png?size=128",
                    tostring(data.guild.id),
                    tostring(data.guild.icon)
                )
                local iconRes = req({ Url = iconUrl, Method = "GET" })
                if iconRes and iconRes.StatusCode == 200 and iconRes.Body and #iconRes.Body > 0 then
                    local fileName = "flexozy_discord_" .. DISCORD_CODE .. ".png"
                    if writefile and (getcustomasset or getsynasset) then
                        writefile(fileName, iconRes.Body)
                        local getAsset = getcustomasset or getsynasset
                        discordIcon.Image = getAsset(fileName)
                    end
                end
            end)
        end
    end
end)

selectTab("Recommend")

local edgeDock = make("Frame", {
    Name = "EdgeDock",
    AnchorPoint = Vector2.new(0, 0.5),
    Size = UDim2.fromOffset(44, 100),
    Position = UDim2.new(0, -60, 0.5, 0),
    BackgroundColor3 = Color3.fromRGB(18, 18, 26),
    BackgroundTransparency = 0.25,
    Active = true,
    Visible = false,
    ZIndex = 150,
}, gui)
corner(edgeDock, 16)
stroke(edgeDock, 1.1, 0.75)
makeDraggable(edgeDock)

local toggleBtn = make("ImageButton", {
    Name = "EdgeToggleButton",
    Size = UDim2.fromOffset(32, 32),
    Position = UDim2.new(0.5, -16, 0, 10),
    BackgroundTransparency = 1,
}, edgeDock)
corner(toggleBtn, 8)
setImage(toggleBtn, LOGO_ID)

local accent = make("Frame", {
    Size = UDim2.fromOffset(3, 22),
    Position = UDim2.new(0, 2, 0.5, -11),
    BackgroundColor3 = C.blue,
}, edgeDock)
corner(accent, 99)

local settingsIcon = make("ImageButton", {
    Name = "DockSettingsIcon",
    Size = UDim2.fromOffset(22, 22),
    Position = UDim2.new(0.5, -11, 1, -32),
    BackgroundTransparency = 1,
    ImageColor3 = Color3.fromRGB(170, 175, 195),
}, edgeDock)
setImage(settingsIcon, ICON_SETTINGS)

local function showDock()
    edgeDock.Position = UDim2.new(0, -60, 0.5, 0)
    edgeDock.Visible = true
    tween(edgeDock, 0.4, { Position = UDim2.new(0, 0, 0.5, 0) }, Enum.EasingStyle.Back)
end

toggleBtn.MouseButton1Click:Connect(function()
    playSound(SND_TOGGLE)
    if hubOpen then closeMain() else openMain() end
end)

local settingsModal = make("Frame", {
    Name = "SettingsModal",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.fromScale(0.5, 0.5),
    Size = UDim2.fromOffset(300, 360),
    BackgroundColor3 = C.bg,
    BackgroundTransparency = 0.15,
    Visible = false,
    ClipsDescendants = true,
    ZIndex = 300,
}, gui)
corner(settingsModal, 20)
stroke(settingsModal, 1.1, 0.75)
local settingsScale = make("UIScale", { Scale = 0.85 }, settingsModal)

local sHeader = make("Frame", {
    Size = UDim2.new(1, 0, 0, 40),
    BackgroundTransparency = 1,
    Active = true,
}, settingsModal)
label(sHeader, "Settings & Game Info", 13, UDim2.fromOffset(16, 0), UDim2.new(1, -60, 1, 0), { font = Enum.Font.GothamBold })
local sClose = make("TextButton", {
    Text = "×",
    Font = Enum.Font.GothamBold,
    TextSize = 18,
    TextColor3 = C.white,
    Size = UDim2.fromOffset(26, 26),
    Position = UDim2.new(1, -36, 0, 7),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.9,
    AutoButtonColor = false,
}, sHeader)
corner(sClose, 8)
makeDraggable(settingsModal, sHeader)

local sScroll = make("ScrollingFrame", {
    Name = "SettingsScroll",
    Position = UDim2.fromOffset(8, 44),
    Size = UDim2.new(1, -16, 1, -52),
    BackgroundTransparency = 1,
    BorderSizePixel = 0,
    ScrollBarThickness = 4,
    ScrollBarImageColor3 = C.white,
    ScrollBarImageTransparency = 0.5,
    CanvasSize = UDim2.new(),
    AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, settingsModal)
make("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, sScroll)

local settingsToken = 0
local function openSettings()
    if settingsOpen then return end
    settingsOpen = true
    settingsToken = settingsToken + 1
    settingsScale.Scale = 0.85
    settingsModal.Visible = true
    tween(settingsScale, 0.35, { Scale = 1 }, Enum.EasingStyle.Back)
    updateEffects()
end

local function closeSettings()
    if not settingsOpen then return end
    settingsOpen = false
    settingsToken = settingsToken + 1
    local my = settingsToken
    tween(settingsScale, 0.22, { Scale = 0.85 }, Enum.EasingStyle.Quart, Enum.EasingDirection.In)
    task.delay(0.24, function()
        if settingsToken == my then settingsModal.Visible = false end
    end)
    updateEffects()
end

settingsIcon.MouseButton1Click:Connect(function()
    playSound(SND_TOGGLE)
    if settingsOpen then closeSettings() else openSettings() end
end)
sClose.MouseButton1Click:Connect(function()
    playSound(SND_CLICK)
    closeSettings()
end)

local settingOrder = 0
local function settingRow(height)
    settingOrder = settingOrder + 1
    local f = make("Frame", {
        Size = UDim2.new(1, -6, 0, height),
        BackgroundColor3 = C.white,
        BackgroundTransparency = 0.93,
        LayoutOrder = settingOrder,
    }, sScroll)
    corner(f, 12)
    stroke(f, 1, 0.88)
    return f
end

local gw = settingRow(84)
local gwImg = make("ImageLabel", {
    Size = UDim2.fromOffset(60, 60),
    Position = UDim2.fromOffset(12, 12),
    BackgroundColor3 = Color3.fromRGB(30, 30, 40),
    ScaleType = Enum.ScaleType.Crop,
}, gw)
corner(gwImg, 10)
setImage(gwImg, LOGO_ID)
local gwName = label(gw, "Loading Map...", 11, UDim2.fromOffset(82, 12), UDim2.new(1, -92, 0, 16), { font = Enum.Font.GothamBold, truncate = true })
local gwPlayers = label(gw, "", 9, UDim2.fromOffset(82, 34), UDim2.new(1, -92, 0, 14), { color = C.green })
label(gw, "Place ID: " .. tostring(game.PlaceId), 9, UDim2.fromOffset(82, 52), UDim2.new(1, -92, 0, 14), { color = C.muted, truncate = true })

local function refreshPlayers()
    gwPlayers.Text = "Players in server: " .. #Players:GetPlayers()
end
refreshPlayers()
Players.PlayerAdded:Connect(refreshPlayers)
Players.PlayerRemoving:Connect(function() task.defer(refreshPlayers) end)

task.spawn(function()
    gwImg.Image = "rbxthumb://type=Asset&id=" .. tostring(game.PlaceId) .. "&w=150&h=150"
    if currentName ~= "" then gwName.Text = currentName end
end)

-- ===== Run by Map Name: พิมพ์ชื่อแมพ (หรือชื่ออื่น/alias) แล้วรันสคริปต์ของแมพนั้นได้เลย ไม่ต้องตรง Place ID =====
do
    local row = settingRow(88)
    label(row, "Run by Map Name", 10, UDim2.fromOffset(12, 7), UDim2.new(1, -24, 0, 14), { font = Enum.Font.GothamBold })
    local inputBg = make("Frame", {
        Size = UDim2.new(1, -90, 0, 26),
        Position = UDim2.fromOffset(12, 28),
        BackgroundColor3 = C.white,
        BackgroundTransparency = 0.9,
    }, row)
    corner(inputBg, 8)
    local nameStroke = stroke(inputBg, 1, 0.85)
    local nameBox = make("TextBox", {
        Size = UDim2.new(1, -16, 1, 0),
        Position = UDim2.fromOffset(8, 0),
        BackgroundTransparency = 1,
        Text = "",
        PlaceholderText = "Type map name...",
        PlaceholderColor3 = Color3.fromRGB(120, 125, 145),
        TextColor3 = C.white,
        Font = Enum.Font.GothamMedium,
        TextSize = 10,
        ClearTextOnFocus = false,
        TextXAlignment = Enum.TextXAlignment.Left,
    }, inputBg)
    local runBtn = make("TextButton", {
        Size = UDim2.fromOffset(60, 26),
        Position = UDim2.new(1, -72, 0, 28),
        BackgroundColor3 = C.blue,
        BackgroundTransparency = 0.15,
        Text = "Run",
        Font = Enum.Font.GothamBold,
        TextSize = 9,
        TextColor3 = C.white,
        AutoButtonColor = false,
    }, row)
    corner(runBtn, 8)
    local hint = label(row, "พิมพ์ชื่อแมพ เช่น MM2 / Blade Ball", 9, UDim2.fromOffset(12, 60), UDim2.new(1, -24, 0, 16), { color = C.muted, truncate = true })

    nameBox:GetPropertyChangedSignal("Text"):Connect(function()
        if #normName(nameBox.Text) < 2 then
            hint.Text = "พิมพ์ชื่อแมพ เช่น MM2 / Blade Ball"
            hint.TextColor3 = C.muted
            return
        end
        local g = findGameByName(nameBox.Text)
        if g then
            hint.Text = "→ " .. g.Title
            hint.TextColor3 = C.green
        else
            hint.Text = "ไม่พบแมพที่ตรงกับชื่อนี้"
            hint.TextColor3 = C.red
        end
    end)
    local function runByName()
        local g = findGameByName(nameBox.Text)
        if not g then
            notify("ไม่พบแมพ", "ลองพิมพ์ชื่ออื่น หรือดูรายชื่อในหน้า All Scripts")
            return
        end
        closeSettings()
        notify("Run by Name", "รัน [" .. g.Title .. "] ตามชื่อแมพ")
        runGame(g, true)
    end
    nameBox.Focused:Connect(function()
        playSound(SND_CLICK)
        tween(nameStroke, 0.2, { Color = C.blue, Transparency = 0.3 })
    end)
    nameBox.FocusLost:Connect(function(enter)
        tween(nameStroke, 0.25, { Color = C.white, Transparency = 0.85 })
        if enter then runByName() end
    end)
    runBtn.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        runByName()
    end)
end

local function addToggle(title, desc, default, cb)
    local row = settingRow(46)
    label(row, title, 10, UDim2.fromOffset(12, 7), UDim2.new(1, -66, 0, 14), { font = Enum.Font.GothamBold })
    label(row, desc, 9, UDim2.fromOffset(12, 24), UDim2.new(1, -66, 0, 14), { color = C.muted, truncate = true })
    local sw = make("TextButton", {
        Size = UDim2.fromOffset(38, 22),
        Position = UDim2.new(1, -48, 0.5, -11),
        BackgroundColor3 = default and C.green or C.off,
        Text = "",
        AutoButtonColor = false,
    }, row)
    corner(sw, 99)
    local knob = make("Frame", {
        Size = UDim2.fromOffset(18, 18),
        Position = default and UDim2.new(1, -20, 0.5, -9) or UDim2.new(0, 2, 0.5, -9),
        BackgroundColor3 = C.white,
    }, sw)
    corner(knob, 99)
    local state = default
    sw.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        state = not state
        tween(sw, 0.2, { BackgroundColor3 = state and C.green or C.off })
        tween(knob, 0.2, { Position = state and UDim2.new(1, -20, 0.5, -9) or UDim2.new(0, 2, 0.5, -9) }, Enum.EasingStyle.Back)
        if cb then cb(state) end
    end)
end

addToggle("Camera Blur Effect", "Blur behind open panels", blurEnabled, function(on)
    blurEnabled = on
    updateEffects()
    notify("Setting Updated", "Blur Effect: " .. (on and "ON" or "OFF"))
end)

addToggle("Auto Run Matching Game", "รันสคริปต์อัตโนมัติเมื่อเข้าแมพที่ตรง", AUTO_RUN, function(on)
    AUTO_RUN = on
    notify("Auto Run", on and "เปิดใช้งาน" or "ปิดใช้งาน")
end)

local scaleRow = settingRow(56)
label(scaleRow, "UI Size Scaling", 10, UDim2.fromOffset(12, 7), UDim2.new(1, -90, 0, 14), { font = Enum.Font.GothamBold })
local scaleVal = label(scaleRow, "100%", 10, UDim2.new(1, -72, 0, 7), UDim2.fromOffset(60, 14), { font = Enum.Font.GothamBold, color = C.blue, align = Enum.TextXAlignment.Right })

local scaleButtons = {}
local function scaleButton(txt, x, value)
    local b = make("TextButton", {
        Size = UDim2.fromOffset(44, 22),
        Position = UDim2.fromOffset(x, 28),
        BackgroundColor3 = value == 1 and C.blue or Color3.fromRGB(40, 42, 58),
        BackgroundTransparency = 0.2,
        Text = txt,
        Font = Enum.Font.GothamBold,
        TextSize = 9,
        TextColor3 = C.white,
        AutoButtonColor = false,
    }, scaleRow)
    corner(b, 7)
    table.insert(scaleButtons, b)
    b.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        userScale = value
        applyScale()
        scaleVal.Text = txt
        for _, other in ipairs(scaleButtons) do
            other.BackgroundColor3 = other == b and C.blue or Color3.fromRGB(40, 42, 58)
        end
        notify("UI Scale", "Adjusted UI size to " .. txt)
    end)
end
scaleButton("80%", 12, 0.8)
scaleButton("90%", 62, 0.9)
scaleButton("100%", 112, 1)
scaleButton("110%", 162, 1.1)
scaleButton("120%", 212, 1.2)

if KEYED then
    local keyRow = settingRow(44)
    label(keyRow, "Saved Key Data", 10, UDim2.fromOffset(12, 0), UDim2.new(1, -100, 1, 0), { font = Enum.Font.GothamBold })
    local resetBtn = make("TextButton", {
        Size = UDim2.fromOffset(76, 26),
        Position = UDim2.new(1, -88, 0.5, -13),
        BackgroundColor3 = C.red,
        BackgroundTransparency = 0.2,
        Text = "Reset Key",
        Font = Enum.Font.GothamBold,
        TextSize = 9,
        TextColor3 = C.white,
        AutoButtonColor = false,
    }, keyRow)
    corner(resetBtn, 8)
    resetBtn.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        deleteKey()
        notify("Key Reset", "Saved key deleted! Please rejoin or restart.")
    end)
end

local loginModal = make("Frame", {
    Name = "LoginModal",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Size = UDim2.fromOffset(380, 52),
    Position = UDim2.new(0.5, 0, 1.2, 0),
    BackgroundColor3 = Color3.fromRGB(16, 16, 24),
    BackgroundTransparency = 0.15,
    Visible = false,
    Active = true,
    ZIndex = 250,
}, gui)
corner(loginModal, 16)
stroke(loginModal, 1.1, 0.75)
makeDraggable(loginModal)

local lgLogoBg = make("Frame", {
    Size = UDim2.fromOffset(36, 36),
    Position = UDim2.new(0, 8, 0.5, -18),
    BackgroundColor3 = Color3.fromRGB(26, 26, 38),
    BackgroundTransparency = 0.2,
}, loginModal)
corner(lgLogoBg, 10)
stroke(lgLogoBg, 1, 0.65)
local lgLogo = make("ImageLabel", {
    Size = UDim2.fromOffset(22, 22),
    Position = UDim2.new(0.5, -11, 0.5, -11),
    BackgroundTransparency = 1,
}, lgLogoBg)
corner(lgLogo, 6)
setImage(lgLogo, LOGO_ID)

local inputBg = make("Frame", {
    AnchorPoint = Vector2.new(0, 0.5),
    Size = UDim2.fromOffset(112, 36),
    Position = UDim2.new(0, 50, 0.5, 0),
    BackgroundColor3 = C.white,
    BackgroundTransparency = 0.92,
}, loginModal)
corner(inputBg, 10)
local inputStroke = stroke(inputBg, 1, 0.85)
local keyBox = make("TextBox", {
    Size = UDim2.new(1, -12, 1, 0),
    Position = UDim2.fromOffset(6, 0),
    BackgroundTransparency = 1,
    Text = "",
    PlaceholderText = "Enter Key...",
    PlaceholderColor3 = Color3.fromRGB(120, 125, 145),
    TextColor3 = C.white,
    Font = Enum.Font.GothamBold,
    TextSize = 10,
    ClearTextOnFocus = false,
    TextXAlignment = Enum.TextXAlignment.Left,
}, inputBg)

local unlocked = false
local shaking = false
local autoRan = false

-- เริ่มทำงานหลังผ่านการยืนยันเท่านั้น (บั๊กเดิม: Auto Run ทำงานก่อนกรอก key ทำให้ข้ามหน้า login ได้)
local function afterUnlock()
    refreshRuns()
    showDock()
    if AUTO_RUN and detected and detected.Url and detected.Url ~= "" and not autoRan then
        autoRan = true
        task.delay(3, function()
            if not AUTO_RUN then return end
            notify("Auto Run", "ตรวจพบ [" .. detected.Title .. "] กำลังรันอัตโนมัติ...")
            task.wait(1.2)
            runGame(detected)
        end)
    end
end

local function onAccessGranted()
    if unlocked then return end
    unlocked = true
    loginOpen = false
    notify("Access Granted", "Key Verified Successfully!")
    tween(loginModal, 0.35, { Position = UDim2.new(0.5, 0, 1.2, 0) }, Enum.EasingStyle.Back, Enum.EasingDirection.In)
    updateEffects()
    task.delay(0.4, function()
        loginModal:Destroy()
        afterUnlock()
    end)
end

local function shakeInput()
    if shaking then return end
    shaking = true
    tween(inputStroke, 0.1, { Color = C.red, Transparency = 0.1, Thickness = 1.5 })
    task.spawn(function()
        for _, off in ipairs({ -8, 8, -6, 6, -3, 3, 0 }) do
            if not inputBg.Parent then break end
            inputBg.Position = UDim2.new(0, 50 + off, 0.5, 0)
            task.wait(0.035)
        end
        if inputBg.Parent then
            tween(inputStroke, 0.35, { Color = C.white, Transparency = 0.85, Thickness = 1 })
        end
        shaking = false
    end)
end

local KEY_ERRORS = {
    invalid_key = "Invalid or expired key.",
    hwid_mismatch = "This key is locked to another device.",
    scope = "This key has no Hub access.",
    rate_limited = "Too many attempts, wait a minute.",
}
local function keyError(e)
    return KEY_ERRORS[tostring(e)] or tostring(e)
end

local verifying = false
local verifyBtn
local function verifyKey()
    if unlocked or verifying then return end
    local k = string.gsub(keyBox.Text, "%s+", "")
    if #k < 8 then
        notify("Access Denied", "Incorrect key, please try again.")
        shakeInput()
        return
    end
    verifying = true
    if verifyBtn then verifyBtn.Text = "..." end
    task.spawn(function()
        local prev = env.Key
        env.Key = k
        local token, _, err = FxApi.auth("login") -- ตรวจกับเซิร์ฟเวอร์ (ผูก HWID / เช็คหมดอายุ / เพิกถอน) ไม่มีรหัสผ่านฝังในสคริปต์
        verifying = false
        if verifyBtn then verifyBtn.Text = "Verify" end
        if token then
            saveKey(k)
            onAccessGranted()
        else
            env.Key = prev
            notify("Access Denied", keyError(err))
            shakeInput()
        end
    end)
end

keyBox.Focused:Connect(function()
    playSound(SND_CLICK)
    tween(inputBg, 0.2, { BackgroundTransparency = 0.85 })
    tween(inputStroke, 0.2, { Color = C.blue, Transparency = 0.3, Thickness = 1.3 })
end)
keyBox.FocusLost:Connect(function(enter)
    tween(inputBg, 0.25, { BackgroundTransparency = 0.92 })
    if not shaking then
        tween(inputStroke, 0.25, { Color = C.white, Transparency = 0.85, Thickness = 1 })
    end
    if enter then verifyKey() end
end)

local function loginButton(x, w, color, txt, onClick)
    local b = make("TextButton", {
        AnchorPoint = Vector2.new(0, 0.5),
        Size = UDim2.fromOffset(w, 36),
        Position = UDim2.new(0, x, 0.5, 0),
        BackgroundColor3 = color,
        BackgroundTransparency = 0.15,
        Text = txt,
        Font = Enum.Font.GothamBold,
        TextSize = 9,
        TextColor3 = C.white,
        AutoButtonColor = false,
    }, loginModal)
    corner(b, 10)
    b.MouseButton1Down:Connect(function() tween(b, 0.1, { BackgroundTransparency = 0.4 }) end)
    b.MouseButton1Up:Connect(function() tween(b, 0.2, { BackgroundTransparency = 0.15 }) end)
    b.MouseLeave:Connect(function() tween(b, 0.2, { BackgroundTransparency = 0.15 }) end)
    b.MouseButton1Click:Connect(function()
        playSound(SND_CLICK)
        onClick()
    end)
    return b
end

verifyBtn = loginButton(168, 62, C.blue, "Verify", verifyKey)
loginButton(236, 66, C.btn, "Get Key", function()
    if copyText(KEY_LINK) then
        notify("Key Link Copied", "Get-Key link copied to clipboard!")
    else
        notify("Key Link", KEY_LINK)
    end
end)
loginButton(308, 64, C.btn, "Discord", function()
    if copyText(SUPPORT_LINK) then
        notify("Support Copied", "Support Discord link copied!")
    else
        notify("Support Discord", SUPPORT_LINK)
    end
end)

UIS.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.Escape then
        if settingsOpen then
            closeSettings()
        elseif hubOpen then
            closeMain()
        end
    end
end)

local function showLogin()
    loginOpen = true
    loginModal.Visible = true
    tween(loginModal, 0.5, { Position = UDim2.new(0.5, 0, 0.82, 0) }, Enum.EasingStyle.Back)
    updateEffects()
end

local function start()
    if detected then
        task.delay(1.2, function()
            notify("Game Detected", "Found build for [" .. detected.Title .. "] - tap its card to run.")
        end)
    end
    if not KEYED then
        unlocked = true
        loginModal:Destroy()
        afterUnlock()
        return
    end
    -- ลำดับ: getgenv().Key ที่ผู้ใช้ตั้งไว้ → key ที่บันทึกไว้ในไฟล์ → หน้ากรอก key (ทุกอย่างตรวจกับเซิร์ฟเวอร์ ไม่ใช่เช็คในเครื่อง)
    local fromFile = false
    local key = env.Key and tostring(env.Key) or nil
    if not key or key == "" then
        key = loadKey()
        fromFile = key ~= nil and key ~= ""
    end
    if not key or key == "" then
        showLogin()
        return
    end
    task.spawn(function()
        local prev = env.Key
        env.Key = key
        local token, _, err = FxApi.auth("login")
        if token then
            unlocked = true
            notify("Auto Login", "Key verified automatically!")
            task.wait(0.4)
            if loginModal.Parent then loginModal:Destroy() end
            afterUnlock()
        else
            env.Key = prev
            if fromFile and (err == "invalid_key" or err == "scope") then deleteKey() end
            showLogin()
            notify("Login Required", keyError(err))
        end
    end)
end

task.spawn(function()
    local intro = make("Frame", {
        Name = "IntroOverlay",
        Size = UDim2.fromScale(1, 1),
        BackgroundTransparency = 1,
        ZIndex = 300,
    }, gui)
    local introLogo = make("ImageLabel", {
        Name = "IntroLogo",
        AnchorPoint = Vector2.new(0.5, 0.5),
        Size = UDim2.fromOffset(30, 30),
        Position = UDim2.fromScale(0.5, 0.5),
        BackgroundTransparency = 1,
        ImageTransparency = 1,
    }, intro)
    corner(introLogo, 24)
    local introStroke = stroke(introLogo, 1.5, 1)

    playSound(SND_INTRO)
    setImage(introLogo, LOGO_ID)
    tween(introLogo, 0.55, { Size = UDim2.fromOffset(95, 95), ImageTransparency = 0 }, Enum.EasingStyle.Back)
    tween(introStroke, 0.35, { Transparency = 0.25 })
    task.wait(1.1)
    tween(introLogo, 0.35, { Size = UDim2.fromOffset(130, 130), ImageTransparency = 1 }, Enum.EasingStyle.Quart, Enum.EasingDirection.In)
    tween(introStroke, 0.3, { Transparency = 1 })
    task.wait(0.4)
    intro:Destroy()
    start()
end)
`;
