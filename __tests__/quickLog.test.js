jest.mock('../modules/quick-log/src/QuickLogModule', () => ({
  __esModule: true,
  default: { ping: jest.fn(() => 'pong:quick-log') },
}));

import QuickLogModule from '../modules/quick-log/src/QuickLogModule';
import { ping } from '../modules/quick-log';

describe('quick-log JS wrapper', () => {
  it('calls the native ping and returns its value', () => {
    expect(ping()).toBe('pong:quick-log');
    expect(QuickLogModule.ping).toHaveBeenCalledTimes(1);
  });
});
