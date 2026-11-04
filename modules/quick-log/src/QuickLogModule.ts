import { requireOptionalNativeModule } from 'expo-modules-core';

export type TxDirection = 'inflow' | 'outflow';
export type TxStatus = 'confirmed' | 'unconfirmed' | 'rejected';

export interface PendingLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  placeLabel?: string;
}

export interface PendingTransaction {
  id: string;
  amount: number;
  direction: TxDirection;
  category: string;
  accountId?: string;
  memo: string;
  source: string;
  confidence: number;
  rawText?: string;
  location?: PendingLocation;
  ts: number;
  status: TxStatus;
}

export interface QuickLogNativeModule {
  ping(): string;
  getPending(): Promise<PendingTransaction[]>;
  ack(ids: string[]): Promise<void>;
  setMirror(json: string): Promise<void>;
  setLoggingEnabled(enabled: boolean): Promise<void>;
  isLoggingEnabled(): Promise<boolean>;
  setSetting(key: string, enabled: boolean): Promise<void>;
  getSetting(key: string): Promise<boolean>;
  setBankConfig(json: string): Promise<void>;
  openNotificationAccessSettings(): Promise<void>;
  hasUsageAccess(): Promise<boolean>;
  openUsageAccessSettings(): Promise<void>;
  setSignalWindowMs(ms: number): Promise<void>;
  captureLocation(): Promise<PendingLocation | null>;
}

// Null in Expo Go / web / jest, where the native module does not exist.
export default requireOptionalNativeModule<QuickLogNativeModule>('QuickLog');
