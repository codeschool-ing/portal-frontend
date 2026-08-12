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
  session: null,      // { name, email, emailVerified }
  enrollment: null,   // { trackId, choices: { 'backend:3': 1 } }
  progress: {},       // { courseId: { lessons: { ix: { sections, exercises } } } }
  notes: {},          // { courseId: { lessonIx: { sectionId: text } } }
  exams: {},          // { 'course:javascript': { attempts, best, passed } }
  account: null,      // { planId, since } — fiction today, billing tomorrow
  last: null,         // { courseId, lessonIx, sectionId } — the "carry on from here"
  /* Which generation of PLAN IDS this document speaks. It exists because that
     one rename SWAPPED two values — `student` went from naming the free plan to
     naming the paid one — so the map is not idempotent and must not run twice:
     a second pass would read the `student` it just wrote and demote a paying
     account to `guest`. Every other migration here is safe to re-run, which is
     why this is the only stamp in the document. Fresh documents are born
     current and never migrate. */
  plans: 2,
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

/* Course and track ids moved too, and they are stored as KEYS, not only as
   values: progress and notes are keyed by course id, the exam scope keys carry
   both, and the enrolment carries a track id plus fork choices keyed by it.
   Renaming the catalogue without moving these unjoins every student from their
   own progress — same silence as above, one level down. */
const MOVED_IDS = {
  'web-fundamentos': 'web-fundamentals', 'ia-dev': 'ai-dev',
  'front-qualidade': 'front-quality', 'front-entrega': 'front-delivery',
  'front-multiplataforma': 'front-multiplatform', 'java-funcional': 'java-functional',
  'go-concorrencia': 'go-concurrency', 'go-producao': 'go-production',
  'bancos-sql': 'sql-databases', 'servidores-cache': 'servers-cache',
  'testes-cicd': 'testing-cicd', 'arquitetura': 'architecture', 'escala': 'scale',
  'redes': 'networks', 'nuvem': 'cloud', 'observabilidade': 'observability',
  'dados-fundamentos': 'data-fundamentals', 'modelagem-dw': 'warehouse-modeling',
  'dados-governanca': 'data-governance', 'redes-enderecamento': 'networks-addressing',
  'redes-disponibilidade': 'networks-availability', 'redes-seguranca': 'networks-security',
  'redes-automacao': 'networks-automation', 'prompt-confiabilidade': 'prompt-reliability',
  'ia-seguranca': 'ai-security', 'ia-modelos': 'ai-models',
  'embeddings-vetores': 'embeddings-vectors', 'agentes-mcp': 'agents-mcp',
  'llm-observabilidade': 'llm-observability', 'arquitetura-papel': 'architecture-role',
  'padroes-projeto': 'design-patterns', 'modelagem-arquitetura': 'architecture-modeling',
  'software-corporativo': 'enterprise-software', 'gestao-processos': 'process-management',
  'arquiteto-comunicacao': 'architect-communication',
  'informatica-essencial': 'computing-essentials',
  'sistemas-operacionais': 'operating-systems', 'virtualizacao': 'virtualization',
  'suporte-tecnico': 'tech-support', 'seguranca-fundamentos': 'security-fundamentals',
  'criptografia': 'cryptography', 'ataques-ameacas': 'attacks-threats',
  'defesa-hardening': 'defense-hardening', 'soc-resposta': 'soc-response',
  'nuvem-seguranca': 'cloud-security', 'codigo-seguro': 'secure-code',
  'modelagem-ameacas': 'threat-modeling', 'pipeline-seguro': 'secure-pipeline',
  'bi-negocio': 'bi-business', 'excel-analitico': 'excel-analytics',
  'estatistica': 'statistics', 'dados-limpeza': 'data-cleaning',
  'visualizacao': 'visualization', 'bi-tecnicas': 'bi-techniques',
  'dados-storytelling': 'data-storytelling', 'qa-fundamentos': 'qa-fundamentals',
  'testes-manuais': 'manual-testing', 'automacao-web': 'web-automation',
  'automacao-api-mobile': 'api-mobile-automation',
  'testes-nao-funcionais': 'non-functional-testing', 'dados': 'data',
  'redes-infra': 'networks-infra', 'ia': 'ai', 'arquitetura-software': 'software-architecture',
  'ti-suporte': 'it-support', 'seguranca': 'security', 'python-tec': 'python-tech',
  'go-tec': 'go-tech', 'sql-tec': 'sql-tech',
};

/* Section ids and exercise ids moved with the content, and they are stored keys
   too — one level below the course. A section id is unique only inside its
   course, so the map is scoped by course; an exercise id is globally unique, so
   it is not. Miss these and a student keeps the course but loses every section
   they ticked and every answer they gave in it. */
const MOVED_SECTIONS = {
  'web-fundamentals': {
    'apresentacao': 'intro', 'papeis': 'roles', 'ida-e-volta': 'round-trip',
    'pacote': 'packet', 'quadro': 'frame', 'banda': 'bandwidth', 'latencia': 'latency',
    'vazao': 'throughput', 'porque-camadas': 'why-layers', 'as-camadas': 'the-layers',
    'metodos': 'methods', 'cabecalhos': 'headers', 'sessoes': 'sessions',
    'registro': 'registration', 'propagacao': 'propagation', 'subdominios': 'subdomains',
    'compartilhada': 'shared', 'nuvem': 'cloud', 'escolher': 'choosing',
    'renderizacao': 'rendering', 'elementos': 'elements', 'rede': 'network',
  },
  'html-css': {
    'esqueleto': 'skeleton', 'metadados': 'metadata', 'onde-entra': 'where-they-go',
    'por-que': 'why-not-div', 'regioes': 'regions', 'rotulos': 'labels',
    'tipos': 'field-types', 'validacao': 'validation', 'tabelas': 'tables',
    'imagens': 'images', 'midia': 'media', 'seletores': 'selectors',
    'especificidade': 'specificity', 'cascata': 'cascade', 'caixa': 'box', 'unidades': 'units',
    'fluxo': 'flow', 'eixos': 'axes', 'alinhamento': 'alignment', 'crescer': 'grow-shrink',
    'linhas-colunas': 'rows-columns', 'implicito': 'implicit', 'variaveis': 'variables',
    'tema': 'theme', 'organizar': 'organising', 'transicao': 'transition',
    'utilitarios': 'utilities', 'configurar': 'configuration', 'quando': 'when-not',
  },
  javascript: {
    'apresentacao': 'intro', 'coercao': 'coercion', 'igualdade': 'equality', 'falsos': 'falsy',
    'desestruturar': 'destructuring', 'espalhar': 'spread',
  },
};

const MOVED_EXERCISES = {
  'js-coercao-quiz-1': 'js-coercion-quiz-1', 'js-coercao-multipla-1': 'js-coercion-multiple-1',
  'js-coercao-ordenacao-1': 'js-coercion-ordering-1',
  'js-coercao-associacao-1': 'js-coercion-matching-1',
  'js-coercao-saida-1': 'js-coercion-output-1', 'js-coercao-codigo-1': 'js-coercion-code-1',
  'js-demo-expressao-1': 'js-demo-expression-1', 'js-sintaxe-quiz-1': 'js-syntax-quiz-1',
  'js-objetos-associacao-1': 'js-objects-matching-1', 'est-derivada-1': 'stats-derivative-1',
  'wf-11-saida': 'wf-11-output',
};

const movedId = (id) => MOVED_IDS[id] || id;

/* `course` is the id AFTER the move — this runs once the course keys are already
   renamed, and the section maps are written against the new names. */
function moveSections(course, lessons) {
  const map = MOVED_SECTIONS[course];
  if (!map || !lessons) return lessons;
  const rename = (o, m) => (o ? Object.fromEntries(Object.entries(o).map(([k, v]) => [m[k] || k, v])) : o);
  return Object.fromEntries(Object.entries(lessons).map(([ix, lesson]) => [ix, {
    ...lesson,
    sections: rename(lesson.sections, map),
    exercises: rename(lesson.exercises, MOVED_EXERCISES),
  }]));
}

function moveIds(doc) {
  const keyed = (o) => (o ? Object.fromEntries(Object.entries(o).map(([k, v]) => [movedId(k), v])) : o);
  const out = { ...doc };
  if (out.progress) {
    out.progress = Object.fromEntries(Object.entries(keyed(out.progress)).map(([course, rec]) =>
      [course, { ...rec, lessons: moveSections(course, rec.lessons) }]));
  }
  /* A note is filed under course → lesson index → SECTION id. */
  if (out.notes) {
    out.notes = Object.fromEntries(Object.entries(keyed(out.notes)).map(([course, byLesson]) => {
      const map = MOVED_SECTIONS[course];
      if (!map) return [course, byLesson];
      return [course, Object.fromEntries(Object.entries(byLesson || {}).map(([ix, bySection]) =>
        [ix, Object.fromEntries(Object.entries(bySection || {}).map(([sec, text]) => [map[sec] || sec, text]))]))];
    }));
  }
  if (out.exams) {
    out.exams = Object.fromEntries(Object.entries(out.exams).map(([k, v]) => {
      const [scope, id] = [k.slice(0, k.indexOf(':') + 1), k.slice(k.indexOf(':') + 1)];
      return [scope + movedId(id), v];
    }));
  }
  if (out.last?.courseId) {
    const courseId = movedId(out.last.courseId);
    const map = MOVED_SECTIONS[courseId] || {};
    out.last = { ...out.last, courseId, sectionId: map[out.last.sectionId] || out.last.sectionId };
  }
  /* PLAN IDS MOVED, AND THE TWO SWAPPED NAMES. `student` used to be the FREE
     plan; it is now the PAID one, and free is `guest`. `pro` and the retired
     `team` were paid, so they land on `student`.

     ONCE, AND ONLY ONCE — this is the one migration in this file that is not
     safe to re-run. `pro` becomes `student` on the first pass; without the
     stamp, the second pass would see that `student` and hand a paying account
     the free plan. The same swap in portal-backend (migration 0013) is safe by
     construction because goose runs it once; here the read happens on every
     load, so the document has to remember. */
  if (out.plans !== 2) {
    const PLANS_RENAMED = { student: 'guest', pro: 'student', team: 'student' };
    const to = out.account?.planId && PLANS_RENAMED[out.account.planId];
    if (to) out.account = { ...out.account, planId: to };
    out.plans = 2;
  }
  if (out.enrollment) {
    const e = { ...out.enrollment };
    if (e.trackId) e.trackId = movedId(e.trackId);
    if (e.choices) {
      e.choices = Object.fromEntries(Object.entries(e.choices).map(([k, v]) => {
        const cut = k.lastIndexOf(':');
        return [movedId(k.slice(0, cut)) + k.slice(cut), v];
      }));
    }
    out.enrollment = e;
  }
  return out;
}

export function migrate(raw) {
  const legacy = Object.keys(LEGACY_TOP).filter((k) => k in raw);
  /* The two stages are independent: a browser migrated by the shape rename
     before the ids moved still needs the second one. */
  if (!legacy.length) return moveIds(raw);

  const out = { ...raw };
  legacy.forEach((k) => { out[LEGACY_TOP[k]] = out[k]; delete out[k]; });

  const moved = renameKeys(out);
  /* Plan ids are stored, so their VALUES move too — a renamed id would silently
     drop the student onto the first plan in the list. This is the FIRST of two
     renames: it lands on the English ids of the time, and `moveIds` below then
     carries them to today's (`student` → `guest`, `team` → `student`). Two
     stages, because a browser that stopped at either one still has to arrive. */
  const PLANS_MOVED = { estudante: 'student', equipe: 'team' };
  if (moved.account?.planId && PLANS_MOVED[moved.account.planId]) {
    moved.account.planId = PLANS_MOVED[moved.account.planId];
  }
  if (moved.exams) {
    moved.exams = Object.fromEntries(Object.entries(moved.exams).map(([k, v]) =>
      [k.replace(/^curso:/, 'course:').replace(/^trilha:/, 'track:'), v]));
  }
  return moveIds(moved);
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

/* Where a write goes AFTER localStorage. app/sync.js sets this when a backend
   is configured; with none it stays a no-op, which is what keeps the single-file
   bundle and every screen working with no server anywhere.

   The local copy is written first, always. The server is the second place the
   write goes, never the first — a student mid-lesson does not wait on a network
   round trip to see the next section. */
let onWrite = () => {};
export const onEveryWrite = (fn) => { onWrite = fn; };

export function change(fn) {
  fn(state);
  save();
}

export function reset() {
  state = structuredClone(EMPTY);
  save();
  onWrite({ kind: 'erase' });
}

/* ---------- the server's copy ----------

   `exportLocal` is what POST /api/progress/import takes: the browser's whole
   history, in the shape it is already stored in. It is a clone rather than the
   live object, because the caller sends it over a network and the state must
   not change under it mid-flight.

   `replaceWith` is the other direction, and it replaces exactly what the server
   owns — progress, notes and the resume pointer — and nothing else. Session,
   enrolment, exams and the account are not this module's business to overwrite
   from a progress snapshot, and a wholesale replace would sign the student out
   as a side effect of loading their sections. */
export function exportLocal() {
  return {
    progress: structuredClone(state.progress),
    notes: structuredClone(state.notes),
    last: state.last ? structuredClone(state.last) : null,
  };
}

export function replaceWith(snapshot) {
  if (!snapshot) return;
  const progress = {};
  Object.entries(snapshot.progress || {}).forEach(([courseId, course]) => {
    const lessons = {};
    Object.entries(course.lessons || {}).forEach(([ix, lesson]) => {
      const sections = {};
      (lesson.sections || []).forEach((id) => { sections[id] = true; });
      /* `exercises` is kept from the local copy: the server does not carry
         answers yet — that table waits on the exercises module — and dropping
         them here would erase what the student got right the moment they
         signed in. */
      lessons[ix] = { sections, exercises: state.progress?.[courseId]?.lessons?.[ix]?.exercises || {} };
    });
    progress[courseId] = { lessons };
  });

  const notes = {};
  (snapshot.notes || []).forEach((n) => {
    notes[n.courseId] = notes[n.courseId] || {};
    notes[n.courseId][n.lessonIx] = notes[n.courseId][n.lessonIx] || {};
    notes[n.courseId][n.lessonIx][n.sectionId] = n.body;
  });

  change((e) => {
    e.progress = progress;
    e.notes = notes;
    if (snapshot.resume) {
      e.last = {
        courseId: snapshot.resume.courseId,
        lessonIx: snapshot.resume.lessonIx,
        sectionId: snapshot.resume.sectionId,
      };
    }
  });
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

/* The server's copy of the same thing, replacing this one wholesale.

   Wholesale and not merged, because the server computes it from the attempts it
   holds and this browser's copy is a cache of that — merging would let a result
   erased on one device come back from another. `saveExam` above stays: with no
   backend configured it is still the only record there is.

   `lastCorrect`/`lastTotal` are dropped rather than invented. The summary
   carries the percentage and not the counts behind it, and a zero here would
   render as "0 of 0 questions graded" under a score of 80%. */
export function replaceExams(list) {
  const exams = {};
  (list || []).forEach((e) => {
    exams[e.scope + ':' + e.scopeId] = {
      attempts: e.attempts,
      best: e.best,
      passed: e.passed,
      lastPct: e.lastPct,
      lastAt: e.lastAt,
    };
  });
  change((e) => { e.exams = exams; });
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
  onWrite({ kind: 'section', courseId, ix, sectionId, done });
}

export function visitSection(courseId, ix, sectionId) {
  change(() => {
    ensureLesson(courseId, ix);
    state.last = { courseId: courseId, lessonIx: ix, sectionId };
  });
  onWrite({ kind: 'visit', courseId, ix, sectionId });
}

export function saveAnswer(courseId, ix, exId, verdict) {
  change(() => {
    const r = ensureLesson(courseId, ix);
    const before = r.exercises[exId] || { attempts: 0, correct: false, checked: false };
    r.exercises[exId] = {
      attempts: before.attempts + 1,
      // once right, still right: redoing it to practise does not take the credit
      correct: before.correct || verdict.correct === true,
      /* `checked` separates "got it wrong" from "nobody checked". Without it,
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
  onWrite({ kind: 'note', courseId, ix, sectionId, body: String(text || '').trim() });
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
  const planId = c?.planId || (window.PLANS?.[0]?.id ?? 'guest');
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
