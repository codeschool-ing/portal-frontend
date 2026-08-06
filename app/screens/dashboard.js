/* ==========================================================================
   Dashboard.

   The first element is "carry on from where you stopped". In an LMS that is the
   action of most sessions, and burying it behind two clicks is the most common
   defect of the category — the person came in to study, not to navigate.
   ========================================================================== */

import * as api from '../api.js';
import { courseLessons, courseById, trackPath } from '../catalog.js';
import { lessonSections } from '../lessons.js';
import { courseProgress, activeOption } from '../state.js';
import { courseState } from '../graph.js';
import { trackProgress, studentTrack, bar } from './common.js';
import { esc } from '../text.js';

export default async function dashboard() {
  const el = document.createElement('div');
  el.className = 'view tela-painel';

  const session = await api.session();
  const t = studentTrack();
  const next = await api.resumeFrom();

  /* The card points at the SECTION, not at the top of the lesson: sending
     someone back to the start of a four-hour topic is sending them back to
     scrolling. */
  const resume = (() => {
    if (!next) return '';
    const c = courseById(next.courseId);
    const lessons = courseLessons(next.courseId);
    const a = lessons[next.lessonIx] || lessons[0];
    if (!c || !a) return '';
    const sections = lessonSections(c.id, a.key);
    const s = sections.find((x) => x.id === next.sectionId) || sections[0];
    const p = courseProgress(c.id);
    return (
      '<a class="resume" href="#/course/' + esc(c.id) + '/lesson/' + a.ix + '/' + esc(s.id) + '">' +
        '<span class="resume-label">' + txt('pick up where you left off') + '</span>' +
        '<span class="resume-lesson">' + esc(s.title) + '</span>' +
        '<span class="resume-course">' + esc(c.name) + ' · ' + esc(a.title) + '</span>' +
        '<span class="resume-where mono dim">' +
          txt('lesson') + ' ' + (a.ix + 1) + '/' + lessons.length + ' · ' +
          txt('section') + ' ' + (sections.indexOf(s) + 1) + '/' + sections.length +
        '</span>' +
        bar(p.pct, p.feitas + ' de ' + p.total) +
        '<span class="resume-btn btn btn-primary">' + txt('Continue') + ' →</span>' +
      '</a>'
    );
  })();

  const pt = t ? trackProgress(t) : null;

  // what comes next: whatever is available right now, in track order
  const upcoming = t
    ? trackPath(t, activeOption)
      .map((id) => ({ id, st: courseState(id) }))
      .filter((x) => x.st === 'current' || x.st === 'available')
      .slice(0, 4)
    : [];

  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + txt('Hello') + ', ' + esc(session?.name || txt('student')) + '</h1>' +
    '</header>' +

    resume +

    (t
      ? '<section class="block">' +
          '<div class="block-top">' +
            '<h2>' + esc(t.name) + '</h2>' +
            '<a class="block-link" href="#/track">' + txt('see the map') + ' →</a>' +
          '</div>' +
          '<div class="track-numbers">' +
            '<span><b>' + pt.pct + '%</b>' + txt(' of the track') + '</span>' +
            '<span><b>' + pt.feitas + '/' + pt.total + '</b>' + txt('sections') + '</span>' +
            '<span><b>' + pt.courses + '</b>' + txt('courses on the path') + '</span>' +
            '<span><b>→</b>' + esc(t.outcome) + '</span>' +
          '</div>' +
          bar(pt.pct, pt.pct + '%') +
        '</section>'
      : '<section class="block"><p class="empty">' + txt('You have not chosen a track yet.') + '</p></section>') +

    (upcoming.length
      ? '<section class="block">' +
          '<div class="block-top"><h2>' + txt('Next steps') + '</h2></div>' +
          '<div class="cards">' +
            upcoming.map(({ id, st }) => {
              const c = courseById(id);
              const p = courseProgress(id);
              return '<a class="card no-' + st + '" href="#/course/' + esc(id) + '">' +
                '<span class="node-state" data-state="' + st + '">' +
                  txt(st === 'current' ? 'in progress' : 'available') + '</span>' +
                '<span class="card-name">' + esc(c.name) + '</span>' +
                '<span class="card-meta">' + c.hours + 'h · ' + txt(c.level) + '</span>' +
                bar(p.pct, p.feitas + ' de ' + p.total) +
                '<span class="card-count">' + p.feitas + '/' + p.total + ' ' + txt('sections') + '</span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</section>'
      : '');

  return { title: txt('Dashboard'), el };
}
