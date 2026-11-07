// สร้างโค้ดที่ให้ผู้ใช้วางใน executor (ใช้ฝั่ง client ได้)
export const ls = (u) => `loadstring(game:HttpGet("${u}"))()`;
// แบบ failover: ลองโดเมนตามลำดับ ถ้าโดเมนแรกถูก Cloudflare บล็อก (ได้ HTML/ว่าง/error) จะไปโดเมนถัดไปเอง
export const failover = (hosts, path) => {
  const list = hosts.map(h => `"https://${h}"`).join(',');
  return `for _,h in ipairs({${list}})do local ok,s=pcall(game.HttpGet,game,h.."${path}")if ok and type(s)=="string"and#s>0 and s:byte(1)~=60 then local f=loadstring(s)if f then return f()end end end`;
};
