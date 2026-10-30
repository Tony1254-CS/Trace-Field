# TRACE API v1

Base URL in development: `http://localhost:8000/api/v1`. Except for health, endpoints require `Authorization: Bearer <Supabase access token>`. Successful JSON responses use a `data` member where applicable. Errors use `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | Process health and timestamp; no user data. |
| GET | `/missions` | Current user's missions and observation counts. |
| POST | `/missions` | Validate and create a mission. |
| PATCH | `/missions/:id` | Edit mission fields or archive/reopen. |
| GET | `/observations` | Paginated notes; accepts `q`, `response`, `missionId`, `limit`, `offset`. |
| GET | `/observations/:id` | One complete note with a short-lived signed photo URL. |
| POST | `/observations` | Multipart `payload` JSON plus optional `photo`; max 8 MB photo. |
| DELETE | `/observations/:id` | Permanently delete a note and its private photo. |
| GET | `/backup/export` | Versioned JSON copy of the signed-in user's missions, notes, and photos. |
| POST | `/backup/restore` | Validate a selected backup, remap IDs, upload photos, and transactionally add copies. |

The API has a version-wide rate limit of 120 requests per minute per process. The health endpoint intentionally excludes external service health; Supabase availability is checked by authenticated requests.
