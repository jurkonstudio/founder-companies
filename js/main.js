import { PAGES, renderPage, searchResults } from './ui.js';
import { state, setState, createState, PRODUCTS } from './state.js';
import { load, save, wipe, canSave } from './save.js';
import { trade, produce, nextDay, build, touchRecent } from './economy.js';
import { setSel } from './map.js';
import { m2 } from './utils.js';

setState(load(createState));

const app = document.getElementById('app');
const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const backBtn = document.getElementById('backBtn');
const links = document.querySelectorAll('a[data-page]');
const mq = window.matchMedia('(max-width:900px)');
const ALIAS = { marketplace: 'exchange', inventory: 'warehouse' };
const MAIN = new Set(['dashboard', 'map', 'warehouse', 'search', 'chat', 'exchange']);
let prev = null, cur = null, toastTimer = null;

function toast(msg, good) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = 'toast ' + (good ? 'ok' : 'err');
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 3500);
}

function sync() {
  const open = app.classList.contains('nav-open');
  sidebar.inert = mq.matches && !open;
  menuBtn.setAttribute('aria-expanded', String(open));
}
function closeNav() { app.classList.remove('nav-open'); sync(); }

function bindSearch() {
  const q = document.getElementById('q'), out = document.getElementById('results');
  out.innerHTML = searchResults('');
  q.addEventListener('input', () => { out.innerHTML = searchResults(q.value); });
  q.focus();
}

function go(keepScroll) {
  const [r0, ...sub] = location.hash.slice(1).split('/');
  const id = ALIAS[r0] || r0;
  const page = Object.hasOwn(PAGES, id) ? id : 'dashboard';
  if (page === 'exchange' && sub[0] && Object.hasOwn(PRODUCTS, sub[0])) touchRecent(sub[0]);
  if (cur && cur !== page) prev = cur;
  cur = page;
  view.innerHTML = renderPage(page, sub);
  title.textContent = PAGES[page].title;
  document.title = PAGES[page].title + ' · Founder Companies';
  links.forEach((a) => {
    const on = a.dataset.page === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  backBtn.hidden = MAIN.has(page);
  document.body.classList.toggle('compact', !!state.settings.compact);
  closeNav();
  if (!keepScroll) window.scrollTo(0, 0);
  if (page === 'search') bindSearch();
}

function qty(key) {
  const el = view.querySelector(`[data-qty="${key}"]`);
  return el ? Number(el.value) : NaN;
}
function limitOf(key) {
  const el = view.querySelector(`[data-limit="${key}"]`);
  if (!el || el.value.trim() === '') return null;
  const n = Number(el.value);
  return n > 0 ? n : NaN;
}
function done(r) {
  toast(r.msg, r.ok);
  if (r.ok && !canSave()) toast('Peringatan: progres tidak dapat disimpan di perangkat ini.', false);
  go(true);
}

view.addEventListener('click', (e) => {
  const sl = e.target.closest('[data-slot]');
  if (sl) { setSel(sl.dataset.slot); return go(true); }
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const { act, id } = b.dataset;
  if (act === 'buy' || act === 'sell') {
    const n = qty('p:' + id), lim = limitOf('p:' + id);
    if (Number.isNaN(lim)) return toast('Batas harga tidak valid.', false);
    const q = trade(act, id, n, { limit: lim, commit: false });
    if (!q.ok) return toast(q.msg, false);
    const txt = act === 'buy' ? `Total ${m2(q.total)}` : `Kotor ${m2(q.total)}, biaya pasar ${m2(q.fee)}, bersih ${m2(q.net)}`;
    if (!confirm(`${act === 'buy' ? 'Beli' : 'Jual'} ${n} ${PRODUCTS[id].name}\nRata-rata ${m2(q.unit)} per unit. ${txt}. Lanjutkan?`)) return;
    done(trade(act, id, n, { limit: lim }));
  } else if (act === 'produce') {
    done(produce(id, qty('r:' + id)));
  } else if (act === 'build') {
    done(build(id));
  } else if (act === 'nextday') {
    nextDay(); done({ ok: true, msg: `Hari ${state.day} dimulai.` });
  } else if (act === 'reset') {
    if (!confirm('Reset game? Semua progres di perangkat ini akan dihapus dan tidak bisa dikembalikan.')) return;
    wipe(); setState(createState()); save(state); done({ ok: true, msg: 'Game direset.' });
  }
});
view.addEventListener('keydown', (e) => {
  const sl = e.target.closest && e.target.closest('[data-slot]');
  if (sl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSel(sl.dataset.slot); go(true); }
});
view.addEventListener('change', (e) => {
  if (e.target.dataset.set === 'compact') {
    state.settings.compact = e.target.checked; save(state);
    document.body.classList.toggle('compact', e.target.checked);
  }
});

menuBtn.addEventListener('click', () => { app.classList.toggle('nav-open'); sync(); });
document.getElementById('scrim').addEventListener('click', closeNav);
backBtn.addEventListener('click', () => { location.hash = '#' + (prev || 'dashboard'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
mq.addEventListener('change', sync);
window.addEventListener('hashchange', () => go(false));
sync();
go(false);
