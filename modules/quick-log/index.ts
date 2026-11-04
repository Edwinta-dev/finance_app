import QuickLogModule from './src/QuickLogModule';
import type { PendingTransaction, PendingLocation } from './src/QuickLogModule';

export type { PendingTransaction, PendingLocation, TxDirection, TxStatus } from './src/QuickLogModule';

/** True when the native module is linked (dev client / release build on Android). */
export const isAvailable = (): boolean => QuickLogModule != null;

/** Round-trips through the native module; used to prove the dev client wiring works. */
export function ping(): string {
  if (!QuickLogModule) throw new Error('QuickLog native module is not available');
  return QuickLogModule.ping();
}

/** Items written by native code (notification, tile, listeners) that JS has not acked yet. */
export async function getPending(): Promise<PendingTransaction[]> {
  if (!QuickLogModule) return [];
  return QuickLogModule.getPending();
}

/** Removes items from the native inbox. Call only after they are saved to AsyncStorage. */
export async function ack(ids: string[]): Promise<void> {
  if (!QuickLogModule || ids.length === 0) return;
  await QuickLogModule.ack(ids);
}

/** Stores the read-only categories/accounts copy for native code. */
export async function setMirror(json: string): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setMirror(json);
}

/** Turns the ongoing logging notification on or off (persisted natively). */
export async function setLoggingEnabled(enabled: boolean): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setLoggingEnabled(enabled);
}

export async function isLoggingEnabled(): Promise<boolean> {
  if (!QuickLogModule) return false;
  return QuickLogModule.isLoggingEnabled();
}

/** Opt-in flag keys understood by native code. */
export const SETTING_KEYS = {
  notificationLogging: 'notificationLogging',
  bankNotifications: 'bankNotifications',
  keepRawText: 'keepRawText',
  bankCameraSignals: 'bankCameraSignals',
  nudges: 'nudges',
  locationCapture: 'locationCapture',
  roundLocation: 'roundLocation',
  reverseGeocoding: 'reverseGeocoding',
} as const;

export async function setSetting(key: string, enabled: boolean): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setSetting(key, enabled);
}

export async function getSetting(key: string): Promise<boolean> {
  if (!QuickLogModule) return false;
  return QuickLogModule.getSetting(key);
}

/** Replaces the bank package list: `{ packages: { "<package>": "<templateId>" } }`. */
export async function setBankConfig(config: { packages: Record<string, string> }): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setBankConfig(JSON.stringify(config));
}

export async function openNotificationAccessSettings(): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.openNotificationAccessSettings();
}

export async function hasUsageAccess(): Promise<boolean> {
  if (!QuickLogModule) return false;
  return QuickLogModule.hasUsageAccess();
}

export async function openUsageAccessSettings(): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.openUsageAccessSettings();
}

/** Window (ms) between camera use and a bank-app open for them to count as related. Default is 2 minutes. */
export async function setSignalWindowMs(ms: number): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setSignalWindowMs(ms);
}

/** One-shot location (null when location capture is off, not permitted or unavailable). */
export async function captureLocation(): Promise<PendingLocation | null> {
  if (!QuickLogModule) return null;
  return QuickLogModule.captureLocation();
}

/** Minutes after a bank-app session ends before a nudge is considered (config key `nudgeMinutes`, default 5). */
export async function setNudgeMinutes(minutes: number): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.setNudgeMinutes(minutes);
}

/** Tells native the user just logged a transaction in the app (keeps nudges quiet). */
export async function noteLogged(ts: number = Date.now()): Promise<void> {
  if (!QuickLogModule) return;
  await QuickLogModule.noteLogged(ts);
}
