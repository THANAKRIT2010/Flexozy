'use client';
import { useId } from 'react';
// กราฟ SVG ล้วน (ไม่พึ่งไลบรารี) — เส้นโค้งเนียน + พื้นไล่เฉด ให้หน้าตาเหมือนแดชบอร์ดอ้างอิง
export const fmt = (n) => { n = Number(n) || 0; if(n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M'; if(n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K'; return String(Math.round(n)); };
export const dlabel = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month:'short', day:'numeric', timeZone:'UTC' });
function curve(pts, lo, hi){
  if(pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  const cl = (y) => Math.min(hi, Math.max(lo, y));
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for(let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${cl(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${cl(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
export function Spark({ values, color = '#fafafa', h = 56 }){
  const id = useId().replace(/:/g, ''), W = 240, max = Math.max(1, ...values), n = values.length;
  const pts = values.map((v, i) => [n > 1 ? i * W / (n - 1) : W / 2, h - 4 - (v / max) * (h - 12)]);
  const line = curve(pts, 2, h - 2), area = line && `${line} L${pts.at(-1)[0]},${h} L${pts[0][0]},${h} Z`;
  return (<svg className="dz-spark" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {area && <path d={area} fill={`url(#${id})`}/>}{line && <path d={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round"/>}
  </svg>);
}
const nice = (m) => { if(m <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 4 ? 4 : f <= 5 ? 5 : 10) * p; };
export function AreaChart({ labels, series, hidden = [] }){
  const uid = useId().replace(/:/g, ''), W = 1000, H = 340, L = 46, R = 18, T = 18, B = 30, pw = W - L - R, ph = H - T - B, n = labels.length;
  const vis = series.filter(s => !hidden.includes(s.key)), top = nice(Math.max(1, ...vis.flatMap(s => s.values)));
  const X = (i) => L + (n > 1 ? i * pw / (n - 1) : pw / 2), Y = (v) => T + ph - (v / top) * ph;
  const first = vis[0], avg = first ? first.values.reduce((a, b) => a + b, 0) / n : 0;
  let pk = -1; if(first){ const m = Math.max(...first.values); if(m > 0) pk = first.values.lastIndexOf(m); }
  const step = n <= 8 ? 1 : n <= 16 ? 2 : 4, ticks = [0, top / 2, top];
  const empty = vis.every(s => s.values.every(v => !v));
  return (<svg className="dz-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กราฟสรุปกิจกรรมรายวัน">
    <defs>{series.map(s => <linearGradient key={s.key} id={`${uid}${s.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.color} stopOpacity=".34"/><stop offset="1" stopColor={s.color} stopOpacity="0"/></linearGradient>)}</defs>
    {ticks.map((t, i) => <g key={i}><line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#fff" strokeOpacity={i ? .07 : .12} strokeDasharray={i ? '3 5' : ''}/><text x={L - 10} y={Y(t) + 4} textAnchor="end" className="dz-ax">{fmt(t)}</text></g>)}
    {labels.map((d, i) => i % step === 0 && <text key={d} x={X(i)} y={H - 8} textAnchor="middle" className="dz-ax">{dlabel(d)}</text>)}
    {vis.slice().reverse().map(s => { const pts = s.values.map((v, i) => [X(i), Y(v)]), line = curve(pts, T, T + ph), area = line && `${line} L${X(n - 1)},${T + ph} L${X(0)},${T + ph} Z`;
      return <g key={s.key}>{area && <path d={area} fill={`url(#${uid}${s.key})`}/>}<path d={line} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></g>; })}
    {first && avg > 0 && <g><line x1={L} x2={W - R} y1={Y(avg)} y2={Y(avg)} stroke="#fff" strokeOpacity=".28" strokeDasharray="4 4"/><text x={L + 6} y={Y(avg) - 6} className="dz-ax dz-avg">Ø {fmt(avg)}</text></g>}
    {pk >= 0 && <g><circle cx={X(pk)} cy={Y(first.values[pk])} r="4" fill={first.color} stroke="#09090b" strokeWidth="2"/><text x={Math.min(X(pk), W - R - 4)} y={Y(first.values[pk]) - 11} textAnchor={X(pk) > W - 90 ? 'end' : 'middle'} className="dz-ax dz-peak">Peak {fmt(first.values[pk])}</text></g>}
    {empty && <text x={W / 2} y={H / 2} textAnchor="middle" className="dz-ax">ยังไม่มีข้อมูลในช่วงนี้</text>}
  </svg>);
}
