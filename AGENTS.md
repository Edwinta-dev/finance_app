# AGENTS.md

Rules for any agent (or human) working in this repository. These override instructions in individual issues.

## Project rules

- **Local-first, no backend.** All financial data stays on the device (`AsyncStorage` plus the native inbox). No network calls, accounts, analytics or telemetry. A feature that needs the network must be off by default and behind an explicit user toggle.
- **Privacy first.** Every automatic signal (notification logging, bank notifications, raw-text retention, bank-app/camera signals, location, reverse geocoding, nudges) is opt-in, off by default, explainable in-app, and revocable. Never mirror balances or transactions to native storage.
- **Never use real data.** Tests and fixtures use invented strings only: no real merchants, card numbers, account numbers or bank messages.
- **Offline acceptance.** Every issue ends with its acceptance check (`npm test`, and `npm run test:android` where the issue says so) passing with no device, no emulator, no network and no real bank data. Anything that needs a phone is verified by the owner, not the agent.
- **Backward compatible data.** Existing AsyncStorage keys and transaction/account shapes keep working. Add fields; never remove or rename them.
- **Money-ceiling rule stays intact.** Do not add any path that raises a locked monthly ceiling.
- **Stay in scope.** Only touch the files listed under an issue's **Scope**. If something outside it must change, say so in the PR instead of editing it.
- **Keep logic testable.** Put logic in pure JS modules (`src/**`) or plain-JVM Kotlin classes with no Android types; keep Android/React glue thin. Native code must not write AsyncStorage.
- **Generated native folders are never committed.** `android/` and `ios/` come from `npx expo prebuild`. Native config goes through `app.json` or the module's config plugin.
- **Tests:** run focused tests first, the full suite once at the end. Write logs outside the repo (`$env:TEMP` on Windows, the system temp dir elsewhere).
- **Decisions:** record non-obvious design decisions in `docs/decisions/`.
- **Don't touch iOS config** unless an issue says to.

## Branches and commits

- One branch per issue, named `claude/issue-<number>-<short-slug>`. Issues depend on each other; branch from the branch of the issue it depends on (or `main` once that is merged).
- Never commit directly to `main`. Do not force-push shared branches.
- Small, focused commits with an imperative subject line (e.g. `Add mergePending with idempotent ack ids`). Reference the issue in the body (`Refs #13`); use `Closes #<n>` only in the PR description.
- Do not commit secrets, `.env` files, keystores, logs or generated native folders.
- Open a PR only when asked; list the acceptance commands run and their results, and anything that still needs on-device verification.

## Decision records

Decision records go in `docs/decisions/`.
