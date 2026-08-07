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

/* ---- exercises -------------------------------------------------------------
   EXPORTED WHOLE, answer key included, and that is not an oversight. The server
   splits every exercise into what an exam may see and what it may not, and it
   does that on ITS side on purpose: an exporter that got the split wrong would
   write `correct` into the public projection and nothing on the server would
   notice. The secret belongs to whoever keeps it.

   So this is exactly what is authored. It is also exactly what the browser
   downloads today — which is the problem `internal/exercises` exists to fix,
   and the fix is the server withholding fields during an exam, not this tool
   withholding them from the server.

   `_verification` travels with it: it is the publication floor, and the server
   indexes on it so `?minimum=` can filter without opening the JSON.

   ONE FLAT LIST rather than nested inside the lessons, because that is the shape
   `ingest` prunes by — the file is the whole set, and an exercise it stopped
   carrying is one that was withdrawn. Each row names its own course and topic,
   which is the same join key the sections use.

   Collected through `lessonExercises` for the reason at the top of this file:
   which exercises belong to a lesson is a rule, and a second copy of it here
   would be a second answer to the same question. */
const exercises = [];
for (const c of COURSES) {
  for (const topic of c.topics) {
    for (const ex of lessonExercises(c.id, topic)) {
      exercises.push({ ...ex, _pool: 'practice' });
    }
  }
}

/* ---- and the exam pool, which the page does not load ------------------------

   THE POOL IS A PROPERTY OF WHICH FILE AN EXERCISE IS IN, and it is stamped
   here rather than authored. A `_pool` field would be one typo away from putting
   a question whose answer key already shipped inside index.html onto a paper —
   the exact failure the two pools exist to make impossible — so the page-loaded
   files may not carry the field at all, and this refuses the export if one does.

   Everything above came out of `window.SAMPLE_EXERCISES`, which the page defines
   in four `<script>` tags. `assets/exam-pool.js` defines `window.EXAM_POOL`, is
   in no `<script>` tag, and is read from disk right here — so its answer keys
   exist in this process, in the snapshot, and in the server's `sealed` column,
   and nowhere a browser can reach. */
for (const ex of exercises) {
  if ('_pool' in ex && ex._pool !== 'practice') {
    problems.push(`${ex.id} declares a _pool, but it is in a file the page loads: its key has already shipped`);
  }
}

/* The one line that has to keep being true. If somebody adds the script tag —
   to "fix" an exam that looks empty in the portal, say — every answer key in the
   exam pool ships to every visitor, and nothing else in this repository would
   notice. It is checked here because this is the tool that has both files open. */
if (/exam-pool\.js/.test(read('index.html'))) {
  console.error('snapshot: refusing to export.\n  ' +
    'index.html references assets/exam-pool.js. That file is the exam bank, ' +
    'answer keys included, and the page must never load it.');
  process.exit(1);
}

globalThis.window.EXAM_POOL = undefined;
// eslint-disable-next-line no-new-func
new Function('w', read('assets/exam-pool.js') + ';w.EXAM_POOL = window.EXAM_POOL;')(globalThis.window);
for (const ex of globalThis.window.EXAM_POOL || []) {
  exercises.push({ ...ex, _pool: 'exam' });
}

/* ---- tracks ----------------------------------------------------------------
   The server needs these to assemble a TRACK EXAM. The paper is drawn from the
   exercises of the track's courses, and if the client said which courses those
   were, a student could sit a "track exam" drawn from one easy course — the
   whole point of the draw moving server-side is that it is not the client's.

   FLATTENED INTO ONE SHAPE. The catalogue authors a step as either a course id
   or `{choice, note, options:[{name, courses}]}`; here every step is
   `{isChoice, options:[[courseId]]}`, so a plain course is one option of one
   course. A union type costs the server more than a boolean and an index, and
   the note and the option names are copy the server never renders.

   THE OPTION ORDER IS A CONTRACT. `activeOption(trackId, stepIx)` in the portal
   stores an INDEX in the student's browser, and the server checks a requested
   option against the ones declared here. Reordering the options of a step
   reassigns everyone's choice — silently, to a neighbouring path. */
const tracks = TRACKS.map((t) => ({
  id: t.id,
  title: t.name,
  family: t.family,
  steps: t.courses.map((item) => (typeof item === 'string'
    ? { isChoice: false, options: [[item]] }
    : { isChoice: true, options: item.options.map((o) => o.courses.slice()) })),
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

/* The exercise id is the join key of every answer a student has already given —
   `progress[course].lessons[ix].exercises[exId]` in their browser, and a row
   keyed by the same string on the server. Two exercises sharing one would merge
   two students' histories into one record and neither side would say so. */
const exerciseIds = new Set();
for (const ex of exercises) {
  if (!ex.id) {
    problems.push(`an exercise of ${ex.course}/${ex.topic} has no id; the id is what answers point at`);
    continue;
  }
  if (exerciseIds.has(ex.id)) problems.push(`the exercise ${ex.id} appears twice`);
  exerciseIds.add(ex.id);
}

/* An exercise whose topic is in no course attaches to no lesson, and `ingest`
   refuses the whole file for it. Catching it here names the exercise. */
const topics = new Map(COURSES.map((c) => [c.id, new Set(c.topics)]));
for (const ex of exercises) {
  if (!topics.get(ex.course)?.has(ex.topic)) {
    problems.push(`${ex.id} names ${ex.course}/${JSON.stringify(ex.topic)}, which is in no lesson`);
  }
}

if (problems.length) {
  console.error('snapshot: refusing to export.\n  ' + problems.join('\n  '));
  process.exit(1);
}

/* A track naming a course that is not in the catalogue arrives at `ingest` as a
   foreign-key violation; here it names the track and the course. */
const courseIds = new Set(COURSES.map((c) => c.id));
for (const t of tracks) {
  if (!t.steps.length) problems.push(`the track ${t.id} has no steps`);
  t.steps.forEach((step, ix) => {
    if (!step.options.length) problems.push(`${t.id} step ${ix} offers nothing`);
    step.options.forEach((option, optIx) => {
      if (!option.length) problems.push(`${t.id} step ${ix} option ${optIx} has no courses`);
      for (const id of option) {
        if (!courseIds.has(id)) problems.push(`${t.id} names the course ${id}, which is not in the catalogue`);
      }
    });
  });
}

process.stdout.write(JSON.stringify({ courses, tracks, exercises, materials }, null, 2) + '\n');
