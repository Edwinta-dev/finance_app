import { dedupe, dedupePlan, DEDUPE_WINDOW_MS } from '../src/inbox/dedupe';

const MIN = 60 * 1000;
const T0 = 1_700_000_000_000;
const item = (over = {}) => ({
  id: 'a', amount: 12, direction: 'outflow', category: '', memo: '', source: 'bank_notification',
  confidence: 0.9, ts: T0, status: 'unconfirmed', ...over,
});

describe('dedupe', () => {
  it('merges the same amount inside the window, keeping the highest confidence', () => {
    const out = dedupe([item({ id: 'bank', confidence: 0.9 }), item({ id: 'mine', source: 'notification', confidence: 1, ts: T0 + 3 * MIN })]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('mine');
  });

  it('window boundary is inclusive', () => {
    expect(dedupe([item({ id: 'a' }), item({ id: 'b', ts: T0 + 10 * MIN })])).toHaveLength(1);
    expect(dedupe([item({ id: 'a' }), item({ id: 'b', ts: T0 + 10 * MIN + 1 })])).toHaveLength(2);
    expect(DEDUPE_WINDOW_MS).toBe(10 * MIN);
  });

  it('also merges when the later item came first in the list (order independent)', () => {
    expect(dedupe([item({ id: 'b', ts: T0 + 5 * MIN }), item({ id: 'a' })])).toHaveLength(1);
  });

  it('keeps items with different amounts or directions', () => {
    expect(dedupe([item({ id: 'a' }), item({ id: 'b', amount: 12.5 })])).toHaveLength(2);
    expect(dedupe([item({ id: 'a' }), item({ id: 'b', direction: 'inflow' })])).toHaveLength(2);
  });

  it('fills a missing category and location from the other items', () => {
    const loc = { lat: 1.3, lng: 103.8 };
    const [m] = dedupe([
      item({ id: 'hi', confidence: 1, source: 'notification', status: 'confirmed' }),
      item({ id: 'lo', confidence: 0.5, category: 'Food', location: loc, memo: 'Kopitiam', ts: T0 + MIN }),
    ]);
    expect(m).toMatchObject({ id: 'hi', category: 'Food', location: loc, memo: 'Kopitiam' });
  });

  it('does not overwrite what the winner already has', () => {
    const [m] = dedupe([item({ id: 'hi', confidence: 1, category: 'Transport' }), item({ id: 'lo', confidence: 0.5, category: 'Food', ts: T0 + MIN })]);
    expect(m.category).toBe('Transport');
  });

  it('absorbs an amount-less hint into an amounted item without changing the amount', () => {
    const out = dedupe([item({ id: 'bank' }), item({ id: 'hint', amount: 0, source: 'bank_camera', confidence: 0.3, ts: T0 + 2 * MIN })]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'bank', amount: 12 });
  });

  it('a hint alone stays a hint; hints outside the window stay separate', () => {
    expect(dedupe([item({ id: 'hint', amount: 0, source: 'bank_camera', confidence: 0.3 })])[0].amount).toBe(0);
    expect(dedupe([item({ id: 'bank' }), item({ id: 'hint', amount: 0, confidence: 0.3, ts: T0 + 11 * MIN })])).toHaveLength(2);
  });

  it('two hints close together become one; a hint then gains the amount of a later item', () => {
    expect(dedupe([item({ id: 'h1', amount: 0, confidence: 0.3 }), item({ id: 'h2', amount: 0, confidence: 0.3, ts: T0 + MIN })])).toHaveLength(1);
    const [m] = dedupe([item({ id: 'h', amount: 0, confidence: 1 }), item({ id: 'b', confidence: 0.9, ts: T0 + MIN })]);
    expect(m.amount).toBe(12);
  });

  it('a confirmed duplicate confirms the merged item; rejected items are untouched', () => {
    const [m] = dedupe([item({ id: 'bank', confidence: 1 }), item({ id: 'mine', confidence: 0.5, status: 'confirmed', category: 'Food', ts: T0 + MIN })]);
    expect(m.status).toBe('confirmed');
    const out = dedupe([item({ id: 'r', status: 'rejected' }), item({ id: 'x', ts: T0 + MIN })]);
    expect(out.map((i) => i.id).sort()).toEqual(['r', 'x']);
  });

  it('reports dropped ids and ignores junk', () => {
    const plan = dedupePlan([item({ id: 'a' }), item({ id: 'b', confidence: 0.5, ts: T0 + MIN }), null, { id: 'c' }]);
    expect(plan.items.map((i) => i.id)).toEqual(['a']);
    expect(plan.droppedIds).toEqual(['b']);
    expect(dedupe(undefined)).toEqual([]);
  });
});
