import { ROOT_DOMAIN } from "../lib/constants";

export async function GET() {
  return new Response(buildHtml(ROOT_DOMAIN), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function buildHtml(rootDomain) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Flexozy — สร้างเว็บของคุณเอง</title>
<meta name="description" content="วาง HTML ตั้งชื่อ แล้วเว็บของคุณออนไลน์ทันทีที่ ${rootDomain}/#ชื่อคุณ" />
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%236D4CF7'/%3E%3Cstop%20offset='1'%20stop-color='%23FF6B6B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='100'%20height='100'%20rx='22'%20fill='url(%23g)'/%3E%3Ctext%20x='50'%20y='69'%20font-family='Arial,sans-serif'%20font-weight='700'%20font-size='58'%20fill='white'%20text-anchor='middle'%3Ef%3C/text%3E%3C/svg%3E" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#FAFAFC;
    --surface:#FFFFFF;
    --paper:#F5F3FC;
    --paper-strong:#ECE8FA;
    --ink:#15121F;
    --muted:#67667A;
    --faint:#A2A0B3;
    --line:#EAE7F5;
    --line-strong:#DCD7EF;
    --accent:#6D4CF7;
    --accent2:#FF6B6B;
    --accent-hover:#5A3AE0;
    --accent-soft:#F1ECFF;
    --gradient:linear-gradient(135deg, #6D4CF7 0%, #9A5CF7 45%, #FF6B6B 100%);
    --ok:#0FA968;
    --ok-soft:#E6FBF1;
    --danger:#EF4444;
    --danger-soft:#FEECEC;
    --warn:#DB8A0B;
    --warn-soft:#FDF3E1;
    --radius-sm:8px;
    --radius-md:12px;
    --radius-lg:20px;
    --shadow-sm:0 1px 2px rgba(21,18,31,0.04), 0 1px 1px rgba(21,18,31,0.03);
    --shadow-md:0 8px 24px -8px rgba(80,60,180,0.18);
    --shadow-lg:0 24px 60px -20px rgba(80,60,180,0.28);
  }
  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{
    background:var(--bg);
    color:var(--ink);
    font-family:'Inter', sans-serif;
    min-height:100vh;
    -webkit-font-smoothing:antialiased;
  }
  a{ color:var(--accent); }
  ::selection{ background:var(--accent-soft); color:var(--accent); }
  button{ font-family:inherit; }
  button:focus-visible, input:focus-visible, textarea:focus-visible, [tabindex]:focus-visible{
    outline:2px solid var(--accent); outline-offset:2px;
  }

  /* ---------- topbar ---------- */
  .topbar{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    padding:20px clamp(20px, 4vw, 56px);
    background:rgba(250,250,252,0.85);
    backdrop-filter:saturate(180%) blur(10px);
    position:sticky;
    top:0;
    z-index:40;
    border-bottom:1px solid var(--line);
    flex-wrap:wrap;
  }
  .wordmark{
    font-family:'Space Grotesk', sans-serif;
    font-weight:700;
    font-size:21px;
    letter-spacing:-0.01em;
    display:flex;
    align-items:center;
    gap:9px;
  }
  .wordmark .dot{
    width:11px; height:11px; border-radius:4px;
    background:var(--gradient);
    display:inline-block;
  }
  .wordmark span{
    background:var(--gradient);
    -webkit-background-clip:text;
    background-clip:text;
    color:transparent;
  }
  .nav-tabs{
    display:flex;
    gap:4px;
    background:var(--paper);
    padding:4px;
    border-radius:999px;
    border:1px solid var(--line);
  }
  .nav-tab{
    font-family:'Inter', sans-serif;
    font-weight:600;
    font-size:13.5px;
    padding:9px 18px;
    border-radius:999px;
    cursor:pointer;
    color:var(--muted);
    border:1px solid transparent;
    background:transparent;
    white-space:nowrap;
    transition:background .15s ease, color .15s ease;
  }
  .nav-tab.active{
    background:var(--surface);
    color:var(--ink);
    box-shadow:var(--shadow-sm);
  }
  .nav-tab:not(.active):hover{ color:var(--ink); }

  /* ---------- hero ---------- */
  .hero{
    position:relative;
    padding:56px clamp(20px, 4vw, 56px) 48px;
    display:grid;
    grid-template-columns:1.1fr 0.9fr;
    gap:44px;
    align-items:center;
    overflow:hidden;
  }
  .hero::before{
    content:'';
    position:absolute;
    top:-160px; left:50%; transform:translateX(-38%);
    width:640px; height:420px;
    background:radial-gradient(closest-side, rgba(109,76,247,0.16), rgba(255,107,107,0.08), transparent 70%);
    pointer-events:none;
    z-index:0;
  }
  .hero > *{ position:relative; z-index:1; }
  @media (max-width: 900px){
    .hero{ grid-template-columns:1fr; padding-bottom:36px; }
  }
  .eyebrow{
    display:inline-flex;
    align-items:center;
    gap:6px;
    font-family:'JetBrains Mono', monospace;
    font-size:12px;
    font-weight:500;
    color:var(--accent);
    background:var(--accent-soft);
    border:1px solid var(--line-strong);
    padding:6px 12px;
    border-radius:999px;
    margin-bottom:18px;
  }
  .hero h1{
    font-family:'Space Grotesk', sans-serif;
    font-weight:600;
    font-size:clamp(30px, 3.8vw, 46px);
    line-height:1.14;
    max-width:16ch;
    margin:0 0 16px;
    letter-spacing:-0.015em;
  }
  .hero p{
    color:var(--muted);
    font-size:15.5px;
    line-height:1.65;
    max-width:46ch;
    margin:0;
  }
  .addressbar{
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:var(--radius-lg);
    overflow:hidden;
    box-shadow:var(--shadow-lg);
  }
  .addressbar .chrome{
    display:flex;
    align-items:center;
    gap:6px;
    padding:12px 14px;
    border-bottom:1px solid var(--line);
    background:var(--paper);
  }
  .addressbar .chrome i{
    width:9px; height:9px; border-radius:50%; background:var(--line-strong); display:block;
  }
  .addressbar .url-row{
    display:flex;
    align-items:center;
    gap:8px;
    padding:18px 16px;
    background:var(--surface);
  }
  .addressbar .lock{ color:var(--ok); font-size:13px; }
  .addressbar .url-text{
    font-family:'JetBrains Mono', monospace;
    font-size:14.5px;
    color:var(--ink);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .addressbar .url-text .rest{ color:var(--faint); }
  .addressbar .url-text .name{ color:var(--accent); font-weight:600; }
  .addressbar .preview-strip{
    padding:24px 16px 28px;
    background:linear-gradient(180deg, #fff, var(--paper) 140%);
    display:flex;
    flex-direction:column;
    gap:9px;
  }
  .addressbar .preview-strip .bar{
    height:9px; background:var(--paper-strong); border-radius:3px;
  }
  .addressbar .preview-strip .bar.w1{ width:52%; }
  .addressbar .preview-strip .bar.w2{ width:78%; }
  .addressbar .preview-strip .bar.w3{
    width:40%; margin-top:12px; height:24px; border-radius:6px;
    background:var(--gradient); border:none;
  }

  /* ---------- workshop ---------- */
  .workshop{
    max-width:1240px;
    margin:0 auto;
    padding:0 clamp(20px, 4vw, 56px);
  }
  .panels{
    display:grid;
    grid-template-columns:minmax(300px, 380px) 1fr;
    gap:28px;
    min-height:60vh;
  }
  @media (max-width: 860px){
    .panels{ grid-template-columns:1fr; }
  }
  .panel-left{
    padding:32px 24px;
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:var(--radius-lg);
    box-shadow:var(--shadow-sm);
    align-self:start;
  }
  .panel-right{
    padding:32px 0;
    display:flex;
    flex-direction:column;
    gap:14px;
    min-width:0;
  }
  @media (max-width: 860px){
    .panel-left{ padding:24px 20px; }
    .panel-right{ padding:4px 0; }
  }

  .section-label{
    font-size:12px;
    font-weight:600;
    letter-spacing:.02em;
    color:var(--faint);
    text-transform:uppercase;
    margin:0 0 14px;
  }

  .field{ margin-bottom:20px; }
  .field label{
    display:block;
    font-size:13px;
    font-weight:600;
    color:var(--ink);
    margin-bottom:7px;
  }
  .subdomain-row{
    display:flex;
    align-items:stretch;
    border:1px solid var(--line-strong);
    border-radius:var(--radius-sm);
    background:var(--paper);
    overflow:hidden;
    transition:border-color .15s ease, box-shadow .15s ease;
  }
  .subdomain-row:focus-within{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); background:var(--surface); }
  .subdomain-row .prefix{
    display:flex;
    align-items:center;
    padding:0 12px;
    color:var(--muted);
    font-family:'JetBrains Mono', monospace;
    font-size:13px;
    background:var(--paper-strong);
    border-right:1px solid var(--line-strong);
    white-space:nowrap;
  }
  .subdomain-row input{
    flex:1;
    min-width:0;
    background:transparent;
    border:none;
    color:var(--ink);
    font-family:'JetBrains Mono', monospace;
    font-size:14px;
    padding:12px 12px;
    outline:none;
  }
  .field input[type="text"], .field input[type="password"], .field select{
    width:100%;
    background:var(--surface);
    border:1px solid var(--line-strong);
    border-radius:var(--radius-sm);
    color:var(--ink);
    font-family:'Inter', sans-serif;
    font-size:14px;
    padding:12px 12px;
    outline:none;
    transition:border-color .15s ease, box-shadow .15s ease;
  }
  .field select{ cursor:pointer; }
  .field input:focus, .field select:focus{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
  .hint{
    font-size:12.5px;
    color:var(--muted);
    margin-top:7px;
    min-height:16px;
  }
  .hint.ok{ color:var(--ok); }
  .hint.err{ color:var(--danger); }

  .btn{
    font-family:'Inter', sans-serif;
    font-weight:600;
    font-size:14px;
    padding:12px 18px;
    border-radius:var(--radius-sm);
    cursor:pointer;
    border:1px solid var(--line-strong);
    background:var(--surface);
    color:var(--ink);
    transition:transform .12s ease, border-color .15s ease, background .15s ease;
  }
  .btn:hover{ border-color:var(--faint); transform:translateY(-1px); }
  .btn:active{ transform:translateY(0); }
  .btn-primary{
    width:100%;
    background:var(--gradient);
    color:#fff;
    border:none;
    font-family:'Space Grotesk', sans-serif;
    font-weight:600;
    font-size:15px;
    padding:14px 18px;
    margin-top:4px;
    box-shadow:0 10px 24px -10px rgba(109,76,247,0.55);
  }
  .btn-primary:hover{ filter:brightness(1.05); transform:translateY(-1px); }
  .btn-primary:disabled{ background:var(--line-strong); color:var(--faint); cursor:not-allowed; box-shadow:none; transform:none; }
  .btn-danger{ border-color:var(--danger); color:var(--danger); }
  .btn-danger:hover{ background:var(--danger-soft); }
  .btn-row{ display:flex; gap:8px; margin-top:4px; }
  .btn-row .btn{ flex:1; }
  .btn-ghost{ border-color:transparent; background:transparent; padding:8px 10px; font-size:13px; color:var(--muted); }
  .btn-ghost:hover{ color:var(--ink); border-color:var(--line-strong); transform:none; }

  .result{
    margin-top:16px;
    padding:14px;
    border:1px solid var(--line);
    border-radius:var(--radius-sm);
    font-size:13.5px;
    display:none;
    line-height:1.5;
  }
  .result.show{ display:block; }
  .result.ok{ border-color:var(--ok); background:var(--ok-soft); color:#0B7A4A; }
  .result.err{ border-color:var(--danger); background:var(--danger-soft); color:var(--danger); }
  .result .url-line{ display:flex; align-items:center; gap:8px; margin-top:6px; flex-wrap:wrap; }
  .result .url-line a{ font-family:'JetBrains Mono', monospace; font-weight:600; word-break:break-all; }

  .byte-meter{ margin-top:10px; }
  .byte-meter .track{ height:4px; background:var(--paper-strong); border-radius:2px; overflow:hidden; }
  .byte-meter .fill{ height:100%; background:var(--gradient); border-radius:2px; transition:width .15s ease; }
  .byte-meter.warn .fill{ background:var(--warn); }
  .byte-meter.danger .fill{ background:var(--danger); }
  .byte-meter .label{ font-size:11.5px; color:var(--faint); margin-top:5px; font-family:'JetBrains Mono', monospace; }

  .saved-sites{ margin-top:28px; }
  .saved-sites .chip{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    padding:9px 10px;
    border:1px solid var(--line);
    border-radius:var(--radius-sm);
    margin-bottom:6px;
    font-size:13px;
    background:var(--surface);
  }
  .saved-sites .chip .chip-name{
    font-family:'JetBrains Mono', monospace;
    font-weight:600;
    cursor:pointer;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .saved-sites .chip .chip-name:hover{ color:var(--accent); }
  .saved-sites .chip button{
    background:none; border:none; color:var(--faint); cursor:pointer; font-size:15px; line-height:1; padding:2px 4px;
  }
  .saved-sites .chip button:hover{ color:var(--danger); }
  .saved-sites .empty{ font-size:12.5px; color:var(--faint); }

  /* ---------- editor ---------- */
  .editor-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    font-size:13px;
    color:var(--muted);
    gap:12px;
    flex-wrap:wrap;
  }
  .editor-header .filename{ font-family:'JetBrains Mono', monospace; }
  .editor-header .tabs{ display:flex; gap:2px; background:var(--paper); padding:3px; border-radius:var(--radius-sm); border:1px solid var(--line); }
  .editor-header .tab{
    padding:6px 13px;
    cursor:pointer;
    border-radius:6px;
    color:var(--muted);
    font-size:12.5px;
    font-weight:600;
  }
  .editor-header .tab.active{ color:var(--ink); background:var(--surface); box-shadow:var(--shadow-sm); }

  textarea#htmlInput, textarea#manageHtmlInput{
    flex:1;
    min-height:320px;
    width:100%;
    background:#15121F;
    color:#EDEBFA;
    border:1px solid var(--line-strong);
    border-radius:var(--radius-md);
    font-family:'JetBrains Mono', monospace;
    font-size:13px;
    line-height:1.65;
    padding:16px;
    resize:vertical;
    outline:none;
  }
  textarea#htmlInput:focus, textarea#manageHtmlInput:focus{ border-color:var(--accent); }

  .preview-wrap{
    flex:1;
    min-height:320px;
    border:1px solid var(--line-strong);
    border-radius:var(--radius-md);
    background:#fff;
    overflow:hidden;
    box-shadow:var(--shadow-sm);
  }
  .preview-wrap iframe{
    width:100%;
    height:100%;
    min-height:320px;
    border:none;
    display:block;
  }

  /* ---------- manage tab ---------- */
  #panel-manage, #panel-explore{ display:none; padding:36px 0; }
  #panel-manage.active, #panel-explore.active{ display:block; }
  #panel-create{ display:block; }
  #panel-create.hidden, #panel-manage:not(.active), #panel-explore:not(.active){ display:none; }

  .manage-grid{
    display:grid;
    grid-template-columns:minmax(300px, 380px) 1fr;
    gap:28px;
  }
  @media (max-width: 860px){ .manage-grid{ grid-template-columns:1fr; } }
  .manage-left{
    padding:32px 24px;
    background:var(--surface);
    border:1px solid var(--line);
    border-radius:var(--radius-lg);
    box-shadow:var(--shadow-sm);
    align-self:start;
  }
  .manage-right{ display:flex; flex-direction:column; gap:14px; }
  @media (max-width: 860px){
    .manage-left{ padding:24px 20px; margin-bottom:24px; }
  }
  .manage-editor{ display:none; flex-direction:column; gap:14px; }
  .manage-editor.show{ display:flex; }
  .manage-empty{
    color:var(--faint);
    font-size:13.5px;
    border:1px dashed var(--line-strong);
    border-radius:var(--radius-md);
    padding:40px 20px;
    text-align:center;
    background:var(--surface);
  }

  /* ---------- explore ---------- */
  .explore-list{ display:flex; flex-direction:column; gap:0; border:1px solid var(--line); border-radius:var(--radius-lg); overflow:hidden; background:var(--surface); box-shadow:var(--shadow-sm); }
  .explore-row{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    padding:16px 18px;
    border-bottom:1px solid var(--line);
    flex-wrap:wrap;
    transition:background .12s ease;
  }
  .explore-row:hover{ background:var(--paper); }
  .explore-row:last-child{ border-bottom:none; }
  .explore-row .meta{ min-width:0; }
  .explore-row .title{ font-weight:600; font-size:14px; margin-bottom:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .explore-row .sub{ font-family:'JetBrains Mono', monospace; font-size:12.5px; color:var(--accent); }
  .explore-row .date{ font-size:11.5px; color:var(--faint); margin-left:8px; }
  .explore-empty, .explore-loading{ padding:48px 16px; text-align:center; color:var(--faint); font-size:13.5px; border:1px solid var(--line); border-radius:var(--radius-lg); background:var(--surface); }

  footer{
    max-width:1240px;
    margin:0 auto;
    padding:24px clamp(20px, 4vw, 56px) 48px;
    color:var(--faint);
    font-size:12px;
    border-top:1px solid var(--line);
    line-height:1.6;
    margin-top:24px;
  }

  .toast-wrap{
    position:fixed;
    bottom:20px;
    right:20px;
    display:flex;
    flex-direction:column;
    gap:8px;
    z-index:80;
  }
  .toast{
    background:var(--ink);
    color:#fff;
    padding:12px 16px;
    border-radius:var(--radius-sm);
    font-size:13.5px;
    box-shadow:0 12px 30px rgba(21,18,31,0.25);
    max-width:320px;
    animation:toast-in .18s ease;
  }
  .toast.err{ background:var(--danger); }
  .toast.ok{ background:var(--ok); }
  @keyframes toast-in{ from{ opacity:0; transform:translateY(6px);} to{ opacity:1; transform:translateY(0);} }

  /* ---------- view mode (rendering a published site by hash) ---------- */
  #viewMode{
    display:none;
    position:fixed;
    inset:0;
    background:#fff;
    z-index:100;
    flex-direction:column;
  }
  #viewMode.active{ display:flex; }
  .view-bar{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px 14px;
    background:var(--ink);
    color:#fff;
  }
  .view-bar .back{
    display:flex;
    align-items:center;
    gap:7px;
    background:rgba(255,255,255,0.08);
    border:1px solid rgba(255,255,255,0.14);
    color:#fff;
    font-family:'Inter', sans-serif;
    font-weight:600;
    font-size:13px;
    padding:7px 13px;
    border-radius:999px;
    cursor:pointer;
    text-decoration:none;
  }
  .view-bar .back:hover{ background:rgba(255,255,255,0.16); }
  .view-bar .view-url{
    font-family:'JetBrains Mono', monospace;
    font-size:12.5px;
    color:rgba(255,255,255,0.7);
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .view-frame-wrap{ flex:1; min-height:0; }
  .view-frame-wrap iframe{ width:100%; height:100%; border:none; display:block; background:#fff; }
  .view-status{
    flex:1;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px;
  }
  .view-status .box{ max-width:440px; text-align:center; }
  .view-status .code{
    font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--faint);
    letter-spacing:.04em; margin-bottom:14px;
  }
  .view-status h1{ font-family:'Space Grotesk',sans-serif; font-size:24px; margin:0 0 12px; line-height:1.3; }
  .view-status h1 span{ color:var(--accent); font-family:'JetBrains Mono',monospace; font-size:19px; }
  .view-status p{ color:var(--muted); font-size:14.5px; line-height:1.6; margin:0 0 24px; }
</style>
</head>
<body>

  <div id="app">

  <div class="topbar">
    <div class="wordmark"><span class="dot"></span>flex<span>ozy</span></div>
    <div class="nav-tabs" role="tablist">
      <button class="nav-tab active" data-tab="create">สร้างเว็บใหม่</button>
      <button class="nav-tab" data-tab="manage">จัดการเว็บของฉัน</button>
      <button class="nav-tab" data-tab="explore">สำรวจเว็บ</button>
    </div>
  </div>

  <div class="hero">
    <div>
      <div class="eyebrow">● ออนไลน์ทันที ไม่ต้องมี server</div>
      <h1>เขียน HTML ของคุณ ตั้งชื่อ แล้วเผยแพร่ทันที</h1>
      <p>วางโค้ด HTML ของคุณ เลือกชื่อ แล้วเว็บของคุณจะออนไลน์ทันทีที่ ${rootDomain}/#ชื่อของคุณ — ไม่ต้องผูกโดเมนเอง ไม่ต้องตั้งค่าอะไรเพิ่ม</p>
    </div>
    <div class="addressbar">
      <div class="chrome"><i></i><i></i><i></i></div>
      <div class="url-row">
        <span class="lock">🔒</span>
        <span class="url-text"><span class="rest">${rootDomain}/#</span><span class="name" id="heroName">yourname</span></span>
      </div>
      <div class="preview-strip">
        <div class="bar w1"></div>
        <div class="bar w2"></div>
        <div class="bar w3"></div>
      </div>
    </div>
  </div>

  <div class="workshop">

    <!-- ============ CREATE ============ -->
    <div id="panel-create">
      <div class="panels">
        <div class="panel-left">

          <div class="field">
            <label for="subdomainInput">ที่อยู่เว็บของคุณ</label>
            <div class="subdomain-row">
              <span class="prefix">${rootDomain}/#</span>
              <input id="subdomainInput" type="text" placeholder="yourname" autocomplete="off" spellcheck="false" />
            </div>
            <div id="subdomainHint" class="hint"></div>
          </div>

          <div class="field">
            <label for="titleInput">ชื่อหน้าเว็บ (title)</label>
            <input id="titleInput" type="text" placeholder="เช่น My Portfolio" />
          </div>

          <div class="field">
            <label for="templatePicker">เริ่มจากเทมเพลต (ไม่บังคับ)</label>
            <select id="templatePicker">
              <option value="">ว่างเปล่า — เขียนเอง</option>
              <option value="portfolio">พอร์ตโฟลิโอส่วนตัว</option>
              <option value="linkbio">ลิงก์รวม (Link in bio)</option>
              <option value="resume">เรซูเม่ / CV</option>
              <option value="soon">Coming soon</option>
            </select>
          </div>

          <div class="field">
            <label for="editKeyInput">รหัสแก้ไข (edit key)</label>
            <input id="editKeyInput" type="password" placeholder="ตั้งไว้เพื่อกลับมาแก้ไขทีหลัง" autocomplete="off" />
            <div class="hint">เก็บรหัสนี้ไว้ — ต้องใช้ตอนอัปเดตหรือลบเว็บทีหลังในแท็บ "จัดการเว็บของฉัน"</div>
          </div>

          <button id="publishBtn" class="btn-primary">เผยแพร่เว็บ</button>

          <div id="result" class="result"></div>

          <div class="saved-sites">
            <div class="section-label">เว็บที่คุณเคยสร้างในเบราว์เซอร์นี้</div>
            <div id="savedList"></div>
          </div>
        </div>

        <div class="panel-right">
          <div class="editor-header">
            <span class="filename">index.html</span>
            <div class="tabs">
              <div class="tab active" data-view="code">โค้ด</div>
              <div class="tab" data-view="preview">พรีวิว</div>
            </div>
          </div>

          <textarea id="htmlInput" spellcheck="false">&lt;!DOCTYPE html&gt;
&lt;html lang="th"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8"&gt;
  &lt;title&gt;My Page&lt;/title&gt;
&lt;/head&gt;
&lt;body style="font-family:sans-serif; padding:40px;"&gt;
  &lt;h1&gt;สวัสดี ฉันชื่อ...&lt;/h1&gt;
  &lt;p&gt;นี่คือเว็บของฉันบน ${rootDomain}&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;</textarea>

          <div id="previewWrap" class="preview-wrap" style="display:none;">
            <iframe id="previewFrame" sandbox="allow-scripts"></iframe>
          </div>

          <div id="byteMeter" class="byte-meter">
            <div class="track"><div id="byteFill" class="fill" style="width:0%"></div></div>
            <div id="byteLabel" class="label">0 KB / 500 KB</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ MANAGE ============ -->
    <div id="panel-manage">
      <div class="manage-grid">
        <div class="manage-left">
          <div class="section-label">โหลดเว็บที่มีอยู่</div>

          <div class="field">
            <label for="manageSubdomain">ชื่อเว็บ</label>
            <div class="subdomain-row">
              <span class="prefix">${rootDomain}/#</span>
              <input id="manageSubdomain" type="text" placeholder="yourname" autocomplete="off" spellcheck="false" />
            </div>
          </div>

          <div class="field">
            <label for="manageEditKey">รหัสแก้ไข (edit key)</label>
            <input id="manageEditKey" type="password" placeholder="รหัสที่ตั้งไว้ตอนสร้างเว็บ" autocomplete="off" />
          </div>

          <button id="loadBtn" class="btn" style="width:100%;">โหลดเว็บ</button>
          <div id="loadResult" class="result"></div>

          <div class="saved-sites">
            <div class="section-label">เลือกจากเว็บที่บันทึกไว้</div>
            <div id="savedListManage"></div>
          </div>
        </div>

        <div class="manage-right">
          <div id="manageEmpty" class="manage-empty">กรอกชื่อเว็บและรหัสแก้ไข แล้วกด "โหลดเว็บ" เพื่อเริ่มแก้ไข</div>

          <div id="manageEditor" class="manage-editor">
            <div class="field" style="margin-bottom:0;">
              <label for="manageTitleInput">ชื่อหน้าเว็บ (title)</label>
              <input id="manageTitleInput" type="text" placeholder="เช่น My Portfolio" />
            </div>

            <div class="editor-header">
              <span class="filename">index.html</span>
              <div class="tabs">
                <div class="tab active" data-view="code" data-target="manage">โค้ด</div>
                <div class="tab" data-view="preview" data-target="manage">พรีวิว</div>
              </div>
            </div>

            <textarea id="manageHtmlInput" spellcheck="false"></textarea>
            <div id="managePreviewWrap" class="preview-wrap" style="display:none;">
              <iframe id="managePreviewFrame" sandbox="allow-scripts"></iframe>
            </div>

            <div class="btn-row">
              <button id="saveBtn" class="btn btn-primary" style="margin-top:0;">บันทึกการแก้ไข</button>
              <button id="openBtn" class="btn">เปิดเว็บ</button>
              <button id="copyBtn" class="btn">คัดลอกลิงก์</button>
            </div>
            <button id="deleteBtn" class="btn btn-danger" style="width:100%;">ลบเว็บนี้ถาวร</button>
            <div id="manageActionResult" class="result"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ EXPLORE ============ -->
    <div id="panel-explore">
      <div class="section-label">เว็บที่เผยแพร่แล้วบน ${rootDomain}</div>
      <div id="exploreContent" class="explore-loading">กำลังโหลด...</div>
    </div>

  </div>

  <footer>
    เว็บที่คุณเผยแพร่จะรันโค้ด HTML/JS ที่คุณวางไว้โดยตรง — อย่าวางข้อมูลลับหรือโค้ดที่ไม่ไว้ใจ ·
    "เว็บที่เคยสร้าง" ถูกจดจำไว้ในเบราว์เซอร์นี้เท่านั้น เพื่อความสะดวกในการกลับมาแก้ไข ไม่ได้ส่งขึ้นเซิร์ฟเวอร์
  </footer>

  </div><!-- /#app -->

  <!-- ============ VIEW MODE (flexozy.xyz/#ชื่อ) ============ -->
  <div id="viewMode">
    <div class="view-bar">
      <a href="#" id="viewBack" class="back">← flexozy.xyz</a>
      <span class="view-url" id="viewUrl"></span>
    </div>
    <div id="viewBody" style="flex:1; min-height:0; display:flex; flex-direction:column;"></div>
  </div>

  <div class="toast-wrap" id="toastWrap"></div>

<script>
  var ROOT_DOMAIN = "${rootDomain}";
  var STORAGE_KEY = "flexozy_sites_v1";

  /* ---------------- toast ---------------- */
  function showToast(msg, kind){
    var wrap = document.getElementById('toastWrap');
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function(){ t.remove(); }, 3200);
  }

  /* ---------------- local saved sites ---------------- */
  function getSavedSites(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function setSavedSites(list){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function upsertSavedSite(entry){
    var list = getSavedSites();
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].subdomain === entry.subdomain) { idx = i; break; } }
    if (idx >= 0) { list[idx] = entry; } else { list.unshift(entry); }
    setSavedSites(list);
    renderSavedSites();
  }
  function removeSavedSite(subdomain){
    var list = getSavedSites().filter(function(s){ return s.subdomain !== subdomain; });
    setSavedSites(list);
    renderSavedSites();
  }
  function renderSavedSites(){
    var list = getSavedSites();
    var targets = [
      { el: document.getElementById('savedList'), fill: 'create' },
      { el: document.getElementById('savedListManage'), fill: 'manage' }
    ];
    targets.forEach(function(t){
      if (!t.el) return;
      t.el.innerHTML = '';
      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'ยังไม่มีเว็บที่บันทึกไว้ — เผยแพร่เว็บแรกของคุณสิ';
        t.el.appendChild(empty);
        return;
      }
      list.forEach(function(site){
        var chip = document.createElement('div');
        chip.className = 'chip';
        var name = document.createElement('span');
        name.className = 'chip-name';
        name.textContent = ROOT_DOMAIN + '/#' + site.subdomain;
        name.title = 'คลิกเพื่อใช้ในฟอร์ม' + (t.fill === 'manage' ? '' : 'จัดการเว็บ');
        name.addEventListener('click', function(){
          if (t.fill === 'manage') {
            document.getElementById('manageSubdomain').value = site.subdomain;
            document.getElementById('manageEditKey').value = site.editKey || '';
          } else {
            switchTab('manage');
            document.getElementById('manageSubdomain').value = site.subdomain;
            document.getElementById('manageEditKey').value = site.editKey || '';
          }
        });
        var del = document.createElement('button');
        del.type = 'button';
        del.setAttribute('aria-label', 'ลืมเว็บนี้');
        del.textContent = '✕';
        del.addEventListener('click', function(){
          if (confirm('ลืมเว็บนี้จากเบราว์เซอร์นี้? (จะไม่ลบเว็บจริงบนเซิร์ฟเวอร์)')) {
            removeSavedSite(site.subdomain);
          }
        });
        chip.appendChild(name);
        chip.appendChild(del);
        t.el.appendChild(chip);
      });
    });
  }

  /* ---------------- tabs (top nav) ---------------- */
  var navTabs = document.querySelectorAll('.nav-tab');
  var panels = {
    create: document.getElementById('panel-create'),
    manage: document.getElementById('panel-manage'),
    explore: document.getElementById('panel-explore')
  };
  var exploreLoaded = false;
  function switchTab(name){
    navTabs.forEach(function(b){ b.classList.toggle('active', b.dataset.tab === name); });
    Object.keys(panels).forEach(function(k){
      panels[k].classList.toggle('active', k === name);
      if (k === 'create') panels[k].style.display = (name === 'create') ? 'block' : 'none';
    });
    if (name === 'explore' && !exploreLoaded) loadExplore();
  }
  navTabs.forEach(function(b){
    b.addEventListener('click', function(){ switchTab(b.dataset.tab); });
  });

  /* ---------------- hero address bar echo ---------------- */
  var heroName = document.getElementById('heroName');

  /* ---------------- subdomain availability check (create) ---------------- */
  var subdomainInput = document.getElementById('subdomainInput');
  var subdomainHint = document.getElementById('subdomainHint');
  var titleInput = document.getElementById('titleInput');
  var editKeyInput = document.getElementById('editKeyInput');
  var htmlInput = document.getElementById('htmlInput');
  var publishBtn = document.getElementById('publishBtn');
  var result = document.getElementById('result');
  var templatePicker = document.getElementById('templatePicker');

  var checkTimer = null;
  subdomainInput.addEventListener('input', function(){
    subdomainInput.value = subdomainInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    heroName.textContent = subdomainInput.value || 'yourname';
    clearTimeout(checkTimer);
    var name = subdomainInput.value.trim();
    if (!name) { subdomainHint.textContent = ''; subdomainHint.className = 'hint'; return; }
    if (name.length < 3) { subdomainHint.textContent = 'ต้องยาวอย่างน้อย 3 ตัวอักษร'; subdomainHint.className = 'hint err'; return; }
    subdomainHint.textContent = 'กำลังตรวจสอบ...';
    subdomainHint.className = 'hint';
    checkTimer = setTimeout(function(){
      fetch('/api/check/' + encodeURIComponent(name))
        .then(function(res){ return res.json(); })
        .then(function(data){
          if (data.available) {
            subdomainHint.textContent = 'ใช้ชื่อนี้ได้ → ' + ROOT_DOMAIN + '/#' + name;
            subdomainHint.className = 'hint ok';
          } else {
            subdomainHint.textContent = data.reason || 'ชื่อนี้ใช้ไม่ได้';
            subdomainHint.className = 'hint err';
          }
        })
        .catch(function(){
          subdomainHint.textContent = 'ตรวจสอบไม่สำเร็จ ลองใหม่อีกครั้ง';
          subdomainHint.className = 'hint err';
        });
    }, 400);
  });

  /* ---------------- code/preview toggle ---------------- */
  function wireEditorTabs(scopeSelector, codeEl, previewWrapEl, previewFrameEl){
    var tabs = document.querySelectorAll(scopeSelector);
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        tabs.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        if (tab.dataset.view === 'preview') {
          codeEl.style.display = 'none';
          previewWrapEl.style.display = 'block';
          previewFrameEl.srcdoc = codeEl.value;
        } else {
          codeEl.style.display = 'block';
          previewWrapEl.style.display = 'none';
        }
      });
    });
  }
  wireEditorTabs(
    '.editor-header .tab[data-view]:not([data-target])',
    htmlInput,
    document.getElementById('previewWrap'),
    document.getElementById('previewFrame')
  );

  /* ---------------- byte meter ---------------- */
  var MAX_BYTES = 500 * 1024;
  var byteFill = document.getElementById('byteFill');
  var byteLabel = document.getElementById('byteLabel');
  var byteMeter = document.getElementById('byteMeter');
  function updateByteMeter(){
    var bytes = new TextEncoder().encode(htmlInput.value).length;
    var pct = Math.min(100, (bytes / MAX_BYTES) * 100);
    byteFill.style.width = pct + '%';
    byteLabel.textContent = (bytes / 1024).toFixed(1) + ' KB / ' + (MAX_BYTES / 1024) + ' KB';
    byteMeter.classList.toggle('warn', pct >= 70 && pct < 95);
    byteMeter.classList.toggle('danger', pct >= 95);
  }
  htmlInput.addEventListener('input', updateByteMeter);
  updateByteMeter();

  /* ---------------- templates ---------------- */
  var TPL_PORTFOLIO =
    '<!DOCTYPE html>\\n' +
    '<html lang="th">\\n' +
    '<head>\\n' +
    '<meta charset="UTF-8">\\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
    '<title>ชื่อของคุณ — พอร์ตโฟลิโอ</title>\\n' +
    '<style>\\n' +
    '  body{margin:0;font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#fff;color:#14181F;}\\n' +
    '  header{padding:64px 24px 32px;max-width:720px;margin:0 auto;}\\n' +
    '  h1{font-size:34px;margin:0 0 8px;}\\n' +
    '  .role{color:#6B7280;font-size:16px;margin:0;}\\n' +
    '  section{max-width:720px;margin:0 auto;padding:24px;}\\n' +
    '  h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#9AA1AC;margin:0 0 14px;}\\n' +
    '  .card{border:1px solid #E4E4DE;border-radius:6px;padding:18px;margin-bottom:12px;}\\n' +
    '  .card h3{margin:0 0 6px;font-size:16px;}\\n' +
    '  .card p{margin:0;color:#6B7280;font-size:14px;line-height:1.6;}\\n' +
    '  footer{max-width:720px;margin:0 auto;padding:24px;color:#9AA1AC;font-size:13px;}\\n' +
    '  a{color:#1E3AF5;}\\n' +
    '</style>\\n' +
    '</head>\\n' +
    '<body>\\n' +
    '  <header>\\n' +
    '    <h1>ชื่อของคุณ</h1>\\n' +
    '    <p class="role">นักออกแบบ / นักพัฒนา / ตำแหน่งของคุณ</p>\\n' +
    '  </header>\\n' +
    '  <section>\\n' +
    '    <h2>เกี่ยวกับ</h2>\\n' +
    '    <p style="color:#374151;line-height:1.7;">เขียนแนะนำตัวสั้น ๆ ว่าคุณทำอะไร ถนัดด้านไหน และสนใจงานแบบไหน</p>\\n' +
    '  </section>\\n' +
    '  <section>\\n' +
    '    <h2>ผลงาน</h2>\\n' +
    '    <div class="card"><h3>ชื่อผลงานที่ 1</h3><p>คำอธิบายสั้น ๆ เกี่ยวกับผลงานนี้</p></div>\\n' +
    '    <div class="card"><h3>ชื่อผลงานที่ 2</h3><p>คำอธิบายสั้น ๆ เกี่ยวกับผลงานนี้</p></div>\\n' +
    '  </section>\\n' +
    '  <footer>ติดต่อ: your@email.com</footer>\\n' +
    '</body>\\n' +
    '</html>';

  var TPL_LINKBIO =
    '<!DOCTYPE html>\\n' +
    '<html lang="th">\\n' +
    '<head>\\n' +
    '<meta charset="UTF-8">\\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
    '<title>ลิงก์ของฉัน</title>\\n' +
    '<style>\\n' +
    '  body{margin:0;font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#F7F7F3;color:#14181F;min-height:100vh;}\\n' +
    '  .wrap{max-width:420px;margin:0 auto;padding:56px 20px;text-align:center;}\\n' +
    '  .avatar{width:84px;height:84px;border-radius:50%;background:#1E3AF5;margin:0 auto 16px;}\\n' +
    '  h1{font-size:20px;margin:0 0 4px;}\\n' +
    '  p{color:#6B7280;font-size:14px;margin:0 0 28px;}\\n' +
    '  a.link{display:block;background:#fff;border:1px solid #E4E4DE;border-radius:8px;padding:16px;margin-bottom:12px;color:#14181F;text-decoration:none;font-weight:600;font-size:14.5px;}\\n' +
    '  a.link:hover{border-color:#1E3AF5;}\\n' +
    '</style>\\n' +
    '</head>\\n' +
    '<body>\\n' +
    '  <div class="wrap">\\n' +
    '    <div class="avatar"></div>\\n' +
    '    <h1>@ชื่อของคุณ</h1>\\n' +
    '    <p>คำอธิบายสั้น ๆ เกี่ยวกับคุณ</p>\\n' +
    '    <a class="link" href="#">Instagram</a>\\n' +
    '    <a class="link" href="#">TikTok</a>\\n' +
    '    <a class="link" href="#">ร้านค้าออนไลน์</a>\\n' +
    '    <a class="link" href="#">ติดต่องาน</a>\\n' +
    '  </div>\\n' +
    '</body>\\n' +
    '</html>';

  var TPL_RESUME =
    '<!DOCTYPE html>\\n' +
    '<html lang="th">\\n' +
    '<head>\\n' +
    '<meta charset="UTF-8">\\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
    '<title>เรซูเม่ — ชื่อของคุณ</title>\\n' +
    '<style>\\n' +
    '  body{margin:0;font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#fff;color:#14181F;}\\n' +
    '  .wrap{max-width:680px;margin:0 auto;padding:56px 24px;}\\n' +
    '  h1{font-size:28px;margin:0 0 4px;}\\n' +
    '  .contact{color:#6B7280;font-size:13.5px;margin:0 0 32px;}\\n' +
    '  h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#1E3AF5;border-bottom:1px solid #E4E4DE;padding-bottom:6px;margin:28px 0 14px;}\\n' +
    '  .item{margin-bottom:14px;}\\n' +
    '  .item .top{display:flex;justify-content:space-between;font-weight:600;font-size:14.5px;}\\n' +
    '  .item .top span{color:#9AA1AC;font-weight:400;font-size:13px;}\\n' +
    '  .item p{margin:4px 0 0;color:#6B7280;font-size:13.5px;line-height:1.6;}\\n' +
    '  ul{margin:8px 0 0;padding-left:18px;color:#6B7280;font-size:13.5px;line-height:1.7;}\\n' +
    '</style>\\n' +
    '</head>\\n' +
    '<body>\\n' +
    '  <div class="wrap">\\n' +
    '    <h1>ชื่อของคุณ</h1>\\n' +
    '    <p class="contact">your@email.com &middot; 08x-xxx-xxxx &middot; เมืองที่คุณอยู่</p>\\n' +
    '    <h2>ประสบการณ์ทำงาน</h2>\\n' +
    '    <div class="item">\\n' +
    '      <div class="top">ตำแหน่งงาน — ชื่อบริษัท <span>2023 — ปัจจุบัน</span></div>\\n' +
    '      <p>สรุปหน้าที่ความรับผิดชอบและผลงานที่ภูมิใจสั้น ๆ</p>\\n' +
    '    </div>\\n' +
    '    <h2>การศึกษา</h2>\\n' +
    '    <div class="item">\\n' +
    '      <div class="top">ชื่อสถาบัน <span>ปีที่จบ</span></div>\\n' +
    '      <p>คณะ / สาขาที่เรียน</p>\\n' +
    '    </div>\\n' +
    '    <h2>ทักษะ</h2>\\n' +
    '    <ul><li>ทักษะที่ 1</li><li>ทักษะที่ 2</li><li>ทักษะที่ 3</li></ul>\\n' +
    '  </div>\\n' +
    '</body>\\n' +
    '</html>';

  var TPL_SOON =
    '<!DOCTYPE html>\\n' +
    '<html lang="th">\\n' +
    '<head>\\n' +
    '<meta charset="UTF-8">\\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\\n' +
    '<title>เร็ว ๆ นี้</title>\\n' +
    '<style>\\n' +
    '  body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,Segoe UI,Inter,sans-serif;background:#14181F;color:#fff;text-align:center;}\\n' +
    '  h1{font-size:clamp(28px,6vw,48px);margin:0 0 12px;}\\n' +
    '  p{color:#9AA1AC;font-size:15px;margin:0;}\\n' +
    '</style>\\n' +
    '</head>\\n' +
    '<body>\\n' +
    '  <div>\\n' +
    '    <h1>เร็ว ๆ นี้</h1>\\n' +
    '    <p>เว็บนี้กำลังจะมา — กลับมาดูใหม่เร็ว ๆ นี้</p>\\n' +
    '  </div>\\n' +
    '</body>\\n' +
    '</html>';

  var TEMPLATES = { portfolio: TPL_PORTFOLIO, linkbio: TPL_LINKBIO, resume: TPL_RESUME, soon: TPL_SOON };

  templatePicker.addEventListener('change', function(){
    var key = templatePicker.value;
    if (!key) return;
    var proceed = true;
    if (htmlInput.value.trim().length > 0) {
      proceed = confirm('เทมเพลตนี้จะแทนที่โค้ดปัจจุบันในช่องแก้ไข ต้องการดำเนินการต่อหรือไม่?');
    }
    if (proceed) {
      htmlInput.value = TEMPLATES[key];
      updateByteMeter();
      var codeTab = document.querySelector('.editor-header .tab[data-view="code"]:not([data-target])');
      if (codeTab) codeTab.click();
    } else {
      templatePicker.value = '';
    }
  });

  /* ---------------- publish (create) ---------------- */
  publishBtn.addEventListener('click', function(){
    var subdomain = subdomainInput.value.trim();
    var html = htmlInput.value;
    var title = titleInput.value.trim();
    var editKey = editKeyInput.value;

    if (!subdomain) { showResultErr(result, 'กรุณาตั้งชื่อเว็บ'); return; }
    if (!editKey || editKey.length < 4) { showResultErr(result, 'กรุณาตั้งรหัสแก้ไขอย่างน้อย 4 ตัวอักษร'); return; }

    publishBtn.disabled = true;
    publishBtn.textContent = 'กำลังเผยแพร่...';
    result.className = 'result show';
    result.textContent = '';

    fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain: subdomain, html: html, title: title, editKey: editKey })
    })
      .then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
      .then(function(r){
        if (!r.ok) {
          showResultErr(result, r.data.error || 'เผยแพร่ไม่สำเร็จ');
        } else {
          result.className = 'result show ok';
          result.innerHTML = (r.data.updated ? 'อัปเดตเว็บแล้ว' : 'เผยแพร่แล้ว') +
            '<div class="url-line"><a href="' + r.data.url + '" target="_blank" rel="noopener">' + r.data.url + '</a></div>';
          upsertSavedSite({ subdomain: subdomain, title: title || subdomain, editKey: editKey, url: r.data.url, savedAt: new Date().toISOString() });
          showToast('เว็บของคุณออนไลน์แล้ว', 'ok');
        }
      })
      .catch(function(){
        showResultErr(result, 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      })
      .finally(function(){
        publishBtn.disabled = false;
        publishBtn.textContent = 'เผยแพร่เว็บ';
      });
  });

  function showResultErr(el, msg){
    el.className = 'result show err';
    el.textContent = msg;
  }

  /* ---------------- manage tab ---------------- */
  var manageSubdomain = document.getElementById('manageSubdomain');
  var manageEditKey = document.getElementById('manageEditKey');
  var loadBtn = document.getElementById('loadBtn');
  var loadResult = document.getElementById('loadResult');
  var manageEmpty = document.getElementById('manageEmpty');
  var manageEditor = document.getElementById('manageEditor');
  var manageTitleInput = document.getElementById('manageTitleInput');
  var manageHtmlInput = document.getElementById('manageHtmlInput');
  var saveBtn = document.getElementById('saveBtn');
  var openBtn = document.getElementById('openBtn');
  var copyBtn = document.getElementById('copyBtn');
  var deleteBtn = document.getElementById('deleteBtn');
  var manageActionResult = document.getElementById('manageActionResult');
  var currentManageSite = null;

  manageSubdomain.addEventListener('input', function(){
    manageSubdomain.value = manageSubdomain.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  });

  wireEditorTabs(
    '.editor-header .tab[data-target="manage"]',
    manageHtmlInput,
    document.getElementById('managePreviewWrap'),
    document.getElementById('managePreviewFrame')
  );

  function extractTitle(html){
    var m = html.match(/<title[^>]*>([^<]*)<\\/title>/i);
    return m ? m[1].trim() : '';
  }

  loadBtn.addEventListener('click', function(){
    var subdomain = manageSubdomain.value.trim();
    if (!subdomain) { showResultErr(loadResult, 'กรุณากรอกชื่อเว็บ'); return; }
    loadBtn.disabled = true;
    loadBtn.textContent = 'กำลังโหลด...';
    loadResult.className = 'result';

    fetch('/api/render/' + encodeURIComponent(subdomain), { headers: { 'X-Flexozy-Manage': '1' } })
      .then(function(res){
        if (res.status === 404) { throw new Error('ไม่พบเว็บชื่อนี้ — ตรวจสอบชื่ออีกครั้ง'); }
        if (!res.ok) { throw new Error('โหลดไม่สำเร็จ ลองใหม่อีกครั้ง'); }
        return res.text();
      })
      .then(function(html){
        currentManageSite = subdomain;
        manageHtmlInput.value = html;
        manageTitleInput.value = extractTitle(html) || subdomain;
        manageEmpty.style.display = 'none';
        manageEditor.classList.add('show');
        loadResult.className = 'result';
        var codeTab = document.querySelector('.editor-header .tab[data-target="manage"][data-view="code"]');
        if (codeTab) codeTab.click();
      })
      .catch(function(err){
        currentManageSite = null;
        manageEditor.classList.remove('show');
        manageEmpty.style.display = 'block';
        showResultErr(loadResult, err.message || 'โหลดไม่สำเร็จ');
      })
      .finally(function(){
        loadBtn.disabled = false;
        loadBtn.textContent = 'โหลดเว็บ';
      });
  });

  saveBtn.addEventListener('click', function(){
    if (!currentManageSite) return;
    var editKey = manageEditKey.value;
    if (!editKey) { showResultErr(manageActionResult, 'กรุณากรอกรหัสแก้ไข'); return; }
    saveBtn.disabled = true;
    saveBtn.textContent = 'กำลังบันทึก...';

    fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subdomain: currentManageSite,
        html: manageHtmlInput.value,
        title: manageTitleInput.value.trim(),
        editKey: editKey
      })
    })
      .then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
      .then(function(r){
        if (!r.ok) {
          showResultErr(manageActionResult, r.data.error || 'บันทึกไม่สำเร็จ');
        } else {
          manageActionResult.className = 'result show ok';
          manageActionResult.textContent = 'บันทึกการแก้ไขแล้ว';
          upsertSavedSite({ subdomain: currentManageSite, title: manageTitleInput.value.trim() || currentManageSite, editKey: editKey, url: r.data.url, savedAt: new Date().toISOString() });
          showToast('บันทึกการแก้ไขแล้ว', 'ok');
        }
      })
      .catch(function(){ showResultErr(manageActionResult, 'เกิดข้อผิดพลาด กรุณาลองใหม่'); })
      .finally(function(){ saveBtn.disabled = false; saveBtn.textContent = 'บันทึกการแก้ไข'; });
  });

  openBtn.addEventListener('click', function(){
    if (!currentManageSite) return;
    window.open('https://' + ROOT_DOMAIN + '/#' + currentManageSite, '_blank', 'noopener');
  });

  copyBtn.addEventListener('click', function(){
    if (!currentManageSite) return;
    var url = 'https://' + ROOT_DOMAIN + '/#' + currentManageSite;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function(){ showToast('คัดลอกลิงก์แล้ว', 'ok'); });
    } else {
      showToast(url);
    }
  });

  deleteBtn.addEventListener('click', function(){
    if (!currentManageSite) return;
    var editKey = manageEditKey.value;
    if (!editKey) { showResultErr(manageActionResult, 'กรุณากรอกรหัสแก้ไข'); return; }
    if (!confirm('ลบเว็บ "' + ROOT_DOMAIN + '/#' + currentManageSite + '" ถาวร? การกระทำนี้ย้อนกลับไม่ได้')) return;

    deleteBtn.disabled = true;
    deleteBtn.textContent = 'กำลังลบ...';

    fetch('/api/sites/' + encodeURIComponent(currentManageSite), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editKey: editKey })
    })
      .then(function(res){ return res.json().then(function(data){ return { ok: res.ok, data: data }; }); })
      .then(function(r){
        if (!r.ok) {
          showResultErr(manageActionResult, r.data.error || 'ลบไม่สำเร็จ');
        } else {
          removeSavedSite(currentManageSite);
          showToast('ลบเว็บแล้ว', 'ok');
          currentManageSite = null;
          manageEditor.classList.remove('show');
          manageEmpty.style.display = 'block';
          manageSubdomain.value = '';
          manageEditKey.value = '';
          manageActionResult.className = 'result';
        }
      })
      .catch(function(){ showResultErr(manageActionResult, 'เกิดข้อผิดพลาด กรุณาลองใหม่'); })
      .finally(function(){ deleteBtn.disabled = false; deleteBtn.textContent = 'ลบเว็บนี้ถาวร'; });
  });

  /* ---------------- explore tab ---------------- */
  function loadExplore(){
    var el = document.getElementById('exploreContent');
    el.className = 'explore-loading';
    el.textContent = 'กำลังโหลด...';
    fetch('/api/sites')
      .then(function(res){ return res.json(); })
      .then(function(list){
        exploreLoaded = true;
        if (!list || !list.length) {
          el.className = 'explore-empty';
          el.textContent = 'ยังไม่มีเว็บที่เผยแพร่ — เป็นคนแรกสิ';
          return;
        }
        list.sort(function(a, b){ return new Date(b.createdAt) - new Date(a.createdAt); });
        var box = document.createElement('div');
        box.className = 'explore-list';
        list.forEach(function(site){
          var row = document.createElement('div');
          row.className = 'explore-row';
          var meta = document.createElement('div');
          meta.className = 'meta';
          var title = document.createElement('div');
          title.className = 'title';
          title.textContent = site.title || site.subdomain;
          var sub = document.createElement('div');
          sub.className = 'sub';
          sub.textContent = ROOT_DOMAIN + '/#' + site.subdomain;
          meta.appendChild(title);
          meta.appendChild(sub);
          var right = document.createElement('div');
          var date = document.createElement('span');
          date.className = 'date';
          try { date.textContent = new Date(site.createdAt).toLocaleDateString('th-TH'); } catch (e) {}
          var open = document.createElement('a');
          open.className = 'btn btn-ghost';
          open.href = '#' + site.subdomain;
          open.textContent = 'เปิดเว็บ →';
          right.appendChild(date);
          right.appendChild(open);
          row.appendChild(meta);
          row.appendChild(right);
          box.appendChild(row);
        });
        el.replaceWith(box);
        box.id = 'exploreContent';
      })
      .catch(function(){
        el.className = 'explore-empty';
        el.textContent = 'โหลดรายชื่อเว็บไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง';
      });
  }

  /* ---------------- view mode: flexozy.xyz/#ชื่อ ---------------- */
  var appRoot = document.getElementById('app');
  var viewMode = document.getElementById('viewMode');
  var viewBody = document.getElementById('viewBody');
  var viewUrl = document.getElementById('viewUrl');
  var viewBack = document.getElementById('viewBack');
  var defaultTitle = document.title;

  function getHashName(){
    var h = window.location.hash || '';
    if (h.charAt(0) === '#') h = h.slice(1);
    try { h = decodeURIComponent(h); } catch (e) {}
    return h.trim().toLowerCase();
  }

  function statusHtml(codeText, headingHtml, bodyText, showCreateLink){
    return '' +
      '<div class="view-status"><div class="box">' +
      '<div class="code">' + codeText + '</div>' +
      '<h1>' + headingHtml + '</h1>' +
      '<p>' + bodyText + '</p>' +
      (showCreateLink ? '<a class="back" href="#" onclick="window.location.hash=\\'\\';return false;" style="background:var(--gradient);border:none;color:#fff;">สร้างเว็บของคุณเอง →</a>' : '') +
      '</div></div>';
  }

  function escapeHtmlClient(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function enterViewMode(name){
    appRoot.style.display = 'none';
    viewMode.classList.add('active');
    viewUrl.textContent = ROOT_DOMAIN + '/#' + name;
    viewBody.innerHTML = statusHtml('กำลังโหลด', 'กำลังโหลดเว็บ <span>' + escapeHtmlClient(name) + '</span>...', 'สักครู่นะ');

    fetch('/api/render/' + encodeURIComponent(name))
      .then(function(res){
        if (res.status === 404) { var e = new Error('not_found'); e.code = 404; throw e; }
        if (!res.ok) { var e2 = new Error('server_error'); e2.code = res.status; throw e2; }
        return res.text();
      })
      .then(function(html){
        var t = extractTitle(html);
        document.title = t || (name + ' — ' + ROOT_DOMAIN);
        viewBody.innerHTML = '<div class="view-frame-wrap"><iframe sandbox="allow-scripts allow-forms allow-popups allow-modals" title="' + escapeHtmlClient(t || name) + '"></iframe></div>';
        var frame = viewBody.querySelector('iframe');
        frame.srcdoc = html;
      })
      .catch(function(err){
        document.title = defaultTitle;
        if (err && err.code === 404) {
          viewBody.innerHTML = statusHtml(
            '404 — ไม่พบเว็บไซต์',
            'ยังไม่มีเว็บไซต์ชื่อ <span>' + escapeHtmlClient(name) + '</span>',
            'ชื่อนี้ยังว่างอยู่ — เป็นไปได้ว่ายังไม่มีใครสร้าง หรือเว็บนี้ถูกลบไปแล้ว',
            true
          );
        } else {
          viewBody.innerHTML = statusHtml(
            'เชื่อมต่อไม่ได้',
            'โหลดเว็บ <span>' + escapeHtmlClient(name) + '</span> ไม่สำเร็จ',
            'ลองรีเฟรชหน้าอีกครั้ง หรือกลับไปหน้าแรก',
            true
          );
        }
      });
  }

  function exitViewMode(){
    viewMode.classList.remove('active');
    appRoot.style.display = '';
    viewBody.innerHTML = '';
    document.title = defaultTitle;
  }

  viewBack.addEventListener('click', function(e){
    e.preventDefault();
    window.location.hash = '';
  });

  window.addEventListener('hashchange', function(){
    var name = getHashName();
    if (name) { enterViewMode(name); } else { exitViewMode(); }
  });

  /* ---------------- init ---------------- */
  renderSavedSites();
  var initialName = getHashName();
  if (initialName) { enterViewMode(initialName); }
</script>
</body>
</html>
`;
}
