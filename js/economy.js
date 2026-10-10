import { state, PRODUCTS, RECIPES, SLOTS, BTYPES, capacity } from './state.js';
import { save } from './save.js';
import { r2, m2 } from './utils.js';

const SPREAD = 0.03;
const clamp = (p, ref) => Math.min(ref * 2.5, Math.max(ref * 0.4, p));
const fail = (msg) => ({ ok: false, msg });
const okQty = (q) => Number.isInteger(q) && q >= 1 && q <= 10000;

export const worth = () => r2(state.cash + Object.values(state.inv).reduce((a, i) => a + i.qty * i.avg, 0) + Object.values(state.buildings).reduce((a, b) => a + b.paid, 0));
export const profit = () => r2(state.totals.revenue - state.totals.cogs);

function log(msg) { state.log.unshift([state.day, msg]); if (state.log.length > 40) state.log.length = 40; }
function record(e) {
  state.seq += 1;
  state.ledger.unshift({ id: state.seq, day: state.day, cash: state.cash, ...e });
  if (state.ledger.length > 200) state.ledger.length = 200;
  state.worth.push(worth());
  if (state.worth.length > 60) state.worth.shift();
  save(state);
}

// Beli dari/jual ke NPC. Harga eksekusi = rata-rata sepanjang dampak harga, sehingga tidak ada arbitrase.
export function trade(side, id, qty, commit = true) {
  const p = PRODUCTS[id], m = state.market[id], inv = state.inv[id];
  if (!p) return fail('Produk tidak dikenal.');
  if (!okQty(qty)) return fail('Jumlah harus bilangan bulat 1 sampai 10.000.');
  const i = Math.min(0.4, (0.2 * qty) / p.depth);
  if (side === 'buy') {
    if (qty > m.stock) return fail(`Stok NPC hanya ${m.stock} unit.`);
    const unit = r2(m.price * (1 + i / 2) * (1 + SPREAD)), total = r2(unit * qty);
    if (total > state.cash) return fail(`Kas tidak cukup (butuh ${m2(total)}).`);
    if (!commit) return { ok: true, unit, total };
    const n = inv.qty + qty;
    inv.avg = (inv.qty * inv.avg + total) / n; inv.qty = n;
    state.cash = r2(state.cash - total);
    m.stock -= qty; m.price = r2(clamp(m.price * (1 + i), p.ref));
    record({ type: 'buy', pid: id, qty, amount: -total, note: `Beli @ ${m2(unit)}` });
    log(`Anda membeli ${qty} ${p.name} seharga ${m2(total)}`);
    return { ok: true, unit, total, msg: `Membeli ${qty} ${p.name} (${m2(total)}).` };
  }
  if (inv.qty < qty) return fail(`Stok Anda hanya ${inv.qty} unit.`);
  if (qty > m.room) return fail(`NPC hanya mau membeli ${m.room} unit.`);
  const unit = r2(m.price * (1 - i / 2) * (1 - SPREAD)), total = r2(unit * qty);
  if (!commit) return { ok: true, unit, total };
  const cogs = r2(inv.avg * qty);
  inv.qty -= qty; if (inv.qty === 0) inv.avg = 0;
  state.cash = r2(state.cash + total);
  state.totals.revenue = r2(state.totals.revenue + total);
  state.totals.cogs = r2(state.totals.cogs + cogs);
  m.room -= qty; m.price = r2(clamp(m.price * (1 - i), p.ref));
  record({ type: 'sell', pid: id, qty, amount: total, note: `Jual @ ${m2(unit)}, HPP ${m2(cogs)}` });
  log(`Anda menjual ${qty} ${p.name} seharga ${m2(total)}`);
  return { ok: true, unit, total, msg: `Menjual ${qty} ${p.name} (${m2(total)}).` };
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

export function nextDay() {
  state.day += 1; state.used = 0;
  for (const id in PRODUCTS) {
    const p = PRODUCTS[id], m = state.market[id];
    m.stock += Math.round((p.depth - m.stock) * 0.3);
    m.room += Math.round((p.depth - m.room) * 0.3);
    m.price = r2(m.price + (p.ref - m.price) * 0.2);
  }
  log(`Hari ${state.day} dimulai: stok NPC dan harga pasar menyesuaikan`);
  save(state);
}

// Membangun Roastery di lahan kosong. Biaya = aset (bukan pengeluaran), dicatat sebesar harga beli.
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
