# Development setup

## Requirements

- Node.js 20.9 or newer and npm.
- A Supabase project with email/password Auth enabled.
- The Supabase project URL and publishable key.

## Configure Supabase

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings.
3. Apply `supabase/migrations/202610300001_trace_core.sql` with the Supabase CLI or SQL editor.
4. Add `http://localhost:3000` to the Supabase Auth redirect URL allow-list. Configure email confirmation and SMTP in Supabase according to the deployment's needs.

The same `.env.local` is loaded by Next.js and by the Node API runner. The frontend variables are public project URL and publishable key; there is no service-role key in this app. `API_PORT`, `FRONTEND_URL`, and `SUPABASE_STORAGE_BUCKET` have local defaults shown in `.env.example`.

## Install and run

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. The Express API listens at `http://localhost:8000`; the health endpoint is `http://localhost:8000/api/v1/health`. `npm run dev` starts both processes and stops both if either exits. The API exits with a clear configuration error if Supabase variables are missing.

## Quality commands

```powershell
npm run lint
npm run typecheck
npm test
npm run test:server
npm run build
```

Tests that require a live Supabase project are not run by the default suite. Configure the project and apply the migration before verifying Auth, RLS, Storage upload/download/delete, and restore RPC behavior end to end.
