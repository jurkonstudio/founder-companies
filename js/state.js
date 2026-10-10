// Sumber data tunggal. Semua halaman membaca objek `state` ini.
export const PER_ROASTERY = 60; // kapasitas produksi per Roastery per hari (unit)

// Jenis bangunan dan slot peta (grid isometrik 6x6; koordinat grid terpisah dari koordinat layar).
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
  beans:  { name: 'Coffee Beans',  cat: 'Bahan baku',          ref: 4,    depth: 200 },
  milk:   { name: 'Fresh Milk',    cat: 'Bahan baku',          ref: 2.5,  depth: 200 },
  ground: { name: 'Ground Coffee', cat: 'Barang setengah jadi', ref: 11,   depth: 80 },
  latte:  { name: 'Latte Pack',    cat: 'Barang jadi',         ref: 19,   depth: 60 }
};

// Resep: bahan per 1 unit hasil, dan biaya operasional per unit (dibayar kas).
export const RECIPES = {
  ground: { inputs: { beans: 2 }, fee: 1 },
  latte:  { inputs: { ground: 1, milk: 1 }, fee: 1.5 }
};

export const state = {};
export function setState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, next);
}

export function createState() {
  const market = {}, inv = {};
  for (const id in PRODUCTS) {
    market[id] = { price: PRODUCTS[id].ref, stock: PRODUCTS[id].depth, room: PRODUCTS[id].depth };
    inv[id] = { qty: 0, avg: 0 };
  }
  return { v: 1, day: 1, cash: 10000, seq: 0, used: 0, inv, market, ledger: [], worth: [10000], log: [], totals: { revenue: 0, cogs: 0 }, settings: { compact: false }, buildings: startBuildings() };
}
