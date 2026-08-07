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
  /* And the exams, which `adopt` does not carry: the progress import is about
     sections and notes, and an exam result is neither — it is computed from
     attempts the server holds, and this browser's copy is a cache of that. A
     student signing in on a second device would otherwise see a course they
     passed offering to be taken for the first time. */
  await refreshExams();
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
