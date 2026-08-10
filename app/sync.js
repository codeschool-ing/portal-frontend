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

const push = (method, path, body) => {
  if (!configured()) return;
  request(method, path, body).catch((e) => {
    /* Swallowed on purpose, and this is the one place in the portal where that
       is right. The local copy is already written, the routes are idempotent,
       and the next sign-in's import replays whatever was missed. An alert here
       would interrupt a student mid-lesson about something that fixes itself. */
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

/* ---------- the first login ----------

   Import, then read, then replace. Returning what the import reported rather
   than swallowing it: `skipped` is the number worth seeing, and a caller that
   wants to say "12 sections could not be placed" needs it. */
export async function adopt() {
  if (!configured()) return null;

  const local = state.exportLocal();
  const report = await request('POST', '/api/progress/import', local);
  const snapshot = await request('GET', '/api/progress');
  state.replaceWith(snapshot);
  return report;
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
