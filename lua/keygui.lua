-- Flexozy Key GUI — หน้าใส่คีย์ในเกม สไตล์เดียวกับ VC Bypasser (ดำ-เทา, มุมโค้ง, แถบแจ้งเตือน)
--   local KeyGui = loadstring(game:HttpGet("...keygui.lua"))()
--   KeyGui.show(function(key) --[[ เริ่มสคริปต์หลังผ่าน key ]] end)
-- ปุ่ม Get Key เปิดหน้า https://app.flexozy.xyz/ (คัดลอกลิงก์ให้อัตโนมัติถ้า executor รองรับ)
-- Flexozy Key GUI · ฝังในเซิร์ฟเวอร์ผ่าน --@@KEYGUI@@ ของ hub.lua (สร้าง lib/hubLua.js ด้วย npm run build:lua)
-- เรียก KeyGuiShow(FxApi, onOk, prefill) — ใช้ KEY_LINK / SUPPORT_LINK ที่ hub ตั้งไว้แล้ว
local function KeyGuiShow(FxApi, onOk, prefill)
local Players, CoreGui, TweenService, UIS, SoundService = game:GetService("Players"), game:GetService("CoreGui"), game:GetService("TweenService"), game:GetService("UserInputService"), game:GetService("SoundService")
local lp = Players.LocalPlayer

local C = {
    PANEL = Color3.fromRGB(18, 18, 21), CARD = Color3.fromRGB(30, 30, 30), TEXT = Color3.fromRGB(245, 245, 247),
    SUB = Color3.fromRGB(176, 176, 182), SUBTLE = Color3.fromRGB(150, 150, 156), STROKE = Color3.fromRGB(55, 55, 55),
    GOOD = Color3.fromRGB(140, 225, 170), BAD = Color3.fromRGB(255, 125, 125), WARN = Color3.fromRGB(255, 205, 130),
    WHITE = Color3.new(1, 1, 1), DARK = Color3.fromRGB(18, 18, 20),
}

local host = (type(gethui) == "function" and gethui()) or CoreGui
for _, n in ipairs({ "FlexozyKeyGUI", "FlexozyKeyToasts" }) do
    local o = host:FindFirstChild(n); if o then o:Destroy() end
end

local function tw(o, t, goal, style)
    if not (o and o.Parent) then return end
    pcall(function() TweenService:Create(o, TweenInfo.new(t or 0.2, style or Enum.EasingStyle.Quad, Enum.EasingDirection.Out), goal):Play() end)
end
local function corners(obj, r) local c = Instance.new("UICorner"); c.CornerRadius = UDim.new(0, r); c.Parent = obj; return c end
local function rim(parent, keys)
    local s = Instance.new("UIStroke"); s.ApplyStrokeMode = Enum.ApplyStrokeMode.Border; s.Color = Color3.new(1, 1, 1); s.Thickness = 1
    pcall(function() s.BorderStrokePosition = Enum.BorderStrokePosition.Inner end); s.Parent = parent
    local g = Instance.new("UIGradient"); g.Rotation = 90
    local seq = {}; for _, k in ipairs(keys) do seq[#seq + 1] = NumberSequenceKeypoint.new(k[1], k[2]) end
    g.Transparency = NumberSequence.new(seq); g.Parent = s
    return s
end
local function label(parent, value, font, size, color, x, y, w, h, align)
    local l = Instance.new("TextLabel")
    l.BackgroundTransparency = 1; l.BorderSizePixel = 0; l.Font = font; l.TextSize = size; l.TextColor3 = color
    l.Text = value; l.Position = UDim2.fromOffset(x, y); l.Size = UDim2.fromOffset(w, h)
    l.TextXAlignment = align or Enum.TextXAlignment.Left; l.TextTruncate = Enum.TextTruncate.AtEnd; l.ZIndex = 20; l.Parent = parent
    return l
end
local function playClick()
    pcall(function()
        local s = Instance.new("Sound"); s.Name = "FlexozyClick"; s.SoundId = "rbxassetid://6895079853"; s.Volume = 0.6
        s.Parent = SoundService; s:Play(); game:GetService("Debris"):AddItem(s, 3)
    end)
end
local function copy(text)
    if type(setclipboard) == "function" then pcall(setclipboard, text); return true end
    if type(toclipboard) == "function" then pcall(toclipboard, text); return true end
    return false
end

-- ===== แถบแจ้งเตือนมุมล่าง =====
local toastGui = Instance.new("ScreenGui")
toastGui.Name = "FlexozyKeyToasts"; toastGui.ResetOnSpawn = false; toastGui.IgnoreGuiInset = true; toastGui.DisplayOrder = 200000
pcall(function() toastGui.Parent = host end); if not toastGui.Parent then toastGui.Parent = CoreGui end
local holder = Instance.new("Frame")
holder.AnchorPoint = Vector2.new(0.5, 1); holder.Position = UDim2.new(0.5, 0, 1, -28); holder.Size = UDim2.fromOffset(320, 300)
holder.BackgroundTransparency = 1; holder.BorderSizePixel = 0; holder.Parent = toastGui
local list = Instance.new("UIListLayout"); list.Padding = UDim.new(0, 8); list.SortOrder = Enum.SortOrder.LayoutOrder
list.HorizontalAlignment = Enum.HorizontalAlignment.Center; list.VerticalAlignment = Enum.VerticalAlignment.Bottom; list.Parent = holder
local toastN = 0
local function toast(title, msg, color)
    toastN = toastN + 1
    local slot = Instance.new("Frame")
    slot.BackgroundTransparency = 1; slot.BorderSizePixel = 0; slot.Size = UDim2.fromOffset(300, 56); slot.LayoutOrder = toastN; slot.Parent = holder
    local cg = Instance.new("CanvasGroup")
    cg.Size = UDim2.fromScale(1, 1); cg.Position = UDim2.fromOffset(0, 26); cg.BackgroundColor3 = C.PANEL
    cg.BackgroundTransparency = 0.06; cg.BorderSizePixel = 0; cg.GroupTransparency = 1; cg.Parent = slot
    corners(cg, 28); rim(cg, { { 0, 0.78 }, { 0.5, 0.9 }, { 1, 0.74 } })
    local dot = Instance.new("Frame"); dot.Position = UDim2.fromOffset(14, 16); dot.Size = UDim2.fromOffset(10, 10)
    dot.BackgroundColor3 = color or C.TEXT; dot.BorderSizePixel = 0; dot.ZIndex = 21; dot.Parent = cg; corners(dot, 5)
    label(cg, title, Enum.Font.GothamBold, 13, C.TEXT, 34, 10, 256, 18)
    label(cg, msg, Enum.Font.GothamMedium, 12, C.SUBTLE, 34, 29, 256, 16)
    tw(cg, 0.4, { Position = UDim2.fromOffset(0, 0), GroupTransparency = 0 }, Enum.EasingStyle.Quint)
    task.delay(2.8, function()
        tw(cg, 0.3, { GroupTransparency = 1, Position = UDim2.fromOffset(0, 14) }, Enum.EasingStyle.Quint)
        task.wait(0.35); slot:Destroy()
    end)
end

-- ข้อความภาษาไทยของ error จากเซิร์ฟเวอร์
local ERR = {
    invalid_key = "คีย์ไม่ถูกต้องหรือหมดอายุ", hwid_mismatch = "คีย์นี้ผูกกับเครื่องอื่นอยู่ (รีเซ็ต HWID ที่เว็บได้)",
    revoked = "คีย์นี้ถูกเพิกถอนแล้ว", scope = "คีย์นี้ใช้กับสคริปต์นี้ไม่ได้",
    rate_limited = "ลองบ่อยเกินไป รอสักครู่", bad_hwid = "ตรวจสอบเครื่องไม่สำเร็จ", key_required = "กรุณาใส่คีย์",
}

-- ===== ตัวหน้าต่าง =====
local SG = Instance.new("ScreenGui")
SG.Name = "FlexozyKeyGUI"; SG.ResetOnSpawn = false; SG.IgnoreGuiInset = true; SG.DisplayOrder = 60
SG.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
pcall(function() SG.Parent = host end); if not SG.Parent then SG.Parent = CoreGui end

local W, H = 320, 232
local pnl = Instance.new("CanvasGroup")
pnl.AnchorPoint = Vector2.new(0.5, 0); pnl.Position = UDim2.new(0.5, 0, 0, 46); pnl.Size = UDim2.fromOffset(W, H)
pnl.BackgroundColor3 = C.PANEL; pnl.BackgroundTransparency = 0.06; pnl.BorderSizePixel = 0; pnl.GroupTransparency = 1; pnl.Parent = SG
corners(pnl, 30); rim(pnl, { { 0, 0.8 }, { 0.5, 0.92 }, { 1, 0.76 } })
local scale = Instance.new("UIScale"); scale.Scale = 0.92; scale.Parent = pnl

-- หัวข้อ + รูปโปรไฟล์ Roblox
local av = Instance.new("ImageLabel")
av.Position = UDim2.fromOffset(13, 13); av.Size = UDim2.fromOffset(38, 38); av.BackgroundColor3 = Color3.fromRGB(40, 40, 44)
av.BorderSizePixel = 0; av.ScaleType = Enum.ScaleType.Crop; av.Parent = pnl; corners(av, 19)
pcall(function() av.Image = "rbxthumb://type=AvatarHeadShot&id=" .. lp.UserId .. "&w=150&h=150" end)
label(pnl, "Flexozy Key", Enum.Font.GothamBold, 15, C.TEXT, 62, 14, 200, 20)
local status = label(pnl, "กรอกคีย์เพื่อเริ่มใช้งาน", Enum.Font.GothamMedium, 12, C.SUBTLE, 62, 35, 240, 18)
local closeBtn = Instance.new("TextButton")
closeBtn.Position = UDim2.fromOffset(W - 40, 18); closeBtn.Size = UDim2.fromOffset(26, 26); closeBtn.BackgroundTransparency = 1
closeBtn.Text = "✕"; closeBtn.Font = Enum.Font.GothamBold; closeBtn.TextSize = 13; closeBtn.TextColor3 = C.SUBTLE
closeBtn.ZIndex = 22; closeBtn.Parent = pnl

-- ช่องใส่คีย์
local box = Instance.new("TextBox")
box.Position = UDim2.fromOffset(16, 66); box.Size = UDim2.fromOffset(W - 32, 40)
box.BackgroundColor3 = Color3.fromRGB(10, 10, 12); box.BackgroundTransparency = 0.2; box.BorderSizePixel = 0
box.Font = Enum.Font.Code; box.TextSize = 13; box.TextColor3 = C.TEXT; box.PlaceholderText = "FX-XXXX-XXXX-XXXX-XXXX"
box.PlaceholderColor3 = Color3.fromRGB(100, 100, 106); box.Text = ""; box.ClearTextOnFocus = false; box.ZIndex = 20; box.Parent = pnl
corners(box, 12); rim(box, { { 0, 0.85 }, { 1, 0.9 } })

-- ปุ่ม
local function button(x, w, text, primary)
    local b = Instance.new("TextButton")
    b.Position = UDim2.fromOffset(x, 118); b.Size = UDim2.fromOffset(w, 38); b.AutoButtonColor = false; b.BorderSizePixel = 0
    b.BackgroundColor3 = primary and C.WHITE or Color3.fromRGB(38, 38, 42); b.Font = Enum.Font.GothamBold; b.TextSize = 13
    b.TextColor3 = primary and C.DARK or C.TEXT; b.Text = text; b.ZIndex = 20; b.Parent = pnl
    corners(b, 18)
    if not primary then rim(b, { { 0, 0.86 }, { 1, 0.96 } }) end
    return b
end
local verifyBtn = button(16, 180, "Verify", true)
local getKeyBtn = button(204, 100, "Get Key", false)
local discordBtn = button(16, W - 32, "Discord", false)
discordBtn.Position = UDim2.fromOffset(16, 166); discordBtn.Size = UDim2.fromOffset(W - 32, 34)
discordBtn.TextSize = 12

local busy = false
local function setStatus(msg, color) status.Text = msg; status.TextColor3 = color or C.SUBTLE end
local function close() tw(pnl, 0.3, { GroupTransparency = 1 }); tw(scale, 0.3, { Scale = 0.92 }); task.delay(0.32, function() SG:Destroy() end) end

local function verify()
    if busy then return end
    local k = (box.Text:gsub("%s+", ""))
    if k == "" then setStatus(ERR.key_required, C.WARN); return end
    busy = true
    verifyBtn.Text = "..."; setStatus("กำลังตรวจสอบคีย์...", C.SUB)
    task.spawn(function()
        pcall(function() local G = (getgenv and getgenv()) or _G; G.Key = k end)
        local token, _, err = FxApi.auth("login")   -- ตรวจกับเซิร์ฟเวอร์ (HWID / หมดอายุ / เพิกถอน) ไม่มีรหัสฝังในสคริปต์
        local ok = token ~= nil and not err
        if ok then
            pcall(function() FxApi.saveKey(k) end)
            setStatus("ยืนยันสำเร็จ", C.GOOD); toast("Flexozy", "ยืนยันคีย์สำเร็จ", C.GOOD)
            task.wait(0.6); close()
            if onOk then pcall(onOk, k) end
        else
            setStatus(ERR[err] or ("ยืนยันไม่สำเร็จ (" .. tostring(err) .. ")"), C.BAD)
            toast("Flexozy", ERR[err] or "ยืนยันไม่สำเร็จ", C.BAD)
            verifyBtn.Text = "Verify"; busy = false
        end
    end)
end

verifyBtn.Activated:Connect(function() playClick(); verify() end)
box.FocusLost:Connect(function(enter) if enter then verify() end end)
getKeyBtn.Activated:Connect(function()
    playClick()
    if copy(KEY_LINK) then toast("Get Key", "คัดลอกลิงก์แล้ว: app.flexozy.xyz", C.TEXT)
    else toast("Get Key", KEY_LINK, C.TEXT) end
end)
discordBtn.Activated:Connect(function()
    playClick()
    if copy(SUPPORT_LINK) then toast("Discord", "คัดลอกลิงก์ Discord แล้ว", C.TEXT)
    else toast("Discord", SUPPORT_LINK, C.TEXT) end
end)
closeBtn.Activated:Connect(function() playClick(); close() end)

-- ลากหน้าต่างได้
do
    local dragging, dragStart, startPos
    pnl.InputBegan:Connect(function(i)
        if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
            dragging = true; dragStart = i.Position; startPos = pnl.Position
        end
    end)
    UIS.InputChanged:Connect(function(i)
        if dragging and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
            local d = i.Position - dragStart
            pnl.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + d.X, startPos.Y.Scale, startPos.Y.Offset + d.Y)
        end
    end)
    UIS.InputEnded:Connect(function(i) if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then dragging = false end end)
end

tw(pnl, 0.5, { GroupTransparency = 0 }); tw(scale, 0.5, { Scale = 1 }, Enum.EasingStyle.Back)
box.Text = prefill or ""
end
