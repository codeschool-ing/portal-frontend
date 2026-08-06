/* ==========================================================================
   Performance — the data the portal was already keeping and never showed.

   Every answer records attempts, whether it was right, and whether it was ever
   checked. That existed from day one and died there: the student answered, saw
   the verdict and never met it again. This screen closes the loop.

   THREE STATES, NOT TWO. "Got it wrong" and "nobody checked" cannot become the
   same bar: the types that need a server (`code`, `expected-output`,
   `expression-answer`) answer `correct: null` while there is no execution, and
   counting them as mistakes would invent a failure that never happened. It is
   the funnel's rule, from the other side: there, unjudged never becomes passed;
   here, unjudged never becomes failed.
   ========================================================================== */

import { courseLessons, courseById } from '../catalog.js';
import { answersGiven } from '../state.js';
import { bar, empty } from './common.js';
import { esc } from '../text.js';

/* Joins what the student answered with the matching exercise. The `id` is the
   stable key — that is what it exists for. */
export function answersWithExercise() {
  const byId = {};
  (window.SAMPLE_EXERCISES || []).forEach((e) => { byId[e.id] = e; });
  return answersGiven()
    .map((r) => ({ ...r, ex: byId[r.exId] }))
    .filter((r) => r.ex);
}

export const wrongOnes = () => answersWithExercise().filter((r) => r.checked && !r.correct);

export default async function performance() {
  const el = document.createElement('div');
  el.className = 'tela tela-desempenho';
  const all = answersWithExercise();

  if (!all.length) {
    return {
      title: txt('Desempenho'),
      el: empty(txt('Você ainda não respondeu nenhum exercício. Faça uma avaliação e volte aqui.')),
    };
  }

  const checked = all.filter((r) => r.checked);
  const right = checked.filter((r) => r.correct).length;
  const pending = all.length - checked.length;
  const pct = checked.length ? Math.round((right / checked.length) * 100) : 0;
  const attempts = all.reduce((s, r) => s + r.attempts, 0);

  const groupBy = (key) => {
    const m = {};
    checked.forEach((r) => {
      const k = key(r);
      m[k] = m[k] || { total: 0, lastCorrect: 0 };
      m[k].total += 1;
      if (r.correct) m[k].lastCorrect += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  };

  const row = (label, d) => {
    const p = Math.round((d.lastCorrect / d.total) * 100);
    return '<div class="dsp-linha">' +
      '<span class="dsp-rot">' + esc(label) + '</span>' +
      bar(p, d.lastCorrect + ' de ' + d.total) +
      '<span class="dsp-num">' + d.lastCorrect + '/' + d.total + '</span>' +
    '</div>';
  };

  const wrong = wrongOnes();

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Como você está indo') + '</h1>' +
    '</header>' +

    '<section class="bloco">' +
      '<div class="trilha-numeros">' +
        '<span><b>' + pct + '%</b>' + txt('de acerto') + '</span>' +
        '<span><b>' + right + '/' + checked.length + '</b>' + txt('exercícios conferidos') + '</span>' +
        '<span><b>' + attempts + '</b>' + txt('tentativas') + '</span>' +
        (pending ? '<span><b>' + pending + '</b>' + txt('aguardando o servidor') + '</span>' : '') +
      '</div>' +
      bar(pct, pct + '%') +
      (pending
        ? '<p class="conta-nota mono dim">' +
            txt('Os tipos que precisam de execução ainda não são conferidos, e por isso não entram na taxa.') +
          '</p>'
        : '') +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Por tipo de exercício') + '</h2></div>' +
      groupBy((r) => r.ex.type).map(([k, d]) => row(txt(k), d)).join('') +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Por curso') + '</h2></div>' +
      groupBy((r) => r.courseId).map(([k, d]) => row(courseById(k)?.name || k, d)).join('') +
    '</section>' +

    (wrong.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo">' +
            '<h2>' + txt('O que você errou') + '</h2>' +
            '<a class="btn btn-primary" href="#/refazer">' +
              (wrong.length === 1
                ? txt('Refazer o que você errou')
                : txt('Refazer os') + ' ' + wrong.length + ' ' + txt('errados')) + ' →</a>' +
          '</div>' +
          '<ul class="dsp-errados">' +
            wrong.map((r) => {
              const a = courseLessons(r.courseId)[r.lessonIx];
              const c = courseById(r.courseId);
              return '<li><a href="#/curso/' + esc(r.courseId) + '/aula/' + r.lessonIx + '/avaliacao">' +
                '<span class="de-tipo">' + txt(r.ex.type) + '</span>' +
                '<span class="de-enunciado">' + esc(r.ex.prompt) + '</span>' +
                '<span class="de-onde">' + esc(c ? c.name : r.courseId) + (a ? ' · ' + esc(a.title) : '') + '</span>' +
              '</a></li>';
            }).join('') +
          '</ul>' +
        '</section>'
      : '<section class="bloco"><p class="vazio">' + txt('Nenhum erro pendente. Bom trabalho.') + '</p></section>');

  return { title: txt('Desempenho'), el };
}
