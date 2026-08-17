/* ==========================================================================
   Does the single-file portal actually open?

   THIS EXISTS BECAUSE NOTHING EVER OPENED IT. CI built `portal-student.html`
   on every pull request, uploaded it as an artifact, and never loaded it — so
   when app/main.js gained a top-level `await`, the bundler's guard missed it
   (it anchors at column 0; that `await` is indented inside a top-level `if`),
   the build reported success, and the file threw "Unexpected reserved word"
   before painting anything. Green for weeks, broken the whole time.

   A build that is never run is a build nobody is checking.

   FROM file:// AND NOT FROM A SERVER, because that is what this artifact is
   for: a copy handed to a student that opens with two clicks. Half the reasons
   the bundle exists — no fetches, no module graph, no CORS — only show up under
   that protocol. Serving it over HTTP would pass while the real thing failed.

   WHAT IT CHECKS
     it parses        no page error, which is what the missing guard let slip;
     it boots         the router puts a route in the hash — the same signal the
                      smoke suite waits for, and the one that separates "the
                      script ran" from "the application started";
     it is complete   the lesson content is inside the file. The served site
                      stopped shipping it, so this is the only artifact that
                      still carries it, and a bundle without it is the shell of
                      the thing the pricing page sells rather than the thing.

   It is deliberately NOT the smoke suite over again. That drives the whole
   portal against a served page and takes minutes; this answers one question in
   seconds, and it is the question nobody was asking.

     python3 tools/bundle/bundle.py
     node tools/bundle/boot.mjs
     CHROME=/path/to/chrome node tools/bundle/boot.mjs
   ========================================================================== */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const FILE = process.env.BUNDLE || path.join(ROOT, 'portal-student.html');
const CONTAINER_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CHROME = process.env.CHROME
  || (existsSync(CONTAINER_CHROME) ? CONTAINER_CHROME : undefined);

if (!existsSync(FILE)) {
  console.error('no bundle at ' + FILE + ' — run python3 tools/bundle/bundle.py first');
  process.exit(1);
}

let failures = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log((cond ? '  ok   ' : '  FAIL ') + ' ' + name + (extra ? ' — ' + extra : ''));
};

const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const p = await (await b.newContext()).newPage();

/* EVERY page error is collected, not just the first. A bundle that throws on
   boot usually throws more than once, and the first message is not always the
   one that names the cause. */
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
/* Console errors are NOT collected. Opened from file://, the page legitimately
   fails to reach the web fonts, and counting that as a failure would make this
   check fail for the one reason it is not about. */

console.log('\n== the single-file portal, from file:// ==');
await p.goto(pathToFileURL(FILE).href);

/* The router writing a route into the hash is the boot signal — the same one
   the smoke suite waits for. Waiting for a selector instead would pass on a
   page that painted its static shell and never started. */
let booted = true;
try {
  await p.waitForFunction(() => location.hash.length > 1, null, { timeout: 15000 });
} catch {
  booted = false;
}

ok('IT PARSES — no uncaught error', errors.length === 0, errors.slice(0, 3).join(' | '));
ok('it boots — the router chose a route', booted, await p.evaluate(() => location.hash));

/* The content is the point of this artifact. index.html stopped loading the
   lesson files, and tools/bundle/bundle.py reaches past it to inline them; if
   that ever stops working, this file becomes a portal with no lessons in it and
   nothing else would say so. */
const lessons = await p.evaluate(() => Object.keys(window.LESSONS || {}).length);
ok('it carries the lessons', lessons > 0, lessons + ' courses');

await b.close();

console.log(failures ? '\n' + failures + ' failed\n' : '\neverything passed\n');
process.exit(failures ? 1 : 0);
