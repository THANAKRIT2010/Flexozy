-- Flexozy v9 sample: upvalue semantics
local fns = {}
for i = 1, 3 do
	local captured = i * 10
	fns[i] = function() return captured end
end
print(fns[1](), fns[2](), fns[3]())
local shared = 0
local function inc() shared += 1 return shared end
local function get() return shared end
inc()
inc()
print(get())
local function outer()
	local x = 1
	local function mid()
		local function inner() x += 10 end
		return inner
	end
	return mid(), x
end
local innerf, xval = outer()
print(xval)
innerf()
local function makeAdders()
	local total = 0
	local add = function(n) total += n end
	local get = function() return total end
	return add, get
end
local add, get = makeAdders()
add(5)
add(7)
print(get())
local k = 0
while k < 3 do
	local y = k * 2
	local f = function() return y end
	if k == 1 then print("whilecap", f()) end
	k += 1
end
local function paramCapture(fn0)
	return function(v) return fn0(v) * 2 end
end
local double = paramCapture(function(v) return v + 1 end)
print(double(5))
