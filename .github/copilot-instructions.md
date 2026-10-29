# TRACE repository instructions

Follow AGENTS.md as the project contract and PROJECT_FEATURES.md as the feature-by-feature build spec.

This repository is for the standalone TRACE PWA only. Keep all implementation, mission data, routes, and storage inside TRACE. The current release is local-only: do not add or imply a server, account, cloud sync, or second product.

Before editing, inspect the current code and data. All displayed mission/evidence values must come from real local records or be labelled sample/simulated. Do not fake GPS, sync, field validation, metrics, counts, or observations. Treat unreviewed records as evidence awaiting human review.

Deliver complete accessible app flows with persistent offline behavior, tested backup/restore, and recoverable error states. Ask the maintainer before adding external services, new personal-data collection, or changing the product boundary. Run applicable existing checks and report exact outcomes; never claim unrun checks passed.
