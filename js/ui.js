import { state, SAMPLE } from './state.js';
import { money, pct, esc, tone } from './utils.js';

export const PAGES = {
  dashboard: { title: 'Dashboard' },
  marketplace: { title: 'Marketplace', phase: 2, plan: ['Daftar produk, harga, dan permintaan', 'Beli dan jual yang mengubah kas dan stok', 'Filter, pencarian, dan riwayat transaksi'] },
  production: { title: 'Production', phase: 2, plan: ['Resep dan kapasitas', 'Produksi berdasarkan waktu', 'Biaya per unit'] },
  inventory: { title: 'Inventory', phase: 2, plan: ['Stok bahan baku dan barang jadi', 'Nilai persediaan'] },
  finance: { title: 'Finance', phase: 4, plan: ['Arus kas', 'Laporan laba rugi sederhana'] },
  research: { title: 'Research', phase: 4, plan: ['Pohon teknologi', 'Upgrade efisiensi dan kapasitas'] },
  companies: { title: 'Companies', phase: 3, plan: ['Perusahaan pemain dan 8-12 NPC', 'Perbandingan strategi dan kinerja'] },
  profile: { title: 'Company Profile', phase: 4, plan: ['Profil, strategi, produk, dan riwayat'] },
  news: { title: 'News & Events', phase: 3, plan: ['Berita dari kejadian nyata dalam simulasi', 'Gaya koran ekonomi'] },
  settings: { title: 'Settings', phase: 4, plan: ['Save, New Game, dan Reset', 'Preferensi tampilan'] }
};

const kpi = (label, value, delta, cls = '') =>
  `<div class="panel kpi"><div class="label">${label}</div><div class="value ${cls}">${value}</div><div class="delta ${delta === null ? 'muted' : tone(delta)}">${delta === null ? 'Saldo saat ini' : pct(delta) + ' <span class="muted">vs periode lalu</span>'}</div></div>`;

function chart() {
  const { revenue, expenses } = state.series;
  const W = 600, H = 200, L = 34, B = 20, T = 8;
  const max = Math.ceil(Math.max(...revenue, ...expenses) / 10) * 10;
  const x = (i) => L + (i * (W - L - 8)) / (revenue.length - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const line = (arr, c) => `<polyline fill="none" stroke="${c}" stroke-width="2" points="${arr.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>`;
  let grid = '';
  for (let g = 0; g <= 4; g++) {
    const v = (max / 4) * g;
    grid += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${v}k</text>`;
  }
  const labels = revenue.map((_, i) => (i % 2 ? '' : `<text x="${x(i)}" y="${H - 4}" text-anchor="middle">J${i + 1}</text>`)).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pendapatan dan pengeluaran per jam">${grid}${labels}${line(expenses, 'var(--danger)')}${line(revenue, 'var(--primary)')}</svg>`;
}

function dashboard() {
  const s = state, profit = s.revenue - s.expenses, pp = s.prev.revenue - s.prev.expenses;
  const d = (a, b) => ((a - b) / b) * 100;
  const feed = (rows) => `<ul class="feed">${rows.map(([t, m]) => `<li><time>${t}</time><span>${esc(m)}</span></li>`).join('')}</ul>`;
  const prod = s.production.map((p) => `<tr><td>${esc(p.item)}</td><td class="num">${p.used}/${p.cap}</td><td class="num">${Math.round((p.used / p.cap) * 100)}%</td><td class="num">${money(p.cost)}</td></tr>`).join('');
  return `
  ${SAMPLE ? '<p class="page-note">Semua angka di halaman ini adalah data contoh Fase 1, belum berasal dari simulasi.</p>' : ''}
  <div class="grid grid-kpi">
    ${kpi('Kas', money(s.cash), null)}
    ${kpi('Pendapatan', money(s.revenue), d(s.revenue, s.prev.revenue))}
    ${kpi('Pengeluaran', money(s.expenses), d(s.expenses, s.prev.expenses))}
    ${kpi('Laba', money(profit), d(profit, pp), tone(profit))}
  </div>
  <div class="grid grid-main">
    <section class="panel"><div class="panel-h"><h2>Performa</h2><div class="legend"><span><i style="background:var(--primary)"></i>Pendapatan</span><span><i style="background:var(--danger)"></i>Pengeluaran</span></div></div><div class="panel-b">${chart()}</div></section>
    <section class="panel"><div class="panel-h"><h2>Peringatan</h2></div>${s.alerts.map((a) => `<div class="alert ${a.tone}"><svg class="ic"><use href="#i-warn"/></svg><span>${esc(a.text)}</span></div>`).join('')}</section>
  </div>
  <div class="grid grid-3">
    <section class="panel"><div class="panel-h"><h2>Aktivitas Pasar</h2></div>${feed(s.market)}</section>
    <section class="panel"><div class="panel-h"><h2>Aktivitas NPC</h2></div>${feed(s.npc)}</section>
    <section class="panel"><div class="panel-h"><h2>Ringkasan Produksi</h2></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th class="num">Pakai</th><th class="num">%</th><th class="num">Biaya/unit</th></tr></thead><tbody>${prod}</tbody></table></div></section>
  </div>`;
}

function placeholder(p) {
  return `<section class="panel"><div class="panel-h"><h2>${esc(p.title)}</h2><span class="badge">Fase ${p.phase}</span></div><div class="panel-b"><p class="muted" style="margin-bottom:8px">Halaman ini belum dibangun. Rencana isi:</p><ul class="plan">${p.plan.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div></section>`;
}

export function renderPage(id) {
  if (!Object.hasOwn(PAGES, id) || id === 'dashboard') return dashboard();
  return placeholder(PAGES[id]);
}
