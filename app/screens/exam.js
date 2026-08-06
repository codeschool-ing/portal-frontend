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
import { courseExam, trackExam, examScore, PASS_MARK } from '../exams.js';
import { buildAssessment } from '../exercises/index.js';
import { studentTrack, trackProgress, bar, empty } from './common.js';
import { esc } from '../text.js';

function build(exam, progress) {
  const previous = examResult(exam.key);
  const attempt = examAttempts(exam.key);
  const ready = progress.pct >= 100;

  const el = document.createElement('div');
  el.className = 'view view-exam';

  if (!exam.items.length) {
    el.innerHTML =
      '<header class="view-head">' +
        '<h1>' + txt('Exam') + ' · ' + esc(exam.title) + '</h1>' +
      '</header>' +
      '<section class="block assessment-pending"><p class="mono dim">' +
        txt('[exam in preparation — this course has no exercises produced yet]') +
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
            txt(previous.attempts === 1 ? 'tentativa' : 'tentativas') + '.' +
          '</p>'
        : '') +
      (ready
        ? ''
        : '<p class="exam-notice">' +
            txt('You have completed') + ' <strong>' + progress.pct + '%</strong> ' +
            txt('of the content. The exam does not lock — but it covers the whole material.') +
          '</p>') +
    '</section>' +

    '<section class="block prova-palco"></section>';

  void attempt;

  /* The exam's result is written BY THE SCREEN, not by the wizard: this is where
     "passed" means something, and this is where it gets stored. */
  const onSubmit = ({ states }) => {
    const n = examScore(states);
    saveExam(exam.key, {
      pct: n.pct, passed: n.passed, lastCorrect: n.lastCorrect, total: n.judged,
    });
    return {
      html:
        '<span class="wz-res-label">' + txt(n.passed ? 'aprovado' : 'not yet') + '</span>' +
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

  el.querySelector('.prova-palco').appendChild(
    buildAssessment(
      exam.items.map((i) => i.ex),
      exam.items.map((i) => i.ctx),
      { prova: true, onSubmit },
    ),
  );

  return el;
}

export async function courseExamScreen({ id }) {
  const c = courseById(id);
  if (!c) return { title: txt('Exam'), el: empty(txt('Course not found.')) };
  const exam = courseExam(id, examAttempts('course:' + id));
  return { title: txt('Exam') + ' · ' + c.name, el: build(exam, courseProgress(id)) };
}

export async function trackExamScreen() {
  const t = studentTrack();
  if (!t) return { title: txt('Exam'), el: empty(txt('You have not chosen a track yet.')) };
  const exam = trackExam(t, activeOption, examAttempts('track:' + t.id));
  return { title: txt('Exam') + ' · ' + t.name, el: build(exam, trackProgress(t)) };
}

/* The card that announces the exam, at the end of the course page and of the
   track page. It is the same piece in both places because it is the same
   promise. */
export function examCard({ key, href, scope, count, progress }) {
  const r = examResult(key);
  const state = r?.passed ? 'passed' : (r ? 'tentou' : 'novo');
  return '<section class="block exam-card ' + state + '">' +
    '<div class="exam-card-text">' +
      '<span class="exam-card-label mono">' +
        txt(scope === 'track' ? 'end of the track' : 'end of the course') + '</span>' +
      '<h2>' + txt(scope === 'track' ? 'Track exam' : 'Final exam') + '</h2>' +
      '<p>' + count + ' ' + txt('questions drawn') + ' · ' + txt('minimum') + ' ' + PASS_MARK + '% · ' +
        txt('result only at the end') + '</p>' +
      (r
        ? '<p class="exam-card-score' + (r.passed ? ' passed' : '') + '">' +
            (r.passed ? '✓ ' + txt('passed with') : txt('best score:')) + ' ' + r.best + '%</p>'
        : '') +
    '</div>' +
    '<div class="exam-card-action">' +
      (progress !== undefined ? bar(progress, progress + '%') : '') +
      '<a class="btn btn-primary" href="' + href + '">' +
        txt(r ? 'Redo the exam' : 'Take the exam') + ' →</a>' +
    '</div>' +
  '</section>';
}
