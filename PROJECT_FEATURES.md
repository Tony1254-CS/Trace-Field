# TRACE PWA — feature-by-feature build spec

TRACE is a standalone installable field notebook. This spec is for TRACE only. It has no account, cloud service, or multi-device sync in v1. Read AGENTS.md before implementation.

## 1. App shell and navigation

**Purpose:** Make TRACE feel like a focused field app that opens quickly and remains usable without a network.

**Build:** App identity and install icons; standalone manifest; service worker that caches the app shell; mobile-first navigation for Missions, Capture, and Records; online/offline indicator; install affordance when supported; responsive phone/tablet/desktop browser sizing.

**Done when:** app shell opens offline after first successful load; relative asset paths work under a project subpath; all routes and controls remain reachable without a mouse; no online-only service or external font is required.

## 2. Mission inbox

**Purpose:** Give the observer a clear list of the field tasks they have created on this device.

**Build:** Mission cards with title, prompt, optional place/target, open/archived state, and the real number of linked notes. Empty state explains how to create a first mission. Add create, edit, archive, and reopen actions.

**Done when:** missions persist in IndexedDB after reload; counts come from saved records; archive retains mission history; no fictional missions or visit counts appear.

## 3. Mission editor and target

**Purpose:** Define what an observer is being asked to look at in neutral, observable language.

**Build:** Required mission title and observation prompt. Optional place label and visit date. Optional target latitude and longitude, entered together and validated against geographic limits. TRACE-owned links/QR may open only a TRACE mission.

**Done when:** invalid/missing required fields block save with a clear explanation; partial or out-of-range coordinates are rejected; mission context is retained through capture.

## 4. Guided observation capture

**Purpose:** Record what the observer actually saw, while separating observation from interpretation.

**Build:** Four response choices: supports, contradicts, inconclusive, not observable. Optional free-text note. Optional photo selected by the observer, previewed and resized/limited before local storage. A tap-to-request location action, with captured time and reported GPS accuracy. A saved draft and final review-before-save flow.

**Done when:** the observer can save without granting location or adding a photo; permission denied/unavailable/timeout states explain the issue; the note, photo, response, timestamp, and location remain linked to the correct mission; attached evidence is labelled awaiting human review.

## 5. Local records

**Purpose:** Let the observer find, inspect, and manage saved notes.

**Build:** Search by mission title/note, filter by response, open record details, inspect photo and GPS accuracy, and delete a record only after confirmation. Show true record state as saved on this device.

**Done when:** every displayed row and count reflects IndexedDB; reload preserves the list; deleting removes that record; mission history remains intact.

## 6. Offline storage and backup

**Purpose:** Protect observations from unreliable connectivity and let the user move a copy to another device manually.

**Build:** IndexedDB for missions, drafts, photos, and observations. Export all local records to a versioned JSON backup. Restore from a user-selected backup with file-size, type, count, coordinate, and schema validation. Remap IDs while preserving mission links.

**Done when:** observations can be created and inspected offline; backup restore preserves photos and all relationships; invalid imports do not partially modify existing data; interface says clearly that local backup is not cloud synchronization.

## 7. Data and privacy panel

**Purpose:** Make storage and permission behavior understandable before a field observer relies on the app.

**Build:** Explain that data stays in this browser on this device; provide export and restore actions; request GPS only after tapping the location action; never request continuous tracking. Explain that clearing browser storage or switching devices can remove data unless backed up.

**Done when:** there is no hidden background location collection, analytics, fake sync indicator, or automatic verification claim.

## 8. Optional TRACE additions (after core workflow)

- Point & Prove target overlay: show approximate alignment, target distance, and GPS accuracy; do not imply exact AR.
- Walk on the Radar: encode a real, documented value into sound/haptics and show the value/units. If the measurement is unavailable, do not simulate it as collected data.
- My Place Watch: show future observation timing only when based on identified acquisition metadata and a documented cadence.
- Bangla guidance/audio: reviewed translation; offline playback only for audio actually saved on device.
- Mission replay / Field Story: reconstruct only from actual TRACE records and timestamps.
- Short field guide or learning lab: keep separate from data capture and label any simulation.

Do not start optional work until features 1–7 work end to end.

## Excluded

No separate app or dashboard, external product integration, account system, network sync, global atlas, remote satellite analysis console, fake demo telemetry, fabricated missions, synthetic validation metrics, or claims that a field photo proves a scientific result. Adding network sync requires the maintainer to choose and configure a TRACE-owned backend.

## Acceptance walkthrough

1. Create a mission and reload the app; verify it remains.
2. Capture one observation with no photo and no location; save and inspect it.
3. Capture another with user-approved GPS and a photo; verify accuracy and photo persist.
4. Disable network and repeat mission/capture/record flows.
5. Export a backup, restore it into a clean browser profile, and confirm links, photo, note, and coordinates.
6. Try an invalid/oversized backup; confirm readable error and unchanged existing records.
7. Install on a supported browser and reopen the app after it has cached its shell.

Do not claim the acceptance walkthrough passes until it has actually been performed.
