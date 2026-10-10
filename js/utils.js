const f0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const f2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n) => f0.format(n);
export const m2 = (n) => f2.format(n);
export const r2 = (n) => Math.round(n * 100) / 100;
export const pct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tone = (n) => (n >= 0 ? 'pos' : 'neg');
