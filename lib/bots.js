// รายชื่อ User-Agent ของ AI / crawler / เครื่องมือยิง HTTP ที่ไม่ใช่ executor — ใช้ร่วมกันทั้ง middleware และ route (ห้าม import อะไรที่เป็น Node-only)
// ไม่ใส่ okhttp / java / apache-httpclient เพราะ executor บนมือถือบางตัวอาจใช้ UA แบบนี้
export const BOT_RE = new RegExp([
  // AI
  'gptbot','chatgpt','oai-searchbot','openai','claudebot','claude-web','claude-user','claude-searchbot','anthropic',
  'perplexity','google-extended','googleother','google-cloudvertexbot','gemini','bard','copilot','cohere','mistral',
  'meta-external','meta-webindexer','facebookbot','facebookexternalhit','duckassistbot','youbot','diffbot','omgili',
  'timpibot','bytespider','bytedance','amazonbot','applebot','ccbot','imagesift','ai2bot','kagi','phind','brave',
  // search / SEO crawler
  'googlebot','bingbot','bingpreview','duckduckbot','yandex','baidu','slurp','petalbot','semrush','ahrefs','mj12bot','dotbot',
  'ia_archiver','archive\\.org','crawler','spider','scrapy','\\bbot\\b','bot/','-bot','bot;',
  // เครื่องมือ / headless
  'headless','puppeteer','playwright','selenium','phantomjs','python-requests','python-urllib','aiohttp','httpx',
  'curl','wget','libwww','go-http-client','axios','node-fetch','undici','postman','insomnia','guzzle','reqwest','lwp::',
  // เครื่องมือ HTTP / สคริปต์ / scraper เพิ่มเติม
  'python','urllib','requests','ruby','perl','php','deno','bun/','node-','nodejs','powershell','httpie','libcurl','mechanize',
  'jsdom','cheerio','htmlunit','lynx','w3m','colly','crawlee','apify','zyte','scraping','scraper','wkhtmltopdf','lighthouse',
  'prerender','feedfetcher','uptimerobot','pingdom','statuscake','site24x7',
  // สแกนเนอร์ช่องโหว่ / fuzz
  'nikto','sqlmap','nmap','masscan','zgrab','gobuster','dirbuster','ffuf','wfuzz','burp','nuclei','acunetix','nessus','openvas','wpscan','netsparker'
].join('|'), 'i');

// ===== ข้อความ 403 กลาง (ใช้ทุกจุดที่ปฏิเสธเครื่องมือเข้าถึงเว็บ) =====
export const FORBID_TEXT = 'Unable to complete\nThe server denied access to the file (HTTP 403).';
export const FORBID_HEADERS = { 'content-type':'text/plain; charset=utf-8', 'cache-control':'no-store, private', 'cdn-cache-control':'no-store', 'x-robots-tag':'noindex, nofollow, noarchive', 'x-content-type-options':'nosniff' };
export const forbidden = () => new Response(FORBID_TEXT, { status:403, headers:FORBID_HEADERS });

// พฤติกรรมไม่เหมือนเบราว์เซอร์จริง (ใช้กับ "หน้าเว็บ" และ /api ฝั่งเว็บเท่านั้น ไม่ใช้กับ executor)
// - เบราว์เซอร์จริงขึ้นต้น UA ด้วย Mozilla/ และส่ง Accept-Language เสมอ
// - Chrome (บน https) ส่ง Sec-Fetch-* ทุกคำขอ เครื่องมือที่ปลอม UA เป็น Chrome มักไม่ส่ง
export function looksAutomated(req){
  const h = req.headers, ua = h.get('user-agent')||'';
  if(!/^mozilla\//i.test(ua)) return true;
  if(!h.get('accept-language')) return true;
  if(process.env.NODE_ENV==='production' && /chrome\//i.test(ua) && !h.get('sec-fetch-mode')) return true;
  return false;
}
