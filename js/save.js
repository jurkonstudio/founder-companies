import { PRODUCTS, BTYPES } from './state.js';
const KEY = 'fc_save';
let ok = true;
export const canSave = () => ok;

function valid(d) {
  if (!d || typeof d !== 'object' || d.v !== 1) return false;
  if (!Number.isFinite(d.cash) || d.cash < 0 || !Array.isArray(d.ledger) || !Array.isArray(d.worth) || !Array.isArray(d.log)) return false;
  if (!d.totals || !d.settings || !d.inv || !d.market) return false;
  if (d.buildings && !Object.values(d.buildings).every((b) => b && BTYPES[b.type] && Number.isFinite(b.paid))) return false;
  return Object.keys(PRODUCTS).every((id) => d.inv[id] && Number.isFinite(d.inv[id].qty) && d.inv[id].qty >= 0 && d.market[id] && typeof d.market[id] === 'object');
}

export function load(fresh) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    let d = null;
    try { d = JSON.parse(raw); } catch (e) { d = null; }
    if (valid(d)) { // migrasi save lama (kas, stok, dan riwayat dipertahankan)
      const f = fresh();
      if (!d.buildings) d.buildings = f.buildings;
      if (!Array.isArray(d.recent)) d.recent = [];
      if (!Number.isFinite(d.totals.fees)) d.totals.fees = 0;
      for (const id of Object.keys(PRODUCTS)) { const m = d.market[id]; if (!Array.isArray(m.asks) || !Array.isArray(m.bids) || !Array.isArray(m.hist)) d.market[id] = f.market[id]; }
      return d;
    }
    localStorage.setItem(KEY + '_corrupt', raw); // simpan cadangan, jangan dibuang
    return fresh();
  } catch (e) { ok = false; return fresh(); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); ok = true; } catch (e) { ok = false; }
  return ok;
}
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) { ok = false; } }
