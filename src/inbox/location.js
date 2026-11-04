// src/inbox/location.js
// Shape helpers and the opt-in capture wrapper for candidate locations.

/** Returns `{lat, lng, accuracy?, placeLabel?}` or null if the value is not a usable location. */
export const normalizeLocation = (loc) => {
  if (!loc || typeof loc !== 'object') return null;
  const { lat, lng, accuracy, placeLabel } = loc;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const out = { lat, lng };
  if (Number.isFinite(accuracy) && accuracy >= 0) out.accuracy = accuracy;
  if (typeof placeLabel === 'string' && placeLabel.trim() !== '') out.placeLabel = placeLabel.trim();
  return out;
};

/**
 * Captures a one-shot location only when the user opted in and granted permission.
 * Never throws; resolves null when off, refused or unavailable.
 */
export const captureLocationIfEnabled = async ({ isEnabled, requestPermission, capture }) => {
  try {
    if (!(await isEnabled())) return null;
    if (!(await requestPermission())) return null;
    return normalizeLocation(await capture());
  } catch (e) {
    return null;
  }
};
