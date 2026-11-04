# 0001: Native inbox with idempotent JS merge

**Status:** accepted

Native code (notification, tile, listeners) cannot safely write AsyncStorage, so it writes to a private SharedPreferences-backed inbox (`InboxStore`). JS pulls items with `getPending()` on load and when the app becomes active, merges them through `mergePending`, saves to AsyncStorage, and only then calls `ack(ids)`.

- **Idempotency:** merged transactions get the id `inbox-<pendingId>`. If the app dies between saving and acking, the next run sees the existing transaction, skips it and acks it again.
- **Statuses:** `confirmed` is merged; `unconfirmed` stays for the review flow; `rejected` is acked and dropped.
- **Accounts:** the item's `accountId` if it still exists, else the favourite account. With no accounts, items stay in the inbox.
- **Balances:** `applyTransactionsToAccounts` is shared with `handleLogTransaction`, so native-logged and in-app transactions move balances identically.
- **Storage seam:** `InboxStorage` lets the JVM tests use an in-memory fake; JSON uses `org.json` (test dependency `org.json:json`).

## Mirror (issue #14)

Native code reads categories and accounts from a separate SharedPreferences key (`mirror`) written by `setMirror(json)`. `buildMirror` whitelists `{outflowCategories, inflowCategories, accounts:[{id,name}]}` so balances and transactions can never leak into native storage. `createMirrorSync` debounces (500 ms) and skips unchanged payloads; the account effect depends on `accounts`, but balance-only changes produce an identical payload and are not re-sent.

## Logging notification (issue #15)

- **Amount entry:** Android shows at most three notification actions, and a single reply box can't be shared between buttons. Each of the top-3 category actions therefore carries its own `RemoteInput` (tap category, type amount, send). "Other" is the notification body tap, which deep-links to `minibudget://log?amount=&category=` (QuickLogModal). Deviation from the issue text: "Other" is not a fourth action button.
- **Opt-in:** the feature is off until the user accepts a one-time prompt (or the later Settings toggle). The flag is stored natively (`Settings`) so `BootReceiver` can restore the service without JS.
- **Foreground service type:** `specialUse` with a declared subtype; allowed to start from `BOOT_COMPLETED` on Android 15.
- **Re-post on swipe:** `setDeleteIntent` starts the service with `ACTION_REPOST`, which re-posts the notification.
- **Manifest:** permissions and components live in the module's own `AndroidManifest.xml` (merged at build), not in generated `android/`.

## Quick Settings tile (issue #16)

`LogTileService` only launches `DeepLink.log()`, the same link as the notification's "Other" path, so the logging UI, parsing and inbox writing exist in one place. The tile is declared in the module manifest, is a launcher (inactive state, no toggle), and does not depend on `LoggingService` running. New pure helper `DeepLink` is unit tested. Users add the tile from the Quick Settings edit screen.

## Bank notification parser (issue #17)

- **Double opt-in:** the listener is declared in the manifest but is inert until (1) the user grants Notification Access in system settings and (2) the in-app `bankNotifications` flag is on. Packages not in `BankConfig` are dropped before their text is read.
- **Candidates only:** matches are written as `status: unconfirmed`, `source: "bank_notification"`, `confidence` from the template, `category: ""`, merchant in `memo`. They are never merged into the ledger until confirmed (issue #18).
- **Raw text** is stored only with the separate `keepRawText` flag.
- **Idempotent ids:** `bank-<pkg>-<postTime>-<textHash>`, so a re-posted notification collapses to one item.
- **Templates** live in `templates/` per bank (DBS/POSB, OCBC, UOB, PayLah). Fixtures are invented; the real wording and the default package names are best guesses and must be checked against the real apps on the owner's phone.

## Confirmation prompt and review list (issue #18)

- **Buttons:** Android shows at most three notification actions, so the heads-up has the user's top two categories plus "Not mine" (the issue's example listed four). The body tap opens `minibudget://review` and plays the "Other" role. Inflow candidates offer the first two inflow categories.
- **Amount-less hints** (bank+camera, issue #19) only offer "Not mine" in the notification; the amount is typed in the review list.
- **Native resolution:** a category tap sets the inbox item to `confirmed` with that category; "Not mine" sets `rejected`. JS merges confirmed items and acks rejected ones on the next load/resume (`mergePending`).
- **In-app review:** `resolveCandidate` (pure) confirms through `mergePending` + `applyTransactionsToAccounts`, i.e. the same transaction shape and balance effect as `handleLogTransaction`, then `App.js` saves to AsyncStorage and only afterwards acks. It does not call `handleLogTransaction` itself because that function reads the quick-log form state and doesn't await its save.
- A "Review (n)" tab appears only while candidates are waiting.

## Bank-app + camera signal (issue #19)

- **Detection:** `UsageSignalMonitor` polls `UsageStatsManager` every 5 s for bank-app foreground events and listens to `CameraManager.AvailabilityCallback` for camera use. No AccessibilityService. It needs the user to grant Usage Access and to switch on `bankCameraSignals`; `SignalService` (foreground, `specialUse`) hosts it and shows a minimal-importance notification so the background work is visible.
- **Decision logic:** `SignalCorrelator` (plain JVM) pairs each camera use with at most one later bank-app open inside the window (default 2 min; configurable via `setSignalWindowMs`). Result: `status: unconfirmed`, `source: "bank_camera"`, `amount: 0` (no amount known), `confidence: 0.3`. Duplicated camera callbacks within 2 s collapse into one.
- **Bank packages** reuse `BankConfig` (same native list as the notification parser); an empty list disables the signal.
- **Limits:** polling means a bank app opened and closed between polls is missed; accepted for a weak hint. Real package names and the camera-callback behaviour need checking on a device.

## Dedupe, nudges and daily summary (issue #21)

- **Dedupe** (`src/inbox/dedupe.js`, pure): items cluster when they are within the window (default 10 min, inclusive) of the cluster's earliest item and have the same amount and direction. The highest-confidence item wins; a missing category/location/account/memo is filled from the others, and a member the user already confirmed confirms the merged item. Rejected items are never merged, so a duplicate can't resurrect a rejection. `dedupePlan` also returns the dropped ids; `App.js` acks them so duplicates leave the native inbox.
- **Amount-less hints** (bank+camera) are absorbed by an amounted item inside the window and never change its amount. A hint alone stays a hint. This is a judgement call: the issue says "same amount", but a hint has none, and leaving it separate would defeat the point of merging the three signals. Easy to tighten if it merges too eagerly.
- **Nudge** (`NudgePolicy.kt`, pure): once `nudgeMinutes` (default 5) have passed since a bank-app session ended, nudge unless something was logged between the session start and that deadline; sessions under 3 s are ignored. "Logged" comes from `LogTimes`, fed by the notification logger, notification confirmations and, via `noteLogged`, in-app logging. Nudges are their own opt-in (`nudges`) and need Usage Access, since session ends come from the same usage monitor.
- **Daily summary:** inexact daily alarm around 20:00 local time; the notification is skipped when the unconfirmed count is zero. Re-armed after reboot.

## Settings and compliance (issue #22)

- **Single source of truth:** `src/settings/signals.js` lists every signal with its title, plain-language explanation, permission step, parent (`dependsOn`) and the inbox source it can clear. `SettingsScreen` renders from that list, so a signal cannot exist without a toggle and explanation (`__tests__/settings.test.js`).
- **Persistence and gating:** toggles are stored natively (`Settings`) and every service/listener checks its flag before doing work; children (raw text, location blur, reverse geocoding) are also gated by their parent. Switching a parent off switches its children off and stops the service (`LoggingService`, `SignalService`) or listener processing.
- **Clearing:** turning off the bank-notification or bank+camera signal offers "Delete waiting suggestions", implemented natively as `InboxStore.clearUnconfirmed(sources)`; confirmed items are never touched.
- **Usage Access flow:** the system screen can't report back, so on return to the foreground the app re-asserts already-enabled usage-based signals, which starts the monitor once access exists.
- **Settings entry:** a gear in the header, shown only where the native module exists (Android dev client / release build).
