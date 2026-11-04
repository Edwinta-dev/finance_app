# 0002: Location on candidates — capture on tap, not background

**Status:** accepted (spike result)

## Options compared

| | Background location | Capture on tap (one-shot) |
|---|---|---|
| Permissions | `ACCESS_FINE/COARSE` **plus `ACCESS_BACKGROUND_LOCATION`** (separate, scarier prompt on Android 10+; on 11+ must be granted from system settings) | `ACCESS_COARSE/FINE_LOCATION` while the app is in use only |
| Battery | Continuous or periodic fixes all day, even when no payment happens | One fix per user action, a few seconds of work |
| Play policy | Background location needs a prominent disclosure, a declaration form and review; the core feature must plainly require it. A "place hint" is hard to justify | Foreground/while-in-use location with an in-app explanation is routine |
| Accuracy | Fix is from *before* the tap (could be stale or somewhere else), unless polled frequently | Fix is from the moment the user confirms, which is where they usually still are |
| Privacy | A location trail exists on the device | Only the confirmed item carries a point |

## Decision

**Capture on tap.** It is less intrusive on every axis and not clearly worse on accuracy (arguably better: the fix is taken when the user confirms). No `ACCESS_BACKGROUND_LOCATION` is requested.

## Consequences

- Capture is one-shot via `FusedLocationProviderClient.getCurrentLocation` at `PRIORITY_BALANCED_POWER_ACCURACY` (about city-block accuracy, low power).
- Where it runs: (1) in the app when the user confirms a candidate in the review list (reliable, app is foreground); (2) best-effort when a category button on the heads-up notification is tapped. Android may deny location to a background process, in which case the item is simply confirmed without a location. The owner should check how often (2) succeeds on the real phone.
- Separate opt-in (`locationCapture`), independent of notification/bank/camera signals. Optional rounding to ~100 m (`roundLocation`). Reverse geocoding (`reverseGeocoding`, uses the network via `Geocoder`) is its own toggle and defaults off; nothing calls the network otherwise.
- The point is attached as `location {lat, lng, accuracy, placeLabel?}` and carried onto the ledger transaction as an additive `location` field.
