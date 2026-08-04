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
  const previous = examResult(exam.chave);
  const attempt = examAttempts(exam.chave);
  const ready = progress.pct >= 100;

  const el = document.createElement('div');
  el.className = 'tela tela-prova';

  if (!exam.itens.length) {
    el.innerHTML =
      '<header class="tela-head">' +
        '<h1>' + txt('Prova') + ' · ' + esc(exam.titulo) + '</h1>' +
      '</header>' +
      '<section class="bloco aval-pendente"><p class="mono dim">' +
        txt('[prova em preparação — este curso ainda não tem exercícios produzidos]') +
      '</p></section>';
    return el;
  }

  el.innerHTML =
    '<nav class="migalhas">' +
      '<a href="' + exam.voltarPara + '">' + esc(exam.titulo) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt(exam.escopo === 'trilha' ? 'prova da trilha' : 'prova final') + '</span>' +
    '</nav>' +

    '<header class="tela-head">' +
      '<h1>' + txt(exam.escopo === 'trilha' ? 'Prova da trilha' : 'Prova final do curso') + '</h1>' +
      '<p>' + esc(exam.titulo) + '</p>' +
    '</header>' +

    '<section class="bloco prova-regras">' +
      '<ul class="prosa-lista">' +
        '<li>' + exam.itens.length + ' ' + txt('questões, sorteadas do banco do') + ' ' +
          txt(exam.escopo === 'trilha' ? 'conjunto de cursos da trilha.' : 'curso.') + '</li>' +
        '<li>' + txt('O resultado de cada questão só aparece no fim — aqui a prova mede, não ensina.') + '</li>' +
        '<li>' + txt('Mínimo para passar:') + ' <strong>' + PASS_MARK + '%</strong>.</li>' +
        '<li>' + txt('Refazer sorteia uma prova diferente. Vale o melhor resultado.') + '</li>' +
      '</ul>' +
      (previous
        ? '<p class="prova-antes' + (previous.aprovado ? ' passou' : '') + '">' +
            (previous.aprovado ? '✓ ' + txt('Você já passou nesta prova.') : txt('Sua melhor nota até agora:')) +
            ' <strong>' + previous.melhor + '%</strong> ' +
            txt('em') + ' ' + previous.tentativas + ' ' +
            txt(previous.tentativas === 1 ? 'tentativa' : 'tentativas') + '.' +
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
  const onSubmit = ({ estados }) => {
    const n = examScore(estados);
    saveExam(exam.chave, {
      pct: n.pct, aprovado: n.aprovado, certos: n.certos, total: n.julgadas,
    });
    return {
      html:
        '<span class="wz-res-rot">' + txt(n.aprovado ? 'aprovado' : 'ainda não') + '</span>' +
        '<p class="wz-res-nota prova-nota' + (n.aprovado ? ' passou' : ' faltou') + '">' +
          '<strong>' + n.pct + '%</strong>' +
        '</p>' +
        '<p class="wz-res-obs">' + n.certos + ' ' + txt('de') + ' ' + n.julgadas + ' ' +
          txt('questões corrigidas') + ' · ' + txt('mínimo') + ' ' + PASS_MARK + '%</p>' +
        (n.aprovado
          ? '<p class="wz-res-obs">' + txt('O certificado sai na tela de Certificados.') + '</p>'
          : '<p class="wz-res-obs">' + txt('Refaça quando quiser: a próxima prova é sorteada de novo.') + '</p>'),
    };
  };

  el.querySelector('.prova-palco').appendChild(
    buildAssessment(
      exam.itens.map((i) => i.ex),
      exam.itens.map((i) => i.ctx),
      { prova: true, aoEntregar: onSubmit },
    ),
  );

  return el;
}

export async function courseExamScreen({ id }) {
  const c = courseById(id);
  if (!c) return { title: txt('Prova'), el: empty(txt('Curso não encontrado.')) };
  const exam = courseExam(id, examAttempts('curso:' + id));
  return { title: txt('Prova') + ' · ' + c.nome, el: build(exam, courseProgress(id)) };
}

export async function trackExamScreen() {
  const t = studentTrack();
  if (!t) return { title: txt('Prova'), el: empty(txt('Você ainda não escolheu uma trilha.')) };
  const exam = trackExam(t, activeOption, examAttempts('trilha:' + t.id));
  return { title: txt('Prova') + ' · ' + t.nome, el: build(exam, trackProgress(t)) };
}

/* The card that announces the exam, at the end of the course page and of the
   track page. It is the same piece in both places because it is the same
   promise. */
export function examCard({ chave, href, escopo, quantas, progresso }) {
  const r = examResult(chave);
  const state = r?.aprovado ? 'passou' : (r ? 'tentou' : 'novo');
  return '<section class="bloco prova-cartao ' + state + '">' +
    '<div class="prova-cartao-texto">' +
      '<span class="prova-cartao-rot mono">' +
        txt(escopo === 'trilha' ? 'fim da trilha' : 'fim do curso') + '</span>' +
      '<h2>' + txt(escopo === 'trilha' ? 'Prova da trilha' : 'Prova final') + '</h2>' +
      '<p>' + quantas + ' ' + txt('questões sorteadas') + ' · ' + txt('mínimo') + ' ' + PASS_MARK + '% · ' +
        txt('resultado só no fim') + '</p>' +
      (r
        ? '<p class="prova-cartao-nota' + (r.aprovado ? ' passou' : '') + '">' +
            (r.aprovado ? '✓ ' + txt('aprovado com') : txt('melhor nota:')) + ' ' + r.melhor + '%</p>'
        : '') +
    '</div>' +
    '<div class="prova-cartao-acao">' +
      (progresso !== undefined ? bar(progresso, progresso + '%') : '') +
      '<a class="btn btn-primary" href="' + href + '">' +
        txt(r ? 'Refazer a prova' : 'Fazer a prova') + ' →</a>' +
    '</div>' +
  '</section>';
}
