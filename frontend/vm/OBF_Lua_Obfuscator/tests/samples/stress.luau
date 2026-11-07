-- heavy edge cases for the VM
local function va(...)
    local n = select('#', ...)
    local t = table.pack(...)
    return n, t[1] + t[2], ...
end
print(va(1, 2, 3, 4))

local obj = {}
function obj:step(k)
    self.count = (self.count or 0) + k
    return self.count, self
end
local c1, o1 = obj:step(2)
print(c1, o1 == obj)
local c2, o2 = obj:step(5)
print(c2, o2 == obj)

local fns = {}
for i = 1, 3 do
    fns[i] = function() return i * 10 end
end
print(fns[1](), fns[2](), fns[3]())

local co = coroutine.create(function(a, b)
    local s = a + b
    coroutine.yield(s)
    return s * 2
end)
print(coroutine.resume(co, 3, 4))
print(coroutine.resume(co))
print(coroutine.status(co))

print(string.format("%s-%d-%05.2f", "x", 7, 3.14159))
print(("hello world"):upper(), #("abc"), math.max(1, 9, 4))

local ok, err = pcall(function()
    error({code = 42})
end)
print(ok, type(err), err.code)

local nested = (function()
    local base = 100
    return function(d)
        return function()
            base = base + d
            return base
        end
    end
end)()(5)
print(nested(), nested())

repeat
    local x = 0
    x = x + 1
until true
print("done")
