// lib/db.ts — ชั้นเก็บข้อมูล: Upstash/Vercel KV (Redis) ถ้ามี env, ไม่งั้นใช้หน่วยความจำ (เหมาะกับ dev เท่านั้น)
// ใช้ได้ทั้ง Edge (middleware) และ Node เพราะ @upstash/redis ใช้ fetch ล้วนๆ
import { Redis } from "@upstash/redis";
import { IS_PROD } from "./env";

export interface Store {
  readonly persistent: boolean;
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, exSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** ตัวนับแบบ fixed window: เพิ่ม 1 ครั้ง, ตั้งหมดอายุครั้งแรกเท่านั้น */
  incr(key: string, windowSec: number): Promise<{ count: number; ttl: number }>;
  ttl(key: string): Promise<number>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  mget<T = unknown>(keys: string[]): Promise<(T | null)[]>;
  hincr(key: string, field: string): Promise<number>;
  hmget(key: string, fields: string[]): Promise<Record<string, number>>;
}

// ---------- Redis ----------
function makeRedisStore(redis: Redis): Store {
  return {
    persistent: true,
    async get<T>(key: string) {
      return ((await redis.get(key)) as T | null) ?? null;
    },
    async set(key, value, exSec) {
      if (exSec) await redis.set(key, value, { ex: exSec });
      else await redis.set(key, value);
    },
    async del(key) {
      await redis.del(key);
    },
    async incr(key, windowSec) {
      const p = redis.pipeline();
      p.incr(key);
      p.expire(key, windowSec, "NX");
      const res = (await p.exec()) as [number, unknown];
      return { count: Number(res[0]), ttl: windowSec }; // ttl จริงดึงเฉพาะตอนโดนบล็อก (ประหยัดคำสั่ง Redis)
    },
    async ttl(key) {
      const t = Number(await redis.ttl(key));
      return t > 0 ? t : 1;
    },
    async sadd(key, member) {
      await redis.sadd(key, member);
    },
    async srem(key, member) {
      await redis.srem(key, member);
    },
    async smembers(key) {
      return ((await redis.smembers(key)) as string[]) || [];
    },
    async mget<T>(keys: string[]) {
      if (!keys.length) return [];
      return (await redis.mget<(T | null)[]>(...keys)) as (T | null)[];
    },
    async hincr(key, field) {
      return Number(await redis.hincrby(key, field, 1));
    },
    async hmget(key, fields) {
      if (!fields.length) return {};
      const r = (await redis.hmget<Record<string, number>>(key, ...fields)) || {};
      return r;
    },
  };
}

// ---------- Memory (dev / ไม่มี Redis) ----------
function makeMemoryStore(): Store {
  const kv = new Map<string, { v: unknown; exp: number }>();
  const sets = new Map<string, Set<string>>();
  const hashes = new Map<string, Map<string, number>>();
  const alive = (k: string) => {
    const e = kv.get(k);
    if (!e) return undefined;
    if (e.exp && e.exp < Date.now()) {
      kv.delete(k);
      return undefined;
    }
    return e;
  };
  return {
    persistent: false,
    async get<T>(key: string) {
      const e = alive(key);
      return e ? (structuredClone(e.v) as T) : null;
    },
    async set(key, value, exSec) {
      kv.set(key, { v: structuredClone(value), exp: exSec ? Date.now() + exSec * 1000 : 0 });
    },
    async del(key) {
      kv.delete(key);
    },
    async incr(key, windowSec) {
      const e = alive(key);
      if (!e) {
        kv.set(key, { v: 1, exp: Date.now() + windowSec * 1000 });
        return { count: 1, ttl: windowSec };
      }
      e.v = Number(e.v) + 1;
      return { count: Number(e.v), ttl: Math.max(1, Math.ceil((e.exp - Date.now()) / 1000)) };
    },
    async ttl(key) {
      const e = alive(key);
      return e && e.exp ? Math.max(1, Math.ceil((e.exp - Date.now()) / 1000)) : 1;
    },
    async sadd(key, m) {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key)!.add(m);
    },
    async srem(key, m) {
      sets.get(key)?.delete(m);
    },
    async smembers(key) {
      return Array.from(sets.get(key) || []);
    },
    async mget<T>(keys: string[]) {
      return keys.map((k) => {
        const e = alive(k);
        return e ? (structuredClone(e.v) as T) : null;
      });
    },
    async hincr(key, f) {
      if (!hashes.has(key)) hashes.set(key, new Map());
      const h = hashes.get(key)!;
      h.set(f, (h.get(f) || 0) + 1);
      return h.get(f)!;
    },
    async hmget(key, fields) {
      const h = hashes.get(key);
      const out: Record<string, number> = {};
      for (const f of fields) if (h?.has(f)) out[f] = h.get(f)!;
      return out;
    },
  };
}

const g = globalThis as unknown as { __fxStore?: Store; __fxWarned?: boolean };

export function getStore(): Store {
  if (g.__fxStore) return g.__fxStore;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    g.__fxStore = makeRedisStore(new Redis({ url, token }));
  } else {
    if (IS_PROD && !g.__fxWarned) {
      g.__fxWarned = true;
      console.error("[flexozy] ไม่พบ KV_REST_API_URL/TOKEN — กำลังใช้หน่วยความจำชั่วคราว ข้อมูลจะหายและ rate limit ไม่ทำงานข้าม instance!");
    }
    g.__fxStore = makeMemoryStore();
  }
  return g.__fxStore;
}

// ---------- collection แบบเดิม (เก็บทั้งก้อนเป็น JSON ใต้ key flexozy:<ชื่อ>) — เข้ากันได้กับข้อมูลเก่าใน KV ----------
const colKey = (name: string) => `flexozy:${name}`;

export async function readCol<T>(name: string, fallback: T): Promise<T> {
  const v = await getStore().get<T>(colKey(name));
  return v ?? fallback;
}

// กันเขียนชนกันภายใน instance เดียว (ข้าม instance ใช้เฉพาะงานแอดมินที่เขียนน้อยมาก จึงยอมรับได้)
const locks = new Map<string, Promise<unknown>>();
export async function mutateCol<T, R>(name: string, fallback: T, fn: (data: T) => R | Promise<R>): Promise<R> {
  const prev = locks.get(name) || Promise.resolve();
  const run = prev.then(async () => {
    const data = await readCol<T>(name, fallback);
    const result = await fn(data);
    await getStore().set(colKey(name), data);
    return result;
  });
  locks.set(name, run.catch(() => undefined));
  return run;
}
