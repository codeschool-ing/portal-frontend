/* ==========================================================================
   The localStorage migration, exercised against a real browser.

   WHY THIS IS ITS OWN TOOL. The smoke suite starts from an empty browser, so it
   can never see the case that matters here: a student who already has progress
   stored under the OLD Portuguese keys. Renaming those keys without a migration
   does not raise an error — the read finds nothing, falls back to the empty
   shape, and the portal reports that the student never started. It is the most
   expensive thing this rename could break, and the quietest.

   It asserts against the DOCUMENT localStorage ends up holding, not against
   anything the page exposes. That needs no probe hung off the production code,
   and it checks the thing that actually has to be right: what was written back.

       node tools/migration/check.mjs
       PORTAL="file://$PWD" PAGE=/portal-aluno.html node tools/migration/check.mjs
   ========================================================================== */
import { chromium } from 'playwright';

const BASE = process.env.PORTAL || 'http://localhost:8765';
const PAGE = process.env.PAGE || '/index.html';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const KEY = 'codeschool-portal';

let failures = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log((cond ? '  ok   ' : '  FAIL ') + ' ' + name + (extra ? ' — ' + extra : ''));
};

/* A document in the shape the portal wrote before the rename, carrying one of
   each thing that moved: a session, an enrolment with a fork choice, progress
   with both finished sections and an answered exercise, a lesson still in the
   OLDER one-checkbox shape, a note, an exam under a `curso:` scope key, an
   account, and a resume pointer. */
const LEGACY = {
  sessao: { nome: 'Alexandre', email: 'a@exemplo.com' },
  matricula: { trilhaId: 'backend', escolhas: { 'backend:3': 1 } },
  progresso: {
    javascript: {
      aulas: {
        0: {
          secoes: { apresentacao: true, 'let-const': true },
          exercicios: { 'js-coercao-quiz-1': { tentativas: 2, acertou: true, conferido: true, ultimaEm: '2026-01-01T00:00:00.000Z' } },
        },
        1: { concluida: true },
      },
    },
  },
  notas: { javascript: { 0: { 'let-const': 'minha anotação' } } },
  provas: { 'curso:javascript': { tentativas: 1, melhor: 80, aprovado: true, ultimoPct: 80, ultimoCertos: 8, ultimoTotal: 10, ultimaEm: '2026-01-01T00:00:00.000Z' } },
  conta: { planoId: 'pro', desde: '2026-01-01', senhaEm: '2026-01-02' },
  ultima: { cursoId: 'javascript', aulaIx: 0, secId: 'let-const' },
};

const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage();
p.on('pageerror', (e) => { failures += 1; console.log('  PAGEERROR ' + e.message); });

await p.goto(BASE + PAGE);
await p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, LEGACY]);
await p.reload();
await p.waitForFunction(() => location.hash.length > 1);

/* The portal only writes back when something changes, so nudge it once: mark a
   section. That is also the realistic path — a returning student does something. */
await p.evaluate(() => location.hash = '#/course/javascript/lesson/0/let-const');
await p.waitForTimeout(400);

const doc = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);

console.log('\n== the document was rewritten ==');
const legacyKeys = ['sessao', 'matricula', 'progresso', 'notas', 'provas', 'conta', 'ultima'];
ok('no Portuguese top-level key survives', !legacyKeys.some((k) => k in doc), Object.keys(doc).join(', '));

console.log('\n== and every value came across ==');
const lesson0 = doc.progress?.javascript?.lessons?.[0];
ok('the name survived', doc.session?.name === 'Alexandre', doc.session?.name);
ok('the enrolment and its fork choice survived',
  doc.enrollment?.trackId === 'backend' && doc.enrollment?.choices?.['backend:3'] === 1,
  JSON.stringify(doc.enrollment));
ok('the finished sections survived',
  Object.keys(lesson0?.sections || {}).length >= 2, Object.keys(lesson0?.sections || {}).join(', '));
const rec = lesson0?.exercises?.['js-coercao-quiz-1'];
ok('the answer record survived, field for field',
  rec?.attempts === 2 && rec?.correct === true && rec?.checked === true && Boolean(rec?.lastAt),
  JSON.stringify(rec));
ok('the note survived', doc.notes?.javascript?.[0]?.['let-const'] === 'minha anotação',
  JSON.stringify(doc.notes?.javascript?.[0]));
ok('the exam scope key moved from curso: to course:',
  Boolean(doc.exams?.['course:javascript']) && !doc.exams?.['curso:javascript'],
  Object.keys(doc.exams || {}).join(', '));
const exam = doc.exams?.['course:javascript'];
ok('and the exam record with it',
  exam?.attempts === 1 && exam?.best === 80 && exam?.passed === true
    && exam?.lastPct === 80 && exam?.lastCorrect === 8 && exam?.lastTotal === 10,
  JSON.stringify(exam));
ok('the account survived',
  doc.account?.planId === 'pro' && doc.account?.since === '2026-01-01' && doc.account?.passwordAt === '2026-01-02',
  JSON.stringify(doc.account));
ok('the resume pointer survived',
  doc.last?.courseId === 'javascript' && typeof doc.last?.lessonIx === 'number' && Boolean(doc.last?.sectionId),
  JSON.stringify(doc.last));

console.log('\n== running it twice is running it once ==');
await p.reload();
await p.waitForFunction(() => location.hash.length > 1);
await p.waitForTimeout(300);
const twice = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
ok('a second load leaves the same document',
  JSON.stringify(twice.session) === JSON.stringify(doc.session)
  && !legacyKeys.some((k) => k in twice));

await b.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\neverything passed');
process.exit(failures ? 1 : 0);
