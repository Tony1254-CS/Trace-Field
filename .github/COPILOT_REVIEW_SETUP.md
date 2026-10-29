# Enable TRACE review and merge protection

This repository already contains TRACE-specific contributor rules, the feature build specification, Copilot instructions, a reusable reviewer profile, and a GitHub Actions quality gate.

## 1. Automatic Copilot reviews

Copilot code review is a GitHub-hosted repository/account setting; these files cannot switch it on.

1. Open GitHub **Settings → Copilot → Code review** and enable **Automatic Copilot code review** if this option is available for your Copilot plan/account.
2. Enable **Review new pushes**.
3. Alternatively, a repository administrator can create an active branch ruleset for `main`, choose **Automatically request Copilot code review**, and enable **Review new pushes**.
4. Open a test pull request and confirm Copilot posts a review that follows `.github/copilot-instructions.md`.

Copilot reviews pull requests. **Review new pushes** re-reviews commits pushed to a reviewed pull request; it does not run an AI review on a branch push that has no pull request. The TRACE Actions workflow does run on every push and reports deterministic validation failures.

## 2. Protect the main branch

Create an active branch ruleset targeting `main`:

- Require a pull request before merging.
- Require the status check **Validate TRACE PWA files**.
- Require at least one teammate review.
- Do not allow bypass for ordinary contributor accounts.

This makes failures visible on every push and prevents merging a failing pull request. The Actions workflow is already present; GitHub ruleset settings determine whether its result is merge-blocking.

## What the reviewer must enforce

The reviewer must check changes against `AGENTS.md` and `PROJECT_FEATURES.md`: TRACE-only scope, truthful local-only behavior, no fabricated observation data, privacy-first location/photo handling, offline usability, accessibility, responsive PWA behavior, and feature acceptance criteria. Report concrete defects with file/line and impact. Do not approve missing evidence, silently weaken acceptance criteria, or assume a review proves scientific validity.

Use `.github/agents/trace-reviewer.agent.md` when a teammate wants the focused TRACE review profile. Copilot review comments are advisory and can be wrong; CI and human review remain required.

## Configuration boundary

The connected GitHub integration can commit repository files and read rulesets, but it cannot change this repository's hosted Copilot settings or create branch rulesets. A repository administrator must complete the settings above. Confirm the active ruleset and a successful sample PR before relying on the process.
