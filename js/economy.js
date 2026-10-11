import { state, PRODUCTS, RECIPES, SLOTS, BTYPES, W, STEP, capacity } from './state.js';
import { save } from './save.js';
import { r2, m2 } from './utils.js';

export const FEE = 0.03; // biaya pasar, dibayar penjual (seperti pasar pemain pada umumnya)
const fail = (msg) => ({ ok: false, msg });
const okQty = (q) => Number.isInteger(q) && q >= 1 && q <= 10000;

export const worth = () => r2(state.cash + Object.values(state.inv).reduce((a, i) => a + i.qty * i.avg, 0) + Object.values(state.buildings).reduce((a, b) => a + b.paid, 0));
export const profit = () => r2(state.totals.revenue - state.totals.cogs - (state.totals.fees || 0));

function log(msg) { state.log.unshift([state.day, msg]); if (state.log.length > 40) state.log.length = 40; }
function record(e) {
  state.seq += 1;
  state.ledger.unshift({ id: state.seq, day: state.day, cash: state.cash, ...e });
  if (state.ledger.length > 200) state.ledger.length = 200;
  state.worth.push(worth());
  if (state.worth.length > 60) state.worth.shift();
  save(state);
}
export function touchRecent(id) {
  if (!PRODUCTS[id] || state.recent[0] === id) return;
  state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 5);
  save(state);
}

// Menelusuri buku penawaran dari harga terbaik. Semua-atau-tidak-sama-sekali.
function plan(list, qty, accept) {
  let need = qty, total = 0; const fills = [];
  for (const l of list) {
    if (need === 0) break;
    if (l.q <= 0 || !accept(l.p)) continue;
    const t = Math.min(l.q, need); fills.push([l, t]); total += t * l.p; need -= t;
  }
  return { fills, got: qty - need, total: r2(total) };
}

export function trade(side, id, qty, { limit = null, commit = true } = {}) {
  const p = PRODUCTS[id], m = state.market[id], inv = state.inv[id];
  if (!p) return fail('Produk tidak dikenal.');
  if (!okQty(qty)) return fail('Jumlah harus bilangan bulat 1 sampai 10.000.');
  if (limit !== null && !(limit > 0)) return fail('Batas harga harus lebih dari 0.');
  if (side === 'buy') {
    const pl = plan(m.asks, qty, (x) => limit === null || x <= limit + 1e-9);
    if (pl.got < qty) return fail(pl.got ? `Hanya ${pl.got} unit tersedia${limit !== null ? ' pada harga maks ' + m2(limit) : ''}.` : (limit !== null ? `Tidak ada penawaran dengan harga maks ${m2(limit)}.` : 'Tidak ada penawaran. Coba Hari berikutnya.'));
    if (pl.total > state.cash) return fail(`Kas tidak cukup (butuh ${m2(pl.total)}).`);
    const unit = r2(pl.total / qty);
    if (!commit) return { ok: true, unit, total: pl.total, fee: 0, net: pl.total };
    for (const [l, t] of pl.fills) l.q -= t;
    const n = inv.qty + qty;
    inv.avg = (inv.qty * inv.avg + pl.total) / n; inv.qty = n;
    state.cash = r2(state.cash - pl.total);
    record({ type: 'buy', pid: id, qty, amount: -pl.total, note: `Beli rata-rata ${m2(unit)}` });
    log(`Anda membeli ${qty} ${p.name} seharga ${m2(pl.total)}`);
    return { ok: true, unit, total: pl.total, msg: `Membeli ${qty} ${p.name} (${m2(pl.total)}).` };
  }
  if (inv.qty < qty) return fail(`Stok Anda hanya ${inv.qty} unit.`);
  const pl = plan(m.bids, qty, (x) => limit === null || x >= limit - 1e-9);
  if (pl.got < qty) return fail(pl.got ? `NPC hanya mau membeli ${pl.got} unit${limit !== null ? ' pada harga min ' + m2(limit) : ''}.` : (limit !== null ? `Tidak ada pembeli dengan harga min ${m2(limit)}.` : 'Tidak ada pembeli. Coba Hari berikutnya.'));
  const fee = r2(pl.total * FEE), net = r2(pl.total - fee), unit = r2(pl.total / qty);
  if (!commit) return { ok: true, unit, total: pl.total, fee, net };
  for (const [l, t] of pl.fills) l.q -= t;
  const cogs = r2(inv.avg * qty);
  inv.qty -= qty; if (inv.qty === 0) inv.avg = 0;
  state.cash = r2(state.cash + net);
  state.totals.revenue = r2(state.totals.revenue + pl.total);
  state.totals.cogs = r2(state.totals.cogs + cogs);
  state.totals.fees = r2((state.totals.fees || 0) + fee);
  record({ type: 'sell', pid: id, qty, amount: net, note: `Jual rata-rata ${m2(unit)}, biaya pasar ${m2(fee)}, HPP ${m2(cogs)}` });
  log(`Anda menjual ${qty} ${p.name}, bersih ${m2(net)}`);
  return { ok: true, unit, total: pl.total, fee, net, msg: `Menjual ${qty} ${p.name} (bersih ${m2(net)}).` };
}

export function maxProduce(rid) {
  const r = RECIPES[rid];
  let n = capacity() - state.used, why = n < 1 ? 'Kapasitas harian habis' : '';
  for (const [k, need] of Object.entries(r.inputs)) { const c = Math.floor(state.inv[k].qty / need); if (c < n) { n = c; why = 'Bahan kurang'; } }
  const c = Math.floor(state.cash / r.fee); if (c < n) { n = c; why = 'Kas kurang'; }
  return { n: Math.max(0, n), why: n < 1 ? why : '' };
}

export function produce(rid, qty) {
  const r = RECIPES[rid], out = state.inv[rid];
  if (!r) return fail('Resep tidak dikenal.');
  if (!okQty(qty)) return fail('Jumlah harus bilangan bulat 1 sampai 10.000.');
  if (qty > capacity() - state.used) return fail(`Sisa kapasitas hari ini ${capacity() - state.used} unit.`);
  for (const [k, need] of Object.entries(r.inputs)) if (state.inv[k].qty < need * qty) return fail(`${PRODUCTS[k].name} tidak cukup (butuh ${need * qty}, ada ${state.inv[k].qty}).`);
  const fee = r2(r.fee * qty);
  if (fee > state.cash) return fail(`Kas tidak cukup untuk biaya operasional ${m2(fee)}.`);
  let cost = fee;
  for (const [k, need] of Object.entries(r.inputs)) { const i = state.inv[k]; cost += i.avg * need * qty; i.qty -= need * qty; if (i.qty === 0) i.avg = 0; }
  const n = out.qty + qty;
  out.avg = (out.qty * out.avg + cost) / n; out.qty = n;
  state.cash = r2(state.cash - fee); state.used += qty;
  const used = Object.entries(r.inputs).map(([k, v]) => `${v * qty} ${PRODUCTS[k].name}`).join(' + ');
  record({ type: 'production', pid: rid, qty, amount: -fee, note: `Pakai ${used}` });
  log(`Produksi ${qty} ${PRODUCTS[rid].name}`);
  return { ok: true, msg: `Memproduksi ${qty} ${PRODUCTS[rid].name}.` };
}

// Hari berikutnya: NPC mengisi ulang 30% kekurangan stok/permintaan. Kekurangan stok menaikkan harga jual NPC,
// kelebihan stok menurunkan harga beli NPC. Harga beli tidak pernah di atas 0,98*ref dan harga jual tidak di bawah 1,02*ref.
export function nextDay() {
  state.day += 1; state.used = 0;
  for (const id in PRODUCTS) {
    const p = PRODUCTS[id], m = state.market[id];
    m.prev = m.pa;
    W.forEach((w, i) => {
      const full = Math.round(p.depth * w);
      m.asks[i].q += Math.round((full - m.asks[i].q) * 0.3);
      m.bids[i].q += Math.round((full - m.bids[i].q) * 0.3);
    });
    const shortage = 1 - m.asks.reduce((a, l) => a + l.q, 0) / p.depth, surplus = 1 - m.bids.reduce((a, l) => a + l.q, 0) / p.depth;
    m.pa = r2(p.ref * 1.02 * (1 + 0.15 * shortage));
    m.pb = r2(p.ref * 0.98 * (1 - 0.15 * surplus));
    m.asks.forEach((l, i) => { l.p = r2(m.pa * (1 + STEP * i)); });
    m.bids.forEach((l, i) => { l.p = r2(m.pb * (1 - STEP * i)); });
    m.hist.push(m.pa); if (m.hist.length > 30) m.hist.shift();
  }
  log(`Hari ${state.day} dimulai: stok NPC dan harga pasar menyesuaikan`);
  save(state);
}

export function build(slotId) {
  const slot = SLOTS.find((s) => s.id === slotId);
  if (!slot) return fail('Lahan tidak valid.');
  if (state.buildings[slotId]) return fail('Lahan sudah terisi.');
  const cost = BTYPES.roastery.cost;
  if (state.cash < cost) return fail(`Kas tidak cukup (butuh ${m2(cost)}).`);
  state.cash = r2(state.cash - cost);
  state.buildings[slotId] = { type: 'roastery', level: 1, paid: cost };
  record({ type: 'build', pid: null, qty: 1, amount: -cost, note: 'Bangun Roastery' });
  log('Anda membangun Roastery baru');
  return { ok: true, msg: `Roastery dibangun (${m2(cost)}). Kapasitas produksi ${capacity()}/hari.` };
}
