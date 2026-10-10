// Anti-dump guard (Lua) — ฝังหัวทั้ง stub (/loader) และ hub (/bootstrap-source)
// ตรวจ: loadstring/HttpGet ถูกฮุก, ตัวแปร marker ของ dumper, GUI ที่เป็น code viewer → Kick ทันที
// ANTI_DUMP_STRICT=0 ปิดเฉพาะการเช็ก "ฮุกฟังก์ชัน" (กรณี executor บางตัวทำ loadstring เป็น Lua closure แล้วเตะคนผิด)
// หมายเหตุ: ห้ามมี backtick / ${ ในโค้ด Lua ด้านล่าง
const GUARD = String.raw`do
    local STRICT = --@@STRICT@@
    local WATCH = --@@WATCH@@
    local Players = game:GetService("Players")
    local env = (getgenv and getgenv()) or _G
    local function kick(why)
        pcall(function() Players.LocalPlayer:Kick("Flexozy Security: " .. tostring(why)) end)
        task.wait(2)
        pcall(function() game:Shutdown() end)
    end
    local function native(fn)
        if type(fn) ~= "function" then return false end
        if islclosure and islclosure(fn) then return false end
        if isfunctionhooked then
            local ok, h = pcall(isfunctionhooked, fn)
            if ok and h then return false end
        end
        if debug and debug.info then
            local ok, s = pcall(debug.info, fn, "s")
            if ok and s ~= "[C]" then return false end
        end
        return true
    end
    local MARK = {"__FlexozyOldLoadstring", "__FlexozyOnHttp", "__FlexozyHttpHooked", "__dumper", "__loadstring_log", "__scriptdump"}
    local NAMES = {"dump", "decompil", "sourceview", "codeview", "loadstringlog", "hookspy", "scriptlog", "flexozyloader"}
    local function badName(n)
        n = string.lower(tostring(n))
        for _, p in ipairs(NAMES) do
            if string.find(n, p, 1, true) then return true end
        end
        return false
    end
    local function roots()
        local list = {}
        pcall(function() if gethui then table.insert(list, gethui()) end end)
        pcall(function() table.insert(list, game:GetService("CoreGui")) end)
        pcall(function() table.insert(list, Players.LocalPlayer:FindFirstChildOfClass("PlayerGui")) end)
        return list
    end
    local function scan()
        for _, k in ipairs(MARK) do
            if rawget(env, k) ~= nil then return "marker" end
        end
        if STRICT then
            if not native(loadstring) then return "hook:loadstring" end
            local ok, hg = pcall(function() return game.HttpGet end)
            if ok and hg ~= nil and not native(hg) then return "hook:HttpGet" end
        end
        for _, r in ipairs(roots()) do
            for _, g in ipairs(r:GetChildren()) do
                if g:IsA("ScreenGui") and g.Name ~= "Flexozy_Hub" then
                    if badName(g.Name) then return "gui" end
                    if r ~= game:GetService("CoreGui") then
                        for _, d in ipairs(g:GetDescendants()) do
                            if (d:IsA("TextLabel") or d:IsA("TextBox")) and d.Font == Enum.Font.Code and #d.Text > 1500 then
                                return "viewer"
                            end
                        end
                    end
                end
            end
        end
        return nil
    end
    local why = scan()
    if why then
        kick(why)
        return
    end
    if WATCH then
        task.spawn(function()
            while task.wait(3) do
                local w = scan()
                if w then kick(w) return end
            end
        end)
    end
end
`;
export const guardLua = (watch = true) => GUARD
  .replace('--@@STRICT@@', () => String(process.env.ANTI_DUMP_STRICT !== '0'))
  .replace('--@@WATCH@@', () => String(!!watch));
