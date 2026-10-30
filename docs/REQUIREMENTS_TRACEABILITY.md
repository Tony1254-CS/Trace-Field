# TRACE requirement traceability

Status values describe source implementation. “Pending verification” means the code exists but its acceptance flow has not yet been exercised in the target environment.

| Requirement | Frontend | API / data | Verification status |
| --- | --- | --- | --- |
| Installable TRACE identity, manifest, icons, responsive navigation, network state | `app/layout.tsx`, `app/manifest.ts`, `components/layout/dashboard.tsx`, `public/service-worker.js`, `public/icons/` | Next static shell | Implemented; browser install/offline walkthrough pending. Offline page contains no private records. |
| Create/edit/archive/reopen missions with title, neutral prompt, optional date/place and paired coordinates | `components/missions/mission-inbox.tsx`, `features/missions/queries.ts`, `lib/validations/trace.ts` | `POST/PATCH/GET /api/v1/missions`; `public.missions`; RLS migration | Implemented; live Supabase verification pending. |
| Real mission and observation counts | `MissionInbox` | Supabase relation count from `listMissions`; RLS applies | Implemented; live data verification pending. |
| Supports/contradicts/inconclusive/not-observable capture, optional note, photo, user-requested GPS, review-before-save | `components/capture/observation-form.tsx` | `POST /api/v1/observations`; Zod schema; private Storage upload | Implemented; live permission, upload, and persistence verification pending. |
| Search/filter/paginate records; complete detail; confirm deletion | `components/records/record-list.tsx` | `GET/DELETE /api/v1/observations`; joined mission; signed photo URLs | Implemented; live data verification pending. |
| Versioned export/restore, IDs remapped, photos attached, validation before insert | Record backup controls | `/backup/export`, `/backup/restore`, Zod validation, Storage cleanup, `restore_trace_records` SQL transaction | Implemented; configured-project integration pending. |
| Authentication and owner isolation | `components/auth/auth-panel.tsx`, `lib/supabase/*`, `proxy.ts` | Express token validation; RLS on both tables and private Storage | Implemented in code; Auth/RLS denial tests against Supabase pending. |
| Secure validation, errors, logging, limits, health | Mission/capture form schemas | `server/src/middleware`, feature schemas/services, `/health`, rate limiter, logger redaction | Implemented; automated checks pending. |
| Accessible responsive interface and reduced-motion behavior | React components plus existing TRACE style system | — | Source includes semantic controls, labels, keyboardable dialogs, focus and responsive rules; manual accessibility/visual review pending. |
| Offline mission/record creation | Not available in account-backed mode | Supabase operations require a connection | Not implemented; this is a known behavior change from the previous local-only PWA contract. |

## Deliberately not included

No fabricated visits, seeded field records, continuous location tracking, satellite analysis, map service, analytics, or automatic scientific verification. Optional TRACE additions in `PROJECT_FEATURES.md` remain outside the core scope.

## Verification boundary

Source changes do not prove a Supabase migration, Auth configuration, RLS policy, Storage bucket, or restore function works remotely. Those require `.env.local`, an applied migration, and live user-isolation tests. The offline PWA walkthrough also does not cover cloud record access while disconnected.
