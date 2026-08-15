/* ==========================================================================
   Check that everything the portal shows can change language.

   WHY A TOOL AND NOT A GREP. `txt()` returns its argument when the dictionary
   has no entry, which is the right runtime behaviour — a missing translation
   shows English instead of breaking the screen — and the worst possible
   failure mode for a check: nothing throws, nothing logs, the string is simply
   in the wrong language. The only way to see it is to ask the dictionaries.

   THE HOLE THIS EXISTS TO CLOSE. Half of the call sites do not pass a literal:
   they pass `ex.type`, `c.category`, `STATE_LABEL[st]`. A checker that reads
   only literals reports a clean sweep while a third of the interface is stuck
   in English — which is exactly what happened. So this reads three sources:

     1. every string literal inside a txt() call, including the ones inside a
        ternary or after a `||`;
     2. the static text of index.html, which the runtime translates node by
        node — minus the containers listed in window.I18N_DYNAMIC, which
        rebuild themselves;
     3. the VOCABULARIES that reach txt() as data — course categories and
        levels from the catalogue, exercise types and difficulties from the
        exercise files, and the label maps declared in the code.

   AND IT REFUSES TO GO STALE. Every txt() call that does not pass a literal
   has to name an expression this file knows about (ACCOUNTED, below). A new
   one fails the check rather than quietly widening the hole again.

       node tools/i18n/check.mjs
   ========================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LANGS = ['pt', 'es', 'fr', 'it'];   // en is the source and needs no dictionary

/* txt() arguments that are not a literal and are covered by a vocabulary
   below. Only VALUE positions land here: a ternary picking between two
   literals is checked through its literals and needs no entry, because both
   branches are already known. The comment on each says which vocabulary
   supplies it, since that pairing is the whole claim this file makes. */
const ACCOUNTED = new Set([
  'l.label',                      // rail.js LINKS
  'ex.type', 'r.ex.type', 'k',    // exercise types (and performance.js groups by them)
  'ex.difficulty',                // exercise difficulties
  'c.level', 'model.level',
  'course.level',                 // course levels
  'c.category',                   // course categories
  'label',                        // certificate kinds, from `label:` below
  'f.label',                      // password-strength verdicts, from `label:` below
  'features[k]',                  // plans.js feature names
  'p.cycle', 'plan?.cycle',       // plan billing cycles
  'r',                            // graph.js legend
  'STATE_LABEL[st]', 'GROUP_LABEL[g.group]', 'OP_NAME[ex.checkOperation]',
]);

/* The value positions of a txt() argument: what could actually be handed to
   the dictionary. `a ? x : y` offers x and y, `a || b` offers both, an inline
   map indexed by a variable offers its values. Everything else is a leaf. */
function valuePositions(arg) {
  const s = arg.trim();

  const map = s.match(/^\{([\s\S]*)\}\s*\[[\s\S]+\]$/);
  if (map) return [...map[1].matchAll(/:\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)].map((m) => m[1]);

  const split = (str, ops) => {
    const parts = [];
    let depth = 0, last = 0, inStr = null;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inStr) { if (ch === '\\') i++; else if (ch === inStr) inStr = null; continue; }
      if (ch === '\'' || ch === '"' || ch === '`') { inStr = ch; continue; }
      if ('([{'.includes(ch)) depth++;
      else if (')]}'.includes(ch)) depth--;
      else if (!depth) for (const op of ops) {
        if (str.startsWith(op, i)) { parts.push(str.slice(last, i)); last = i + op.length; i += op.length - 1; break; }
      }
    }
    parts.push(str.slice(last));
    return parts.length > 1 ? parts : null;
  };

  const or = split(s, ['||', '??']);
  if (or) return or.flatMap(valuePositions);

  const tern = split(s, ['?']);
  if (tern && tern.length === 2) {
    const branches = split(tern[1], [':']);
    if (branches) return branches.flatMap(valuePositions);
  }
  return [s];
}

const isLiteral = (s) => /^(['"])(?:\\.|(?!\1)[^\\])*\1$/.test(s.trim());

/* ---- the dictionaries ---------------------------------------------------- */
globalThis.window = { I18N: {} };
for (const f of ['assets/i18n.js', 'assets/i18n-pt.js']) {
  new Function(fs.readFileSync(path.join(ROOT, f), 'utf8'))();
}
const ui = Object.fromEntries(LANGS.map((l) => [l, (window.I18N[l] && window.I18N[l].ui) || {}]));

/* ---- 1. every literal inside a txt() call --------------------------------- */
function jsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? jsFiles(p) : (e.name.endsWith('.js') ? [p] : []);
  });
}

/* The brand is the brand in every language. It is spelled out rather than
   pattern-matched, so a new untranslated string cannot slip in beside it. */
const BRAND = new Set(['codeschool', 'codeschool.ing', 'ing']);

const wanted = new Map();       // key -> where it came from
const unaccounted = [];
const want = (k, where) => { if (k && !BRAND.has(k) && !wanted.has(k)) wanted.set(k, where); };

for (const file of jsFiles(path.join(ROOT, 'app'))) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  for (let i = src.indexOf('txt('); i !== -1; i = src.indexOf('txt(', i + 1)) {
    if (/[\w$.]/.test(src[i - 1] || '')) continue;              // someone else's txt
    // Walk to the matching close paren, so a ternary or a `||` comes in whole.
    let depth = 0, end = i + 3;
    for (; end < src.length; end++) {
      if (src[end] === '(') depth++;
      else if (src[end] === ')') { depth--; if (!depth) break; }
    }
    const arg = src.slice(i + 4, end).trim();
    const line = src.slice(0, i).split('\n').length;

    for (const v of valuePositions(arg)) {
      const one = v.trim().replace(/\s+/g, ' ');
      if (isLiteral(one)) {
        want(one.slice(1, -1).replace(/\\(['"])/g, '$1'), `${rel}:${line}`);
      } else if (!ACCOUNTED.has(one)) {
        unaccounted.push(`${rel}:${line}  ${one.slice(0, 80)}`);
      }
    }
  }
}

/* ---- 2. the static text of index.html ------------------------------------ */
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dyn = (html.match(/window\.I18N_DYNAMIC\s*=\s*\[([^\]]*)\]/) || [, ''])[1]
    .split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

  let body = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  for (const sel of dyn) {
    if (!sel.startsWith('#')) continue;
    body = body.replace(new RegExp(`<(\\w+)[^>]*id="${sel.slice(1)}"[\\s\\S]*?</\\1>`, 'g'), '');
  }
  for (const m of body.matchAll(/>([^<>]+)</g)) {
    const s = m[1].trim();
    if (s.length > 2 && /[A-Za-zÀ-ÿ]/.test(s)) want(s, 'index.html');
  }
  for (const attr of ['aria-label', 'placeholder', 'title']) {
    for (const m of body.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) {
      const s = m[1].trim();
      if (s.length > 2 && /[A-Za-zÀ-ÿ]/.test(s)) want(s, `index.html (${attr})`);
    }
  }
}

/* ---- 3. the vocabularies that reach txt() as data ------------------------- */
{
  const g = {};
  new Function('g', fs.readFileSync(path.join(ROOT, 'assets/catalog.js'), 'utf8') +
    ';g.C = COURSES; g.T = TRACKS;')(g);
  for (const c of g.C) {
    want(c.category, 'catalog.js (category)');
    want(c.level, 'catalog.js (level)');
  }

  const w = {};
  globalThis.window = w;
  for (const f of fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => f.startsWith('exercises-'))) {
    try { new Function(fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8'))(); } catch { /* pt overlay */ }
  }
  for (const ex of w.SAMPLE_EXERCISES || []) {
    want(ex.type, 'exercises (type)');
    want(ex.difficulty, 'exercises (difficulty)');
  }
  globalThis.window = { I18N: window.I18N };

  // The label maps: a `const NAME = { key: 'value' }` whose values are what
  // txt() receives. Read from the source, so adding a state or a group does
  // not need this file edited.
  const maps = [
    ['app/graph.js', 'STATE_LABEL'],
    ['app/search.js', 'GROUP_LABEL'],
    ['app/exercises/expression-answer.js', 'OP_NAME'],
  ];
  for (const [file, name] of maps) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const m = src.match(new RegExp(`const ${name}\\s*=\\s*\\{([\\s\\S]*?)\\}`));
    if (!m) { unaccounted.push(`${file}: ${name} is registered here but no longer declared there`); continue; }
    for (const v of m[1].matchAll(/:\s*'((?:\\.|[^'\\])*)'/g)) want(v[1], `${file} ${name}`);
  }
  for (const [file, name] of [['app/rail.js', 'LINKS']]) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const m = src.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
    if (!m) { unaccounted.push(`${file}: ${name} is registered here but no longer declared there`); continue; }
    for (const v of m[1].matchAll(/label:\s*'((?:\\.|[^'\\])*)'/g)) want(v[1], `${file} ${name}`);
  }
  // `label:` and `cycle:` are the two field names whose values are handed to
  // txt() as data — a certificate kind, a password-strength verdict, a billing
  // cycle. Scanned across the whole app rather than in a list of files, so a
  // third place that sets one is covered the day it is written.
  for (const file of [...jsFiles(path.join(ROOT, 'app')), path.join(ROOT, 'assets/plans.js')]) {
    const rel = path.relative(ROOT, file);
    const src = fs.readFileSync(file, 'utf8');
    for (const v of src.matchAll(/\b(?:label|cycle):\s*'((?:\\.|[^'\\])*)'/g)) want(v[1], rel);
  }
}

/* ---- report -------------------------------------------------------------- */
let failed = false;

if (unaccounted.length) {
  failed = true;
  console.log('txt() calls this check cannot follow:\n');
  for (const u of unaccounted) console.log('  ' + u);
  console.log('\n  Add the expression to ACCOUNTED in this file, and a vocabulary that\n' +
    '  supplies its values — otherwise those strings are unchecked.\n');
}

const missing = Object.fromEntries(LANGS.map((l) => [l, []]));
for (const [k, where] of wanted) {
  for (const l of LANGS) if (!(k in ui[l])) missing[l].push([k, where]);
}
const total = LANGS.reduce((n, l) => n + missing[l].length, 0);

if (total) {
  failed = true;
  const all = [...wanted.keys()].filter((k) => LANGS.every((l) => !(k in ui[l])));
  console.log(`${wanted.size} strings reach the interface; ${total} entries are missing.\n`);
  console.log(`Missing in every language (${all.length}):`);
  for (const k of all.sort()) console.log(`  ${JSON.stringify(k)}   ${wanted.get(k)}`);
  for (const l of LANGS) {
    const only = missing[l].filter(([k]) => !all.includes(k));
    if (!only.length) continue;
    console.log(`\nMissing in ${l} only (${only.length}):`);
    for (const [k, where] of only.sort()) console.log(`  ${JSON.stringify(k)}   ${where}`);
  }
} else if (!unaccounted.length) {
  console.log(`OK — all ${wanted.size} interface strings have an entry in pt, es, fr and it`);
}

process.exit(failed ? 1 : 0);
