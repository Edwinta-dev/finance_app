// src/utils/validation.js
// Strict numeric/date parsing so NaN, negatives and junk never reach stored balances.

const NUMBER_RE = /^-?\d+(\.\d+)?$|^-?\.\d+$|^-?\d+\.$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Returns a finite number (rounded to cents) or null.
function parseMoney(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!NUMBER_RE.test(s)) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? round2(n) : null;
}

// Returns a finite number > 0 or null.
function parsePositiveMoney(input) {
  const n = parseMoney(input);
  return n !== null && n > 0 ? n : null;
}

// Returns a finite number >= 0 or null.
function parseNonNegativeMoney(input) {
  const n = parseMoney(input);
  return n !== null && n >= 0 ? n : null;
}

// Returns a rate (percent p.a.) in [0, 100] or null.
function parseRate(input) {
  const n = parseNonNegativeMoney(input);
  return n !== null && n <= 100 ? n : null;
}

// Strict YYYY-MM-DD calendar check. Returns the string or null.
function parseIsoDate(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  const m = DATE_RE.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return s;
}

// Coerce a possibly-corrupt stored number to a finite value.
function safeNumber(v, fallback = 0) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

module.exports = { round2, parseMoney, parsePositiveMoney, parseNonNegativeMoney, parseRate, parseIsoDate, safeNumber };
