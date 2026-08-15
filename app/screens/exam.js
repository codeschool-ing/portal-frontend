/* ==========================================================================
   The exam — the one at the end of a course and the one at the end of a track,
   on the same screen.

   The two differ in three things: where the questions come from, how many there
   are, and where the back link points. Everything else is identical, and that is
   why it is one screen: two identical screens diverge the day somebody fixes one
   of them.

   IT DOES NOT LOCK. You can open the course exam without having done a single
   lesson. The whole portal shows and does not lock — the track is a
   recommendation, the assessment does not require correct answers to move on —
   and an exam that locked would be the only exception. What it does is WARN:
   taking the exam having read 20% of the course is the student's decision, but it
   has to be an informed one.
   ========================================================================== */

import { courseById } from '../catalog.js';
import { courseProgress, activeOption, examResult, examAttempts, saveExam } from '../state.js';
import { openCourseExam, openTrackExam, examScore, examReady, PASS_MARK } from '../exams.js';
import * as api from '../api.js';
import { buildAssessment } from '../exercises/index.js';
import { studentTrack, trackProgress, bar, empty } from './common.js';
import { esc } from '../text.js';

function build(exam, progress) {
  const previous = examResult(exam.key);
  const attempt = examAttempts(exam.key);
  const ready = progress.pct >= 100;

  const el = document.createElement('div');
  el.className = 'view view-exam';

  /* Not `!exam.items.length`: a paper too thin to be passed without perfection
     is no more sittable than an empty one, and the screen has to agree with the
     card that led here — otherwise "coming soon" would be a link to an exam. */
  if (!examReady(exam)) {
    el.innerHTML =
      '<header class="view-head">' +
        '<h1>' + txt('Exam') + ' · ' + esc(exam.title) + '</h1>' +
      '</header>' +
      '<section class="block assessment-pending"><p class="mono dim">' +
        txt('[exam in preparation — not enough exercises have been produced yet]') +
      '</p></section>';
    return el;
  }

  el.innerHTML =
    '<nav class="crumbs">' +
      '<a href="' + exam.backTo + '">' + esc(exam.title) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt(exam.scope === 'track' ? 'track exam' : 'final exam') + '</span>' +
    '</nav>' +

    '<header class="view-head">' +
      '<h1>' + txt(exam.scope === 'track' ? 'Track exam' : 'Final course exam') + '</h1>' +
      '<p>' + esc(exam.title) + '</p>' +
    '</header>' +

    '<section class="block exam-rules">' +
      '<ul class="prose-list">' +
        '<li>' + exam.items.length + ' ' + txt('questions, drawn from the bank of the') + ' ' +
          txt(exam.scope === 'track' ? 'the track\'s set of courses.' : 'course.') + '</li>' +
        '<li>' + txt('Each question\'s result appears only at the end — here the exam measures, it does not teach.') + '</li>' +
        '<li>' + txt('Minimum to pass:') + ' <strong>' + PASS_MARK + '%</strong>.</li>' +
        '<li>' + txt('Redoing draws a different exam. The best result stands.') + '</li>' +
      '</ul>' +
      (previous
        ? '<p class="exam-before' + (previous.passed ? ' passed' : '') + '">' +
            (previous.passed ? '✓ ' + txt('You have already passed this exam.') : txt('Your best score so far:')) +
            ' <strong>' + previous.best + '%</strong> ' +
            txt('in') + ' ' + previous.attempts + ' ' +
            txt(previous.attempts === 1 ? 'attempt' : 'attempts') + '.' +
          '</p>'
        : '') +
      (ready
        ? ''
        : '<p class="exam-notice">' +
            txt('You have completed') + ' <strong>' + progress.pct + '%</strong> ' +
            txt('of the content. The exam does not lock — but it covers the whole material.') +
          '</p>') +
    '</section>' +

    '<section class="block exam-stage"></section>';

  void attempt;

  /* The exam's result is written BY THE SCREEN, not by the wizard: this is where
     "passed" means something, and this is where it gets stored.

     TWO WAYS OF ARRIVING AT IT, and the difference is who computed it. With no
     backend the states in the browser are all there is, so the score is counted
     here and kept here. With one, the paper was the server's and so is the
     result: `submitExam` closes the attempt, grades it, and brings back a
     verdict per question — which the wizard needs anyway to reveal anything,
     since the paper it drew had no answer key in it. */
  const onSubmit = async ({ states }) => {
    const n = exam.attempt ? await submitToServer(exam.attempt) : local(states);
    return {
      verdicts: n.verdicts,
      html:
        '<span class="wz-res-label">' + txt(n.passed ? 'passed' : 'not yet') + '</span>' +
        '<p class="wz-res-score exam-score' + (n.passed ? ' passed' : ' missed') + '">' +
          '<strong>' + n.pct + '%</strong>' +
        '</p>' +
        '<p class="wz-res-note">' + n.lastCorrect + ' ' + txt('of') + ' ' + n.judged + ' ' +
          txt('questions graded') + ' · ' + txt('minimum') + ' ' + PASS_MARK + '%</p>' +
        (n.passed
          ? '<p class="wz-res-note">' + txt('The certificate appears on the Certificates screen.') + '</p>'
          : '<p class="wz-res-note">' + txt('Redo it whenever you like: the next exam is drawn again.') + '</p>'),
    };
  };

  function local(states) {
    const n = examScore(states);
    saveExam(exam.key, {
      pct: n.pct, passed: n.passed, lastCorrect: n.lastCorrect, total: n.judged,
    });
    return n;
  }

  /* Nothing is stored here: `submitExam` refreshes the summaries from the
     server afterwards, and recomputing best-result-wins on this side would be a
     second implementation of a rule that only stays right while there is one. */
  async function submitToServer(attemptId) {
    const r = await api.submitExam(attemptId);
    return {
      pct: r.pct,
      passed: r.passed,
      lastCorrect: r.correct,
      judged: r.judged,
      pending: r.pending,
      verdicts: r.verdicts,
    };
  }

  el.querySelector('.exam-stage').appendChild(
    buildAssessment(
      exam.items.map((i) => i.ex),
      exam.items.map((i) => i.ctx),
      { exam: true, onSubmit, attempt: exam.attempt },
    ),
  );

  return el;
}

export async function courseExamScreen({ id }) {
  const c = courseById(id);
  if (!c) return { title: txt('Exam'), el: empty(txt('Course not found.')) };
  const exam = await openExam(() => openCourseExam(id, examAttempts('course:' + id)));
  if (!exam) return { title: txt('Exam') + ' · ' + c.name, el: pending(c.name) };
  return { title: txt('Exam') + ' · ' + c.name, el: build(exam, courseProgress(id)) };
}

export async function trackExamScreen() {
  const t = studentTrack();
  if (!t) return { title: txt('Exam'), el: empty(txt('You have not chosen a track yet.')) };
  const exam = await openExam(() => openTrackExam(t, activeOption, examAttempts('track:' + t.id)));
  if (!exam) return { title: txt('Exam') + ' · ' + t.name, el: pending(t.name) };
  return { title: txt('Exam') + ' · ' + t.name, el: build(exam, trackProgress(t)) };
}

/* The server refuses to open an exam it has no questions for, with a 409 — a
   course whose exercises are not written yet. That is not a failure on anyone's
   part and it is the same state the local draw shows as an empty `items`, so
   both arrive at the same screen. Anything else is a real failure and is
   allowed to reach the router. */
async function openExam(draw) {
  try {
    return await draw();
  } catch (e) {
    if (e.status === 409) return null;
    throw e;
  }
}

const pending = (title) => {
  const el = document.createElement('div');
  el.className = 'view view-exam';
  el.innerHTML =
    '<header class="view-head"><h1>' + txt('Exam') + ' · ' + esc(title) + '</h1></header>' +
    '<section class="block assessment-pending"><p class="mono dim">' +
      txt('[exam in preparation — not enough exercises have been produced yet]') +
    '</p></section>';
  return el;
};

/* The card that announces the exam, at the end of the course page and of the
   track page. It is the same piece in both places because it is the same
   promise.

   IT IS ALWAYS THERE, whether the exam can be sat or not. It used to be rendered
   only when the draw came back with questions, and the exercise bank is written
   course by course: 118 of the 122 courses have none yet, so on five whole
   tracks — Technical Leadership among them — the section was simply absent from
   the screen. Nothing said why, and nothing said it was coming.

   That is the rule `lessons.js` already states for the assessment at the foot of
   every lesson: "an empty assessment says what is coming instead of vanishing…
   publishing one at a time does not rearrange anyone's screen." The exam is the
   same promise one level up, and it was the one place the rule was not applied.

   `ready` false covers the empty bank and the paper too thin to measure
   anything alike — see MIN_QUESTIONS. */
export function examCard({ key, href, scope, count, progress, ready = true }) {
  const r = examResult(key);
  const state = ready ? (r?.passed ? 'passed' : (r ? 'attempted' : 'new')) : 'pending';
  return '<section class="block exam-card ' + state + '">' +
    '<div class="exam-card-text">' +
      '<span class="exam-card-label mono">' +
        txt(scope === 'track' ? 'end of the track' : 'end of the course') + '</span>' +
      '<h2>' + txt(scope === 'track' ? 'Track exam' : 'Final exam') + '</h2>' +
      (ready
        ? '<p>' + count + ' ' + txt('questions drawn') + ' · ' + txt('minimum') + ' ' + PASS_MARK + '% · ' +
          txt('result only at the end') + '</p>'
        : '<p>' + txt('in preparation — not enough exercises yet') + '</p>') +
      (ready && r
        ? '<p class="exam-card-score' + (r.passed ? ' passed' : '') + '">' +
            (r.passed ? '✓ ' + txt('passed with') : txt('best score:')) + ' ' + r.best + '%</p>'
        : '') +
    '</div>' +
    '<div class="exam-card-action">' +
      (progress !== undefined ? bar(progress, progress + '%') : '') +
      (ready
        ? '<a class="btn btn-primary" href="' + href + '">' +
          txt(r ? 'Redo the exam' : 'Take the exam') + ' →</a>'
        : '<span class="exam-card-soon mono">' + txt('coming soon') + '</span>') +
    '</div>' +
  '</section>';
}
