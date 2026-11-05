// src/utils/dates.js
const pad = (n) => String(n).padStart(2, '0');

function formatDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthKeyOf(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

// Normalises "YYYY-M-D", "YYYY/MM/DD" or "DD/MM/YYYY" to "YYYY-MM"; '' if unparseable.
function getYearMonthStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const clean = dateStr.trim();
  const parts = clean.split(/[-/]/);
  if (parts.length < 2) return '';
  if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
  if (parts[2] && parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  return '';
}

module.exports = { formatDate, monthKeyOf, getYearMonthStr };
