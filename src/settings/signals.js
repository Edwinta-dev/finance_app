// src/settings/signals.js
// Every automatic signal: opt-in, off by default, explained in plain language, revocable.
import { SETTING_KEYS } from '../../modules/quick-log';

export const SIGNALS = [
  {
    key: SETTING_KEYS.notificationLogging,
    title: 'Lock-screen logging notification',
    explanation:
      'Shows a persistent notification with your top categories so you can log spending in two taps. It runs a small foreground service and needs the notification permission. Nothing is read from other apps.',
    permission: 'notifications',
  },
  {
    key: SETTING_KEYS.bankNotifications,
    title: 'Read bank notifications',
    explanation:
      'Lets MiniBudget read notifications from your bank apps (DBS/POSB, OCBC, UOB, PayLah) to suggest transactions. Only the configured bank apps are read; other apps are ignored. Suggestions always wait for your confirmation. Needs Notification Access in system settings.',
    permission: 'notificationAccess',
    clearSource: 'bank_notification',
  },
  {
    key: SETTING_KEYS.keepRawText,
    title: 'Keep the original notification text',
    explanation:
      'Stores the original bank notification text next to each suggestion so you can check it. Off by default; when off, only the amount and merchant are kept. The text never leaves your phone.',
    dependsOn: SETTING_KEYS.bankNotifications,
  },
  {
    key: SETTING_KEYS.bankCameraSignals,
    title: 'Bank app + camera hints',
    explanation:
      'Notices when you open a bank app shortly after using the camera (for example after scanning a QR code) and asks if you just paid. It sees which app is in the foreground, not what is on screen. Needs Usage Access in system settings.',
    permission: 'usageAccess',
    clearSource: 'bank_camera',
  },
  {
    key: SETTING_KEYS.locationCapture,
    title: 'Add a place to confirmed payments',
    explanation:
      'When you confirm a suggestion, saves your approximate location once so you can recognise the payment later. Only taken at that moment, never in the background. Needs the location permission.',
    permission: 'location',
  },
  {
    key: SETTING_KEYS.roundLocation,
    title: 'Blur location to about 100 m',
    explanation: 'Rounds saved locations to a roughly 100 m grid so the exact spot is not stored.',
    dependsOn: SETTING_KEYS.locationCapture,
  },
  {
    key: SETTING_KEYS.reverseGeocoding,
    title: 'Look up place names (uses the network)',
    explanation:
      'Turns a saved location into a place name using your phone\'s geocoder, which contacts an online service and sends the coordinates. This is the only feature that uses the network. Off by default.',
    dependsOn: SETTING_KEYS.locationCapture,
  },
  {
    key: SETTING_KEYS.nudges,
    title: 'Reminders',
    explanation:
      'Reminds you if you leave a bank app and log nothing within a few minutes, and sends a daily summary of payments waiting for confirmation (skipped when there are none). Needs Usage Access to notice bank-app use.',
    permission: 'usageAccess',
  },
];

export const SIGNAL_KEYS = SIGNALS.map((s) => s.key);
const byKey = (key) => SIGNALS.find((s) => s.key === key);

/** All values off. */
export const defaultValues = () => Object.fromEntries(SIGNAL_KEYS.map((k) => [k, false]));

/** A signal is active only if it is on AND the signal it depends on is active. Off means gated. */
export const isActive = (key, values) => {
  const signal = byKey(key);
  if (!signal || !values[key]) return false;
  return signal.dependsOn ? isActive(signal.dependsOn, values) : true;
};

/** Keys that depend (directly or indirectly) on `key`. */
export const dependentsOf = (key) =>
  SIGNALS.filter((s) => s.dependsOn === key).flatMap((s) => [s.key, ...dependentsOf(s.key)]);

export const loadValues = async (native) => {
  const values = defaultValues();
  for (const key of SIGNAL_KEYS) {
    try { values[key] = !!(await native.getSetting(key)); } catch (e) { values[key] = false; }
  }
  return values;
};

/**
 * Turns one signal on or off and returns the new values.
 * - On: runs the permission step for that signal first; if it is refused the signal stays off.
 *   A signal whose parent is off cannot be switched on.
 * - Off: also switches off everything that depends on it, so each service/listener stops.
 *   With `clearPending`, the signal's unconfirmed inbox items are deleted too.
 */
export const toggleSignal = async ({ key, enabled, values, native, permissions = {}, clearPending = false }) => {
  const signal = byKey(key);
  if (!signal) return values;
  const next = { ...values };

  if (enabled) {
    if (signal.dependsOn && !isActive(signal.dependsOn, values)) return values;
    const step = signal.permission && permissions[signal.permission];
    if (step && !(await step())) return values;
    await native.setSetting(key, true);
    next[key] = true;
    return next;
  }

  for (const k of [key, ...dependentsOf(key)]) {
    if (next[k]) await native.setSetting(k, false);
    next[k] = false;
  }
  if (clearPending && signal.clearSource) await native.clearUnconfirmed([signal.clearSource]);
  return next;
};
