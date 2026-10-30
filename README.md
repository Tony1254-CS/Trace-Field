# TRACE Field Notebook

TRACE helps field observers create missions, capture observations, and review their records. This implementation uses a Next.js App Router frontend, an Express API, and Supabase Auth, PostgreSQL, and private Storage.

## Requirements

- Node.js 20.9 or later and npm.
- A Supabase project with email/password Auth enabled.
- Supabase project URL and publishable key.

## First run

1. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key.
2. Apply `supabase/migrations/202610300001_trace_core.sql` to your Supabase project.
3. Add `http://localhost:3000` to the Auth redirect URL allow-list.
4. Run:

   ```powershell
   npm ci
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). The API is at `http://localhost:8000/api/v1`; its health route is `/health`.

See [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) for environment details and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system boundaries.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm test
npm run test:server
npm run build
```

The tests cover local schemas and API health/auth boundaries. RLS, Auth, Storage, and backup RPC behavior require a configured Supabase project for end-to-end verification.

## Data and privacy

Missions and observations are account-backed in the configured Supabase project. PostgreSQL RLS and Storage policies isolate each user's records and photos. The API uses only the public publishable key and signed-in access tokens; it does not use a service-role key. Configure the Supabase email confirmation and mail delivery settings before inviting field users.

The app shell can open an offline information page after it has been cached, but account records cannot be fetched or saved without a connection. A local backup is a JSON file; it is not cloud synchronization.
