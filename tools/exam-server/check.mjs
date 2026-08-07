/* ==========================================================================
   The exam, WITH a backend — the half tools/smoke/smoke.mjs cannot reach.

   The smoke suite already drives the exam the portal draws for itself: it
   answers, holds the verdict, submits and checks the score. That mode has the
   answer key in the page the whole time, and there is no pretending otherwise
   — it is the honest limit of a portal with no server, and the reason the
   server exists.

   THIS ONE CHECKS THE CLAIM THE SERVER MAKES. Not "did it render" but the two
   things the whole design rests on:

     while the exam is open the page does not hold the answer key — not in the
     DOM, which is what a student reads, and not in the objects behind it,
     which is what an open console reads;

     the score at the end is the SERVER's, and the key arrives with it, because
     that is what revealing a result means.

   It is not in CI and not in the smoke suite, deliberately: it needs a Go
   process, a database and an ingested catalogue, and a suite that needed those
   to run would stop being run. What it replaces is nothing — before it, the
   server-drawn exam was checked by hand.

     # in portal-backend
     ingest -file snapshot.json && api          # on :8090
     # here, portal and API behind ONE origin, and <meta name="backend">
     # set to same-origin
     node tools/exam-server/check.mjs

     PORTAL=http://127.0.0.1:8091 COURSE=javascript node tools/exam-server/check.mjs
   ========================================================================== */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME = process.env.CHROME
  || (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
const PORTAL = process.env.PORTAL || 'http://127.0.0.1:8091';
const COURSE = process.env.COURSE || 'javascript';

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const page = await browser.newPage();
const fail = [];
const check = (ok, what) => { console.log((ok ? '  ok   ' : '  FAIL ') + what); if (!ok) fail.push(what); };

page.on('console', (m) => { if (m.type() === 'error') console.log('    [console] ' + m.text().slice(0, 160)); });

await page.goto(PORTAL + '/index.html', { waitUntil: 'networkidle' });

/* ---- register and sign in, through the portal's own screen ---- */
const email = 'ana+' + Date.now() + '@example.com';
const account = await page.evaluate(async ([e]) => {
  const sync = await import('./app/sync.js');
  const api = await import('./app/api.js');
  await sync.register('Ana', e, 'a-long-enough-passphrase');
  const s = await api.signIn({ email: e, password: 'a-long-enough-passphrase' });
  return { name: s.name, configured: sync.configured() };
}, [email]);
check(account.configured, 'the portal sees a backend');
check(account.name === 'Ana', 'signed in as ' + account.name);

/* ---- open the exam ---- */
let examPayload = null;
page.on('response', async (r) => {
  if (r.request().method() === 'POST' && /\/api\/exams\/course\//.test(r.url())) {
    try { examPayload = await r.text(); } catch { /* the page navigated away */ }
  }
});
await page.goto(PORTAL + '/index.html#/course/' + COURSE + '/exam', { waitUntil: 'networkidle' });
await page.waitForSelector('.wizard-exam .ex', { timeout: 10000 });

const opened = await page.evaluate(() => {
  const q = [...document.querySelectorAll('.wz-dot')].length;
  return { questions: q, html: document.querySelector('.view-exam').innerHTML };
});
check(opened.questions > 0, opened.questions + ' questions on the paper');

/* THE CLAIM, checked on the BYTES the browser received.

   The first version of this walked `window.__examQuestions`, which does not
   exist — so it walked an empty array, found nothing, and reported that nothing
   had leaked. It was green and it was checking nothing.

   What the browser was actually given is the response body, and that needs no
   handle into the page and no hook in the portal to read. It is also the
   stronger claim: an object graph can be reached a dozen ways, and the bytes
   are the one thing every one of those ways came from. */
/* NOT `expectedOutput`, and the first run of this check flagged it. A `code`
   exercise's first two test cases are SAMPLES and are published on purpose —
   the student has to see the input and output format to write anything at all.
   What is sealed is the rest of them, and they are absent by being absent: the
   paper carries two cases and a count of how many more exist. */
const KEY_FIELDS = ['"correct"', '"why"', '"trap"', '"rightDistractors"',
  '"referenceExpression"', '"answer"'];

const leaked = examPayload
  ? KEY_FIELDS.filter((f) => examPayload.includes(f))
  : ['the exam response was never seen'];
check(leaked.length === 0, 'the paper the browser received carries no answer key' +
  (leaked.length ? ': ' + leaked.join(', ') : ''));
check(Boolean(examPayload) && examPayload.length > 200,
  'and it is a real paper (' + (examPayload || '').length + ' bytes)');

/* The sample cases are there and the hidden ones are not — which is the same
   distinction one line up, checked rather than asserted in a comment. */
if (examPayload && examPayload.includes('"hiddenTests"')) {
  const shown = (examPayload.match(/"expectedOutput"/g) || []).length;
  const hidden = Number((examPayload.match(/"hiddenTests":\s*(\d+)/) || [])[1] || 0);
  check(shown > 0 && hidden > 0,
    'a code exercise shows ' + shown + ' sample case(s) and hides ' + hidden);
}

const domKey = await page.evaluate(() => {
  const whys = [...document.querySelectorAll('.choice-why')].map((e) => e.textContent.trim()).filter(Boolean);
  return { whys: whys.length, marked: document.querySelectorAll('.choice-right, .ord-right').length };
});
check(domKey.whys === 0, 'no justification rendered into the open exam (' + domKey.whys + ')');
check(domKey.marked === 0, 'nothing marked right while the exam is open');

/* ---- answer everything ---- */
for (let i = 0; i < opened.questions; i++) {
  await page.evaluate((ix) => {
    document.querySelectorAll('.wz-dot')[ix].click();
  }, i);
  await page.waitForTimeout(60);
  const answered = await page.evaluate(async () => {
    const ex = document.querySelector('.wz-stage .ex');
    if (!ex) return 'no exercise';
    const radio = ex.querySelector('.choice input');
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
    const field = ex.querySelector('.ex-field, .code-area');
    if (field) { field.value = 'something'; field.dispatchEvent(new Event('input', { bubbles: true })); }
    const btn = ex.querySelector('.ex-answer');
    if (!btn || btn.disabled) return 'no button';
    btn.click();
    return 'clicked';
  });
  if (answered !== 'clicked') { console.log('    q' + i + ': ' + answered); continue; }
  await page.waitForFunction(() =>
    !/checking/i.test(document.querySelector('.wz-stage .ex-verdict')?.textContent || ''), null, { timeout: 8000 });
}

const beforeSubmit = await page.evaluate(() => ({
  recorded: [...document.querySelectorAll('.wz-dot.done')].length,
  right: [...document.querySelectorAll('.wz-dot.right, .wz-dot.wrong')].length,
  verdictText: document.querySelector('.wz-stage .ex-verdict')?.textContent.trim().slice(0, 60),
}));
check(beforeSubmit.recorded > 0, beforeSubmit.recorded + ' answers recorded');
check(beforeSubmit.right === 0, 'no dot shows right or wrong before submitting');

/* ---- submit ---- */
await page.evaluate(() => document.querySelector('.wz-next').click());
await page.waitForTimeout(200);
await page.evaluate(() => { const b = document.querySelector('.wz-next'); if (b && !b.disabled) b.click(); });
await page.waitForSelector('.wz-result', { timeout: 15000 });

const result = await page.evaluate(() => ({
  html: document.querySelector('.wz-result').textContent.replace(/\s+/g, ' ').trim().slice(0, 160),
  score: document.querySelector('.exam-score')?.textContent.trim(),
  graded: [...document.querySelectorAll('.wz-dot.right, .wz-dot.wrong, .wz-dot.pending')].length,
}));
check(Boolean(result.score), 'a score is on screen: ' + result.score);
check(result.graded > 0, result.graded + ' dots carry a verdict after submitting');
console.log('    ' + result.html);

/* ---- and now the key is allowed, because the exam is over ---- */
/* EVERY question, not the first one. The wizard keeps one in the document at a
   time and the review opens on question 1 — so counting there measured whatever
   the draw happened to put first, and reported zero justifications whenever
   that was a `code` exercise. It passed for three runs and failed on the
   fourth, which is the worst way for a check to be wrong. */
await page.evaluate(() => document.querySelector('.wz-back')?.click());
await page.waitForTimeout(200);
const after = { marked: 0, whys: 0, kinds: [] };
for (let i = 0; i < opened.questions; i++) {
  await page.evaluate((ix) => document.querySelectorAll('.wz-dot')[ix].click(), i);
  await page.waitForTimeout(60);
  const one = await page.evaluate(() => ({
    marked: document.querySelectorAll('.wz-stage .choice-right, .wz-stage .ord-right, ' +
      '.wz-stage .field-right, .wz-stage .field-wrong').length,
    whys: [...document.querySelectorAll('.wz-stage .choice-why')]
      .filter((e) => !e.hidden && e.textContent.trim()).length,
    kind: document.querySelector('.wz-stage .ex')?.className.replace(/.*ex-([a-z-]+).*/, '$1'),
  }));
  after.marked += one.marked;
  after.whys += one.whys;
  after.kinds.push(one.kind);
}
console.log('    reviewed: ' + after.kinds.join(', '));
check(after.marked > 0, 'the right answer is marked in the review (' + after.marked + ')');
check(after.whys > 0, 'the justifications are shown in the review (' + after.whys + ')');

/* ---- the summary the server computed ---- */
const summary = await page.evaluate(async () => {
  const state = await import('./app/state.js');
  return state.examResult('course:javascript');
});
check(summary && summary.attempts === 1, 'the summary came back from the server: ' + JSON.stringify(summary));

await browser.close();
console.log(fail.length ? '\n' + fail.length + ' FAILED' : '\nall good');
process.exit(fail.length ? 1 : 0);
