-- Flexozy v9 sample: control flow
for i = 1, 5 do
	if i % 2 == 0 then
		print("even", i)
	else
		print("odd", i)
	end
end
local i = 0
while i < 3 do
	i = i + 1
	if i == 2 then continue end
	print("w", i)
end
repeat
	i = i - 1
	print("r", i)
until i <= 0
local t = { 10, 20, 30 }
for idx, v in ipairs(t) do print("g", idx, v) end
for k, v in pairs({ a = 1 }) do print("p", k, v) end
for x in { 5, 6, 7 } do print("gi", x) end
do
	local z = 1
	print("do", z)
end
print((function() return "anon" end)())
for j = 10, 1, -3 do print("neg", j) end
for j = 1, 2, 0.5 do print("half", j) end
local n = 0
while true do
	n = n + 1
	if n >= 3 then break end
end
print("broke at", n)
