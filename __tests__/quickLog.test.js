jest.mock('../modules/quick-log/src/QuickLogModule', () => ({
  __esModule: true,
  default: {
    ping: jest.fn(() => 'pong:quick-log'),
    getPending: jest.fn(async () => [{ id: 'a' }]),
    ack: jest.fn(async () => {}),
    setSetting: jest.fn(async () => {}),
    getSetting: jest.fn(async () => true),
    setBankConfig: jest.fn(async () => {}),
    openNotificationAccessSettings: jest.fn(async () => {}),
  },
}));

import QuickLogModule from '../modules/quick-log/src/QuickLogModule';
import { ping, getPending, ack, isAvailable, setSetting, getSetting, setBankConfig, SETTING_KEYS } from '../modules/quick-log';

describe('quick-log JS wrapper', () => {
  it('calls the native ping and returns its value', () => {
    expect(ping()).toBe('pong:quick-log');
    expect(QuickLogModule.ping).toHaveBeenCalledTimes(1);
  });

  it('reads pending items from native', async () => {
    expect(isAvailable()).toBe(true);
    expect(await getPending()).toEqual([{ id: 'a' }]);
  });

  it('acks ids, and skips the native call for an empty list', async () => {
    await ack([]);
    expect(QuickLogModule.ack).not.toHaveBeenCalled();
    await ack(['a', 'b']);
    expect(QuickLogModule.ack).toHaveBeenCalledWith(['a', 'b']);
  });
});

describe('opt-in settings and bank config', () => {
  it('forwards generic settings', async () => {
    await setSetting(SETTING_KEYS.bankNotifications, true);
    expect(QuickLogModule.setSetting).toHaveBeenCalledWith('bankNotifications', true);
    expect(await getSetting(SETTING_KEYS.keepRawText)).toBe(true);
  });

  it('serialises the bank config', async () => {
    await setBankConfig({ packages: { 'com.example.bank': 'uob' } });
    expect(QuickLogModule.setBankConfig).toHaveBeenCalledWith('{"packages":{"com.example.bank":"uob"}}');
  });
});
