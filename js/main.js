import { PAGES, renderPage } from './ui.js';

const app = document.getElementById('app');
const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const links = document.querySelectorAll('#nav a');

function go() {
  const id = location.hash.slice(1);
  const page = Object.hasOwn(PAGES, id) ? id : 'dashboard';
  view.innerHTML = renderPage(page);
  title.textContent = PAGES[page].title;
  document.title = PAGES[page].title + ' · Founder Companies';
  links.forEach((a) => {
    const on = a.dataset.page === page;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  app.classList.remove('nav-open');
  window.scrollTo(0, 0);
}

document.getElementById('menuBtn').addEventListener('click', () => app.classList.toggle('nav-open'));
document.getElementById('scrim').addEventListener('click', () => app.classList.remove('nav-open'));
window.addEventListener('hashchange', go);
go();
