// lib/vault.ts — เก็บ vault แยกทีละ key (flexozy2:vault:CODE) ไม่ใช่ก้อนเดียวทั้งคอลเลกชัน
// เหตุผล: ลิงก์ raw ถูกยิงบ่อยที่สุด ถ้าต้องโหลดข้อมูลทั้งก้อนทุกครั้งจะเป็นจุดอ่อนต่อการถูกถล่ม
// ข้อมูลเก่า (flexozy:vault) อ่านได้อัตโนมัติ (lazy-migrate) และมีสคริปต์ย้ายทั้งหมดใน scripts/migrate.mjs
import { getStore, readCol } from "./db";

export type Vault = {
  code: string;
  title: string;
  image: string;
  script: string;
  password_hash: string | null;
  password_salt: string | null;
  owner_id: string;
  owner_name: string;
  views: number;
  created_at: number;
};

const K = (code: string) => `flexozy2:vault:${code}`;
const OWNER = (id: string) => `flexozy2:vault-owner:${id}`;
const ALL = "flexozy2:vault-all";
const VIEWS = "flexozy2:vault-views";

const legacyMem: { ts: number; data: Vault[] } = { ts: 0, data: [] };
async function legacyFind(code: string): Promise<Vault | null> {
  if (Date.now() - legacyMem.ts > 60_000) {
    legacyMem.data = await readCol<Vault[]>("vault", []);
    legacyMem.ts = Date.now();
  }
  return legacyMem.data.find((v) => v.code === code) || null;
}

export async function saveVault(v: Vault) {
  const s = getStore();
  await s.set(K(v.code), v);
  await s.sadd(OWNER(v.owner_id), v.code);
  await s.sadd(ALL, v.code);
}

export async function getVault(code: string): Promise<Vault | null> {
  if (!/^[A-Za-z0-9_-]{4,40}$/.test(code)) return null;
  const s = getStore();
  const v = await s.get<Vault>(K(code));
  if (v) return v;
  const old = await legacyFind(code).catch(() => null);
  if (old) {
    await saveVault(old);
    return old;
  }
  return null;
}

export async function deleteVault(v: Vault) {
  const s = getStore();
  await s.del(K(v.code));
  await s.srem(OWNER(v.owner_id), v.code);
  await s.srem(ALL, v.code);
}

export async function addView(code: string) {
  await getStore().hincr(VIEWS, code).catch(() => 0);
}

export async function viewsFor(list: Vault[]): Promise<Vault[]> {
  const extra = await getStore().hmget(VIEWS, list.map((v) => v.code)).catch(() => ({}) as Record<string, number>);
  return list.map((v) => ({ ...v, views: (v.views || 0) + (Number(extra[v.code]) || 0) }));
}

export async function listVaults(ownerId?: string): Promise<Vault[]> {
  const s = getStore();
  const codes = await s.smembers(ownerId ? OWNER(ownerId) : ALL);
  const items = (await s.mget<Vault>(codes.slice(0, 500).map(K))).filter(Boolean) as Vault[];
  return (await viewsFor(items)).sort((a, b) => b.created_at - a.created_at);
}

export function publicMeta(v: Vault, apiHost: string, siteUrl: string) {
  return {
    code: v.code,
    title: v.title,
    image: v.image || "",
    has_password: !!v.password_hash,
    owner_name: v.owner_name,
    views: v.views,
    created_at: v.created_at,
    raw_url: apiHost ? `https://${apiHost}/${v.code}` : `${siteUrl}/raw/vault/${v.code}`,
  };
}
