/* ==========================================================================
   Student Portal — boot.

   LOAD ORDER, and it matters: `dados.js`, the dictionaries and `i18n-runtime.js`
   are CLASSIC scripts, loaded before this module by index.html. Functions
   declared there (`txt`, `applyLanguage`, `saveBase`…) live in the global
   scope and are visible here; the reverse is not automatic, so what the runtime
   needs from us is published by hand just below. It is the price of reusing the
   vitrine's i18n without touching it — and it is cheap next to rewriting five
   languages.

   Those global names stay in Portuguese because `i18n-runtime.js` is a verbatim
   copy of the vitrine's and looks them up by name.
   ========================================================================== */

import { route, whenChanged, start, currentPath, dispatch, goTo } from './routes.js';
import { isChoice } from './catalog.js';
import { subscribe, now } from './state.js';
import { buildRail, toggleLesson } from './rail.js';
import { studentTrack, trackProgress, TRACKS_BY_FAMILY } from './screens/common.js';
import * as api from './api.js';
import { esc } from './text.js';

import signIn from './screens/sign-in.js';
import dashboard from './screens/dashboard.js';
import trackScreen from './screens/track.js';
import course from './screens/course.js';
import lesson from './screens/lesson.js';
import catalogue from './screens/catalog.js';
import certificates from './screens/certificates.js';
import account from './screens/account.js';
import planScreen from './screens/plan.js';
import performance from './screens/performance.js';
import redo from './screens/redo.js';
import notes from './screens/notes.js';
import { courseExamScreen, trackExamScreen } from './screens/exam.js';
import { openSearch, close as closeSearch, searchOpen } from './search-panel.js';
import { closeModal, modalOpen } from './modal.js';
import { wireCopy } from './copy.js';

/* ---------- what the i18n runtime needs from us ---------- */
globalThis.isChoice = isChoice;                  // used by applyContent()
/* Switching language rebuilds the screen. The guard exists because
   `applyLanguage()` is called once at boot, BEFORE the router starts: without
   it, the first screen would be built twice — once by the language, once by
   `start()`. */
let booted = false;
globalThis.redrawAll = () => (booted ? dispatch() : null);

/* ---------- routes ---------- */
route('/entrar', signIn);
route('/painel', dashboard);
route('/trilha', trackScreen);
route('/curso/:id', course);
/* Two routes for the same screen: without the section, it lands on the first
   one. That is what keeps an old link (or the course button) working after the
   lesson turned into several sections. */
route('/curso/:id/prova', courseExamScreen);
route('/trilha/prova', trackExamScreen);
route('/curso/:id/aula/:ix', lesson);
route('/curso/:id/aula/:ix/:sec', lesson);
route('/catalogo', catalogue);
route('/certificados', certificates);
route('/conta', account);
route('/plano', planScreen);
route('/desempenho', performance);
route('/refazer', redo);
route('/notas', notes);

const $ = (s) => document.querySelector(s);
const content = $('#conteudo');
const rail = $('#trilho');

let leaving = null;

whenChanged(async (path, found) => {
  // with no session only the sign-in screen exists — the rest assumes a student
  if (!now().session && path !== '/entrar') return goTo('/entrar');
  if (now().session && path === '/entrar') return goTo('/painel');

  if (leaving) { leaving(); leaving = null; }

  if (!found) {
    content.innerHTML = '<div class="tela"><p class="vazio">' + txt('page not found') + '</p></div>';
    content.setAttribute('aria-label', txt('page not found'));
    return;
  }

  const { title, el, after, onLeave } = await found.r.load(found.params);
  content.textContent = '';
  content.appendChild(el);
  content.scrollTop = 0;

  /* THE TAB DOES NOT CHANGE ITS NAME. It used to say where the student was —
     "ES6+ syntax: let/const… · codeschool.ing" — and the effect was the opposite
     of what was intended: with the portal open next to other tabs, the brand was
     cut off at the end of a long title and the tab stopped being recognisable at
     a glance. The school's name fits whole, and it is what people look for when
     they come back here.

     Each screen's `title` does not die with that: it now names the content
     region. It was `document.title` that announced the screen change to a screen
     reader; freezing the tab without passing that name on would leave the
     navigation mute for anyone who cannot see. */
  document.title = 'codeschool.ing';
  content.setAttribute('aria-label', title);
  if (after) after();
  leaving = onLeave || null;

  const signedIn = Boolean(now().session);
  document.body.classList.toggle('sem-trilho', !signedIn);
  if (signedIn) buildRail(rail, path, found.params);
  else rail.innerHTML = '';
  closeRail();
  paintContext();
});

/* ---------- the context in the bar ----------
   Shows the track and how much of it is done. It reads from the same computation
   the dashboard uses, because two computations of the same number diverge on the
   day one of them changes. */
function paintContext() {
  const cx = $('#nav-contexto');
  const t = now().session ? studentTrack() : null;
  if (!t) { cx.innerHTML = ''; return; }
  const p = trackProgress(t);

  /* The track in the bar is a SELECTOR, not a label. Switching tracks used to
     mean signing out and back in — which is absurd for a choice the student may
     want to revisit at any time, and which costs nothing, because progress is
     per course and a shared course keeps counting. */
  cx.innerHTML =
    '<div class="ctx-caixa">' +
      '<button type="button" class="ctx" aria-haspopup="true" aria-expanded="false">' +
        '<span class="ctx-nome">' + esc(t.name) + '</span>' +
        '<span class="ctx-barra"><span style="width:' + p.pct + '%"></span></span>' +
        '<span class="ctx-pct">' + p.pct + '%</span>' +
        '<span class="ctx-seta" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="ctx-menu" role="menu">' +
        '<a class="ctx-op ctx-mapa" href="#/trilha">' + txt('see the track map') + ' →</a>' +
        TRACKS_BY_FAMILY().map(([family, list]) =>
          '<span class="ctx-grupo">' + txt('trilhas por ' + family) + '</span>' +
          list.map((x) => '<button type="button" class="ctx-op' + (x.id === t.id ? ' on' : '') + '" ' +
            'data-trilha="' + esc(x.id) + '">' + esc(x.name) + '</button>').join('')).join('') +
      '</div>' +
    '</div>';
}

$('#nav-contexto').addEventListener('click', async (e) => {
  const box = $('#nav-contexto .ctx-caixa');
  if (e.target.closest('.ctx')) {
    const opened = box.classList.toggle('aberto');
    box.querySelector('.ctx').setAttribute('aria-expanded', String(opened));
    return;
  }
  const op = e.target.closest('.ctx-op[data-trilha]');
  if (!op) return;
  box.classList.remove('aberto');
  await api.enrol(op.dataset.trilha);
  goTo('/trilha');
});

/* ---------- the account menu ---------- */
function paintAccount() {
  const s = now().session;
  $('#conta-avatar').textContent = (s?.name || '·').trim().charAt(0).toUpperCase() || '·';
  $('#conta-menu').innerHTML = s
    ? '<a class="conta-op" href="#/conta">' + txt('My account') + '</a>' +
      '<a class="conta-op" href="#/plano">' + txt('My plan') + '</a>' +
      '<a class="conta-op" href="#/certificados">' + txt('Certificates') + '</a>' +
      '<a class="conta-op" href="https://codeschool.ing">' + txt('Go to the site') + ' ↗</a>'
    : '<a class="conta-op" href="#/entrar">' + txt('Sign in') + '</a>';
}

$('#conta').addEventListener('click', (e) => {
  if (e.target.closest('.conta-btn')) {
    const c = $('#conta');
    const opened = c.classList.toggle('aberto');
    c.querySelector('.conta-btn').setAttribute('aria-expanded', String(opened));
  } else if (e.target.closest('.conta-op')) {
    $('#conta').classList.remove('aberto');
  }
});

/* ---------- language: the vitrine's selector, unchanged ---------- */
$('#idioma').addEventListener('click', (e) => {
  if (!e.target.closest('.idioma-btn')) return;
  const c = $('#idioma');
  const opened = c.classList.toggle('aberto');
  c.querySelector('.idioma-btn').setAttribute('aria-expanded', String(opened));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#idioma')) $('#idioma').classList.remove('aberto');
  if (!e.target.closest('#conta')) $('#conta').classList.remove('aberto');
  if (!e.target.closest('#nav-contexto')) $('#nav-contexto .ctx-caixa')?.classList.remove('aberto');
});

/* ---------- theme: the vitrine's localStorage key, on purpose ----
   whoever sets the theme on the site finds the portal already in it */
const THEME_KEY = 'codeschool-tema';
function applyTheme(theme) {
  document.documentElement.dataset.tema = theme === 'claro' ? 'claro' : '';
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
  $('#tema-btn').setAttribute('aria-label', theme === 'claro' ? txt('Switch to the dark theme') : txt('Switch to the light theme'));
}
$('#tema-btn').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro');
});

/* ---------- the rail as a drawer, on a narrow screen ---------- */
const closeRail = () => {
  document.body.classList.remove('trilho-aberto');
  $('#trilho-btn').setAttribute('aria-expanded', 'false');
  $('#trilho-veu').hidden = true;
};
$('#trilho-btn').addEventListener('click', () => {
  const opened = document.body.classList.toggle('trilho-aberto');
  $('#trilho-btn').setAttribute('aria-expanded', String(opened));
  $('#trilho-veu').hidden = !opened;
});
$('#trilho-veu').addEventListener('click', closeRail);
$('#trilho').addEventListener('click', (e) => {
  const opener = e.target.closest('.ta-abrir');
  if (opener) {
    // it is a <button> and does not navigate: it only shows or hides that
    // lesson's sections
    toggleLesson(routeParams()?.id, Number(opener.dataset.aula));
    buildRail(rail, currentPath(), routeParams());
    return;
  }
  if (e.target.closest('a')) closeRail();
});
/* Esc closes whatever is on top, in the order the layers stack: modal, search,
   drawer. Without the order, closing the modal would close the drawer behind it
   — which the person was not even looking at. */
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (modalOpen()) closeModal();
  else if (searchOpen()) closeSearch();
  else closeRail();
});

/* The search. The button and ⌘K existed from day one and both only led to the
   catalogue — a shortcut that promised search and delivered navigation. */
$('#busca-btn').addEventListener('click', openSearch);
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  // the slash opens it too, as in almost everywhere that has search — except
  // while typing in a field, where "/" is just a slash
  else if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
    e.preventDefault(); openSearch();
  }
});

/* ---------- the state changed: the frame follows ----------
   The rail and the bar read progress, so marking a lesson has to repaint them —
   otherwise the top bar disagrees with the screen, which is the kind of
   divergence that erodes trust in the number. */
subscribe(() => {
  if (now().session) buildRail(rail, currentPath(), routeParams());
  paintContext();
  paintAccount();
});

function routeParams() {
  const m = currentPath().match(/^\/curso\/([^/]+)/);
  return m ? { id: decodeURIComponent(m[1]) } : null;
}

/* One listener for every code block on every screen — see copy.js. */
wireCopy();

/* ---------- i18n: the vitrine's sequence, in the same order ---------- */
saveBase();     // stores the Portuguese of COURSES/TRACKS/DEPOIMENTOS
mapTexts();       // walks the text nodes of the static skeleton
applyLanguage();  // applies content + texts + selector, and rebuilds the screen

paintAccount();
booted = true;
start();
