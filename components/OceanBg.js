'use client';
import { useEffect, useRef } from 'react';
// พื้นหลังผิวปรอท/ทะเล (พอร์ตจาก mercury_ocean.js ของ Mercury Obfuscator): WebGL2 ray-march + ระลอกตามเมาส์ + กล้องขยับตามการเลื่อนหน้า
// ถ้าเครื่องไม่รองรับ WebGL2 จะใช้คลื่นเส้น 2D แทน
const VS = `#version 300 es
in vec2 a_position; out vec2 v_uv;
void main(){ v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
out vec4 fragColor; in vec2 v_uv;
uniform vec2 u_resolution; uniform float u_time; uniform vec2 u_mouse; uniform float u_mouse_vel; uniform float u_scroll;
#define MAX_STEPS 75
#define SURF_DIST 0.015
#define MAX_DIST 24.0
float getWaveHeight(vec2 p, float t){
  float h = 0.0;
  vec2 d1 = vec2(0.8, 0.6); h += sin(dot(p, d1) * 0.38 + t * 0.75) * 0.42;
  vec2 d2 = vec2(-0.7, 0.7); h += cos(dot(p, d2) * 0.48 - t * 0.62) * 0.30;
  vec2 d3 = vec2(0.3, 0.95); float s3 = sin(dot(p, d3) * 0.85 + t * 1.15); h += (s3 * s3 - 0.5) * 0.18;
  vec2 d4 = vec2(-0.9, -0.4); h += sin(dot(p, d4) * 1.6 - t * 1.5) * 0.06;
  vec2 mPos = vec2(u_mouse.x * 6.0, (1.0 - u_mouse.y) * 6.0 + 2.0);
  float distToMouse = length(p - mPos);
  h += sin(distToMouse * 3.5 - t * 4.5) * exp(-distToMouse * 0.7) * (0.25 + u_mouse_vel * 0.5);
  return h;
}
vec3 getWaveNormal(vec3 p, float t){
  const float eps = 0.02;
  float h0 = getWaveHeight(p.xz, t), hx = getWaveHeight(p.xz + vec2(eps, 0.0), t), hz = getWaveHeight(p.xz + vec2(0.0, eps), t);
  return normalize(vec3(h0 - hx, eps, h0 - hz));
}
vec3 getEnvironmentReflection(vec3 r, float scroll){
  vec3 bg = vec3(0.027);
  float horizonFade = pow(1.0 - abs(r.y), 3.0) * 0.08; bg += vec3(0.08, 0.09, 0.11) * horizonFade;
  vec3 keyLightDir = normalize(vec3(mix(0.15, -0.25, scroll), 0.45, -0.88));
  float specSharp = pow(max(dot(r, keyLightDir), 0.0), 32.0), specBroad = pow(max(dot(r, keyLightDir), 0.0), 4.0);
  vec3 rimLightDir = normalize(vec3(-0.8, 0.2, 0.5));
  float rimLight = pow(max(dot(r, rimLightDir), 0.0), 8.0) * 0.15;
  return bg + vec3(0.96, 0.98, 1.0) * specSharp * 0.48 + vec3(0.65, 0.68, 0.74) * specBroad * 0.18 + vec3(0.4, 0.45, 0.52) * rimLight * 0.6;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - vec2(0.5, 0.42) * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float camY = mix(1.75, 0.95, u_scroll) + u_mouse.y * 0.2, camZ = mix(4.2, 1.4, u_scroll), camX = u_mouse.x * 0.4;
  vec3 ro = vec3(camX, camY, camZ);
  float pitch = mix(-0.18, -0.07, u_scroll);
  vec3 rd = normalize(vec3(uv.x, uv.y + pitch, -1.8));
  vec3 col = vec3(0.027);
  if(rd.y > 0.0){ col += vec3(0.06, 0.07, 0.09) * pow(1.0 - rd.y, 4.0) * 0.06; fragColor = vec4(col, 1.0); return; }
  float et = u_time + u_scroll * 5.0, t = 0.6; vec3 p = ro; bool hit = false;
  for(int i = 0; i < MAX_STEPS; i++){
    p = ro + rd * t; float d = p.y - getWaveHeight(p.xz, et);
    if(d < SURF_DIST){ hit = true; break; }
    t += max(d * 0.55, 0.035); if(t > MAX_DIST) break;
  }
  if(hit){
    vec3 n = getWaveNormal(p, et), v = -rd, r = reflect(rd, n);
    float fresnel = 0.75 + 0.25 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    vec3 reflection = getEnvironmentReflection(r, u_scroll);
    float centerDist = length(vec2(uv.x * 1.35, uv.y + 0.08));
    reflection *= mix(0.24, 1.0, smoothstep(0.2, 0.85, centerDist));
    vec3 waterColor = mix(vec3(0.035, 0.035, 0.042), reflection, fresnel);
    float fog = pow(clamp((t - 2.5) / (MAX_DIST - 2.5), 0.0, 1.0), 1.4);
    col = mix(waterColor, vec3(0.027), fog);
  }
  fragColor = vec4(pow(col, vec3(0.95)), 1.0);
}`;
export default function OceanBg(){
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, still = matchMedia('(prefers-reduced-motion: reduce)').matches, small = innerWidth < 700;
    const gl = c.getContext('webgl2', { alpha:false, antialias:false, powerPreference:'high-performance' });
    let raf = 0, stop = () => {};
    if(gl){
      const mk = (ty, src) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
      const vs = mk(gl.VERTEX_SHADER, VS), fs = mk(gl.FRAGMENT_SHADER, FS), pr = gl.createProgram();
      if(vs && fs){ gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); }
      if(vs && fs && gl.getProgramParameter(pr, gl.LINK_STATUS)){
        gl.useProgram(pr); const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        const a = gl.getAttribLocation(pr, 'a_position'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        const U = n => gl.getUniformLocation(pr, n), uR = U('u_resolution'), uT = U('u_time'), uM = U('u_mouse'), uV = U('u_mouse_vel'), uS = U('u_scroll');
        let W = 0, H = 0; const m = { x:0, y:0, tx:0, ty:0, lx:0, ly:0, v:0, tv:0 }, sc = { c:0, t:0 }, t0 = performance.now();
        const rs = () => { const d = Math.min(devicePixelRatio || 1, 1.5) * (small ? .6 : .85); W = innerWidth; H = innerHeight; c.width = Math.floor(W * d); c.height = Math.floor(H * d); gl.viewport(0, 0, c.width, c.height); };
        const mv = (e) => { m.tx = e.clientX / W * 2 - 1; m.ty = e.clientY / H * 2 - 1; m.tv = Math.min(Math.hypot(e.clientX - m.lx, e.clientY - m.ly) / 35, 1); m.lx = e.clientX; m.ly = e.clientY; };
        const sf = () => { const mx = Math.max(1, document.documentElement.scrollHeight - innerHeight); sc.t = Math.min(Math.max(scrollY / mx, 0), 1); };
        const draw = (ts) => { m.x += (m.tx - m.x) * .05; m.y += (m.ty - m.y) * .05; m.v += (m.tv - m.v) * .07; m.tv *= .94; sc.c += (sc.t - sc.c) * .06;
          gl.uniform2f(uR, c.width, c.height); gl.uniform1f(uT, (ts - t0) * .001); gl.uniform2f(uM, m.x, m.y); gl.uniform1f(uV, m.v); gl.uniform1f(uS, sc.c); gl.drawArrays(gl.TRIANGLES, 0, 6); };
        let fr = 0; const loop = (ts) => { if(!document.hidden && !(small && (fr++ & 1))) draw(ts); raf = requestAnimationFrame(loop); };
        rs(); sf(); addEventListener('resize', rs, { passive:true }); addEventListener('mousemove', mv, { passive:true }); addEventListener('scroll', sf, { passive:true });
        if(still) draw(t0 + 4000); else raf = requestAnimationFrame(loop);
        stop = () => { removeEventListener('resize', rs); removeEventListener('mousemove', mv); removeEventListener('scroll', sf); };
        return () => { cancelAnimationFrame(raf); stop(); };
      }
    }
    // สำรอง: คลื่นเส้น 2D
    const g = c.getContext('2d'); if(!g) return; const N = small ? 22 : 34; let w = 0, h = 0, t = 0;
    const draw = () => { g.fillStyle = '#070707'; g.fillRect(0, 0, w, h); const hz = h * .34, step = Math.max(10, w / 110), u = h / 900;
      for(let i = 0; i < N; i++){ const d = i / (N - 1), base = hz + (h - hz) * Math.pow(d, 1.7), amp = (5 + 70 * d) * u, k = 1 + d * .5;
        g.beginPath(); g.moveTo(-step, h + 4);
        for(let x = -step; x <= w + step; x += step) g.lineTo(x, base - amp * (Math.sin(x * .0048 * k + t * .8 + i * .42) * .55 + Math.sin(x * .0115 - t * .55 + i * .7) * .3 + Math.sin(x * .0022 + t * .35 + i * .15) * .5));
        g.lineTo(w + step, h + 4); g.closePath(); g.fillStyle = `rgb(${14 + 14 * d | 0},${14 + 14 * d | 0},${16 + 16 * d | 0})`; g.fill(); g.lineWidth = .6 + 1.5 * d; g.strokeStyle = `rgba(255,255,255,${.05 + .34 * Math.pow(d, 1.2)})`; g.stroke(); } };
    const rs = () => { const d = Math.min(devicePixelRatio || 1, 1.5) * .7; w = c.width = Math.ceil(innerWidth * d); h = c.height = Math.ceil(innerHeight * d); draw(); };
    const loop = () => { if(!document.hidden){ t += .011; draw(); } raf = requestAnimationFrame(loop); };
    rs(); addEventListener('resize', rs); if(!still) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', rs); };
  }, []);
  return (<><div className="ocean" aria-hidden="true"><canvas ref={ref}/></div><div className="site-grid" aria-hidden="true"/></>);
}
