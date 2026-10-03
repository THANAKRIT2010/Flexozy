# Flexozy Vault

Updated source for the existing Next.js deployment. Install with `npm install`; configure values in `.env.example` on your host before running `npm run dev` or deploying. Do not commit real secrets.

## Domains

Set `FRONTEND_URL=https://flexozy.xyz` and `API_HOST=api.flexozy.xyz`. Both hostnames must point to **the same Next.js deployment** (DNS alone is not enough; configure the API hostname as a deployment domain). Loadstrings now use `https://api.flexozy.xyz/raw/CODE`. The API hostname only accepts GET `/raw/CODE` and POST `/presence/CODE`; other paths are blocked by middleware. Existing main-domain `/raw/CODE` still functions for old loadstrings.

## Player activity

Raw responses add a small Lua heartbeat before the stored script. In an executor that supports `request`, `http_request`, or `syn.request`, it reports local player name, numeric Roblox user ID, and JobId every 30 seconds while running. The listing displays reports within the last 90 seconds only, upon clicking **ดูผู้เล่นในเกม**. It is not Roblox-authenticated: names/IDs are self-reported by clients and can be spoofed; do not treat them as proof of identity or use them to grant access. Executors without HTTP request support will not report players. For production persistence across server instances, configure Vercel KV. Local JSON storage is for local development only.

## Security

The creation form uses the actual Cloudflare Turnstile widget and server verification. Set both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in your deployment. The previous simulated browser timer has been removed; it never provided security. Configure domain-wide challenges separately in Cloudflare's dashboard if desired. Discord OAuth still requires its original credentials and callback configuration.
