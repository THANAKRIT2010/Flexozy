// ดึงสคริปต์จากภายนอกอย่างปลอดภัย (กัน SSRF) — URL ที่แอดมินตั้งในหลังบ้านจะถูกเซิร์ฟเวอร์ดึงเอง
// กัน: http, IP ตรง ๆ (127.0.0.1 / 169.254.169.254 / [::1]), localhost / .internal / .local, พอร์ตแปลก, user:pass@ และ redirect ไปที่เหล่านั้น
// หมายเหตุ: ไม่ได้ resolve DNS (กัน DNS rebinding ไม่ได้ 100%) — ถ้าต้องการเข้มสุดให้ตั้ง SCRIPT_HOST_ALLOW=raw.githubusercontent.com,gist.githubusercontent.com
export function checkScriptUrl(input){
  let u; try{ u = new URL(String(input)) }catch{ throw new Error('URL ไม่ถูกต้อง') }
  if(u.protocol !== 'https:') throw new Error('URL ต้องเป็น https://');
  if(u.username || u.password) throw new Error('URL ห้ามมี user:password');
  if(u.port && u.port !== '443') throw new Error('ใช้ได้เฉพาะพอร์ต 443');
  const h = u.hostname.toLowerCase();
  if(!h.includes('.') || h.startsWith('[') || /^\d+(\.\d+){3}$/.test(h) || /(^|\.)(localhost|local|internal|localdomain|lan|home|corp|intranet)$/.test(h)) throw new Error('โฮสต์นี้ไม่อนุญาต (ต้องเป็นโดเมนสาธารณะ ไม่ใช่ IP/โดเมนภายใน)');
  const allow = (process.env.SCRIPT_HOST_ALLOW||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(allow.length && !allow.some(a => h === a || h.endsWith('.'+a))) throw new Error('โฮสต์ไม่อยู่ในรายการอนุญาต (SCRIPT_HOST_ALLOW)');
  return u.toString();
}
export async function fetchScript(url, { max = 3e6, timeout = 8000 } = {}){
  let cur = checkScriptUrl(url);
  for(let hop = 0; hop < 4; hop++){
    const r = await fetch(cur, { cache:'no-store', redirect:'manual', signal:AbortSignal.timeout(timeout), headers:{ 'user-agent':'Flexozy-Server/1.0' } });
    if(r.status >= 300 && r.status < 400 && r.headers.get('location')){ cur = checkScriptUrl(new URL(r.headers.get('location'), cur)); continue; }
    if(!r.ok) throw new Error('upstream ' + r.status);
    const len = Number(r.headers.get('content-length')||0); if(len > max) throw new Error('too large');
    const reader = r.body.getReader(), chunks = []; let n = 0;
    for(;;){ const { done, value } = await reader.read(); if(done) break; n += value.length; if(n > max){ try{ await reader.cancel() }catch{} throw new Error('too large'); } chunks.push(value); }
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  throw new Error('too many redirects');
}
