/* ==========================================================================
   Refazer o que errou.

   Monta o mesmo wizard da avaliação com os exercícios que o aluno errou, de
   qualquer curso. É a única tela do portal que reúne conteúdo de aulas
   diferentes, e faz sentido porque o critério aqui não é o currículo — é o
   erro.

   O CONTEXTO DE CADA EXERCÍCIO É PRESERVADO. O wizard grava a resposta em
   `progresso[curso].aulas[ix]`, então cada um precisa voltar com o curso e a
   aula de onde veio; passar um contexto único faria o acerto ser registrado na
   aula errada, e o desempenho passaria a mentir sobre onde a pessoa melhorou.
   ========================================================================== */

import { montarAvaliacao } from '../exercicios/index.js';
import { errados } from './desempenho.js';
import { vazio } from './comum.js';

export default async function refazer() {
  const lista = errados();
  if (!lista.length) {
    return { titulo: txt('Refazer'), el: vazio(txt('Não há nada errado para refazer.')) };
  }

  const el = document.createElement('div');
  el.className = 'tela tela-refazer';
  el.innerHTML =
    '<header class="tela-head">' +
      '<span class="tag">// ' + txt('refazer') + '</span>' +
      '<h1>' + txt('Os que você errou') + '</h1>' +
      '<p>' + lista.length + ' ' + (lista.length === 1
        ? txt('exercício, do curso em que você respondeu.')
        : txt('exercícios, de todos os cursos em que você respondeu.')) + '</p>' +
    '</header>' +
    '<section class="bloco"></section>';

  /* Um contexto por exercício, e não um só para o wizard inteiro: cada resposta
     tem de ser gravada na aula de origem. */
  const ctxPorIndice = lista.map((r) => ({ cursoId: r.cursoId, aulaIx: r.aulaIx }));
  el.querySelector('.bloco').appendChild(
    montarAvaliacao(lista.map((r) => r.ex), ctxPorIndice),
  );

  return { titulo: txt('Refazer'), el };
}
