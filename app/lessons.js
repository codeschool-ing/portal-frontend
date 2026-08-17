/* ==========================================================================
   What is inside a lesson: the sections and the exercises.

   This module owns the answer to "what is this lesson made of". It joins three
   sources with three different owners and one join key — the course plus the
   topic text in Portuguese:

     dados.js       the topic exists (catalogue, shared with the vitrine)
     lessons-*.js   the content sections (the portal's own)
     exercises      the assessment (from the pipeline)

   THE RULES IT APPLIES
   - A lesson with no written sections becomes ONE section. That way the portal
     behaves the same for the 85 courses that have not been written yet, and
     content lands course by course with no transition day where half the screen
     is broken.
   - The assessment is ALWAYS the last section of every lesson, whether it has
     exercises or not. The lesson's structure becomes predictable — content,
     content, …, assessment — and an empty assessment says what is coming
     instead of vanishing. It is the same principle as the reserved video frame
     on the vitrine: publishing one at a time does not rearrange anyone's screen.
   - The assessment is per TOPIC, not per section. That is what keeps `topico` as
     the join key with the pipeline — pushing the assessment down to section
     level would force a change to the format the tool emits, and it charges for
     the whole topic anyway.

   THE CONSEQUENCE OF THE ALWAYS-PRESENT ASSESSMENT, AND HOW IT IS HANDLED
   If an empty assessment counted towards progress, no course would ever reach
   100% while the exercises did not exist — and no certificate would ever be
   issued. So it is born with `countsTowardsProgress: false` and stays out of the
   denominator until it has exercises. The denominator grows when the content
   arrives, which is honest: the lesson really did gain more work inside it.
   ========================================================================== */

import {
  courseLessons,
} from './catalog.js';

/* How strong the pipeline's verification marks are, in order. `critiqued` went
   through probes and a judge; `execution` had its answer key confirmed by the
   interpreter; `structure` only passed the mechanical checks. */
const STRENGTH = { structure: 0, execution: 1, critiqued: 2 };

export function lessonExercises(courseId, key, { minimum = 'structure' } = {}) {
  return (window.SAMPLE_EXERCISES || []).filter(
    (e) => e.course === courseId
      && e.topic === key
      && STRENGTH[e._verification ?? 'structure'] >= STRENGTH[minimum],
  );
}

/* ---------- where the content comes from ----------

   `window.LESSONS` WAS THE ONLY SOURCE, loaded by four `<script>` tags in
   index.html, and that is what made the free plan unenforceable: GitHub Pages
   served every word of every course to anybody who asked, so the server could
   refuse to record progress on a paid course while publishing it. It also gave
   away "lessons to watch offline", which the pricing page sells.

   There are two sources now, and the bundle is the second one:

     the API      `GET /api/lessons` for the shape of every course, and
                  `GET /api/lessons/{courseId}` for one course's prose — the
                  request the paywall refuses;
     the bundle   `window.LESSONS`, still authored in assets/lessons-*.js and
                  still loaded by the OFFLINE build, which is a subscriber's
                  download rather than a public page.

   THE READERS BELOW STAY SYNCHRONOUS. About twenty call sites read sections to
   draw a rail, a step chip or a progress denominator, and a third of them are
   inside `state.js` where a percentage is computed. Making them async would
   have been a refactor of the whole portal in service of one fetch. The content
   lands in this store first — `putStructure`, `putCourse` — and everything
   reads it the way it always did.

   A COURSE NOT YET LOADED LOOKS LIKE A COURSE NOT YET WRITTEN, which is a state
   this portal has handled since the first day: 119 of 122 have nothing, and the
   rule below turns that into one placeholder section. A screen painted before
   its fetch lands is provisional rather than broken, and repaints when it
   arrives. */
const remote = { structure: null, courses: new Map(), lang: null };

/* The store holds ONE language at a time, and dropping it is how a language
   change reaches the lessons.

   It has to, because the server does the translating now. Before, the client
   held every language at once and swapped fields in place; a cache keyed by
   course alone was right then and is wrong now — switching to Portuguese would
   redraw the same English paragraphs, because the course was already "loaded".

   Returns whether anything was dropped, so the caller knows to re-read the
   structure as well: its section titles are translated too. */
export function forLanguage(lang) {
  if (remote.lang === lang) return false;
  remote.lang = lang;
  remote.structure = null;
  remote.courses.clear();
  return true;
}

/* The shape of every course, with no prose in it. It is not behind the paywall
   — see the server's Routes — because the portal needs it before it can draw a
   single progress bar: a percentage has a denominator, and the track map draws
   one per course. */
export function putStructure(courses) {
  remote.structure = new Map();
  for (const c of courses || []) remote.structure.set(c.courseId, c.lessons || []);
}

// One course's lessons WITH their prose, as the gated route answers them.
export function putCourse(courseId, lessons) {
  remote.courses.set(courseId, lessons || []);
}

/* Whether a course's prose has been asked for and answered. A screen asks
   before choosing between a spinner and a lock; it is not the same question as
   "does this course have content", which only the answer settles. */
export const courseLoaded = (courseId) => remote.courses.has(courseId);

/* The written sections of one lesson, from whichever source has them.

   THE ORDER IS DELIBERATE. A course whose prose has been fetched wins: it is
   the only source carrying bodies. The structure is next — it has the ids and
   the titles, so a rail is drawn correctly for a course nobody has opened.
   `window.LESSONS` is last and is normally absent; it exists in the offline
   build, where there is no server to ask.

   THE ASSESSMENT IS DROPPED HERE and re-appended below. The server stores it
   as a section like any other, because the snapshot exported it that way, but
   whether it counts depends on exercises this module already has an answer
   about — so keeping the rule in one place means taking the server's copy out
   rather than trusting two of them to agree. */
function writtenSections(courseId, key) {
  const ix = courseLessons(courseId).findIndex((a) => a.key === key);

  for (const source of [remote.courses.get(courseId), remote.structure?.get(courseId)]) {
    if (!source) continue;
    const lesson = source.find((l) => l.lessonIx === ix);
    /* A lesson the source knows and has nothing for is not the same as one it
       has never heard of. Only the second falls through to the next source. */
    if (lesson) return (lesson.sections || []).filter((s) => s.kind !== 'assessment');
  }
  return window.LESSONS?.[courseId]?.[key];
}

export function lessonSections(courseId, key) {
  const written = writtenSections(courseId, key);

  const sections = written?.length
    ? written.map((s) => ({ ...s, type: 'content' }))
    : [{ id: 'content', title: txt('Content'), type: 'content', body: null }];

  const exercises = lessonExercises(courseId, key);
  sections.push({
    id: 'assessment',
    title: txt('Assessment'),
    type: 'assessment',
    count: exercises.length,
    pending: exercises.length === 0,
    countsTowardsProgress: exercises.length > 0,
  });
  return sections;
}

/* The sections that count towards progress. An assessment with no exercises yet
   shows on screen, so the structure stays predictable, but stays out of the
   denominator — otherwise the course would never close. */
export const countableSections = (courseId, key) =>
  lessonSections(courseId, key).filter((s) => s.countsTowardsProgress !== false);

/* The lesson with its sections already resolved. This is what the screens
   consume. */
export function fullLesson(courseId, ix) {
  const a = courseLessons(courseId)[ix];
  if (!a) return null;
  return { ...a, sections: lessonSections(courseId, a.key) };
}

export const courseSections = (courseId) =>
  courseLessons(courseId).map((a) => lessonSections(courseId, a.key));

/* The total number of sections in a course — the denominator of every bit of
   progress in the portal. Counting lessons would measure it wrong: a lesson can
   have one section or six, and the bar would move in jumps that do not match
   the effort. */
export const sectionCount = (courseId) =>
  courseLessons(courseId).reduce((s, a) => s + countableSections(courseId, a.key).length, 0);

export const sectionIndex = (sections, sectionId) => {
  const i = sections.findIndex((s) => s.id === sectionId);
  return i < 0 ? 0 : i;
};

/* ---------- supplementary material ----------

   A section refers to material by KEY (`materials: ['wf-dns-cheatsheet']`), and the
   record with title, size and bytes lives in `window.MATERIALS`. Two reasons,
   and the second is the one that matters:

   1. The same PDF serves more than one section without being duplicated.
   2. The record is what changes when the file stops being a `data:` URI and
      becomes a signed URL from a bucket, in Stage 2. The section still says only
      the key — not one line of content has to be rewritten on that day.

   A key that is not in the registry is IGNORED, on purpose: material removed
   from the bucket must not take the whole lesson down with it. */
export const materialByKey = (key) => (window.MATERIALS || {})[key] || null;

export const sectionMaterials = (section) =>
  (section?.materials || []).map(materialByKey).filter(Boolean);

/* Every material in a course, without repeats — this is what the course page
   shows, for anyone who wants to download the lot instead of hunting section by
   section. */
export function courseMaterials(courseId) {
  const seen = new Set();
  const out = [];
  courseLessons(courseId).forEach((a, ix) => {
    lessonSections(courseId, a.key).forEach((s) => {
      (s.materials || []).forEach((key) => {
        if (seen.has(key)) return;
        const m = materialByKey(key);
        if (!m) return;
        seen.add(key);
        out.push({ ...m, key: key, lessonIx: ix, sectionId: s.id, lesson: a.title });
      });
    });
  });
  return out;
}
