# TRACE PWA — project contract

## Product boundary (hard rule)

TRACE is one standalone, installable, mobile-first Progressive Web App for field missions and ground observations. TRACE owns its navigation, mission records, evidence, offline queue, synchronization, and user experience.

Keep this repository and every feature in it focused only on TRACE. Do not import, copy, describe, depend on, link to, call, or synchronize with another product, project, repository, API, screen, route, design system, or data model. Do not create a second product surface. Mission URLs and QR codes, when implemented, must resolve to TRACE-owned mission records and TRACE routes. If a proposed feature or dependency crosses this boundary, stop and ask the human maintainer before proceeding.

Do not infer TRACE requirements from materials describing another product. If the repository lacks a TRACE-specific requirement or data source, state the gap; do not fill it with features from elsewhere.

## Mission

Build a working, polished mobile-first PWA named TRACE for field teams and community observers to receive a field mission, record a structured observation with clear location/time accuracy, preserve it offline, and synchronize it safely to TRACE's own storage when connectivity returns.

The product should be simple to understand, app-like, responsive, accessible, and useful outside a staged demo. Quality comes from a reliable evidence-capture workflow and clear data provenance, not screen count or theatrical dashboards.

## P0 — Required app capabilities

### Mission inbox and mission detail

- Provide a clear mission list with real mission status and useful search/filtering when the data supports it.
- Open a specific mission from a TRACE-owned deep link or QR code and preserve its identity through the capture flow.
- Show the mission's target area, task, observation prompt, relevant dates, and source/provenance when supplied.
- Clearly label sample/seed missions. Never imply a mission or field visit happened when it did not.
- Missing or invalid mission context must produce an understandable recovery path, not a fabricated default.

### Guided field observation

- Let an observer submit one of: supports, contradicts, inconclusive, or not observable.
- Capture a note and optional photo. Capture timestamp and coordinates only with clear user intent/permission; show GPS accuracy and location unavailable states.
- Preserve submitted values exactly, associate them with the correct TRACE mission, and show a review/sync status.
- A photo or observation is evidence for review; it is not automatic ground truth or scientific verification.
- If an AR/camera/map overlay is implemented, disclose approximate alignment and location accuracy. Never imply exact positioning without evidence.

### Offline-first storage and synchronization

- Core mission viewing and evidence capture must work offline for missions explicitly available on the device.
- Persist queued observations across app restarts. Show pending, syncing, synced, and failed states.
- Synchronize only with TRACE's own configured backend/service. Make retries safe and idempotent; do not lose, duplicate, or silently rewrite records.
- Explain permission, storage, connectivity, upload, and conflict failures in plain language with a recovery action.
- Never claim successful sync until the server confirms it. Do not silently mark an observation verified after upload.

### PWA foundation and app UX

- Provide installability, app manifest, service worker/offline behavior, responsive app navigation, safe-area handling, touch-sized controls, and accessible keyboard/screen-reader interactions.
- Make phone use the primary experience. Adapt to tablet and desktop browser sizes without adding a separate product or dashboard.
- Implement loading, empty, permission-denied, offline, and error states for each core flow.
- Use a distinctive, restrained visual system. Avoid generic AI/SaaS dashboard templates, metric-card walls, gratuitous gradients/glows, decorative 3D, and motion that distracts from field work.
- Keep each screen's purpose and next action clear. Keep capture fast and forgiving under poor connectivity and outdoor use.

## P1 — Helpful TRACE features after P0 is reliable

- Point & Prove: optional approximate camera/map overlay of a TRACE mission target, distance and GPS accuracy shown honestly.
- Walk on the Radar: optional interaction that sonifies a locally available, documented measurement; display the value and units. State clearly that sound/haptics encode data and were not recorded in space. If real data is not available, do not fake the experience.
- My Place Watch: optional user-selected place/mission follow-up with next-pass timing only when computed from identified acquisition data and cadence.
- Bangla voice and plain-language guidance: add reviewed translations; cache generated/recorded audio only when its source and availability are clear.
- Field story and mission replay: produce a time-ordered account from actual TRACE mission and observation records; label sample records.
- Pocket SAR Field Guide / Mini Lab: brief educational material. Label any simulation and keep it separate from real observations.

These are optional and must not delay the working offline capture loop.

## Data integrity, privacy, and science

- Trace every displayed date, coordinate, accuracy, measurement, status, and count to a TRACE record or identified data source.
- Distinguish measured, derived, cross-checked, unverified, sample, and simulated information wherever relevant.
- Never fabricate field observations, telemetry, messages sent, confidence scores, validation rates, model metrics, impact totals, or mission activity.
- Do not present a surface-change interpretation as confirmed ground truth based on a single photo or an unreviewed report.
- Preserve competing observations separately with provenance and timestamps.
- Request only the photo/location/device permissions needed for a user-initiated action. Explain why, offer a path when denied, and avoid retaining unnecessary personal data.
- Do not introduce external services, trackers, or data transfers without documenting purpose, consent, privacy implications, and maintainer approval.
- Use authoritative current sources for technical or mission facts shown in the app. State uncertainty and missing evidence clearly.

## Agent workflow and approval

1. Inspect the repository, stack, data sources, existing backend, PWA setup, and run instructions before planning.
2. Keep the implementation inside the TRACE PWA boundary. Do not reuse another product's screens, state, routes, APIs, branding, or requirements.
3. Implement complete vertical slices with real state, persistence, error/empty/offline handling, and documentation. A static mock or disconnected screen is not complete.
4. Preserve existing work. Do not silently delete user data or established behavior.
5. Ask the human maintainer before changing product scope, crossing a product boundary, introducing a new external service, changing evidence semantics, or collecting additional personal data. Present the alternative, evidence, trade-offs, and impact.
6. If required data/backend details are missing, identify the dependency and continue independent work without inventing facts.
7. Before reporting completion, run relevant existing checks and report exact commands and results. Add tests for new behavior when the repository has a test setup. Never claim an unrun check passed.
8. PRs must describe user-visible behavior, data sources/provenance, sample or simulated content, validation performed, limitations, privacy effects, and visual evidence for UI changes.

## Definition of done

A feature is complete only when its whole TRACE user path works on supported devices; stored information is real or explicitly labelled; location/photo permissions and denial states are handled; offline behavior and recoverable sync failures work; accessibility is addressed; and applicable repository checks pass. The core mission-to-capture-to-persistent-queue-to-TRACE-sync flow must work end to end.
