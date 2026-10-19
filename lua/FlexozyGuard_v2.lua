-- ===================== FLEXOZY GUARD v2 =====================
-- วางบล็อกนี้บรรทัดแรกสุดของสคริปต์ (ก่อนทุกอย่าง) — ใช้แทน Guard เดิม
-- เปลี่ยนจากเดิม:
--  1) เก็บฟังก์ชันของจริงเป็น local ตั้งแต่บรรทัดแรก (task.* / coroutine.* / pcall ฯลฯ) — ผู้โจมตีแทนที่ global ทีหลังไม่กระทบตัวเช็ค
--  2) เช็ค "thread": task.spawn/wait/delay/defer + coroutine.wrap/create/resume ต้องเป็น C closure ที่ไม่ถูกฮุก
--  3) watchdog 2 ทางที่ไม่พึ่งกัน (loop ใน task.spawn + RunService.Heartbeat) นับรอบของกันและกัน
--     ฆ่า thread / ฮุก task.wait / disconnect → อีกทางจับได้ (ใช้ "ตัวนับรอบ" ไม่ใช้เวลา → ผู้เล่นมือถือสลับแอปแล้วกลับมาไม่โดนเตะผิด)
--  4) Guard.assert() ต้องเรียกก่อนทุกจุดสำคัญ (ขอ key / ดึง payload / loadstring) และตรวจ watchdog ซ้ำทุกครั้ง
--     ข้าม thread ได้ แต่ข้าม assert ที่อยู่ติดจุดสำคัญไม่ได้ ถ้าไม่ลบ Guard ออกทั้งก้อน
--  5) print/warn/error ปิดไว้เป็นค่าเริ่มต้น (executor หลายตัวครอบเองถูกต้อง → เตะผิดคน) เปิดด้วย STRICT_PRINT
-- ข้อจำกัด (พูดตรง ๆ): ผู้ใช้คุมเครื่องตัวเอง — ใครลบ Guard ออกจากสำเนาสคริปต์ที่ตัวเองรันได้เสมอ
--   ของที่ปกป้องจริงต้องอยู่ฝั่งเซิร์ฟเวอร์: key + HWID + proof-of-execution + token ผูก IP (ดู docs/SECURITY-CHANGES.md v11)
--   Guard ตัวนี้มีไว้ทำให้ "dump ง่าย ๆ / hook ธรรมดา" ไม่ได้ผล และให้สคริปต์ล้มเมื่อโดน hook ตรง ๆ
local Guard = { blocked = false }
do
	local DEBUG = false          -- true = แค่ warn() เหตุผล ไม่เตะ (ใช้ตอนทดสอบ แล้วดูว่า executor ของคุณโดนข้อไหนบ้าง)
	local STRICT_EXEC = true     -- เช็คฟังก์ชัน executor (request, loadstring, HttpGet...) ต้องยังเป็น C closure
	local STRICT_PRINT = false   -- เช็ค print/warn/error ด้วย
	local CHECK_META = true      -- เช็คว่า __namecall/__index/__newindex ของ game ถูกฮุกด้วย Lua ของ executor
	local CHECK_GUI = true       -- ตามหาหน้าต่าง spy / dumper
	local CHECK_THREADS = true   -- เช็คฟังก์ชันที่เกี่ยวกับ thread + watchdog
	local MISS_MAX = 6           -- watchdog: อีกทางไม่ขยับกี่รอบถึงถือว่าตาย (1 รอบ ≈ 1.5 วิ)

	-- 0) เก็บของจริงไว้ก่อนทุกอย่าง
	local pcall, type, typeof, ipairs, pairs, tostring, rawget, error, warn = pcall, type, typeof, ipairs, pairs, tostring, rawget, error, warn
	local lower, find, random = string.lower, string.find, math.random
	local tspawn, twait, tdelay, tdefer = task.spawn, task.wait, task.delay, task.defer
	local game = game

	local Players = game:GetService('Players')
	local lp = Players.LocalPlayer
	local CoreGui = game:GetService('CoreGui')
	local HttpService = game:GetService('HttpService')

	local isexec = isexecutorclosure or is_executor_closure or is_synapse_function
	local iscc = iscclosure
	local dinfo = debug and debug.info
	local getgui = gethui

	local okEnv, env = pcall(getfenv, 1)
	if not okEnv or type(env) ~= 'table' then env = _G end

	local tripped = false

	local function trap(reason)
		if tripped then return end
		if DEBUG then
			warn('[Guard] ' .. tostring(reason))
			return
		end
		tripped = true
		Guard.blocked = true
		pcall(function()
			local host = (getgui and getgui()) or CoreGui
			for _, n in ipairs({ 'Flexozy', 'FlexozyToasts', 'FlexozyLoader', 'Flexozy_KeySystem' }) do
				local o = host:FindFirstChild(n)
				if o then o:Destroy() end
			end
		end)
		local msg = (random(2) == 1) and '403 Forbidden' or '404 Not Found'
		pcall(function() lp:Kick(msg) end)
		tdelay(1.5, function() pcall(function() game:Shutdown() end) end)
		error(msg, 0)
	end

	-- ---- helpers -------------------------------------------------------
	local function resolve(path)
		local v = env
		for part in path:gmatch('[^%.]+') do
			if type(v) ~= 'table' and typeof(v) ~= 'Instance' then return nil end
			local ok, nxt = pcall(function() return v[part] end)
			if not ok then return nil end
			v = nxt
		end
		return v
	end

	-- ฟังก์ชันของ Roblox/Luau: ต้องเป็น C closure และห้ามเป็น executor closure
	local function nativeHooked(fn)
		if type(fn) ~= 'function' then return true end
		if isexec and isexec(fn) then return true end
		if iscc and not iscc(fn) then return true end
		if dinfo then
			local ok, src = pcall(dinfo, fn, 's')
			if ok and src ~= '[C]' then return true end
		end
		return false
	end

	-- ฟังก์ชันของ executor: เป็น executor closure ได้ แต่ต้องยังเป็น C closure
	local function execHooked(fn)
		if type(fn) ~= 'function' then return false end
		if iscc and not iscc(fn) then return true end
		return false
	end

	local NATIVE = {
		'type', 'typeof', 'select', 'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable', 'ipairs', 'pairs', 'next', 'assert',
		'pcall', 'xpcall', 'tostring', 'tonumber',
		'string.format', 'string.sub', 'string.gsub', 'string.match', 'string.find', 'string.rep',
		'string.char', 'string.byte', 'table.insert', 'table.concat', 'table.remove', 'table.sort',
		'Instance.new', 'os.time', 'os.clock', 'os.date', 'math.floor', 'math.random', 'debug.info', 'debug.traceback',
	}
	local PRINTS = { 'print', 'warn', 'error' }
	-- ฟังก์ชันเกี่ยวกับ thread: ฮุกพวกนี้คือวิธี "ข้าม" watchdog / รัน payload นอก thread ที่เราคุม
	local THREAD = {
		'task.spawn', 'task.wait', 'task.delay', 'task.defer', 'coroutine.wrap', 'coroutine.create', 'coroutine.resume',
	}
	local EXEC = {
		'loadstring', 'request', 'http_request', 'syn.request', 'http.request', 'writefile', 'readfile',
		'isfile', 'makefolder', 'setclipboard', 'getcustomasset', 'game.HttpGet', 'game.HttpGetAsync',
	}

	local snap = {} -- reference ตอนเริ่ม: ถ้าภายหลังมีตัวอื่นมาแทน (แม้ดูเหมือน C closure) ก็จับได้

	local function checkList(list, strict)
		for _, p in ipairs(list) do
			local fn = resolve(p)
			if strict(fn) then trap('hooked: ' .. p) end
			if snap[p] == nil then snap[p] = fn
			elseif snap[p] ~= fn then trap('replaced: ' .. p) end
		end
	end

	local function checkFunctions()
		checkList(NATIVE, nativeHooked)
		if STRICT_PRINT then checkList(PRINTS, nativeHooked) end
		if CHECK_THREADS then checkList(THREAD, nativeHooked) end
		if STRICT_EXEC then checkList(EXEC, execHooked) end
		-- เมธอดของ Roblox
		local ms = {
			{ 'game.GetService', game.GetService },
			{ 'game.FindFirstChild', game.FindFirstChild },
			{ 'HttpService.JSONDecode', HttpService.JSONDecode },
			{ 'HttpService.JSONEncode', HttpService.JSONEncode },
			{ 'HttpService.UrlEncode', HttpService.UrlEncode },
			{ 'Player.Kick', lp.Kick },
		}
		for _, m in ipairs(ms) do
			if nativeHooked(m[2]) then trap('method hooked: ' .. m[1]) end
		end
	end

	local function checkMeta()
		if not CHECK_META or not getrawmetatable or not isexec then return end
		local ok, mt = pcall(getrawmetatable, game)
		if not ok or type(mt) ~= 'table' then return end
		for _, k in ipairs({ '__namecall', '__index', '__newindex' }) do
			local f = rawget(mt, k)
			if type(f) == 'function' and isexec(f) then trap('metamethod hooked: ' .. k) end
		end
	end

	-- ---- spy / dumper windows -----------------------------------------
	local BAD_TEXT = {
		'simplespy', 'remotespy', 'remote spy', 'httpspy', 'http spy', 'dex explorer', 'dark dex',
		'hydroxide', 'script dumper', 'cobalt',
	}

	local function badName(name)
		name = lower(name)
		if find(name, 'flexozy', 1, true) then return false end
		if find(name, 'spy', 1, true) then return true end
		if find(name, '^dex') or find(name, 'hydroxide', 1, true) or find(name, 'dumper', 1, true) then
			return true
		end
		return false
	end

	local function scanGui(g)
		if badName(g.Name) then return trap('gui: ' .. g.Name) end
		local n = 0
		for _, d in ipairs(g:GetDescendants()) do
			n = n + 1
			if n > 600 then break end
			if d:IsA('TextLabel') or d:IsA('TextButton') then
				local t = lower(d.Text)
				if t ~= '' and #t < 64 then
					for _, w in ipairs(BAD_TEXT) do
						if find(t, w, 1, true) then return trap('gui text: ' .. w) end
					end
				end
			end
		end
	end

	local function hosts()
		local list = { CoreGui }
		if getgui then
			local ok, h = pcall(getgui)
			if ok and h and h ~= CoreGui then list[#list + 1] = h end
		end
		return list
	end

	local function checkGui()
		if not CHECK_GUI then return end
		for _, h in ipairs(hosts()) do
			for _, g in ipairs(h:GetChildren()) do
				pcall(scanGui, g)
			end
		end
	end

	-- ---- watchdog (ตัวนับรอบ) ------------------------------------------
	local cntLoop, cntHb = 0, 0
	local seenByLoop, missByLoop = 0, 0   -- loop นับรอบของ Heartbeat
	local seenByHb, missByHb = 0, 0       -- Heartbeat นับรอบของ loop

	local function runChecks()
		if tripped then return end
		checkFunctions()
		checkMeta()
		checkGui()
	end

	-- ---- public --------------------------------------------------------
	function Guard.check()
		runChecks()
		return not Guard.blocked
	end

	-- เรียกก่อนจุดสำคัญทุกจุด (ขอ key / ดึง payload / loadstring) — ตรวจฟังก์ชัน + ตรวจว่า watchdog ทั้งสองทางยังเดินอยู่
	function Guard.assert()
		runChecks()
		if CHECK_THREADS and not tripped then
			if missByLoop >= MISS_MAX then trap('watchdog: heartbeat stopped') end
			if missByHb >= MISS_MAX then trap('watchdog: loop stopped') end
		end
		if Guard.blocked then error('404 Not Found', 0) end
	end

	-- 1) first check, synchronous: if it fails the script stops here
	runChecks()

	-- 2) live watch: spy window ที่เปิดทีหลังถูกจับทันที
	if CHECK_GUI then
		for _, h in ipairs(hosts()) do
			pcall(function()
				h.ChildAdded:Connect(function(c)
					tdelay(0.4, function()
						if not tripped then pcall(scanGui, c) end
					end)
				end)
			end)
		end
	end

	-- 3) watchdog A: loop ใน task.spawn (จับ hookfunction / metamethod ที่ติดตั้งทีหลัง + ตรวจว่า Heartbeat ยังเดิน)
	tspawn(function()
		while not tripped do
			twait(1.5)
			cntLoop = cntLoop + 1
			pcall(runChecks)
			if cntHb == seenByLoop then missByLoop = missByLoop + 1 else missByLoop, seenByLoop = 0, cntHb end
			if CHECK_THREADS and missByLoop >= MISS_MAX then trap('watchdog: heartbeat stopped') end
		end
	end)

	-- 4) watchdog B: Heartbeat (ทางเดินคนละทางกับ task.wait — ฮุก/ฆ่าอย่างใดอย่างหนึ่งไม่พอ)
	pcall(function()
		local acc = 0
		game:GetService('RunService').Heartbeat:Connect(function(dt)
			acc = acc + dt
			if acc < 1.5 then return end
			acc = 0
			cntHb = cntHb + 1
			if tripped then return end
			pcall(runChecks)
			if cntLoop == seenByHb then missByHb = missByHb + 1 else missByHb, seenByHb = 0, cntLoop end
			if CHECK_THREADS and missByHb >= MISS_MAX then trap('watchdog: loop stopped') end
		end)
	end)
end
-- =================== END FLEXOZY GUARD ===================
--
-- วิธีใช้ในสคริปต์ของคุณ (ตัวอย่าง) — ใส่ Guard.assert() ติดจุดสำคัญทุกจุด ไม่ใช่แค่ตอนเริ่ม:
--   Guard.assert()                      -- ก่อนขอ key
--   local token = FxApi.auth("login")
--   Guard.assert()                      -- ก่อนดึง payload
--   local src = FxApi.fetch("hub:xxx", "game-script/xxx")
--   Guard.assert()                      -- ก่อน loadstring (ติดกับบรรทัดที่รันจริง)
--   loadstring(src)()
