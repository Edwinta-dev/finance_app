import QuickLogModule from './src/QuickLogModule';

/** Round-trips through the native module; used to prove the dev client wiring works. */
export function ping(): string {
  return QuickLogModule.ping();
}
