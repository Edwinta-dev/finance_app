// src/inbox/notificationSettings.js
// Opt-in flow for the ongoing logging notification: runtime permission, then native enable.

export const NOTIF_PROMPTED_KEY = '@budget_notif_prompted';

/** Android 13+ (API 33) needs POST_NOTIFICATIONS at runtime; older versions grant it implicitly. */
export const requestNotificationPermission = async ({ os, version, request, permission }) => {
  if (os !== 'android') return false;
  if (Number(version) < 33) return true;
  const result = await request(permission);
  return result === 'granted';
};

/**
 * Requests the permission, then switches the native notification on.
 * Returns true when logging is enabled; leaves it off if permission is refused.
 */
export const enableNotificationLogging = async ({ native, permissionEnv }) => {
  const granted = await requestNotificationPermission(permissionEnv);
  if (!granted) return false;
  await native.setLoggingEnabled(true);
  return true;
};

export const disableNotificationLogging = async ({ native }) => {
  await native.setLoggingEnabled(false);
};
