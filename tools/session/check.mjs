/* ==========================================================================
   The browser's memory against the server's, exercised in a real browser.

   WHY THIS IS ITS OWN TOOL. The smoke suite runs with no backend, so the
   disagreement this checks cannot happen there: with nothing to ask,
   localStorage IS the session and the two can never differ. And that
   disagreement is real, because the two live in different places —
   `state.session` in localStorage, which is per-origin, and the session cookie
   for the whole of codeschool.ing, which console.codeschool.ing also sets.

   FOUR OUTCOMES, and the two in the middle are the ones that used to be wrong:

     kept        the two agree. The common case, and it must stay silent
     restored    the cookie is valid and this browser forgot — the student was
                 sent to sign in again while already signed in
     signed-out  the browser remembers and the server does not. The portal drew
                 a signed-in page whose every request came back 401: nothing
                 said so, and nothing saved
     switched    they are DIFFERENT accounts. The local document belongs to the
                 previous one and must be dropped rather than merged, or one
                 student's progress is shown — and then pushed — under another's
                 name

   THE API IS ANSWERED BY THIS FILE. The page ships with <meta name="backend">
   empty, so it is rewritten to `same-origin` as the document is served and the
   routes below answer. Real fetch, real branches, real routing, and no test
   hook left in the portal.

       python3 -m http.server 8899
       node tools/session/check.mjs
   ========================================================================== */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const BASE = process.env.PORTAL || 'http://127.0.0.1:8899';
const PAGE = process.env.PAGE || '/index.html';
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME = process.env.CHROME
  || (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
const KEY = 'codeschool-portal';

const errors = [];
let failures = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log((cond ? '  ok   ' : '  FAIL ') + ' ' + name + (extra ? ' — ' + extra : ''));
};

/* What the server says, per run. `session` is the body of GET /api/session —
   `null` for a caller carrying no cookie, which is what the live API answers
   rather than a 401. `progress` is the document that belongs to whoever that
   is, so that a switch can be seen to bring the RIGHT one. */
const api = {
  session: null,
  progress: { progress: {}, notes: [], resume: null },
  /* What GET /api/enrollment answers. `null` is a student who has chosen no
     track — a state, not a missing page. */
  enrollment: null,
  /* Every write the page made, so the offer half of the first login can be
     checked by what it SENT and not only by what it ended up holding. */
  wrote: [],
  down: false,
};

const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) =>
  r.fulfill({ status: 200, contentType: 'text/css', body: '' }).catch(() => {}));
p.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (/Failed to load resource/.test(m.text())) return;
  errors.push('console: ' + m.text());
});
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await p.route((url) => url.pathname.endsWith(PAGE), async (route) => {
  const res = await route.fetch();
  const body = (await res.text())
    .replace('<meta name="backend" content="" />',
      '<meta name="backend" content="same-origin" />');
  await route.fulfill({ response: res, body, contentType: 'text/html' });
});

await p.route('**/api/**', async (route) => {
  if (api.down) return route.abort('failed');
  const req = route.request();
  const path = new URL(req.url()).pathname;
  const json = (value, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });

  if (req.method() !== 'GET') api.wrote.push(req.method() + ' ' + path + ' ' + (req.postData() || ''));

  if (path === '/api/session' && req.method() === 'POST') {
    return json({ name: 'Ana', email: 'ana@codeschool.ing' });
  }
  if (path === '/api/session') return json(api.session);
  if (path === '/api/progress' && req.method() === 'POST') return json({ skipped: 0 });
  if (path === '/api/progress/import') return json({ skipped: 0 });
  if (path === '/api/progress') return json(api.progress);
  if (path === '/api/account') {
    if (!api.session) return json({ error: { code: 'unauthorized', message: 'sign in first' } }, 401);
    return json({ planId: 'guest', since: null, email: api.session.email, emailVerified: true });
  }
  if (path === '/api/exams') return json({ exams: [] });

  if (path === '/api/enrollment' && req.method() === 'PUT') {
    const { trackId } = JSON.parse(req.postData() || '{}');
    api.enrollment = {
      trackId,
      since: api.enrollment?.since || '2026-01-01T00:00:00Z',
      choices: api.enrollment?.choices || {},
    };
    return json(api.enrollment);
  }
  if (path.startsWith('/api/enrollment/choices/') && req.method() === 'PUT') {
    const [, track, step] = path.match(/^\/api\/enrollment\/choices\/([^/]+)\/(\d+)$/) || [];
    const { option } = JSON.parse(req.postData() || '{}');
    api.enrollment = api.enrollment || { trackId: null, since: null, choices: {} };
    api.enrollment.choices = { ...api.enrollment.choices, [track + ':' + step]: option };
    return route.fulfill({ status: 204, body: '' });
  }
  if (path === '/api/enrollment') return json(api.enrollment);

  return json({ error: { code: 'not_found', message: 'no such route' } }, 404);
});

/* Seeds the browser as if a student had used the portal here, then loads the
   page with the server saying whatever the case under test says.

   THE SEEDING HAPPENS ON A PAGE THAT IS NOT THE PORTAL, and both halves of that
   matter. Seeding on the portal would let the boot already running there write
   its own answer back over the seed; and landing on the portal from a different
   URL is what makes the next `goto` a real navigation — a `goto` that changes
   only the hash does not reload, which would leave every assertion below
   reading the state of the load before it. `/__seed__` is a 404 from the static
   server: same origin, so it has this origin's localStorage, and no portal. */
async function boot({ stored, session, progress, enrollment, down, at = '#/dashboard' }) {
  api.session = session || null;
  api.progress = progress || { progress: {}, notes: [], resume: null };
  api.enrollment = enrollment || null;
  api.wrote = [];
  api.down = !!down;

  await p.goto(BASE + '/__seed__', { waitUntil: 'domcontentloaded' });
  await p.evaluate(([k, doc]) => {
    if (doc) localStorage.setItem(k, JSON.stringify(doc));
    else localStorage.removeItem(k);
  }, [KEY, stored || null]);

  await p.goto(BASE + PAGE + at);
  await p.waitForTimeout(900);
}

const document_ = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
const hash = () => p.evaluate(() => location.hash);

/* A student who has been using this browser: a session, a track and one
   finished section. */
const ANA = {
  session: { name: 'Ana', email: 'ana@codeschool.ing', emailVerified: true },
  enrollment: { trackId: 'backend', choices: { 'backend:3': 2 } },
  progress: { javascript: { lessons: { 0: { sections: { 'let-const': true }, exercises: {} } } } },
  notes: {}, exams: {}, account: null, last: null, plans: 2,
};

/* ========================================================================== */

console.log('\n== 1. kept: the browser and the server agree ==');
await boot({
  stored: ANA,
  session: { name: 'Ana', email: 'ana@codeschool.ing' },
  progress: {
    progress: { javascript: { lessons: { 0: { sections: ['let-const'] } } } },
    notes: [], resume: null,
  },
});
let doc = await document_();
ok('the student is still signed in', doc?.session?.email === 'ana@codeschool.ing');
ok('and stays on the screen they asked for', (await hash()).includes('/dashboard'), await hash());
ok('the track survived', doc?.enrollment?.trackId === 'backend');
ok('and so did the progress',
  doc?.progress?.javascript?.lessons?.[0]?.sections?.['let-const'] === true);

console.log('\n== 2. restored: the cookie is valid and this browser forgot ==');
/* The console signs in on console.codeschool.ing; localStorage there is a
   different origin, so app.codeschool.ing knows nothing. Before this existed
   the portal sent the student to sign in while they already were. */
await boot({
  stored: null,
  session: { name: 'Ana', email: 'ana@codeschool.ing' },
  progress: {
    progress: { javascript: { lessons: { 0: { sections: ['let-const', 'coercion'] } } } },
    notes: [{ courseId: 'javascript', lessonIx: 0, sectionId: 'coercion', body: 'from the server' }],
    resume: null,
  },
  enrollment: { trackId: 'backend', since: '2026-01-01T00:00:00Z', choices: { 'backend:3': 1 } },
});
doc = await document_();
ok('the portal did NOT send them to sign in', !(await hash()).includes('/sign-in'), await hash());
ok('the session came from the server', doc?.session?.email === 'ana@codeschool.ing');
ok('and the name with it', doc?.session?.name === 'Ana');
ok('the progress was pulled, not left empty',
  Object.keys(doc?.progress?.javascript?.lessons?.[0]?.sections || {}).length === 2,
  JSON.stringify(doc?.progress?.javascript?.lessons?.[0]?.sections));
ok('and the notes with it',
  doc?.notes?.javascript?.[0]?.coercion === 'from the server');
/* The half a progress snapshot cannot carry: without it the restored student
   lands on a portal that asks them to choose a track again, which is most of
   the bug this whole path exists to fix. */
ok('THE TRACK CAME BACK TOO', doc?.enrollment?.trackId === 'backend',
  JSON.stringify(doc?.enrollment));
ok('and the forks they had settled', doc?.enrollment?.choices?.['backend:3'] === 1);
ok('nothing was pushed on the way — a read is not an offer',
  api.wrote.length === 0, api.wrote.join(' | ') || 'nothing');

console.log('\n== 3. signed-out: the browser remembers, the server does not ==');
/* Signed out on another device, or the session expired or was revoked. The
   portal used to keep drawing a signed-in page whose every write 401'd. */
await boot({ stored: ANA, session: null });
doc = await document_();
ok('the local session was cleared', doc?.session === null || doc?.session === undefined,
  JSON.stringify(doc?.session));
ok('and the student was sent to sign in', (await hash()).includes('/sign-in'), await hash());
ok('their progress was NOT erased on the way',
  doc?.progress?.javascript?.lessons?.[0]?.sections?.['let-const'] === true,
  'signing out is not erasure');

console.log('\n== 4. switched: a DIFFERENT account is signed in ==');
/* admin@codeschool.ing signs in on the console; the portal in this browser
   still holds Ana's document. Merging the two would show — and then push —
   Ana's progress under the other name. */
await boot({
  stored: ANA,
  session: { name: 'Admin', email: 'admin@codeschool.ing' },
  progress: {
    progress: { python: { lessons: { 0: { sections: ['setup'] } } } },
    notes: [], resume: null,
  },
  enrollment: { trackId: 'data-platform', since: '2026-02-02T00:00:00Z', choices: {} },
});
doc = await document_();
ok('the session is the server\'s', doc?.session?.email === 'admin@codeschool.ing');
ok('the previous account\'s progress is gone from this browser',
  !doc?.progress?.javascript,
  JSON.stringify(Object.keys(doc?.progress || {})));
ok('the new account\'s progress is here instead',
  doc?.progress?.python?.lessons?.[0]?.sections?.setup === true);
/* The track is where a stale document survives unnoticed, because a progress
   snapshot never mentions one. It fails if `forget` is dropped, and it fails if
   the enrolment is not pulled. */
ok('the track is the new account\'s, not the previous one\'s',
  doc?.enrollment?.trackId === 'data-platform', JSON.stringify(doc?.enrollment));
ok('and nothing of the previous account was pushed to the new one',
  !api.wrote.some((w) => w.includes('backend')), api.wrote.join(' | ') || 'nothing');

console.log('\n== 5. the API did not answer: nothing is decided ==');
/* A network blip must not sign a student out, and offline the local copy is
   the only truth there is. */
await boot({ stored: ANA, session: null, down: true });
doc = await document_();
ok('the session survived', doc?.session?.email === 'ana@codeschool.ing');
ok('the progress survived',
  doc?.progress?.javascript?.lessons?.[0]?.sections?.['let-const'] === true);
ok('and the portal did not send them to sign in',
  !(await hash()).includes('/sign-in'), await hash());

console.log('\n== 6. a deep link survives the restore ==');
/* Waiting for the answer is only worth it if what the student asked for is
   still what they get afterwards. */
await boot({
  stored: null,
  session: { name: 'Ana', email: 'ana@codeschool.ing' },
  at: '#/catalog',
});
ok('the requested screen is the one on the page',
  (await hash()).includes('/catalog'), await hash());

console.log('\n== 7. the first login OFFERS this browser\'s track ==');
/* The other half of the enrolment, and the opposite direction: a browser used
   before there was an account to attach it to. What it holds is an offer, and
   it is taken only where the account has nothing. */
await boot({ stored: ANA, session: null, enrollment: null, at: '#/sign-in' });
await p.fill('#e-email', 'ana@codeschool.ing');
await p.fill('#e-password', 'a passphrase worth typing');
await p.click('#form-signin button[type="submit"]');
await p.waitForTimeout(900);
ok('the track was sent up',
  api.wrote.some((w) => w.startsWith('PUT /api/enrollment ') && w.includes('backend')),
  api.wrote.join(' | ') || 'nothing');
/* The key is split at the LAST colon, so a track id with a hyphen — or, one
   day, anything else that is not a colon — reaches the right path. */
ok('and the forks with it, at the right address',
  api.wrote.some((w) => w.startsWith('PUT /api/enrollment/choices/backend/3 ') && w.includes('"option":2')),
  api.wrote.join(' | '));
ok('and the server\'s answer came back into the browser',
  (await document_())?.enrollment?.trackId === 'backend',
  JSON.stringify((await document_())?.enrollment));

console.log('\n== 8. and it never overwrites what the account already has ==');
/* The rule the note import already follows. The account has been used
   elsewhere; this browser's track is older news than the server's. */
await boot({
  stored: ANA,
  session: null,
  enrollment: { trackId: 'data-platform', since: '2026-02-02T00:00:00Z', choices: {} },
  at: '#/sign-in',
});
await p.fill('#e-email', 'ana@codeschool.ing');
await p.fill('#e-password', 'a passphrase worth typing');
await p.click('#form-signin button[type="submit"]');
await p.waitForTimeout(900);
ok('the account\'s track was NOT replaced',
  !api.wrote.some((w) => w.startsWith('PUT /api/enrollment ') && w.includes('backend')),
  api.wrote.join(' | ') || 'nothing');
ok('and the browser now holds the account\'s',
  (await document_())?.enrollment?.trackId === 'data-platform',
  JSON.stringify((await document_())?.enrollment));

console.log('\n== JavaScript errors ==');
ok('none', errors.length === 0, errors.join(' | ') || 'none');

await b.close();
console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\neverything passed');
process.exit(failures ? 1 : 0);
