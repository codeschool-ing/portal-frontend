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
import {
  lessonExercises as fetchExercises,
  lessonSections,
  putStructure,
  putCourse,
  courseLoaded,
  forLanguage,
} from './lessons.js';
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

/* Which language to ask the server for.

   FROM `<html lang>`, which the i18n runtime writes on every language change —
   see buildLanguagePicker in assets/i18n-runtime.js. It is the only place that
   file publishes the active language outside itself, and reading it costs
   nothing.

   IT USED TO READ localStorage AND THAT WAS WRONG. The runtime stores a
   language only when somebody CHOOSES one in the picker; when it detects the
   browser's instead, it uses it and writes nothing. So a first-time visitor
   reading in Portuguese had an empty store, this asked the server for English,
   and the portal drew a Portuguese interface around an English lesson. Nothing
   failed and nothing logged — the server answered exactly what it was asked.

   That did not exist before the lessons moved: the client did the translating,
   so browser detection reached them without anybody passing a language along.

   `pt-BR` is the html tag for `pt`; the others are the code itself, so the
   part before the hyphen is the code in every case. */
function currentLanguage() {
  const tag = (document.documentElement.lang || 'en').toLowerCase();
  return tag.split('-')[0];
}


/* ---------- the lessons, which used to be four script tags ----------

   They were `window.LESSONS`, shipped by index.html and served to anybody by
   GitHub Pages — see the note in app/lessons.js for why that left the free plan
   unenforceable. They come from the server now, in two pieces that are not the
   same kind of thing.

   THE STRUCTURE IS NOT SOLD, and it is read once for every course at a time.
   The portal needs it before it draws anything with a percentage in it, so it
   belongs to boot rather than to a screen.

   With no backend configured neither of these runs and `window.LESSONS` is
   still there — that is the offline bundle, which is a subscriber's download
   rather than a public page. */
export async function loadLessonStructure() {
  if (!sync.configured()) return;
  forLanguage(currentLanguage());
  try {
    const answer = await sync.request('GET',
      '/api/lessons?lang=' + encodeURIComponent(currentLanguage()));
    putStructure(answer && answer.courses);
  } catch (e) {
    /* Not fatal, and not shown. Without the structure every course looks
       unwritten — a state the portal draws correctly, since 119 of them are —
       and the alternative is an error screen over a portal that still works for
       everything except the shape of a rail. */
    if (typeof console !== 'undefined') console.debug('lesson structure', e.message);
  }
}

/* One course's prose, which IS what the subscription sells.

   It ANSWERS WHAT HAPPENED rather than throwing, because the caller is a screen
   with three different things to draw: the lesson, a lock, or a failure. A
   `plan_required` is not an error — it is the paywall working, and the student
   is being offered something rather than told that something broke. */
export async function loadCourseContent(courseId) {
  if (!sync.configured()) return 'offline';
  forLanguage(currentLanguage());
  if (courseLoaded(courseId)) return 'ready';
  try {
    const answer = await sync.request('GET',
      '/api/lessons/' + encodeURIComponent(courseId)
      + '?lang=' + encodeURIComponent(currentLanguage()));
    putCourse(courseId, answer && answer.courses && answer.courses[0] && answer.courses[0].lessons);
    return 'ready';
  } catch (e) {
    if (e.code === 'plan_required') return 'locked';
    /* A course with nothing written answers 404, and that is not a failure: it
       is the ordinary state of 119 of them. Cached as empty so the screen stops
       asking on every repaint. */
    if (e.status === 404) {
      putCourse(courseId, []);
      return 'ready';
    }
    if (typeof console !== 'undefined') console.debug('lesson content', courseId, e.message);
    return 'failed';
  }
}

/* languageChanged reports whether the language moved since the store was
   filled, dropping it when it did. main.js asks on every redraw, which is the
   signal a language switch produces — the runtime's applyLanguage calls
   redrawAll, and there is no other hook to hang this on. */
export function languageChanged() {
  return forLanguage(currentLanguage());
}

/* The tail both sign-in paths share: adopt the browser's history into the
   account, then read back the exams — see the note below. */
async function afterSignIn(account) {
  state.change((e) => { e.session = { name: account.name, email: account.email }; });
  await sync.adopt();
  /* The track and the forks, offered where the account has none. It is the same
     move `adopt` makes for progress and it is a separate call because it is a
     separate endpoint — the import carries sections and notes, and a track is
     neither. */
  await sync.adoptEnrollment();
  /* And the exams, which `adopt` does not carry: the progress import is about
     sections and notes, and an exam result is neither — it is computed from
     attempts the server holds, and this browser's copy is a cache of that. A
     student signing in on a second device would otherwise see a course they
     passed offering to be taken for the first time. */
  await refreshExams();
  await refreshVerified();
  return state.now().session;
}

/* ---------- what the SERVER thinks, at boot ----------

   THE COOKIE IS THE SESSION; THIS BROWSER ONLY REMEMBERS ONE. `state.session`
   lives in localStorage, which is per-origin, while the session cookie is
   issued for the whole of codeschool.ing — so the two can disagree, in both
   directions, and until this existed the portal never asked:

     signed in at console.codeschool.ing and then opening the portal — the
     cookie is there and valid, and the portal sent the student to sign in
     again;

     signed out somewhere else, or the session expired or was revoked from
     another device — the portal went on drawing a signed-in page whose every
     request came back 401. Nothing said so, and nothing saved.

   The second is the expensive one. The first is a nuisance; the second loses
   work in silence. Neither is only about the console: a browser that keeps
   cookies and drops localStorage, or a student clearing site data, produces
   exactly the same two.

   SO THE SERVER'S ANSWER OUTRANKS THE BROWSER'S MEMORY — except when there is
   no answer. A request that fails changes nothing: a network blip must not sign
   a student out, and offline the local copy is the only truth there is.

   It reports what it did, because the caller has to route on it:

     kept        the two already agreed, or there is nobody either way
     restored    the browser had no session and the server had one
     switched    they had DIFFERENT accounts — the local document belonged to
                 somebody else and was dropped rather than merged
     signed-out  the browser thought it was signed in and the server disagrees
     unknown     the API did not answer */
export async function restoreSession() {
  if (!sync.configured()) return 'kept';

  let answer;
  try {
    answer = await sync.session();
  } catch {
    return 'unknown';
  }

  const local = state.now().session;
  /* `GET /api/session` answers 200 with a body of `null` for a caller carrying
     no session — it is a read, not a refusal. */
  const server = answer && answer.email ? answer : null;

  if (!server) {
    if (!local) return 'kept';
    state.change((e) => { e.session = null; });
    return 'signed-out';
  }

  /* Addresses are `citext` on the server, so they compare without case here
     too — otherwise a student who once typed theirs in capitals would look like
     a different account and lose their document to the handover below. */
  const same = Boolean(local && local.email)
    && local.email.toLowerCase() === server.email.toLowerCase();

  if (same) {
    // The name can have been changed on another device; keep it in step.
    state.change((e) => { e.session = { ...e.session, name: server.name, email: server.email }; });
    await refreshVerified();
    return 'kept';
  }

  /* A DIFFERENT ACCOUNT. Everything in this browser — the track, the plan, the
     resume pointer — belongs to whoever was signed in before, and pulling the
     new account's progress on top of it would leave the rest behind under
     somebody else's name. `forget` empties it WITHOUT telling the server, so
     the account that is leaving keeps its history. */
  const switched = Boolean(local);
  if (switched) state.forget();

  state.change((e) => { e.session = { name: server.name, email: server.email }; });
  await sync.pull();
  /* The track comes back with the progress. Without this the restored student
     lands on a portal that asks them to choose one again — which is most of the
     bug this whole path exists to fix, and the half a progress snapshot cannot
     carry because it does not mention tracks. */
  await sync.pullEnrollment();
  await refreshExams();
  await refreshVerified();
  return switched ? 'switched' : 'restored';
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
  /* A fresh account has no track, so this is purely the offer half: whatever
     this browser had picked before there was an account to attach it to. */
  await sync.adoptEnrollment();
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

/* ---------- enrolment ----------

   THE READ IS LOCAL AND STAYS LOCAL. Every screen that draws the graph asks for
   it, so a fetch here would put a round trip in front of a render. The browser's
   copy is kept in step by the writes below and reconciled at boot by
   `restoreSession` — the same arrangement progress has, and for the same
   reason.

   THE WRITES GO LOCAL FIRST AND SERVER SECOND, which is this project's rule for
   every write (see the note on `onWrite` in state.js): a student choosing a
   track watches the graph redraw, and putting a network round trip in front of
   that would make the school feel slow to say yes. The push is swallowed on
   failure exactly like the progress pushes, because the routes are idempotent
   and the next boot reconciles — the one difference is that the server's answer
   carries `since`, which is the server's to know, so it is merged back when it
   lands. */

export const enrolment = () => echo(state.now().enrollment);

export function enrol(trackId) {
  state.change((e) => {
    e.enrollment = {
      trackId: trackId,
      since: e.enrollment?.since || null,
      choices: e.enrollment?.choices || {},
    };
  });
  if (sync.configured()) {
    sync.enrol(trackId)
      .then((server) => {
        /* `since` answers how long this student has been studying here, which
           only the server knows — and which a change of track does not reset. */
        if (server?.since) {
          state.change((e) => { if (e.enrollment) e.enrollment.since = server.since; });
        }
      })
      .catch(pushFailed('enrol'));
  }
  return echo(state.now().enrollment);
}

/* Settling one fork. It went straight to state.js from the track screen until
   the server learned about forks; routing it through here is what the rest of
   the writes already do, and it is now the only place that knows a fork has two
   places to be written. */
export function chooseOption(trackId, index, option) {
  state.chooseOption(trackId, index, option);
  if (sync.configured()) {
    sync.chooseOption(trackId, index, option).catch(pushFailed('choose option'));
  }
}

/* Swallowed on purpose, and for the reason sync.js gives for the progress
   pushes: the local copy is already written, the routes are idempotent, and the
   next boot reads the server's answer back. An alert here would interrupt a
   student about something that fixes itself. */
const pushFailed = (what) => (e) => {
  if (typeof console !== 'undefined') console.debug('sync', what, e.message);
};

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
