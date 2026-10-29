# TRACE

TRACE is a standalone, installable field-observation PWA. Create a mission, capture an observation, and keep the record on the current device—even offline.

## What works

- Create, edit, archive, and reopen field missions.
- Capture one of four responses, a note, optional photo, and optional GPS position with reported accuracy.
- Keep drafts, missions, and observations in IndexedDB.
- Search/filter saved notes and inspect a full record.
- Export a versioned JSON device backup and restore it without losing record-to-mission links or photos.
- Load the app shell offline after the first successful visit.

## Data and privacy

TRACE v1 is local-only. It has no account, backend, or network sync. Missions and observations live in this browser on this device. Clearing browser storage can delete them; export a backup before switching devices or clearing data. A local save is never shown as a server submission or verification.

Location is requested only after tapping the location control. A photo is attached only when the user chooses one.

## Run locally

Serve the repository over localhost; opening index.html directly with file:// does not enable service workers or PWA install behavior.

```powershell
python -m http.server 4173
```

Then open http://localhost:4173. No package install or build step is required.

## GitHub checks

The TRACE quality workflow runs on every push and pull request. It checks JavaScript syntax, the PWA manifest, icon assets, and app-shell references. To prevent a failing check from merging, require the “Validate TRACE PWA files” status in a GitHub branch ruleset. Copilot code review is a separate review service and must be enabled in repository/account settings; it can comment on pull requests but does not automatically repair code.

See .github/COPILOT_REVIEW_SETUP.md for the remaining GitHub review settings.
