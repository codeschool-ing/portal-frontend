/* ==========================================================================
   Pedaços que mais de uma tela usa.

   Existe para que dois lugares não calculem o mesmo número de dois jeitos —
   é o mesmo motivo pelo qual o terminal da vitrine lê `CURSOS` em vez de ter
   as respostas escritas à mão: nenhuma tela pode contradizer a outra, porque
   todas leem a mesma fonte.
   ========================================================================== */

import { aulasDoCurso, cursoPorId, trilhaPorId, caminhoDaTrilha } from '../catalogo.js';
import { progressoDoCurso, opcaoAtiva, agora } from '../estado.js';
import { esc } from '../texto.js';

export const FAMILIAS = ['carreira', 'tecnologia'];

export const TRILHAS_POR_FAMILIA = () =>
  FAMILIAS.map((f) => [f, TRILHAS.filter((t) => (t.familia || 'carreira') === f)]);

/* Progresso de uma trilha inteira, contado em AULAS e não em cursos: um curso
   de 48 tópicos e um de 11 não valem o mesmo, e contar cursos faria a barra
   pular de um jeito que não corresponde ao esforço. */
export function progressoDaTrilha(t) {
  const caminho = caminhoDaTrilha(t, opcaoAtiva);
  let feitas = 0, total = 0;
  caminho.forEach((id) => {
    const n = aulasDoCurso(id).length;
    total += n;
    feitas += progressoDoCurso(id, n).feitas;
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

export function cartaoAula(cursoId, aula, estado) {
  const c = cursoPorId(cursoId);
  return '<a class="aula-item ' + (estado || '') + '" href="#/curso/' + esc(cursoId) + '/aula/' + aula.ix + '">' +
    '<span class="aula-num">' + String(aula.ix + 1).padStart(2, '0') + '</span>' +
    '<span class="aula-tit">' + esc(aula.titulo) + '</span>' +
    '<span class="aula-curso">' + esc(c ? c.nome : cursoId) + '</span>' +
  '</a>';
}

export function vazio(mensagem) {
  const el = document.createElement('div');
  el.className = 'tela tela-vazia';
  el.innerHTML = '<p class="vazio">' + esc(mensagem) + '</p>';
  return el;
}
