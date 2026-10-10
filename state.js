// FASE 1: seluruh data di bawah adalah DATA CONTOH untuk membangun UI.
// Fase 2 akan menggantikannya dengan state ekonomi nyata.
export const SAMPLE = true;

export const state = {
  company: { name: 'Founder Co.', level: 1, reputation: 42 },
  cash: 250000,
  revenue: 48200,
  expenses: 31650,
  prev: { revenue: 44100, expenses: 30900 },
  series: {
    revenue:  [30, 34, 33, 38, 41, 40, 44, 46, 45, 48, 47, 48.2],
    expenses: [24, 26, 27, 27, 29, 30, 30, 31, 31, 32, 31, 31.65]
  },
  market: [
    ['10:00', 'Coffee Beans naik ke $4.20 (permintaan tinggi)'],
    ['09:00', 'Steel Plate turun ke $11.80 (pasokan berlebih)'],
    ['08:00', 'Packaging stabil di $2.05']
  ],
  npc: [
    ['10:00', 'Nusantara Roasters memperluas kapasitas produksi'],
    ['09:00', 'Apex Foods menurunkan harga Coffee Beans'],
    ['07:00', 'Sinar Logam menahan ekspansi karena kas menipis']
  ],
  alerts: [
    { tone: 'warning', text: 'Stok Packaging tersisa 120 unit (kurang dari 2 hari produksi)' },
    { tone: 'danger', text: 'Biaya operasional naik 4,1% dibanding periode lalu' }
  ],
  production: [
    { item: 'Coffee Beans', cap: 400, used: 320, cost: 3.1 },
    { item: 'Ground Coffee', cap: 250, used: 180, cost: 5.4 },
    { item: 'Packaged Coffee', cap: 200, used: 90, cost: 7.9 }
  ]
};
