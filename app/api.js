/* ==========================================================================
   API — the layer of make-believe, with the signatures the real backend will
   have.

   Everything here is `async` on purpose, even when it reads from localStorage:
   if the screens are written against synchronous functions, moving to `fetch`
   later becomes a refactor of every one of them. Async now costs one word;
   synchronous later costs the whole portal.

   What is make-believe today and a server tomorrow is marked FUTURE.
   ========================================================================== */

import * as state from './state.js';
import * as sync from './sync.js';
import {
  courseLessons,
  courseById,
  trackById,
} from './catalog.js';
import { lessonExercises as fetchExercises, lessonSections } from './lessons.js';
import { gradeLocally, NEEDS_SERVER } from './exercises/grade.js';

const echo = (v) => Promise.resolve(v);

/* ---------- session ---------- */

export const session = () => echo(state.now().session);

/* With no backend configured this is the skeleton it always was: any name gets
   in, because there is nobody to ask. With one, it is identity's `POST
   /api/session` and the name comes back from the server.

   AND THEN THE IMPORT, before anything reads. That ordering is the whole of
   ARCHITECTURE.md 4.5: read first and the student lands on a dashboard showing
   nothing while their progress is still sitting in this browser. They would not
   wait around to find out it was a race. */
export async function signIn({ name, email, password }) {
  if (!sync.configured()) {
    state.change((e) => { e.session = { name: name || 'Student', email: email || '' }; });
    return state.now().session;
  }

  const account = await sync.signIn(email, password);
  state.change((e) => { e.session = { name: account.name, email: account.email }; });
  await sync.adopt();
  return state.now().session;
}

/* Registration only exists with a backend: there is nothing to register with
   otherwise, and offering it would be a form that pretends. */
export async function register({ name, email, password }) {
  const account = await sync.register(name, email, password);
  state.change((e) => { e.session = { name: account.name, email: account.email }; });
  await sync.adopt();
  return state.now().session;
}

export async function signOut() {
  if (sync.configured()) {
    // The cookie has to go even if the request does not arrive, or the portal
    // says signed-out while the browser still carries a session.
    await sync.signOut().catch(() => {});
  }
  state.change((e) => { e.session = null; });
  return null;
}

/* FUTURE: `PATCH /account/email`, and the change only takes effect once confirmed
   at the NEW address — otherwise changing the e-mail becomes the easiest way to
   take over an account. Here it takes effect right away, because there is
   nowhere to send the confirmation. */
export function changeEmail(email) {
  state.changeEmail(email);
  return echo(state.now().session);
}

/* FUTURE: `PATCH /account/password`, with the current password checked ON THE
   SERVER. The new password is not stored anywhere here — see state.js. */
export function changePassword() {
  state.markPasswordChange();
  return echo(true);
}

/* FUTURE: the billing service. Changing plans will go through checkout,
   proration and an invoice — none of that exists, and the portal does not
   pretend it does. */
export function changePlan(planId) {
  state.changePlan(planId);
  return echo(state.currentPlan());
}

/* ---------- enrolment ---------- */

export const enrolment = () => echo(state.now().enrollment);

export function enrol(trackId) {
  state.change((e) => {
    e.enrollment = { trackId: trackId, choices: e.enrollment?.choices || {} };
  });
  return echo(state.now().enrollment);
}

/* ---------- progress ---------- */

export const progress = () => echo(state.now().progress);

export function completeSection(courseId, ix, sectionId, done = true) {
  state.markSection(courseId, ix, sectionId, done);
  return echo(true);
}

/* Where the student stopped — and now with the SECTION, not just the lesson.
   Returning the top of a four-hour lesson is returning the person to scrolling;
   it is the difference between the feature being useful and being decorative.

   It falls back to the first section of the track when there is no history yet,
   instead of returning null and forcing every screen to invent a fallback. */
export function resumeFrom() {
  const e = state.now();
  const firstSection = (courseId, ix) => {
    const a = courseLessons(courseId)[ix];
    return a ? lessonSections(courseId, a.key)[0]?.id : undefined;
  };

  if (e.last && courseById(e.last.courseId)) {
    const { courseId, lessonIx } = e.last;
    return echo({ ...e.last, sectionId: e.last.sectionId || firstSection(courseId, lessonIx) });
  }
  const t = e.enrollment && trackById(e.enrollment.trackId);
  if (!t) return echo(null);
  const first = t.courses.find((i) => typeof i === 'string');
  if (!first) return echo(null);
  return echo({ courseId: first, lessonIx: 0, sectionId: firstSection(first, 0) });
}

/* ---------- exercises ----------
   FUTURE: comes from the database, filtered by `_verification` — the pipeline
   docs say that field is what decides what the portal publishes first. Today it
   comes from the sample file, and the filter already exists so it does not have
   to be retrofitted later. */
export function lessonExercises(courseId, topicKey, options) {
  return echo(fetchExercises(courseId, topicKey, options));
}

/* Grade one answer.

   Four types are graded on the client because they are pure comparison. Three
   are not: `code` and `expected-output` have to run code, and
   `expression-answer` needs a CAS (sympy). The vitrine's docs already record
   that running student code requires a throwaway container — that is not a
   shortcut, it is the intended design.

   Both paths go through HERE, with the same verdict shape, so the day the
   server exists only the body of the `if` changes. */
export async function grade(ex, answer) {
  if (NEEDS_SERVER.includes(ex.type)) return gradeOnServer(ex, answer);
  return gradeLocally(ex, answer);
}

// FUTURE: POST /grade → throwaway container (execution) or sympy (CAS).
async function gradeOnServer(ex, answer) {
  await new Promise((r) => setTimeout(r, 420));   // the wait is part of the UI
  return {
    correct: null,                                 // null = it was not checked
    simulated: true,
    detail: ex.type === 'expression-answer'
      ? 'Symbolic equivalence needs the CAS on the server.'
      : 'Running the test cases needs the container on the server.',
    response: answer,
  };
}
