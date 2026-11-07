local function capture(value)
    local function get() return value end
    value = false
    print('open-false', get() == false)
    value = nil
    print('open-nil', get() == nil)
    return get
end
print('closed-nil', capture(true)() == nil)
local co = coroutine.create(function()
    local a, b = coroutine.yield('pause', nil, 3)
    return a, b
end)
local ok, a, b, c = coroutine.resume(co)
print(ok, a, b, c)
print(coroutine.resume(co, 'resumed', 9))
local n = 0
for i = 12, 1, -1 do
    if i % 2 == 0 then n += i else n -= i end
end
print('branches', n)
local function values() return 1, nil, 3 end
print('returns', select('#', values()), values())
