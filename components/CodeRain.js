'use client';
import { useEffect, useRef } from 'react';
// พื้นหลังหน้าสร้างสคริปต์: ฝนตัวอักษรโค้ด Lua จางๆ ไหลลงช้าๆ + จุดแสงลอย — ใช้สีธีมจากหลังบ้าน, หยุดเมื่อแท็บถูกซ่อน/ผู้ใช้ปิดแอนิเมชัน
const WORDS = ['local','function','end','game','Players','LocalPlayer','loadstring','HttpGet','task.wait','while true do','pcall','Workspace','Humanoid','RunService','if then','return','for i=1,10 do','Instance.new','--','{}','()','=','..','0x','FLEXOZY'];
export default function CodeRain(){
  const ref = useRef(null);
  useEffect(()=>{
    const cv = ref.current, ctx = cv.getContext('2d'); if(!ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w=0,h=0,dpr=1,cols=[],raf=0,last=0,rgb='124,92,255';
    const FS=13, GAP=22;
    const readColor=()=>{ const v=getComputedStyle(document.documentElement).getPropertyValue('--main-rgb').trim(); if(v) rgb=v; };
    const pick=()=>WORDS[Math.random()*WORDS.length|0];
    const resize=()=>{ dpr=Math.min(devicePixelRatio||1,2); w=cv.clientWidth; h=cv.clientHeight; cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
      const n=Math.ceil(w/(FS*GAP/10)); cols=Array.from({length:n},(_,i)=>({ x:i*(FS*GAP/10), y:Math.random()*-h, v:.25+Math.random()*.7, t:pick(), a:.05+Math.random()*.16, bright:Math.random()<.06 })); readColor(); };
    const draw=(t)=>{
      raf=requestAnimationFrame(draw); if(document.hidden) return; const dt=Math.min(40,t-last||16); last=t;
      ctx.clearRect(0,0,w,h); ctx.font=`${FS}px JetBrains Mono, Consolas, monospace`; ctx.textBaseline='top';
      for(const c of cols){
        c.y+=c.v*dt*.045; if(c.y>h+60){ c.y=-40-Math.random()*h*.4; c.t=pick(); c.v=.25+Math.random()*.7; c.bright=Math.random()<.06; }
        // เขียนเป็นแนวตั้ง ทีละตัวอักษร พร้อมหางจาง
        for(let i=0;i<c.t.length;i++){ const y=c.y+i*(FS+2); if(y<-FS||y>h) continue; const fade=1-i/(c.t.length+2);
          ctx.fillStyle=c.bright&&i===c.t.length-1?`rgba(255,255,255,${.55*fade})`:`rgba(${rgb},${c.a*fade+(c.bright?.18:0)})`; ctx.fillText(c.t[c.t.length-1-i],c.x,y); }
      }
    };
    resize(); const ro=new ResizeObserver(resize); ro.observe(cv);
    if(reduce){ draw(0); cancelAnimationFrame(raf); } else raf=requestAnimationFrame(draw);
    const mo=new MutationObserver(readColor); mo.observe(document.documentElement,{attributes:true,attributeFilter:['style']});
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); };
  },[]);
  return <canvas ref={ref} className="fx-rain" aria-hidden="true"/>;
}
