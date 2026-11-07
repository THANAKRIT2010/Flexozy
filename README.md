# Flexozy Vercel package

This is the Vercel project root. Import this repository/folder into Vercel with the project root set to `./`.

- `frontend/` contains the existing Flexozy Next.js app.
- `compiler/` contains the private Python v11 VM compiler service.
- `vercel.json` connects both services and routes public traffic to the Next.js app.

Follow [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) before deploying.
