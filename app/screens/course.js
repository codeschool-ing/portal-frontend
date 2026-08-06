/* ==========================================================================
   Course — the syllabus the vitrine shows, plus the list of lessons.

   LESSON = TOPIC. The catalogue has no concept of a lesson; the finest grain is
   `topicos`, and the pipeline's exercises are already indexed by the topic text.
   Inventing a third key here would create a mapping to keep in sync with two
   ends that already agree with each other.
   ========================================================================== */

import { courseLessons, courseById, tracksWithCourse, unlockedBy } from '../catalog.js';
import { lessonSections, courseMaterials } from '../lessons.js';
import { courseProgress, lessonProgress, lessonDone } from '../state.js';
import { courseState } from '../graph.js';
import { courseExam } from '../exams.js';
import { examCard } from './exam.js';
import { materialList } from '../materials.js';
import { bar, empty } from './common.js';
import { esc, formatted } from '../text.js';

export default async function course({ id }) {
  const c = courseById(id);
  if (!c) return { title: txt('Course'), el: empty(txt('Course not found.')) };

  const lessons = courseLessons(id);
  const p = courseProgress(id);
  const st = courseState(id);
  const opens = unlockedBy(id);
  const exam = courseExam(id);
  const materials = courseMaterials(id);

  const el = document.createElement('div');
  el.className = 'view tela-curso';

  el.innerHTML =
    '<header class="course-head">' +
      '<span class="node-state" data-state="' + st + '">' + txt({
        done: 'completed', current: 'in progress', available: 'available', ahead: 'further ahead',
      }[st]) + '</span>' +
      '<h1>' + esc(c.name) + '</h1>' +
      '<p class="course-summary">' + esc(c.summary) + '</p>' +
      '<div class="course-meta">' +
        '<span>' + c.hours + 'h</span>' +
        '<span>' + txt(c.level) + '</span>' +
        '<span>' + lessons.length + ' ' + txt('lessons') + '</span>' +
        '<span>' + txt('in') + ' ' + tracksWithCourse(id).length + ' ' + txt('tracks') + '</span>' +
      '</div>' +
      bar(p.pct, p.feitas + ' de ' + p.total) +
      '<p class="course-count">' + p.feitas + '/' + p.total + ' ' + txt('sections completed') + '</p>' +
    '</header>' +

    '<div class="course-cols">' +
      /* The main column is ONE child of the grid, not two: the exam lives inside
         it, below the lessons. Loose, it became a second column and pushed the
         sidebar down to the next row. */
      '<div class="course-main">' +
      '<section class="block">' +
        '<div class="block-top"><h2>' + txt('Lessons') + '</h2></div>' +
        '<ol class="lessons">' +
          lessons.map((a) => {
            const done = lessonDone(id, a.ix);
            const sections = lessonSections(id, a.key);
            const pa = lessonProgress(id, a.ix);
            const hasAssessment = sections.some((s) => s.type === 'assessment');
            return '<li><a class="lesson-row' + (done ? ' done' : '') + '" ' +
              'href="#/course/' + esc(id) + '/lesson/' + a.ix + '/' + esc(sections[0].id) + '">' +
              '<span class="lesson-mark" aria-hidden="true">' + (done ? '✓' : '') + '</span>' +
              '<span class="lesson-num">' + String(a.ix + 1).padStart(2, '0') + '</span>' +
              '<span class="lesson-tit">' + esc(a.title) + '</span>' +
              '<span class="lesson-sections">' +
                (sections.length > 1 ? sections.length + ' ' + txt('sections') : txt('1 section')) +
                (hasAssessment ? ' · ' + txt('with an assessment') : '') +
              '</span>' +
              '<span class="lesson-prog">' + pa.feitas + '/' + pa.total + '</span>' +
            '</a></li>';
          }).join('') +
        '</ol>' +
      '</section>' +

      /* The exam closes the lesson column, not the sidebar: it is the last step
         of the course, and its place is after the last lesson. */
      (exam.items.length
        ? examCard({
          key: exam.key, href: '#/course/' + esc(id) + '/exam', scope: 'course',
          count: exam.items.length, progress: p.pct,
        })
        : '') +
      '</div>' +

      '<aside class="course-side">' +
        (materials.length
          ? '<section class="block">' + materialList(materials, { title: 'Material do curso' }) + '</section>'
          : '') +
        (c.syllabus?.length
          ? '<section class="block"><div class="block-top"><h2>' + txt('Syllabus') + '</h2></div>' +
            '<ul class="syllabus">' + c.syllabus.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul></section>'
          : '') +
        (c.prerequisites
          ? '<section class="block"><div class="block-top"><h2>' + txt('Prerequisites') + '</h2></div>' +
            '<p class="prerequisites">' + formatted(c.prerequisites) + '</p></section>'
          : '') +
        ((c.requires || []).length
          ? '<section class="block"><div class="block-top"><h2>' + txt('After') + '</h2></div>' +
            '<div class="related">' + c.requires.map((d) => link(d, 'antes')).join('') + '</div></section>'
          : '') +
        (opens.length
          ? '<section class="block"><div class="block-top"><h2>' + txt('Opens the way to') + '</h2></div>' +
            '<div class="related">' + opens.map((x) => link(x.id, 'depois')).join('') + '</div></section>'
          : '') +
      '</aside>' +
    '</div>';

  return { title: c.name, el };
}

function link(id, dir) {
  const c = courseById(id);
  if (!c) return '';
  return '<a class="link-chip elo-' + dir + '" href="#/course/' + esc(id) + '">' + esc(c.name) + '</a>';
}
