import { state, SLOTS, BTYPES, RECIPES, PRODUCTS, capacity } from './state.js';
import { worth } from './economy.js';
import { m2, esc } from './utils.js';

let sel = 'hq';
export const setSel = (id) => { if (SLOTS.some((s) => s.id === id)) sel = id; };

// Grid isometrik 6x6. ctr() mengubah koordinat grid (gx,gy) menjadi koordinat layar.
const TW = 64, TH = 32, OX = 200, OY = 84, N = 6;
const ctr = (gx, gy) => [OX + ((gx - gy) * TW) / 2, OY + ((gx + gy) * TH) / 2];
const fmt = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
const poly = (a, fill, x = '') => `<polygon points="${a.map(fmt).join(' ')}" fill="${fill}" ${x}/>`;
const tile = (gx, gy, k = 1) => { const [cx, cy] = ctr(gx, gy); return [[cx, cy - (TH / 2) * k], [cx + (TW / 2) * k, cy], [cx, cy + (TH / 2) * k], [cx - (TW / 2) * k, cy]]; };

const PAL = {
  hq: { l: '#2A4FB0', r: '#356AE6', t: '#6D93F0', w: '#DDE8FF' },
  hq2: { l: '#3A60C4', r: '#4A7BEE', t: '#8DAAF4', w: '#DDE8FF' },
  wh: { l: '#6B7887', r: '#8794A3', t: '#B3BDC8', w: '#2F3A47' },
  ro: { l: '#9A6A1A', r: '#C58A22', t: '#E6B965', w: '#FFF1D6' },
  dk: { l: '#3A4452', r: '#4A5565', t: '#667286', w: '#fff' }
};

function wins(A, B, h, cols, rows, fill) {
  const pt = (u, v) => [A[0] + u * (B[0] - A[0]), A[1] + u * (B[1] - A[1]) - v * h];
  let s = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const u0 = (i + 0.25) / cols, u1 = (i + 0.75) / cols, v0 = 0.12 + ((j + 0.2) / rows) * 0.72, v1 = 0.12 + ((j + 0.7) / rows) * 0.72;
    s += poly([pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)], fill);
  }
  return s;
}
function cube(cx, cy, f, h, c, w) {
  const hw = (TW / 2) * f, hh = (TH / 2) * f;
  const Nn = [cx, cy - hh], E = [cx + hw, cy], S = [cx, cy + hh], W = [cx - hw, cy];
  const u = (p) => [p[0], p[1] - h];
  return poly([W, S, u(S), u(W)], c.l) + poly([S, E, u(E), u(S)], c.r) + poly([u(Nn), u(E), u(S), u(W)], c.t) +
    (w ? wins(W, S, h, w[0], w[1], c.w) + wins(S, E, h, w[0], w[1], c.w) : '');
}

const HEIGHT = { hq: 76, warehouse: 30, roastery: 52 };
function art(type, cx, cy) {
  if (type === 'hq') return cube(cx, cy, 0.9, 38, PAL.hq, [3, 3]) + cube(cx, cy - 38, 0.55, 18, PAL.hq2, [2, 1]) +
    `<line x1="${cx}" y1="${cy - 58}" x2="${cx}" y2="${cy - 72}" stroke="#202B38" stroke-width="1.5"/><circle cx="${cx}" cy="${cy - 73}" r="2.5" fill="#D64545"/>`;
  if (type === 'warehouse') { const hw = 31, S = [cx, cy + 15.7], E = [cx + hw, cy]; return cube(cx, cy, 0.98, 22, PAL.wh) + wins(S, E, 22, 1, 1, PAL.wh.w) + cube(cx - 8, cy - 22, 0.25, 6, PAL.dk); }
  return cube(cx, cy, 0.88, 26, PAL.ro, [2, 1]) + cube(cx - 10, cy - 30, 0.2, 22, PAL.dk) +
    `<circle cx="${cx - 10}" cy="${cy - 62}" r="4" fill="#fff" opacity=".7"/><circle cx="${cx - 6}" cy="${cy - 69}" r="3" fill="#fff" opacity=".5"/>`;
}

function status(b) {
  if (b.type !== 'roastery') return { t: 'Aktif', c: '#16845B' };
  if (state.used >= capacity()) return { t: 'Kapasitas penuh', c: '#C58A22' };
  return state.used > 0 ? { t: 'Berproduksi', c: '#356AE6' } : { t: 'Siap produksi', c: '#16845B' };
}

function slotSvg(s) {
  const b = state.buildings[s.id], [cx, cy] = ctr(s.gx, s.gy), on = s.id === sel;
  const label = b ? `${BTYPES[b.type].name}, level ${b.level}, ${status(b).t}` : 'Lahan kosong';
  let g = `<g data-slot="${s.id}" class="${on ? 'sel' : ''}" tabindex="0" role="button" aria-label="${label}" aria-pressed="${on}">`;
  g += poly(tile(s.gx, s.gy), 'rgba(255,255,255,0.01)', 'class="ring" stroke="transparent" stroke-width="2.5"');
  if (b) {
    g += poly(tile(s.gx, s.gy).map((p) => [p[0] + 9, p[1] + 3]), 'rgba(20,30,45,.16)') + art(b.type, cx, cy);
    g += `<circle cx="${cx + 20}" cy="${cy - HEIGHT[b.type] + 4}" r="4.5" fill="${status(b).c}" stroke="#fff" stroke-width="1.5"/>`;
  } else {
    g += poly(tile(s.gx, s.gy, 0.8), 'none', 'stroke="#7D8DA1" stroke-dasharray="4 3"') + `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="16" fill="#7D8DA1">+</text>`;
  }
  return g + '</g>';
}

const TREES = [[0, 0], [5, 0], [5, 3], [3, 5], [0, 3], [3, 0]];
const tree = ([gx, gy]) => { const [cx, cy] = ctr(gx, gy); return `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 9}" stroke="#7A5C3A" stroke-width="2"/><circle cx="${cx}" cy="${cy - 14}" r="8" fill="#5E9A6B"/><circle cx="${cx + 3}" cy="${cy - 17}" r="4" fill="#7DB58A"/>`; };

function svg() {
  let ground = '';
  for (let gx = 0; gx < N; gx++) for (let gy = 0; gy < N; gy++) {
    const road = gx === 2 || gy === 2;
    ground += poly(tile(gx, gy), road ? '#B8C2CD' : (gx + gy) % 2 ? '#E2E9E0' : '#D9E2D7', 'stroke="#CBD4DC" stroke-width=".5"');
  }
  const items = [...SLOTS.map((s) => ({ d: s.gx + s.gy + 0.5, s: slotSvg(s) })), ...TREES.map((t) => ({ d: t[0] + t[1], s: tree(t) }))].sort((a, b) => a.d - b.d);
  return `<svg class="map" viewBox="0 0 400 280" role="group" aria-label="Peta bisnis isometrik. Ketuk bangunan untuk detail.">${ground}${items.map((i) => i.s).join('')}</svg>`;
}

const kv = (k, v) => `<div class="kv"><span class="muted">${k}</span><strong>${v}</strong></div>`;
const links = (a) => `<div class="quick" style="padding:var(--pad);margin:0">${a.map(([h, t]) => `<a class="btn-link" href="#${h}">${t}</a>`).join('')}</div>`;

function detail() {
  const b = state.buildings[sel];
  if (!b) {
    const cost = BTYPES.roastery.cost, can = state.cash >= cost;
    return `<div class="panel-h"><h2>Lahan kosong</h2><span class="badge">Dapat dibangun</span></div>${kv('Bangunan', 'Roastery')}${kv('Biaya', m2(cost))}${kv('Efek', '+60 unit/hari kapasitas produksi')}${kv('Kas Anda', m2(state.cash))}
      <div class="panel-b"><button class="btn btn-primary" data-act="build" data-id="${sel}"${can ? '' : ' disabled'}>Bangun Roastery · ${m2(cost)}</button>${can ? '' : '<p class="neg small" style="margin-top:6px">Kas tidak cukup.</p>'}<p class="muted small" style="margin-top:6px">Biaya dicatat sebagai aset perusahaan, bukan pengeluaran, dan menambah nilai perusahaan sebesar harga beli.</p></div>`;
  }
  const t = BTYPES[b.type], st = status(b);
  let rows = kv('Jenis', t.name) + kv('Level', b.level) + kv('Status', st.t);
  let acts;
  if (b.type === 'hq') { rows += kv('Nilai perusahaan', m2(worth())) + kv('Biaya operasional', 'Tidak ada'); acts = [['dashboard', 'Dashboard'], ['finance', 'Finance']]; }
  else if (b.type === 'warehouse') {
    const u = Object.values(state.inv).reduce((a, i) => a + i.qty, 0), v = Object.values(state.inv).reduce((a, i) => a + i.qty * i.avg, 0);
    rows += kv('Stok tersimpan', `${u} unit · ${m2(v)}`) + kv('Kapasitas', 'Belum dibatasi') + kv('Biaya operasional', 'Tidak ada'); acts = [['warehouse', 'Buka Warehouse'], ['exchange', 'Exchange']];
  } else {
    const fee = Object.keys(RECIPES).map((r) => `${PRODUCTS[r].name} ${m2(RECIPES[r].fee)}`).join(' · ');
    rows += kv('Kapasitas total', `${capacity()} unit/hari (terpakai ${state.used})`) + kv('Biaya operasional', `per unit: ${fee}`) + kv('Nilai aset', m2(b.paid)); acts = [['production', 'Buka Production'], ['warehouse', 'Warehouse']];
  }
  return `<div class="panel-h"><h2>${esc(t.name)}</h2><span class="badge">${st.t}</span></div>${rows}<p class="muted small" style="padding:var(--pad)">${esc(t.fn)}</p>${links(acts)}`;
}

export function mapPage() {
  if (!SLOTS.some((s) => s.id === sel)) sel = 'hq';
  const n = Object.keys(state.buildings).length;
  return `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2>Peta bisnis</h2><span class="muted small">${n} bangunan · produksi ${capacity()}/hari</span></div>${svg()}</section>
  <section class="panel">${detail()}</section>`;
}
