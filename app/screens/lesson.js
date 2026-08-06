/* ==========================================================================
   Lesson — one SECTION at a time.

   TWO THINGS MOVED, AND WHY

   1. "Previous" and "next" left the footer and became arrows on the SIDES, on a
      wide screen. The content is pinned to a reading column, so there is space
      to spare on both sides and none vertically — where every pixel spent is
      text pushed below the fold. Below 1400px there is no side to spare and they
      go back to the footer.

   2. There is no "complete" button any more. It and the arrow did the same
      thing, and merging the two into a "Complete and continue" only postponed
      the question: if moving on already completed the section, the button was a
      second route to the same gesture.

      NOW MOVING ON IS COMPLETING. Going to the next section marks the current
      one as done — which is what the student already meant by clicking next. The
      feedback is still immediate and in two places: the step gets its check and
      so does the rail.

      What is lost, and it is worth knowing: there is no longer a way to mark
      without leaving the section, nor to unmark. Anyone who skims accumulates
      progress without having read. It is the trade accepted in favour of a single
      gesture — and it matches the rest of the portal, which shows and does not
      lock.
   ========================================================================== */

import * as api from '../api.js';
import { courseLessons, courseById } from '../catalog.js';
import { lessonSections, sectionMaterials } from '../lessons.js';
import { materialList } from '../materials.js';
import { sectionDone, visitSection, noteFor, saveNote } from '../state.js';
import { buildAssessment } from '../exercises/index.js';
import { empty } from './common.js';
import { esc, prose } from '../text.js';

const ARROW = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
const ARROW_LEFT = ARROW('M15 5l-7 7 7 7');
const ARROW_RIGHT = ARROW('M9 5l7 7-7 7');

/* The next and previous sections cross the lesson boundary: at the end of the
   last section, "next" leads to the first section of the following lesson.
   Without that the student would go back to the course index at every topic,
   which is pure friction. */
function neighbours(courseId, ix, pos) {
  const lessons = courseLessons(courseId);
  const sections = lessonSections(courseId, lessons[ix].key);
  const lastOf = (i) => {
    const s = lessonSections(courseId, lessons[i].key);
    return s[s.length - 1].id;
  };
  const previous = pos > 0
    ? { ix, sectionId: sections[pos - 1].id }
    : (ix > 0 ? { ix: ix - 1, sectionId: lastOf(ix - 1) } : null);
  const next = pos + 1 < sections.length
    ? { ix, sectionId: sections[pos + 1].id }
    : (ix + 1 < lessons.length
      ? { ix: ix + 1, sectionId: lessonSections(courseId, lessons[ix + 1].key)[0].id }
      : null);
  return { previous, next };
}

export default async function lesson({ id, ix, sec }) {
  const c = courseById(id);
  const lessons = courseLessons(id);
  const n = Number(ix);
  const a = lessons[n];
  if (!c || !a) return { title: txt('Lesson'), el: empty(txt('Lesson not found.')) };

  const sections = lessonSections(id, a.key);
  const pos = Math.max(0, sections.findIndex((s) => s.id === sec));
  const section = sections[pos];

  visitSection(id, n, section.id);

  const { previous, next } = neighbours(id, n, pos);
  const note = noteFor(id, n, section.id);
  const routeTo = (v) => '#/course/' + esc(id) + '/lesson/' + v.ix + '/' + esc(v.sectionId);

  const el = document.createElement('div');
  const hasVideoHere = section.type === 'content' && section.video !== undefined;
  el.className = 'view view-lesson' + (hasVideoHere ? ' lesson-with-video' : ' aula-so-texto');

  const steps = sections.map((s, i) => (
    '<a class="step' + (i === pos ? ' on' : '') + (sectionDone(id, n, s.id) ? ' done' : '') +
      (s.type === 'assessment' ? ' step-assessment' : '') + (s.pending ? ' step-pending' : '') + '" ' +
      'href="#/course/' + esc(id) + '/lesson/' + n + '/' + esc(s.id) + '">' +
      '<span class="step-n">' + (s.type === 'assessment' ? '★' : String(i + 1).padStart(2, '0')) + '</span>' +
      '<span class="step-title">' + esc(s.title) + '</span>' +
    '</a>'
  )).join('');

  /* The forward arrow ALWAYS exists. On the course's last section it leads to
     the course page — if it disappeared there, that section would be the only
     one that could never be completed, because completing became moving on. */
  const nextTarget = next ? routeTo(next) : '#/course/' + esc(id);
  const sideArrow = (target, side, arrow, label, advances) => (target
    ? '<a class="side-arrow side-' + side + (advances ? ' advances' : '') + '" href="' + target +
      '" aria-label="' + txt(label) + '">' + arrow + '</a>'
    : '');

  /* THE VIDEO FRAME ONLY EXISTS WHERE THE SECTION SAYS IT HAS VIDEO.

     It used to be in every content section, reserved, on the argument that
     publishing the videos one at a time would not rearrange anyone's screen. The
     argument still holds for a section that WILL have video — and it is terrible
     for one that never will. A text section with a grey rectangle on top
     promises something that is not coming, and the promise does not expire.

     What fixes it is the section DECLARING:

       video: 'ID'   a published video — it plays right there
       video: true   there will be video, there is none yet — the space is held
       (absent)      a text section: no frame, no promise

     The reservation was not lost; it stopped being automatic and started being
     stated. */
  const hasVideo = hasVideoHere;
  const videoReady = hasVideo && typeof section.video === 'string' && section.video;

  el.innerHTML =
    sideArrow(previous && routeTo(previous), 'left', ARROW_LEFT, 'previous section') +
    sideArrow(nextTarget, 'right', ARROW_RIGHT, 'complete and go to the next section', true) +

    '<nav class="crumbs">' +
      '<a href="#/course/' + esc(id) + '">' + esc(c.name) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt('lesson') + ' ' + (n + 1) + ' ' + txt('of') + ' ' + lessons.length + '</span>' +
    '</nav>' +

    '<header class="lesson-head">' +
      '<h1 class="lesson-title">' + esc(a.title) + '</h1>' +
      '<nav class="steps" aria-label="' + txt('Sections of this lesson') + '">' + steps + '</nav>' +
    '</header>' +

    '<h2 class="section-title">' + esc(section.title) + '</h2>' +

    /* THE PLAYER COMES AFTER THE HEADER. It used to come before, so as not to
       push the play button below the fold — and the price was landing in a
       section without knowing which lesson it belongs to. Where am I comes before
       what am I watching, and the answer is the same in the text sections. */
    (hasVideo
      ? '<div class="video-facade" data-video="' + esc(videoReady || '') + '">' +
          (videoReady
            ? '<button type="button" class="video-play" aria-label="' + txt('Watch') + '">▶</button>'
            : '<span class="video-soon mono dim">' + txt('video coming soon') + '</span>') +
          (section.duration ? '<span class="video-duration mono">' + esc(section.duration) + '</span>' : '') +
        '</div>'
      : '') +

    (section.type === 'assessment'
      ? '<section class="block aula-exercicios' + (section.pending ? ' assessment-pending' : '') + '">' +
          (section.pending
            ? '<p class="mono dim">' + txt('[assessment in preparation — this topic\'s exercises have not been produced yet]') + '</p>'
            : '') +
        '</section>'
      /* A video-only section gets no text block at all — not even the "content
         to come" notice, which would be false there: the content is the video.
         The notice still holds for a lesson with nothing written yet. */
      : (section.body
        ? '<section class="block lesson-text">' + prose(section.body) + '</section>'
        : (hasVideo
          ? ''
          : '<section class="block lesson-text"><p class="mono dim">' +
            txt('[lesson content — the real material lands in Stage 2]') + '</p></section>'))) +

    /* Material comes AFTER the text and BEFORE the note: downloading the PDF is
       what you do having read, and taking a note is the section's last gesture. */
    materialList(sectionMaterials(section)) +

    /* The note sits at the END of the section, and not floating beside it:
       noting is what you do after reading, not during. Collapsed when empty, so
       it does not ask for attention from someone who will not use it. */
    '<details class="note" ' + (note ? 'open' : '') + '>' +
      '<summary>' + (note ? '✎ ' + txt('your note') : '＋ ' + txt('make a note on this section')) + '</summary>' +
      '<textarea class="note-field" rows="4" placeholder="' +
        txt('what you want to remember from this section…') + '">' + esc(note) + '</textarea>' +
      '<span class="note-status mono dim" aria-live="polite"></span>' +
    '</details>' +

    /* The footer only exists where there are no side arrows — below 1400px.
       There is no complete button: moving on is completing. */
    '<footer class="lesson-foot">' +
      (previous ? '<a class="btn btn-ghost" href="' + routeTo(previous) + '">← ' + txt('previous') + '</a>' : '<span></span>') +
      '<a class="btn btn-primary advances" href="' + nextTarget + '">' + txt('next') + ' →</a>' +
    '</footer>';

  if (section.type === 'assessment' && !section.pending) {
    const exercises = await api.lessonExercises(id, a.key);
    el.querySelector('.aula-exercicios').appendChild(buildAssessment(exercises, { courseId: id, lessonIx: n }));
  }

  const frame = el.querySelector('.video-facade');
  if (frame) {
    frame.addEventListener('click', (e) => {
      const cx = e.currentTarget;
      if (!cx.dataset.video) return;
      cx.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(cx.dataset.video) +
        '?autoplay=1" title="' + esc(section.title) + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    });
  }

  /* The note saves itself, after a pause following the last keystroke. A save
     button would be one more chance to lose what you wrote. */
  const noteField = el.querySelector('.note-field');
  const notice = el.querySelector('.note-status');
  let saveT = null;
  noteField.addEventListener('input', () => {
    clearTimeout(saveT);
    notice.textContent = txt('typing…');
    saveT = setTimeout(() => {
      saveNote(id, n, section.id, noteField.value);
      notice.textContent = txt('note saved');
      setTimeout(() => { notice.textContent = ''; }, 1600);
    }, 600);
  });
  // leaving the section must not lose what has not been saved yet
  noteField.addEventListener('blur', () => {
    clearTimeout(saveT);
    saveNote(id, n, section.id, noteField.value);
  });

  /* Moving on completes. The marking is synchronous inside, so it happens before
     the browser processes the hash change — there is no race. An assessment with
     no exercises yet stays out: there is nothing to complete in it. */
  el.addEventListener('click', (e) => {
    if (!e.target.closest('.advances')) return;
    if (section.pending) return;
    if (!sectionDone(id, n, section.id)) api.completeSection(id, n, section.id, true);
  });

  return { title: a.title + ' · ' + section.title, el };
}
