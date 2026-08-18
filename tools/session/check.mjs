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
  // Reads, whole URL. `wrote` keeps only writes, and the language the portal
  // asks for travels in the query string of a GET.
  read: [],
  down: false,
  /* How many times GET /api/lessons should fail before it answers. The route
     had no case here at all until now — it fell through to the 404 at the
     bottom of the handler — so no run of this suite had ever seen it SUCCEED,
     and the client's silent catch made that indistinguishable from working. A
     structure that never lands turns every written course into a placeholder
     one: the portal keeps working and every number in it is wrong. */
  structureFailures: 0,
};

/* One course with a shape the client cannot invent. Its placeholder rule gives
   a lesson exactly ONE section, so three of them is proof the answer was read
   rather than guessed. */
const STRUCTURE = {
  lang: 'en',
  courses: [{
    courseId: 'javascript',
    lessons: [{
      lessonIx: 0,
      title: 'ES6+ syntax',
      sections: [
        { id: 'intro', title: 'Intro', kind: 'content', countable: true },
        { id: 'let-const', title: 'let and const', kind: 'content', countable: true },
        { id: 'arrow', title: 'Arrow functions', kind: 'content', countable: true },
      ],
    }],
  }],
};

const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();

await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) =>
  r.fulfill({ status: 200, contentType: 'text/css', body: '' }).catch(() => {}));
/* The structure's own failure is DELIBERATE noise: case 5 below makes the
   route fail and then asserts that the portal said so. Kept in its own list so
   that the "no JavaScript errors" check at the end still means what it says. */
const structureErrors = [];
p.on('console', (m) => {
  if (m.type() !== 'error') return;
  if (/Failed to load resource/.test(m.text())) return;
  if (/lesson structure could not be read/.test(m.text())) {
    structureErrors.push(m.text());
    return;
  }
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
  // Every read, with its query: the lesson routes carry the language there.
  if (req.method() === 'GET') api.read.push(req.url());

  if (path === '/api/session' && req.method() === 'POST') {
    // Signing in opens a session HERE too, so that the routes which answer 401
    // without one start answering. /api/lessons is the one that matters.
    api.session = { name: 'Ana', email: 'ana@codeschool.ing' };
    return json(api.session);
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

  /* The structure. It answers for real here — see `structureFailures` for why
     that is worth saying about a stub.

     AND IT IS BEHIND THE SESSION, exactly as the live route is. Not behind the
     plan — the portal needs it to draw a denominator for a guest too — but a
     caller with no cookie gets 401, and modelling that is the whole of case 6
     below. A stub that answered it to anybody hid the bug in production for as
     long as it existed. */
  if (path === '/api/lessons') {
    if (!api.session) {
      return json({ error: { code: 'unauthorized', message: 'sign in first' } }, 401);
    }
    if (api.structureFailures > 0) {
      api.structureFailures -= 1;
      return json({ error: { code: 'internal', message: 'not this time' } }, 500);
    }
    return json(STRUCTURE);
  }

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
async function boot({
  stored, session, progress, enrollment, down, structureFailures = 0, at = '#/dashboard',
}) {
  api.session = session || null;
  api.progress = progress || { progress: {}, notes: [], resume: null };
  api.enrollment = enrollment || null;
  api.wrote = [];
  api.down = !!down;
  api.structureFailures = structureFailures;

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

/* ==========================================================================
   THE LANGUAGE THE PORTAL ASKS THE SERVER FOR

   This is the one thing the other suites cannot see, and it reached production
   before anything caught it: the interface was Portuguese and the lessons came
   back in English.

   The server translates the lessons now, so the portal has to NAME a language
   on every read. It used to take it from localStorage — which the i18n runtime
   writes only when somebody picks a language in the menu. A visitor whose
   browser is Portuguese gets Portuguese by DETECTION, with nothing stored, so
   the portal asked for English and drew it inside a Portuguese page.

   Nothing failed: the server answered exactly what it was asked. Which is why
   the check has to be on the REQUEST, not on the response.
   ========================================================================== */
console.log('\n== the language travels with the lesson reads ==');

{
  // A browser that speaks Portuguese and has never chosen a language — the
  // exact state the bug needed, and the one every first visit is in.
  const ptCtx = await b.newContext({ locale: 'pt-BR', viewport: { width: 1440, height: 900 } });
  const pt = await ptCtx.newPage();
  await pt.route(/fonts\.(googleapis|gstatic)\.com/, (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '' }).catch(() => {}));
  await pt.route((url) => url.pathname.endsWith(PAGE), async (route) => {
    const res = await route.fetch();
    const body = (await res.text())
      .replace('<meta name="backend" content="" />',
        '<meta name="backend" content="same-origin" />');
    await route.fulfill({ response: res, body, contentType: 'text/html' });
  });

  const asked = [];
  await pt.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/lessons')) asked.push(url);
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ courses: [], lang: 'pt' }) });
  });

  await pt.goto(BASE + PAGE);
  await pt.waitForFunction(() => location.hash.length > 1);
  await pt.waitForTimeout(600);

  ok('the page settled on Portuguese by detection, with nothing stored',
    (await pt.evaluate(() => document.documentElement.lang)) === 'pt-BR'
      && (await pt.evaluate(() => localStorage.getItem('codeschool-language'))) === null);

  ok('THE STRUCTURE WAS ASKED FOR IN PORTUGUESE',
    asked.some((u) => /\/api\/lessons\?.*lang=pt(&|$)/.test(u)),
    asked.join(' | ') || 'nothing was asked');

  ok('and never in English',
    !asked.some((u) => /lang=en(&|$)/.test(u)), asked.join(' | '));

  await ptCtx.close();
}

/* ==========================================================================
   THE STRUCTURE REACHES THE STORE.

   Everything above this point could pass with GET /api/lessons answering 404
   forever, because that is what the stub used to do and because the client
   swallows the failure by design. What it costs is invisible on screen and
   wrong in every number: a course whose sections did not arrive is drawn the
   way an unwritten course is drawn — one placeholder section per lesson — so
   the denominators shrink, and a student's completed sections stop being
   counted, because the portal no longer knows those section ids exist.

   Asserted through `sectionCount`, which is the denominator itself rather than
   a proxy for it. Three content sections plus an assessment with no exercises,
   which does not count: three.
   ========================================================================== */
console.log('\n== 5. the lesson structure ==');
{
  const count = () => p.evaluate(async () => {
    const L = await import('/app/lessons.js');
    const C = await import('/app/catalog.js');
    return {
      sections: L.sectionCount('javascript'),
      loaded: L.structureLoaded(),
      first: L.lessonSections('javascript', C.courseLessons('javascript')[0].key).map((s) => s.id),
    };
  });

  await boot({ stored: ANA, session: ANA.session });
  const landed = await count();
  ok('THE STRUCTURE IS IN THE STORE AFTER BOOT', landed.loaded);
  /* 25 is what this course counts when nothing arrives: one placeholder section
     for each of its 22 lessons, plus the three assessments that have exercises.
     The stub writes three sections into the first lesson and leaves the rest
     alone, so a structure that landed reads 27 and one that did not reads 25.
     Two apart, and the gap is the whole bug. */
  ok('and the denominator counts them, instead of the placeholder',
    landed.sections === 27, 'sectionCount = ' + landed.sections + ', placeholder is 25');
  ok('the sections are the ones the server named',
    landed.first.join(',') === 'intro,let-const,arrow,assessment', landed.first.join(','));

  /* THE RETRY. This is the heaviest read the portal makes and it is fired at
     boot beside five others, when the instance serving them may still be
     starting. One failure used to cost every denominator on the page until the
     next full load. */
  await boot({ stored: ANA, session: ANA.session, structureFailures: 1 });
  const retried = await count();
  ok('ONE FAILURE AT BOOT IS RETRIED, NOT ABSORBED',
    retried.loaded && retried.sections === 27, 'sectionCount = ' + retried.sections);

  /* And when it really is gone, the portal still works — that half was right
     and is what the silence was protecting. It is the SILENCE that was wrong. */
  await boot({ stored: ANA, session: ANA.session, structureFailures: 9 });
  const gone = await count();
  ok('a structure that never arrives leaves a portal that still draws',
    !gone.loaded && gone.sections > 0, 'sectionCount = ' + gone.sections);
  ok('and says so as an error, where somebody looks',
    structureErrors.length > 0, structureErrors.join(' | ') || 'nothing was logged');

  /* ------------------------------------------------------------------------
     THE PRIVATE WINDOW. This is the case that reached production.

     A student opening the portal in a fresh window lands signed out, so the
     boot call in main.js asks for the structure with no cookie and is refused
     — correctly, this route is behind the session. Then they sign in, and
     because the portal is one page, arriving at the dashboard is not a new
     page load: nothing asked again. The result was a signed-in student with
     the entire catalogue drawn as though none of it had been written, every
     denominator a placeholder and their finished sections uncounted, until
     they happened to press reload.

     Signing in through the screen and not through the API, because what broke
     was the sequence and a direct call would skip it. */
  structureErrors.length = 0;
  await boot({ stored: null, session: null, at: '#/sign-in' });

  const beforeSignIn = await count();
  ok('signed out, the structure is refused and the portal says nothing',
    !beforeSignIn.loaded && structureErrors.length === 0,
    'a 401 before sign-in is not a failure, and must not cry wolf');

  await p.fill('#e-email', 'ana@codeschool.ing');
  await p.fill('#e-password', 'a passphrase worth typing');
  await p.click('#form-signin button[type="submit"]');
  await p.waitForTimeout(900);

  const afterSignIn = await count();
  ok('SIGNING IN ASKS AGAIN, WITHOUT A RELOAD',
    afterSignIn.loaded && afterSignIn.sections === 27,
    'sectionCount = ' + afterSignIn.sections + ', placeholder is 25');
}

/* ==========================================================================
   THE SAME ACCOUNT IN TWO PLACES.

   A kept session used to mean "the browser and the server already agree, there
   is nothing to do" — and it read nothing back. So a section finished on one
   device stayed invisible on the other through any number of reloads, and the
   only thing that fixed it was signing out and in again, because that is the
   path that pulls.

   Both halves are asserted, and the second is the one worth having: reading
   back must not cost a write that never reached the server. A reload that
   loses work would be a worse bug than the staleness it cures.
   ========================================================================== */
console.log('\n== 7. a kept session reconciles with the server ==');
{
  const finished = (course) => p.evaluate(async (c) => {
    const s = await import('/app/state.js');
    const done = s.now().progress?.[c]?.lessons?.[0]?.sections || {};
    return Object.keys(done).filter((k) => done[k]).sort();
  }, course);

  /* The other window has been busy: the server holds a section this browser
     has never heard of. */
  await boot({
    stored: ANA,
    session: ANA.session,
    /* The server's shape, which is not the browser's: `sections` is a list of
       ids there and a map here — see replaceWith. */
    progress: {
      progress: { javascript: { lessons: { 0: { sections: ['let-const', 'arrow'] } } } },
      notes: [], resume: null,
    },
  });
  ok('A RELOAD SEES WHAT THE OTHER WINDOW DID',
    (await finished('javascript')).includes('arrow'),
    (await finished('javascript')).join(',') || 'nothing');

  /* And it did NOT import to find that out. The server validates every section
     against the mirror, two queries each, so an import on every page load is
     hundreds of round trips spent discovering this browser had nothing to
     say. */
  ok('and paid one read for it, not an import',
    !api.wrote.some((w) => w.startsWith('POST /api/progress/import')),
    api.wrote.join(' | ') || 'nothing was written');

  /* And the other direction: this browser finished something the server never
     recorded, which is what a lost fire-and-forget write leaves behind. `unsent`
     is the flag sync.js sets when a push fails — the document remembers, so the
     reload knows to import instead of reading over itself. */
  await boot({
    stored: {
      ...ANA,
      unsent: true,
      progress: { javascript: { lessons: { 0: { sections: { intro: true }, exercises: {} } } } },
    },
    session: ANA.session,
    progress: { progress: {}, notes: [], resume: null },
  });
  ok('A LOST WRITE IS SENT UP RATHER THAN ERASED',
    api.wrote.some((w) => w.startsWith('POST /api/progress/import') && w.includes('intro')),
    api.wrote.join(' | ') || 'nothing was sent');
  ok('and the flag is cleared once it has been',
    (await document_())?.unsent === undefined,
    JSON.stringify((await document_())?.unsent));
}

console.log('\n== JavaScript errors ==');
ok('none', errors.length === 0, errors.join(' | ') || 'none');

await b.close();
console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\neverything passed');
process.exit(failures ? 1 : 0);
