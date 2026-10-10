import { PAGES, renderPage, searchResults } from './ui.js';

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
let prev = null, cur = null;

function sync() {
  const open = app.classList.contains('nav-open');
  sidebar.inert = mq.matches && !open;
  menuBtn.setAttribute('aria-expanded', String(open));
}
function closeNav() { app.classList.remove('nav-open'); sync(); }

function bindSearch() {
  const q = document.getElementById('q');
  const out = document.getElementById('results');
  out.innerHTML = searchResults('');
  q.addEventListener('input', () => { out.innerHTML = searchResults(q.value); });
  q.focus();
}

function go() {
  const raw = location.hash.slice(1);
  const id = ALIAS[raw] || raw;
  const page = Object.hasOwn(PAGES, id) ? id : 'dashboard';
  if (cur && cur !== page) prev = cur;
  cur = page;
  view.innerHTML = renderPage(page);
  title.textContent = PAGES[page].title;
  document.title = PAGES[page].title + ' · Founder Companies';
  links.forEach((a) => {
    const on = a.dataset.page === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  backBtn.hidden = MAIN.has(page);
  closeNav();
  window.scrollTo(0, 0);
  if (page === 'search') bindSearch();
}

menuBtn.addEventListener('click', () => { app.classList.toggle('nav-open'); sync(); });
document.getElementById('scrim').addEventListener('click', closeNav);
backBtn.addEventListener('click', () => { location.hash = '#' + (prev || 'dashboard'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
mq.addEventListener('change', sync);
window.addEventListener('hashchange', go);
sync();
go();
