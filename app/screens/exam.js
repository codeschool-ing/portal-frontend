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
  el.className = 'tela tela-prova';

  if (!exam.items.length) {
    el.innerHTML =
      '<header class="tela-head">' +
        '<h1>' + txt('Prova') + ' · ' + esc(exam.title) + '</h1>' +
      '</header>' +
      '<section class="bloco aval-pendente"><p class="mono dim">' +
        txt('[prova em preparação — este curso ainda não tem exercícios produzidos]') +
      '</p></section>';
    return el;
  }

  el.innerHTML =
    '<nav class="migalhas">' +
      '<a href="' + exam.backTo + '">' + esc(exam.title) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt(exam.scope === 'track' ? 'prova da trilha' : 'prova final') + '</span>' +
    '</nav>' +

    '<header class="tela-head">' +
      '<h1>' + txt(exam.scope === 'track' ? 'Prova da trilha' : 'Prova final do curso') + '</h1>' +
      '<p>' + esc(exam.title) + '</p>' +
    '</header>' +

    '<section class="bloco prova-regras">' +
      '<ul class="prosa-lista">' +
        '<li>' + exam.items.length + ' ' + txt('questões, sorteadas do banco do') + ' ' +
          txt(exam.scope === 'track' ? 'conjunto de cursos da trilha.' : 'curso.') + '</li>' +
        '<li>' + txt('O resultado de cada questão só aparece no fim — aqui a prova mede, não ensina.') + '</li>' +
        '<li>' + txt('Mínimo para passar:') + ' <strong>' + PASS_MARK + '%</strong>.</li>' +
        '<li>' + txt('Refazer sorteia uma prova diferente. Vale o melhor resultado.') + '</li>' +
      '</ul>' +
      (previous
        ? '<p class="prova-antes' + (previous.passed ? ' passou' : '') + '">' +
            (previous.passed ? '✓ ' + txt('Você já passou nesta prova.') : txt('Sua melhor nota até agora:')) +
            ' <strong>' + previous.best + '%</strong> ' +
            txt('em') + ' ' + previous.attempts + ' ' +
            txt(previous.attempts === 1 ? 'tentativa' : 'tentativas') + '.' +
          '</p>'
        : '') +
      (ready
        ? ''
        : '<p class="prova-aviso">' +
            txt('Você concluiu') + ' <strong>' + progress.pct + '%</strong> ' +
            txt('do conteúdo. A prova não tranca — mas cobre o material inteiro.') +
          '</p>') +
    '</section>' +

    '<section class="bloco prova-palco"></section>';

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
        '<span class="wz-res-rot">' + txt(n.passed ? 'aprovado' : 'ainda não') + '</span>' +
        '<p class="wz-res-nota prova-nota' + (n.passed ? ' passou' : ' faltou') + '">' +
          '<strong>' + n.pct + '%</strong>' +
        '</p>' +
        '<p class="wz-res-obs">' + n.lastCorrect + ' ' + txt('de') + ' ' + n.judged + ' ' +
          txt('questões corrigidas') + ' · ' + txt('mínimo') + ' ' + PASS_MARK + '%</p>' +
        (n.passed
          ? '<p class="wz-res-obs">' + txt('O certificado sai na tela de Certificados.') + '</p>'
          : '<p class="wz-res-obs">' + txt('Refaça quando quiser: a próxima prova é sorteada de novo.') + '</p>'),
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
  if (!c) return { title: txt('Prova'), el: empty(txt('Curso não encontrado.')) };
  const exam = courseExam(id, examAttempts('course:' + id));
  return { title: txt('Prova') + ' · ' + c.name, el: build(exam, courseProgress(id)) };
}

export async function trackExamScreen() {
  const t = studentTrack();
  if (!t) return { title: txt('Prova'), el: empty(txt('Você ainda não escolheu uma trilha.')) };
  const exam = trackExam(t, activeOption, examAttempts('track:' + t.id));
  return { title: txt('Prova') + ' · ' + t.name, el: build(exam, trackProgress(t)) };
}

/* The card that announces the exam, at the end of the course page and of the
   track page. It is the same piece in both places because it is the same
   promise. */
export function examCard({ key, href, scope, count, progress }) {
  const r = examResult(key);
  const state = r?.passed ? 'passou' : (r ? 'tentou' : 'novo');
  return '<section class="bloco prova-cartao ' + state + '">' +
    '<div class="prova-cartao-texto">' +
      '<span class="prova-cartao-rot mono">' +
        txt(scope === 'track' ? 'fim da trilha' : 'fim do curso') + '</span>' +
      '<h2>' + txt(scope === 'track' ? 'Prova da trilha' : 'Prova final') + '</h2>' +
      '<p>' + count + ' ' + txt('questões sorteadas') + ' · ' + txt('mínimo') + ' ' + PASS_MARK + '% · ' +
        txt('resultado só no fim') + '</p>' +
      (r
        ? '<p class="prova-cartao-nota' + (r.passed ? ' passou' : '') + '">' +
            (r.passed ? '✓ ' + txt('aprovado com') : txt('melhor nota:')) + ' ' + r.best + '%</p>'
        : '') +
    '</div>' +
    '<div class="prova-cartao-acao">' +
      (progress !== undefined ? bar(progress, progress + '%') : '') +
      '<a class="btn btn-primary" href="' + href + '">' +
        txt(r ? 'Refazer a prova' : 'Fazer a prova') + ' →</a>' +
    '</div>' +
  '</section>';
}
