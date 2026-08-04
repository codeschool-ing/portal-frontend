/* ==========================================================================
   Pieces that more than one screen uses.

   It exists so that two places do not compute the same number in two different
   ways — the same reason the vitrine's terminal reads `CURSOS` instead of having
   the answers written by hand: no screen may contradict another, because they
   all read the same source.
   ========================================================================== */

import { trackById, trackPath } from '../catalog.js';
import { courseProgress, activeOption, now } from '../state.js';
import { esc } from '../text.js';

export const FAMILIES = ['carreira', 'tecnologia'];

export const TRACKS_BY_FAMILY = () =>
  FAMILIES.map((f) => [f, TRILHAS.filter((t) => (t.familia || 'carreira') === f)]);

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
    done += p.feitas;
  });
  return { feitas: done, total, pct: total ? Math.round((done / total) * 100) : 0, cursos: path.length };
}

export function bar(pct, label) {
  return '<span class="barra" role="img" aria-label="' + esc(label || pct + '%') + '">' +
    '<span class="barra-cheia" style="width:' + pct + '%"></span></span>';
}

export const studentTrack = () => {
  const m = now().matricula;
  return m ? trackById(m.trilhaId) : null;
};

export function empty(message) {
  const el = document.createElement('div');
  el.className = 'tela tela-vazia';
  el.innerHTML = '<p class="vazio">' + esc(message) + '</p>';
  return el;
}
