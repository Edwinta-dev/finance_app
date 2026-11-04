import { SIGNALS, SIGNAL_KEYS, defaultValues, isActive, dependentsOf, loadValues, toggleSignal } from '../src/settings/signals';
import { SETTING_KEYS } from '../modules/quick-log';

const makeNative = () => {
  const store = {};
  return {
    store,
    getSetting: jest.fn(async (k) => !!store[k]),
    setSetting: jest.fn(async (k, v) => { store[k] = v; }),
    clearUnconfirmed: jest.fn(async () => 0),
  };
};
const K = SETTING_KEYS;

describe('every signal', () => {
  const required = [K.notificationLogging, K.bankNotifications, K.keepRawText, K.bankCameraSignals, K.locationCapture, K.reverseGeocoding, K.nudges];

  it('covers all the signals the issue lists, plus location blurring', () => {
    required.forEach((k) => expect(SIGNAL_KEYS).toContain(k));
    expect(SIGNAL_KEYS).toContain(K.roundLocation);
  });

  it('has a title and a plain-language explanation', () => {
    SIGNALS.forEach((s) => {
      expect(s.title.trim().length).toBeGreaterThan(3);
      expect(s.explanation.trim().length).toBeGreaterThan(40);
    });
  });

  it('has a unique key and a valid dependency', () => {
    expect(new Set(SIGNAL_KEYS).size).toBe(SIGNAL_KEYS.length);
    SIGNALS.filter((s) => s.dependsOn).forEach((s) => expect(SIGNAL_KEYS).toContain(s.dependsOn));
  });

  it('defaults to off', () => {
    expect(Object.values(defaultValues()).every((v) => v === false)).toBe(true);
  });

  it('only reverse geocoding mentions the network as a feature', () => {
    expect(SIGNALS.find((s) => s.key === K.reverseGeocoding).explanation).toMatch(/network/i);
  });
});

describe('gating', () => {
  it('off means gated', () => {
    const v = defaultValues();
    SIGNAL_KEYS.forEach((k) => expect(isActive(k, v)).toBe(false));
  });

  it('a child is gated while its parent is off, even if the child flag is on', () => {
    const v = { ...defaultValues(), [K.keepRawText]: true };
    expect(isActive(K.keepRawText, v)).toBe(false);
    expect(isActive(K.keepRawText, { ...v, [K.bankNotifications]: true })).toBe(true);
  });

  it('knows what depends on what', () => {
    expect(dependentsOf(K.locationCapture).sort()).toEqual([K.reverseGeocoding, K.roundLocation].sort());
    expect(dependentsOf(K.nudges)).toEqual([]);
  });
});

describe('toggleSignal', () => {
  it('turns a signal on after its permission step, and persists natively', async () => {
    const native = makeNative();
    const permission = jest.fn(async () => true);
    const next = await toggleSignal({ key: K.bankCameraSignals, enabled: true, values: defaultValues(), native, permissions: { usageAccess: permission } });
    expect(permission).toHaveBeenCalled();
    expect(native.setSetting).toHaveBeenCalledWith(K.bankCameraSignals, true);
    expect(next[K.bankCameraSignals]).toBe(true);
  });

  it('stays off when the permission step is refused', async () => {
    const native = makeNative();
    const next = await toggleSignal({ key: K.locationCapture, enabled: true, values: defaultValues(), native, permissions: { location: async () => false } });
    expect(next[K.locationCapture]).toBe(false);
    expect(native.setSetting).not.toHaveBeenCalled();
  });

  it('cannot turn a child on while its parent is off', async () => {
    const native = makeNative();
    const next = await toggleSignal({ key: K.reverseGeocoding, enabled: true, values: defaultValues(), native });
    expect(next[K.reverseGeocoding]).toBe(false);
    expect(native.setSetting).not.toHaveBeenCalled();
  });

  it('turning a parent off stops its dependents too', async () => {
    const native = makeNative();
    const values = { ...defaultValues(), [K.locationCapture]: true, [K.roundLocation]: true, [K.reverseGeocoding]: true };
    const next = await toggleSignal({ key: K.locationCapture, enabled: false, values, native });
    expect(next[K.locationCapture] || next[K.roundLocation] || next[K.reverseGeocoding]).toBe(false);
    expect(native.setSetting).toHaveBeenCalledWith(K.locationCapture, false);
    expect(native.setSetting).toHaveBeenCalledWith(K.roundLocation, false);
    expect(native.setSetting).toHaveBeenCalledWith(K.reverseGeocoding, false);
  });

  it('clears pending unconfirmed items only on request', async () => {
    const values = { ...defaultValues(), [K.bankNotifications]: true };
    const a = makeNative();
    await toggleSignal({ key: K.bankNotifications, enabled: false, values, native: a });
    expect(a.clearUnconfirmed).not.toHaveBeenCalled();
    const b = makeNative();
    await toggleSignal({ key: K.bankNotifications, enabled: false, values, native: b, clearPending: true });
    expect(b.clearUnconfirmed).toHaveBeenCalledWith(['bank_notification']);
  });

  it('ignores unknown keys', async () => {
    const values = defaultValues();
    expect(await toggleSignal({ key: 'nope', enabled: true, values, native: makeNative() })).toBe(values);
  });
});

describe('loadValues', () => {
  it('reads every flag from native and treats failures as off', async () => {
    const native = makeNative();
    native.store[K.nudges] = true;
    native.getSetting.mockImplementation(async (k) => { if (k === K.keepRawText) throw new Error('x'); return !!native.store[k]; });
    const v = await loadValues(native);
    expect(v[K.nudges]).toBe(true);
    expect(v[K.keepRawText]).toBe(false);
  });
});
