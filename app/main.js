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
import * as sync from './sync.js';
import { isChoice } from './catalog.js';
import { subscribe, now } from './state.js';
import { buildRail, toggleLesson } from './rail.js';
import { studentTrack, trackProgress } from './screens/common.js';
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
/* THE LANGUAGE SWITCH REACHES THE LESSONS THROUGH HERE, and this is the only
   place it can: the runtime's `applyLanguage()` calls `redrawAll` after
   switching, and offers no other hook.

   It matters because the SERVER translates the lessons now. The runtime still
   swaps every interface string and every catalogue field in place, as it always
   did — but the prose in the store came from an HTTP call that named a
   language, and redrawing would put the old language's paragraphs back on
   screen. `languageChanged()` drops the store when it moved; the structure is
   re-read here and the screens re-ask for the course they are showing. */
globalThis.redrawAll = () => {
  if (!booted) return null;
  if (api.languageChanged()) {
    api.loadLessonStructure().then(dispatch);
  }
  return dispatch();
};

/* ---------- routes ---------- */
/* Before any screen renders: the write hook has to be in place for the first
   click, and configured() is a no-op with no backend. */
sync.start();

route('/sign-in', signIn);
route('/dashboard', dashboard);
route('/track', trackScreen);
route('/course/:id', course);
/* Two routes for the same screen: without the section, it lands on the first
   one. That is what keeps an old link (or the course button) working after the
   lesson turned into several sections. */
route('/course/:id/exam', courseExamScreen);
route('/track/exam', trackExamScreen);
route('/course/:id/lesson/:ix', lesson);
route('/course/:id/lesson/:ix/:sec', lesson);
route('/catalog', catalogue);
route('/certificates', certificates);
route('/account', account);
route('/plan', planScreen);
route('/performance', performance);
route('/redo', redo);
route('/notes', notes);

const $ = (s) => document.querySelector(s);
const content = $('#content');
const rail = $('#rail');

let leaving = null;

whenChanged(async (path, found) => {
  // with no session only the sign-in screen exists — the rest assumes a student
  if (!now().session && path !== '/sign-in') return goTo('/sign-in');
  if (now().session && path === '/sign-in') return goTo('/dashboard');

  if (leaving) { leaving(); leaving = null; }

  if (!found) {
    content.innerHTML = '<div class="view"><p class="empty">' + txt('page not found') + '</p></div>';
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
  document.body.classList.toggle('no-rail', !signedIn);
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
  const cx = $('#nav-context');
  const t = now().session ? studentTrack() : null;
  if (!t) { cx.innerHTML = ''; return; }
  const p = trackProgress(t);

  /* The track in the bar is a SELECTOR, not a label. Switching tracks used to
     mean signing out and back in — which is absurd for a choice the student may
     want to revisit at any time, and which costs nothing, because progress is
     per course and a shared course keeps counting. */
  cx.innerHTML =
    '<div class="ctx-box">' +
      '<button type="button" class="ctx" aria-haspopup="true" aria-expanded="false">' +
        '<span class="ctx-name">' + esc(t.name) + '</span>' +
        '<span class="ctx-bar"><span style="width:' + p.pct + '%"></span></span>' +
        '<span class="ctx-pct">' + p.pct + '%</span>' +
        '<span class="ctx-arrow" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="ctx-menu" role="menu">' +
        '<a class="ctx-op ctx-map" href="#/track">' + txt('see the track map') + ' →</a>' +
        TRACKS.map((x) => '<button type="button" class="ctx-op' + (x.id === t.id ? ' on' : '') + '" ' +
          'data-track="' + esc(x.id) + '">' + esc(x.name) + '</button>').join('') +
      '</div>' +
    '</div>';
}

$('#nav-context').addEventListener('click', async (e) => {
  const box = $('#nav-context .ctx-box');
  if (e.target.closest('.ctx')) {
    const opened = box.classList.toggle('is-open');
    box.querySelector('.ctx').setAttribute('aria-expanded', String(opened));
    if (opened) closeRail();
    return;
  }
  const op = e.target.closest('.ctx-op[data-track]');
  if (!op) return;
  box.classList.remove('is-open');
  await api.enrol(op.dataset.track);
  goTo('/track');
});

/* ---------- the account menu ---------- */
function paintAccount() {
  const s = now().session;
  $('#account-avatar').textContent = (s?.name || '·').trim().charAt(0).toUpperCase() || '·';
  $('#account-menu').innerHTML = s
    ? '<a class="account-op" href="#/account">' + txt('My account') + '</a>' +
      '<a class="account-op" href="#/plan">' + txt('My plan') + '</a>' +
      '<a class="account-op" href="#/certificates">' + txt('Certificates') + '</a>' +
      '<a class="account-op" href="https://codeschool.ing">' + txt('Go to the site') + ' ↗</a>' +
      '<button type="button" class="account-op account-op-btn" id="account-signout">' + txt('Sign out') + '</button>'
    : '<a class="account-op" href="#/sign-in">' + txt('Sign in') + '</a>';
}

$('#account').addEventListener('click', async (e) => {
  if (e.target.closest('.account-btn')) {
    const c = $('#account');
    const opened = c.classList.toggle('is-open');
    c.querySelector('.account-btn').setAttribute('aria-expanded', String(opened));
    if (opened) closeRail();
  } else if (e.target.closest('#account-signout')) {
    // Same as the account screen's button: end the session, land on sign-in.
    $('#account').classList.remove('is-open');
    await api.signOut();
    goTo('/sign-in');
  } else if (e.target.closest('.account-op')) {
    $('#account').classList.remove('is-open');
  }
});

/* ---------- "confirm your e-mail" nudge ----------
   Shown while a signed-in account's address is unverified. It gates nothing —
   registering already signed the student in; this only surfaces that the link in
   their inbox is still unclicked. Dismiss hides it for this page load only, so it
   returns on the next visit until the address is confirmed. Painted here (the
   container is in window.I18N_DYNAMIC) so it survives a screen re-render and picks
   up the language on the next state change, exactly like the account menu. */
let bannerDismissed = false;
function paintVerifyBanner() {
  const el = $('#verify-banner');
  const s = now().session;
  const show = !!(s && s.emailVerified === false) && !bannerDismissed;
  el.hidden = !show;
  document.body.classList.toggle('banner-on', show);
  if (!show) { el.innerHTML = ''; return; }
  el.innerHTML =
    '<span class="vb-text"><strong>' + txt('Confirm your e-mail.') + '</strong> ' +
    txt('We sent a link to') + ' <span class="vb-addr">' + esc(s.email || '') + '</span></span>' +
    '<button type="button" class="vb-resend">' + txt('Resend') + '</button>' +
    '<span class="vb-status" id="vb-status" aria-live="polite"></span>' +
    '<button type="button" class="vb-close" aria-label="' + txt('Dismiss') + '">×</button>';
}
$('#verify-banner').addEventListener('click', async (e) => {
  if (e.target.closest('.vb-close')) { bannerDismissed = true; paintVerifyBanner(); return; }
  const resend = e.target.closest('.vb-resend');
  if (!resend) return;
  // No state changes here, so the banner does not repaint and this feedback
  // survives until the next visit — by which point the link has been clicked or
  // the nudge is back. Disable on success so one click is one mail.
  const status = $('#vb-status');
  resend.disabled = true;
  if (status) { status.textContent = ''; status.classList.remove('bad'); }
  try {
    await api.resendVerification();
    if (status) status.textContent = txt('Sent — check your inbox.');
  } catch {
    resend.disabled = false;
    if (status) { status.textContent = txt('that did not work — try again'); status.classList.add('bad'); }
  }
});

/* ---------- language: the vitrine's selector, unchanged ---------- */
$('#lang').addEventListener('click', (e) => {
  if (!e.target.closest('.lang-btn')) return;
  const c = $('#lang');
  const opened = c.classList.toggle('is-open');
  c.querySelector('.lang-btn').setAttribute('aria-expanded', String(opened));
  if (opened) closeRail();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#lang')) $('#lang').classList.remove('is-open');
  if (!e.target.closest('#account')) $('#account').classList.remove('is-open');
  if (!e.target.closest('#nav-context')) $('#nav-context .ctx-box')?.classList.remove('is-open');
});

/* ---------- theme: the vitrine's localStorage key, on purpose ----
   whoever sets the theme on the site finds the portal already in it */
const THEME_KEY = 'codeschool-theme';
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'light' ? 'light' : '';
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* private mode */ }
  $('#theme-btn').setAttribute('aria-label', theme === 'light' ? txt('Switch to the dark theme') : txt('Switch to the light theme'));
}
$('#theme-btn').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

/* ---------- the rail as a drawer, on a narrow screen ----------

   ONE NAVIGATION SURFACE AT A TIME, and the enforcement was half-written. Any
   click outside a bar menu closes it, so opening the drawer already closed the
   track picker, the account menu and the language picker. Nothing went the
   other way: opening one of those left the drawer standing, and the two then
   overlapped.

   Overlapped, not merely coexisted. The bar is `position:fixed; z-index:100`,
   which makes it a stacking context, so a menu inside it cannot rise above the
   drawer's 110 however large its own z-index is — the track names came out
   sliced down their left edge by the drawer sitting on top of them.

   FIXED BY THE INTERACTION AND NOT THE PAINT ORDER, for two reasons. The bar's
   z-index lives in base.css, which is a copy shared with the vitrine and the
   staff console, so raising it there is a change in three repositories to
   settle an argument in one. And the veil deliberately starts at 64px, leaving
   the bar reachable while the drawer is open — that is a decision, and the
   answer to "you can still use the bar" is that using it puts the drawer away,
   not that the two share the screen. */
const closeRail = () => {
  document.body.classList.remove('rail-open');
  $('#rail-btn').setAttribute('aria-expanded', 'false');
  $('#rail-veil').hidden = true;
};
$('#rail-btn').addEventListener('click', () => {
  const opened = document.body.classList.toggle('rail-open');
  $('#rail-btn').setAttribute('aria-expanded', String(opened));
  $('#rail-veil').hidden = !opened;
});
$('#rail-veil').addEventListener('click', closeRail);
$('#rail').addEventListener('click', (e) => {
  const opener = e.target.closest('.ta-open');
  if (opener) {
    // it is a <button> and does not navigate: it only shows or hides that
    // lesson's sections
    toggleLesson(routeParams()?.id, Number(opener.dataset.lesson));
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
$('#search-btn').addEventListener('click', openSearch);
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
  paintVerifyBanner();
});

function routeParams() {
  const m = currentPath().match(/^\/course\/([^/]+)/);
  return m ? { id: decodeURIComponent(m[1]) } : null;
}

/* One listener for every code block on every screen — see copy.js. */
wireCopy();

/* ---------- i18n: the vitrine's sequence, in the same order ---------- */
saveBase();     // stores the English source strings of COURSES/TRACKS
mapTexts();       // walks the text nodes of the static skeleton
applyLanguage();  // applies content + texts + selector, and rebuilds the screen

/* ---------- who does the SERVER say this is? ----------

   `state.session` is this browser's memory and the cookie is the session
   itself, and they can disagree — see `api.restoreSession`, which is where all
   of that reasoning lives. What is decided HERE is only when to wait for the
   answer, and that is a question about the first paint:

     with a session already stored, the portal draws immediately, as it always
     has. Asking the server costs a round trip that nobody should watch, so the
     answer arrives late and acts only if it disagrees;

     with none, there is nothing to draw but the sign-in screen — so waiting
     costs no paint at all, and NOT waiting costs the returning student a
     sign-in form that flashes up and vanishes, which reads as a broken page.

   With no backend there is nobody to ask and this resolves to `kept` at once,
   which is what keeps the offline bundle and every local run unchanged. */
const restoring = api.restoreSession();

if (sync.configured() && !now().session) {
  content.innerHTML = '<div class="view"><p class="empty">' + txt('checking…') + '</p></div>';
  await restoring;
}

/* The shape of every course, which used to arrive in four `<script>` tags.

   IT IS NOT AWAITED. Every screen that reads a section already copes with a
   course that has nothing written — 119 of 122 do — so a first paint without
   this is provisional rather than broken, and the redraw puts the real shape up
   when it lands. Waiting would put a round trip in front of the first screen in
   order to correct a rail that is about to be correct anyway.

   With no backend it returns at once and `window.LESSONS` still answers, which
   is what leaves the offline bundle exactly as it was. */
api.loadLessonStructure().then(() => { if (booted) redrawAll(); });

paintAccount();
paintVerifyBanner();
booted = true;
start();

restoring.then((outcome) => {
  /* The screen on the page was chosen from what the browser remembered, and the
     server has just contradicted it: re-run the router so the guard at the top
     of this file sends a signed-out student to sign-in, and so a switched
     account's screen is rebuilt from ITS data rather than the previous one's.
     `restored` and `unknown` leave the routing as it stands.

     `KEPT` REDRAWS TOO, AND THAT IS NEW. It used to mean "the two already
     agreed, nothing to do", and it no longer does: a kept session now
     reconciles progress and exams with the server, so by the time this
     resolves the numbers on the screen can be out of date — which is exactly
     what the same account open in two windows looked like. The route does not
     change; the screen is rebuilt from the same store, which is what a
     language switch already does several times a session. */
  if (outcome === 'signed-out' || outcome === 'switched' || outcome === 'kept') dispatch();
});
