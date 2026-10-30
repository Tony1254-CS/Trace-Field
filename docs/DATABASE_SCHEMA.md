# TRACE database schema

The migration is `supabase/migrations/202610300001_trace_core.sql`.

## Tables

### `public.missions`

- `id`: UUID primary key.
- `user_id`: required foreign key to `auth.users`, cascade delete.
- `title`, `prompt`: required bounded text.
- `place`, `visit_date`: optional mission context.
- `target_lat`, `target_lng`: nullable pair with geographic range checks.
- `archived_at`: nullable archive timestamp; observations remain linked.
- `created_at`, `updated_at`: server timestamps; updates refresh `updated_at`.

### `public.observations`

- `id`: UUID primary key.
- `user_id`: required foreign key to `auth.users`, cascade delete.
- `mission_id`: required foreign key to missions with `ON DELETE RESTRICT`.
- `answer`: one of `supports`, `contradicts`, `inconclusive`, `not-observable`.
- `note`: optional user text, capped at 1,200 characters.
- `captured_at`: observation capture timestamp.
- `latitude`, `longitude`, `accuracy`: nullable together, bounded by database checks.
- `photo_path`: nullable private Storage key, checked against `user_id`.
- `verification_state`: fixed to `awaiting_review`; database evidence is not ground-truth verification.
- `created_at`: server insertion timestamp.

## Security and indexes

RLS is enabled on both tables. Policies require `auth.uid() = user_id`; observation creation additionally checks ownership of the linked mission. `anon` table access is revoked. Indexes support user mission ordering, observation date ordering, mission linking, response filters, and note search.

The private `trace-photos` bucket has an 8 MB cap and allows JPEG, PNG, WebP, GIF, BMP, HEIC, and HEIF so older valid local backups can be restored. New capture currently resizes photos to JPEG where browser support allows. Storage policies restrict read, insert, and delete operations to keys whose first folder is the signed-in user UUID.

## Restore transaction

`restore_trace_records(jsonb,jsonb)` inserts remapped missions and observations in one PostgreSQL transaction using the caller's identity and RLS. Photos are uploaded first; the API removes those uploaded files if the database RPC fails.
