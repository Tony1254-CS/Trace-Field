# Implementation status

## Implemented in source

- Next.js App Router, strict TypeScript, Tailwind CSS, reusable UI primitives, Lucide icons, React Hook Form, Zod, TanStack Query, and Sonner.
- Supabase email/password sign-up/sign-in and cookie-backed SSR session refresh.
- Express v5 API with health endpoint, CORS allow-list, Helmet headers, rate limiting, request logging with auth header redaction, centralized errors, Zod validation, and graceful shutdown.
- Mission create/edit/archive/reopen and owner-scoped counts.
- Guided observation capture, four response values, optional photo/location, review before save, and records search/filter/detail/delete.
- RLS schema and private Storage policies in a migration.
- Versioned JSON backup export and restore with validation, ID remapping, legacy PWA backup support, bounded photo sizes, and transactional database insertion.
- PWA metadata, icons, install affordance, and an offline app-shell response.

## Verified in the local workspace

- `npm ci --no-audit --no-fund` completed from the committed lockfile.
- `npm run lint` completed with no errors. Remaining warnings are image optimization suggestions, flat-config style suggestions, and two legacy/source warnings.
- `npm test` passed: 7 tests across validation and API boundary coverage.
- `npm run build` passed: TypeScript, Express API bundle, and Next.js production build.
- Local smoke check returned HTTP 200 for the Next.js sign-in screen and `{"status":"ok"}` from the Express health endpoint.

## Not verified yet

- Supabase credentials are not configured. Auth, applied migrations, RLS isolation, Storage policies, signing, and the restore RPC have not been executed against a live project.
- Real device installation, narrow-screen visual review, and service worker offline behavior require browser/device walkthrough.
- Authenticated mission/observation flows were not tested through a real account.
- Cloud-backed mission and observation operations need a network connection; the previous local-only offline capture promise no longer applies after the user's requested architecture migration.

## External setup still required

The maintainer must create/configure the Supabase project, apply the migration, set Auth redirects and email delivery, and provide project URL/publishable key in `.env.local`. No credentials are committed.
