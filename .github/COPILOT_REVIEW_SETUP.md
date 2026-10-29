# Turn on automatic push-by-push review

The repository files define the product contract and reviewer behavior. GitHub account/repository settings must also enable Copilot code review; a Markdown agent profile cannot turn on a hosted service by itself.

1. Add these files to the default branch: `AGENTS.md`, `PROJECT_FEATURES.md`, `.github/copilot-instructions.md`, `.github/agents/fluvisar-reviewer.agent.md`, and `.github/pull_request_template.md`.
2. In the repository on GitHub, open **Settings → Rules → Rulesets** and create or edit a ruleset targeting the branches your team uses.
3. Enable automatic code review by GitHub Copilot for the repository and select **Review new pushes** so new commits to an open pull request trigger another review.
4. Require the project's real CI checks and at least one human teammate review before merging. Copilot review is a critical second reviewer, not scientific ground truth or a substitute for a human sign-off.
5. Confirm Copilot code review and (if used) Copilot cloud agent are enabled for the repository/account/organization. Availability can depend on plan and administrator settings.
6. Confirm a test pull request receives a Copilot review that reflects the project instructions. The review uses instruction files from the PR's head branch, so include those files before relying on the reviewer for that PR.

## What this does and does not guarantee

Automatic Copilot review runs on pull requests, and the `Review new pushes` option re-reviews new commits to an open PR. It does not review arbitrary direct pushes to a branch that have no PR. Protect the default branch and require PRs if every change must receive review. A review is probabilistic: CI, human review, source-data checks, and reproducible analysis remain necessary.

Repository settings are outside these source files, so a repository administrator must complete steps 2–5. See [GitHub's current instructions for automatic reviews and reviews on new pushes](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-code-review#enabling-automatic-reviews) and [custom review instructions](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-code-review#customizing-copilots-reviews-with-custom-instructions).

