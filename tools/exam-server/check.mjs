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
import { readFile } from 'node:fs/promises';

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
    /* A matching is answered by GESTURE and has no field to fill: a left tile,
       then a right one, for each pair. Without this the button was pressed with
       nothing placed, and the exercise answered "Answer before checking." — see
       the wait below, which is where that showed up. */
    const lefts = [...ex.querySelectorAll('.tile-left')];
    const rights = [...ex.querySelectorAll('.tile-right')];
    lefts.forEach((l, ix) => {
      if (!rights[ix]) return;
      l.click();
      rights[ix].click();
    });
    const btn = ex.querySelector('.ex-answer');
    if (!btn || btn.disabled) return 'no button';
    btn.click();
    return 'clicked';
  });
  if (answered !== 'clicked') { console.log('    q' + i + ': ' + answered); continue; }
  /* ON THE CLASS AND NOT ON THE TEXT. This waited for the word "checking" to
     leave the verdict, and `checking…` is indeed what the pending state says —
     but so does "Answer before checking.", which is what a matching answered
     with nothing placed says, and that one never goes away. The suite hung for
     eight seconds and then threw, on a draw that happened to include one.
     `v-waiting` is the state itself, and it is not translated. */
  await page.waitForFunction(() =>
    !document.querySelector('.wz-stage .ex-verdict')?.classList.contains('v-waiting'),
  null, { timeout: 8000 });
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

/* ==========================================================================
   THE CERTIFICATE.

   The other half the smoke suite cannot reach. Over there the portal has no
   backend, so nothing has been ISSUED and the screen says so; here one exists,
   and what is worth checking is that the number a student can read and copy is
   the SERVER's — because the portal used to hash one out of the course id and
   the student's name, and a hash resolves to "no certificate under this code"
   on the page an employer opens.

   HOW THIS HARNESS PASSES AN EXAM, AND WHY IT IS ALLOWED TO. It reads
   `assets/exam-pool.js` OFF DISK — which is a thing a test runner in the
   repository can do and a student cannot, and that asymmetry is the whole
   reason the file exists.

   It used to read the answers off `GET /api/exercises/{course}/{lesson}`, the
   practice route, which serves the key on purpose. Two things closed that road
   in turn, and both are checked below:

     the practice route now answers `409` while a paper drawn on that course is
     open — so the lookup DURING an exam is gone;

     and exams are drawn from a pool that route never serves at all, whether or
     not anything is open — so the pre-fetch is gone too, which is the one no
     amount of route-closing could have fixed.

   The second is why this file reads a file. When the harness needed a new road,
   that was the sign the old one had really been shut.
   ========================================================================== */
console.log('\n== the certificate ==');

const none = await page.evaluate(async () => {
  const r = await fetch('/api/certificates', { credentials: 'include' });
  return (await r.json()).certificates || [];
});
check(none.length === 0, 'nothing is issued for an exam that was not passed');

/* The exam bank, from the file the page does not load. Read here and handed to
   the browser as an argument — it never becomes a global, and the page it is
   handed to could not have fetched it. */
const examPool = await (async () => {
  const src = await readFile(new URL('../../assets/exam-pool.js', import.meta.url), 'utf8');
  const w = { EXAM_POOL: undefined };
  // eslint-disable-next-line no-new-func
  new Function('window', src)(w);
  return (w.EXAM_POOL || []).filter((ex) => ex.course === COURSE);
})();
check(examPool.length > 0, 'the exam pool has ' + examPool.length + ' questions for ' + COURSE);

/* THE RESIDUAL, CLOSED — and this is where it is checked, with NOTHING open.
   Closing the practice route during an exam stopped the lookup mid-paper and
   could never stop the pre-fetch. Two pools does: the route serves the practice
   pool whatever is or is not open, so walking every lesson of the course finds
   no exam question at all. */
const swept = await page.evaluate(async ([course]) => {
  const seen = [];
  for (let ix = 0; ix < 40; ix += 1) {
    const r = await fetch('/api/exercises/' + course + '/' + ix, { credentials: 'include' });
    if (!r.ok) break;
    const body = await r.json();
    if (!Array.isArray(body.exercises)) break;
    seen.push(...body.exercises.map((e) => e.id));
  }
  return seen;
}, [COURSE]);
const poolIDs = new Set(examPool.map((e) => e.id));
const reachable = swept.filter((id) => poolIDs.has(id));
check(swept.length > 0, 'sweeping every lesson reaches ' + swept.length + ' practice exercises');
check(reachable.length === 0,
  'and not one exam question, with nothing open' + (reachable.length ? ': ' + reachable.join(', ') : ''));

const sat = await page.evaluate(async ([course, bank]) => {
  const j = async (method, path, body) => {
    const r = await fetch(path, {
      method,
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  };

  const key = new Map(bank.map((ex) => [ex.id, ex]));

  const attempt = await j('POST', '/api/exams/course/' + course);

  /* And now the same fetch that just worked has to stop working. Reported
     rather than asserted in here, so the failure names the status. */
  const shut = await fetch('/api/exercises/' + course + '/0', { credentials: 'include' });
  const shutBody = await shut.text();

  const kinds = [];
  for (const q of attempt.questions) {
    const k = key.get(q.id);
    if (!k) continue;
    /* Matched by TEXT and never by index: the exam shuffles the choices and the
       items, which is the whole point of shuffling them. */
    let body;
    if (q.type === 'quiz') {
      const right = k.choices.find((c) => c.correct);
      body = { choice: q.choices.findIndex((c) => c.text === right.text) };
    } else if (q.type === 'multiple-choice') {
      const rights = k.choices.filter((c) => c.correct).map((c) => c.text);
      body = { choices: q.choices.map((c, i) => (rights.includes(c.text) ? i : -1)).filter((i) => i >= 0) };
    } else if (q.type === 'ordering') {
      body = { order: k.items.slice() };
    } else if (q.type === 'matching') {
      body = { pairs: q.pairs.map((p) => (k.pairs.find((kp) => kp.left === p.left) || {}).right || '') };
    } else if (q.type === 'expected-output') {
      body = { text: k.answer };
    } else {
      continue;   // code and expression-answer: nobody checks them yet
    }
    await j('PUT', '/api/exams/attempts/' + attempt.id + '/answers/' + encodeURIComponent(q.id), body);
    kinds.push(q.type);
  }
  const result = await j('POST', '/api/exams/attempts/' + attempt.id + '/submit');
  const reopened = await fetch('/api/exercises/' + course + '/0', { credentials: 'include' });
  return { kinds: kinds, pct: result.pct, passed: result.passed,
    shutStatus: shut.status, shutBody: shutBody, reopenedStatus: reopened.status,
    reopenedHadKey: /"correct":|"answer":|"referenceExpression":/.test(await reopened.text()) };
}, [COURSE, examPool]);
check(sat.passed === true, 'an exam passed at ' + sat.pct + '% — ' + sat.kinds.join(', '));

/* The hole this harness used to walk through. Practice serves the answer key
   for the same rows the paper was drawn from, so while the paper is open that
   route is closed — and the body has to carry no exercise at all, because a 409
   with the key in it is the same leak with a different number on it. */
check(sat.shutStatus === 409,
  'practice is closed while the exam is open (' + sat.shutStatus + ')');
check(!/"correct":|"answer":|"why":/.test(sat.shutBody),
  'and the refusal carries no key: ' + sat.shutBody.slice(0, 120));
check(sat.reopenedStatus === 200 && sat.reopenedHadKey,
  'and submitting reopens it, key and all (' + sat.reopenedStatus + ')');

/* Lazily issued: nothing is minted inside the submit, and ASKING is what
   issues. Asking twice is a read, because the insert conflicts on the holder
   and the scope and does nothing. */
const mine = await page.evaluate(async () => {
  const one = await (await fetch('/api/certificates', { credentials: 'include' })).json();
  const two = await (await fetch('/api/certificates', { credentials: 'include' })).json();
  return { first: one.certificates, second: two.certificates };
});
check(mine.first.length === 1, 'passing it issued one certificate');
check(mine.second.length === 1 && mine.second[0].code === mine.first[0].code,
  'and asking again returns that one rather than minting a second');
const cert = mine.first[0];
console.log('    ' + JSON.stringify(cert));

await page.goto(PORTAL + '/index.html#/certificates', { waitUntil: 'networkidle' });
await page.waitForSelector('.cert:not(.cert-sample)');
const shown = await page.evaluate(() => {
  const art = document.querySelector('.cert:not(.cert-sample)');
  return {
    code: art.dataset.code || '',
    printed: art.querySelector('.cert-code').textContent.trim(),
    holder: art.querySelector('.cert-student').textContent.trim(),
    title: art.querySelector('.cert-course').textContent.trim(),
  };
});
check(shown.printed === cert.code,
  'the number printed on the document is the server\'s: ' + shown.printed);
check(shown.code === cert.code, 'and the element carries it as a datum, not only as text');
check(shown.holder === cert.holderName, 'the holder is the one on the row: ' + shown.holder);
check(shown.title === cert.title, 'and so is the title: ' + shown.title);

await page.locator('.cert:not(.cert-sample)').first().click();
await page.waitForSelector('.modal-cert');
const href = await page.locator('.modal-actions .cert-in:not(.cert-png):not(.cert-share)').first().getAttribute('href');
check(Boolean(href) && href.includes('certId=' + encodeURIComponent(cert.code)),
  'the LinkedIn form is filled in with that code');
const certUrl = href ? new URL(href).searchParams.get('certUrl') : '';
check(certUrl === PORTAL + '/certificate/' + encodeURIComponent(cert.code),
  'and points at where the page really is: ' + certUrl);

/* The page a stranger opens. No session on this request — it is the one route
   in the server that answers without one. */
const publicPage = await page.evaluate(async (u) => {
  const r = await fetch(u, { credentials: 'omit' });
  return { status: r.status, type: r.headers.get('content-type') || '', body: await r.text() };
}, certUrl);
check(publicPage.status === 200 && /text\/html/.test(publicPage.type),
  'the validation page answers HTML without a session');
check(publicPage.body.includes(cert.holderName) && publicPage.body.includes(cert.title),
  'and names the holder and what they completed');
check(/og:title/.test(publicPage.body), 'with a preview card for whoever pastes the link');

/* Typed off a piece of paper: any casing, no groups, and the letters Crockford
   leaves out folded onto the ones they are mistaken for. */
const mistyped = cert.code.toLowerCase().replace(/-/g, '').replace(/0/g, 'o').replace(/1/g, 'l');
const loose = await page.evaluate(async (c) => {
  const r = await fetch('/certificate/' + encodeURIComponent(c), { credentials: 'omit' });
  return { status: r.status, body: await r.text() };
}, mistyped);
check(loose.status === 200 && loose.body.includes(cert.holderName),
  'and it survives being typed off paper: ' + mistyped);

const unknown = await page.evaluate(async () => {
  const r = await fetch('/certificate/CS-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZ', { credentials: 'omit' });
  return { status: r.status, body: await r.text() };
});
check(unknown.status === 200, 'a code nobody holds answers 200 and not 404 — the URL is on a profile');
check(/no certificate/i.test(unknown.body), 'and says so');

await browser.close();
console.log(fail.length ? '\n' + fail.length + ' FAILED' : '\nall good');
process.exit(fail.length ? 1 : 0);
