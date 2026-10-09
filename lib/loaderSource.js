import { sourceHubGamesLua } from './games';
import { fxApiLua } from './keyLua';

const LUA = String.raw`-- Flexozy Hub v8
if getgenv and getgenv().__FLEXOZY_LOADED then return end
if getgenv then getgenv().__FLEXOZY_LOADED = true end

local TweenService=game:GetService("TweenService")
local Players=game:GetService("Players")
local Lighting=game:GetService("Lighting")
local UIS=game:GetService("UserInputService")
local Workspace=game:GetService("Workspace")
local SoundService=game:GetService("SoundService")
local Marketplace=game:GetService("MarketplaceService")
local ContentProvider=game:GetService("ContentProvider")
local HttpService=game:GetService("HttpService")
local LocalPlayer=Players.LocalPlayer
local PASSCODE="Flexozy"
local KEY_LINK="https://discord.gg/WFUejxeggt"
local SUPPORT_LINK=KEY_LINK
local SAVE_FILE="Flexozy_SavedKey.txt"
local AUTO_RUN=true
local blurEnabled=true
local userScale=1
local LOGO_ID="112028775617493"
local ICON_RECOMMEND="9405930424"
local ICON_ALL="79159724721875"
local ICON_CREDITS="104769040369946"
local ICON_SETTINGS="87350324375899"
local ICON_DEV="9405930424"
local DEV_NAME="Flexozy"
local DEV_ROBLOX_ID=8986753840
local DISCORD_CODE="WFUejxeggt"
local DISCORD_LINK="discord.gg/"..DISCORD_CODE
--@@GAMES@@
--@@FXAPI@@
local env=(getgenv and getgenv()) or _G
local C={bg=Color3.fromRGB(20,20,28),dock=Color3.fromRGB(10,10,16),white=Color3.new(1,1,1),muted=Color3.fromRGB(140,145,165),soft=Color3.fromRGB(160,165,185),blue=Color3.fromRGB(10,132,255),green=Color3.fromRGB(48,209,88),red=Color3.fromRGB(255,69,58),off=Color3.fromRGB(60,60,70),btn=Color3.fromRGB(50,52,68)}
local function make(class,props,parent) local o=Instance.new(class); for k,v in pairs(props or {}) do o[k]=v end; o.Parent=parent; return o end
local function corner(o,r) return make("UICorner",{CornerRadius=UDim.new(0,r)},o) end
local function stroke(o,t,tr,col) return make("UIStroke",{Color=col or C.white,Thickness=t,Transparency=tr,ApplyStrokeMode=Enum.ApplyStrokeMode.Border},o) end
local function tween(o,t,p,style,dir) local tw=TweenService:Create(o,TweenInfo.new(t,style or Enum.EasingStyle.Quart,dir or Enum.EasingDirection.Out),p); tw:Play(); return tw end
local function label(parent,txt,size,pos,dim,opt) opt=opt or {}; return make("TextLabel",{BackgroundTransparency=1,Text=txt,Font=opt.font or Enum.Font.GothamMedium,TextSize=size,TextColor3=opt.color or C.white,TextXAlignment=opt.align or Enum.TextXAlignment.Left,TextYAlignment=opt.yalign or Enum.TextYAlignment.Center,TextWrapped=opt.wrapped or false,TextTruncate=opt.truncate and Enum.TextTruncate.AtEnd or Enum.TextTruncate.None,Position=pos,Size=dim},parent) end
local function setImage(obj,id) obj.Image="rbxassetid://"..tostring(id); task.spawn(function() pcall(function() ContentProvider:PreloadAsync({obj}) end) end) end
local function copyText(s) local f=setclipboard or toclipboard; if f then return pcall(f,s) end; return false end
local function saveKey(k) if writefile then pcall(writefile,SAVE_FILE,k) end end
local function loadKey() if not(readfile and isfile) then return nil end; local ok,v=pcall(function() if isfile(SAVE_FILE) then return readfile(SAVE_FILE) end end); if ok and type(v)=="string" then return v:gsub("%s+","") end end
local function deleteKey() if delfile and isfile then pcall(function() if isfile(SAVE_FILE) then delfile(SAVE_FILE) end end) end end
local function requestFn() return request or http_request or (syn and syn.request) or (http and http.request) end
local function httpGet(url) local rq=requestFn(); if rq then local ok,res=pcall(rq,{Url=url,Method="GET"}); if ok and res then local b=res.Body or res.body; if b and b~="" then return b end end end; local ok,b=pcall(function() return game:HttpGet(url) end); if ok and b and b~="" then return b end; return nil,"เชื่อมต่อล้มเหลว" end
local function notify(title,msg) pcall(function() game:GetService("StarterGui"):SetCore("SendNotification",{Title=title,Text=msg,Duration=3}) end) end
local function fetchGameCode(g)
 if g.Url and string.sub(g.Url,1,3)=="fx:" then
  if not FxApi or not FxApi.fetch then return nil,"ระบบ Key API ไม่พร้อม" end
  local id=string.sub(g.Url,4); return FxApi.fetch("game","game-script/"..id)
 end
 return httpGet(g.Url)
end
local function runGame(g)
 if not g or not g.Url or g.Url=="" then notify("ไม่มีลิงก์","แมพนี้ยังไม่ได้ใส่ URL"); return end
 local matches=(g.PlaceId and g.PlaceId==game.PlaceId) or g.PlaceId==0
 if g.PlaceIds then for _,pid in ipairs(g.PlaceIds) do if tonumber(pid)==tonumber(game.PlaceId) then matches=true; break end end end
 if not matches then notify("ไม่ตรงแมพ","เลือกแมพที่ตรงกับเกมปัจจุบัน"); return end
 notify("Loading","กำลังโหลด "..g.Title)
 task.spawn(function()
  local code,err=fetchGameCode(g); if not code then notify("Load Failed",tostring(err)); return end
  local head=string.lower(string.sub(code,1,200)); if string.find(head,"<!doctype",1,true) or string.find(head,"<html",1,true) then notify("Invalid Script","ลิงก์ไม่ใช่ raw script"); return end
  local fn,e=loadstring(code,"="..g.Title); if not fn then notify("Compile Error",tostring(e)); return end
  local ok,re=pcall(fn); if ok then notify("Executed","รัน "..g.Title.." สำเร็จ") else notify("Runtime Error",tostring(re)) end
 end)
end
local gui=Instance.new("ScreenGui"); gui.Name="Flexozy_Hub"; gui.ResetOnSpawn=false; gui.ZIndexBehavior=Enum.ZIndexBehavior.Sibling; gui.DisplayOrder=999
local mounted=pcall(function() if gethui then gui.Parent=gethui() elseif syn and syn.protect_gui then syn.protect_gui(gui); gui.Parent=game:GetService("CoreGui") else gui.Parent=LocalPlayer:WaitForChild("PlayerGui") end end); if not mounted or not gui.Parent then gui.Parent=LocalPlayer:WaitForChild("PlayerGui") end
gui.Destroying:Connect(function() if getgenv then getgenv().__FLEXOZY_LOADED=nil end end)
local scale=make("UIScale",{Scale=1},gui)
local function applyScale() local cam=Workspace.CurrentCamera; local fit=1; if cam then local v=cam.ViewportSize; fit=math.clamp(math.min(v.X/900,v.Y/620),0.5,1) end; scale.Scale=fit*userScale end
applyScale(); if Workspace.CurrentCamera then Workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(applyScale) end
local blur=Lighting:FindFirstChild("UIBlurEffect") or make("BlurEffect",{Name="UIBlurEffect",Size=0},Lighting)
local main=make("Frame",{Name="MainFrame",AnchorPoint=Vector2.new(0.5,0.5),Position=UDim2.fromScale(0.5,0.5),Size=UDim2.fromOffset(820,520),BackgroundColor3=C.bg,BackgroundTransparency=0.12,Active=true,Visible=false,ClipsDescendants=true},gui)
corner(main,22); stroke(main,1.2,0.78); make("UIGradient",{Color=ColorSequence.new(Color3.fromRGB(255,255,255),Color3.fromRGB(110,120,160)),Rotation=45},main)
local mainScale=make("UIScale",{Scale=0.85},main)
local sidebar=make("Frame",{Position=UDim2.fromOffset(8,8),Size=UDim2.new(0,170,1,-16),BackgroundColor3=C.dock,BackgroundTransparency=0.28},main); corner(sidebar,16); stroke(sidebar,1,0.88)
local logo=make("ImageLabel",{Size=UDim2.fromOffset(38,38),Position=UDim2.fromOffset(14,14),BackgroundTransparency=1},sidebar); corner(logo,10); setImage(logo,LOGO_ID)
label(sidebar,"Flexozy",14,UDim2.fromOffset(60,16),UDim2.new(1,-66,0,18),{font=Enum.Font.GothamBold}); label(sidebar,"SCRIPT HUB",9,UDim2.fromOffset(60,34),UDim2.new(1,-66,0,14),{color=C.blue,font=Enum.Font.GothamBold})
local tabsFrame=make("Frame",{Position=UDim2.fromOffset(8,74),Size=UDim2.new(1,-16,0,210),BackgroundTransparency=1},sidebar); make("UIListLayout",{Padding=UDim.new(0,6),SortOrder=Enum.SortOrder.LayoutOrder},tabsFrame)
local profile=make("Frame",{Position=UDim2.new(0,8,1,-58),Size=UDim2.new(1,-16,0,50),BackgroundColor3=C.white,BackgroundTransparency=0.92},sidebar); corner(profile,12)
local avatar=make("ImageLabel",{Size=UDim2.fromOffset(32,32),Position=UDim2.new(0,9,0.5,-16),BackgroundColor3=C.dock},profile); corner(avatar,16)
task.spawn(function() local ok,img,ready=pcall(function() return Players:GetUserThumbnailAsync(LocalPlayer.UserId,Enum.ThumbnailType.HeadShot,Enum.ThumbnailSize.Size100x100) end); if ok and ready then avatar.Image=img end end)
label(profile,LocalPlayer.DisplayName,10,UDim2.fromOffset(49,10),UDim2.new(1,-55,0,14),{font=Enum.Font.GothamBold,truncate=true}); label(profile,"@"..LocalPlayer.Name,9,UDim2.fromOffset(49,26),UDim2.new(1,-55,0,12),{color=C.soft,truncate=true})
local content=make("Frame",{Position=UDim2.fromOffset(190,14),Size=UDim2.new(1,-204,1,-28),BackgroundTransparency=1},main)
local pageTitle=label(content,"Recommend",18,UDim2.fromOffset(0,0),UDim2.new(1,-44,0,26),{font=Enum.Font.GothamBold}); local pageSub=label(content,"Games detected for your current experience",10,UDim2.fromOffset(0,27),UDim2.new(1,-44,0,16),{color=C.muted})
local closeBtn=make("TextButton",{Text="×",Font=Enum.Font.GothamBold,TextSize=18,TextColor3=C.white,Size=UDim2.fromOffset(30,30),Position=UDim2.new(1,-30,0,0),BackgroundColor3=C.white,BackgroundTransparency=0.9,AutoButtonColor=false},content); corner(closeBtn,10)
local pages,tabs={},{}
local function selectTab(name) for k,t in pairs(tabs) do local on=k==name; pages[k].Visible=on; tween(t.button,0.2,{BackgroundTransparency=on and 0.84 or 1}); tween(t.icon,0.2,{ImageColor3=on and C.white or C.soft}); tween(t.label,0.2,{TextColor3=on and C.white or C.soft}) end; pageTitle.Text=name; pageSub.Text=tabs[name].subtitle end
local tabCount=0
local function addTab(name,iconId,subtitle) tabCount=tabCount+1; local b=make("TextButton",{Text="",Size=UDim2.new(1,0,0,40),BackgroundColor3=C.white,BackgroundTransparency=1,AutoButtonColor=false,LayoutOrder=tabCount},tabsFrame); corner(b,10); local ic=make("ImageLabel",{Size=UDim2.fromOffset(18,18),Position=UDim2.new(0,12,0.5,-9),BackgroundTransparency=1,ImageColor3=C.soft},b); setImage(ic,iconId); local lb=label(b,name,11,UDim2.fromOffset(40,0),UDim2.new(1,-46,1,0),{font=Enum.Font.GothamBold,color=C.soft}); tabs[name]={button=b,icon=ic,label=lb,subtitle=subtitle}; local pg=make("Frame",{Position=UDim2.fromOffset(0,56),Size=UDim2.new(1,0,1,-56),BackgroundTransparency=1,Visible=false},content); pages[name]=pg; b.MouseButton1Click:Connect(function() selectTab(name) end); return pg end
local recommendPage=addTab("Recommend",ICON_RECOMMEND,"Games detected for your current experience")
local allPage=addTab("All Scripts",ICON_ALL,"Search and browse all supported games")
local creditsPage=addTab("Credits",ICON_CREDITS,"Hub information and contributors")
local devPage=addTab("DEV",ICON_DEV,"Developer information")
local hubOpen,settingsOpen,loginOpen=false,false,false; local effectsOn=false; local baseFOV=70
local function updateEffects() local want=blurEnabled and (hubOpen or settingsOpen or loginOpen); local cam=Workspace.CurrentCamera; if want then if not effectsOn then effectsOn=true; if cam then baseFOV=cam.FieldOfView end end; tween(blur,0.35,{Size=18}); if cam then tween(cam,0.35,{FieldOfView=baseFOV-2}) end elseif effectsOn then effectsOn=false; tween(blur,0.3,{Size=0}); if cam then tween(cam,0.3,{FieldOfView=baseFOV}) end end end
local function openMain() hubOpen=true; main.Visible=true; mainScale.Scale=0.85; tween(mainScale,0.35,{Scale=1},Enum.EasingStyle.Back); updateEffects() end
local function closeMain() hubOpen=false; tween(mainScale,0.2,{Scale=0.85}); task.delay(0.22,function() if not hubOpen then main.Visible=false end end); updateEffects() end
closeBtn.MouseButton1Click:Connect(closeMain)
local function makeSearchPage(page) local entries={}; local sf=make("Frame",{Size=UDim2.new(1,-6,0,34),BackgroundColor3=C.white,BackgroundTransparency=0.9},page); corner(sf,10); local box=make("TextBox",{Size=UDim2.new(1,-28,1,0),Position=UDim2.fromOffset(14,0),BackgroundTransparency=1,Text="",PlaceholderText="Search games...",PlaceholderColor3=C.muted,TextColor3=C.white,Font=Enum.Font.GothamMedium,TextSize=11,ClearTextOnFocus=false,TextXAlignment=Enum.TextXAlignment.Left},sf); local sc=make("ScrollingFrame",{Position=UDim2.fromOffset(0,44),Size=UDim2.new(1,0,1,-44),BackgroundTransparency=1,BorderSizePixel=0,ScrollBarThickness=4,CanvasSize=UDim2.new(),AutomaticCanvasSize=Enum.AutomaticSize.Y},page); make("UIGridLayout",{CellSize=UDim2.new(0.5,-9,0,92),CellPadding=UDim2.fromOffset(12,12),SortOrder=Enum.SortOrder.LayoutOrder},sc); box:GetPropertyChangedSignal("Text"):Connect(function() local q=string.lower(box.Text); for _,e in ipairs(entries) do e.card.Visible=q=="" or string.find(e.name,q,1,true)~=nil end end); return sc,entries end
local recList,recEntries=makeSearchPage(recommendPage); local allList,allEntries=makeSearchPage(allPage)
local function createCard(container,entries,g,current,order) local card=make("TextButton",{Name="GameCard",Text="",AutoButtonColor=false,BackgroundColor3=current and C.green or C.white,BackgroundTransparency=current and 0.88 or 0.93,LayoutOrder=order},container); corner(card,14); stroke(card,1,current and 0.45 or 0.88,current and C.green or C.white); local img=make("ImageLabel",{Size=UDim2.fromOffset(60,60),Position=UDim2.new(0,12,0.5,-30),BackgroundColor3=Color3.fromRGB(30,30,40),ScaleType=Enum.ScaleType.Crop},card); corner(img,12); setImage(img,LOGO_ID); if g.PlaceId and g.PlaceId~=0 then task.spawn(function() local ok,info=pcall(function() return Marketplace:GetProductInfo(g.PlaceId) end); if img.Parent and ok and info and info.IconImageAssetId and info.IconImageAssetId~=0 then img.Image="rbxassetid://"..tostring(info.IconImageAssetId) else img.Image="rbxthumb://type=GameIcon&id="..tostring(g.PlaceId).."&w=150&h=150" end end) end; label(card,g.Title,12,UDim2.fromOffset(84,16),UDim2.new(1,-96,0,34),{font=Enum.Font.GothamBold,wrapped=true,truncate=true,yalign=Enum.TextYAlignment.Top}); label(card,current and "PLAYING NOW" or (g.Url and g.Url~="" and "พร้อมรัน" or "ยังไม่มีลิงก์"),9,UDim2.fromOffset(84,56),UDim2.new(1,-96,0,16),{color=current and C.green or C.soft,truncate=true}); card.MouseButton1Click:Connect(function() closeMain(); runGame(g) end); table.insert(entries,{card=card,name=string.lower(g.Title)}) end
local detected=nil; local currentName=tostring(game.Name or ""); pcall(function() local info=Marketplace:GetProductInfo(game.PlaceId); if info and info.Name then currentName=info.Name end end); local function normName(s) return string.lower(tostring(s or "")):gsub("[^%w]","") end; for _,g in ipairs(GAMES) do local match=(g.PlaceId and g.PlaceId~=0 and g.PlaceId==game.PlaceId) or false; if g.PlaceIds then for _,pid in ipairs(g.PlaceIds) do if tonumber(pid)==tonumber(game.PlaceId) then match=true; break end end end; if not match then local gn=normName(g.Title); local cn=normName(currentName); if gn~="" and (gn==cn or string.find(cn,gn,1,true) or string.find(gn,cn,1,true)) then match=true end; if g.Aliases then for _,a in ipairs(g.Aliases) do local an=normName(a); if an~="" and (an==cn or string.find(cn,an,1,true) or string.find(an,cn,1,true)) then match=true; break end end end end; if match then detected=g; break end end
local recCount=0; for i,g in ipairs(GAMES) do createCard(allList,allEntries,g,detected==g,i); if detected==g then createCard(recList,recEntries,g,true,-1) elseif recCount<4 then recCount=recCount+1; createCard(recList,recEntries,g,false,i) end end
local function listPage(page,items) local sc=make("ScrollingFrame",{Size=UDim2.fromScale(1,1),BackgroundTransparency=1,BorderSizePixel=0,ScrollBarThickness=4,CanvasSize=UDim2.new(),AutomaticCanvasSize=Enum.AutomaticSize.Y},page); make("UIListLayout",{Padding=UDim.new(0,10),SortOrder=Enum.SortOrder.LayoutOrder},sc); for _,it in ipairs(items) do local row=make("Frame",{Size=UDim2.new(1,-8,0,58),BackgroundColor3=C.white,BackgroundTransparency=0.92},sc); corner(row,12); stroke(row,1,0.88); label(row,string.upper(it[1]),9,UDim2.fromOffset(16,8),UDim2.new(1,-32,0,14),{color=Color3.fromRGB(160,165,205),font=Enum.Font.GothamBold}); label(row,it[2],13,UDim2.fromOffset(16,27),UDim2.new(1,-32,0,22),{font=Enum.Font.GothamBold}) end end
listPage(creditsPage,{{"OFFICIAL SCRIPT HUB","Flexozy Hub v8"},{"LEAD DEVELOPER","Flexozy"},{"SCRIPT PROVIDER","LoaderHub1990"}})
local devScroll=make("ScrollingFrame",{Size=UDim2.fromScale(1,1),BackgroundTransparency=1,BorderSizePixel=0,ScrollBarThickness=4,CanvasSize=UDim2.new(),AutomaticCanvasSize=Enum.AutomaticSize.Y},devPage); make("UIListLayout",{Padding=UDim.new(0,10),SortOrder=Enum.SortOrder.LayoutOrder},devScroll)
local devCard=make("Frame",{Size=UDim2.new(1,-8,0,190),BackgroundColor3=C.white,BackgroundTransparency=0.92},devScroll); corner(devCard,14); stroke(devCard,1,0.88); local devAvatar=make("ImageLabel",{Size=UDim2.fromOffset(82,82),Position=UDim2.new(0.5,-41,0,12),BackgroundColor3=C.dock},devCard); corner(devAvatar,41); task.spawn(function() local ok,im,ready=pcall(function() return Players:GetUserThumbnailAsync(8986753840,Enum.ThumbnailType.HeadShot,Enum.ThumbnailSize.Size150x150) end); if ok and ready then devAvatar.Image=im end end); label(devCard,DEV_NAME,16,UDim2.new(0,0,0,100),UDim2.new(1,0,0,22),{font=Enum.Font.GothamBold,align=Enum.TextXAlignment.Center}); label(devCard,"Lead Developer",10,UDim2.new(0,0,0,123),UDim2.new(1,0,0,16),{color=C.blue,align=Enum.TextXAlignment.Center}); local robloxBtn=make("TextButton",{Size=UDim2.new(1,-28,0,32),Position=UDim2.new(0,14,0,150),BackgroundColor3=C.white,BackgroundTransparency=0.88,Text="Roblox Profile  •  8986753840",Font=Enum.Font.GothamBold,TextSize=10,TextColor3=C.white},devCard); corner(robloxBtn,9); robloxBtn.MouseButton1Click:Connect(function() local u="https://www.roblox.com/users/8986753840/profile"; if not copyText(u) then notify("Roblox Profile",u) end end)
local discordCard=make("Frame",{Size=UDim2.new(1,-8,0,80),BackgroundColor3=C.white,BackgroundTransparency=0.92},devScroll); corner(discordCard,14); stroke(discordCard,1,0.88); label(discordCard,"Discord Server",13,UDim2.fromOffset(14,8),UDim2.new(1,-28,0,20),{font=Enum.Font.GothamBold}); label(discordCard,DISCORD_LINK,10,UDim2.fromOffset(14,30),UDim2.new(1,-28,0,16),{color=C.soft}); local discordBtn=make("TextButton",{Size=UDim2.new(1,-28,0,26),Position=UDim2.new(0,14,0,49),BackgroundColor3=C.blue,Text="Copy Discord",Font=Enum.Font.GothamBold,TextSize=10,TextColor3=C.white},discordCard); corner(discordBtn,8); discordBtn.MouseButton1Click:Connect(function() if not copyText("https://"..DISCORD_LINK) then notify("Discord",DISCORD_LINK) else notify("Copied","คัดลอกลิงก์ Discord แล้ว") end end)
selectTab("Recommend")
-- Settings is a separate modal attached to the edge dock, not a tab in the hub.
local edgeDock=make("Frame",{Name="EdgeDock",AnchorPoint=Vector2.new(0,0.5),Size=UDim2.fromOffset(44,100),Position=UDim2.new(0,-60,0.5,0),BackgroundColor3=C.dock,BackgroundTransparency=0.2,Active=true,Visible=false,ZIndex=150},gui); corner(edgeDock,16); stroke(edgeDock,1,0.75)
local toggleBtn=make("ImageButton",{Size=UDim2.fromOffset(32,32),Position=UDim2.new(0.5,-16,0,9),BackgroundTransparency=1},edgeDock); setImage(toggleBtn,LOGO_ID)
local settingsIcon=make("ImageButton",{Size=UDim2.fromOffset(22,22),Position=UDim2.new(0.5,-11,1,-32),BackgroundTransparency=1},edgeDock); setImage(settingsIcon,ICON_SETTINGS)
local function showDock() edgeDock.Visible=true; tween(edgeDock,0.35,{Position=UDim2.new(0,0,0.5,0)},Enum.EasingStyle.Back) end
toggleBtn.MouseButton1Click:Connect(function() if hubOpen then closeMain() else openMain() end end)
local settingsModal=make("Frame",{Name="SettingsModal",AnchorPoint=Vector2.new(0.5,0.5),Position=UDim2.fromScale(0.5,0.5),Size=UDim2.fromOffset(310,350),BackgroundColor3=C.bg,BackgroundTransparency=0.1,Visible=false,ClipsDescendants=true,ZIndex=300},gui); corner(settingsModal,20); stroke(settingsModal,1.1,0.75); local settingsScale=make("UIScale",{Scale=0.85},settingsModal)
local sHeader=make("Frame",{Size=UDim2.new(1,0,0,42),BackgroundTransparency=1,Active=true},settingsModal); label(sHeader,"Settings & Game Info",13,UDim2.fromOffset(15,0),UDim2.new(1,-55,1,0),{font=Enum.Font.GothamBold}); local sClose=make("TextButton",{Text="×",Font=Enum.Font.GothamBold,TextSize=18,TextColor3=C.white,Size=UDim2.fromOffset(26,26),Position=UDim2.new(1,-35,0,8),BackgroundColor3=C.white,BackgroundTransparency=0.9},sHeader); corner(sClose,8)
local sScroll=make("ScrollingFrame",{Position=UDim2.fromOffset(8,46),Size=UDim2.new(1,-16,1,-54),BackgroundTransparency=1,BorderSizePixel=0,ScrollBarThickness=4,CanvasSize=UDim2.new(),AutomaticCanvasSize=Enum.AutomaticSize.Y},settingsModal); make("UIListLayout",{Padding=UDim.new(0,8),SortOrder=Enum.SortOrder.LayoutOrder},sScroll)
local function openSettings() settingsOpen=true; settingsModal.Visible=true; settingsScale.Scale=0.85; tween(settingsScale,0.3,{Scale=1},Enum.EasingStyle.Back); updateEffects() end
local function closeSettings() settingsOpen=false; tween(settingsScale,0.2,{Scale=0.85}); task.delay(0.22,function() if not settingsOpen then settingsModal.Visible=false end end); updateEffects() end
settingsIcon.MouseButton1Click:Connect(function() if settingsOpen then closeSettings() else openSettings() end end); sClose.MouseButton1Click:Connect(closeSettings)
local function settingRow(h) local r=make("Frame",{Size=UDim2.new(1,-6,0,h),BackgroundColor3=C.white,BackgroundTransparency=0.93},sScroll); corner(r,12); stroke(r,1,0.88); return r end
local gameRow=settingRow(82); local gameImg=make("ImageLabel",{Size=UDim2.fromOffset(58,58),Position=UDim2.fromOffset(10,12),BackgroundColor3=C.dock},gameRow); corner(gameImg,10); gameImg.Image="rbxthumb://type=GameIcon&id="..tostring(game.PlaceId).."&w=150&h=150"; local gameName=label(gameRow,"Loading Map...",11,UDim2.fromOffset(78,10),UDim2.new(1,-86,0,18),{font=Enum.Font.GothamBold,truncate=true}); label(gameRow,"Place ID: "..tostring(game.PlaceId),9,UDim2.fromOffset(78,31),UDim2.new(1,-86,0,15),{color=C.muted}); local playerCount=label(gameRow,"Players in server: "..#Players:GetPlayers(),9,UDim2.fromOffset(78,51),UDim2.new(1,-86,0,15),{color=C.green}); task.spawn(function() local ok,info=pcall(function() return Marketplace:GetProductInfo(game.PlaceId) end); if ok and info and info.Name then gameName.Text=info.Name end end); local function refreshPlayers() playerCount.Text="Players in server: "..#Players:GetPlayers() end; Players.PlayerAdded:Connect(refreshPlayers); Players.PlayerRemoving:Connect(function() task.defer(refreshPlayers) end)
local function addToggle(title,desc,default,cb) local row=settingRow(46); label(row,title,10,UDim2.fromOffset(12,5),UDim2.new(1,-64,0,15),{font=Enum.Font.GothamBold}); label(row,desc,9,UDim2.fromOffset(12,23),UDim2.new(1,-64,0,14),{color=C.muted,truncate=true}); local sw=make("TextButton",{Size=UDim2.fromOffset(38,22),Position=UDim2.new(1,-48,0.5,-11),BackgroundColor3=default and C.green or C.off,Text=""},row); corner(sw,99); local knob=make("Frame",{Size=UDim2.fromOffset(18,18),Position=default and UDim2.new(1,-20,0.5,-9) or UDim2.new(0,2,0.5,-9),BackgroundColor3=C.white},sw); corner(knob,99); local state=default; sw.MouseButton1Click:Connect(function() state=not state; tween(sw,0.18,{BackgroundColor3=state and C.green or C.off}); tween(knob,0.18,{Position=state and UDim2.new(1,-20,0.5,-9) or UDim2.new(0,2,0.5,-9)}); if cb then cb(state) end end) end
addToggle("Camera Blur Effect","Blur behind open panels",blurEnabled,function(v) blurEnabled=v; updateEffects() end); addToggle("Auto Run Matching Game","Run the matching game script automatically",AUTO_RUN,function(v) AUTO_RUN=v end)
local scaleRow=settingRow(58); label(scaleRow,"UI Size Scaling",10,UDim2.fromOffset(12,5),UDim2.new(1,-90,0,15),{font=Enum.Font.GothamBold}); local scaleVal=label(scaleRow,"100%",10,UDim2.new(1,-72,0,5),UDim2.fromOffset(58,15),{color=C.blue,align=Enum.TextXAlignment.Right,font=Enum.Font.GothamBold}); local scaleButtons={}; for i,v in ipairs({0.8,0.9,1,1.1,1.2}) do local txt=tostring(math.floor(v*100)).."%"; local b=make("TextButton",{Size=UDim2.fromOffset(48,23),Position=UDim2.fromOffset(8+(i-1)*54,29),BackgroundColor3=v==1 and C.blue or C.btn,Text=txt,Font=Enum.Font.GothamBold,TextSize=9,TextColor3=C.white},scaleRow); corner(b,7); table.insert(scaleButtons,b); b.MouseButton1Click:Connect(function() userScale=v; applyScale(); scaleVal.Text=txt; for _,x in ipairs(scaleButtons) do x.BackgroundColor3=x==b and C.blue or C.btn end end) end
local keyRow=settingRow(44); label(keyRow,"Saved Key Data",10,UDim2.fromOffset(12,0),UDim2.new(1,-100,1,0),{font=Enum.Font.GothamBold}); local reset=make("TextButton",{Size=UDim2.fromOffset(76,26),Position=UDim2.new(1,-88,0.5,-13),BackgroundColor3=C.red,Text="Reset Key",Font=Enum.Font.GothamBold,TextSize=9,TextColor3=C.white},keyRow); corner(reset,8); reset.MouseButton1Click:Connect(function() deleteKey(); notify("Key Reset","Saved key deleted. Restart to login again.") end)
local login=make("Frame",{Name="LoginModal",AnchorPoint=Vector2.new(0.5,0.5),Size=UDim2.fromOffset(380,54),Position=UDim2.new(0.5,0,1.2,0),BackgroundColor3=C.bg,BackgroundTransparency=0.1,Visible=false,Active=true,ZIndex=250},gui); corner(login,16); stroke(login,1,0.75); local keyBox=make("TextBox",{Size=UDim2.fromOffset(112,36),Position=UDim2.fromOffset(12,9),BackgroundColor3=C.white,BackgroundTransparency=0.9,Text="",PlaceholderText="Enter Key...",TextColor3=C.white,Font=Enum.Font.GothamBold,TextSize=10,ClearTextOnFocus=false},login); corner(keyBox,9); local unlocked=false
local function grant() unlocked=true; loginOpen=false; tween(login,0.3,{Position=UDim2.new(0.5,0,1.2,0)}); updateEffects(); task.delay(0.32,function() if login.Parent then login:Destroy() end; showDock(); if AUTO_RUN and detected then task.delay(2,function() runGame(detected) end) end end) end
local function verify() local k=keyBox.Text:gsub("%s+",""); if k==PASSCODE or k=="admin" then saveKey(k); grant() else notify("Access Denied","Incorrect key, please try again") end end
local verifyBtn=make("TextButton",{Size=UDim2.fromOffset(62,36),Position=UDim2.fromOffset(132,9),BackgroundColor3=C.blue,Text="Verify",Font=Enum.Font.GothamBold,TextSize=9,TextColor3=C.white},login); corner(verifyBtn,9); verifyBtn.MouseButton1Click:Connect(verify); keyBox.FocusLost:Connect(function(enter) if enter then verify() end end)
local getBtn=make("TextButton",{Size=UDim2.fromOffset(66,36),Position=UDim2.fromOffset(200,9),BackgroundColor3=C.btn,Text="Get Key",Font=Enum.Font.GothamBold,TextSize=9,TextColor3=C.white},login); corner(getBtn,9); getBtn.MouseButton1Click:Connect(function() if not copyText(KEY_LINK) then notify("Key Link",KEY_LINK) end end)
local supportBtn=make("TextButton",{Size=UDim2.fromOffset(66,36),Position=UDim2.fromOffset(272,9),BackgroundColor3=C.btn,Text="Discord",Font=Enum.Font.GothamBold,TextSize=9,TextColor3=C.white},login); corner(supportBtn,9); supportBtn.MouseButton1Click:Connect(function() if not copyText(SUPPORT_LINK) then notify("Support",SUPPORT_LINK) end end)
UIS.InputBegan:Connect(function(input,processed) if processed then return end; if input.KeyCode==Enum.KeyCode.Escape then if settingsOpen then closeSettings() elseif hubOpen then closeMain() end end end)
local saved=loadKey(); if saved==PASSCODE or saved=="admin" then unlocked=true; showDock(); if AUTO_RUN and detected then task.delay(3,function() runGame(detected) end) end else loginOpen=true; login.Visible=true; tween(login,0.45,{Position=UDim2.new(0.5,0,0.82,0)},Enum.EasingStyle.Back); updateEffects() end
`;

export const hubKeyed = () => process.env.REQUIRE_KEY_HUB === '1';
export const buildLoader = async () => {
  const keyed = hubKeyed();
  const games = await sourceHubGamesLua(keyed);
  return LUA.replace('--@@FXAPI@@', keyed ? fxApiLua() : 'local FxApi = {}').replace('--@@GAMES@@', games);
};
