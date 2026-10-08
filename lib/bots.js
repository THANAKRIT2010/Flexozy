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
  'curl','wget','libwww','go-http-client','axios','node-fetch','undici','postman','insomnia','guzzle','reqwest','lwp::'
].join('|'), 'i');
