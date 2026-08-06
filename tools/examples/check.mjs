/* ==========================================================================
   Checks the `example` blocks in the content.

   It assembles each block's program — concatenating the `partes[].codigo` in
   order — runs it in a real Node and compares against the `saida` written in the
   content.

   WHY THIS EXISTS. The `example` block is the Go By Example format: a continuous
   program with the explanation of each snippet beside it. A program with invented
   output is worse than no example at all — it teaches the wrong thing with the
   authority of someone who showed the result, and the student only finds out when
   they paste it into their own console.

   On its first run it caught two real defects in the JavaScript course, neither
   of which would show up by reading the text:

     · the arrow-functions example BLEW UP halfway through (`this.n` with `this`
       undefined in an ES module), and the written output listed lines from two
       `console.log` calls that were not even in the program;
     · the `this` example aborted at the `TypeError` and never reached the third
       line, which was precisely the lesson.

   Run it with:
       node tools/examples/check.mjs                      # every course
       node tools/examples/check.mjs assets/lessons-javascript.js

   CARE WHEN EXTENDING IT: only examples in a language Node runs are checked. A
   CSS or HTML `example` has no program output and is skipped — that is not a
   failure, it is the absence of a question.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const RUNNABLE = new Set(['javascript', 'js', 'node']);

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(join(ROOT, 'assets'))
    .filter((f) => f.startsWith('lessons-') && f.endsWith('.js'))
    .map((f) => join(ROOT, 'assets', f));

const fakeWindow = {};
files.forEach((f) => {
  // the content files are classic scripts that write onto `window`
  new Function('window', readFileSync(f, 'utf8'))(fakeWindow);
});

const dir = mkdtempSync(join(tmpdir(), 'examples-'));
let checked = 0;
let skipped = 0;
let failures = 0;

for (const course of Object.keys(fakeWindow.LESSONS || {})) {
  for (const topic of Object.keys(fakeWindow.LESSONS[course])) {
    for (const section of fakeWindow.LESSONS[course][topic]) {
      (section.body || []).forEach((block, i) => {
        const ex = block?.example;
        if (!ex) return;
        const where = `${course}/${section.id}[${i}]`;

        if (!RUNNABLE.has(ex.language)) { skipped += 1; return; }
        if (!ex.output) {
          /* A runnable example with no `saida` is a gap, not a choice: the
             reader is left not knowing what the program does, and the checker is
             left with nothing to compare. */
          console.log(`  NO OUTPUT  ${where}`);
          failures += 1;
          return;
        }

        const target = join(dir, 'program.mjs');
        writeFileSync(target, ex.parts.map((p) => p.code).join('\n'));
        let actual;
        try {
          actual = execFileSync(process.execPath, [target], { encoding: 'utf8', stdio: 'pipe' });
        } catch (e) {
          // a program that blows up is still a result: compare what came out
          actual = (e.stdout || '') + (e.stderr || '');
        }
        actual = actual.trim();
        const expected = String(ex.output).trim();
        checked += 1;

        if (actual === expected) { console.log(`  ok         ${where}`); return; }
        failures += 1;
        console.log(`  DIFFERS    ${where}`);
        console.log(`    written: ${JSON.stringify(expected)}`);
        console.log(`    actual : ${JSON.stringify(actual)}`);
      });
    }
  }
}

console.log(`\n${checked} examples run, ${skipped} skipped (language is not executed)`);
console.log(failures ? `${failures} FAILURE(S)` : 'every output matches');
process.exit(failures ? 1 : 0);
