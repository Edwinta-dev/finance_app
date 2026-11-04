import { normalizeLocation, captureLocationIfEnabled } from '../src/inbox/location';
import { mergePending } from '../src/inbox/mergePending';
import { resolveCandidate } from '../src/inbox/reviewFlow';
import { buildMirror } from '../src/inbox/mirror';

const accounts = [{ id: 'a1', name: 'Main', balance: 100 }];
const item = (over = {}) => ({
  id: 'p1', amount: 5, direction: 'outflow', category: 'Food', memo: '', source: 'bank_notification',
  confidence: 0.9, ts: 1767614400000, status: 'confirmed', ...over,
});

describe('normalizeLocation', () => {
  it('keeps lat/lng and valid optional fields', () => {
    expect(normalizeLocation({ lat: 1.3, lng: 103.8, accuracy: 100, placeLabel: ' Place ', junk: 1 }))
      .toEqual({ lat: 1.3, lng: 103.8, accuracy: 100, placeLabel: 'Place' });
    expect(normalizeLocation({ lat: 1.3, lng: 103.8 })).toEqual({ lat: 1.3, lng: 103.8 });
  });

  it('rejects unusable values', () => {
    [null, undefined, 'x', {}, { lat: NaN, lng: 1 }, { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, { lat: '1', lng: 2 }]
      .forEach((v) => expect(normalizeLocation(v)).toBeNull());
    expect(normalizeLocation({ lat: 1, lng: 2, accuracy: -5, placeLabel: '  ' })).toEqual({ lat: 1, lng: 2 });
  });
});

describe('location on transactions (additive shape)', () => {
  it('is carried onto the transaction when present', () => {
    const { added } = mergePending([], [item({ location: { lat: 1.3, lng: 103.8, accuracy: 100 } })], { accounts });
    expect(added[0].location).toEqual({ lat: 1.3, lng: 103.8, accuracy: 100 });
  });

  it('adds no location key otherwise, so existing transactions keep their shape', () => {
    const { added } = mergePending([], [item(), item({ id: 'p2', location: { lat: 999, lng: 0 } })], { accounts });
    added.forEach((t) => expect(t).not.toHaveProperty('location'));
  });

  it('review confirm attaches a captured location', () => {
    const r = resolveCandidate({
      item: item({ status: 'unconfirmed' }), decision: { type: 'confirm', category: 'Food', location: { lat: 1.3, lng: 103.8 } },
      transactions: [], accounts,
    });
    expect(r.transactions[0].location).toEqual({ lat: 1.3, lng: 103.8 });
  });
});

describe('mirror stays free of location', () => {
  it('has no location data', () => {
    const json = JSON.stringify(buildMirror({ outflowCategories: ['Food'], accounts: [{ id: '1', name: 'Main', location: { lat: 1, lng: 2 } }] }));
    expect(json).not.toMatch(/location|lat|lng/);
  });
});

describe('captureLocationIfEnabled', () => {
  const deps = (over = {}) => ({
    isEnabled: jest.fn(async () => true), requestPermission: jest.fn(async () => true),
    capture: jest.fn(async () => ({ lat: 1.3, lng: 103.8, accuracy: 50 })), ...over,
  });

  it('captures when opted in and permitted', async () => {
    expect(await captureLocationIfEnabled(deps())).toEqual({ lat: 1.3, lng: 103.8, accuracy: 50 });
  });

  it('does nothing when the toggle is off (no permission prompt, no capture)', async () => {
    const d = deps({ isEnabled: jest.fn(async () => false) });
    expect(await captureLocationIfEnabled(d)).toBeNull();
    expect(d.requestPermission).not.toHaveBeenCalled();
    expect(d.capture).not.toHaveBeenCalled();
  });

  it('returns null on refusal, bad data or errors', async () => {
    expect(await captureLocationIfEnabled(deps({ requestPermission: jest.fn(async () => false) }))).toBeNull();
    expect(await captureLocationIfEnabled(deps({ capture: jest.fn(async () => ({ lat: 'x' })) }))).toBeNull();
    expect(await captureLocationIfEnabled(deps({ capture: jest.fn(async () => { throw new Error('x'); }) }))).toBeNull();
  });
});
