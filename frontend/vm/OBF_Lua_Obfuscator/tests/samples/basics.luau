-- Flexozy v9 sample: basics
local x = 10
local y = 3.5
print(x + y, x - 2, x * y, x / 4, x % 3, x ^ 2)
print(-x, #("hello"), not x)
local s = "hello" .. " " .. "world" .. 7
print(s)
print(s:upper(), string.sub(s, 1, 5), ("abc"):rep(2))
print(10 == 10, 10 ~= 5, 1 < 2, 2 <= 2, 3 > 4, 4 >= 4)
print(2 ^ 3 ^ 2, -2 ^ 2)
print(0x10, 1e2, .5)
print(("7.5 floor"):format() ~= nil and math.floor(7.5))
