/* ==========================================================================
   The server, when there is one.

   THE PORTAL HAS TO WORK WITHOUT IT, and that is not a hedge. `bundle.py`
   produces a single file that gets opened off a disk with no server anywhere
   near it, the smoke suite drives that file, and no backend is deployed yet. A
   version of this module that assumed a server would break all three on the day
   it landed and be discovered by whoever opened the bundle.

   So: the backend is CONFIGURED, in one place — <meta name="backend"> in
   index.html — and empty means local. Empty is the default, which makes the
   file:// bundle and every existing test the unchanged path rather than a
   special case somebody has to remember.

   LOCAL-FIRST, AND THE ORDER MATTERS. `state.js` stays the synchronous
   in-memory copy every screen reads; nothing about the screens changes. What
   changes is where that copy comes from on sign-in and where each write goes
   afterwards:

     sign in  →  POST /api/progress/import   the browser's history, first
              →  GET  /api/progress          then the merged truth
              →  state.replaceWith(...)      then the screens

   The import runs BEFORE the first read, and that is the whole of §4.5: read
   first and the student opens the portal to an empty dashboard while their
   progress is still sitting in the browser. They would not wait to find out it
   was a race.

   WRITES ARE FIRE AND FORGET, deliberately. "Advancing is completing" fires one
   per navigation; awaiting each would put a network round trip between a click
   and the next section. They are idempotent server-side, so a lost one is
   recovered by the next sign-in's import rather than by a retry queue nobody
   can see. What is NOT lost is the local copy: it is written first, always.
   ========================================================================== */

import * as state from './state.js';

/* One place, read once. A meta tag rather than a build flag for the same reason
   the version is one: this repository has no build step in the serving path,
   and a value that only existed in the bundle would be missing from the portal
   served from source. */
const CONFIG = (document.querySelector('meta[name="backend"]')?.content || '').trim();

/* `same-origin` is the shape the backend's own config declares — portal and API
   behind one origin, which is what makes the session cookie first-party and
   SameSite=Lax enough. It needs saying explicitly, because the base URL it
   produces is the EMPTY STRING and empty already means "no backend at all".
   Two different things cannot share one value. */
const SAME_ORIGIN = 'same-origin';
const BASE = CONFIG === SAME_ORIGIN ? '' : CONFIG.replace(/\/+$/, '');

export const configured = () => CONFIG !== '';

/* Every request carries the session cookie, which is how identity authenticates
   — so `credentials`, and so a backend on another origin needs CORS with
   credentials allowed. Same-origin needs neither and is the expected shape. */
export async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) {
    /* The server nests it: { error: { code, message } }. Reading `message` off
       the root finds nothing and falls back to the status text, which is how a
       careful sentence like "that address is already registered" reaches a
       student as the word "Conflict". */
    const failure = parsed?.error || {};
    const err = new Error(failure.message || res.statusText);
    err.status = res.status;
    err.code = failure.code;
    throw err;
  }
  return parsed;
}

/* ---------- writes ----------

   Mapped one to one onto the routes, because state.js's granular writers
   already are: marking a section, visiting one and saving a note are the three
   things a student does that the server keeps. */

/* A WRITE THAT DID NOT LAND, remembered as one flag in the document.

   The reason it exists is the next reload. Reading the server back on a kept
   session ends in `replaceWith`, which would erase anything this browser holds
   and the server does not — and a write whose push failed is exactly that. The
   import is what protects it, and the import is expensive: the server checks
   every section against the mirror, two queries each, so running it on every
   page load costs a student hundreds of round trips for nothing.

   One boolean buys the difference. A browser that knows it has unsent work
   imports; every other reload just reads. */
export const hasUnsent = () => Boolean(state.now().unsent);
const markUnsent = () => state.change((e) => { e.unsent = true; });
const clearUnsent = () => { if (hasUnsent()) state.change((e) => { delete e.unsent; }); };

const push = (method, path, body) => {
  if (!configured()) return;
  request(method, path, body).catch((e) => {
    /* Still not shown, and that part was right: the local copy is already
       written and an alert would interrupt a student mid-lesson. What was
       missing is that nothing REMEMBERED it, so "the next sign-in replays it"
       was true and could be months away — and a reload in between would have
       thrown it away. */
    markUnsent();
    if (typeof console !== 'undefined') console.debug('sync', method, path, e.message);
  });
};

const at = (courseId, ix, sectionId) =>
  `/${encodeURIComponent(courseId)}/${ix}/${encodeURIComponent(sectionId)}`;

export function start() {
  if (!configured()) return;
  state.onEveryWrite((event) => {
    switch (event.kind) {
      case 'section':
        // Un-completing is not a route: the server's model is set-true and
        // never toggle, and the portal only clears a section in the redo flow,
        // which is about answers rather than about completion.
        if (event.done) push('PUT', '/api/progress' + at(event.courseId, event.ix, event.sectionId));
        break;
      case 'visit':
        push('POST', `/api/progress/${encodeURIComponent(event.courseId)}/${event.ix}` +
          `/visits/${encodeURIComponent(event.sectionId)}`);
        break;
      case 'note':
        push('PUT', '/api/notes' + at(event.courseId, event.ix, event.sectionId), { body: event.body });
        break;
      case 'erase':
        push('DELETE', '/api/progress');
        break;
      default:
        break;
    }
  });
}

/* WHAT THE SERVER REFUSED TO PLACE, said out loud.

   The import answers with the places it could not find in the catalogue —
   `javascript/1/content` and the like — because the server validates every one
   against the mirror rather than writing whatever it is handed. `adopt` has
   always returned that report faithfully, and all three of its callers threw
   it away, so a record could be refused, then dropped from this browser by the
   `replaceWith` below, and nothing anywhere would have mentioned it.

   That is not hypothetical: it is how a section finished on a screen drawn
   from placeholders disappears. The completion is written against the
   placeholder's section id, the mirror has no such id for a course that really
   does have content, and the row goes nowhere. Reading this would have said so
   on the first reload instead of leaving it to be inferred from a denominator.

   A warning and not an error: nothing is broken, the portal is working exactly
   as designed, and what is lost is one record rather than the session. It
   still has to be legible, so it names them — capped, because a stale document
   against a moved catalogue can produce a great many and a console flooded
   with them says less than ten of them do. */
const announceSkipped = (report) => {
  const skipped = report && report.skipped;
  if (!skipped || !skipped.length || typeof console === 'undefined') return;
  const shown = skipped.slice(0, 10).join(', ');
  console.warn('the server could not place ' + skipped.length
    + ' of this browser\'s records, and they are gone from it now: '
    + shown + (skipped.length > 10 ? ', and ' + (skipped.length - 10) + ' more' : ''));
};

/* ---------- the first login ----------

   Import, then read, then replace. Returning what the import reported rather
   than swallowing it: `skipped` is the number worth seeing, and a caller that
   wants to say "12 sections could not be placed" needs it. Nobody says it on
   screen yet — `announceSkipped` above is the floor, not the ceiling. */
export async function adopt() {
  if (!configured()) return null;

  const report = await request('POST', '/api/progress/import', state.exportLocal());
  await pull();
  /* Everything this browser had is now on the server, so whatever was unsent
     is sent. Cleared after the pull rather than after the import: if the pull
     throws, the document on screen is still the local one and the flag still
     describes it. */
  clearUnsent();
  announceSkipped(report);
  return report;
}

/* The read half of `adopt`, on its own.

   A SWITCHED or RESTORED session needs it and must NOT have the other half:
   importing is for a browser that has history the account does not, and a
   browser being handed back an account it was not signed into has nothing to
   give — at best it sends an empty document, at worst somebody else's. Reading
   is the whole job there.

   A KEPT session is the opposite case and takes the whole of `adopt`: that
   browser WAS signed into this account, so what it holds belongs here and can
   include a write whose push was lost. Reading alone ends in `replaceWith`,
   which would throw that away — a reload losing work is worse than the
   staleness it was meant to cure. */
export async function pull() {
  if (!configured()) return null;

  const snapshot = await request('GET', '/api/progress');
  state.replaceWith(snapshot);
  return snapshot;
}

/* ---------- enrollment ----------

   The track and the forks, which lived only in this browser until the server
   learned them. `GET` answers `null` for a student who has chosen nothing —
   that is a state, not a missing page. */

export const enrollment = () => request('GET', '/api/enrollment');
export const enrol = (trackId) => request('PUT', '/api/enrollment', { trackId });
export const chooseOption = (trackId, index, option) =>
  request('PUT', '/api/enrollment/choices/' + encodeURIComponent(trackId) + '/' + index,
    { option });

/* The read half, into this browser. */
export async function pullEnrollment() {
  if (!configured()) return null;

  const e = await request('GET', '/api/enrollment');
  state.replaceEnrollment(e);
  return e;
}

/* The first login's half, and it FILLS GAPS AND NEVER OVERWRITES — the rule the
   note import already follows, for the same reason. This browser may have been
   used for months before there was an account to attach it to, so what it holds
   is an offer; the account may already have been used somewhere else, and what
   it holds is the record. When the two disagree the account wins, and the offer
   is only taken where the account has nothing.

   Then it reads back, so the browser ends up holding the server's answer either
   way. */
export async function adoptEnrollment() {
  if (!configured()) return null;

  const local = state.now().enrollment;
  if (!local) return pullEnrollment();

  const server = await request('GET', '/api/enrollment');

  if (local.trackId && !server?.trackId) {
    await enrol(local.trackId);
  }
  for (const [key, option] of Object.entries(local.choices || {})) {
    if (server?.choices && key in server.choices) continue;
    /* The key is "<trackId>:<stepIx>" and a track id can contain a hyphen but
       never a colon, so the LAST colon is the separator. */
    const cut = key.lastIndexOf(':');
    if (cut < 0) continue;
    await chooseOption(key.slice(0, cut), key.slice(cut + 1), option);
  }
  return pullEnrollment();
}

/* ---------- session ----------

   Identity's routes, and the shapes it answers with. The portal's own sign-in
   is a skeleton — any name gets in — and stays that way with no backend
   configured; with one, these are real credentials. */

export const signIn = (email, password) => request('POST', '/api/session', { email, password });
export const register = (name, email, password) =>
  request('POST', '/api/accounts', { name, email, password });
export const signOut = () => request('DELETE', '/api/session');
export const session = () => request('GET', '/api/session');
export const account = () => request('GET', '/api/account');
// The account's live sessions, one flagged `current`. Ending one takes its
// public id — never the cookie — and the server scopes the delete to the
// account, so an id only ever reaches its owner's rows. `revokeOtherSessions`
// is the blunt "sign out everywhere else": the server keeps this session (it
// reads its cookie) and drops the rest.
export const sessions = () => request('GET', '/api/sessions');
export const revokeSession = (id) => request('DELETE', '/api/sessions/' + encodeURIComponent(id));
export const revokeOtherSessions = () => request('DELETE', '/api/sessions');
export const changeName = (name) => request('PATCH', '/api/account/name', { name });
// The e-mail change is a request, not an edit: the server mails a link to the
// NEW address and the change only lands once it is clicked (202, not the account).
export const changeEmail = (email) => request('POST', '/api/account/email', { email });
// The server re-checks the current password and, on success, revokes the other
// sessions but keeps this one (it reads this session's cookie for that).
export const changePassword = (current, next) =>
  request('PATCH', '/api/account/password', { current, next });
// Erasing the account. The server re-checks the password and clears the session
// cookie; the cascade on every table referencing the account does the rest.
export const deleteAccount = (password) => request('DELETE', '/api/account', { password });

/* The data export is a file to save, not JSON to read, so it does not go through
   `request`: it wants the raw body as a blob. The session cookie rides along the
   same way. The server names the file in Content-Disposition; the caller uses a
   fixed name and does not need to parse the header. */
export async function exportData() {
  const res = await fetch(BASE + '/api/account/export', { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = res.statusText;
    try { message = JSON.parse(text).error.message || message; } catch { /* keep status text */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}
// Reissue the confirmation link to the account's own address. No body: the
// server sends it wherever the signed-in account's e-mail already is.
export const resendVerification = () => request('POST', '/api/account/verify/resend');

/* ---------- two-factor ----------

   Optional on the server (off with no key), so these are only ever reached when
   the account view says the feature is available. signInMfa is the second step
   of a sign-in that answered { mfaRequired: true }: the challenge rides in a
   cookie the first step set, so only the code travels here. */
export const mfaSetup = () => request('POST', '/api/account/mfa/setup');
export const mfaConfirm = (code) => request('POST', '/api/account/mfa/confirm', { code });
export const mfaDisable = (password) => request('DELETE', '/api/account/mfa', { password });
export const signInMfa = (code) => request('POST', '/api/session/mfa', { code });

/* ---------- the exam ----------

   NOT `push`. Every write above is fire and forget because the local copy is
   already written, the routes are idempotent, and the next sign-in's import
   replays whatever was missed. NONE of that is true here: an exam answer has no
   local copy to fall back on, the import does not carry attempts, and a lost
   one is a lost mark on a paper that closes. So these await, and a failure
   reaches the screen.

   `examStart` returns the attempt in progress or draws a new one — the server
   decides which, and that decision is the whole of ARCHITECTURE.md 4.2. */
const enc = encodeURIComponent;

export const examStart = (scope, scopeId, choices) =>
  request('POST', `/api/exams/${enc(scope)}/${enc(scopeId)}`, choices ? { choices } : undefined);

export const examAnswer = (attemptId, exerciseId, response) =>
  request('PUT', `/api/exams/attempts/${enc(attemptId)}/answers/${enc(exerciseId)}`, response);

export const examSubmit = (attemptId) =>
  request('POST', `/api/exams/attempts/${enc(attemptId)}/submit`);

export const examSummaries = () => request('GET', '/api/exams');

/* ---------- certificates ----------

   `GET /api/certificates` mints whatever a passed exam owes and has not been
   asked for yet, so this is a read that can write — and it is safe to call on
   every render, because issuing conflicts on (account, scope, scope_id) and
   does nothing the second time. */
export const certificates = () => request('GET', '/api/certificates');

/* The validation page is the BACKEND's, not the portal's.

   `GET /certificate/{code}` is server-rendered HTML — the one route over there
   that answers without a session — because what opens it is a person checking a
   claim or a crawler building a preview card, and a single-page app behind a
   hash route cannot answer either in the first response.

   So the URL printed on a document is built from where the API is, and not from
   where the portal is. Same origin and they coincide; `api.codeschool.ing` and
   they do not, and a hard-coded `codeschool.ing/certificate/…` would be a dead
   link on somebody's profile. */
export function publicUrl(path) {
  if (!configured()) return '';
  return (BASE || location.origin) + path;
}
