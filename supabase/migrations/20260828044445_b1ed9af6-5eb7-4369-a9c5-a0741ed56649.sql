-- ===== roles =====
create type public.app_role as enum ('admin','moderator','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'user',
  avatar_url text,
  bio text,
  wallet_balance numeric(12,2) not null default 0,
  banned boolean not null default false,
  ban_reason text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles self read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- new user -> profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1), 'user'),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ป้องกันผู้ใช้แก้ยอดเงิน/สถานะแบนของตัวเอง
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    new.wallet_balance := old.wallet_balance;
    new.banned := old.banned;
    new.ban_reason := old.ban_reason;
  end if;
  return new;
end; $$;
create trigger protect_profile before update on public.profiles
for each row execute function public.protect_profile_fields();

-- ===== settings =====
create table public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'FLEXZY STORE',
  tagline text not null default 'บริการทุกระดับประทับใจ',
  logo_url text default '',
  discord_invite text default '',
  announcement_text text default '',
  maintenance_enabled boolean not null default false,
  maintenance_html text default '',
  popup_enabled boolean not null default false,
  popup_image text default '',
  popup_title text default '',
  popup_code text default '',
  popup_desc text default '',
  popup_button_text text default '',
  popup_button_link text default '',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;
grant insert, update on public.site_settings to authenticated;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.site_settings (id) values (true);

-- ===== categories =====
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  image text default '',
  link text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== scripts =====
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game text not null default '',
  image text default '',
  script text not null default '',
  key_system boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default '',
  author_avatar text default '',
  likes int not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.scripts to anon, authenticated;
grant insert, update, delete on public.scripts to authenticated;
grant all on public.scripts to service_role;
alter table public.scripts enable row level security;
create policy "scripts public read" on public.scripts for select using (approved or author_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "scripts author insert" on public.scripts for insert to authenticated with check (author_id = auth.uid());
create policy "scripts author update" on public.scripts for update to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "scripts delete" on public.scripts for delete to authenticated
  using (author_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.script_likes (
  script_id uuid not null references public.scripts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (script_id, user_id)
);
grant select on public.script_likes to anon, authenticated;
grant insert, delete on public.script_likes to authenticated;
grant all on public.script_likes to service_role;
alter table public.script_likes enable row level security;
create policy "likes public read" on public.script_likes for select using (true);
create policy "likes self write" on public.script_likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes self delete" on public.script_likes for delete to authenticated using (user_id = auth.uid());

create or replace function public.sync_script_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.scripts s set likes = (select count(*) from public.script_likes l where l.script_id = s.id)
  where s.id = coalesce(new.script_id, old.script_id);
  return null;
end; $$;
create trigger script_likes_sync after insert or delete on public.script_likes
for each row execute function public.sync_script_likes();

-- ===== vault =====
create table public.vault_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  script text not null,
  password_hash text,
  owner_id uuid references auth.users(id) on delete set null,
  owner_name text default '',
  views int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vault_items to authenticated;
grant all on public.vault_items to service_role;
alter table public.vault_items enable row level security;
create policy "vault owner read" on public.vault_items for select to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vault owner write" on public.vault_items for insert to authenticated with check (owner_id = auth.uid());
create policy "vault owner update" on public.vault_items for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'))
  with check (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "vault owner delete" on public.vault_items for delete to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ===== store =====
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  image text default '',
  price numeric(12,2) not null default 0,
  stock int not null default 0,
  category text default '',
  type text not null default 'other',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (active or public.has_role(auth.uid(),'admin'));
create policy "products admin write" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  buyer_name text default '',
  product_id uuid references public.products(id) on delete set null,
  product_title text not null default '',
  price numeric(12,2) not null default 0,
  status text not null default 'paid',
  delivered_content text,
  created_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders owner read" on public.orders for select to authenticated
  using (buyer_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders admin write" on public.orders for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  type text not null,
  ref text default '',
  created_at timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;
create policy "wallet owner read" on public.wallet_transactions for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.redeem_codes (
  code text primary key,
  reward_type text not null default 'wallet',
  reward_value text not null default '0',
  max_uses int not null default 1,
  uses int not null default 0,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.redeem_codes to authenticated;
grant all on public.redeem_codes to service_role;
alter table public.redeem_codes enable row level security;
create policy "codes admin only" on public.redeem_codes for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.redeem_uses (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.redeem_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (code, user_id)
);
grant select on public.redeem_uses to authenticated;
grant all on public.redeem_uses to service_role;
alter table public.redeem_uses enable row level security;
create policy "redeem uses owner read" on public.redeem_uses for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ===== community =====
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text default '',
  description text default '',
  discord_invite text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.partners to anon, authenticated;
grant insert, update, delete on public.partners to authenticated;
grant all on public.partners to service_role;
alter table public.partners enable row level security;
create policy "partners public read" on public.partners for select using (true);
create policy "partners admin write" on public.partners for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  handle text default '',
  avatar text default '',
  role text default '',
  bio text default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.team_members to anon, authenticated;
grant insert, update, delete on public.team_members to authenticated;
grant all on public.team_members to service_role;
alter table public.team_members enable row level security;
create policy "team public read" on public.team_members for select using (true);
create policy "team admin write" on public.team_members for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== roblox sounds =====
create table public.roblox_genres (
  id text primary key,
  title text not null,
  image text default '',
  sort_order int not null default 0
);
grant select on public.roblox_genres to anon, authenticated;
grant insert, update, delete on public.roblox_genres to authenticated;
grant all on public.roblox_genres to service_role;
alter table public.roblox_genres enable row level security;
create policy "genres public read" on public.roblox_genres for select using (true);
create policy "genres admin write" on public.roblox_genres for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.roblox_sounds (
  id text primary key,
  name text not null,
  creator text default '',
  thumbnail text default '',
  verified boolean not null default false,
  genre_id text,
  added_by uuid references auth.users(id) on delete set null,
  added_by_name text default '',
  created_at timestamptz not null default now()
);
grant select on public.roblox_sounds to anon, authenticated;
grant insert, update, delete on public.roblox_sounds to authenticated;
grant all on public.roblox_sounds to service_role;
alter table public.roblox_sounds enable row level security;
create policy "sounds public read" on public.roblox_sounds for select using (true);
create policy "sounds admin write" on public.roblox_sounds for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  sound_id text not null,
  name text default '',
  thumbnail text default '',
  created_at timestamptz not null default now(),
  primary key (user_id, sound_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "favorites self" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===== reports =====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  target_id text default '',
  target_label text default '',
  reason text not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reporter_name text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports read" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reports admin manage" on public.reports for update to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== seed =====
insert into public.categories (title, subtitle, image, link, sort_order) values
  ('สคริปต์ Roblox','รวมสคริปต์ยอดนิยม','','/scripts',1),
  ('App Premium','บัญชีพรีเมียมพร้อมใช้งาน','','/store',2),
  ('เพลง Roblox','ค้นหา Roblox Sound ID','','/roblox',3),
  ('บริการ Discord','บูสต์ / เซิร์ฟเวอร์ / บอท','','/store',4);

insert into public.partners (name, avatar, description, discord_invite, sort_order) values
  ('Luader HUB','','พาร์ทเนอร์สคริปต์ฮับ','https://discord.gg/surbRKSw5C',1),
  ('Flexzy Community','','คอมมูนิตี้หลักของร้าน','',2);

insert into public.team_members (username, handle, role, bio, sort_order) values
  ('Me Egg Big','@meeggbig','Owner','ผู้ก่อตั้ง FLEXZY STORE',1),
  ('Flexzy Support','@support','Support','ดูแลลูกค้าและงานขาย',2);

insert into public.roblox_genres (id, title, sort_order) values
  ('loud','เพลงดัง',1),('sweet','เพลงเพราะ',2),('soft','เพลงเบา',3),('sfx','SFX',4),('dance','เเดนซ์',5);

insert into public.products (title, description, image, price, stock, category, type) values
  ('Netflix Premium 1 เดือน','บัญชีพร้อมใช้ รับประกันตลอดอายุ','',99,25,'App Premium','other'),
  ('Spotify Premium 1 เดือน','อัปเกรดบัญชีของคุณเอง','',59,40,'App Premium','other'),
  ('Discord Nitro 1 เดือน','ส่งตรงเข้าบัญชีภายใน 5 นาที','',149,10,'Discord','discord_service'),
  ('Server Boost x14','บูสต์เซิร์ฟเวอร์ระดับ 3','',399,5,'Discord','discord_service');

insert into public.scripts (title, game, image, script, key_system, author_name, likes, approved) values
  ('Luader X HUB — 🎐City Thailand 2','🎐City Thailand 2','https://img1.pic.in.th/images/ChatGPT_Image_1_.._2569_16_55_5014be651139b95850.png','loadstring(game:HttpGet("https://pastefy.app/Tj9uNMG5/raw"))()',false,'Me Egg Big',3,true),
  ('Blox Fruits Auto Farm','Blox Fruits','','loadstring(game:HttpGet("https://example.com/bloxfruits.lua"))()',false,'Flexzy Team',12,true),
  ('Universal ESP','Universal','','loadstring(game:HttpGet("https://example.com/esp.lua"))()',true,'Flexzy Team',7,true);