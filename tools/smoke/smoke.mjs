/* ==========================================================================
   The portal's smoke test.

   It walks the whole portal in a real browser and answers one question at a
   time. It does not replace human review — it measures what can be measured on
   its own.

   It runs against any static server:

     python3 -m http.server 8899      # at the repository root
     node tools/smoke/smoke.mjs       # in another terminal

     PORTAL=http://localhost:3000 node tools/smoke/smoke.mjs
     CHROME=/path/to/chrome           # if Chromium is not in the default place

   The test that matters MOST here is the edge one: it reproduces the vitrine's
   detector, sampling 120 points along each rendered curve and checking whether
   any of them falls inside a card that is not an endpoint of that edge. That
   check is what held the routing up over there, and the portal inherited the
   code — inheriting without inheriting the check would be keeping the risk and
   dropping the net.

   Two real defects have already been caught by it, and neither would show up by
   reading code: the translated topic title no longer matching the exercises'
   key, and the rail's `<nav>` inheriting the fixed bar from `base.css`.
   ========================================================================== */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const BASE = process.env.PORTAL || 'http://127.0.0.1:8899';
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
/* Where Chromium is. `CHROME` names it outright; otherwise, if the path this
   container happens to use is there, use it; otherwise let Playwright resolve
   its own download — which is what a contributor's laptop and CI both have,
   and neither of them has the path below. Passing a path that does not exist
   fails the launch with a message about the file rather than about the
   browser. */
const CHROME = process.env.CHROME
  || (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);
/* PAGE points the test at the single-file bundle instead of the served site:
   PORTAL=file:///path PAGE=/portal-student.html node tools/smoke/smoke.mjs */
const PAGE = process.env.PAGE || '/index.html';
const errors = [];
const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
// `acceptDownloads` so the certificate's PNG button can be exercised: without
// it Playwright cancels the download and the test would pass on a button that
// never produced a file.
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

let failures = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log((cond ? '  ok   ' : '  FAIL ') + ' ' + name + (extra ? ' — ' + extra : ''));
};

/* `networkidle` is not the signal we want, and it made this block flaky: the
   page asks Google for fonts, that request fails outright from `file://`, and
   the idle window can close before the deferred module has run. Then block 1
   reports "landed on /sign-in with no session" — which reads like a routing bug
   and is really a stopwatch problem. What we are actually waiting for is the
   router having booted, and the router says so by putting a route in the hash. */
await p.goto(BASE + PAGE);
await p.waitForFunction(() => location.hash.length > 1);

console.log('\n== 1. load and redirect ==');
ok('landed on /sign-in with no session', p.url().includes('#/sign-in'), p.url());
ok('catalogue loaded', await p.evaluate(() => typeof COURSES !== 'undefined' && COURSES.length === 86));
ok('sample exercises loaded', await p.evaluate(() => window.SAMPLE_EXERCISES?.length > 0));

console.log('\n== 2. signing in ==');
await p.fill('#e-name', 'Alexandre');
await p.selectOption('#e-track', 'backend');
await p.click('#form-signin button[type=submit]');
await p.waitForFunction(() => location.hash === '#/dashboard');
ok('went to the dashboard', true);
ok('rail built', (await p.locator('.rail-link').count()) === 6);
ok('context in the bar', (await p.locator('.ctx-name').innerText()).includes('Back-end'));
ok('resume card', await p.locator('.resume').isVisible());

/* THE TAB IS CALLED codeschool.ing ON EVERY SCREEN. It used to say where the
   student was, and the effect was the brand being cut off at the end of a long
   title — the tab stopped being recognisable among others. The test walks
   screens of different natures, because the tab's name was written in the
   router, and a screen that escaped the router would escape the rule. */
const titles = [];
for (const r of ['/sign-in', '/dashboard', '/track', '/course/javascript',
  '/course/javascript/lesson/0/let-const', '/catalog', '/certificates', '/plan', '/naoexiste']) {
  await p.goto(BASE + PAGE + '#' + r);
  await p.waitForTimeout(140);
  titles.push(r + '=' + (await p.title()));
}
ok('the tab is always called codeschool.ing',
  titles.every((t) => t.endsWith('=codeschool.ing')),
  titles.find((t) => !t.endsWith('=codeschool.ing')) || 'across ' + titles.length + ' screens');
/* and the screen's name is not lost: it now names the content region, which is
   what a screen reader announces when the content changes */
await p.goto(BASE + PAGE + '#/sign-in');
await p.waitForTimeout(140);
ok('the content region is still named',
  ((await p.getAttribute('#content', 'aria-label')) || '').length > 2,
  await p.getAttribute('#content', 'aria-label'));

console.log('\n== 3. track: the graph as a map ==');
await p.click('.rail-link[href="#/track"]');
await p.waitForSelector('.track-graph');
await p.waitForTimeout(500);
const edgeCount = await p.locator('.edge').count();
const cardCount = await p.locator('.course-node').count();
ok('cards drawn', cardCount > 5, cardCount + ' cards');
ok('edges drawn', edgeCount > 5, edgeCount + ' edges');
ok('states on the cards', (await p.locator('.node-state').count()) > 5);
ok('the fork is there', (await p.locator('.fork-tab').count()) === 4);
ok('arrival node', await p.locator('.node-outcome').isVisible());

// no edge may pass through a card that is not one of its endpoints — the same
// detector the vitrine uses, sampling points along each curve
const collisions = await p.evaluate(() => {
  const cont = document.querySelector('.track-graph');
  const base = cont.getBoundingClientRect();
  const boxes = [...cont.querySelectorAll('[data-node]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.node, x: r.left - base.left + cont.scrollLeft, y: r.top - base.top + cont.scrollTop, w: r.width, h: r.height };
  });
  let bad = 0;
  cont.querySelectorAll('.edge').forEach((g) => {
    const path = g.querySelector('.row');
    const total = path.getTotalLength();
    const ends = [g.dataset.from, g.dataset.to];
    for (let i = 0; i <= 120; i += 1) {
      const pt = path.getPointAtLength((total * i) / 120);
      if (boxes.some((c) => !ends.includes(c.id) &&
        pt.x > c.x + 2 && pt.x < c.x + c.w - 2 && pt.y > c.y + 2 && pt.y < c.y + c.h - 2)) { bad += 1; break; }
    }
  });
  return bad;
});
ok('no edge crosses a card', collisions === 0, collisions + ' collisions');

/* THE CURSOR LIGHTS UP A COURSE'S EDGES — behaviour from the vitrine that had
   been left behind: `base.css` came with the `.edge.on` style, and the
   listener that adds the class did not. Half a copy fails nowhere, it just does
   not happen. */
const lit = await p.evaluate(async () => {
  const screen = document.querySelector('.view-track');
  /* a course that is an endpoint of at least one edge — taking the first card
     would work only by luck, and luck is not a test */
  const edges = [...screen.querySelectorAll('.edge')];
  const target = edges[0].dataset.to;
  const node = screen.querySelector('[data-node="' + target + '"]');
  const expected = edges.filter((a) => a.dataset.from === target || a.dataset.to === target).length;
  node.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  const on = [...screen.querySelectorAll('.edge.on')];
  /* the width has `transition:.15s`, and `getComputedStyle` during the
     transition returns the value HALFWAY through — measuring right away reads
     1.5px and fails a rule that is correct */
  await new Promise((r) => setTimeout(r, 250));
  const thick = on.length
    ? parseFloat(getComputedStyle(on[0].querySelector('.row')).strokeWidth)
    : 0;
  const other = edges.find((a) => !a.classList.contains('on'));
  const thin = other ? parseFloat(getComputedStyle(other.querySelector('.row')).strokeWidth) : 0;
  node.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
  return {
    expected, on: on.length, thick, thin,
    after: screen.querySelectorAll('.edge.on').length,
    onlyThisCourse: on.every((a) => a.dataset.from === target || a.dataset.to === target),
  };
});
ok('the cursor lights up the course edges', lit.on === lit.expected && lit.expected > 0,
  lit.on + ' of ' + lit.expected);
ok('and not the others', lit.onlyThisCourse);
ok('a lit edge gets thicker', lit.thick > lit.thin, lit.thick + 'px vs ' + lit.thin + 'px');
ok('and goes out when the cursor leaves', lit.after === 0);

console.log('\n== 4. course and lesson ==');
await p.goto(BASE + PAGE + '#/course/javascript');
await p.waitForSelector('.lesson-row');
const lessonCount = await p.locator('.lesson-row').count();
ok('lesson = topic', lessonCount === 12, lessonCount + ' lessons');
ok('the rail became a list of lessons', (await p.locator('.rail-lesson').count()) === 12);

/* A lesson is split into sections and the assessment is the last one. A lesson
   with NO written sections yet has two: content and assessment. The course used
   here used to be JavaScript, and it stopped serving the day that course gained
   content — which is the right behaviour, and the reason the test points at a
   course that still has no text. */
await p.goto(BASE + PAGE + '#/course/git/lesson/1');
await p.waitForSelector('.step');
ok('a lesson with no written sections has content + assessment', (await p.locator('.step').count()) === 2);

await p.goto(BASE + PAGE + '#/course/javascript/lesson/1');
await p.waitForSelector('.step');
ok('the first section is not the assessment', (await p.locator('.ex').count()) === 0);

/* The assessment is a WIZARD: one question at a time, with markers on top. */
await p.goto(BASE + PAGE + '#/course/javascript/lesson/1/assessment');
await p.waitForSelector('.wizard');
ok('one question at a time', (await p.locator('.ex').count()) === 1);
ok('seven markers', (await p.locator('.wz-dot').count()) === 7);

const kinds = [];
for (let i = 0; i < 7; i += 1) {
  await p.locator('.wz-dot').nth(i).click();
  await p.waitForTimeout(120);
  kinds.push((await p.locator('.ex').getAttribute('class')).replace('ex ex-', ''));
}
ok('all seven types are in the wizard', new Set(kinds).size === 7, kinds.join(', '));

console.log('\n== 5. answering each type ==');
// takes the wizard to that type's question, answers it and checks the verdict
const goToType = async (kind) => {
  const n = await p.locator('.wz-dot').count();
  for (let i = 0; i < n; i += 1) {
    await p.locator('.wz-dot').nth(i).click();
    await p.waitForTimeout(120);
    if (await p.locator('.ex-' + kind).count()) return true;
  }
  return false;
};
const answer = async (sel, fn, expected) => {
  const kind = sel.replace('.ex-', '');
  if (!await goToType(kind)) { ok(kind, false, 'not found in the wizard'); return; }
  const ex = p.locator(sel);
  await fn(ex);
  const button = ex.locator('.ex-answer');
  if (await button.count()) await button.click();   // matching finishes on its own
  await p.waitForFunction((s) => document.querySelector(s + ' .ex-verdict')?.className.match(/v-(right|wrong|pending)/),
    sel, { timeout: 5000 });
  const cls = await ex.locator('.ex-verdict').getAttribute('class');
  ok(kind, cls.includes(expected), cls);
};

// quiz: ticks the correct choice by its data-ix
await answer('.ex-quiz', async (ex) => {
  const ix = await p.evaluate(() => window.SAMPLE_EXERCISES.find((e) => e.type === 'quiz').choices.findIndex((a) => a.correct));
  await ex.locator(`.choice[data-ix="${ix}"]`).click();
}, 'v-right');

await answer('.ex-multiple-choice', async (ex) => {
  const ixs = await p.evaluate(() => window.SAMPLE_EXERCISES.find((e) => e.type === 'multiple-choice')
    .choices.map((a, i) => (a.correct ? i : -1)).filter((i) => i >= 0));
  for (const i of ixs) await ex.locator(`.choice[data-ix="${i}"]`).click();
}, 'v-right');

// ordering: reorders through the DOM into the right order using the arrows
await answer('.ex-ordering', async (ex) => {
  const right = await p.evaluate(() => window.SAMPLE_EXERCISES.find((e) => e.type === 'ordering').items);
  for (let target = 0; target < right.length; target += 1) {
    for (let step = 0; step < 8; step += 1) {
      const current = await ex.locator('.ord-item').allTextContents();
      const pos = current.findIndex((t) => t.includes(right[target].slice(0, 22).replace(/`/g, '')));
      if (pos <= target) break;
      await ex.locator('.ord-item').nth(pos).locator('.ord-arrow[data-direction="-1"]').click();
    }
  }
}, 'v-right');

/* Matching became click-by-click with immediate feedback, in the Duolingo
   gesture. Since a wrong pair comes undone, the final map is always right — the
   verdict now measures the MISTAKES along the way, and passing means closing
   with none. */
await answer('.ex-matching', async (ex) => {
  const pairs = await p.evaluate(() => window.SAMPLE_EXERCISES.find((e) => e.type === 'matching').pairs);
  for (const pair of pairs) {
    await ex.locator('.tile-left').filter({ hasText: pair.left.replace(/`/g, '') }).first().click();
    await ex.locator('.tile-right').filter({ hasText: pair.right.replace(/`/g, '') }).first().click();
    await p.waitForTimeout(80);
  }
}, 'v-right');

// the three that need a server: the verdict has to be "not checked"
await answer('.ex-expected-output', async (ex) => ex.locator('.ex-field').fill('false\ntrue\nnumber\n'), 'v-pending');
await answer('.ex-code', async (ex) => ex.locator('.code-area').fill('console.log(1)'), 'v-pending');
await answer('.ex-expression-answer', async (ex) => ex.locator('.ex-field').fill('3*x**2'), 'v-pending');

console.log('\n== 6. the wizard keeps what was answered ==');
/* Going back to an answered question has to give it back as it was: with the
   verdict in sight and the justifications revealed. Rebuilding would erase that,
   and the student would think they lost their work. */
await goToType('quiz');
ok('the verdict is still there on the way back',
  (await p.locator('.ex-quiz .ex-verdict').getAttribute('class')).includes('v-right'));
const revealed = await p.locator('.ex-quiz .choice-why:visible').count();
ok('justifications are still revealed', revealed > 0, revealed + ' visible');
ok('the question marker went green', (await p.locator('.wz-dot.right').count()) >= 4);

console.log('\n== 7. progress and persistence ==');
// a course with no text yet, so the lesson has exactly content + assessment and
// "next" lands on the assessment in one step
await p.goto(BASE + PAGE + '#/course/git/lesson/1/content');
await p.waitForSelector('.side-right');
/* Completing is a consequence of moving on, not a button of its own — so the
   section must NOT already be marked while it is being read. This used to check
   for the absence of a separate "mark as read" button; that button no longer
   exists anywhere, which made the check vacuous. */
ok('the section is not marked while it is being read',
  (await p.locator('.rail-section.done').count()) === 0);
await p.click('.side-right');
// moving on IS completing: one gesture, no separate button
await p.waitForFunction(() => location.hash.endsWith('/assessment'), null, { timeout: 5000 });
ok('moving on goes to the next section', true);
ok('the section is marked in the rail', (await p.locator('.rail-section.done').count()) === 1);
const pctBefore = await p.locator('.ctx-pct').innerText();
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(400);
ok('it survived the reload', (await p.locator('.ctx-pct').innerText()) === pctBefore, pctBefore);

console.log('\n== 8. written sections ==');
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/8');
await p.waitForSelector('.step');
const steps = await p.$$eval('.step-title', (e) => e.map((x) => x.textContent));
ok('the hosting topic became 5 sections + assessment', steps.length === 6, steps.join(' · '));
ok('the first section is the shared-hosting one', /shared/i.test(steps[0]), steps[0]);
ok('the last one is always the assessment', /assessment/i.test(steps[steps.length - 1]), steps[steps.length - 1]);
ok('prose rendered', (await p.locator('.lesson-text p').count()) >= 2);
ok('a content section reserves the video frame', await p.locator('.modal-video').isVisible());
ok('the rail opens the current lesson sections', (await p.locator('.rail-section').count()) === 6);
/* The regression that matters, restated after the rename: sections are matched
   by the AUTHORED topic title, which is English now, and the displayed title is
   whatever the language switch put there. They coincide in an English browser
   and diverge in every other one — so this asserts the join survived, not that
   the two strings happen to be equal. */
ok('the join survived the language switch', (await p.locator('.lesson-title').innerText()) !== '');

// the last section of a lesson leads to the first of the next lesson
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/8/assessment');
await p.waitForSelector('.side-right');
await p.click('.side-right');
await p.waitForFunction(() => /\/lesson\/9\//.test(location.hash), null, { timeout: 5000 });
ok('next crosses the lesson boundary', true);

/* Every lesson ends in an assessment, with or without exercises. The empty one
   shows — the structure is predictable — but does not count towards progress,
   or no course would close while the content did not exist. */
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/8/assessment');
await p.waitForSelector('.wizard');
// the wizard keeps only one question on screen; the marker row is what counts
ok('the hosting assessment has 2 questions', (await p.locator('.wz-dot').count()) === 2);

await p.goto(BASE + PAGE + '#/course/javascript/lesson/3/assessment');
await p.waitForSelector('.assessment-pending');
ok('an assessment with no exercises shows as pending', true);
/* moving on completes — EXCEPT on a pending assessment, which has nothing to
   complete */
await p.click('.side-right');
await p.waitForTimeout(300);
await p.goto(BASE + PAGE + '#/course/javascript/lesson/3/assessment');
await p.waitForSelector('.step');
ok('a pending assessment is not completed by moving on',
  (await p.locator('.step.step-assessment.done').count()) === 0);

const denominators = await p.evaluate(() => {
  const lessons = COURSES.find((c) => c.id === 'javascript').topics.length;
  const count = document.querySelector('.rail-count').textContent;
  return { lessons, count };
});
/* 12 JavaScript lessons. CONTENT sections: the first four were written
   (4+3+2+2 = 11) and the other eight still fall into the one-section wrapper
   (8). That makes 19. ASSESSMENTS: only the three lessons that have exercises
   enter the denominator. 19 + 3 = 22.

   The number changes as more content is written, and that is the right
   behaviour: the lesson really did gain more work inside it. What the test
   guards is the RULE — without excluding the empty assessments the denominator
   would be 31, and the course would never reach 100%. */
ok('a pending assessment stays out of the denominator', /\b22\b/.test(denominators.count), denominators.count);

console.log('\n== 9. a practical course: code inside prose ==');
await p.goto(BASE + PAGE + '#/course/html-css');
await p.waitForSelector('.lesson-row');
ok('html-css has 13 lessons', (await p.locator('.lesson-row').count()) === 13);
/* 13 lessons × 3 sections = 39, plus the 4 assessments that already have
   exercises. The 9 pending assessments stay out of the denominator. */
ok('the denominator counts only the ready assessments',
  /\b43\b/.test(await p.locator('.course-count').innerText()),
  await p.locator('.course-count').innerText());

await p.goto(BASE + PAGE + '#/course/html-css/lesson/7/axes');
await p.waitForSelector('.prose-code');
const block = await p.locator('.prose-code .code').first().innerText();
ok('a code block inside prose', block.includes('display: flex'), JSON.stringify(block.slice(0, 40)));
ok('with a language label', (await p.locator('.prose-code .code-lang').first().innerText()).toLowerCase() === 'css');
/* The block does NOT go through `formatted`: a backtick or an asterisk inside
   code is a character, not markup. A badly escaped `<` would swallow the whole
   line.

   This used to assert the inner <code> held no tags at all, which was a proxy
   for "escaped" and stopped being true when the block started going through
   `highlight()`. The invariant it was standing in for is checked directly
   instead, and it is the stronger of the two: whatever the highlighter wraps,
   the characters that come back out have to be the characters the author
   typed, and the only tags allowed are its own. */
const blockHtml = await p.locator('.prose-code .code code').first().innerHTML();
ok('the only markup inside the code is the highlighter\'s',
  [...blockHtml.matchAll(/<(\/?)([a-z][\w-]*)([^>]*)>/gi)]
    .every(([, close, tag, attrs]) => tag === 'span' && (close ? !attrs.trim() : /^ class="t-\w+"$/.test(attrs))),
  (blockHtml.match(/<(?!\/?span)[a-z][\w-]*/gi) || []).join(' ') || 'only spans');
ok('and the text survives the highlighting unchanged', await p.evaluate(() => {
  const el = document.querySelector('.prose-code .code code');
  // The authored snippet, as the copy button reads it back.
  return el.textContent.includes('display: flex') && !el.textContent.includes('<span');
}));

await p.goto(BASE + PAGE + '#/course/html-css/lesson/0/skeleton');
await p.waitForSelector('.prose-code');
const htmlBlock = await p.locator('.prose-code .code').first().innerText();
ok('HTML tags survive the escaping', htmlBlock.includes('<!DOCTYPE html>'), JSON.stringify(htmlBlock.slice(0, 24)));

await p.goto(BASE + PAGE + '#/course/html-css/lesson/0/assessment');
await p.waitForSelector('.assessment-pending');
ok('a half-written course shows a pending assessment, and no exercises with it',
  (await p.locator('.wizard').count()) === 0);

console.log('\n== 10. global search ==');
await p.goto(BASE + PAGE + '#/dashboard');
await p.waitForSelector('.resume');
await p.keyboard.press('Control+k');
await p.waitForSelector('.search-field');
ok('⌘K opens the panel', true);

await p.fill('.search-field', 'ttl');
await p.waitForTimeout(200);
const groups = await p.locator('.search-group').count();
ok('it finds results in more than one group', groups >= 2, groups + ' groups');
ok('the result carries context', (await p.locator('.bi-ctx').count()) > 0);

/* Unaccented has to find accented: people typing on a phone almost never add
   accents, and the folding happens on both sides of the comparison. English,
   the source language, has no accents to fold — so the check switches to
   Portuguese, where the need is real. */
await p.evaluate(() => localStorage.setItem('codeschool-language', 'pt'));
await p.reload();
await p.waitForFunction(() => location.hash.length > 1);
await p.keyboard.press('Control+k');
await p.waitForSelector('.search-field');
await p.fill('.search-field', 'coercao');
await p.waitForTimeout(200);
ok('unaccented search finds the accented text', (await p.locator('.search-item').count()) > 0);

/* The regression that matters: the content is translated at runtime, so
   indexing only the DISPLAYED text would make a section vanish the moment the
   student reads it in a language the section was not written in. Both sides
   are indexed, so either term finds it. */
await p.fill('.search-field', 'hospedagem');
await p.waitForTimeout(200);
ok('a Portuguese term finds the section', (await p.locator('.search-item').count()) > 0);
await p.evaluate(() => localStorage.setItem('codeschool-language', 'en'));
await p.reload();
await p.waitForFunction(() => location.hash.length > 1);
await p.keyboard.press('Control+k');
await p.waitForSelector('.search-field');
await p.fill('.search-field', 'hosting');
await p.waitForTimeout(200);
ok('and the English one finds it too', (await p.locator('.search-item').count()) > 0);

/* The excerpt is plain text: the body's minimal markup (backticks and **) is
   interpreted in the section, not here, and it was left on screen as `**TTL**`. */
await p.fill('.search-field', 'cache');
await p.waitForTimeout(200);
const excerpts = await p.locator('.bi-ctx').allInnerTexts();
ok('the excerpt has no raw markup', excerpts.every((t) => !/\*\*|`/.test(t)),
  excerpts.length + ' excerpts');

/* And it does not repeat the title right above it: the excerpt exists to show
   what the title line does not. */
const repeated = await p.locator('.search-item').evaluateAll((els) => els.some((el) => {
  const title = el.querySelector('.bi-tit')?.textContent.trim() || '';
  const ctx = el.querySelector('.bi-ctx')?.textContent.trim() || '';
  return title.length > 8 && ctx.startsWith(title);
}));
ok('the excerpt does not repeat the title', !repeated);

await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
ok('Enter navigates to the result', /#\/course\//.test(await p.evaluate(() => location.hash)),
  await p.evaluate(() => location.hash));

await p.keyboard.press('Control+k');
await p.waitForSelector('.search-field');
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
ok('Esc closes it', (await p.locator('.search-field:visible').count()) === 0);

console.log('\n== 11. performance, redo and notes ==');
/* Get one wrong on purpose: with no mistake there is nothing for the performance
   screen to show nor for the redo screen to gather, and the test would pass
   without exercising anything. */
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/2/assessment');
await p.waitForSelector('.wizard');
await goToType('quiz');
const wrongIx = await p.evaluate(() =>
  window.SAMPLE_EXERCISES.find((e) => e.id === 'wf-03-quiz').choices.findIndex((a) => !a.correct));
await p.locator(`.ex-quiz .choice[data-ix="${wrongIx}"]`).click();
await p.locator('.ex-quiz .ex-answer').click();
await p.waitForFunction(() => document.querySelector('.ex-quiz .ex-verdict')?.className.includes('v-wrong'),
  null, { timeout: 5000 });
ok('got one wrong on purpose', true);

await p.goto(BASE + PAGE + '#/performance');
await p.waitForSelector('.screen-performance, .screen-empty');
ok('performance shows what was answered', (await p.locator('.perf-row').count()) > 0);
const wrongCount = await p.locator('.perf-wrong li').count();
ok('it lists the wrong ones', wrongCount > 0, wrongCount + ' wrong');
/* Getting it wrong and not-being-checked are different states: the types that
   need a server answer `null` and cannot count as a failure. */
ok('it separates "not checked" from "wrong"',
  (await p.locator('.track-numbers').innerText()).includes('waiting for the server'));

ok('there is a link to redo', (await p.locator('a[href="#/redo"]').count()) === 1);
await p.goto(BASE + PAGE + '#/redo');
await p.waitForSelector('.wizard');
ok('redo builds the wizard with the wrong ones', (await p.locator('.wz-dot').count()) === wrongCount);

// one note, written in a section and found again on the notes screen and in search
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/8/vps');
await p.waitForSelector('.note summary');
// the note is born collapsed: it only asks for attention from whoever will use it
ok('the note starts collapsed', (await p.locator('.note-field:visible').count()) === 0);
await p.click('.note summary');
/* The note is written in Portuguese ON PURPOSE, and it is the only fixture that
   is: it is a STUDENT's text, and it carries an accent the search is then asked
   to find without one, two blocks below. The portal is English; what a student
   types is not, and folding has to work on what they typed. */
await p.fill('.note-field', 'lembrar: VPS é responsabilidade, não potência');
await p.waitForTimeout(800);
ok('the note saves itself', (await p.locator('.note-status').innerText()).length > 0);

await p.goto(BASE + PAGE + '#/notes');
await p.waitForSelector('.note-item');
ok('the note shows on the notes screen',
  (await p.locator('.note-text').innerText()).includes('responsabilidade'));

await p.keyboard.press('Control+k');
await p.waitForSelector('.search-field');
await p.fill('.search-field', 'responsabilidade, nao');
await p.waitForTimeout(250);
ok('the note enters the search', (await p.locator('.search-group').allInnerTexts()).join(' ').length > 0);
await p.keyboard.press('Escape');

console.log('\n== 12. language ==');
await p.goto(BASE + PAGE + '#/dashboard');
await p.waitForSelector('.resume');
await p.click('.lang-btn');
await p.click('.lang-op[lang="en"]');
await p.waitForTimeout(400);
const nameEn = await p.locator('.ctx-name').innerText();
ok('the track is translated', /Back-end Development/i.test(nameEn), nameEn);
ok('the screen is rebuilt in the new language', await p.locator('.resume').isVisible());

console.log('\n== 13. figures, annotated code and material ==');
await p.goto(BASE + PAGE + '#/course/html-css/lesson/7/alignment');
await p.waitForSelector('.example');
const snippets = await p.locator('.example-code').count();
ok('annotated example, one snippet per note', snippets >= 5, snippets + ' snippets');
ok('the example output shows', await p.locator('.example-output').isVisible());

/* TWO SHAPES, AND THE CHOICE IS BY AVAILABLE WIDTH.

   Stacked is the default: the note BEFORE the snippet, both in a single column.
   The two columns only appear when BOTH fit — the code without scrolling and the
   note still readable — which takes a 1580px window. Where they do not fit, what
   is left is chopped-up code beside a squeezed note, worse than stacked on any
   screen. */
ok('at 1440px the block is stacked', await p.evaluate(() => {
  const n = document.querySelector('.example-note').getBoundingClientRect();
  const c = document.querySelector('.example-code').getBoundingClientRect();
  return n.bottom <= c.top + 2;                      // one above the other
}));
ok('and the note comes before its snippet', await p.evaluate(() => {
  const g = document.querySelector('.example-grid');
  return g.children[0].classList.contains('example-note');
}));

await p.setViewportSize({ width: 1920, height: 950 });
await p.waitForTimeout(250);

/* THE GO BY EXAMPLE SHAPE: the explanation on the LEFT, the program on the
   right, and each note at the height of the snippet it comments on. */
ok('at 1920px the note sits left of the code', await p.evaluate(() => {
  const n = document.querySelector('.example-note').getBoundingClientRect();
  const c = document.querySelector('.example-code').getBoundingClientRect();
  return n.right <= c.left + 2;
}));
ok('each note lines up with its snippet', await p.evaluate(() => {
  const notes = [...document.querySelectorAll('.example-note')];
  const cods = [...document.querySelectorAll('.example-code')];
  return notes.every((n, i) => Math.abs(n.getBoundingClientRect().top
    - cods[i].getBoundingClientRect().top) < 4);
}));

/* And the right column has to look like ONE file: the snippets join with no
   gap. That is why the borders between them went away. */
ok('the code is continuous, with no seam between snippets', await p.evaluate(() => {
  const cods = [...document.querySelectorAll('.example-code')];
  return cods.slice(1).every((c, i) =>
    Math.abs(c.getBoundingClientRect().top - cods[i].getBoundingClientRect().bottom) < 1);
}));

/* COPYING GIVES BACK THE WHOLE PROGRAM, not the snippet under the cursor. The
   `example` cuts the file into pieces on purpose so each one can be annotated,
   and a button that handed over a third of a program would be answering a
   question nobody asked. gobyexample.com copies the file; so does this.

   The `copied` class IS the assertion. `flash()` only adds it when the write
   to the clipboard resolved true, so seeing it means the copy really happened —
   no clipboard-read permission needed to prove it. */
ok('every example offers a copy button', await p.evaluate(() =>
  [...document.querySelectorAll('.example')].every((e) => e.querySelector('.example-bar .code-copy'))));

const copied = await p.evaluate(async () => {
  const block = document.querySelector('.example');
  const whole = [...block.querySelectorAll('.example-code')].map((c) => c.textContent).join('\n');
  const button = block.querySelector('.code-copy');
  button.click();
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: button.classList.contains('copied'),
    named: button.getAttribute('aria-label'),
    snippets: block.querySelectorAll('.example-code').length,
    lines: whole.split('\n').length,
    clean: !/<span|&lt;|&amp;/.test(whole),   // textContent, not innerHTML
  };
});
ok('the copy reaches the clipboard', copied.ok, copied.named);
ok('and it is the whole file, not one snippet',
  copied.lines > copied.snippets, copied.snippets + ' snippets, ' + copied.lines + ' lines');
ok('and it carries no highlighting markup', copied.clean);

/* The button says what happened. An icon that always shows a check would look
   identical whether the clipboard took it or refused — which is the same lie as
   marking an unchecked answer as passed. */
ok('the copied state announces itself and then lets go', await p.evaluate(async () => {
  const button = document.querySelector('.example .code-copy');
  const during = button.getAttribute('aria-label');
  await new Promise((r) => setTimeout(r, 1800));
  return during !== button.getAttribute('aria-label') && !button.classList.contains('copied');
}));

/* THE CODE COLUMN'S WIDTH COMES FROM MEASURING THE CONTENT: the longest line in
   the examples is 74 characters, which IBM Plex Mono at .79rem makes 562px; with
   the 36px of padding, 598. The column is 604 — a little more, on purpose. */
const codeColumn = await p.evaluate(() => {
  const c = document.querySelector('.example-code');
  return { width: Math.round(c.getBoundingClientRect().width),
    spare: Math.round(c.getBoundingClientRect().width - c.scrollWidth) };
});
ok('the code column fits the longest line, with room to spare',
  codeColumn.width >= 598 && codeColumn.spare >= 0,
  codeColumn.width + 'px, ' + codeColumn.spare + 'px spare');

/* The prose code block is the other component, and it is the same button. Here
   there is one `<pre>`, so what is copied is that block and nothing around it —
   not the language label above it, which is a caption and not code. */
await p.goto(BASE + PAGE + '#/course/html-css/lesson/4/selectors');
await p.waitForSelector('.prose-code');
const prosePrefix = await p.evaluate(async () => {
  const block = document.querySelector('.prose-code');
  const button = block.querySelector('.code-bar .code-copy');
  if (!button) return { missing: true };
  button.click();
  await new Promise((r) => setTimeout(r, 250));
  return {
    ok: button.classList.contains('copied'),
    text: block.querySelector('pre.code').textContent,
    label: block.querySelector('.code-lang').textContent,
  };
});
ok('the prose code block has the button in its bar too', !prosePrefix.missing);
ok('and copying it works', prosePrefix.ok);
ok('and the language label is not part of the code',
  !prosePrefix.text.startsWith(prosePrefix.label), JSON.stringify(prosePrefix.text.slice(0, 28)));

/* The highlighter uses the brand's three colours. The test looks for at least
   two different families in an example that has a keyword and a literal. */
await p.goto(BASE + PAGE + '#/course/javascript/lesson/0/let-const');
await p.waitForSelector('.example-code .t-kw');
const colours = await p.evaluate(() => {
  const colour = (s) => {
    const e = document.querySelector('.example-code ' + s);
    return e ? getComputedStyle(e).color : null;
  };
  return { keyword: colour('.t-kw'), literal: colour('.t-str') };
});
ok('the highlighter tells a keyword from a literal',
  colours.keyword && colours.literal && colours.keyword !== colours.literal,
  colours.keyword + ' vs ' + colours.literal);

/* The regression highlighting can create: markup escaping wrongly. A tag inside
   an HTML example has to keep showing up as text. */
await p.goto(BASE + PAGE + '#/course/html-css/lesson/7/alignment');
await p.waitForSelector('.example-code');
ok('highlighted code is still escaped', await p.evaluate(() =>
  !document.querySelector('.example-code').innerHTML.includes('<script')));

await p.goto(BASE + PAGE + '#/course/html-css/lesson/7/alignment');
await p.waitForSelector('.example');

/* Material: the link has to download (and not navigate), with a file name. */
const material = p.locator('.mat').first();
ok('material listed in the section', await material.isVisible());
ok('the link downloads instead of opening', (await material.getAttribute('download'))?.endsWith('.pdf'),
  await material.getAttribute('download'));
ok('the PDF really is a PDF', (await material.getAttribute('href')).startsWith('data:application/pdf;base64,'));

await p.goto(BASE + PAGE + '#/course/html-css/lesson/7/axes');
await p.waitForSelector('.fig');
ok('an inline diagram inherits the theme colour', await p.evaluate(() => {
  const t = document.querySelector('.fig-svg svg text');
  return getComputedStyle(t).fill !== 'rgb(0, 0, 0)';
}));

await p.goto(BASE + PAGE + '#/course/html-css/lesson/3/images');
await p.waitForSelector('.fig img');
/* `scrollIntoViewIfNeeded` is NOT test fussiness: the figure has
   `loading="lazy"`, and a lazy image below the fold is not loaded until it
   shows. Without the scroll, `complete` is false and the test would report a
   defect that does not exist — which is what happened, and only in the
   single-file bundle, where the page height differs enough to push the figure
   out of the margin. */
await p.locator('.fig img').scrollIntoViewIfNeeded();
await p.waitForTimeout(200);
ok('the file figure loaded', await p.evaluate(() => {
  const i = document.querySelector('.fig img');
  return i.complete && i.naturalWidth > 0;
}));
ok('the figure has a caption and an choice', (await p.locator('.fig figcaption').count()) > 0
  && Boolean(await p.locator('.fig img').getAttribute('choice')));

console.log('\n== 14. the course exam ==');
await p.goto(BASE + PAGE + '#/course/web-fundamentals');
await p.waitForSelector('.exam-card');
ok('the course announces the exam', await p.locator('.exam-card').isVisible());
ok('the exam shows in the rail', (await p.locator('.rail-exam').count()) === 1);

await p.click('.exam-card .btn');
await p.waitForSelector('.wizard-exam');
const questionCount = await p.locator('.wz-dot').count();
ok('ten questions drawn', questionCount === 10, questionCount + ' questions');
ok('the hint does not show in an exam', (await p.locator('.ex-hint').count()) === 0);
ok('there is no "try again" in an exam', (await p.locator('.ex-retry').count()) === 0);

/* THE REGRESSION THAT MATTERS: in an exam the verdict is held back. If it showed,
   you could try until you got it right and the exam would stop measuring. */
const answerEverything = async (correctly) => {
  for (let i = 0; i < questionCount; i += 1) {
    await p.locator('.wz-dot').nth(i).click();
    await p.waitForTimeout(90);
    // the id comes from the DOM, not from the text: the prompt is rendered with markup
    const id = await p.locator('.ex').getAttribute('data-ex');
    const ixs = await p.evaluate((exId) => {
      const ex = window.SAMPLE_EXERCISES.find((e) => e.id === exId);
      if (!ex?.choices) return null;
      return ex.choices.map((a, k) => (a.correct ? k : -1)).filter((k) => k >= 0);
    }, id);
    if (!ixs) continue;                       // a type this loop cannot answer
    const targets = correctly ? ixs : [ixs.includes(0) ? 1 : 0];
    for (const k of targets) await p.locator(`.ex .choice[data-ix="${k}"]`).click();
    const bt = p.locator('.ex .ex-answer');
    if (await bt.count()) await bt.click();
    await p.waitForTimeout(130);
  }
};
await answerEverything(true);
ok('no right/wrong verdict before submitting',
  (await p.locator('.ex-verdict.v-right, .ex-verdict.v-wrong').count()) === 0);
ok('the answer is recorded, and says so', (await p.locator('.v-recorded').count()) > 0);

await p.locator('.wz-dot').nth(questionCount - 1).click();
await p.locator('.wz-next').click();               // submit (or ask for confirmation)
await p.waitForTimeout(200);
if (!(await p.locator('.wz-result').count())) await p.locator('.wz-next').click();
await p.waitForSelector('.wz-result');
const score = await p.locator('.exam-score').innerText();
ok('the exam closes with a score', /%/.test(score), score);
ok('the result is stored', await p.evaluate(() =>
  Boolean(JSON.parse(localStorage.getItem('codeschool-portal')).exams['course:web-fundamentals'])));

/* Walks the questions one by one: the wizard keeps ONE in the document at a
   time, so counting across the whole document would measure only the one on
   screen. */
await p.locator('.wz-back').click();
await p.waitForTimeout(150);
let opened = 0;
for (let i = 0; i < questionCount; i += 1) {
  await p.locator('.wz-dot').nth(i).click();
  await p.waitForTimeout(80);
  opened += await p.locator('.ex-verdict.v-right, .ex-verdict.v-wrong').count();
}
ok('after submitting, the verdicts open', opened > 0, opened + ' of ' + questionCount);
ok('no answer stayed held back', (await p.locator('.v-recorded').count()) === 0);
ok('after submitting, you cannot answer again',
  await p.evaluate(() => [...document.querySelectorAll('.ex input, .ex .ex-answer')].every((e) => e.disabled)));

console.log('\n== 15. the track exam and the certificates ==');
await p.goto(BASE + PAGE + '#/track');
await p.waitForSelector('.exam-card');
ok('the track announces its exam', await p.locator('.exam-card').isVisible());
await p.click('.exam-card .btn');
await p.waitForSelector('.wizard-exam');
const trackQuestions = await p.locator('.wz-dot').count();
ok('fifteen questions, from more than one course', trackQuestions === 15, trackQuestions + ' questions');

await p.goto(BASE + PAGE + '#/certificates');
await p.waitForSelector('.cert');
ok('there are certificate examples', (await p.locator('.cert-sample').count()) === 2);
ok('the example declares itself an example', (await p.locator('.cert-seal').first().innerText()).length > 0);
ok('no certificate issued without a passed exam',
  (await p.locator('.cert:not(.cert-sample)').count()) === 0);

console.log('\n== 16. the // tags are gone ==');
for (const [path, sel] of [['#/dashboard', '.resume'], ['#/catalog', '.view-catalog'], ['#/certificates', '.cert']]) {
  await p.goto(BASE + PAGE + path);
  await p.waitForSelector(sel);
  ok('no tag on ' + path, (await p.locator('.view-head .tag').count()) === 0);
}

console.log('\n== 17. the two shapes of a section ==');
/* THE REGRESSION THIS BLOCK GUARDS: the video frame used to be in EVERY content
   section, reserved. A text section with a grey rectangle on top promises a
   video that never comes — and the promise does not expire. */
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/0/roles');
await p.waitForSelector('.lesson-text');
/* `.modal-video` and not `.video-facade`: the lesson had a frame of its own and
   now uses the course's, which is the vitrine's. Renaming the selector here is
   the whole of what this suite noticed — and it would have gone on passing
   against an element that no longer existed if the count checks below had been
   the only ones, since `count() === 0` is true of a class nobody renders. The
   one on line 321 is what catches that: it asserts the frame IS there. */
ok('a text section has no video frame', (await p.locator('.modal-video').count()) === 0);
ok('and the text starts at the top', await p.evaluate(() =>
  document.querySelector('.crumbs').getBoundingClientRect().top < 200));

await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/0/intro');
await p.waitForSelector('.modal-video');
ok('a video section has the frame', true);
ok('a video-only section does not invent a text block', (await p.locator('.lesson-text').count()) === 0);
ok('the duration shows on the player', (await p.locator('.video-duration').innerText()).includes('min'));

/* THE PLAYER FOLLOWS THE READING COLUMN. It once went edge to edge across the
   whole area, and the side effect was the lesson having different alignments
   depending on the section — the eye hunting for the left margin at every
   change. */
const bleed = await p.evaluate(() => {
  const v = document.querySelector('.modal-video').getBoundingClientRect();
  const t = document.querySelector('.lesson-title').getBoundingClientRect();
  return { left: Math.abs(v.left - t.left), width: Math.round(v.width) };
});
ok('the player lines up with the section text', bleed.left < 2,
  bleed.width + 'px, ' + bleed.left.toFixed(1) + 'px out of line');

await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(250);
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('the player does not overflow a phone screen', overflow <= 0, overflow + 'px over');
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(250);

/* And the title stays ABOVE the video, as in the text sections: "where am I"
   comes before "what am I watching", and the answer has to be the same in both. */
ok('the title sits above the player', await p.evaluate(() => {
  const v = document.querySelector('.modal-video').getBoundingClientRect();
  return document.querySelector('.lesson-title').getBoundingClientRect().bottom <= v.top + 1;
}));
ok('the player fits on screen', await p.evaluate(() =>
  document.querySelector('.modal-video').getBoundingClientRect().height <= window.innerHeight * 0.8));

/* THE LESSON HAS ONE WIDTH, and it holds for the title, the prose, the player
   and the example at the same time. The cut is 1466px: below it the lesson stays
   at 820 with the code block stacked; above it, all four grow together up to
   1074.

   Two earlier attempts released one element at a time — first the player, then
   the example — and both produced different margins inside the same lesson. That
   is why the test measures all four together, and not one against another. */
for (const [width, height, expected] of [
  [1280, 900, 818], [1440, 900, 820], [1466, 950, 934], [1580, 950, 1048],
  [1700, 950, 1074], [1920, 950, 1074],
]) {
  await p.setViewportSize({ width, height });
  await p.goto(BASE + PAGE + '#/course/javascript/lesson/0/let-const');
  await p.waitForSelector('.example');
  const one = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const cx = ['.lesson-title', '.lesson-text p', '.modal-video', '.example'].map(r);
    const v = r('.modal-video');
    return {
      widths: cx.map((c) => Math.round(c.width)),
      lefts: [...new Set(cx.map((c) => Math.round(c.left)))],
      ratio: v.width / v.height,
    };
  });
  const same = one.widths.every((w) => Math.abs(w - expected) <= 1);
  ok('at ' + width + 'px title, prose, player and example share one width',
    same && one.lefts.length === 1, JSON.stringify(one.widths));
  ok('at ' + width + 'px the player keeps the 16/9 ratio',
    Math.abs(one.ratio - 16 / 9) < 0.02, one.ratio.toFixed(2));
}

/* A short window: the height ceiling now shrinks the WIDTH, because cutting the
   height of a box with `aspect-ratio` does not shrink the box — it flattens it,
   and the video inside stretches. Here the player ends up SMALLER than the
   example, and never deformed. */
await p.setViewportSize({ width: 1920, height: 700 });
await p.goto(BASE + PAGE + '#/course/javascript/lesson/0/let-const');
await p.waitForSelector('.modal-video');
const shortWindow = await p.evaluate(() => {
  const v = document.querySelector('.modal-video').getBoundingClientRect();
  const t = document.querySelector('.lesson-title').getBoundingClientRect();
  return {
    ratio: v.width / v.height, width: Math.round(v.width),
    height: Math.round(v.height), left: Math.abs(v.left - t.left),
  };
});
ok('in a short window the player shrinks without deforming', Math.abs(shortWindow.ratio - 16 / 9) < 0.02,
  shortWindow.width + '×' + shortWindow.height);
ok('and it starts again where the text starts', shortWindow.left < 2, shortWindow.left.toFixed(1) + 'px out of line');
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(BASE + PAGE + '#/course/web-fundamentals/lesson/0/intro');
await p.waitForSelector('.modal-video');

/* In the rail the icon says the NATURE of the section, not only its state. */
const icons = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.rail-section')];
  return {
    withDuration: rows.filter((l) => l.querySelector('.ts-dur')).length,
    total: rows.length,
  };
});
ok('the rail shows the duration of the video sections', icons.withDuration === 2,
  icons.withDuration + ' of ' + icons.total);

/* Video is NOT a synonym for the opening of a lesson. If every video section
   were the first of its lesson, the shape would have become a convention with
   nobody deciding it — and the second, third and fourth sections can also be the
   time to watch. */
const positions = await p.evaluate(() => {
  const out = {};
  Object.values(window.LESSONS).forEach((course) => {
    Object.values(course).forEach((sections) => {
      sections.forEach((s, i) => { if (s.video !== undefined) out[i + 1] = (out[i + 1] || 0) + 1; });
    });
  });
  return out;
});
ok('there is video outside the first section', Object.keys(positions).length >= 3,
  JSON.stringify(positions));

/* EVERY SECTION HAS ONE WIDTH, NO EXCEPTIONS.

   The question this test asks has changed. It used to be "who went past the
   ceiling?", with a list of who was allowed to — and the list grew with every
   element that earned the right to escape, while the real defect (different
   margins inside the same lesson) went through. Now the question is the rule:
   ALL of the screen's children begin and end in the same column, and it is
   `--screen`.

   The test walks EVERY written section of the three courses, one at a time. It
   is expensive (one navigation per section) and it is the only way for the rule
   to hold for the content that exists, and not for the section I happened to
   open. */
await p.setViewportSize({ width: 1920, height: 1000 });
await p.waitForTimeout(200);
const outOfBounds = await p.evaluate(async () => {
  const out = [];
  for (const course of Object.keys(window.LESSONS)) {
    const topics = Object.keys(window.LESSONS[course]);
    for (let i = 0; i < topics.length; i += 1) {
      for (const sec of window.LESSONS[course][topics[i]]) {
        location.hash = `#/course/${course}/lesson/${i}/${sec.id}`;
        await new Promise((r) => setTimeout(r, 50));
        const screen = document.querySelector('.view-lesson');
        if (!screen) continue;
        const target = screen.getBoundingClientRect();
        [...screen.children].forEach((child) => {
          if (child.classList.contains('side-arrow')) return;   // floats, is not content
          const r = child.getBoundingClientRect();
          if (r.width === 0) return;                           // hidden at this width
          const name = `${course}/${sec.id}:${child.className.split(' ')[0]}`;
          if (Math.abs(r.left - target.left) > 1) {
            out.push(name + ' starts outside the column (' + Math.round(r.left - target.left) + 'px)');
          }
          /* the player is the only slack, and only downwards: in a short window
             the height ceiling shrinks it, and shrinking is the opposite of
             overflowing */
          const mayShrink = child.classList.contains('video-facade');
          const spare = target.right - r.right;
          if (spare < -1 || (spare > 1 && !mayShrink)) {
            out.push(name + ' ends outside the column (' + Math.round(-spare) + 'px)');
          }
        });
      }
    }
  }
  return out;
});
ok('in every section the content has one column', outOfBounds.length === 0,
  outOfBounds.slice(0, 3).join(' · ') || 'all 89 sections aligned');
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(200);

console.log('\n== 18. certificate, plan and account ==');
await p.goto(BASE + PAGE + '#/certificates');
await p.waitForSelector('.cert');
/* The regression this test guards: the certificate is NOT a terminal window. It
   was born reusing the vitrine's `.term-bar`, and it is the only artefact of the
   portal that leaves here — it has to look like a document. */
ok('the certificate is not a terminal window', (await p.locator('.cert .term-bar').count()) === 0);
ok('it has the shape of a document',
  (await p.locator('.cert-sheet').count()) > 0 && (await p.locator('.cert-student').count()) > 0);
ok('the student name is the largest element', await p.evaluate(() => {
  const px = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
  return px('.cert-student') > px('.cert-course');
}));

/* An example's validation code must not look like a real code. */
ok('the example does not invent a code', !/CS-/.test(await p.locator('.cert-sample .cert-code').first().innerText()));

/* The certificate opens large, with the background frozen — the vitrine's own
   modal. Freezing is `overflow:hidden` on the document: catching only the wheel
   still let through the scrollbar and the arrow keys. */
await p.locator('.cert').first().click();
await p.waitForSelector('.modal-cert');
ok('the certificate opens in a modal', await p.locator('.modal-cert .cert-sheet').isVisible());
/* THE DIALOG HAS TO HAVE AN ACCESSIBLE NAME. `role="dialog"` with no name is
   announced as just "dialog", and the person cannot tell what opened. This is
   checked because it broke once and nothing noticed: a rename left the caller
   passing `label` while openModal still destructured the old Portuguese name,
   so the attribute
   silently stopped being set. Every screen looked right — the only symptom was
   on a screen reader. */
ok('and the dialog is named', /Certificate/.test(await p.locator('.modal-cert').getAttribute('aria-label') || ''),
  await p.locator('.modal-cert').getAttribute('aria-label'));
ok('and it grows on screen', await p.evaluate(() => {
  const inside = document.querySelector('.modal-cert .cert-student').getBoundingClientRect().height;
  const outside = document.querySelector('.screen-certificates .cert-student').getBoundingClientRect().height;
  return inside > outside;
}));
ok('the background freezes', await p.evaluate(() =>
  getComputedStyle(document.documentElement).overflow === 'hidden'));

/* Both buttons sit next to the close button in BOTH cases — hiding one would
   make the feature look non-existent. On an example they come disabled and
   without a target: visible, and unable to publish or save a credential nobody
   earned. `:not(.cert-png)` is how the LinkedIn one is named apart, now that
   two controls share the shape. */
const LI = '.modal-actions .cert-in:not(.cert-png)';
ok('the example shows both certificate buttons',
  (await p.locator('.modal-actions .cert-in').count()) === 2);
ok('and neither leads anywhere', await p.evaluate((li) => {
  const a = document.querySelector(li);
  const png = document.querySelector('.modal-actions .cert-png');
  return a.tagName !== 'A' && a.getAttribute('aria-disabled') === 'true'
    && png.tagName !== 'BUTTON' && png.getAttribute('aria-disabled') === 'true';
}, LI));
ok('the buttons sit left of the close button', await p.evaluate((li) => {
  const close = document.querySelector('.modal-close').getBoundingClientRect().left + 1;
  return [li, '.modal-actions .cert-png']
    .every((sel) => document.querySelector(sel).getBoundingClientRect().right <= close);
}, LI));
/* Icon only: the label left the screen and moved into the `aria-label`, which is
   what a screen reader announces. An icon button with no accessible name is a
   mute button. */
ok('the buttons are icon only, with accessible names', await p.evaluate((li) => {
  return [li, '.modal-actions .cert-png'].every((sel) => {
    const b = document.querySelector(sel);
    return b.textContent.trim() === '' && (b.getAttribute('aria-label') || '').length > 5;
  });
}, LI));
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
ok('Esc closes the certificate', (await p.locator('.modal-cert').count()) === 0);
ok('and the background scrolls again', await p.evaluate(() =>
  getComputedStyle(document.documentElement).overflow !== 'hidden'));

/* On a phone the certificate overflowed on BOTH axes. It was not its fault: the
   `.modal` is a grid with an `auto` track, and there `width:min(1040px,100%)`
   resolves against its own child's `max-content` — the sum eats itself and caps
   nothing. The track became `minmax(0,1fr)`; the test measures the sheet, not the
   rule. */
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(120);
await p.locator('.cert').first().click();
await p.waitForSelector('.modal-cert');
const certOnPhone = await p.evaluate(() => {
  const f = document.querySelector('.modal-cert .cert-sheet').getBoundingClientRect();
  return {
    width: Math.round(f.width), left: Math.round(f.left),
    over: Math.round(f.right - window.innerWidth),
    below: Math.round(f.bottom - document.documentElement.clientHeight),
    scrollX: document.documentElement.scrollWidth - window.innerWidth,
  };
});
ok('at 390px the certificate fits the width', certOnPhone.over <= 0 && certOnPhone.left >= 0,
  certOnPhone.width + 'px starting at ' + certOnPhone.left);
ok('and it fits the height', certOnPhone.below <= 0, certOnPhone.below + 'px spare below');
ok('and the page does not scroll horizontally', certOnPhone.scrollX <= 1, certOnPhone.scrollX + 'px');
await p.keyboard.press('Escape');
await p.waitForTimeout(160);
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(120);

/* Now a REAL certificate: course completed and exam passed. It is the only way
   to see the LinkedIn buttons, and it is the one worth checking — a malformed
   share URL only shows up on LinkedIn's own site. */
await p.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('codeschool-portal'));
  e.exams = { ...(e.exams || {}), 'course:git': { attempts: 1, best: 90, passed: true } };
  e.progress = e.progress || {};
  e.progress.git = { lessons: {} };
  // marks every countable section of git as done
  COURSES.find((c) => c.id === 'git').topics.forEach((_, ix) => {
    e.progress.git.lessons[ix] = { sections: { content: true, assessment: true }, exercises: {} };
  });
  localStorage.setItem('codeschool-portal', JSON.stringify(e));
});
/* `reload`, and not just navigating: `state.js` reads localStorage ONCE, when
   the module loads. Writing from outside and changing route would make the
   portal re-read nothing. */
await p.goto(BASE + PAGE + '#/certificates', { waitUntil: 'networkidle' });
await p.reload({ waitUntil: 'networkidle' });
await p.waitForSelector('.cert:not(.cert-sample)');
ok('a certificate is issued with the course done and the exam passed', true);

await p.locator('.cert:not(.cert-sample)').first().click();
await p.waitForSelector('.modal-cert');

/* WHAT THIS SUITE CAN SEE IS THE PORTAL WITH NO BACKEND, and that mode changed:
   the validation code is the server's now, so with no server there is none. It
   used to be hashed out of the course id and the student's name — the right
   placeholder while nothing issued one, and a trap the moment something did,
   because the number a student can read and copy would be the one the public
   page answers "no certificate under this code" to.

   So the checks here are the ones that hold with no server, and the ones that
   need one live in tools/exam-server/check.mjs, against a real API and a real
   database: that the code on screen is the server's, that the LinkedIn URL
   carries it, and that opening the URL finds the document. */
ok('an earned certificate carries no code with no backend', await p.evaluate(() => {
  const art = document.querySelector('.modal-cert .cert');
  return !art.dataset.code && !/CS-/.test(art.querySelector('.cert-code').textContent);
}));
ok('and the footer says so rather than leaving a blank',
  (await p.locator('.modal-cert .cert-code').innerText()).trim().length > 5,
  await p.locator('.modal-cert .cert-code').innerText());

/* The LinkedIn button and the PNG button now answer to DIFFERENT facts, which
   is the change: `profile/add` posts a credential naming an issuer, and with no
   server there is no issuer. The picture is still a picture, and it carries the
   "no code" line in its own footer wherever it goes. */
ok('the credential cannot be published without an issued code', await p.evaluate((li) => {
  const a = document.querySelector(li);
  return a.tagName !== 'A' && a.getAttribute('aria-disabled') === 'true'
    && (a.getAttribute('title') || '').length > 10;
}, LI));
ok('and the reason is on the button', await p.evaluate((li) =>
  !/sample/i.test(document.querySelector(li).getAttribute('title') || ''), LI),
  await p.locator(LI).getAttribute('title'));
ok('the download stays available', await p.evaluate(() =>
  document.querySelector('.modal-actions .cert-png').tagName === 'BUTTON'));

/* The PNG. Checked by DOWNLOADING it and reading the bytes: a button that
   fires and produces nothing looks identical from the outside, and the file is
   the whole point of it. The signature is PNG's, and the size is the one the
   module declares — a canvas that failed to draw still saves, at 0 bytes. */
const [png] = await Promise.all([
  p.waitForEvent('download', { timeout: 15000 }),
  p.locator('.modal-actions .cert-png').click(),
]);
/* Named from `data-code` and not from the footer's TEXT. Scraping the text gave
   `codeschool-ing-nocodehasbeenissued.png` here, and a different file name in
   each of the five languages. */
ok('the file falls back to a name rather than to a sentence',
  png.suggestedFilename() === 'codeschool-ing-certificate.png',
  png.suggestedFilename());
const pngPath = await png.path();
const bytes = pngPath ? await readFile(pngPath) : Buffer.alloc(0);
ok('and the file is a real PNG, not an empty one',
  bytes.length > 4000 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  bytes.length + ' bytes');
/* The dimensions live in one place, and a silent change of them would ship a
   certificate at the wrong size to whoever downloads it. */
const dims = bytes.length > 24 ? [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] : [0, 0];
ok('at the declared size', dims[0] === 2000 && dims[1] === 1160, dims.join('x'));

await p.keyboard.press('Escape');
await p.waitForTimeout(150);

await p.goto(BASE + PAGE + '#/plan');
await p.waitForSelector('.pl-table');
const planRows = await p.locator('.pl-table tbody tr').count();
ok('the table compares every feature', planRows >= 10, planRows + ' rows');
ok('the subscribed plan column is highlighted', (await p.locator('.pl-table th.on').count()) === 1);
const planBefore = await p.locator('.pl-current-top h2').innerText();
await p.locator('.pl-switch').first().click();
await p.waitForTimeout(300);
const planAfter = await p.locator('.pl-current-top h2').innerText();
ok('the upgrade switches the plan', planAfter !== planBefore, planBefore + ' → ' + planAfter);
ok('the plan survives the reload', await p.evaluate(() =>
  Boolean(JSON.parse(localStorage.getItem('codeschool-portal')).account?.planId)));

await p.goto(BASE + PAGE + '#/account');
await p.waitForSelector('#f-email');
await p.fill('#c-email', 'nao-e-email');
await p.click('#f-email button[type=submit]');
await p.waitForTimeout(150);
ok('an implausible e-mail is refused', (await p.locator('#a-email').getAttribute('class')).includes('bad'));
await p.fill('#c-email', 'student@codeschool.ing');
await p.click('#f-email button[type=submit]');
await p.waitForTimeout(150);
ok('a plausible e-mail is accepted', (await p.locator('#a-email').getAttribute('class')).includes('good'));

/* The new password must NOT be stored anywhere: there is no authentication, and
   storing it would give the opposite impression. The test looks for the string
   across the whole storage. */
await p.fill('#c-password-current', 'old-one-123');
await p.fill('#c-password-new', 'correct-horse-battery-staple');
await p.fill('#c-password-repeat', 'something-else');
await p.click('#f-password button[type=submit]');
await p.waitForTimeout(150);
ok('passwords that do not match are refused', (await p.locator('#a-password').getAttribute('class')).includes('bad'));
await p.fill('#c-password-repeat', 'correct-horse-battery-staple');
await p.click('#f-password button[type=submit]');
await p.waitForTimeout(150);
ok('password changed', (await p.locator('#a-password').getAttribute('class')).includes('good'));
ok('the password was not stored anywhere',
  !(await p.evaluate(() => JSON.stringify(localStorage).includes('correct-horse'))));

console.log('\n== 19. the catalogue fits on screen ==');
await p.goto(BASE + PAGE + '#/catalog');
await p.waitForSelector('.chips');
/* There are nine categories and they do not fit on one line. Without the arrows,
   the last ones were cut off at the edge with nothing saying there was more. */
const chips = await p.evaluate(() => {
  const c = document.querySelector('.chips');
  return { hidden: c.scrollWidth - c.clientWidth, arrows: document.querySelectorAll('.tabs-arrow').length };
});
ok('there are arrows to scroll the categories', chips.arrows === 2, chips.arrows + ' arrows');
ok('the row really does overflow', chips.hidden > 0, chips.hidden + 'px hidden');
ok('the back arrow starts disabled', await p.locator('[data-scroll="-1"]').isDisabled());
ok('the forward arrow starts enabled', !(await p.locator('[data-scroll="1"]').isDisabled()));
ok('the fade says there is more to the right',
  (await p.locator('.chips').getAttribute('class')).includes('fade-right'));

await p.click('[data-scroll="1"]');
await p.waitForTimeout(600);
ok('the arrow scrolls the row', await p.evaluate(() => document.querySelector('.chips').scrollLeft > 40));
ok('and the back arrow becomes enabled', !(await p.locator('[data-scroll="-1"]').isDisabled()));
/* The page itself never scrolls horizontally — what scrolls is the row. */
ok('the page did not gain horizontal scrolling', await p.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1));

console.log('\n== 20. the lesson fits between the arrows ==');
/* The lesson widens so the code does not turn into a scrollbar, and the
   navigation arrows live in the gap that is left. The two compete for the same
   space: the lesson's ceiling is `100vw - rail - 152`, which is exactly what
   leaves 16px between the 44px arrow and the content. The sweep checks the sum
   at eight widths, including both sides of the cut (1466) and the width at which
   the lesson stops growing. */
for (const width of [1280, 1440, 1466, 1500, 1606, 1700, 1920, 2400]) {
  await p.setViewportSize({ width, height: 950 });
  await p.goto(BASE + PAGE + '#/course/javascript/lesson/0/arrow', { waitUntil: 'networkidle' });
  await p.waitForSelector('.example');
  const m = await p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e && e.getBoundingClientRect(); };
    const ex = r('.example'); const left = r('.side-left'); const right = r('.side-right');
    const code = document.querySelector('.example-code');
    /* below 1400px the arrows go back to the footer: they are still in the DOM,
       but they no longer compete for the gap, and measuring the distance to them
       says nothing */
    const inTheGap = !!left && getComputedStyle(document.querySelector('.side-left')).position === 'fixed';
    return {
      width: Math.round(ex.width),
      inTheGap,
      clearance: inTheGap ? Math.min(ex.left - left.right, right.left - ex.right) : null,
      scrolls: code.scrollWidth > code.clientWidth + 1,
      page: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  if (m.inTheGap) {
    ok('at ' + width + 'px the example does not touch the arrow', m.clearance >= 8,
      m.width + 'px wide, ' + Math.round(m.clearance) + 'px of clearance');
  } else {
    ok('at ' + width + 'px the arrows are in the footer, not competing for the gap', true,
      m.width + 'px wide');
  }
  ok('at ' + width + 'px the code does not become a scrollbar', !m.scrolls);
  ok('at ' + width + 'px the page does not scroll horizontally', m.page <= 1, m.page + 'px');
}
await p.setViewportSize({ width: 1440, height: 900 });

console.log('\n== 21. the account menu leads to the plan ==');
await p.goto(BASE + PAGE + '#/dashboard');
await p.waitForSelector('.resume');
await p.click('.account-btn');
await p.waitForTimeout(120);
ok('there is a "My plan" item', (await p.locator('.account-op[href="#/plan"]').count()) === 1);

console.log('\n== 22. the browser knows the page is dark ==');
/* The portal is dark because the CSS paints everything dark — and none of that
   counts for the browser, which draws what is ITS OWN with the system theme.
   That is how a light-grey scrollbar appeared in the middle of the dark screen,
   in Chromium, without appearing in Firefox. `color-scheme` is the declaration
   that was missing; `scrollbar-color` is the per-container patch the vitrine
   already used and the rail had been left without. */
await p.goto(BASE + PAGE + '#/course/web-fundamentals');
await p.waitForSelector('.rail-lesson');
const scheme = await p.evaluate(() => {
  const colour = (s) => getComputedStyle(document.querySelector(s)).scrollbarColor;
  return {
    root: getComputedStyle(document.documentElement).colorScheme,
    rail: colour('#rail'),
    scrolls: (() => { const t = document.querySelector('#rail'); return t.scrollHeight > t.clientHeight; })(),
  };
});
ok('the root declares the dark scheme', scheme.root === 'dark', scheme.root);
ok('the rail really does scroll', scheme.scrolls);
ok('and its scrollbar has a declared colour', scheme.rail !== 'auto', scheme.rail);

/* No scrollable container may be left with the system colour. The test sweeps
   all of them, instead of checking a hand-written list that goes stale. */
const noColour = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const scrollsY = el.scrollHeight > el.clientHeight && /auto|scroll/.test(cs.overflowY);
    const scrollsX = el.scrollWidth > el.clientWidth && /auto|scroll/.test(cs.overflowX);
    if (!scrollsY && !scrollsX) return;
    if (cs.scrollbarWidth === 'none') return;          // scrollbar hidden on purpose
    if (cs.scrollbarColor === 'auto') out.push(el.className || el.tagName);
  });
  return out;
});
ok('no scrollable uses the system colour', noColour.length === 0, noColour.join(', ') || 'none');

/* And in the light theme the scheme follows: declaring `dark` outright would
   leave the browser's controls dark on a white page — the same defect, from the
   other side. */
await p.click('#theme-btn');
await p.waitForTimeout(250);
ok('in the light theme the scheme becomes light',
  (await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === 'light');
await p.click('#theme-btn');
await p.waitForTimeout(250);

console.log('\n== 23. light theme and a narrow screen ==');
await p.click('.lang-btn'); await p.click('.lang-op[lang="pt-BR"]'); await p.waitForTimeout(300);
await p.click('#theme-btn');
await p.waitForTimeout(250);
ok('light theme applied', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'light');
await p.click('#theme-btn');

await p.setViewportSize({ width: 390, height: 780 });
await p.goto(BASE + PAGE + '#/course/javascript/lesson/1/assessment');
await p.waitForSelector('.ex');
await p.waitForTimeout(300);
ok('the rail becomes a drawer', await p.locator('#rail-btn').isVisible());
const widthOk = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
ok('no horizontal scrolling on a phone', widthOk);

console.log('\n== JavaScript errors ==');
/* The Google fonts are not the portal's error: on a closed network they fail and
   the CSS fallback takes over. Anything else counts as a failure. */
const relevant = errors.filter((e) => !e.includes('ERR_CONNECTION_RESET'));
if (relevant.length) { relevant.forEach((e) => console.log('  ! ' + e)); failures += relevant.length; }
else console.log('  none');

await b.close();

// regression: the redo button must not exist visibly before answering
const b2 = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const p2 = await b2.newPage({ viewport: { width: 1440, height: 900 } });
await p2.goto(BASE + PAGE + '#/sign-in', { waitUntil: 'networkidle' });
await p2.fill('#e-name', 'X'); await p2.selectOption('#e-track', 'backend');
await p2.click('#form-signin button[type=submit]'); await p2.waitForTimeout(300);
await p2.goto(BASE + PAGE + '#/course/javascript/lesson/1/assessment', { waitUntil: 'networkidle' });
await p2.waitForSelector('.ex');
console.log('\n== 24. nothing revealed before answering ==');
ok('redo is hidden', (await p2.locator('.ex-retry:visible').count()) === 0);
ok('justifications are hidden', (await p2.locator('.choice-why:visible').count()) === 0);
ok('verdicts are empty', (await p2.locator('.ex-verdict:visible').count()) === 0);
await b2.close();

/* ==========================================================================
   25. ONE DOOR OUT, AND IT IS THE CODE BUTTON

   The content does not leave by hand: selecting a paragraph and pressing Ctrl+C
   has to leave the clipboard as it was. The button still works, because it
   writes with `navigator.clipboard` and never fires a `copy` event.

   What the student writes stays theirs — the notes field selects, copies and
   pastes like any other field. That exemption is the part most likely to be
   broken by a careless `user-select:none`, and it is the one that would make
   the portal hostile rather than merely closed.

   The sentinel is the whole method: put a known string on the clipboard first,
   then check it survived. Asserting "nothing was copied" any other way cannot
   tell a blocked copy from a copy that quietly wrote an empty string. */
console.log('\n== 25. one door out, and it is the code button ==');
const b3 = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const c3 = await b3.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const p3 = await c3.newPage();
await p3.goto(BASE + PAGE + '#/sign-in');
await p3.fill('#e-name', 'Alexandre'); await p3.selectOption('#e-track', 'backend');
await p3.click('#form-signin button[type=submit]');
await p3.waitForFunction(() => location.hash === '#/dashboard');
await p3.goto(BASE + PAGE + '#/course/javascript/lesson/0/let-const');
await p3.waitForSelector('.lesson-text p');

const SENTINEL = 'SENTINEL-for-the-test';
await p3.evaluate((v) => navigator.clipboard.writeText(v), SENTINEL);
await p3.evaluate(() => {
  const el = document.querySelector('.lesson-text p');
  const range = document.createRange(); range.selectNodeContents(el);
  const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
});
await p3.keyboard.press('Control+c');
await p3.waitForTimeout(200);
ok('the lesson prose does not reach the clipboard',
  (await p3.evaluate(() => navigator.clipboard.readText())) === SENTINEL);
ok('and it is not selectable in the first place',
  (await p3.evaluate(() => getComputedStyle(document.querySelector('.lesson-text p')).userSelect)) === 'none');

await p3.locator('.example .code-copy').first().click();
await p3.waitForTimeout(250);
const throughButton = await p3.evaluate(() => navigator.clipboard.readText());
ok('but the code button still does', throughButton !== SENTINEL && throughButton.split('\n').length > 3,
  throughButton.split('\n').length + ' lines');

/* The student's own field: selectable, copyable and pasteable. Blocking paste
   here was considered and left out — it breaks password managers and stops
   someone pasting work they wrote in their own editor. */
await p3.locator('.note summary').first().click();
await p3.locator('.note-field').first().fill('a note of my own');
ok('what the student writes stays selectable',
  (await p3.evaluate(() => getComputedStyle(document.querySelector('.note-field')).userSelect)) === 'text');
await p3.locator('.note-field').first().selectText();
await p3.keyboard.press('Control+c');
await p3.waitForTimeout(200);
ok('and copyable', (await p3.evaluate(() => navigator.clipboard.readText())) === 'a note of my own');
await p3.locator('.note-field').first().fill('');
await p3.keyboard.press('Control+v');
await p3.waitForTimeout(200);
ok('and pasteable', (await p3.locator('.note-field').first().inputValue()) === 'a note of my own');
await b3.close();

/* ==========================================================================
   `matching` in an exam, with no backend.

   The type has two gestures now. In PRACTICE every pair is checked as it lands
   — green and locked, red and undone — and the measure is the path: how many
   were tried wrong before it closed. In an EXAM nothing is checked until the
   exam does, so the mapping is where the student put it and the mapping is the
   answer, which is how internal/assessment grades one. The two have to agree,
   or the same paper would score differently depending on whether a backend was
   configured.

   html-css has 8 exercises and a course exam draws 10, so the whole bank is on
   the paper and both of its matchings are certain to be there. A "skip if not
   drawn" here would be a check that quietly stops running.
   ========================================================================== */
console.log('\n== 26. matching, in an exam ==');

const b4 = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const p4 = await b4.newPage({ viewport: { width: 1280, height: 1000 } });
await p4.goto(BASE + PAGE, { waitUntil: 'networkidle' });
await p4.fill('#e-name', 'X'); await p4.selectOption('#e-track', 'frontend');
await p4.click('#form-signin button[type=submit]'); await p4.waitForTimeout(300);
await p4.goto(BASE + PAGE + '#/course/html-css/exam', { waitUntil: 'networkidle' });
await p4.waitForSelector('.wizard-exam .ex', { timeout: 15000 });

const total4 = await p4.locator('.wz-dot').count();
let atMatching = -1;
for (let i = 0; i < total4; i += 1) {
  await p4.evaluate((ix) => document.querySelectorAll('.wz-dot')[ix].click(), i);
  await p4.waitForTimeout(50);
  if (await p4.locator('.wz-stage .ex-matching').count()) { atMatching = i; break; }
}
ok('a matching is on the paper', atMatching >= 0, 'question ' + (atMatching + 1) + ' of ' + total4);

/* The answer button is there, which it is not during practice: without
   feedback there is nothing for the exercise to close on. */
ok('it does not close itself in an exam',
  (await p4.locator('.wz-stage .ex-answer').count()) === 1);

/* Pair everything CORRECTLY, reading the key off the page — which a student
   could also do here, and which is exactly what the server-drawn exam prevents
   and this mode cannot. The point of the check is the grading, not the secrecy. */
await p4.evaluate(async () => {
  const root = document.querySelector('.wz-stage .ex-matching');
  const id = root.closest('.ex').dataset.ex;
  const ex = window.SAMPLE_EXERCISES.find((e) => e.id === id);
  for (const pair of ex.pairs) {
    [...root.querySelectorAll('.tile-left')].find((t) => t.dataset.value === pair.left).click();
    [...root.querySelectorAll('.tile-right')].find((t) => t.dataset.value === pair.right).click();
  }
});
await p4.waitForTimeout(200);
ok('every pair is placed and none is judged',
  (await p4.locator('.wz-stage .tile-left[data-with]').count()) > 0
  && (await p4.locator('.wz-stage .tile-wrong').count()) === 0);

await p4.locator('.wz-stage .ex-answer').click();
await p4.waitForTimeout(400);
ok('answering records and reveals nothing',
  (await p4.locator('.wz-stage .tile-wrong').count()) === 0
  && (await p4.locator('.wz-stage .v-recorded').count()) === 1);

await p4.evaluate((last) => document.querySelectorAll('.wz-dot')[last].click(), total4 - 1);
await p4.waitForTimeout(150);
await p4.locator('.wz-next').click(); await p4.waitForTimeout(250);
if (!(await p4.locator('.wz-result').count())) await p4.locator('.wz-next').click();
await p4.waitForSelector('.wz-result', { timeout: 15000 });

await p4.locator('.wz-back').click(); await p4.waitForTimeout(150);
await p4.evaluate((ix) => document.querySelectorAll('.wz-dot')[ix].click(), atMatching);
await p4.waitForTimeout(150);
/* Graded by the MAPPING: every pair was right, so the dot is right — not
   "0 pairs tried wrong", which is the practice measure and would also have
   passed a student who never placed anything. */
ok('a perfect mapping is marked right',
  (await p4.evaluate((ix) => document.querySelectorAll('.wz-dot')[ix].classList.contains('right'), atMatching)));
ok('and the pairing is shown', (await p4.locator('.wz-stage .tile-left.tile-right').count()) > 0);
await b4.close();

console.log('\n== 27. the exam pool is not in the page ==');
/* THE PROPERTY THE TWO POOLS EXIST FOR, checked where it can actually fail.
   `assets/exam-pool.js` is the exam bank with its answer keys, and index.html
   must never load it — the snapshot tool refuses to export if the tag is there,
   and this is the same claim from the other side: the page, in a browser, with
   the globals it really ended up with. */
const b5 = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const p5 = await (await b5.newContext()).newPage();
await p5.goto(BASE + PAGE, { waitUntil: 'networkidle' });
const pool = await p5.evaluate(() => ({
  examGlobal: typeof window.EXAM_POOL,
  practice: (window.SAMPLE_EXERCISES || []).length,
  examIds: (window.SAMPLE_EXERCISES || []).filter((e) => String(e.id).startsWith('x-')).length,
}));
ok('the page defines no exam pool', pool.examGlobal === 'undefined', pool.examGlobal);
ok('and the practice pool is still there', pool.practice > 0, pool.practice + ' exercises');
/* By id prefix rather than by counting: the exam questions are the `x-` ones,
   and one of them leaking into SAMPLE_EXERCISES is what a stray concat would
   look like. */
ok('no exam question reached the practice global', pool.examIds === 0, pool.examIds + ' found');

/* And the bundle, which is the copy that travels furthest — a single file
   somebody opens off a disk. If the exam bank were inlined there it would be
   the one form of this that cannot be fixed by a redeploy. */
const bundled = await readFile(new URL('../../portal-student.html', import.meta.url), 'utf8')
  .catch(() => '');
if (bundled) {
  ok('the single-file bundle carries no exam question',
    !bundled.includes('x-js-coercion-1') && !bundled.includes('EXAM_POOL'),
    bundled.length + ' bytes');
} else {
  console.log('  --    no portal-student.html to check; run tools/bundle/bundle.py first');
}
await b5.close();

console.log(failures ? `\n${failures} FAILURE(S)` : '\neverything passed');
process.exit(failures ? 1 : 0);
