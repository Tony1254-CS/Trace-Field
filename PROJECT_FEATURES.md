# TRACE PWA — feature plan

## Product boundary

TRACE is a standalone field-observation PWA. This plan covers TRACE only. It must not include or depend on any other app, project, repository, API, design, route, or shared data model. All missions, observations, offline storage, and synchronization belong to TRACE. Follow AGENTS.md.

## Product in one sentence

TRACE helps an observer open a field mission, record what they can actually see, and safely preserve and submit that observation—even with unreliable connectivity.

## P0 — Build first

### 1. TRACE app shell and mission inbox

- App-style navigation optimized for phones; responsive on tablets and desktop browser sizes.
- Installable PWA with manifest, service worker, clear online/offline state, and sensible update behavior.
- Mission list shows only actual TRACE mission records and their real statuses.
- Search/filter only when backed by available data; no invented counts or activity badges.
- Seed/sample records are visibly labelled and never presented as real missions or visits.

### 2. Mission detail and target context

- Open a mission from a TRACE-owned route or QR code and retain its mission identifier throughout capture.
- Show target area, observation prompt, task, relevant date/time window, and provenance supplied with that mission.
- Explain missing target/source information and provide a recovery path.
- Never imply exact target alignment when location or mapping precision does not support it.

### 3. Guided observation capture

- Record supports, contradicts, inconclusive, or not observable.
- Add a note and optional photo.
- Capture time and GPS only with user intent and permission; show timestamp, GPS accuracy, denied permission, unavailable location, and manual-entry states clearly.
- Let the observer review the record before saving.
- Save the observation against the correct TRACE mission and display its current status.
- The observation is evidence for review, not automatic ground truth or verification.

### 4. Offline queue and TRACE synchronization

- Cache mission details needed for an explicitly available offline mission.
- Save observation drafts/records locally and preserve them across app restarts.
- Show queued, syncing, synced, and failed states; provide safe retry and recovery.
- Prevent duplicate submissions and data loss; preserve original captured values and timestamps.
- Sync only to TRACE's own configured backend. Never label an item synced without server confirmation.
- If the repository has no backend, document the missing dependency and deliver an honest local queue state; do not pretend cloud sync works.

### 5. Accessibility, usability, and field conditions

- Touch-friendly controls, readable outdoors, strong contrast, keyboard support, screen-reader labels, and reduced-motion support.
- Fast capture with clear progress and forgiving cancellation/retry.
- Handle loading, empty, offline, permission, storage, upload, and server error states.
- Keep the visual identity distinct, elegant, and restrained. No generic AI dashboard, fake metrics, gratuitous effects, or static showcase replacing real behavior.

## P1 — Only after the core works

- Point & Prove: optional camera/map target overlay, labelled approximate and paired with GPS accuracy/distance.
- Walk on the Radar: optional sound/haptic encoding of an identified, locally available measurement, with the numeric value and units visible. It is an encoding, not sound recorded in space.
- My Place Watch: follow a user-selected location with future observation timing only when derived from identified acquisition dates and cadence.
- Bangla guidance/audio: reviewed plain-language translation, with offline playback only when the audio is actually cached.
- Mission replay and Field Story: reconstruct from real TRACE mission/observation timestamps; sample records remain labelled.
- Pocket SAR Field Guide / Mini Lab: concise education separate from observation capture; explicitly label simulations.

## Exclude from TRACE scope

- Any separate dashboard, companion application, cross-product link, cross-product API, shared session, shared state, or synchronization with another project.
- Global atlas, multi-case observatory, or remote analysis dashboard unrelated to field missions.
- Satellite classification laboratory or algorithm controls that belong to another analysis product.
- Claims that submitted photos automatically verify an observation.
- Fake field telemetry, agent activity, accuracy/confidence scores, impact counts, or fabricated missions.
- Unsupported exact AR alignment, invented future pass countdowns, or simulations presented as collected measurements.

## Suggested TRACE walkthrough

1. Launch TRACE and inspect online/offline readiness.
2. Open a real TRACE mission from the inbox or a TRACE-owned QR/deep link.
3. Review the target and neutral observation prompt.
4. Capture supports/contradicts/inconclusive/not observable, add a note/photo, and inspect GPS accuracy and permissions.
5. Save while offline and show the persistent queue after restarting the app.
6. Restore connectivity, sync to TRACE's configured backend, and show the server-confirmed status.
7. Show the record as awaiting review; explain that capture does not equal verification.

If backend or real mission data is unavailable, label the limitation explicitly and do not stage a false successful sync or field validation.

## Release bar

The TRACE PWA must install, load a mission, capture a structured observation, preserve it offline, and synchronize it safely when its own backend is configured. Every shown record must be real or explicitly labelled as sample/simulated. The product must remain understandable, accessible, responsive, and stable during ordinary failure states.
