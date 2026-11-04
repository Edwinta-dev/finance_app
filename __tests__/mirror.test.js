import { buildMirror, createMirrorSync } from '../src/inbox/mirror';

const state = {
  outflowCategories: ['Food', 'Transport'],
  inflowCategories: ['Salary'],
  accounts: [{ id: '1', name: 'Main', balance: 123.45, isFavorite: true, interestRate: 2 }],
  transactions: [{ id: 't', amount: 5 }],
};

describe('buildMirror', () => {
  it('has the expected payload shape', () => {
    expect(buildMirror(state)).toEqual({
      outflowCategories: ['Food', 'Transport'],
      inflowCategories: ['Salary'],
      accounts: [{ id: '1', name: 'Main' }],
    });
  });

  it('never includes balances or transactions', () => {
    const json = JSON.stringify(buildMirror(state));
    expect(json).not.toMatch(/balance|123\.45|transactions|interestRate/);
  });

  it('copes with missing fields', () => {
    expect(buildMirror()).toEqual({ outflowCategories: [], inflowCategories: [], accounts: [] });
  });
});

describe('createMirrorSync', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('debounces rapid updates into one call', async () => {
    const setMirror = jest.fn(async () => {});
    const sync = createMirrorSync(setMirror, { delayMs: 100 });
    sync.update(state);
    sync.update({ ...state, outflowCategories: ['Food'] });
    await jest.advanceTimersByTimeAsync(100);
    expect(setMirror).toHaveBeenCalledTimes(1);
    expect(JSON.parse(setMirror.mock.calls[0][0]).outflowCategories).toEqual(['Food']);
  });

  it('skips when the payload is unchanged, even if balances changed', async () => {
    const setMirror = jest.fn(async () => {});
    const sync = createMirrorSync(setMirror, { delayMs: 10 });
    sync.update(state);
    await jest.advanceTimersByTimeAsync(10);
    sync.update({ ...state, accounts: [{ ...state.accounts[0], balance: 999 }] });
    await jest.advanceTimersByTimeAsync(10);
    expect(setMirror).toHaveBeenCalledTimes(1);
  });

  it('sends again after a real change and retries after a failure', async () => {
    const setMirror = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(undefined);
    const sync = createMirrorSync(setMirror, { delayMs: 10 });
    sync.update(state);
    await jest.advanceTimersByTimeAsync(10);
    sync.update(state);
    await jest.advanceTimersByTimeAsync(10);
    expect(setMirror).toHaveBeenCalledTimes(2);
    sync.update({ ...state, inflowCategories: [] });
    await jest.advanceTimersByTimeAsync(10);
    expect(setMirror).toHaveBeenCalledTimes(3);
  });

  it('cancel drops a pending push', async () => {
    const setMirror = jest.fn();
    const sync = createMirrorSync(setMirror, { delayMs: 10 });
    sync.update(state);
    sync.cancel();
    await jest.advanceTimersByTimeAsync(50);
    expect(setMirror).not.toHaveBeenCalled();
  });
});
