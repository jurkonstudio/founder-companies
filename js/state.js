// Sumber data tunggal. Semua halaman membaca objek `state` ini.
export const PER_ROASTERY = 60; // kapasitas produksi per Roastery per hari (unit)

export const BTYPES = {
  hq: { name: 'Headquarters', fn: 'Pusat perusahaan. Semua keputusan dan laporan bermuara di sini.' },
  warehouse: { name: 'Warehouse', fn: 'Menyimpan seluruh stok bahan baku dan barang jadi.' },
  roastery: { name: 'Roastery', fn: 'Mengolah bahan menjadi Ground Coffee dan Latte Pack.', cost: 5000 }
};
export const SLOTS = [
  { id: 'hq', gx: 1, gy: 1 }, { id: 'wh', gx: 4, gy: 1 }, { id: 'r1', gx: 1, gy: 4 },
  { id: 'p1', gx: 4, gy: 4 }, { id: 'p2', gx: 0, gy: 5 }
];
export const startBuildings = () => ({ hq: { type: 'hq', level: 1, paid: 0 }, wh: { type: 'warehouse', level: 1, paid: 0 }, r1: { type: 'roastery', level: 1, paid: 0 } });
export const capacity = () => Object.values(state.buildings).filter((b) => b.type === 'roastery').length * PER_ROASTERY;

export const PRODUCTS = {
  beans:  { name: 'Coffee Beans',  cat: 'Bahan baku',          ref: 4,   depth: 200 },
  milk:   { name: 'Fresh Milk',    cat: 'Bahan baku',          ref: 2.5, depth: 200 },
  ground: { name: 'Ground Coffee', cat: 'Barang setengah jadi', ref: 11,  depth: 80 },
  latte:  { name: 'Latte Pack',    cat: 'Barang jadi',         ref: 19,  depth: 60 }
};
export const RECIPES = {
  ground: { inputs: { beans: 2 }, fee: 1 },
  latte:  { inputs: { ground: 1, milk: 1 }, fee: 1.5 }
};

// Pasar simulasi: setiap produk punya buku penawaran jual (asks) dan beli (bids) dari perusahaan NPC.
// Aturan harga: ask selalu >= ref*1.02 dan bid selalu <= ref*0.98, sehingga tidak ada arbitrase.
export const NPCS = ['Nusantara Roasters', 'Apex Foods', 'Sinar Dairy', 'Borneo Trading', 'Kopi Prima', 'Lumina Goods', 'Delta Supply', 'Harapan Corp'];
export const W = [0.10, 0.14, 0.18, 0.22, 0.20, 0.16]; // porsi stok per tingkat harga
export const STEP = 0.012; // selisih harga antar tingkat
const r2 = (n) => Math.round(n * 100) / 100;
export function newMarket(id) {
  const p = PRODUCTS[id], k = Object.keys(PRODUCTS).indexOf(id), pa = r2(p.ref * 1.02), pb = r2(p.ref * 0.98);
  return {
    pa, pb, prev: pa, hist: [pa],
    asks: W.map((w, i) => ({ s: NPCS[(k * 3 + i) % 8], q: Math.round(p.depth * w), p: r2(pa * (1 + STEP * i)) })),
    bids: W.map((w, i) => ({ s: NPCS[(k * 3 + i + 4) % 8], q: Math.round(p.depth * w), p: r2(pb * (1 - STEP * i)) }))
  };
}

export const state = {};
export function setState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, next);
}

export function createState() {
  const market = {}, inv = {};
  for (const id in PRODUCTS) { market[id] = newMarket(id); inv[id] = { qty: 0, avg: 0 }; }
  return { v: 1, day: 1, cash: 10000, seq: 0, used: 0, inv, market, ledger: [], worth: [10000], log: [], recent: [], totals: { revenue: 0, cogs: 0, fees: 0 }, settings: { compact: false }, buildings: startBuildings() };
}
