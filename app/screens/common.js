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

/* ==========================================================================
   THE SUBSCRIPTION INVITATION

   One block, used in the two places a student meets the paywall: the course
   they tried to open, and the plan screen. One place so the offer cannot say
   two different things, and so the day a payment provider arrives there is one
   button to change rather than two.

   THE ACTION IS AN E-MAIL, AND THAT IS NOT A PLACEHOLDER. There is no payment
   provider and no checkout; an "Assinar agora" that led nowhere would be the
   same lie as the button this replaces, only better dressed. A subscription is
   opened by a person today — see the console's record screen — so the invitation
   asks that person, and says so.

   IT NAMES THE COURSE in the subject, so whoever reads the mail knows what
   made somebody want to pay. That is the most useful thing this screen can
   collect while there is nothing to click.

   THE BENEFITS ARE NOT WRITTEN HERE. `window.FEATURES` already carries them,
   translated into all five languages, and `window.PLANS` says which belong to
   which plan. Re-typing them would be a second copy to keep in step with the
   pricing page — and the pricing page is the one that sells.
   ========================================================================== */


/* The plans' feature sentences carry counts, and this fills them in.

The placeholders survive translation because they are part of the KEY: each
   dictionary carries `{courses}` and `{tracks}` in its own word order, which a
   sentence cut into fragments could not do — French needs "Les 122 cours et les
   19 parcours", and a translator handed "All", "courses and", "tracks" has
   nowhere to put the second "les".

   IT RUNS AFTER THE TRANSLATION AND NOT AROUND IT, deliberately. Wrapping the
   lookup in a helper would hide `features[k]` from `tools/i18n/check.mjs`,
   which follows translation arguments statically and already knows that
   expression; it would have had to be taught a new one for no gain. Translate,
   then fill in the numbers. */
export const withCounts = (s) => s
  .replace('{courses}', COURSES.length)
  .replace('{tracks}', TRACKS.length);

const CONTACT = 'contact@codeschool.ing';

/* The address, with the course already in the subject and the body. `mailto:`
   wants every part percent-encoded, including the spaces. */
export function subscribeHref(courseName) {
  const subject = txt('I would like the subscription')
    + (courseName ? ' — ' + courseName : '');
  const body = courseName
    ? txt('I would like the subscription') + ': ' + courseName
    : txt('I would like the subscription');
  return 'mailto:' + CONTACT
    + '?subject=' + encodeURIComponent(subject)
    + '&body=' + encodeURIComponent(body);
}

// The paying plan, or nothing when no plan is configured — the offline bundle
// and a local run both reach here with an empty window.PLANS.
const paidPlan = () => (window.PLANS || []).find((p) => p.id === 'student');

/* The block itself. `courseName` is optional: on the plan screen there is no
   course to name, and the invitation still stands. */
export function subscribeInvite(courseName) {
  const plan = paidPlan();
  const opens = (plan?.includes || [])
    .map((k) => (window.FEATURES || {})[k])
    .map((t) => (t ? withCounts(t) : t))
    .filter(Boolean);

  return '<section class="block invite">' +
    '<p class="invite-tag mono">' + esc(txt('part of the subscription')) + '</p>' +
    /* ONE STRING LITERAL. tools/i18n/check.mjs reads the source rather than
       running it, so joined fragments are a call it cannot follow. */
    '<p class="invite-lead">' + esc(txt('The first course of every track is free, in full. This one is part of the subscription, which opens every course, the final exams, the certificates and the material to download.')) + '</p>' +
    (opens.length
      ? '<ul class="invite-opens">'
        + opens.map((s) => '<li>' + esc(s) + '</li>').join('')
        + '</ul>'
      : '') +
    (plan
      ? '<p class="invite-price"><strong>R$ ' + esc(String(plan.price)) + '</strong>'
        + '<span class="invite-cycle dim">' + esc(txt(plan?.cycle)) + '</span></p>'
      : '') +
    '<a class="btn btn-primary invite-cta" href="' + subscribeHref(courseName) + '">'
      + esc(txt('Ask for the subscription')) + '</a>' +
    '<p class="invite-note dim">' + esc(txt('Write to us and we will open it for your account.')) + '</p>' +
  '</section>';
}
