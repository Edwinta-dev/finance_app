# Google Play declarations — draft texts

Drafts to adapt in Play Console. MiniBudget is local-first: **no backend, no account, no analytics, no ads**. Every capture feature is opt-in, off by default and explained in-app (Settings → Automatic signals). Package names and bank notification wording should be re-checked on a real device before submitting.

## Notification listener (Notification Access)

**Core purpose:** Let the user turn notifications from their own bank apps into suggested transactions.

> MiniBudget uses a notification listener only after the user (1) turns on "Read bank notifications" in the app and (2) grants Notification Access in system settings. The listener ignores every app except a short list of banking apps (DBS/POSB, OCBC, UOB, PayLah). For those apps it looks for an amount and merchant in the notification text and creates a *suggested* transaction that the user must confirm or reject. Original text is stored only if the user separately turns on "Keep original notification text". Notification content is processed and stored on the device only and is never sent anywhere. Turning the setting off stops processing and the user can delete waiting suggestions.

**In-app disclosure:** shown next to the toggle in Settings before the system screen opens.

## Usage access (`PACKAGE_USAGE_STATS`)

**Core purpose:** Notice when a bank app is opened, to suggest logging a payment and to remind the user if nothing was logged.

> With the user's opt-in ("Bank app + camera hints" and/or "Reminders") and Usage Access granted in system settings, MiniBudget checks every few seconds which app is in the foreground. It only reacts when that app is one of the configured banking apps. It does not read screen contents, other apps' data or usage history, and does not use an Accessibility Service. Results are used to create a low-confidence suggestion or a reminder and stay on the device.

## Foreground service (`specialUse`)

**Subtype text declared in the manifest:** "User-enabled ongoing notification for logging spending from the lock screen" and "User-enabled detection of a bank app opening shortly after camera use, to suggest logging a payment".

> MiniBudget runs a foreground service only for features the user switched on: (a) a persistent notification with category buttons for logging spending from the lock screen, and (b) a lightweight watcher for the bank-app hint and reminders. Both show a visible notification, stop when the feature is turned off, and restart after reboot only if the user enabled them. No existing foreground service type fits an on-demand personal logging shortcut, hence `specialUse`.

## Location

**Core purpose:** Attach an approximate place to a transaction the user confirms, to help them recognise it later.

> MiniBudget requests approximate/precise location only when the user turns on "Add a place to confirmed payments". A single location fix is taken at the moment the user confirms a suggestion; it is never collected continuously or in the background (`ACCESS_BACKGROUND_LOCATION` is not requested). The user may blur saved locations to about 100 m. Place names are looked up with the system geocoder only if the user separately turns on "Look up place names", which sends coordinates to the device's geocoding service. Locations are stored on the device and are not shared.

## Data safety form

| Question | Answer |
|---|---|
| Does the app collect or share any required user data types? | **No data collected, no data shared** with the developer or third parties. All data is processed and stored on the device. |
| Is all data encrypted in transit? | Not applicable: nothing is transmitted to the developer. (If the user enables place-name lookup, the coordinates are sent by the system geocoder to its provider; this is user-initiated, optional and off by default.) |
| Can users request that data be deleted? | Yes: data lives only on the device. Users can delete transactions in the app, delete waiting suggestions per signal in Settings, or clear app data / uninstall. |
| Financial info (transactions, balances) | Stored locally only; not collected by the developer. |
| Location | Approximate/precise, optional, on-device only, not shared. |
| App activity / other apps' notifications | Read on-device only for opted-in bank apps; not collected or shared. |
| Security practices | Data stays in the app's private storage; no accounts or servers. |
| Privacy policy | Required for the listing; it should restate the points above (local-only, opt-in features, no sale or sharing of data). |

## Review checklist

- [ ] Prominent in-app disclosure appears **before** each system permission screen (Settings does this via the explanation under each toggle).
- [ ] A screen recording shows the opt-in flow, the foreground-service notification and where each feature is turned off.
- [ ] Declared permissions in the release manifest match this list: `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `RECEIVE_BOOT_COMPLETED`, `PACKAGE_USAGE_STATS`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, notification listener and Quick Settings tile services.
- [ ] Bank package names and templates verified on a device with the real apps.
