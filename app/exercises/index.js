/* ==========================================================================
   The shared wrapper around the seven types, and the assessment wizard.

   Everything that does not depend on the type lives here — prompt, hint,
   button, verdict — and each type module handles only the interactive middle.
   The contract:

     types          : which `tipo` values this module answers for
     selfCompleting : optional. `true` when the exercise itself can tell that it
                      is finished (the matching type, which checks pair by
                      pair). The wrapper hides "Responder" and waits.
     body(ex, uid)                       → HTML of the middle
     setup(root, {exercise, done})  → optional: event listeners
     collect(root)                       → the answer, or null if unanswered
     reveal(root, ex, verdict)           → marks what was right, AFTERWARDS

   THE `_verification` BADGE LEFT THE STUDENT'S SCREEN. It is still in the data
   and still filters in `lessonExercises` — the pipeline docs say it is what
   decides what the portal publishes first, and that is a publishing decision,
   not information for someone who is studying. Telling a student "structural
   check only" warns them that this exercise may be no good; if it may be no
   good, it should not have been published.
   ========================================================================== */

import { formatted, esc } from '../text.js';
import * as api from '../api.js';
import { saveAnswer, answerFor } from '../state.js';

import choices from './choices.js';
import ordering from './ordering.js';
import matching from './matching.js';
import expectedOutput from './expected-output.js';
import code from './code.js';
import expressionAnswer from './expression-answer.js';

const MODULES = [choices, ordering, matching, expectedOutput, code, expressionAnswer];

const REGISTRY = {};
MODULES.forEach((m) => m.types.forEach((t) => { REGISTRY[t] = m; }));

export const isKnownType = (t) => Boolean(REGISTRY[t]);

/* `options.prova` HOLDS THE FEEDBACK BACK. In an exam the student answers and
   moves on: the verdict, the justification and the "try again" only exist once
   the exam closes. Feedback on every question during an exam is what lets you
   try until you get it right, and then it stops measuring anything. The answer
   is still recorded normally — what changes is only what the screen says, and
   when. */
export function buildExercise(ex, ctx, ix, options = {}) {
  const mod = REGISTRY[ex.type];
  const exam = Boolean(options.prova);
  const uid = ex.id || `${ex.course}:${ex.topic}:${ix}`;
  const el = document.createElement('article');
  el.className = 'ex ex-' + ex.type + (exam ? ' ex-prova' : '');
  // the DOM id: answers are stored under it, and it is how you can tell WHICH
  // exercise is on screen without depending on the prompt text
  el.dataset.ex = uid;

  if (!mod) {
    el.innerHTML = '<p class="ex-error">' + txt('unknown exercise type') + ': ' + esc(ex.type) + '</p>';
    return el;
  }

  el.innerHTML =
    '<header class="ex-top">' +
      '<span class="ex-type">' + txt(ex.type) + '</span>' +
      (ex.difficulty ? '<span class="ex-difficulty">' + txt(ex.difficulty) + '</span>' : '') +
    '</header>' +
    '<p class="ex-prompt">' + formatted(ex.prompt) + '</p>' +
    '<div class="ex-body">' + mod.body(ex, uid) + '</div>' +
    // the hint is scaffolding for someone learning; in an exam it is a cheat sheet
    (ex.socraticHint && !exam
      ? '<details class="ex-hint"><summary>' + txt('hint') + '</summary><p>' + formatted(ex.socraticHint) + '</p></details>'
      : '') +
    '<div class="ex-actions">' +
      (mod.selfCompleting ? '' : '<button type="button" class="btn btn-primary ex-responder">' +
        txt(exam ? 'Registrar resposta' : 'Responder') + '</button>') +
      (exam ? '' : '<button type="button" class="btn btn-ghost ex-refazer" hidden>' + txt('Try again') + '</button>') +
    '</div>' +
    '<div class="ex-verdict" aria-live="polite"></div>';

  const body = el.querySelector('.ex-body');

  async function check(answer) {
    const out = el.querySelector('.ex-verdict');
    if (answer === null) {
      out.className = 'ex-verdict v-empty';
      out.textContent = txt('Answer before checking.');
      return;
    }
    const button = el.querySelector('.ex-responder');
    if (button) button.disabled = true;
    out.className = 'ex-verdict v-waiting';
    out.textContent = txt('checking…');

    const v = await api.grade(ex, answer);
    if (ctx) saveAnswer(ctx.courseId, ctx.lessonIx, uid, v);

    if (exam) {
      /* Held back. The element remembers how to reveal itself later — the whole
         exam opens at once when it closes, and the student reviews what they
         answered. */
      out.className = 'ex-verdict v-recorded';
      out.innerHTML = '<strong>' + txt('answer recorded') + '</strong> ' +
        txt('the result comes at the end of the exam.');
      el.revealExam = () => { mod.reveal(body, ex, v); showVerdict(el, ex, v); };
    } else {
      mod.reveal(body, ex, v);
      showVerdict(el, ex, v);
      el.querySelector('.ex-refazer').hidden = false;
    }
    el.dispatchEvent(new CustomEvent('exercise:answered', { bubbles: true, detail: { ex, v } }));
  }

  if (mod.setup) mod.setup(body, { exercise: ex, done: check });

  /* "already solved" is useful memory in an assessment and hands over the
     answer key in an exam: the exam draws from the same bank as the lessons, so
     almost every question has been seen before. */
  const previous = !exam && ctx && answerFor(ctx.courseId, ctx.lessonIx, uid);
  if (previous?.correct) markAlreadyDone(el, previous);

  const answerButton = el.querySelector('.ex-responder');
  if (answerButton) answerButton.addEventListener('click', () => check(mod.collect(body)));

  const retry = el.querySelector('.ex-refazer');
  if (retry) {
    retry.addEventListener('click', () => {
      const fresh = buildExercise(ex, ctx, ix, options);
      el.replaceWith(fresh);
      fresh.dispatchEvent(new CustomEvent('exercise:redone', { bubbles: true }));
    });
  }

  return el;
}

function showVerdict(el, ex, v) {
  const out = el.querySelector('.ex-verdict');

  if (v.correct === null) {
    /* Unchecked NEVER becomes passed — it is the pipeline's rule and it holds
       whole here: while there is no execution, the portal says it did not
       check. */
    out.className = 'ex-verdict v-pending';
    out.innerHTML = '<strong>' + txt('not checked') + '</strong> ' + esc(v.detail || '');
    return;
  }

  if (v.correct) {
    out.className = 'ex-verdict v-right';
    out.innerHTML = '<strong>' + txt('correct') + '</strong>';
    return;
  }

  out.className = 'ex-verdict v-wrong';
  let extra = '';
  if (v.partial) extra = ' ' + txt('not every pair was closed.');
  else if (typeof v.errors === 'number' && v.errors > 0) extra = '';
  /* The `trap` of an ordering exercise is what the exercise measures:
     which neighbouring pair gets swapped, and why. As feedback it is worth a
     lot; any earlier, it would be the answer. */
  if (ex.type === 'ordering' && ex.trap) {
    extra += '<span class="v-trap">' + formatted(ex.trap) + '</span>';
  }
  out.innerHTML = '<strong>' + txt('not yet') + '</strong>' + extra;
}

function markAlreadyDone(el, previous) {
  const out = el.querySelector('.ex-verdict');
  out.className = 'ex-verdict v-old';
  out.innerHTML = '<strong>' + txt('already solved') + '</strong> ' +
    txt('in') + ' ' + previous.attempts + ' ' +
    (previous.attempts === 1 ? txt('attempt') : txt('attempts'));
}

/* ==========================================================================
   THE ASSESSMENT WIZARD — one question at a time.

   Stacking seven exercises on one page makes people scroll to find where they
   left off, and shows all at once a volume that intimidates. One at a time
   gives focus, and the row of markers at the top says how much is left without
   taking up space.

   The markers are CLICKABLE: on a paper exam you skip the hard one and come
   back later, and blocking progress until you get it right would turn an
   assessment into a gate. The whole track is already a recommendation, not a
   lock — the assessment could not be stricter than it.
   ========================================================================== */

export function buildAssessment(exercises, ctx, options = {}) {
  const exam = Boolean(options.prova);
  const el = document.createElement('div');
  el.className = 'wizard' + (exam ? ' wizard-prova' : '');
  const states = exercises.map(() => ({ answered: false, correct: null }));
  let current = 0;
  let submitted = false;
  let confirming = false;

  el.innerHTML =
    '<header class="wz-top">' +
      '<span class="wz-count"></span>' +
      '<div class="wz-dots" role="tablist"></div>' +
    '</header>' +
    '<div class="wz-palco"></div>' +
    '<footer class="wz-foot">' +
      '<button type="button" class="btn btn-ghost wz-antes">← ' + txt('previous') + '</button>' +
      '<button type="button" class="btn btn-primary wz-depois">' + txt('next') + ' →</button>' +
    '</footer>';

  const stage = el.querySelector('.wz-palco');
  const dots = el.querySelector('.wz-dots');

  function paintHeader() {
    el.querySelector('.wz-count').textContent =
      txt('question') + ' ' + (current + 1) + ' ' + txt('of') + ' ' + exercises.length;
    dots.innerHTML = states.map((s, i) => {
      const cls = ['wz-dot'];
      if (i === current) cls.push('on');
      /* In an exam that is still open the marker says WHETHER it was answered,
         not whether it was right: the colour of a correct answer would be the
         verdict the exam is holding back. */
      if (s.answered) {
        cls.push(exam && !submitted
          ? 'done'
          : (s.correct === true ? 'right' : (s.correct === null ? 'pending' : 'wrong')));
      }
      return '<button type="button" class="' + cls.join(' ') + '" data-ir="' + i + '" ' +
        'aria-label="' + txt('question') + ' ' + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('');
    el.querySelector('.wz-antes').disabled = current === 0;
    const last = current === exercises.length - 1;
    const blank = states.filter((s) => !s.answered).length;
    const next = el.querySelector('.wz-depois');
    if (submitted) next.textContent = txt('exam submitted');
    else if (!last) next.textContent = txt('next') + ' →';
    else if (!exam) next.textContent = txt('see the result');
    else if (confirming) next.textContent = txt('Submit with') + ' ' + blank + ' ' + txt('blank');
    else next.textContent = txt('Submit the exam');
    next.classList.toggle('wz-warn', confirming && !submitted);
  }

  /* The elements are KEPT, not recreated. Going to question 3 and back to 1 has
     to give 1 back as it was — with the answer ticked and the verdict in sight.
     Rebuilding would erase that, and the student would think they lost work. */
  const screens = exercises.map(() => null);

  /* `ctx` can be a single context (one lesson's assessment) or one per exercise
     (the redo screen, which gathers exercises from different lessons and has to
     store each answer against the lesson it came from). */
  const contextFor = (i) => (Array.isArray(ctx) ? ctx[i] : ctx);

  function show(i) {
    current = i;
    if (!screens[i]) screens[i] = buildExercise(exercises[i], contextFor(i), i, { prova: exam });
    stage.textContent = '';
    stage.appendChild(screens[i]);
    paintHeader();
  }

  function finish() {
    const right = states.filter((s) => s.correct === true).length;
    const unchecked = states.filter((s) => s.answered && s.correct === null).length;
    const unanswered = states.filter((s) => !s.answered).length;

    /* The exam OPENS here: every answered question reveals the verdict that was
       held back, and answering stops being possible. It is the line between
       measuring and teaching — before it the exam measures, after it it
       teaches. */
    if (exam) {
      submitted = true;
      screens.forEach((t) => {
        if (!t) return;
        if (t.revealExam) t.revealExam();
        t.querySelectorAll('.ex-responder, input, textarea, select, button').forEach((b) => { b.disabled = true; });
      });
    }

    stage.textContent = '';
    const r = document.createElement('div');
    r.className = 'wz-result';
    const grade = options.onSubmit
      ? options.onSubmit({ right, unchecked, unanswered, states })
      : null;
    r.innerHTML =
      (grade ? grade.html : '') +
      (grade ? '' : '<span class="wz-res-label">' + txt('result') + '</span>' +
        '<p class="wz-res-score"><strong>' + right + '</strong>/' + exercises.length + ' ' + txt('correct') + '</p>') +
      (unchecked ? '<p class="wz-res-note">' + unchecked + ' ' + txt('are waiting to be checked on the server.') + '</p>' : '') +
      (unanswered ? '<p class="wz-res-note">' + unanswered + ' ' + txt('unanswered.') + '</p>' : '') +
      '<button type="button" class="btn btn-ghost wz-voltar">' +
        txt(exam ? 'Review the exam question by question' : 'Review the questions') + '</button>';
    stage.appendChild(r);
    r.querySelector('.wz-voltar').addEventListener('click', () => show(0));
    el.querySelector('.wz-depois').disabled = true;
    paintHeader();
    el.dispatchEvent(new CustomEvent('assessment:concluida', {
      bubbles: true,
      detail: { lastCorrect: right, total: exercises.length },
    }));
  }

  el.addEventListener('exercise:answered', (e) => {
    states[current] = { answered: true, correct: e.detail.v.correct };
    paintHeader();
  });
  el.addEventListener('exercise:redone', () => {
    states[current] = { answered: false, correct: null };
    screens[current] = stage.firstElementChild;   // "try again" swaps the element
    paintHeader();
  });

  dots.addEventListener('click', (e) => {
    const b = e.target.closest('.wz-dot');
    if (b) show(Number(b.dataset.ir));
  });
  el.querySelector('.wz-antes').addEventListener('click', () => show(Math.max(0, current - 1)));
  el.querySelector('.wz-depois').addEventListener('click', () => {
    if (current !== exercises.length - 1) { confirming = false; show(current + 1); return; }
    /* Submitting with blank questions asks for a second click. It is not a
       modal: the button itself says how many are left and what will happen.
       Submitting without noticing that three were missed is the expensive
       mistake on this screen — after submitting there is no way back. */
    const blank = states.filter((s) => !s.answered).length;
    if (exam && blank && !confirming) { confirming = true; paintHeader(); return; }
    finish();
  });

  show(0);
  return el;
}
