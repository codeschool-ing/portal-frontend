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

/* ---------- the video frame ----------

   ONE COMPONENT, because there were two and they drifted. The course screen
   used the vitrine's `.modal-video` — dashed border while the video is
   reserved, a dimmed play button, and the caption in small mono capitals along
   the bottom — and the lesson had a `.video-facade` of its own, which showed a
   solid border, no play button at all, and the caption centred in the middle of
   an empty box. The two say different things about the same state, and the
   lesson's said the weaker one: a grey rectangle with a sentence in it does not
   read as "a video is coming", it reads as something that failed to load.

   The class is named after where it first appeared rather than after what it
   is, which is why `modal-video` looks out of place on a lesson and is still
   the right name: `base.css` is the vitrine's stylesheet, kept syncable with
   it, so a portal-only copy would be a second thing to keep in step for no gain.

   THE FRAME EXISTS WITH NO VIDEO PUBLISHED, and that is the whole reason it is
   worth styling carefully. Today almost every one of them is empty; publishing
   the videos one at a time then fills them in without rearranging anybody's
   screen. */
export function videoFrame(id, { label, duration } = {}) {
  const badge = duration ? '<span class="video-duration mono">' + esc(duration) + '</span>' : '';
  if (!id) {
    return '<div class="modal-video is-empty" aria-hidden="true">' +
      '<span class="video-play"></span>' +
      '<span class="video-notice">' + txt('video coming soon') + '</span>' +
      badge +
      '</div>';
  }
  return '<button type="button" class="modal-video" data-video="' + esc(id) + '" ' +
    'aria-label="' + esc(label || txt('Watch')) + '">' +
    '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg" ' +
      'alt="" loading="lazy" />' +
    '<span class="video-play"></span>' +
    badge +
    '</button>';
}

/* The facade only becomes a player on a click, so a screen opens without asking
   YouTube for anything and a student who does not watch receives no cookie from
   them. Bound to the screen element rather than delegated from main.js: the
   element is new on every render, so the listener goes with it. */
export function playsOnClick(el, title) {
  el.addEventListener('click', (e) => {
    const thumb = e.target.closest('[data-video]');
    if (!thumb || !thumb.dataset.video) return;
    const frame = document.createElement('div');
    frame.className = 'modal-video playing';
    frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(thumb.dataset.video) + '?autoplay=1&rel=0" ' +
      'title="' + esc(title) + '" allowfullscreen ' +
      'allow="accelerometer; autoplay; encrypted-media; picture-in-picture"></iframe>';
    thumb.replaceWith(frame);
  });
}
