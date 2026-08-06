/* ==========================================================================
   Exams — the one at the end of a course and the one at the end of a track.

   A LESSON'S ASSESSMENT AND AN EXAM ARE NOT THE SAME THING, and the difference
   is not the size:

     assessment  is PRACTICE. It checks on the spot, shows why, lets you redo.
                 Getting it wrong there is part of learning, and the immediate
                 feedback is what makes the mistake teach something.
     exam        is MEASUREMENT. You answer everything and only then see the
                 result. Feedback on every question in an exam is what lets you
                 try until you get it right — and then it stops measuring
                 anything.

   That is why the wizard takes `modo: 'prova'`: the same screens, with the
   verdict held back until the end. Without it, an exam would just be a long
   assessment.

   WHERE THE QUESTIONS COME FROM
   From the lessons' own exercise bank, drawn at random. There is no separate
   bank of "exam questions", and there should not be one while the pipeline emits
   one file per topic: keeping two banks aligned is recurring work, and what it
   would buy — unseen questions — the draw already gives, because nobody does all
   1,503 exercises of a track before the exam.

   THE DRAW IS SEEDED BY THE ATTEMPT. Leaving the screen and coming back gives
   the SAME exam (otherwise closing the tab by accident would become a new exam,
   which is the wrong punishment for the wrong mistake). Failing and trying again
   gives a DIFFERENT exam — memorising the list of ten cannot be the strategy.

   IT PREFERS THE TYPES THE PORTAL CAN GRADE. `code`, `expected-output` and
   `expression-answer` need a server and today come back "unchecked" — an exam
   full of them would have no score. They only come in when there are not enough
   gradable ones, and they stay out of the denominator, by the usual rule:
   unjudged becomes neither passed nor failed.
   ========================================================================== */

import { courseLessons, courseById, trackPath } from './catalog.js';
import { lessonExercises } from './lessons.js';
import { NEEDS_SERVER } from './exercises/grade.js';
import { shuffleWith } from './text.js';

export const PASS_MARK = 70;         // % correct needed to pass
export const COURSE_QUESTIONS = 10;
export const TRACK_QUESTIONS = 15;

/* Every exercise in a course, each one knowing which lesson it came from — the
   wizard stores the answer under `progress[course].lessons[ix]`, and an exam that
   pooled lessons without keeping the origin would file everything against the
   wrong lesson. */
export function courseBank(courseId) {
  const out = [];
  courseLessons(courseId).forEach((a, ix) => {
    lessonExercises(courseId, a.key).forEach((ex) => {
      out.push({ ex, ctx: { courseId, lessonIx: ix }, lesson: a.title });
    });
  });
  return out;
}

const gradable = (item) => !NEEDS_SERVER.includes(item.ex.type);

/* Draws while keeping the preference for the gradable ones: it shuffles the two
   groups separately and only then concatenates, so the order inside each group
   still varies from attempt to attempt. */
function draw(bank, howMany, seed) {
  const good = shuffleWith(seed + ':ok', bank.filter(gradable));
  const rest = shuffleWith(seed + ':srv', bank.filter((i) => !gradable(i)));
  return good.concat(rest).slice(0, howMany);
}

export function courseExam(courseId, attempt = 0) {
  const c = courseById(courseId);
  const bank = courseBank(courseId);
  return {
    key: 'course:' + courseId,
    scope: 'course',
    about: courseId,
    title: c ? c.name : courseId,
    backTo: '#/course/' + courseId,
    items: draw(bank, COURSE_QUESTIONS, courseId + ':' + attempt),
    bankSize: bank.length,
  };
}

export function trackExam(track, activeOption, attempt = 0) {
  const path = trackPath(track, activeOption);
  const bank = path.flatMap((id) => courseBank(id));
  return {
    key: 'track:' + track.id,
    scope: 'track',
    about: track.id,
    title: track.name,
    backTo: '#/track',
    items: draw(bank, TRACK_QUESTIONS, track.id + ':' + attempt),
    bankSize: bank.length,
    courses: path.length,
  };
}

/* The score. `right / judged` — and judged excludes what the server has not
   checked yet, never what was left blank. Leaving it blank is an answer, and it
   is a wrong one; not having been checked is not an answer at all. */
export function examScore(states) {
  const judged = states.filter((s) => s.correct !== null || !s.answered);
  const right = states.filter((s) => s.correct === true).length;
  const pending = states.length - judged.length;
  const pct = judged.length ? Math.round((right / judged.length) * 100) : 0;
  return {
    lastCorrect: right, judged: judged.length, pending, pct,
    passed: judged.length > 0 && pct >= PASS_MARK,
  };
}
