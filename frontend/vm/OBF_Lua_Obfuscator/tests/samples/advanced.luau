-- Flexozy v9 sample: advanced syntax
local x = 5
x += 3
x *= 2
x -= 1
x /= 2
x %= 5
x ^= 2
print(x)
local s = "a"
s ..= "b"
print(s)
print(true and 10 or 20)
print(false and 1 or 2)
print(nil == nil, nil ~= nil, 1 == 1.0)
local msg = `interpolated {x + 1} and {"literal"}`
print(msg)
local choice = if x > 5 then "big" else "small"
print(choice)
local t = { n = 0 }
t.n += 1
t["m"] = t.n
print(t.n, t.m)
local a, b = 1, 2
a, b = b, a
print(a, b)
local q, w, e2 = (function() return 1, 2, 3 end)()
print(q, w, e2)
local mt2 = setmetatable({}, { __lt = function(a, b) return true end })
print(mt2 < mt2, mt2 > mt2)
local co = coroutine.wrap(function()
	for i = 1, 3 do coroutine.yield(i) end
end)
print(co(), co(), co())
print(("%d-%s"):format(7, "x"))
print(table.concat({ 1, 2, 3 }, "+"))
print(math.max(1, 5, 3), math.floor(2.7), math.abs(-4))
local longstr = [[line one
line two]]
print(longstr, #longstr)
print(("x"):byte(), string.char(120))
local t2 = {}
for i = 1, 10 do t2[#t2 + 1] = i * i end
print(table.concat(t2, ","))
print(("%s=%d"):format("k", 9))
local str = "The quick brown fox"
for word in string.gmatch(str, "%a+") do print("word", word) end
print(string.format("%5.2f|%s", 3.14159, "hi"))
print(tostring(nil), tostring(true), tostring(12.5))
