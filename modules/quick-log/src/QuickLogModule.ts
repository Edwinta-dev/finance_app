import { requireNativeModule } from 'expo-modules-core';

export interface QuickLogNativeModule {
  ping(): string;
}

export default requireNativeModule<QuickLogNativeModule>('QuickLog');
