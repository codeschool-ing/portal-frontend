#!/usr/bin/env node
/* ==========================================================================
   The snapshot codeschool-ing/portal-backend's `ingest` takes.

       node tools/snapshot/snapshot.js > snapshot.json
       ingest -file snapshot.json          # in portal-backend

   WHY IT LIVES HERE and not in the showcase, which used to produce one.
   `ingest` takes ONE file and prunes whatever is not in it, so two exporters
   producing two files would each delete the other's rows. Only one repository
   can produce it, and it has to be the one holding every part:

     catalogue and topics    both have it
     the four translations   both have it
     THE SECTIONS            only here

   Sections are authored content — assets/lessons-*.js — and the showcase has
   none. Its exporter emitted courses and lessons and no sections at all, which
   left the mirror unable to validate a single one: `progress` checks every
   write against it, so every write was refused. That is the gap this closes.

   IT DOES NOT REIMPLEMENT THE SECTION RULE. It imports app/lessons.js and calls
   the same `lessonSections()` the portal calls. The rule is small — the
   authored sections, or one synthesised `content`, and always an `assessment`
   — and small is exactly what makes a second copy tempting and lethal: the
   section ids here have to be the ids the portal writes, and a copy that drifted
   by one id would have every write for that lesson refused, with nothing on
   either side saying why.

   `countable` follows the same rule for the same reason: an assessment with no
   exercises published is shown so the student sees what is coming, and counting
   it would report a percentage that can never reach 100.
   ========================================================================== */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LANGUAGES = ['pt', 'es', 'fr', 'it'];

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

/* The asset files are browser scripts: they assign to globals rather than
   export. Running them in a scope that provides those globals is how the page
   loads them too, which is what keeps this from drifting from what a student
   gets. `txt` is the i18n runtime's, and here it is the identity function —
   English is the source language, and the snapshot carries the source. */
function loadBrowserGlobals() {
  globalThis.window = { I18N: {} };
  globalThis.txt = (s) => s;

  const assets = readdirSync(join(ROOT, 'assets'));
  const scripts = [
    'catalog.js',
    'i18n.js',
    'materials.js',
    'plans.js',
    ...assets.filter((f) => f.startsWith('i18n-courses-')),
    ...assets.filter((f) => f.startsWith('lessons-') && f !== 'lessons-pt.js'),
    ...assets.filter((f) => f.startsWith('exercises-') && f !== 'exercises-pt.js'),
  ];
  for (const f of scripts) {
    // eslint-disable-next-line no-new-func
    new Function(read('assets/' + f))();
  }

  /* The catalogue defines COURSES and TRACKS as top-level consts, which the
     Function scope above does not leak. Read them separately, the same way
     app/catalog.js sees them: as globals. */
  const scope = {};
  // eslint-disable-next-line no-new-func
  new Function('g', read('assets/catalog.js') + ';g.COURSES = COURSES; g.TRACKS = TRACKS;')(scope);
  globalThis.COURSES = scope.COURSES;
  globalThis.TRACKS = scope.TRACKS;
  return scope;
}

const { COURSES } = loadBrowserGlobals();

/* Imported, not copied. See the note at the top: a second implementation of the
   section rule is a second set of section ids, and the day they differ every
   write for that lesson is refused. */
const { lessonSections, lessonExercises } = await import(
  pathToFileURL(join(ROOT, 'app', 'lessons.js')).href
);

/* ---- translations ----------------------------------------------------------
   English is the source and lives in the row, so it is deliberately absent
   here: the server refuses a snapshot claiming to translate into it. */
function courseTranslations(id) {
  const out = {};
  for (const lang of LANGUAGES) {
    const t = window.I18N[lang]?.courses?.[id];
    if (t?.name) out[lang] = { title: t.name };
  }
  return Object.keys(out).length ? out : undefined;
}

/* Topic titles are matched by POSITION in the catalogue's own list, because the
   join key is the English title exactly as assets/catalog.js spells it. One
   line out of step would give every lesson its neighbour's title, so a
   dictionary that has drifted stops the export rather than writing that. */
function lessonTranslations(id, ix, problems) {
  const out = {};
  for (const lang of LANGUAGES) {
    const t = window.I18N[lang]?.courses?.[id];
    if (!t) { problems.push(`${id}: no ${lang} entry`); continue; }
    const topics = t.topics || [];
    const course = COURSES.find((c) => c.id === id);
    if (topics.length !== course.topics.length) {
      if (ix === 0) {
        problems.push(`${id}: the ${lang} dictionary lists ${topics.length} topics, ` +
          `the catalogue lists ${course.topics.length}`);
      }
      continue;
    }
    if (topics[ix]) out[lang] = { title: topics[ix] };
  }
  return Object.keys(out).length ? out : undefined;
}

/* ---- the snapshot -------------------------------------------------------- */
const problems = [];

const courses = COURSES.map((c) => ({
  id: c.id,
  title: c.name,
  hours: c.hours ?? null,
  category: c.category ?? null,
  translations: courseTranslations(c.id),
  lessons: c.topics.map((topic, ix) => {
    const sections = lessonSections(c.id, topic);
    return {
      topic,
      title: topic,
      translations: lessonTranslations(c.id, ix, problems),
      sections: sections.map((s) => ({
        id: s.id,
        kind: s.type === 'assessment' ? 'assessment' : 'content',
        /* An assessment with nothing published is shown and not counted. The
           portal decides that with `countsTowardsProgress`; the mirror calls it
           `countable`, and they have to agree or every percentage is wrong. */
        countable: s.type === 'assessment'
          ? lessonExercises(c.id, topic).length > 0
          : true,
      })),
    };
  }),
}));

const materials = Object.entries(window.MATERIALS || {}).map(([key, m]) => ({
  key,
  title: m.title || key,
  kind: m.kind || 'link',
  bytes: typeof m.bytes === 'number' ? m.bytes : null,
  objectKey: m.objectKey ?? null,
}));

/* What `ingest` refuses, refused here — where the message can name the course
   and the topic instead of arriving as a constraint violation, and where it
   costs a re-run instead of a half-applied mirror. */
for (const c of courses) {
  const seenTopic = new Map();
  c.lessons.forEach((l, ix) => {
    if (!l.topic) problems.push(`${c.id}: lesson ${ix} has no topic title — it is the join key`);
    if (seenTopic.has(l.topic)) {
      problems.push(`${c.id} lists the topic ${JSON.stringify(l.topic)} twice, at ` +
        `${seenTopic.get(l.topic)} and ${ix}; the topic title is the join key`);
    }
    seenTopic.set(l.topic, ix);

    const seenSection = new Set();
    for (const sec of l.sections) {
      if (!sec.id) problems.push(`${c.id}/${ix}: a section has no id`);
      if (seenSection.has(sec.id)) {
        problems.push(`${c.id}/${ix} lists the section ${JSON.stringify(sec.id)} twice`);
      }
      seenSection.add(sec.id);
    }
    /* Every lesson ends with the assessment, published or not — the portal's
       rule, and the reason the rail always shows one. A lesson without it means
       the rule changed on one side only, and the student's last section would
       be a place the server has never heard of. */
    if (l.sections.filter((sec) => sec.kind === 'assessment').length !== 1) {
      problems.push(`${c.id}/${ix} has ${l.sections.filter((sec) => sec.kind === 'assessment').length} ` +
        'assessment sections; every lesson has exactly one');
    }
  });
}

const ids = new Set();
for (const c of courses) {
  if (ids.has(c.id)) problems.push(`the course ${c.id} appears twice`);
  ids.add(c.id);
}

if (problems.length) {
  console.error('snapshot: refusing to export.\n  ' + problems.join('\n  '));
  process.exit(1);
}

process.stdout.write(JSON.stringify({ courses, materials }, null, 2) + '\n');
