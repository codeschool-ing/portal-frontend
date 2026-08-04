/* ==========================================================================
   Student state.

   Today it lives in localStorage; in Etapa 2 it lives on the server. That is
   why nobody outside this module reads `localStorage` directly — whoever needs
   data calls `api.js`, which calls in here. Swapping the persistence is
   swapping one file.

   THE UNIT OF PROGRESS IS THE SECTION, NOT THE LESSON.
   A catalogue topic runs 4 hours on average, and half of them enumerate three
   or more subjects in the title. Counting lessons made the student's bar move
   in four-hour jumps, which is nearly the same as not moving. `lessonDone`
   became derived: a lesson is done when all of its sections are.

   THE STORED SHAPE KEEPS ITS PORTUGUESE KEYS (`sessao`, `progresso`,
   `secoes`…). They are the persisted format — renaming them would orphan every
   browser that already has state, for no gain that a reader of this file can
   see.
   ========================================================================== */

import {
  courseLessons,
} from './catalog.js';
import { lessonSections, countableSections, sectionCount } from './lessons.js';

const KEY = 'codeschool-portal';

const EMPTY = {
  sessao: null,                 // { nome, email }
  matricula: null,              // { trilhaId, escolhas: { 'backend:3': 1 } }
  progresso: {},                // { cursoId: { aulas: { ix: { secoes, exercicios } } } }
  notas: {},                    // { cursoId: { aulaIx: { secId: text } } }
  provas: {},                   // { 'curso:javascript': { tentativas, melhor, aprovado } }
  conta: null,                  // { planoId, desde } — fiction today, billing tomorrow
  ultima: null,                 // { cursoId, aulaIx, secId } — the "carry on from here"
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
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

const lessonRecord = (courseId, ix) => state.progresso[courseId]?.aulas?.[ix];

export function sectionDone(courseId, ix, secId) {
  const r = lessonRecord(courseId, ix);
  if (!r) return false;
  /* Compatibility with the earlier shape, where the whole lesson was a single
     checkbox: an old record marked as finished counts for every section.
     Without this, anyone who already had progress would watch it reset. */
  if (r.secoes === undefined) return Boolean(r.concluida);
  return Boolean(r.secoes[secId]);
}

export function lessonProgress(courseId, ix) {
  const a = courseLessons(courseId)[ix];
  if (!a) return { feitas: 0, total: 0, pct: 0 };
  // only the countable ones: an assessment with no exercises yet shows on
  // screen but stays out of the denominator, or the course would never close
  const sections = countableSections(courseId, a.chave);
  const done = sections.filter((s) => sectionDone(courseId, ix, s.id)).length;
  return { feitas: done, total: sections.length, pct: sections.length ? Math.round((done / sections.length) * 100) : 0 };
}

export const lessonDone = (courseId, ix) => {
  const p = lessonProgress(courseId, ix);
  return p.total > 0 && p.feitas === p.total;
};

export function courseProgress(courseId) {
  const total = sectionCount(courseId);
  let done = 0;
  courseLessons(courseId).forEach((a, ix) => {
    countableSections(courseId, a.chave).forEach((s) => {
      if (sectionDone(courseId, ix, s.id)) done += 1;
    });
  });
  return { feitas: done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const courseDone = (courseId) => {
  const p = courseProgress(courseId);
  return p.total > 0 && p.feitas === p.total;
};

/* ---------- exams ----------
   It keeps the BEST result, not the last one. Failing after having already
   passed cannot take away a certificate that was issued — and retaking an exam
   you already passed, to practise, is exactly what we want to encourage.

   The attempt count is what seeds the draw for the next exam: same attempt,
   same exam; new attempt, new exam. */
export const examResult = (key) => state.provas[key] || null;
export const examPassed = (key) => Boolean(state.provas[key]?.aprovado);
export const examAttempts = (key) => state.provas[key]?.tentativas || 0;

export function saveExam(key, { pct, aprovado, certos, total }) {
  change(() => {
    const before = state.provas[key] || { tentativas: 0, melhor: 0, aprovado: false };
    state.provas[key] = {
      tentativas: before.tentativas + 1,
      melhor: Math.max(before.melhor, pct),
      aprovado: before.aprovado || aprovado,
      ultimoPct: pct,
      ultimoCertos: certos,
      ultimoTotal: total,
      ultimaEm: new Date().toISOString(),
    };
  });
}

export const answerFor = (courseId, ix, exId) =>
  lessonRecord(courseId, ix)?.exercicios?.[exId] || null;

/* ---------- writes ---------- */

function ensureLesson(courseId, ix) {
  const p = state.progresso;
  p[courseId] = p[courseId] || { aulas: {} };
  const r = p[courseId].aulas[ix] || {};
  if (r.secoes === undefined) {
    // migrate the old shape on the first write, instead of carrying both
    const a = courseLessons(courseId)[ix];
    const all = a ? lessonSections(courseId, a.chave) : [];
    r.secoes = {};
    if (r.concluida) all.forEach((s) => { r.secoes[s.id] = true; });
    delete r.concluida;
  }
  r.exercicios = r.exercicios || {};
  p[courseId].aulas[ix] = r;
  return r;
}

export function markSection(courseId, ix, secId, done = true) {
  change(() => {
    const r = ensureLesson(courseId, ix);
    if (done) r.secoes[secId] = true;
    else delete r.secoes[secId];
    state.ultima = { cursoId: courseId, aulaIx: ix, secId };
  });
}

export function visitSection(courseId, ix, secId) {
  change(() => {
    ensureLesson(courseId, ix);
    state.ultima = { cursoId: courseId, aulaIx: ix, secId };
  });
}

export function saveAnswer(courseId, ix, exId, verdict) {
  change(() => {
    const r = ensureLesson(courseId, ix);
    const before = r.exercicios[exId] || { tentativas: 0, acertou: false, conferido: false };
    r.exercicios[exId] = {
      tentativas: before.tentativas + 1,
      // once right, still right: redoing it to practise does not take the credit
      acertou: before.acertou || verdict.acertou === true,
      /* `conferido` separates "got it wrong" from "nobody checked". Without it,
         a code exercise that was answered and never executed was
         indistinguishable from a mistake, and the performance screen would
         count as a failure something that was never judged — the same confusion
         that "unjudged never becomes passed" avoids from the other side of the
         ruler. */
      conferido: before.conferido || verdict.acertou !== null,
      ultimaEm: new Date().toISOString(),
    };
  });
}

/* ---------- notes ----------
   One per section, free text. It is the only thing in the portal the STUDENT
   writes, and that is why it does not get lost even when the content changes:
   the key is the same one progress uses — course, lesson index, section id. */
export const noteFor = (courseId, ix, secId) =>
  state.notas[courseId]?.[ix]?.[secId] || '';

export function saveNote(courseId, ix, secId, text) {
  change(() => {
    const clean = String(text || '').trim();
    if (!clean) {
      // an empty note is a deleted note: not worth the space nor a row in the list
      if (state.notas[courseId]?.[ix]) delete state.notas[courseId][ix][secId];
      return;
    }
    state.notas[courseId] = state.notas[courseId] || {};
    state.notas[courseId][ix] = state.notas[courseId][ix] || {};
    state.notas[courseId][ix][secId] = clean;
  });
}

/* Every note, flattened. The notes screen and the search read from here — two
   readings of one source. */
export function allNotes() {
  const out = [];
  Object.entries(state.notas).forEach(([courseId, lessons]) => {
    Object.entries(lessons).forEach(([ix, sections]) => {
      Object.entries(sections).forEach(([secId, text]) => {
        out.push({ cursoId: courseId, aulaIx: Number(ix), secId, texto: text });
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
  Object.entries(state.progresso).forEach(([courseId, course]) => {
    Object.entries(course.aulas || {}).forEach(([ix, lesson]) => {
      Object.entries(lesson.exercicios || {}).forEach(([exId, r]) => {
        out.push({ cursoId: courseId, aulaIx: Number(ix), exId, ...r });
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
  const c = state.conta;
  const planId = c?.planoId || (window.PLANS?.[0]?.id ?? 'estudante');
  return { planoId: planId, desde: c?.desde || null, email: state.sessao?.email || '' };
}

export const currentPlan = () =>
  (window.PLANS || []).find((p) => p.id === studentAccount().planoId) || (window.PLANS || [])[0] || null;

export function changePlan(planId) {
  change(() => {
    state.conta = { ...(state.conta || {}), planoId: planId, desde: new Date().toISOString() };
  });
}

export function changeEmail(email) {
  change(() => {
    state.sessao = { ...(state.sessao || {}), email: String(email || '').trim() };
  });
}

/* The password is NOT stored. There is no client-side hash worth anything, and
   writing the password to localStorage would be worse than having no screen at
   all: it would give the impression that authentication exists. What stays is
   the DATE of the change — which is what the student needs to see, and what the
   server will confirm in Etapa 2. */
export function markPasswordChange() {
  change(() => {
    state.conta = { ...(state.conta || {}), senhaEm: new Date().toISOString() };
  });
}

export function activeOption(trackId, idx) {
  return state.matricula?.escolhas?.[trackId + ':' + idx] ?? 0;
}

export function chooseOption(trackId, idx, option) {
  change(() => {
    state.matricula = state.matricula || { trilhaId: trackId, escolhas: {} };
    state.matricula.escolhas = state.matricula.escolhas || {};
    state.matricula.escolhas[trackId + ':' + idx] = option;
  });
}
