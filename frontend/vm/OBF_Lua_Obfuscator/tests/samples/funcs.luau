-- Flexozy v9 sample: functions, closures, tables
local function fib(n)
	if n < 2 then return n end
	return fib(n - 1) + fib(n - 2)
end
print(fib(10))
local function multi() return 1, 2, 3 end
local a, b, c = multi()
print(a, b, c)
print((multi()))
print(select('#', multi()))
local function sum(...)
	local acc = 0
	for _, v in ipairs({ ... }) do acc += v end
	return acc
end
print(sum(1, 2, 3, 4))
local function makeCounter()
	local n = 0
	return function() n += 1 return n end
end
local c1, c2 = makeCounter(), makeCounter()
print(c1(), c1(), c2())
local base = 100
local function adder(x)
	return function(y) return x + y + base end
end
print(adder(1)(2))
local obj = { v = 5 }
function obj:get() return self.v end
function obj.set(self, x) self.v = x end
print(obj:get())
obj:set(9)
print(obj.v)
local t = {}
t.x = 1
t["y"] = 2
t[3] = "three"
print(t.x, t.y, t[3])
local mt = setmetatable({}, {
	__index = function(_, k) return k .. "!" end,
	__add = function(a, b) return "added" end,
	__call = function(s, x) return x * 2 end,
	__tostring = function() return "MT" end,
})
print(mt.foo)
print(mt + 1)
print(mt(21))
print(tostring(mt))
local arr = { 1, 2, 3, x = 4 }
print(#arr, arr.x, arr[1])
print(pcall(function() error("boom") end))
print(pcall(function() return "ok" end))
local ok, e = pcall(error, { code = 42 })
print(ok, type(e), e.code)
local chained = { list = { { 1, 2 }, { 3, 4 } }, name = "n" }
print(chained.list[2][1], chained.name)
local upv = 7
local function useUp() return upv + 1 end
upv = 20
print(useUp())
