# Flexozy v11 VM integration

New vault creation and source edits compile through the private Python VM compiler service configured in the repository-root `vercel.json`. The original editable source is retained as `source_script`; executable VM output is stored in `script` and delivered through the existing `/raw` and `/stage` routes.

For Vercel deployment, follow the repository-root `VERCEL-DEPLOY.md`. Do not deploy `frontend/` as the project root: the repository root contains the Vercel Services configuration and the private compiler service.

For local development from this directory, the compiler client can use the local Python CLI fallback when `FLEXOZY_VM_SERVICE_URL` is not configured and `VERCEL` is not set.
