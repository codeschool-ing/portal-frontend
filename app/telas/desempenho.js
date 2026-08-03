/* ==========================================================================
   Desempenho — o dado que o portal já guardava e nunca mostrava.

   Cada resposta grava tentativas, acerto e se chegou a ser conferida. Isso
   existia desde o primeiro dia e morria ali: o aluno respondia, via o veredito
   e nunca mais reencontrava aquilo. Esta tela fecha o ciclo.

   TRÊS ESTADOS, NÃO DOIS. "Errou" e "ninguém conferiu" não podem virar a mesma
   barra: os tipos que precisam de servidor (`codigo`, `saida-esperada`,
   `resposta-expressao`) respondem `acertou: null` enquanto não houver execução,
   e contá-los como erro inventaria uma reprovação que não aconteceu. É a mesma
   régua do funil, do outro lado: lá, não julgado nunca vira aprovado; aqui, não
   julgado nunca vira reprovado.
   ========================================================================== */

import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { respostasDadas } from '../estado.js';
import { barra, vazio } from './comum.js';
import { esc } from '../texto.js';

/* Junta o que o aluno respondeu com o exercício correspondente. O `id` é a
   chave estável — foi para isto que ele existe. */
export function respostasComExercicio() {
  const porId = {};
  (window.EXERCICIOS_EXEMPLO || []).forEach((e) => { porId[e.id] = e; });
  return respostasDadas()
    .map((r) => ({ ...r, ex: porId[r.exId] }))
    .filter((r) => r.ex);
}

export const errados = () => respostasComExercicio().filter((r) => r.conferido && !r.acertou);

export default async function desempenho() {
  const el = document.createElement('div');
  el.className = 'tela tela-desempenho';
  const tudo = respostasComExercicio();

  if (!tudo.length) {
    return {
      titulo: txt('Desempenho'),
      el: vazio(txt('Você ainda não respondeu nenhum exercício. Faça uma avaliação e volte aqui.')),
    };
  }

  const conferidos = tudo.filter((r) => r.conferido);
  const acertos = conferidos.filter((r) => r.acertou).length;
  const pendentes = tudo.length - conferidos.length;
  const pct = conferidos.length ? Math.round((acertos / conferidos.length) * 100) : 0;
  const tentativas = tudo.reduce((s, r) => s + r.tentativas, 0);

  const agrupar = (chave) => {
    const m = {};
    conferidos.forEach((r) => {
      const k = chave(r);
      m[k] = m[k] || { total: 0, certos: 0 };
      m[k].total += 1;
      if (r.acertou) m[k].certos += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  };

  const linha = (rotulo, d) => {
    const p = Math.round((d.certos / d.total) * 100);
    return '<div class="dsp-linha">' +
      '<span class="dsp-rot">' + esc(rotulo) + '</span>' +
      barra(p, d.certos + ' de ' + d.total) +
      '<span class="dsp-num">' + d.certos + '/' + d.total + '</span>' +
    '</div>';
  };

  const errou = errados();

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Como você está indo') + '</h1>' +
    '</header>' +

    '<section class="bloco">' +
      '<div class="trilha-numeros">' +
        '<span><b>' + pct + '%</b>' + txt('de acerto') + '</span>' +
        '<span><b>' + acertos + '/' + conferidos.length + '</b>' + txt('exercícios conferidos') + '</span>' +
        '<span><b>' + tentativas + '</b>' + txt('tentativas') + '</span>' +
        (pendentes ? '<span><b>' + pendentes + '</b>' + txt('aguardando o servidor') + '</span>' : '') +
      '</div>' +
      barra(pct, pct + '%') +
      (pendentes
        ? '<p class="conta-nota mono dim">' +
            txt('Os tipos que precisam de execução ainda não são conferidos, e por isso não entram na taxa.') +
          '</p>'
        : '') +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Por tipo de exercício') + '</h2></div>' +
      agrupar((r) => r.ex.tipo).map(([k, d]) => linha(txt(k), d)).join('') +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Por curso') + '</h2></div>' +
      agrupar((r) => r.cursoId).map(([k, d]) => linha(cursoPorId(k)?.nome || k, d)).join('') +
    '</section>' +

    (errou.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo">' +
            '<h2>' + txt('O que você errou') + '</h2>' +
            '<a class="btn btn-primary" href="#/refazer">' +
              (errou.length === 1
                ? txt('Refazer o que você errou')
                : txt('Refazer os') + ' ' + errou.length + ' ' + txt('errados')) + ' →</a>' +
          '</div>' +
          '<ul class="dsp-errados">' +
            errou.map((r) => {
              const a = aulasDoCurso(r.cursoId)[r.aulaIx];
              const c = cursoPorId(r.cursoId);
              return '<li><a href="#/curso/' + esc(r.cursoId) + '/aula/' + r.aulaIx + '/avaliacao">' +
                '<span class="de-tipo">' + txt(r.ex.tipo) + '</span>' +
                '<span class="de-enunciado">' + esc(r.ex.enunciado) + '</span>' +
                '<span class="de-onde">' + esc(c ? c.nome : r.cursoId) + (a ? ' · ' + esc(a.titulo) : '') + '</span>' +
              '</a></li>';
            }).join('') +
          '</ul>' +
        '</section>'
      : '<section class="bloco"><p class="vazio">' + txt('Nenhum erro pendente. Bom trabalho.') + '</p></section>');

  return { titulo: txt('Desempenho'), el };
}
