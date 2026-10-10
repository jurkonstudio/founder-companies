import { PRODUCTS } from './state.js';
const KEY = 'fc_save';
let ok = true;
export const canSave = () => ok;

function valid(d) {
  if (!d || typeof d !== 'object' || d.v !== 1) return false;
  if (!Number.isFinite(d.cash) || d.cash < 0 || !Array.isArray(d.ledger) || !Array.isArray(d.worth) || !Array.isArray(d.log)) return false;
  if (!d.totals || !d.settings || !d.inv || !d.market) return false;
  return Object.keys(PRODUCTS).every((id) => d.inv[id] && Number.isFinite(d.inv[id].qty) && d.inv[id].qty >= 0 && d.market[id] && Number.isFinite(d.market[id].price));
}

export function load(fresh) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    let d = null;
    try { d = JSON.parse(raw); } catch (e) { d = null; }
    if (valid(d)) return d;
    localStorage.setItem(KEY + '_corrupt', raw); // simpan cadangan, jangan dibuang
    return fresh();
  } catch (e) { ok = false; return fresh(); }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); ok = true; } catch (e) { ok = false; }
  return ok;
}
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) { ok = false; } }
