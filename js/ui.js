import { state, PRODUCTS, RECIPES, CAP } from './state.js';
import { worth, profit, maxProduce } from './economy.js';
import { canSave } from './save.js';
import { money, m2, r2, esc, tone } from './utils.js';

export const PAGES = {
  dashboard: { title: 'Dashboard', kw: 'ringkasan kas laba pendapatan' },
  map: { title: 'Map', tahap: 'Berikutnya', kw: 'peta bangunan kantor pabrik', plan: ['Grid bangunan: kantor pusat, produksi, gudang', 'Ketuk bangunan untuk detail dan aksi'], go: ['warehouse', 'production'] },
  warehouse: { title: 'Warehouse', kw: 'gudang stok inventaris persediaan' },
  search: { title: 'Search', kw: 'cari pencarian' },
  chat: { title: 'Chat', kw: 'pesan aktivitas komunikasi' },
  exchange: { title: 'Exchange', kw: 'pasar market beli jual transaksi' },
  production: { title: 'Production', kw: 'produksi pabrik resep kapasitas' },
  research: { title: 'Research', tahap: 'Berikutnya', kw: 'riset teknologi upgrade', plan: ['Daftar riset, syarat, dan biaya', 'Efek riset yang benar-benar mengubah produksi'] },
  finance: { title: 'Finance', kw: 'keuangan arus kas laba rugi transaksi' },
  companies: { title: 'Companies', tahap: 'Berikutnya', kw: 'perusahaan npc pesaing', plan: ['Perusahaan NPC dengan strategi berbeda', 'Pengaruh NPC ke harga pasar'] },
  profile: { title: 'Company Profile', tahap: 'Berikutnya', kw: 'profil perusahaan', plan: ['Nama, deskripsi, level, statistik'] },
  news: { title: 'News & Events', tahap: 'Berikutnya', kw: 'berita event', plan: ['Berita dari kejadian simulasi'] },
  settings: { title: 'Settings', kw: 'pengaturan compact reset simpan' }
};

const kpi = (label, value, sub, cls = '') => `<div class="panel kpi"><div class="label">${label}</div><div class="value ${cls}">${value}</div><div class="delta muted">${sub}</div></div>`;
const feed = (rows) => rows.length ? `<ul class="feed">${rows.map(([d, m]) => `<li><time>Hari ${d}</time><span>${esc(m)}</span></li>`).join('')}</ul>` : '<div class="empty">Belum ada aktivitas.</div>';
const quick = (ids) => `<div class="quick">${ids.map((i) => `<a class="btn-link" href="#${i}">${esc(PAGES[i].title)}</a>`).join('')}</div>`;
const invValue = () => r2(Object.values(state.inv).reduce((a, i) => a + i.qty * i.avg, 0));
const TYPE = { buy: 'Beli', sell: 'Jual', production: 'Produksi' };
const sign = (n) => (n >= 0 ? '+' : '') + m2(n);

function chart(vals) {
  if (vals.length < 2) return '<div class="empty">Belum ada riwayat. Lakukan transaksi pertama di Exchange.</div>';
  const W = 600, H = 200, L = 52, B = 12, T = 12;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { hi += 1; lo -= 1; }
  const x = (i) => L + (i * (W - L - 8)) / (vals.length - 1);
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const grid = [lo, (lo + hi) / 2, hi].map((v) => `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L - 6}" y="${y(v) + 3}" text-anchor="end">${money(v)}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Nilai perusahaan per transaksi">${grid}<polyline fill="none" stroke="var(--primary)" stroke-width="2" points="${vals.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/></svg>`;
}

function dashboard() {
  const s = state, p = profit();
  const alerts = [];
  if (s.cash < 500) alerts.push(['danger', 'Kas menipis: ' + m2(s.cash)]);
  for (const id in PRODUCTS) { const q = s.inv[id].qty; if (q > 0 && q < 10) alerts.push(['warning', `Stok ${PRODUCTS[id].name} rendah (${q} unit)`]); }
  if (s.used >= CAP) alerts.push(['warning', 'Kapasitas produksi hari ini habis']);
  const inv = Object.entries(PRODUCTS).filter(([id]) => s.inv[id].qty > 0).map(([id, pr]) => `<tr><td>${esc(pr.name)}</td><td class="num">${s.inv[id].qty}</td><td class="num">${m2(s.inv[id].qty * s.inv[id].avg)}</td></tr>`).join('');
  return `${quick(['exchange', 'production', 'warehouse', 'finance'])}
  <div class="grid grid-kpi">
    ${kpi('Kas', m2(s.cash), 'Saldo saat ini')}
    ${kpi('Pendapatan', m2(s.totals.revenue), 'Total penjualan')}
    ${kpi('Laba', m2(p), 'Pendapatan - HPP', tone(p))}
    ${kpi('Nilai perusahaan', m2(worth()), 'Kas + persediaan')}
  </div>
  <div class="grid grid-main">
    <section class="panel"><div class="panel-h"><h2>Nilai perusahaan</h2><span class="muted small">Hari ${s.day}</span></div><div class="panel-b">${chart(s.worth)}</div></section>
    <section class="panel"><div class="panel-h"><h2>Peringatan</h2></div>${alerts.length ? alerts.map(([t, m]) => `<div class="alert ${t}"><svg class="ic"><use href="#i-warn"/></svg><span>${esc(m)}</span></div>`).join('') : '<div class="empty">Tidak ada peringatan.</div>'}</section>
  </div>
  <div class="grid grid-main">
    <section class="panel"><div class="panel-h"><h2>Aktivitas terbaru</h2></div>${feed(s.log.slice(0, 6))}</section>
    <section class="panel"><div class="panel-h"><h2>Persediaan</h2></div>${inv ? `<div class="table-wrap"><table><thead><tr><th>Produk</th><th class="num">Jml</th><th class="num">Nilai</th></tr></thead><tbody>${inv}</tbody></table></div>` : '<div class="empty">Gudang kosong. Beli bahan di Exchange.</div>'}</section>
  </div>`;
}

function warehouse() {
  const rows = Object.entries(PRODUCTS).map(([id, p]) => { const i = state.inv[id]; return `<tr><td><strong>${esc(p.name)}</strong><div class="muted small">${esc(p.cat)}${i.qty > 0 && i.qty < 10 ? ' · <span class="neg">Stok rendah</span>' : ''}</div></td><td class="num">${i.qty}</td><td class="num">${m2(i.avg)}</td><td class="num">${m2(i.qty * i.avg)}</td></tr>`; }).join('');
  const hist = state.ledger.slice(0, 10).map((e) => `<li><time>Hari ${e.day}</time><span>${TYPE[e.type]} ${e.type === 'sell' ? '-' : '+'}${e.qty} ${esc(PRODUCTS[e.pid].name)}<br><span class="muted small">${esc(e.note)}</span></span></li>`).join('');
  const empty = Object.values(state.inv).every((i) => i.qty === 0);
  return `${quick(['exchange', 'production'])}
  <section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>Persediaan</h2><span class="muted small">Nilai ${m2(invValue())}</span></div>${empty ? '<div class="empty">Gudang kosong. Beli bahan baku di Exchange.</div>' : ''}<div class="table-wrap"><table><thead><tr><th>Produk</th><th class="num">Stok</th><th class="num">Biaya rata-rata</th><th class="num">Nilai</th></tr></thead><tbody>${rows}</tbody></table></div></section>
  <section class="panel"><div class="panel-h"><h2>Pergerakan stok</h2></div>${hist ? `<ul class="feed">${hist}</ul>` : '<div class="empty">Belum ada pergerakan stok.</div>'}</section>`;
}

function exchange() {
  const rows = Object.entries(PRODUCTS).map(([id, p]) => { const m = state.market[id]; return `<tr><td><strong>${esc(p.name)}</strong><div class="muted small">${esc(p.cat)} · pasar ${m2(m.price)}<br>NPC jual ${m.stock} · NPC beli ${m.room} · Anda punya ${state.inv[id].qty}</div></td><td class="num">${m2(m.price * 1.03)}</td><td class="num">${m2(m.price * 0.97)}</td><td><div class="row-actions"><input class="qty" type="number" inputmode="numeric" min="1" step="1" value="1" data-qty="p:${id}" aria-label="Jumlah ${esc(p.name)}"><button class="btn btn-primary" data-act="buy" data-id="${id}">Beli</button><button class="btn" data-act="sell" data-id="${id}">Jual</button></div></td></tr>`; }).join('');
  return `<p class="page-note">Pasar simulasi lokal dengan NPC, bukan pasar online real-time. Harga bergerak sesuai jumlah yang Anda beli atau jual.</p>
  <section class="panel"><div class="panel-h"><h2>Pasar · Hari ${state.day}</h2><button class="btn" data-act="nextday">Hari berikutnya</button></div><div class="table-wrap"><table><thead><tr><th>Produk</th><th class="num">Beli @</th><th class="num">Jual @</th><th class="num">Jumlah</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function production() {
  const rows = Object.entries(RECIPES).map(([rid, r]) => { const mx = maxProduce(rid); const need = Object.entries(r.inputs).map(([k, v]) => `${v} ${PRODUCTS[k].name}`).join(' + '); return `<tr><td><strong>${esc(PRODUCTS[rid].name)}</strong><div class="muted small">${esc(need)} · biaya ${m2(r.fee)}/unit</div>${mx.n < 1 ? `<div class="neg small">${mx.why}</div>` : ''}</td><td class="num">${mx.n}</td><td><div class="row-actions"><input class="qty" type="number" inputmode="numeric" min="1" step="1" value="1" data-qty="r:${rid}" aria-label="Jumlah ${esc(PRODUCTS[rid].name)}"><button class="btn btn-primary" data-act="produce" data-id="${rid}"${mx.n < 1 ? ' disabled' : ''}>Produksi</button></div></td></tr>`; }).join('');
  return `${quick(['exchange', 'warehouse'])}<section class="panel"><div class="panel-h"><h2>Roastery</h2><span class="muted small">Kapasitas hari ini ${state.used}/${CAP}</span></div><div class="table-wrap"><table><thead><tr><th>Resep</th><th class="num">Maks</th><th class="num">Jumlah</th></tr></thead><tbody>${rows}</tbody></table></div></section>
  <p class="page-note" style="margin-top:12px">Produksi memakai bahan dari Warehouse dan menambah hasilnya ke Warehouse. Kapasitas pulih saat Hari berikutnya di Exchange.</p>`;
}

function finance() {
  const s = state, p = profit();
  const rows = s.ledger.slice(0, 30).map((e) => `<tr><td>${e.day}</td><td>${TYPE[e.type]}</td><td>${esc(PRODUCTS[e.pid].name)}</td><td class="num">${e.qty}</td><td class="num ${tone(e.amount)}">${sign(e.amount)}</td><td class="num">${m2(e.cash)}</td></tr>`).join('');
  return `<div class="grid grid-kpi">
    ${kpi('Kas', m2(s.cash), 'Saldo saat ini')}
    ${kpi('Pendapatan', m2(s.totals.revenue), 'Total penjualan')}
    ${kpi('HPP', m2(s.totals.cogs), 'Biaya barang terjual')}
    ${kpi('Laba', m2(p), 'Pendapatan - HPP', tone(p))}
  </div>
  <p class="page-note">Pembelian bahan dan biaya produksi masuk ke persediaan (nilai ${m2(invValue())}) dan baru menjadi biaya (HPP) saat barang terjual, memakai biaya rata-rata.</p>
  <section class="panel"><div class="panel-h"><h2>Riwayat transaksi</h2></div>${rows ? `<div class="table-wrap"><table><thead><tr><th>Hari</th><th>Jenis</th><th>Produk</th><th class="num">Jml</th><th class="num">Kas</th><th class="num">Saldo</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">Belum ada transaksi.</div>'}</section>`;
}

function settings() {
  return `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>Tampilan</h2></div><label class="switch-row"><span><strong>Compact Mode</strong><br><span class="muted small">Tabel dan kartu lebih ringkas. Disimpan di perangkat ini.</span></span><input type="checkbox" role="switch" data-set="compact"${state.settings.compact ? ' checked' : ''}></label></section>
  <section class="panel"><div class="panel-h"><h2>Data permainan</h2></div><div class="panel-b"><p style="margin-bottom:10px">Progres tersimpan otomatis di LocalStorage perangkat ini${canSave() ? '' : ' <strong class="neg">(penyimpanan tidak tersedia, progres akan hilang saat ditutup)</strong>'}. Tidak ada sinkronisasi antarperangkat.</p><button class="btn btn-danger" data-act="reset">Reset game</button></div></section>`;
}

function placeholder(p) {
  return `<section class="panel"><div class="panel-h"><h2>${esc(p.title)}</h2><span class="badge">Belum tersedia</span></div><div class="panel-b"><p class="muted" style="margin-bottom:8px">Halaman ini belum dibangun. Rencana isi:</p><ul class="plan">${p.plan.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div></section>${p.go ? '<p class="page-note" style="margin-top:12px">Akses cepat:</p>' + quick(p.go) : ''}`;
}

const search = () => `<input id="q" class="search-input" type="search" placeholder="Cari produk, halaman, atau fitur" aria-label="Cari" autocomplete="off"><div id="results"></div>`;

function chat() {
  return `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>Chat multi-pemain</h2><span class="badge">Belum tersedia</span></div><div class="panel-b"><p>Chat dengan pemain lain memerlukan server, sedangkan game ini berjalan di GitHub Pages tanpa backend. Tidak ada percakapan palsu di sini. Yang tersedia adalah log aktivitas lokal dari permainanmu.</p></div></section>
  <section class="panel"><div class="panel-h"><h2>Aktivitas lokal</h2></div>${feed(state.log.slice(0, 15))}</section>`;
}

export function searchResults(q) {
  const t = q.trim().toLowerCase();
  if (!t) return '<div class="panel"><div class="empty">Ketik untuk mencari produk, halaman, dan fitur.</div></div>';
  const prods = Object.entries(PRODUCTS).filter(([id, p]) => (p.name + ' ' + p.cat + ' ' + id).toLowerCase().includes(t));
  const pages = Object.entries(PAGES).filter(([id, p]) => (p.title + ' ' + (p.kw || '') + ' ' + id).toLowerCase().includes(t));
  if (!prods.length && !pages.length) return `<div class="panel"><div class="empty">Tidak ditemukan hasil untuk "${esc(q.trim())}".</div></div>`;
  const grp = (h, items) => items ? `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>${h}</h2></div>${items}</section>` : '';
  return grp('Produk (' + prods.length + ')', prods.map(([id, p]) => `<a class="result" href="#exchange"><span>${esc(p.name)}</span><span class="muted small">${esc(p.cat)} · stok ${state.inv[id].qty}</span></a>`).join('')) +
    grp('Halaman (' + pages.length + ')', pages.map(([id, p]) => `<a class="result" href="#${id}"><span>${esc(p.title)}</span><span class="muted small">${p.tahap ? 'Belum tersedia' : 'Tersedia'}</span></a>`).join(''));
}

const VIEWS = { dashboard, warehouse, exchange, production, finance, settings, search, chat };
export function renderPage(id) {
  if (!Object.hasOwn(PAGES, id)) return dashboard();
  return VIEWS[id] ? VIEWS[id]() : placeholder(PAGES[id]);
}
