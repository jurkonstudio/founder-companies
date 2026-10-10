import { state, SAMPLE } from './state.js';
import { money, pct, esc, tone } from './utils.js';

export const PAGES = {
  dashboard: { title: 'Dashboard', kw: 'ringkasan kas laba pendapatan' },
  map: { title: 'Map', tahap: 'C', kw: 'peta bangunan kantor pabrik gudang', plan: ['Grid bangunan: kantor pusat, produksi, gudang', 'Ketuk bangunan untuk detail dan aksi', 'Akses cepat ke Warehouse dan Exchange'], go: ['warehouse', 'exchange'] },
  warehouse: { title: 'Warehouse', tahap: 'C', kw: 'gudang stok inventaris persediaan', plan: ['Daftar stok dengan filter kategori dan pencarian', 'Indikator stok rendah dan riwayat pergerakan', 'Tombol ke Exchange dengan produk terpilih'], go: ['exchange'] },
  search: { title: 'Search', kw: 'cari pencarian' },
  chat: { title: 'Chat', kw: 'pesan aktivitas komunikasi catatan' },
  exchange: { title: 'Exchange', tahap: 'F', kw: 'pasar market beli jual order transaksi', plan: ['Overview, Buy Orders, Sell Orders, My Orders, Riwayat', 'Pasar lokal berbasis data NPC (bukan pasar global real-time)', 'Validasi saldo dan stok, konfirmasi sebelum transaksi'], go: ['warehouse'] },
  production: { title: 'Production', tahap: 'E', kw: 'produksi pabrik resep kapasitas', plan: ['Fasilitas, resep, dan kapasitas', 'Status idle, berjalan, selesai', 'Konsumsi bahan baku dari inventaris'], go: ['warehouse'] },
  research: { title: 'Research', tahap: 'E', kw: 'riset teknologi upgrade', plan: ['Daftar riset, syarat, dan biaya', 'Dampak riset yang konkret'] },
  finance: { title: 'Finance', tahap: 'E', kw: 'keuangan arus kas laba rugi transaksi', plan: ['Saldo, pendapatan, pengeluaran, laba', 'Riwayat transaksi dari save game'] },
  companies: { title: 'Companies', tahap: 'C', kw: 'perusahaan npc pesaing', plan: ['Perusahaan lokal/NPC yang benar-benar ada', 'Detail perusahaan dan hubungannya dengan pasar'] },
  profile: { title: 'Company Profile', tahap: 'D', kw: 'profil perusahaan pemain', plan: ['Nama, deskripsi, level, saldo', 'Edit dengan validasi, Simpan, dan Batal'] },
  news: { title: 'News & Events', tahap: 'G', kw: 'berita event kejadian', plan: ['Berita dari kejadian simulasi', 'Pembeda berita statis dan event dinamis'] },
  settings: { title: 'Settings', tahap: 'D', kw: 'pengaturan compact price alerts reset simpan', plan: ['Compact Mode dan Price Alerts', 'Pengelolaan simpanan lokal dan Reset dengan konfirmasi'] }
};

const kpi = (label, value, delta, cls = '') =>
  `<div class="panel kpi"><div class="label">${label}</div><div class="value ${cls}">${value}</div><div class="delta ${delta === null ? 'muted' : tone(delta)}">${delta === null ? 'Saldo saat ini' : pct(delta) + ' <span class="muted">vs periode lalu</span>'}</div></div>`;

const feed = (rows) => `<ul class="feed">${rows.map(([t, m]) => `<li><time>${t}</time><span>${esc(m)}</span></li>`).join('')}</ul>`;
const quick = (ids) => `<div class="quick">${ids.map((i) => `<a class="btn-link" href="#${i}">${esc(PAGES[i].title)}</a>`).join('')}</div>`;

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
  const prod = s.production.map((p) => `<tr><td>${esc(p.item)}</td><td class="num">${p.used}/${p.cap}</td><td class="num">${Math.round((p.used / p.cap) * 100)}%</td><td class="num">${money(p.cost)}</td></tr>`).join('');
  return `
  ${SAMPLE ? '<p class="page-note">Semua angka di halaman ini adalah data contoh, belum berasal dari simulasi.</p>' : ''}
  ${quick(['exchange', 'production', 'warehouse', 'finance'])}
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
  return `<section class="panel"><div class="panel-h"><h2>${esc(p.title)}</h2><span class="badge">Belum tersedia · Tahap ${p.tahap}</span></div><div class="panel-b"><p class="muted" style="margin-bottom:8px">Halaman ini belum dibangun. Rencana isi:</p><ul class="plan">${p.plan.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div></section>${p.go ? '<p class="page-note" style="margin-top:12px">Akses cepat:</p>' + quick(p.go) : ''}`;
}

function search() {
  return `<input id="q" class="search-input" type="search" placeholder="Cari halaman atau fitur" aria-label="Cari" autocomplete="off">
  <div id="results"></div>
  <p class="page-note" style="margin-top:12px">Saat ini pencarian hanya mencakup halaman dan fitur. Produk, bangunan, dan perusahaan akan ditambahkan setelah datanya tersedia (Tahap C).</p>`;
}

function chat() {
  return `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>Chat multi-pemain</h2><span class="badge">Belum tersedia</span></div><div class="panel-b"><p>Chat dengan pemain lain memerlukan server, sedangkan game ini berjalan di GitHub Pages tanpa backend. Karena itu tidak ada percakapan palsu di sini. Yang tersedia adalah aktivitas lokal, dan Notes pribadi menyusul di Tahap G.</p></div></section>
  <section class="panel"><div class="panel-h"><h2>Aktivitas lokal</h2><span class="badge badge-warn">DATA CONTOH</span></div>${feed([...state.market, ...state.npc])}</section>`;
}

export function searchResults(q) {
  const t = q.trim().toLowerCase();
  if (!t) return '<div class="panel"><div class="empty">Ketik untuk mencari halaman dan fitur game.</div></div>';
  const hits = Object.entries(PAGES).filter(([id, p]) => (p.title + ' ' + (p.kw || '') + ' ' + id).toLowerCase().includes(t));
  if (!hits.length) return `<div class="panel"><div class="empty">Tidak ditemukan hasil untuk "${esc(q.trim())}".</div></div>`;
  return `<section class="panel"><div class="panel-h"><h2>Halaman (${hits.length})</h2></div>${hits.map(([id, p]) => `<a class="result" href="#${id}"><span>${esc(p.title)}</span><span class="muted">${p.tahap ? 'Belum tersedia' : 'Tersedia'}</span></a>`).join('')}</section>`;
}

export function renderPage(id) {
  if (id === 'search') return search();
  if (id === 'chat') return chat();
  if (!Object.hasOwn(PAGES, id) || id === 'dashboard') return dashboard();
  return placeholder(PAGES[id]);
}
