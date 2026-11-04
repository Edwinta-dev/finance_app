// src/inbox/dedupe.js
// The same payment can arrive as a bank notification, a notification-logged entry and a bank+camera hint.

export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

const hasAmount = (i) => Number.isFinite(i.amount) && i.amount > 0;
const sameAmount = (a, b) => Math.abs(a.amount - b.amount) < 0.005;
const present = (v) => v !== undefined && v !== null && v !== '';

// Items belong together when they are within the window of the cluster's first (earliest) item and
// either have the same amount and direction, or one of them is an amount-less hint.
// A hint never changes an amount; two different amounts never merge.
const belongs = (cluster, item, windowMs) => {
  const first = cluster[0];
  if (Math.abs(item.ts - first.ts) > windowMs) return false;
  const amounts = cluster.filter(hasAmount);
  if (!hasAmount(item)) return true;
  if (amounts.length === 0) return true;
  return item.direction === amounts[0].direction && sameAmount(item, amounts[0]);
};

const mergeCluster = (cluster) => {
  const byConfidence = [...cluster].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0) || a.ts - b.ts);
  const winner = byConfidence[0];
  const firstWith = (key) => byConfidence.find((i) => present(i[key]))?.[key];
  const amountItem = byConfidence.find(hasAmount);
  const merged = { ...winner };
  if (!hasAmount(winner) && amountItem) {
    merged.amount = amountItem.amount;
    merged.direction = amountItem.direction;
  }
  for (const key of ['category', 'location', 'accountId']) {
    if (!present(merged[key]) && present(firstWith(key))) merged[key] = firstWith(key);
  }
  if (!present(merged.memo) && present(firstWith('memo'))) merged.memo = firstWith('memo');
  // A member the user already confirmed wins over an unconfirmed duplicate.
  const confirmed = byConfidence.find((i) => i.status === 'confirmed');
  if (confirmed && merged.status === 'unconfirmed') merged.status = 'confirmed';
  return merged;
};

/**
 * Returns `{ items, droppedIds }`: merged items (ordered by ts) and the ids of the duplicates that were
 * folded into them, so callers can ack the duplicates out of the native inbox.
 * Rejected items are left alone so a rejection is never resurrected by a duplicate.
 */
export const dedupePlan = (items, windowMs = DEDUPE_WINDOW_MS) => {
  const list = (items || []).filter((i) => i && typeof i.id === 'string' && Number.isFinite(i.ts));
  const rejected = list.filter((i) => i.status === 'rejected');
  const live = list.filter((i) => i.status !== 'rejected').sort((a, b) => a.ts - b.ts);

  const clusters = [];
  for (const item of live) {
    const home = clusters.find((c) => belongs(c, item, windowMs));
    if (home) home.push(item);
    else clusters.push([item]);
  }

  const out = [];
  const droppedIds = [];
  for (const cluster of clusters) {
    const merged = mergeCluster(cluster);
    out.push(merged);
    cluster.forEach((i) => { if (i.id !== merged.id) droppedIds.push(i.id); });
  }
  return { items: [...out, ...rejected].sort((a, b) => a.ts - b.ts), droppedIds };
};

export const dedupe = (items, windowMs = DEDUPE_WINDOW_MS) => dedupePlan(items, windowMs).items;
