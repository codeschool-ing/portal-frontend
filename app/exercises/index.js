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
     setup(root, {exercicio, concluir})  → optional: event listeners
     collect(root)                       → the answer, or null if unanswered
     reveal(root, ex, verdict)           → marks what was right, AFTERWARDS

   THE `_verificacao` BADGE LEFT THE STUDENT'S SCREEN. It is still in the data
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
  const mod = REGISTRY[ex.tipo];
  const exam = Boolean(options.prova);
  const uid = ex.id || `${ex.curso}:${ex.topico}:${ix}`;
  const el = document.createElement('article');
  el.className = 'ex ex-' + ex.tipo + (exam ? ' ex-prova' : '');
  // the DOM id: answers are stored under it, and it is how you can tell WHICH
  // exercise is on screen without depending on the prompt text
  el.dataset.ex = uid;

  if (!mod) {
    el.innerHTML = '<p class="ex-erro">' + txt('tipo de exercício desconhecido') + ': ' + esc(ex.tipo) + '</p>';
    return el;
  }

  el.innerHTML =
    '<header class="ex-topo">' +
      '<span class="ex-tipo">' + txt(ex.tipo) + '</span>' +
      (ex.dificuldade ? '<span class="ex-dif">' + txt(ex.dificuldade) + '</span>' : '') +
    '</header>' +
    '<p class="ex-enunciado">' + formatted(ex.enunciado) + '</p>' +
    '<div class="ex-corpo">' + mod.body(ex, uid) + '</div>' +
    // the hint is scaffolding for someone learning; in an exam it is a cheat sheet
    (ex.dica_socratica && !exam
      ? '<details class="ex-dica"><summary>' + txt('dica') + '</summary><p>' + formatted(ex.dica_socratica) + '</p></details>'
      : '') +
    '<div class="ex-acoes">' +
      (mod.selfCompleting ? '' : '<button type="button" class="btn btn-primary ex-responder">' +
        txt(exam ? 'Registrar resposta' : 'Responder') + '</button>') +
      (exam ? '' : '<button type="button" class="btn btn-ghost ex-refazer" hidden>' + txt('Tentar de novo') + '</button>') +
    '</div>' +
    '<div class="ex-veredito" aria-live="polite"></div>';

  const body = el.querySelector('.ex-corpo');

  async function check(answer) {
    const out = el.querySelector('.ex-veredito');
    if (answer === null) {
      out.className = 'ex-veredito v-vazio';
      out.textContent = txt('Responda antes de conferir.');
      return;
    }
    const button = el.querySelector('.ex-responder');
    if (button) button.disabled = true;
    out.className = 'ex-veredito v-esperando';
    out.textContent = txt('conferindo…');

    const v = await api.grade(ex, answer);
    if (ctx) saveAnswer(ctx.cursoId, ctx.aulaIx, uid, v);

    if (exam) {
      /* Held back. The element remembers how to reveal itself later — the whole
         exam opens at once when it closes, and the student reviews what they
         answered. */
      out.className = 'ex-veredito v-registrado';
      out.innerHTML = '<strong>' + txt('resposta registrada') + '</strong> ' +
        txt('o resultado sai no fim da prova.');
      el.revelarProva = () => { mod.reveal(body, ex, v); showVerdict(el, ex, v); };
    } else {
      mod.reveal(body, ex, v);
      showVerdict(el, ex, v);
      el.querySelector('.ex-refazer').hidden = false;
    }
    el.dispatchEvent(new CustomEvent('exercicio:respondido', { bubbles: true, detail: { ex, v } }));
  }

  if (mod.setup) mod.setup(body, { exercicio: ex, concluir: check });

  /* "already solved" is useful memory in an assessment and hands over the
     answer key in an exam: the exam draws from the same bank as the lessons, so
     almost every question has been seen before. */
  const previous = !exam && ctx && answerFor(ctx.cursoId, ctx.aulaIx, uid);
  if (previous?.acertou) markAlreadyDone(el, previous);

  const answerButton = el.querySelector('.ex-responder');
  if (answerButton) answerButton.addEventListener('click', () => check(mod.collect(body)));

  const retry = el.querySelector('.ex-refazer');
  if (retry) {
    retry.addEventListener('click', () => {
      const fresh = buildExercise(ex, ctx, ix, options);
      el.replaceWith(fresh);
      fresh.dispatchEvent(new CustomEvent('exercicio:refeito', { bubbles: true }));
    });
  }

  return el;
}

function showVerdict(el, ex, v) {
  const out = el.querySelector('.ex-veredito');

  if (v.acertou === null) {
    /* Unchecked NEVER becomes passed — it is the pipeline's rule and it holds
       whole here: while there is no execution, the portal says it did not
       check. */
    out.className = 'ex-veredito v-pendente';
    out.innerHTML = '<strong>' + txt('não conferido') + '</strong> ' + esc(v.detalhe || '');
    return;
  }

  if (v.acertou) {
    out.className = 'ex-veredito v-certo';
    out.innerHTML = '<strong>' + txt('certo') + '</strong>';
    return;
  }

  out.className = 'ex-veredito v-errado';
  let extra = '';
  if (v.parcial) extra = ' ' + txt('faltou fechar todos os pares.');
  else if (typeof v.erros === 'number' && v.erros > 0) extra = '';
  /* The `armadilha` of an ordering exercise is what the exercise measures:
     which neighbouring pair gets swapped, and why. As feedback it is worth a
     lot; any earlier, it would be the answer. */
  if (ex.tipo === 'ordenacao' && ex.armadilha) {
    extra += '<span class="v-armadilha">' + formatted(ex.armadilha) + '</span>';
  }
  out.innerHTML = '<strong>' + txt('ainda não') + '</strong>' + extra;
}

function markAlreadyDone(el, previous) {
  const out = el.querySelector('.ex-veredito');
  out.className = 'ex-veredito v-antigo';
  out.innerHTML = '<strong>' + txt('já resolvido') + '</strong> ' +
    txt('em') + ' ' + previous.tentativas + ' ' +
    (previous.tentativas === 1 ? txt('tentativa') : txt('tentativas'));
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
  const states = exercises.map(() => ({ respondido: false, acertou: null }));
  let current = 0;
  let submitted = false;
  let confirming = false;

  el.innerHTML =
    '<header class="wz-topo">' +
      '<span class="wz-conta"></span>' +
      '<div class="wz-pontos" role="tablist"></div>' +
    '</header>' +
    '<div class="wz-palco"></div>' +
    '<footer class="wz-pe">' +
      '<button type="button" class="btn btn-ghost wz-antes">← ' + txt('anterior') + '</button>' +
      '<button type="button" class="btn btn-primary wz-depois">' + txt('próxima') + ' →</button>' +
    '</footer>';

  const stage = el.querySelector('.wz-palco');
  const dots = el.querySelector('.wz-pontos');

  function paintHeader() {
    el.querySelector('.wz-conta').textContent =
      txt('questão') + ' ' + (current + 1) + ' ' + txt('de') + ' ' + exercises.length;
    dots.innerHTML = states.map((s, i) => {
      const cls = ['wz-ponto'];
      if (i === current) cls.push('on');
      /* In an exam that is still open the marker says WHETHER it was answered,
         not whether it was right: the colour of a correct answer would be the
         verdict the exam is holding back. */
      if (s.respondido) {
        cls.push(exam && !submitted
          ? 'feito'
          : (s.acertou === true ? 'certo' : (s.acertou === null ? 'pendente' : 'errado')));
      }
      return '<button type="button" class="' + cls.join(' ') + '" data-ir="' + i + '" ' +
        'aria-label="' + txt('questão') + ' ' + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('');
    el.querySelector('.wz-antes').disabled = current === 0;
    const last = current === exercises.length - 1;
    const blank = states.filter((s) => !s.respondido).length;
    const next = el.querySelector('.wz-depois');
    if (submitted) next.textContent = txt('prova entregue');
    else if (!last) next.textContent = txt('próxima') + ' →';
    else if (!exam) next.textContent = txt('ver resultado');
    else if (confirming) next.textContent = txt('Entregar com') + ' ' + blank + ' ' + txt('em branco');
    else next.textContent = txt('Entregar a prova');
    next.classList.toggle('wz-cuidado', confirming && !submitted);
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
    const right = states.filter((s) => s.acertou === true).length;
    const unchecked = states.filter((s) => s.respondido && s.acertou === null).length;
    const unanswered = states.filter((s) => !s.respondido).length;

    /* The exam OPENS here: every answered question reveals the verdict that was
       held back, and answering stops being possible. It is the line between
       measuring and teaching — before it the exam measures, after it it
       teaches. */
    if (exam) {
      submitted = true;
      screens.forEach((t) => {
        if (!t) return;
        if (t.revelarProva) t.revelarProva();
        t.querySelectorAll('.ex-responder, input, textarea, select, button').forEach((b) => { b.disabled = true; });
      });
    }

    stage.textContent = '';
    const r = document.createElement('div');
    r.className = 'wz-resultado';
    const grade = options.aoEntregar
      ? options.aoEntregar({ certos: right, naoConferidos: unchecked, semResposta: unanswered, estados: states })
      : null;
    r.innerHTML =
      (grade ? grade.html : '') +
      (grade ? '' : '<span class="wz-res-rot">' + txt('resultado') + '</span>' +
        '<p class="wz-res-nota"><strong>' + right + '</strong>/' + exercises.length + ' ' + txt('corretas') + '</p>') +
      (unchecked ? '<p class="wz-res-obs">' + unchecked + ' ' + txt('aguardam conferência no servidor.') + '</p>' : '') +
      (unanswered ? '<p class="wz-res-obs">' + unanswered + ' ' + txt('sem resposta.') + '</p>' : '') +
      '<button type="button" class="btn btn-ghost wz-voltar">' +
        txt(exam ? 'Rever a prova questão a questão' : 'Rever as questões') + '</button>';
    stage.appendChild(r);
    r.querySelector('.wz-voltar').addEventListener('click', () => show(0));
    el.querySelector('.wz-depois').disabled = true;
    paintHeader();
    el.dispatchEvent(new CustomEvent('avaliacao:concluida', {
      bubbles: true,
      detail: { certos: right, total: exercises.length },
    }));
  }

  el.addEventListener('exercicio:respondido', (e) => {
    states[current] = { respondido: true, acertou: e.detail.v.acertou };
    paintHeader();
  });
  el.addEventListener('exercicio:refeito', () => {
    states[current] = { respondido: false, acertou: null };
    screens[current] = stage.firstElementChild;   // "try again" swaps the element
    paintHeader();
  });

  dots.addEventListener('click', (e) => {
    const b = e.target.closest('.wz-ponto');
    if (b) show(Number(b.dataset.ir));
  });
  el.querySelector('.wz-antes').addEventListener('click', () => show(Math.max(0, current - 1)));
  el.querySelector('.wz-depois').addEventListener('click', () => {
    if (current !== exercises.length - 1) { confirming = false; show(current + 1); return; }
    /* Submitting with blank questions asks for a second click. It is not a
       modal: the button itself says how many are left and what will happen.
       Submitting without noticing that three were missed is the expensive
       mistake on this screen — after submitting there is no way back. */
    const blank = states.filter((s) => !s.respondido).length;
    if (exam && blank && !confirming) { confirming = true; paintHeader(); return; }
    finish();
  });

  show(0);
  return el;
}
