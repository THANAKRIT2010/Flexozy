import { getEarn, saveEarn, getKey, getKeyUse, saveKeyUse, releaseHwid, saveKey } from './db';
import { createKey, kidOf, KEY_RE } from './keys';
// ระบบรับคีย์ (v21): ทำครบทุกขั้นตอน (YouTube + Discord) → ออกคีย์ผูกกับบัญชี Discord
// เวลารอ 15 วินาทีนับที่ server (กันข้ามด้วยการยิง API เอง) — ตรวจ "ติดตามจริง" ไม่ได้โดยไม่ใช้ YouTube/Discord API
export const WAIT_MS = 15000;
const INVITE = () => (process.env.DISCORD_INVITE || 'WFUejxeggt').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'WFUejxeggt';
const YT_URL = () => (/^https:\/\/[^\s]+$/.test(process.env.YT_URL || '') ? process.env.YT_URL : 'https://www.youtube.com/@FlexozyBit');
export const TASKS = () => [
  { id:'yt', kind:'youtube', title:'ติดตามช่อง YouTube', sub:'@FlexozyBit', url:YT_URL() },
  { id:'dc', kind:'discord', title:'เข้าร่วม Discord Server', sub:'discord.gg/' + INVITE(), url:'https://discord.gg/' + INVITE() },
];
// อายุคีย์ที่ได้จากการทำครบ (วัน) · 0 = ตลอดชีพ
export const keyDays = () => { const d = Number(process.env.KEY_EARN_DAYS); return Number.isFinite(d) && d >= 0 ? Math.min(d, 3650) : 7; };

const blank = () => ({ tasks:{}, kid:'', key:'' });
async function rec(uid){ return { ...blank(), ...((await getEarn(uid)) || {}) }; }
// คีย์ที่ผูกไว้ยังใช้ได้ไหม (ไม่ถูกเพิกถอน / ไม่หมดอายุ)
async function active(r){
  if(!r.kid) return null;
  const k = await getKey(r.kid);
  if(!k || k.revoked || (k.exp && Date.now() > k.exp)) return { expired:true, exp:0 };
  return { exp: k.exp ?? null };
}

export async function status(uid){
  const r = await rec(uid), a = await active(r), now = Date.now();
  const state = a ? (a.expired ? 'expired' : 'active') : 'none';
  return {
    state, days:keyDays(), key: state === 'active' ? r.key : '', exp: state === 'active' ? a.exp : null,
    tasks: TASKS().map(t => { const s = r.tasks[t.id] || {};
      return { ...t, started: s.started || 0, done: !!s.done, wait_left: s.started && !s.done ? Math.max(0, WAIT_MS - (now - s.started)) : 0 }; }),
  };
}

export async function start(uid, id){
  if(!TASKS().some(t => t.id === id)) return { err:'bad_task' };
  const r = await rec(uid), a = await active(r);
  if(a && !a.expired) return { err:'already_active' };
  if(a?.expired){ r.kid = ''; r.key = ''; r.tasks = {}; }   // หมดอายุแล้ว = เริ่มรอบใหม่
  if(r.tasks[id]?.done) return { err:'done' };
  r.tasks[id] = { started:Date.now(), done:false };
  await saveEarn(uid, r);
  return { ok:true };
}

export async function claim(uid, id){
  if(!TASKS().some(t => t.id === id)) return { err:'bad_task' };
  const r = await rec(uid), s = r.tasks[id];
  if(!s?.started) return { err:'not_started' };
  if(!s.done && Date.now() - s.started < WAIT_MS) return { err:'too_early' };
  r.tasks[id] = { started:s.started, done:true };
  const all = TASKS().every(t => r.tasks[t.id]?.done);
  if(all && !r.kid){
    const { key, rec: k } = await createKey({ label:'earn:' + uid, days:keyDays(), scopes:['*'] });
    r.kid = k.kid; r.key = key;
  }
  await saveEarn(uid, r);
  return { ok:true, issued: all };
}

// ===== v22: แลกคีย์ที่ซื้อมา / รีเซ็ต HWID / ข้อมูลบัญชี =====

export async function redeem(uid, raw){
  const key = String(raw || '').replace(/\s+/g, '').toUpperCase();
  if(!KEY_RE.test(key)) return { err:'invalid_key' };
  const kid = kidOf(key), k = await getKey(kid);
  if(!k || k.revoked || (k.exp && Date.now() > k.exp)) return { err:'invalid_key' };
  if(k.owner && String(k.owner) !== String(uid)) return { err:'key_used' };
  const r = await rec(uid), a = await active(r);
  if(a && !a.expired && r.kid !== kid) return { err:'already_active' };
  await saveKey({ ...k, owner:String(uid) });          // ผูกคีย์กับบัญชีนี้ — บัญชีอื่นแลกซ้ำไม่ได้
  r.kid = kid; r.key = key;
  await saveEarn(uid, r);
  return { ok:true };
}

export async function accountInfo(uid){
  const r = await rec(uid), a = await active(r);
  let hwid = null;
  if(r.kid){
    const u = await getKeyUse(r.kid);
    hwid = { value:u.hw_raw || '', src:u.hw_src || '', bound:!!u.hwid, last_used:u.last_used || 0, uses:u.uses || 0 };
  }
  return { key_active: !!(a && !a.expired), hwid };
}

export async function resetHwid(uid){
  const r = await rec(uid);
  if(!r.kid) return { err:'no_key' };
  const u = await getKeyUse(r.kid);
  u.hwid = null; u.hw_raw = ''; u.hw_src = '';
  await releaseHwid(r.kid);
  u.events = [{ t:'hwid_reset', ts:Date.now() }, ...(u.events || [])].slice(0, 30);
  await saveKeyUse(r.kid, u);
  return { ok:true };
}
