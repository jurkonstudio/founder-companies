const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const money = (n) => usd.format(n);
export const pct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const tone = (n) => (n >= 0 ? 'pos' : 'neg');
