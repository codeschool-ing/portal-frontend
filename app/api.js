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
    // No backend, no address to confirm: mark it verified so the nudge never
    // shows on the offline bundle or a local run.
    state.change((e) => { e.session = { name: name || 'Student', email: email || '', emailVerified: true }; });
    return state.now().session;
  }

  const account = await sync.signIn(email, password);
  /* A second factor is enrolled: the password was right, but no session opened.
     The server set a short-lived challenge cookie; the caller collects a code
     and calls completeMfa. Nothing is written to state until then. */
  if (account && account.mfaRequired) {
    return { mfaRequired: true };
  }
  return afterSignIn(account);
}

/* completeMfa is the second step: the code (TOTP or recovery) against the
   challenge cookie the first step set. On success the session opens, exactly as
   a one-step sign-in ends. */
export async function completeMfa(code) {
  const account = await sync.signInMfa(code);
  return afterSignIn(account);
}

/* The tail both sign-in paths share: adopt the browser's history into the
   account, then read back the exams — see the note below. */
async function afterSignIn(account) {
  state.change((e) => { e.session = { name: account.name, email: account.email }; });
  await sync.adopt();
  /* And the exams, which `adopt` does not carry: the progress import is about
     sections and notes, and an exam result is neither — it is computed from
     attempts the server holds, and this browser's copy is a cache of that. A
     student signing in on a second device would otherwise see a course they
     passed offering to be taken for the first time. */
  await refreshExams();
  await refreshVerified();
  return state.now().session;
}

/* The verified-address flag, for the "confirm your e-mail" nudge. It is not in
   the sign-in or register reply — those carry name and e-mail only — so it comes
   from /api/account, the one place identity exposes emailVerified. Error-swallowing
   on purpose: a missing answer must never block sign-in or sign anyone out, it
   just leaves the banner reading whatever it last knew. */
export async function refreshVerified() {
  if (!sync.configured() || !state.now().session) return;
  try {
    const acc = await sync.account();
    state.change((e) => { if (e.session) e.session.emailVerified = !!acc.emailVerified; });
  } catch { /* keep the last known value */ }
}

/* Ask the server to send the confirmation link again, for the account whose
   address is still unverified. Nothing here touches state — the banner clears
   only once the address is actually confirmed, which the link does. */
export const resendVerification = () => sync.resendVerification();

/* Registration only exists with a backend: there is nothing to register with
   otherwise, and offering it would be a form that pretends. */
export async function register({ name, email, password }) {
  const account = await sync.register(name, email, password);
  state.change((e) => { e.session = { name: account.name, email: account.email }; });
  await sync.adopt();
  // Fresh accounts are unverified, so this is the first place the nudge appears.
  await refreshVerified();
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

/* With a backend the e-mail change is a REQUEST: the server mails a confirmation
   to the NEW address and the change only lands once that link is clicked — so
   the local session keeps its current address here, and the caller tells the
   student to check the new inbox. Without a backend there is nowhere to confirm,
   so the skeleton changes it at once, as it always did. Returns { pending }. */
export async function changeEmail(email) {
  if (sync.configured()) {
    await sync.changeEmail(email);
    return { pending: true };
  }
  state.changeEmail(email);
  return { pending: false };
}

/* The server re-checks the CURRENT password and, on success, revokes the other
   sessions while keeping this one. Both passwords travel; nothing is stored in
   the browser. The skeleton, with no server, just records that it changed. */
export async function changePassword(current, next) {
  if (sync.configured()) {
    await sync.changePassword(current, next);
  } else {
    state.markPasswordChange();
  }
}

/* FUTURE: the billing service. Changing plans will go through checkout,
   proration and an invoice — none of that exists, and the portal does not
   pretend it does. */
export function changePlan(planId) {
  state.changePlan(planId);
  return echo(state.currentPlan());
}

/* Whether a backend is wired at all — the account screen shows the data-export
   and delete-account controls only then, since both are the server's to do. */
export const configured = () => sync.configured();

/* The display name IS wired to the server when there is one (unlike e-mail and
   password above, still local echoes): it is the one identity field the LGPD
   export and the account screen let a student correct, and the name a
   certificate prints. Local-only without a backend, like everything else. */
export async function changeName(name) {
  if (sync.configured()) {
    const acc = await sync.changeName(name);
    state.change((e) => { if (e.session) e.session.name = acc.name; });
  } else {
    state.change((e) => { if (e.session) e.session.name = String(name || '').trim(); });
  }
  return state.now().session;
}

/* Erase the account on the server, then the browser, then sign out. Only ever
   called with a backend — there is no server account to delete otherwise. */
export async function deleteAccount(password) {
  await sync.deleteAccount(password);
  state.reset();
  state.change((e) => { e.session = null; });
}

/* Download everything the server holds for the account, as a file. The blob and
   the save belong to the caller, which has the DOM to trigger it. */
export const exportData = () => sync.exportData();

/* ---------- sessions ----------

   The account's own live sign-ins, and the two ways to end them. Real only with
   a backend: without one there is a single browser and nothing to list, so the
   account screen shows the block only when configured() and these are never
   reached otherwise. Ending a session takes its public id — never a token; the
   server decides which row `current` is and refuses to hand back the secret. */
export const sessions = () => sync.sessions();
export const revokeSession = (id) => sync.revokeSession(id);
export const revokeOtherSessions = () => sync.revokeOtherSessions();

/* ---------- two-factor ----------

   Real only with a backend, and only when that backend offers it (a key is
   configured). The account screen asks mfaState first and shows the section on
   `available`; with no backend it is simply off, like registration. */
export async function mfaState() {
  if (!sync.configured()) return { available: false, enabled: false };
  const acc = await sync.account();
  return { available: !!acc.mfaAvailable, enabled: !!acc.mfaEnabled };
}

// Begin enrolment: { secret, otpauthUrl, qrSvg } for the app. Nothing is on yet.
export const mfaSetup = () => sync.mfaSetup();
// Confirm with a code, turning it on and returning the one-time recovery codes.
export const mfaConfirm = (code) => sync.mfaConfirm(code);
// Turn it off; the server re-checks the password.
export const mfaDisable = (password) => sync.mfaDisable(password);

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

   THREE PATHS, and which one runs is decided here so that no screen has to
   know:

     inside a server-drawn exam  →  the answer is RECORDED and nothing else.
                                    There is no verdict to return: the paper
                                    has no answer key in it, and the result
                                    arrives at submit.
     four types, no exam         →  pure comparison, on the client, because the
                                    feedback is immediate and the wait would be
                                    a network round trip per question.
     the other three             →  `code` and `expected-output` run code and
                                    `expression-answer` needs a CAS; with no
                                    backend they come back unchecked, which is
                                    what they have always done.

   `attempt` is the id of a server-drawn exam and is absent everywhere else.
   Its presence is what tells this function it is grading nothing. */
export async function grade(ex, answer, attempt) {
  if (attempt) return recordExamAnswer(attempt, ex, answer);
  if (NEEDS_SERVER.includes(ex.type)) return gradeOnServer(ex, answer);
  return gradeLocally(ex, answer);
}

/* The wire shape, one named field per kind.

   Named rather than a bare value, so the server can answer 400 with the shape
   it expected instead of grading a zero value as wrong — which would look, to
   the student, exactly like having got it wrong. `matching` is here for
   completeness and is not drawn into an exam yet: its screen checks each pair
   the moment it is made, which needs the pairing the exam withholds. */
function toWire(ex, answer) {
  switch (ex.type) {
    case 'quiz': return { choice: answer };
    case 'multiple-choice': return { choices: answer || [] };
    case 'ordering': return { order: answer || [] };
    case 'matching': return { pairs: answer || [] };
    case 'expected-output': return { text: answer == null ? '' : String(answer) };
    case 'code': return { source: answer == null ? '' : String(answer) };
    case 'expression-answer': return { expression: answer == null ? '' : String(answer) };
    default: return { response: answer };
  }
}

/* Awaited, unlike every other write the portal sends the server.

   The others are fire and forget because the local copy is already written and
   the next sign-in replays what was missed. An exam answer has neither: it is
   a mark on a paper that closes, so a failure has to reach the student while
   they can still press the button again. */
async function recordExamAnswer(attempt, ex, answer) {
  await sync.examAnswer(attempt, ex.id, toWire(ex, answer));
  return { correct: null, recorded: true };
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

/* ---------- the exam ----------

   Two implementations of one signature, and the choice is `sync.configured()`.
   With no backend the portal draws and grades its own exam, which is what it
   has always done and what the single-file bundle still has to do off a disk.
   With one, the paper is the server's: drawn there, stamped into an attempt,
   and graded there.

   The difference a student can see is that the second one holds the verdict
   even from the browser's memory. The first cannot — the answer key is in the
   page — and that is the honest limit of a portal with no server, not a bug. */
export const examOnServer = () => sync.configured();

export async function startExam(scope, scopeId, choices) {
  const attempt = await sync.examStart(scope, scopeId, choices);
  return {
    id: attempt.id,
    ordinal: attempt.ordinal,
    questions: attempt.questions || [],
    responses: attempt.responses || {},
  };
}

export async function submitExam(attemptId) {
  const result = await sync.examSubmit(attemptId);
  // The summary the screens read comes back from the server too, rather than
  // being recomputed here from the result: best-result-wins is its rule and
  // two implementations of it would disagree the first time someone retook a
  // passed exam.
  await refreshExams();
  return result;
}

export async function refreshExams() {
  if (!sync.configured()) return;
  const { exams } = await sync.examSummaries();
  state.replaceExams(exams);
}

/* ---------- certificates ----------

   THE PORTAL NO LONGER MINTS A CODE. It used to hash the course id and the
   student's name into something shaped like `CS-XXXX-XXXX-XXXX`, which was the
   right placeholder while nothing issued one and is the wrong thing to keep now
   that something does: the server's code is the one the public page resolves,
   and a portal showing a different one hands the student a number that answers
   "no certificate under this code" to whoever types it.

   So there are two modes, and they differ in what EXISTS rather than in where a
   code comes from:

     with a backend  →  the certificates are the server's, whole. Code, holder,
                        title and date are the document's own fields, because
                        the row is a snapshot taken at issuance and not a view
                        of the present.
     without one     →  no certificate has been issued, by anybody. The screen
                        still shows what was earned in this browser; what it
                        does not do is put a number on it.

   Not cached in state.js, unlike the exam summaries. Those are read by four
   screens and consulted on every render; this is read by one screen, and a copy
   would be a second place for a revocation to fail to arrive. */
export const certificatesOnServer = () => sync.configured();

export async function certificates() {
  if (!sync.configured()) return [];
  const { certificates: list } = await sync.certificates();
  return list || [];
}

/* Where the code resolves. Empty with no backend, and that emptiness is what
   the screen reads to know there is nothing to link to. */
export const certificateUrl = (code) =>
  sync.publicUrl('/certificate/' + encodeURIComponent(code));
