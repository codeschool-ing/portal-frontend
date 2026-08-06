/* ==========================================================================
   Performance — the data the portal was already keeping and never showed.

   Every answer records attempts, whether it was right, and whether it was ever
   checked. That existed from day one and died there: the student answered, saw
   the verdict and never met it again. This screen closes the loop.

   THREE STATES, NOT TWO. "Got it wrong" and "nobody checked" cannot become the
   same bar: the types that need a server (`code`, `expected-output`,
   `expression-answer`) answer `correct: null` while there is no execution, and
   counting them as mistakes would invent a failure that never happened. It is
   the funnel's rule, from the other side: there, unjudged never becomes passed;
   here, unjudged never becomes failed.
   ========================================================================== */

import { courseLessons, courseById } from '../catalog.js';
import { answersGiven } from '../state.js';
import { bar, empty } from './common.js';
import { esc } from '../text.js';

/* Joins what the student answered with the matching exercise. The `id` is the
   stable key — that is what it exists for. */
export function answersWithExercise() {
  const byId = {};
  (window.SAMPLE_EXERCISES || []).forEach((e) => { byId[e.id] = e; });
  return answersGiven()
    .map((r) => ({ ...r, ex: byId[r.exId] }))
    .filter((r) => r.ex);
}

export const wrongOnes = () => answersWithExercise().filter((r) => r.checked && !r.correct);

export default async function performance() {
  const el = document.createElement('div');
  el.className = 'view screen-performance';
  const all = answersWithExercise();

  if (!all.length) {
    return {
      title: txt('Performance'),
      el: empty(txt('You have not answered any exercises yet. Take an assessment and come back.')),
    };
  }

  const checked = all.filter((r) => r.checked);
  const right = checked.filter((r) => r.correct).length;
  const pending = all.length - checked.length;
  const pct = checked.length ? Math.round((right / checked.length) * 100) : 0;
  const attempts = all.reduce((s, r) => s + r.attempts, 0);

  const groupBy = (key) => {
    const m = {};
    checked.forEach((r) => {
      const k = key(r);
      m[k] = m[k] || { total: 0, lastCorrect: 0 };
      m[k].total += 1;
      if (r.correct) m[k].lastCorrect += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  };

  const row = (label, d) => {
    const p = Math.round((d.lastCorrect / d.total) * 100);
    return '<div class="perf-row">' +
      '<span class="perf-label">' + esc(label) + '</span>' +
      bar(p, d.lastCorrect + ' ' + txt('of') + ' ' + d.total) +
      '<span class="perf-num">' + d.lastCorrect + '/' + d.total + '</span>' +
    '</div>';
  };

  const wrong = wrongOnes();

  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + txt('How you are doing') + '</h1>' +
    '</header>' +

    '<section class="block">' +
      '<div class="track-numbers">' +
        '<span><b>' + pct + '%</b>' + txt('correct') + '</span>' +
        '<span><b>' + right + '/' + checked.length + '</b>' + txt('exercises checked') + '</span>' +
        '<span><b>' + attempts + '</b>' + txt('attempts') + '</span>' +
        (pending ? '<span><b>' + pending + '</b>' + txt('waiting for the server') + '</span>' : '') +
      '</div>' +
      bar(pct, pct + '%') +
      (pending
        ? '<p class="account-note mono dim">' +
            txt('The types that need execution are not checked yet, so they stay out of the rate.') +
          '</p>'
        : '') +
    '</section>' +

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('By exercise type') + '</h2></div>' +
      groupBy((r) => r.ex.type).map(([k, d]) => row(txt(k), d)).join('') +
    '</section>' +

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('By course') + '</h2></div>' +
      groupBy((r) => r.courseId).map(([k, d]) => row(courseById(k)?.name || k, d)).join('') +
    '</section>' +

    (wrong.length
      ? '<section class="block">' +
          '<div class="block-top">' +
            '<h2>' + txt('What you got wrong') + '</h2>' +
            '<a class="btn btn-primary" href="#/redo">' +
              (wrong.length === 1
                ? txt('Redo what you got wrong')
                : txt('Redo the') + ' ' + wrong.length + ' ' + txt('wrong ones')) + ' →</a>' +
          '</div>' +
          '<ul class="perf-wrong">' +
            wrong.map((r) => {
              const a = courseLessons(r.courseId)[r.lessonIx];
              const c = courseById(r.courseId);
              return '<li><a href="#/course/' + esc(r.courseId) + '/lesson/' + r.lessonIx + '/assessment">' +
                '<span class="de-type">' + txt(r.ex.type) + '</span>' +
                '<span class="de-prompt">' + esc(r.ex.prompt) + '</span>' +
                '<span class="de-where">' + esc(c ? c.name : r.courseId) + (a ? ' · ' + esc(a.title) : '') + '</span>' +
              '</a></li>';
            }).join('') +
          '</ul>' +
        '</section>'
      : '<section class="block"><p class="empty">' + txt('No mistakes pending. Good work.') + '</p></section>');

  return { title: txt('Performance'), el };
}
