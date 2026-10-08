import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { setCookie, readCookie, clearCookie, setUser } from './session';
const site = (req) => (process.env.FRONTEND_URL || new URL(req.url).origin).replace(/\/+$/,'');
export async function discordLogin(){
  const state = crypto.randomBytes(16).toString('hex');
  await setCookie('oauth_state', { state }, 600);
  const q = new URLSearchParams({ client_id:process.env.DISCORD_CLIENT_ID, response_type:'code',
    redirect_uri:process.env.DISCORD_REDIRECT_URI, scope:'identify guilds.join email', state });
  return NextResponse.redirect('https://discord.com/oauth2/authorize?'+q);
}
export async function discordCallback(req){
  const sp = new URL(req.url).searchParams, code = sp.get('code'), st = await readCookie('oauth_state');
  if(!code || !st || st.state !== sp.get('state')) return new Response('Invalid OAuth state — ลองล็อกอินใหม่อีกครั้ง',{status:400});
  await clearCookie('oauth_state');
  try{
    const tr = await fetch('https://discord.com/api/oauth2/token',{ method:'POST', body:new URLSearchParams({
      client_id:process.env.DISCORD_CLIENT_ID, client_secret:process.env.DISCORD_CLIENT_SECRET, grant_type:'authorization_code',
      code, redirect_uri:process.env.DISCORD_REDIRECT_URI }) });
    const tok = await tr.json(); if(!tok.access_token) throw new Error('token');
    const u = await (await fetch('https://discord.com/api/users/@me',{ headers:{Authorization:'Bearer '+tok.access_token} })).json();
    if(!u.id) throw new Error('user');
    // auto-join เซิร์ฟเวอร์ (ถ้าตั้งบอท+guild ไว้) — ล้มเหลวไม่ทำให้ login ล้ม
    if(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_GUILD_ID){
      fetch(`https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${u.id}`,{ method:'PUT',
        headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify({access_token:tok.access_token}) }).catch(()=>{});
    }
    await setUser({ id:u.id, username:u.global_name||u.username,
      avatar:u.avatar?`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`:'' });
    return NextResponse.redirect(site(req)+'/');
  }catch{ return new Response('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',{status:500}); }
}
export async function doLogout(req){ await clearCookie('session'); return NextResponse.redirect(site(req)+'/'); }
