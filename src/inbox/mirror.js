// src/inbox/mirror.js
// Builds the read-only copy of categories and accounts that native code (notification, tile) reads.
// Balances and transactions are deliberately never included.

export const buildMirror = (state = {}) => ({
  outflowCategories: (state.outflowCategories || []).map(String),
  inflowCategories: (state.inflowCategories || []).map(String),
  accounts: (state.accounts || []).map((a) => ({ id: String(a.id), name: String(a.name) })),
});

/**
 * Debounced, change-aware sync. `update(state)` schedules a push of the mirror JSON via `setMirror`;
 * nothing is sent when the payload equals the last one sent.
 */
export const createMirrorSync = (setMirror, { delayMs = 500 } = {}) => {
  let lastSent = null;
  let timer = null;

  const update = (state) => {
    const json = JSON.stringify(buildMirror(state));
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = null;
      if (json === lastSent) return;
      try {
        await setMirror(json);
        lastSent = json;
      } catch (e) {
        // Leave lastSent untouched so the next change retries.
      }
    }, delayMs);
  };

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return { update, cancel };
};
