# 0001: Native inbox with idempotent JS merge

**Status:** accepted

Native code (notification, tile, listeners) cannot safely write AsyncStorage, so it writes to a private SharedPreferences-backed inbox (`InboxStore`). JS pulls items with `getPending()` on load and when the app becomes active, merges them through `mergePending`, saves to AsyncStorage, and only then calls `ack(ids)`.

- **Idempotency:** merged transactions get the id `inbox-<pendingId>`. If the app dies between saving and acking, the next run sees the existing transaction, skips it and acks it again.
- **Statuses:** `confirmed` is merged; `unconfirmed` stays for the review flow; `rejected` is acked and dropped.
- **Accounts:** the item's `accountId` if it still exists, else the favourite account. With no accounts, items stay in the inbox.
- **Balances:** `applyTransactionsToAccounts` is shared with `handleLogTransaction`, so native-logged and in-app transactions move balances identically.
- **Storage seam:** `InboxStorage` lets the JVM tests use an in-memory fake; JSON uses `org.json` (test dependency `org.json:json`).
