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
