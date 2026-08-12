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
       PORTAL="file://$PWD" PAGE=/portal-student.html node tools/migration/check.mjs
   ========================================================================== */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.PORTAL || 'http://localhost:8765';
const PAGE = process.env.PAGE || '/index.html';
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
/* Where Chromium is. `CHROME` names it outright; otherwise, if the path this
   container happens to use is there, use it; otherwise let Playwright resolve
   its own download — which is what a contributor's laptop and CI both have,
   and neither of them has the path below. Passing a path that does not exist
   fails the launch with a message about the file rather than about the
   browser. */
const CHROME = process.env.CHROME
  || (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
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
  matricula: { trilhaId: 'seguranca', escolhas: { 'seguranca:3': 1 } },
  progresso: {
    'web-fundamentos': { aulas: { 0: { secoes: { apresentacao: true } } } },
    javascript: {
      aulas: {
        0: {
          secoes: { coercao: true, 'let-const': true },
          exercicios: { 'js-coercao-quiz-1': { tentativas: 2, acertou: true, conferido: true, ultimaEm: '2026-01-01T00:00:00.000Z' } },
        },
        1: { concluida: true },
      },
    },
  },
  notas: { javascript: { 0: { 'let-const': 'minha anotação' } }, criptografia: { 0: { intro: 'nota' } } },
  /* the resume pointer carries a SECTION id, which also moved */
  provas: { 'curso:web-fundamentos': { tentativas: 1, melhor: 70, aprovado: false, ultimaEm: '2026-01-01T00:00:00.000Z' }, 'curso:javascript': { tentativas: 1, melhor: 80, aprovado: true, ultimoPct: 80, ultimoCertos: 8, ultimoTotal: 10, ultimaEm: '2026-01-01T00:00:00.000Z' } },
  conta: { planoId: 'pro', desde: '2026-01-01', senhaEm: '2026-01-02' },
  ultima: { cursoId: 'javascript', aulaIx: 0, secId: 'let-const' },
};

const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
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
ok('the enrolment and its fork choice survived, both under the new track id',
  doc.enrollment?.trackId === 'security' && doc.enrollment?.choices?.['security:3'] === 1,
  JSON.stringify(doc.enrollment));
ok('the finished sections survived, under their new ids',
  lesson0?.sections?.coercion === true && lesson0?.sections?.['let-const'] === true && !lesson0?.sections?.coercao,
  Object.keys(lesson0?.sections || {}).join(', '));
const rec = lesson0?.exercises?.['js-coercion-quiz-1'];
ok('the answer record survived under its new exercise id, field for field',
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
/* `pro` was the PAID plan and the paid plan is now `student`, so this is the
   rename landing, not the value surviving untouched. */
ok('the account survived, on the renamed paid plan',
  doc.account?.planId === 'student' && doc.account?.since === '2026-01-01' && doc.account?.passwordAt === '2026-01-02',
  JSON.stringify(doc.account));
ok('the resume pointer survived',
  doc.last?.courseId === 'javascript' && typeof doc.last?.lessonIx === 'number' && Boolean(doc.last?.sectionId),
  JSON.stringify(doc.last));

console.log('\n== and the courses and tracks that were renamed came with it ==');
ok('progress moved from web-fundamentos to web-fundamentals',
  Boolean(doc.progress?.['web-fundamentals']) && !doc.progress?.['web-fundamentos'],
  Object.keys(doc.progress || {}).join(', '));
ok('its finished section came along, renamed',
  doc.progress?.['web-fundamentals']?.lessons?.[0]?.sections?.intro === true,
  Object.keys(doc.progress?.['web-fundamentals']?.lessons?.[0]?.sections || {}).join(', '));
ok('the note moved from criptografia to cryptography',
  doc.notes?.cryptography?.[0]?.intro === 'nota' && !doc.notes?.criptografia,
  Object.keys(doc.notes || {}).join(', '));
ok('the exam scope key carried the new course id',
  Boolean(doc.exams?.['course:web-fundamentals']) && !doc.exams?.['course:web-fundamentos'],
  Object.keys(doc.exams || {}).join(', '));

console.log('\n== running it twice is running it once ==');
await p.reload();
await p.waitForFunction(() => location.hash.length > 1);
await p.waitForTimeout(300);
const twice = await p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
/* THE WHOLE DOCUMENT, not just the session. The plan rename swaps two values —
   `pro` becomes `student` and `student` becomes `guest` — so running it twice
   would read the `student` it just wrote and hand a paying account the free
   plan. Comparing one field would have let exactly that through. */
ok('a second load leaves the same document',
  JSON.stringify(twice) === JSON.stringify(doc)
  && !legacyKeys.some((k) => k in twice),
  JSON.stringify(twice) === JSON.stringify(doc) ? '' : 'account now ' + JSON.stringify(twice.account));


/* ---------- the other side of the swap ----------

   The document above starts in Portuguese and arrives on the paid plan. The
   dangerous one is a document that is ALREADY English and holds `student` —
   which used to mean the FREE plan and now names the paid one. It has to land
   on `guest`, and it has to stay there. */
console.log('\n== a free account on the old id becomes a guest, once ==');
const p2 = await b.newPage();
p2.on('pageerror', (e) => { failures += 1; console.log('  PAGEERROR ' + e.message); });
await p2.goto(BASE + PAGE);
await p2.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, {
  session: { name: 'Ana', email: 'ana@codeschool.ing' },
  account: { planId: 'student', since: '2026-02-02' },
  enrollment: null, progress: {}, notes: {}, exams: {}, last: null,
}]);
await p2.reload();
await p2.waitForFunction(() => location.hash.length > 1);
await p2.evaluate(() => location.hash = '#/course/javascript/lesson/0/let-const');
await p2.waitForTimeout(400);
const free1 = await p2.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
ok('the old free plan became guest', free1.account?.planId === 'guest', JSON.stringify(free1.account));

await p2.reload();
await p2.waitForFunction(() => location.hash.length > 1);
await p2.waitForTimeout(300);
const free2 = await p2.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
ok('and a second load leaves it there', free2.account?.planId === 'guest', JSON.stringify(free2.account));

await b.close();
console.log(failures ? `\n${failures} FAILURE(S)` : '\neverything passed');
process.exit(failures ? 1 : 0);
