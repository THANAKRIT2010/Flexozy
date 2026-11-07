-- Regression: `return <call>` and `return ...` must not shift results.
local function k(a) local x = a return x end
local function w(a) return k(a) end
local function a1() return tostring(5) end
local function b1() return select(1, 5, 6) end
local function d1() return setmetatable({}, {}) end
local function e1() return rawequal(1, 1) end
local function f1(...) return ... end
local function p1(a, b) return a, k(b) end
local Account = {}
Account.__index = Account
function Account.new(b) return setmetatable({balance = b}, Account) end
print("w", w(3))
print("a", a1())
print("b", b1())
print("d", type(d1()))
print("e", e1())
print("f", f1(9, 8))
print("p", p1(1, 2))
print("acc", Account.new(10).balance)
