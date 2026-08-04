/* ==========================================================================
   Pedaços que mais de uma tela usa.

   Existe para que dois lugares não calculem o mesmo número de dois jeitos —
   é o mesmo motivo pelo qual o terminal da vitrine lê `CURSOS` em vez de ter
   as respostas escritas à mão: nenhuma tela pode contradizer a outra, porque
   todas leem a mesma fonte.
   ========================================================================== */

import { trilhaPorId, caminhoDaTrilha } from '../catalogo.js';
import { courseProgress as progressoDoCurso, activeOption as opcaoAtiva, now as agora } from '../state.js';
import { esc } from '../text.js';

export const FAMILIAS = ['carreira', 'tecnologia'];

export const TRILHAS_POR_FAMILIA = () =>
  FAMILIAS.map((f) => [f, TRILHAS.filter((t) => (t.familia || 'carreira') === f)]);

/* Progresso de uma trilha inteira, contado em SEÇÕES e não em cursos nem em
   aulas: um curso de 48 tópicos e um de 11 não valem o mesmo, e uma aula pode
   ter uma seção ou seis. A seção é a menor unidade de trabalho real, e é a
   única que faz a barra andar proporcionalmente ao esforço. */
export function progressoDaTrilha(t) {
  const caminho = caminhoDaTrilha(t, opcaoAtiva);
  let feitas = 0, total = 0;
  caminho.forEach((id) => {
    const p = progressoDoCurso(id);
    total += p.total;
    feitas += p.feitas;
  });
  return { feitas, total, pct: total ? Math.round((feitas / total) * 100) : 0, cursos: caminho.length };
}

export function barra(pct, rotulo) {
  return '<span class="barra" role="img" aria-label="' + esc(rotulo || pct + '%') + '">' +
    '<span class="barra-cheia" style="width:' + pct + '%"></span></span>';
}

export const trilhaDoAluno = () => {
  const m = agora().matricula;
  return m ? trilhaPorId(m.trilhaId) : null;
};

export function vazio(mensagem) {
  const el = document.createElement('div');
  el.className = 'tela tela-vazia';
  el.innerHTML = '<p class="vazio">' + esc(mensagem) + '</p>';
  return el;
}
