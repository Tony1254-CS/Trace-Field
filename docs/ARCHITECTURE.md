# TRACE architecture

## Runtime

- `app/` is the Next.js App Router frontend. The dashboard is client rendered where interactive; the home route checks Supabase Auth on the server.
- `server/` is a separate Express 5 API, versioned under `/api/v1` and listening on port 8000.
- Supabase Auth supplies identities. The frontend uses cookie-backed sessions through `@supabase/ssr`; Express validates each bearer token with Supabase Auth and forwards that token to database and Storage requests.
- PostgreSQL is the system of record. Row Level Security is enabled on missions and observations. The API never uses a service-role key.
- Private user photos are stored in the `trace-photos` bucket, with Storage policies scoped to the authenticated user ID.

## Request flow

1. A user signs up or signs in through Supabase Auth.
2. Next.js refreshes SSR cookies in `proxy.ts`; the home route verifies the user before rendering the account dashboard.
3. TanStack Query requests the Express API with the current access token.
4. Express validates the access token, creates a request-scoped Supabase client with that token, and calls feature services.
5. PostgreSQL and Storage policies independently enforce ownership. The API adds validation and business rules; they do not replace RLS.

## Data model

`missions` belongs to one Supabase Auth user. `observations` belongs to both a user and a mission. A database foreign key prevents observations from losing their mission history. Mission archive is soft state (`archived_at`); observation deletion is permanent and confirmed by the UI. Photos use private Storage paths beginning with the owner UUID.

## Architectural decision

This implementation follows the user's selected Next.js + Express + Supabase architecture. It changes TRACE from the earlier local-only v1 contract: signed-in data requests require connectivity to the configured Supabase project. The local PWA shell can open offline, but cloud-backed mission and record workflows cannot load or save while offline. No account credentials or Supabase project were available during implementation, so live Auth, RLS, Storage, and database behavior still require setup and verification.
