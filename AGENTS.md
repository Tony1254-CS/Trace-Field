# TRACE — implementation contract

## Scope lock

This repository builds one product: TRACE, an installable field-observation application. Its approved architecture is a Next.js App Router frontend, versioned Express API, and Supabase Auth, PostgreSQL, and private Storage. All missions, capture, records, persistence, backup, routes, and styling belong to TRACE. Do not import or integrate another project or create another app surface.

The maintainer explicitly approved migration to Supabase-backed accounts and multi-device access. Do not add a Supabase service-role key or bypass RLS. A record is saved to the configured account only after the API confirms the database write. A local JSON backup remains a file export, not a separate sync mechanism.

## Product purpose

Help an authenticated field observer open or create a mission, record what they can actually observe, and keep the note and optional photo/location safely associated with that account's mission. Make the app feel considered, fast, and trustworthy in field conditions.

## Required features and acceptance criteria

### A. Installable TRACE app shell

Build an installable PWA with app name/identity, standalone display, manifest, 192px and 512px app icons, service worker, offline app-shell cache, and responsive layouts. Use relative asset URLs so it works from a repository subpath as well as a root domain.

Acceptance:
- Core app shell loads over HTTPS or localhost and can be installed where the browser supports installation.
- After first successful load, cached app assets open offline.
- The interface reports device network state but never implies network sync.
- No external font, analytics, map-tile, or tracking request is required for the shell to work.

### B. Mission inbox and mission editor

Users can create a mission with a required title and neutral observation prompt; optional place/date and paired target coordinates are supported. Users can edit and archive/reopen missions. Show true counts derived from account records. An empty inbox must explain the next action and provide mission creation.

Acceptance:
- Mission data persists in Supabase PostgreSQL and is isolated by RLS.
- A record cannot be saved without a valid active mission.
- Target coordinates require both latitude and longitude and stay within valid ranges.
- Sample/demo missions are not seeded or presented as real visits.

### C. Guided field capture

From an active mission, record one response: supports, contradicts, inconclusive, or not observable. Add a note and optional photo. Add current coordinates only after the user taps the location control and grants permission. Save the timestamp and GPS accuracy with coordinates. Let the observer review the form before saving.

Acceptance:
- Location denied, unavailable, timed out, and unsupported states are clear; saving without location still works.
- Photo selection is optional, size-limited, resized when supported, and previewed before save.
- Response, note, photo, and location remain associated with the selected mission and account.
- Captured evidence is labelled saved to the user's TRACE account and awaiting human review. It is never described as automatic ground truth or verification.

### D. Field records

List saved observations with real mission title, response, time, note, photo presence, and recorded location accuracy. Search and response filters operate on actual account records. Detail view shows the complete record. Deletion asks for confirmation.

Acceptance:
- Mission and observation counts derive from Supabase records; no placeholder analytics or fabricated numbers.
- Editing or archiving a mission does not detach its observations.
- Deleting a record removes it from account storage and the list.

### E. Backup and restore

Export the authenticated user's TRACE data as a documented versioned JSON file, including mission-observation relationships and photo attachments. Restore from a selected local backup file after validating format, record counts, required fields, photo type/size, and coordinates. Remap imported record IDs to avoid collisions and transactionally add copies.

Acceptance:
- Exported backup can be restored without losing mission links, notes, timestamps, location accuracy, or photos.
- Invalid or oversized files show a recoverable error and do not partially overwrite existing records.
- Import adds copies; it must not silently replace existing user data.
- State plainly that backup is a downloadable JSON file and is not a second synchronization mechanism.

### F. Visual quality, accessibility, and field usability

Use a distinctive restrained visual system, app-style navigation, obvious next actions, and responsive layouts. Avoid generic AI dashboard layouts, fake telemetry, decorative 3D, gratuitous gradients, and motion that competes with field work. Use semantic controls, visible focus, keyboard access, screen-reader names, sufficient contrast, touch-sized controls, reduced-motion support, and safe-area spacing.

Acceptance:
- Mission, capture, records, dialogs, empty states, error states, and navigation remain usable on narrow phones and larger screens.
- All actions work with keyboard as well as touch.
- No core interaction requires a hover state.
- UI language explains each function in plain words and distinguishes observation from interpretation.

## Data, privacy, and security rules

- Store account records in Supabase PostgreSQL with RLS. Keep account data out of shared caches; encourage downloadable backups.
- Request location only after an explicit user action. Photo selection is user initiated. Do not collect location continuously.
- Escape user-entered text before rendering HTML. Validate imported JSON and cap file, record, and photo sizes.
- Keep separate observers' records separate if multi-observer support is later added.
- Never fabricate mission activity, GPS, timestamps, accuracy, field validation, confidence, metrics, or impact counts.
- No analytics, tracking, or additional external services beyond the maintainer-approved Supabase project.
- Treat missing evidence as missing. A user observation is evidence for review, not verified ground truth.

## Agent workflow

1. Inspect the repository and its run/check commands before editing.
2. Keep changes inside TRACE and its authenticated, RLS-protected data boundary.
3. Implement complete workflows, not static mock screens.
4. Preserve user records and existing behavior; avoid destructive migrations.
5. Ask the maintainer before adding any service beyond the approved Supabase backend, background location tracking, new personal-data collection, or other material scope change.
6. Run the repository's relevant checks and report exact commands/results. Do not claim an unrun check passed.
7. PRs explain behavior, data/privacy effects, sample content, validation, limitations, and include visual evidence for UI changes.

## Definition of done

TRACE installs on supported browsers, authenticates a user, loads/creates a mission, saves a structured observation with optional user-approved photo/GPS, protects records with RLS, and exports/restores a complete account backup. Every count and status reflects actual data. No screen claims scientific verification that the app does not provide. Live service behavior must be verified against a configured Supabase project before claiming end-to-end completion.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
