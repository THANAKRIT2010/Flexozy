import { forbidden } from './bots';

const WINDOW_MS = 60_000;
const memory = new Map();
const thresholds = {
  '/loader': 20,
  '/bootstrap-source': 24,
  '/bootstrap-info': 60,
  '/game-script': 30,
};

function requestIp(req) {
  const h = req.headers;
  const ip = (h.get('cf-connecting-ip') || (h.get('x-forwarded-for') || '').split(',')[0] || h.get('x-real-ip') || '').trim();
  return ip || (process.env.NODE_ENV === 'production' ? '' : 'local-dev');
}

async function kvAllowed(key, limit) {
  const { kv } = await import('@vercel/kv');
  const bucket = `fx-loader-rl:${key}`;
  const count = await kv.incr(bucket);
  if (count === 1) await kv.expire(bucket, 60);
  return Number(count) <= limit;
}

function memoryAllowed(key, limit, now = Date.now()) {
  const current = memory.get(key);
  if (!current || current.until <= now) {
    memory.set(key, { count: 1, until: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  if (current.count > limit) return false;
  return true;
}

/**
 * Best-effort request throttling for public Roblox loader endpoints.
 * Configure Vercel KV for shared limits across serverless instances.
 */
export async function protectLoaderRequest(req, pathname = new URL(req.url).pathname) {
  const rule = Object.entries(thresholds).find(([prefix]) =>
    prefix === pathname || (prefix === '/game-script' && pathname.startsWith('/game-script/'))
  );
  if (!rule) return null;

  const ip = requestIp(req);
  if (!ip) return forbidden();
  const key = `${rule[0]}:${ip}`;
  let allowed;
  if (process.env.KV_REST_API_URL) {
    try {
      allowed = await kvAllowed(key, rule[1]);
    } catch (error) {
      // Fail closed in production when configured shared rate-limit storage is unavailable.
      if (process.env.NODE_ENV === 'production') return forbidden();
      allowed = memoryAllowed(key, rule[1]);
    }
  } else {
    allowed = memoryAllowed(key, rule[1]);
  }
  return allowed ? null : forbidden();
}
