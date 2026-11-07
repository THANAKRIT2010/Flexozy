# Flexozy on Vercel with the v11 VM compiler

This repository uses **Vercel Services** so the existing Next.js app and the Python VM compiler deploy together in one Vercel project:

- `frontend/` — the existing Flexozy Next.js application and all existing app routes.
- `compiler/` — a private Python service that runs the bundled v11 compiler.
- `FLEXOZY_VM_SERVICE_URL` — injected by the service binding; do not set it manually.
- `FLEXOZY_VM_COMPILER_SECRET` — set to the same long random value in both the `flexozy_web` and `flexozy_vm` services.

The public catch-all rewrite routes all browser traffic to `flexozy_web`. The compiler has no public rewrite and is called only through the private service binding. The Next.js code refuses to fall back to a local subprocess on Vercel.

## Deploy

1. Push the repository root (the folder containing `vercel.json`) to GitHub.
2. Import that repository into Vercel. Keep the project root at `./`; do not set it to `frontend/`.
3. Ensure Vercel Services is enabled for the project/team. The current Vercel documentation lists Services as Beta on all plans.
4. Configure `FLEXOZY_VM_COMPILER_SECRET` as a project environment variable (or in both service scopes with the exact same randomly generated secret). Do not put the secret in source control or expose it as a `NEXT_PUBLIC_` variable.
5. Deploy. The service binding injects `FLEXOZY_VM_SERVICE_URL` into the Next.js service at runtime.
6. Test creating a private link with a small supported Lua sample, then open its raw/stage delivery and verify it returns one-line VM output. Also open the edit screen and verify it still displays the original `source_script`.

## Local development

The Next.js app retains a local-only Python CLI fallback. Run from `frontend/` with Node.js and Python 3.10+ installed. For a full Vercel Services local simulation, use the Vercel CLI from the repository root with `vercel dev`.

## Important compatibility notes

- The compiler implements a subset of Luau. Unsupported syntax will return a compile error rather than silently saving uncompiled source.
- VM output can be much larger than source. Confirm the configured KV/database value limits and request body/response limits before production use.
- Vercel service/function duration and memory limits still apply. Large scripts may time out; test with representative source sizes before enabling for all users.
- Existing links are not automatically recompiled. They continue using their current stored output until the source is edited and saved again.
- The compiler service is private by default. Do not add a public rewrite for it.
