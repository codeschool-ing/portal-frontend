/* ==========================================================================
   Student state.

   Today it lives in localStorage; in Stage 2 it lives on the server. That is
   why nobody outside this module reads `localStorage` directly — whoever needs
   data calls `api.js`, which calls in here. Swapping the persistence is
   swapping one file.

   THE UNIT OF PROGRESS IS THE SECTION, NOT THE LESSON.
   A catalogue topic runs 4 hours on average, and half of them enumerate three
   or more subjects in the title. Counting lessons made the student's bar move
   in four-hour jumps, which is nearly the same as not moving. `lessonDone`
   became derived: a lesson is done when all of its sections are.

   THE STORED SHAPE IS ENGLISH, AND GETTING THERE NEEDED A MIGRATION. It used
   to be Portuguese (`sessao`, `progresso`, `secoes`…), and a browser holding
   that document would be read against a shape asking for `progress`, find
   nothing and report a student who never started — silently. `migrate()` below
   rewrites it on read, once. Do not rename a stored key without extending it.
   ========================================================================== */

import {
  courseLessons,
} from './catalog.js';
import { lessonSections, countableSections, sectionCount } from './lessons.js';

const KEY = 'codeschool-portal';

const EMPTY = {
  session: null,      // { name, email }
  enrollment: null,   // { trackId, choices: { 'backend:3': 1 } }
  progress: {},       // { courseId: { lessons: { ix: { sections, exercises } } } }
  notes: {},          // { courseId: { lessonIx: { sectionId: text } } }
  exams: {},          // { 'course:javascript': { attempts, best, passed } }
  account: null,      // { planId, since } — fiction today, billing tomorrow
  last: null,         // { courseId, lessonIx, sectionId } — the "carry on from here"
};

/* ---------- the Portuguese → English migration ----------

   RENAMING THE STORED KEYS WITHOUT THIS SILENTLY ZEROES EVERY STUDENT. A
   browser that already holds `{ progresso: {...} }` would be read against a
   shape that asks for `progress`, find nothing, and fall back to EMPTY — no
   error, no warning, just a portal that says the student never started. That
   is the single most expensive thing this rename could break, so it is handled
   at the only place the old shape can still be seen: the read.

   It is the same move `ensureLesson` already makes one level down, where the
   old one-checkbox-per-lesson record becomes a set of sections on first write.
   This one runs one level up and rewrites the whole document at once, because
   every top-level key moved together.

   It is idempotent by construction: it only fires when a legacy key is present,
   and the new shape has none of them. Running it twice is running it once.

   The exam scope keys move with the values — `curso:javascript` becomes
   `course:javascript` — because the scope is part of the key, not of the
   record. Miss that and a passed exam becomes a second, empty one. */
const LEGACY_TOP = {
  sessao: 'session', matricula: 'enrollment', progresso: 'progress',
  notas: 'notes', provas: 'exams', conta: 'account', ultima: 'last',
};
const LEGACY_FIELDS = {
  nome: 'name', trilhaId: 'trackId', escolhas: 'choices',
  aulas: 'lessons', secoes: 'sections', exercicios: 'exercises', concluida: 'completed',
  tentativas: 'attempts', melhor: 'best', aprovado: 'passed',
  ultimoPct: 'lastPct', ultimoCertos: 'lastCorrect', ultimoTotal: 'lastTotal',
  ultimaEm: 'lastAt', acertou: 'correct', conferido: 'checked',
  planoId: 'planId', desde: 'since', senhaEm: 'passwordAt',
  cursoId: 'courseId', aulaIx: 'lessonIx', secId: 'sectionId',
};

/* Renames keys everywhere in the tree. It cannot rename VALUES, and it must not
   try: a note's text is a value, and a note that happens to read "lessons" is the
   student's sentence, not a key of ours. */
function renameKeys(node) {
  if (Array.isArray(node)) return node.map(renameKeys);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  Object.entries(node).forEach(([k, v]) => { out[LEGACY_FIELDS[k] || k] = renameKeys(v); });
  return out;
}

export function migrate(raw) {
  const legacy = Object.keys(LEGACY_TOP).filter((k) => k in raw);
  if (!legacy.length) return raw;

  const out = { ...raw };
  legacy.forEach((k) => { out[LEGACY_TOP[k]] = out[k]; delete out[k]; });

  const moved = renameKeys(out);
  /* Plan ids are stored, so their VALUES move too — a renamed id would silently
     drop the student onto the first plan in the list. */
  const PLANS_MOVED = { estudante: 'student', equipe: 'team' };
  if (moved.account?.planId && PLANS_MOVED[moved.account.planId]) {
    moved.account.planId = PLANS_MOVED[moved.account.planId];
  }
  if (moved.exams) {
    moved.exams = Object.fromEntries(Object.entries(moved.exams).map(([k, v]) =>
      [k.replace(/^curso:/, 'course:').replace(/^trilha:/, 'track:'), v]));
  }
  return moved;
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    return { ...structuredClone(EMPTY), ...migrate(JSON.parse(raw)) };
  } catch (e) {
    return structuredClone(EMPTY);   // private mode or corrupted JSON
  }
}

let state = read();
const listeners = new Set();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  listeners.forEach((f) => f(state));
}

export const now = () => state;
export function subscribe(f) { listeners.add(f); return () => listeners.delete(f); }

export function change(fn) {
  fn(state);
  save();
}

export function reset() {
  state = structuredClone(EMPTY);
  save();
}

/* ---------- reads ----------
   They live here, and not in the screens, because more than one screen asks the
   same question and two computations of the same number diverge on the day one
   of them changes. */

const lessonRecord = (courseId, ix) => state.progress[courseId]?.lessons?.[ix];

export function sectionDone(courseId, ix, sectionId) {
  const r = lessonRecord(courseId, ix);
  if (!r) return false;
  /* Compatibility with the earlier shape, where the whole lesson was a single
     checkbox: an old record marked as finished counts for every section.
     Without this, anyone who already had progress would watch it reset. */
  if (r.sections === undefined) return Boolean(r.completed);
  return Boolean(r.sections[sectionId]);
}

export function lessonProgress(courseId, ix) {
  const a = courseLessons(courseId)[ix];
  if (!a) return { done: 0, total: 0, pct: 0 };
  // only the countable ones: an assessment with no exercises yet shows on
  // screen but stays out of the denominator, or the course would never close
  const sections = countableSections(courseId, a.key);
  const done = sections.filter((s) => sectionDone(courseId, ix, s.id)).length;
  return { done: done, total: sections.length, pct: sections.length ? Math.round((done / sections.length) * 100) : 0 };
}

export const lessonDone = (courseId, ix) => {
  const p = lessonProgress(courseId, ix);
  return p.total > 0 && p.done === p.total;
};

export function courseProgress(courseId) {
  const total = sectionCount(courseId);
  let done = 0;
  courseLessons(courseId).forEach((a, ix) => {
    countableSections(courseId, a.key).forEach((s) => {
      if (sectionDone(courseId, ix, s.id)) done += 1;
    });
  });
  return { done: done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const courseDone = (courseId) => {
  const p = courseProgress(courseId);
  return p.total > 0 && p.done === p.total;
};

/* ---------- exams ----------
   It keeps the BEST result, not the last one. Failing after having already
   passed cannot take away a certificate that was issued — and retaking an exam
   you already passed, to practise, is exactly what we want to encourage.

   The attempt count is what seeds the draw for the next exam: same attempt,
   same exam; new attempt, new exam. */
export const examResult = (key) => state.exams[key] || null;
export const examPassed = (key) => Boolean(state.exams[key]?.passed);
export const examAttempts = (key) => state.exams[key]?.attempts || 0;

export function saveExam(key, { pct, passed, lastCorrect, total }) {
  change(() => {
    const before = state.exams[key] || { attempts: 0, best: 0, passed: false };
    state.exams[key] = {
      attempts: before.attempts + 1,
      best: Math.max(before.best, pct),
      passed: before.passed || passed,
      lastPct: pct,
      lastCorrect,
      lastTotal: total,
      lastAt: new Date().toISOString(),
    };
  });
}

export const answerFor = (courseId, ix, exId) =>
  lessonRecord(courseId, ix)?.exercises?.[exId] || null;

/* ---------- writes ---------- */

function ensureLesson(courseId, ix) {
  const p = state.progress;
  p[courseId] = p[courseId] || { lessons: {} };
  const r = p[courseId].lessons[ix] || {};
  if (r.sections === undefined) {
    // migrate the old shape on the first write, instead of carrying both
    const a = courseLessons(courseId)[ix];
    const all = a ? lessonSections(courseId, a.key) : [];
    r.sections = {};
    if (r.completed) all.forEach((s) => { r.sections[s.id] = true; });
    delete r.completed;
  }
  r.exercises = r.exercises || {};
  p[courseId].lessons[ix] = r;
  return r;
}

export function markSection(courseId, ix, sectionId, done = true) {
  change(() => {
    const r = ensureLesson(courseId, ix);
    if (done) r.sections[sectionId] = true;
    else delete r.sections[sectionId];
    state.last = { courseId: courseId, lessonIx: ix, sectionId };
  });
}

export function visitSection(courseId, ix, sectionId) {
  change(() => {
    ensureLesson(courseId, ix);
    state.last = { courseId: courseId, lessonIx: ix, sectionId };
  });
}

export function saveAnswer(courseId, ix, exId, verdict) {
  change(() => {
    const r = ensureLesson(courseId, ix);
    const before = r.exercises[exId] || { attempts: 0, correct: false, checked: false };
    r.exercises[exId] = {
      attempts: before.attempts + 1,
      // once right, still right: redoing it to practise does not take the credit
      correct: before.correct || verdict.correct === true,
      /* `conferido` separates "got it wrong" from "nobody checked". Without it,
         a code exercise that was answered and never executed was
         indistinguishable from a mistake, and the performance screen would
         count as a failure something that was never judged — the same confusion
         that "unjudged never becomes passed" avoids from the other side of the
         ruler. */
      checked: before.checked || verdict.correct !== null,
      lastAt: new Date().toISOString(),
    };
  });
}

/* ---------- notes ----------
   One per section, free text. It is the only thing in the portal the STUDENT
   writes, and that is why it does not get lost even when the content changes:
   the key is the same one progress uses — course, lesson index, section id. */
export const noteFor = (courseId, ix, sectionId) =>
  state.notes[courseId]?.[ix]?.[sectionId] || '';

export function saveNote(courseId, ix, sectionId, text) {
  change(() => {
    const clean = String(text || '').trim();
    if (!clean) {
      // an empty note is a deleted note: not worth the space nor a row in the list
      if (state.notes[courseId]?.[ix]) delete state.notes[courseId][ix][sectionId];
      return;
    }
    state.notes[courseId] = state.notes[courseId] || {};
    state.notes[courseId][ix] = state.notes[courseId][ix] || {};
    state.notes[courseId][ix][sectionId] = clean;
  });
}

/* Every note, flattened. The notes screen and the search read from here — two
   readings of one source. */
export function allNotes() {
  const out = [];
  Object.entries(state.notes).forEach(([courseId, lessons]) => {
    Object.entries(lessons).forEach(([ix, sections]) => {
      Object.entries(sections).forEach(([sectionId, text]) => {
        out.push({ courseId: courseId, lessonIx: Number(ix), sectionId, text: text });
      });
    });
  });
  return out;
}

/* ---------- performance ----------
   The portal was already recording attempts and hits for each exercise and
   never showing them. This is only the read: the screen is what interprets. */
export function answersGiven() {
  const out = [];
  Object.entries(state.progress).forEach(([courseId, course]) => {
    Object.entries(course.lessons || {}).forEach(([ix, lesson]) => {
      Object.entries(lesson.exercises || {}).forEach(([exId, r]) => {
        out.push({ courseId: courseId, lessonIx: Number(ix), exId, ...r });
      });
    });
  });
  return out;
}

/* ---------- account and plan ----------
   FUTURE: `planoId` comes from the billing service, and changing plans is a
   POST that returns the new one. Here it is a field, so the screens are written
   against the right shape from the start.

   Someone who arrives without a plan lands on the first in the list — not on
   "none": a portal with no plan at all has states that do not exist in real
   life, and every one of them becomes an `if` nobody will ever exercise. */
export function studentAccount() {
  const c = state.account;
  const planId = c?.planId || (window.PLANS?.[0]?.id ?? 'student');
  return { planId: planId, since: c?.since || null, email: state.session?.email || '' };
}

export const currentPlan = () =>
  (window.PLANS || []).find((p) => p.id === studentAccount().planId) || (window.PLANS || [])[0] || null;

export function changePlan(planId) {
  change(() => {
    state.account = { ...(state.account || {}), planId: planId, since: new Date().toISOString() };
  });
}

export function changeEmail(email) {
  change(() => {
    state.session = { ...(state.session || {}), email: String(email || '').trim() };
  });
}

/* The password is NOT stored. There is no client-side hash worth anything, and
   writing the password to localStorage would be worse than having no screen at
   all: it would give the impression that authentication exists. What stays is
   the DATE of the change — which is what the student needs to see, and what the
   server will confirm in Stage 2. */
export function markPasswordChange() {
  change(() => {
    state.account = { ...(state.account || {}), passwordAt: new Date().toISOString() };
  });
}

export function activeOption(trackId, idx) {
  return state.enrollment?.choices?.[trackId + ':' + idx] ?? 0;
}

export function chooseOption(trackId, idx, option) {
  change(() => {
    state.enrollment = state.enrollment || { trackId: trackId, choices: {} };
    state.enrollment.choices = state.enrollment.choices || {};
    state.enrollment.choices[trackId + ':' + idx] = option;
  });
}
