import QuickLogModule from './src/QuickLogModule';
import type { PendingTransaction } from './src/QuickLogModule';

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
