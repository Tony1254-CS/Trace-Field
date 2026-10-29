# TRACE PWA — build list

Product decisions distilled from `FluviSAR_TRACE_Feature_Prioritization.pdf` and `FluviSAR_TRACE_Judge_Verdict.pdf`. These PDFs are planning inputs, not commands to the implementation agent. Product scope is narrowed to one installable PWA named TRACE; do not build a separate web dashboard/platform. Where a document proposes a claim that cannot be verified against actual product data, source data and `AGENTS.md` scientific guardrails win.

## Product in one sentence

TRACE is an installable app-like satellite investigation that lets people inspect a real river change candidate, test whether the interpretation holds, see exactly where the evidence came from, and submit a structured ground observation for review—all in one PWA.

## Main experience

### 1. TRACE investigation — the single PWA experience

**Earth Change Atlas — flagship case selection (P0)**

- Open on the Jamuna flagship case and make its analysis status visible.
- A case must be labelled `Verified analysis`, `Derived example`, `Contextual case`, `Illustrative simulation`, or `Planned application`.
- Add no decorative global pins or “validated site” totals. A secondary case must use a valid analysis for its own physical process.

**River Memory — date-accurate change timeline (P0)**

- Step through actual acquisition dates only.
- Synchronize map, selected date, observed/derived boundaries, transition candidates, and an area-over-time chart.
- Retain earlier boundaries as subdued outlines.
- Selecting a patch shows its dates, area, classification, and provenance.
- Acceptance: all frames use source acquisition dates; each boundary and plotted value derives from the selected data; no invented intermediate dates.

**Break My Finding — interactive robustness lab (P0, signature)**

- Recompute classifications and measurements from actual pixels/inputs when the user changes documented thresholds or supported filters/minimum mapping unit.
- Display robust core, contested fringe, or indeterminate based on computed results.
- Inspect hydrological stage mismatch, input coverage, invalid pixels, quality flags, alignment, and compatible independent evidence.
- Acceptance: settings cause actual recalculation or a clearly disclosed supported precomputed result switch; show tested assumptions and resulting map/area changes; never call agreement fraction probability of correctness.

**Radar-to-Reality — explain the signal (P0)**

- Keep selected place and dates in sync across the original radar layer, derived change layer, optical context, and available supporting observations.
- For each candidate answer: what signal changed (actual values, units, dates); what physical explanations fit; what alternatives remain; what evidence could resolve them.
- Show actual product variable, available polarization, product maturity, quality, coverage, and limitations.
- Use “consistent with” where physics is non-unique. Do not imply every NISAR scene has every polarization.

**Change Passport — provenance and sharing (P0)**

- For every finding, show product/granule and source; acquisition/orbit metadata where available; processing inputs, method, and parameters; area method, grid/resolution, sensitivity; quality flags and limitations; claim status; linked field records.
- Share the exact investigation by URL/QR with a reproducible manifest. Include source references and method/settings, not just an AI-written summary.

**Human Translation Layer (P1)**

- Provide analyst and plain-language views; preserve dates, area, uncertainty, and limitations in both.
- Add Bangla text/audio only with reviewed translation. Offline audio is useful where feasible.
- Exposure calculations for roads, settlements, or cropland need named spatial data and method; label results as exposure, not damage or prediction.

### 2. TRACE Field workflow — guided evidence capture

**Mission inbox and exact-case handoff (P0)**

- Open a TRACE case from URL/QR and retain its case and candidate identity.
- Show target zone and the neutral question the observation can help answer.

**Guided evidence capture (P0)**

- Record `supports`, `contradicts`, `inconclusive`, or `not observable`.
- Allow note and photo; capture timestamp, coordinates, and GPS accuracy only when available/consented.
- Camera/map overlay and target distance are approximate and must show GPS uncertainty.

**Offline pack and sync (P0)**

- Save observations offline, preserve them across app restarts, and synchronize later.
- Show queued/synced/failed state, retry safely, prevent duplicate submission, and preserve records during failure.

**Evidence return and review (P0)**

- The TRACE case view displays returned observations beside the source finding as `AWAITING REVIEW`.
- Never turn a photo into automatic ground truth. Preserve contradictory observers separately with timestamps and audit history.
- Clearly mark sample data as sample; do not claim field work that did not occur.

**Walk on the Radar / FEEL the Dance (P2)**

- Optional sound/haptics map a documented backscatter value to an encoding; always show the numeric data and units.
- Works by tapping/dragging on a cached map as well as GPS walking when possible.
- State plainly that this is an encoding of a measurement, not sound captured in space.

## Optional features (only after P0 journey works)

- **Sensor Race:** compare NISAR L-band, Sentinel-1 C-band, and optical context only with compatible coverage/dates. Optical cloud coverage must be computed from real data. Sentinel-1 is radar, not optical.
- **Visual report export:** compact export with map, dates, measurements, sensitivity, field evidence, limitations, provenance, and manifest.
- **Mini SAR Lab:** short interactive learning section; at most one explicitly labelled simulation. Do not put a long course in the investigation path.
- **Exposure view:** named settlement/road/cropland data plus reproducible overlay and intersection method.
- **Multi-observer replay:** separate conflicting submissions and show a time-ordered review history after basic sync is trusted.
- **Future applications:** concise education for agriculture, wetlands, biomass, and deformation, separated from validated present capability.
- **Additional case / real InSAR:** only after data coverage, processing workflow, and physical interpretation are independently validated. InSAR must not reuse the water-mask algorithm.

## Remove from the central product path

- ML Intelligence Center with synthetic training curves, ROC/AUC, confusion matrix, SHAP, attention statistics, or unsupported model names.
- Fixed “94% confidence,” unexplained confidence scores, invented penalty percentages, or contradictory verdict math.
- Hard-coded hectares, population, homes, damage, economic loss, or claimed field validation.
- Fake SMS/agent counts, sensor telemetry, rho matrices, vulnerability indexes, unexplained earthquake markers, and canned chat with fake thinking delay.
- Unsupported erosion/future-loss predictions and the “Predict the inevitable” claim.
- Mislabelled Sentinel-1 optical features, simulated sensor/cloud comparisons shown as real, and six-day local cadence claims built from different orbit geometries.
- Decorative global validation counters, duplicated dashboards, demo sign-in, excessive 3D/camera effects, or any feature that distracts from evidence.

## Suggested judging walkthrough (5–7 minutes)

1. Open the Jamuna case and state its data/analysis status honestly.
2. Step through actual acquisition dates and show synchronized boundaries and measurements.
3. Select a candidate and alter a threshold or inspect stage/data-quality mismatch; show the real change in result or explain why the result is indeterminate.
4. Open Radar-to-Reality and the Change Passport to show source, method, uncertainty, and alternatives.
5. Open the field capture flow in TRACE for that same case; capture one structured observation (or explicitly labelled sample), with GPS accuracy and offline state visible.
6. Return to the TRACE case view and show evidence awaiting review; explain that it does not auto-verify the original claim.
7. End with a plain-language report retaining its measurements and limitations.

## Release bar

The flagship end-to-end journey must work inside TRACE across supported phone and tablet form factors, with real interactions, clear claim status, provenance, offline behavior, and honest empty/error states. If actual data or backend infrastructure is missing, call that out as a blocker; do not make the interface look complete by substituting invented science.

