// Anti-dump guard (Lua) — ฝังหัวทั้ง stub (/loader) และ hub (/bootstrap-source)
// ตรวจ: loadstring/HttpGet ถูกฮุก, ตัวแปร marker ของ dumper, GUI ที่เป็น code viewer → Kick ทันที
// ANTI_DUMP_STRICT=0 ปิดเฉพาะการเช็ก "ฮุกฟังก์ชัน" (กรณี executor บางตัวทำ loadstring เป็น Lua closure แล้วเตะคนผิด)
// หมายเหตุ: ห้ามมี backtick / ${ ในโค้ด Lua ด้านล่าง
const GUARD = String.raw`do
    local STRICT = --@@STRICT@@
    local WATCH = --@@WATCH@@
    local THREADS = --@@THREADS@@
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
    -- v11: เก็บ reference ตัวจริงตั้งแต่บรรทัดแรก — ถ้าภายหลังมีคนแทนที่ global (task.spawn/wait/loadstring) จะเทียบแล้วจับได้ แม้ตัวใหม่จะดูเหมือน C closure
    local snap = { loadstring = loadstring, spawn = task.spawn, wait = task.wait, defer = task.defer, cwrap = coroutine.wrap, ccreate = coroutine.create, cresume = coroutine.resume }
    local function threadsBad()
        if snap.spawn ~= task.spawn or snap.wait ~= task.wait or snap.defer ~= task.defer or snap.loadstring ~= loadstring then return true end
        if snap.cwrap ~= coroutine.wrap or snap.ccreate ~= coroutine.create or snap.cresume ~= coroutine.resume then return true end
        for _, f in ipairs({ task.spawn, task.wait, task.defer, task.delay, coroutine.wrap, coroutine.create, coroutine.resume }) do
            if not native(f) then return true end
        end
        return false
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
        if THREADS and threadsBad() then return "hook:thread" end
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
        -- v11: watchdog สองทางที่ไม่พึ่งกัน — (1) loop ใน task.spawn  (2) RunService.Heartbeat ; ทั้งคู่นับรอบของอีกฝั่ง
        -- ฆ่า thread / ฮุก task.wait ให้ loop หยุด → Heartbeat เห็นว่าตัวนับของ loop ไม่ขยับหลายรอบแล้วเตะ (และกลับกัน)
        -- ใช้ ตัวนับรอบ ไม่ใช้เวลา: ผู้เล่นมือถือที่สลับแอปแล้วกลับมา ทั้งสองทางหยุดพร้อมกันและกลับมาพร้อมกัน จึงไม่ถูกเตะผิด
        local cntLoop, cntHb, dead = 0, 0, false
        local function fire(w) if dead then return end dead = true kick(w) end
        task.spawn(function()
            local seen, miss = 0, 0
            while task.wait(3) do
                cntLoop = cntLoop + 1
                local w = scan()
                if w then fire(w) return end
                if cntHb == seen then miss = miss + 1 else miss, seen = 0, cntHb end
                if miss >= 6 then fire("watchdog:hb") return end
            end
        end)
        pcall(function()
            local acc, seen, miss = 0, 0, 0
            game:GetService("RunService").Heartbeat:Connect(function(dt)
                acc = acc + dt
                if acc < 3 then return end
                acc = 0
                cntHb = cntHb + 1
                local w = scan()
                if w then fire(w) return end
                if cntLoop == seen then miss = miss + 1 else miss, seen = 0, cntLoop end
                if miss >= 6 then fire("watchdog:loop") end
            end)
        end)
    end
end
`;
export const guardLua = (watch = true) => GUARD
  .replace('--@@STRICT@@', () => String(process.env.ANTI_DUMP_STRICT !== '0'))
  .replace('--@@WATCH@@', () => String(!!watch))
  .replace('--@@THREADS@@', () => String(process.env.ANTI_DUMP_THREADS !== '0')); // ANTI_DUMP_THREADS=0 = ปิดเช็คฮุก thread (ถ้า executor บางตัวโดนเตะผิด)
