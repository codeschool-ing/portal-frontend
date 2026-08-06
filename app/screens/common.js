/* ==========================================================================
   Pieces that more than one screen uses.

   It exists so that two places do not compute the same number in two different
   ways — the same reason the vitrine's terminal reads `COURSES` instead of having
   the answers written by hand: no screen may contradict another, because they
   all read the same source.
   ========================================================================== */

import { trackById, trackPath } from '../catalog.js';
import { courseProgress, activeOption, now } from '../state.js';
import { esc } from '../text.js';

export const FAMILIES = ['career', 'technology'];

export const TRACKS_BY_FAMILY = () =>
  FAMILIES.map((f) => [f, TRACKS.filter((t) => (t.family || 'career') === f)]);

/* The progress of a whole track, counted in SECTIONS and not in courses or
   lessons: a course with 48 topics and one with 11 are not worth the same, and a
   lesson can have one section or six. The section is the smallest unit of real
   work, and the only one that makes the bar move in proportion to the effort. */
export function trackProgress(t) {
  const path = trackPath(t, activeOption);
  let done = 0, total = 0;
  path.forEach((id) => {
    const p = courseProgress(id);
    total += p.total;
    done += p.done;
  });
  return { done: done, total, pct: total ? Math.round((done / total) * 100) : 0, courses: path.length };
}

export function bar(pct, label) {
  return '<span class="bar" role="img" aria-label="' + esc(label || pct + '%') + '">' +
    '<span class="bar-fill" style="width:' + pct + '%"></span></span>';
}

export const studentTrack = () => {
  const m = now().enrollment;
  return m ? trackById(m.trackId) : null;
};

export function empty(message) {
  const el = document.createElement('div');
  el.className = 'view screen-empty';
  el.innerHTML = '<p class="empty">' + esc(message) + '</p>';
  return el;
}
