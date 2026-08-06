/* ==========================================================================
   My notes — everything the student wrote, in one place.

   A note is the only thing in the portal that came neither from the catalogue
   nor from the pipeline: it belongs to the student. That is why it deserves a
   screen of its own instead of staying scattered across the sections where it
   was written — when it is time to revise, nobody remembers which section they
   noted what in.

   They also show up in the global search, under the "your notes" group.
   ========================================================================== */

import { courseLessons, courseById } from '../catalog.js';
import { lessonSections } from '../lessons.js';
import { allNotes } from '../state.js';
import { empty } from './common.js';
import { esc } from '../text.js';

export default async function notes() {
  const list = allNotes();
  if (!list.length) {
    return {
      title: txt('Notes'),
      el: empty(txt('You have not written any notes yet. They live at the end of each section.')),
    };
  }

  /* Grouped by course: that is how you look for a note — "the thing I wrote in
     HTML and CSS" — not by date. */
  const byCourse = {};
  list.forEach((n) => { (byCourse[n.courseId] = byCourse[n.courseId] || []).push(n); });

  const el = document.createElement('div');
  el.className = 'view screen-notes';
  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + txt('Your notes') + '</h1>' +
      '<p>' + list.length + ' ' + (list.length === 1 ? txt('score') : txt('notes')) + '</p>' +
    '</header>' +
    Object.entries(byCourse).map(([courseId, ofCourse]) => {
      const c = courseById(courseId);
      const lessons = courseLessons(courseId);
      return '<section class="block">' +
        '<div class="block-top">' +
          '<h2>' + esc(c ? c.name : courseId) + '</h2>' +
          '<a class="block-link" href="#/course/' + esc(courseId) + '">' + txt('open the course') + ' →</a>' +
        '</div>' +
        ofCourse.map((n) => {
          const a = lessons[n.lessonIx];
          const s = a && lessonSections(courseId, a.key).find((x) => x.id === n.sectionId);
          return '<article class="note-item">' +
            '<a class="note-where" href="#/course/' + esc(courseId) + '/lesson/' + n.lessonIx + '/' + esc(n.sectionId) + '">' +
              (a ? esc(a.title) : '') + (s ? ' · ' + esc(s.title) : '') + ' →' +
            '</a>' +
            '<p class="note-text">' + esc(n.text) + '</p>' +
          '</article>';
        }).join('') +
      '</section>';
    }).join('');

  return { title: txt('Notes'), el };
}
