import {
  requestNotificationPermission,
  enableNotificationLogging,
  disableNotificationLogging,
} from '../src/inbox/notificationSettings';

const env = (over = {}) => ({
  os: 'android', version: 34, permission: 'android.permission.POST_NOTIFICATIONS',
  request: jest.fn(async () => 'granted'), ...over,
});

describe('requestNotificationPermission', () => {
  it('asks at runtime on Android 13+', async () => {
    const e = env();
    expect(await requestNotificationPermission(e)).toBe(true);
    expect(e.request).toHaveBeenCalledWith('android.permission.POST_NOTIFICATIONS');
  });

  it('does not ask below Android 13', async () => {
    const e = env({ version: 31 });
    expect(await requestNotificationPermission(e)).toBe(true);
    expect(e.request).not.toHaveBeenCalled();
  });

  it('is false when refused or when not on Android', async () => {
    expect(await requestNotificationPermission(env({ request: jest.fn(async () => 'denied') }))).toBe(false);
    expect(await requestNotificationPermission(env({ os: 'ios' }))).toBe(false);
  });
});

describe('enable/disable notification logging', () => {
  it('enables natively only after permission is granted', async () => {
    const native = { setLoggingEnabled: jest.fn(async () => {}) };
    expect(await enableNotificationLogging({ native, permissionEnv: env() })).toBe(true);
    expect(native.setLoggingEnabled).toHaveBeenCalledWith(true);
  });

  it('stays off when permission is refused', async () => {
    const native = { setLoggingEnabled: jest.fn(async () => {}) };
    const permissionEnv = env({ request: jest.fn(async () => 'never_ask_again') });
    expect(await enableNotificationLogging({ native, permissionEnv })).toBe(false);
    expect(native.setLoggingEnabled).not.toHaveBeenCalled();
  });

  it('disables natively', async () => {
    const native = { setLoggingEnabled: jest.fn(async () => {}) };
    await disableNotificationLogging({ native });
    expect(native.setLoggingEnabled).toHaveBeenCalledWith(false);
  });
});
