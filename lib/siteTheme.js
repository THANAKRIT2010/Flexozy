// ส่วนที่ไม่ต้องใช้ fs/db — import ได้ทั้งฝั่งเซิร์ฟเวอร์และหน้าหลังบ้าน (พรีวิวสี/ตัวเลขสด)
// ---------- ธีมสี (หน้าแรก + หลังบ้านใช้ชุดเดียวกัน) ----------
export const THEMES = {
  violet:  { name:'ไวโอเลต',  main:'#7c5cff', soft:'#b9a8ff', alt:'#e879f9' },
  ocean:   { name:'ฟ้าอาร์กติก', main:'#0ea5e9', soft:'#8fd8ff', alt:'#6366f1' },
  emerald: { name:'เขียวมรกต', main:'#10b981', soft:'#86efc5', alt:'#22d3ee' },
  rose:    { name:'โรสพิงค์',  main:'#f43f5e', soft:'#fda4b4', alt:'#fb923c' },
  amber:   { name:'ส้มอำพัน',  main:'#f59e0b', soft:'#fcd581', alt:'#f43f5e' },
  mono:    { name:'ขาว-ดำ',    main:'#e5e7eb', soft:'#ffffff', alt:'#9ca3af' },
};
const HEX = /^#[0-9a-f]{6}$/i;
const rgbOf = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = (c) => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function hueShift(rgb, deg){
  const [r, g, b] = rgb.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0, s = 0;
  if(d){ s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60; }
  h = (h + deg + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [R, G, B] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [R + m, G + m, B + m].map(v => v * 255);
}
// ตัวแปร CSS ของธีม (ใส่ที่ <html style=…>)
export function themeVars(cfg){
  const t = cfg.theme === 'custom' && HEX.test(cfg.accent || '')
    ? { main:cfg.accent.toLowerCase(), soft:toHex(mix(rgbOf(cfg.accent), [255, 255, 255], .45)), alt:toHex(hueShift(rgbOf(cfg.accent), 40)) }
    : THEMES[cfg.theme] || THEMES.violet;
  const rgb = rgbOf(t.main), lum = (.299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2]) / 255;
  return { '--main':t.main, '--main-rgb':rgb.join(','), '--main-soft':t.soft, '--main-alt':t.alt, '--on-main':lum > .62 ? '#0a0a0f' : '#ffffff' };
}

export const SOURCES = { views:'ยอดรัน/ดูทั้งหมด', links:'จำนวนลิงก์', owners:'จำนวนผู้สร้างลิงก์', keys:'Key ที่ใช้งานได้', maps:'จำนวนแมพใน Hub', manual:'กำหนดตัวเลขเอง' };
export const ICON_IDS = ['play', 'link', 'key', 'map', 'users', 'bolt', 'shield', 'star', 'box', 'globe', 'chart', 'heart', 'crown', 'download'];
export const statValue = (s, raw) => Math.max(0, (s.source === 'manual' ? s.value : (raw || {})[s.source] || 0) + (s.offset || 0));
