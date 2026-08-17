/* ==========================================================================
   Global search.

   The magnifier button and `⌘K` had been in the bar since day one and both only
   led to the catalogue — a shortcut that promised search and delivered
   navigation. This module is what was missing for them to stop lying.

   WHY IT MATTERS MORE HERE THAN ON AN ORDINARY SITE: the catalogue is well
   past a hundred courses and a thousand lessons — the exact counts live in
   COURSES, which is the point: no comment here can stay true about them. The
   catalogue's field searches courses, and nothing else.
   Someone who remembers "that part about the DNS TTL" has no route to it at all
   — not through the menu, not through the graph, not through the rail.

   WHAT IT INDEXES, in order of decreasing usefulness:
     sections   — the grain people actually look for ("how to pick a CDN")
     lessons    — the catalogue topic
     courses    — name, summary, syllabus
     exercises  — the prompt
     notes      — what the student wrote themselves

   TWO DECISIONS THAT COME FROM DEFECTS ALREADY PAID FOR IN THIS PROJECT

   1. It matches against the DISPLAYED text and against the PORTUGUESE text at
      the same time. The catalogue is translated at runtime, so in an
      English-language browser the lesson title is "Hosting: shared, VPS, cloud
      and CDN" — but the sections, the notes and the exercises are in Portuguese.
      Indexing only one of the two would make half the content vanish from search
      depending on the language, which is exactly the defect that already bit the
      exercise join and the section matching.

   2. It ignores accents. Someone typing "coercao" wants to find "coerção", and
      on a phone people almost always type without accents.

   The group keys (`sections`, `lessons`, `courses`…) are English, like
   i18n keys for the group labels, and the key is the Portuguese text by design.
   ========================================================================== */

import { courseLessons, courseById } from './catalog.js';
import { lessonSections, lessonExercises } from './lessons.js';
import { allNotes } from './state.js';

/* lowercase and accent-free, on both sides of the comparison */
const fold = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');   // the combining marks, by code point

const plainText = (body) => (body || [])
  .map((b) => {
    if (Array.isArray(b)) return b.join(' ');
    if (b && typeof b === 'object') return b.text || '';
    return b;
  })
  .join(' ');

/* Section bodies are written with the minimal markup from `text.js` — backticks
   for code, ** for emphasis. It is interpreted when the section renders; in the
   search excerpt, which is plain text, it was left on screen as `**TTL**`. Strip
   it BEFORE deriving `raw` and `target`, or the two stop having the same length
   and the match index points at the wrong place. */
const stripMarkup = (s) => String(s || '').replace(/\*\*|`/g, '');

/* The index is expensive to build (1,503 lessons) and cheap to keep. It is
   cached and invalidated when something it indexes changes: language and
   notes. */
let index = null;
export const forgetIndex = () => { index = null; };

function buildIndex() {
  const items = [];
  /* `texts` is the BODY — the title goes in on its own, at the front, and
     `bodyFrom` marks where it ends. That is what stops the excerpt from
     repeating the title the result already shows above it: matching in the title
     now shows the start of the body, which is the new information. */
  const add = (group, title, sub, href, ...texts) => {
    // `raw` keeps the text as it reads; `target` is the folded version, for
    // matching. Without both, the excerpt would come out lowercase and unaccented.
    const head = stripMarkup(title);
    const raw = [head, ...texts.map(stripMarkup)].filter(Boolean).join(' ');
    items.push({ group, title, sub, href, raw, target: fold(raw), bodyAt: head.length + 1 });
  };

  COURSES.forEach((c) => {
    add('courses', c.name, c.category + ' · ' + c.hours + 'h', '#/course/' + c.id,
      c.summary, c.category, (c.syllabus || []).join(' '));

    const lessons = courseLessons(c.id);
    const hasContent = Boolean(window.LESSONS?.[c.id]);

    lessons.forEach((a) => {
      const sections = lessonSections(c.id, a.key);
      const first = '#/course/' + c.id + '/lesson/' + a.ix + '/' + sections[0].id;
      /* The translated title AND the join key: see the header of this file. In
         English — the source language — the two are the same string, and then
         the key stays out; repeated, it would become the result's excerpt. */
      add('lessons', a.title, c.name, first, a.key === a.title ? '' : a.key);

      /* A section only becomes a result where the content was written. In the 84
         courses with no text, the "section" is a wrapper with the same name as
         the lesson, and listing it would return every result twice. */
      if (hasContent) {
        sections.forEach((s) => {
          if (s.type !== 'content') return;
          add('sections', s.title, c.name + ' · ' + a.title,
            '#/course/' + c.id + '/lesson/' + a.ix + '/' + s.id,
            plainText(s.body));
        });
      }

      /* Only the prompt. The type was here once and left: nobody searches for
         "ordering", and as the item's body it became a one-word excerpt under
         every exercise. */
      lessonExercises(c.id, a.key).forEach((ex) => {
        add('exercises', ex.prompt, c.name + ' · ' + a.title,
          '#/course/' + c.id + '/lesson/' + a.ix + '/assessment');
      });
    });
  });

  allNotes().forEach((note) => {
    const c = courseById(note.courseId);
    const a = courseLessons(note.courseId)[note.lessonIx];
    if (!c || !a) return;
    add('notes', note.text, c.name + ' · ' + a.title,
      '#/course/' + note.courseId + '/lesson/' + note.lessonIx + '/' + note.sectionId);
  });

  return items;
}

const GROUPS = ['sections', 'lessons', 'courses', 'exercises', 'notes'];
export const GROUP_LABEL = {
  sections: 'sections', lessons: 'lessons', courses: 'courses', exercises: 'exercises', notes: 'your notes',
};

const PER_GROUP = 5;

export function search(term, { perGroup = PER_GROUP } = {}) {
  const q = fold(term).trim();
  if (q.length < 2) return [];
  if (!index) index = buildIndex();

  const hits = [];
  index.forEach((it) => {
    const at = it.target.indexOf(q);
    if (at < 0) return;
    /* Simple, explainable scoring: matching at the start of the title is worth
       more than matching in the middle of the body. No statistical relevance —
       at this volume it would cost more in surprise than it earns in order. */
    const inTitle = fold(it.title).indexOf(q);
    const weight = (inTitle === 0 ? 0 : (inTitle > 0 ? 1 : 2)) * 1000 + at;
    hits.push({ ...it, weight, at });
  });

  hits.sort((a, b) => a.weight - b.weight);

  const out = [];
  GROUPS.forEach((g) => {
    const ofGroup = hits.filter((a) => a.group === g).slice(0, perGroup);
    if (ofGroup.length) out.push({ group: g, items: ofGroup });
  });
  return out;
}

/* A piece of the text around the match, so the result shows context instead of
   just the title. Without this, five sections of the same course look like five
   indistinguishable rows. */
export function excerpt(item, term, width = 90) {
  const q = fold(term).trim();
  const bodyFrom = item.bodyAt || 0;
  if (bodyFrom >= item.raw.length) return '';   // no body: the title is already on screen

  /* Search from the body onwards. If the term only appears in the title, show
     the start of the body — repeating the title underneath it says nothing. */
  const inBody = item.target.indexOf(q, bodyFrom);
  const from = inBody < 0
    ? bodyFrom
    : Math.max(bodyFrom, inBody - Math.floor(width / 3));

  // both strings have the same length (folding does not change it), so the index
  // found in the folded one holds in the raw one
  const piece = item.raw.slice(from, from + width);
  return (from > bodyFrom ? '…' : '') + piece + (from + width < item.raw.length ? '…' : '');
}
