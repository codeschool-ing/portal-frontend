/* ==========================================================================
   Minhas notas — tudo o que o aluno escreveu, num lugar só.

   A nota é a única coisa do portal que não veio do catálogo nem do pipeline:
   ela é do aluno. Por isso ela merece uma tela própria em vez de ficar
   espalhada pelas seções onde foi escrita — na hora de revisar, ninguém lembra
   em qual seção anotou o quê.

   Elas também entram na busca global, no grupo "suas notas".
   ========================================================================== */

import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { secoesDaAula } from '../aulas.js';
import { todasAsNotas } from '../estado.js';
import { vazio } from './comum.js';
import { esc } from '../texto.js';

export default async function notas() {
  const lista = todasAsNotas();
  if (!lista.length) {
    return {
      titulo: txt('Notas'),
      el: vazio(txt('Você ainda não escreveu nenhuma nota. Elas ficam no fim de cada seção.')),
    };
  }

  /* Agrupadas por curso: é assim que se procura uma anotação — "aquilo que eu
     escrevi em HTML e CSS" —, não por data. */
  const porCurso = {};
  lista.forEach((n) => { (porCurso[n.cursoId] = porCurso[n.cursoId] || []).push(n); });

  const el = document.createElement('div');
  el.className = 'tela tela-notas';
  el.innerHTML =
    '<header class="tela-head">' +
      '<span class="tag">// ' + txt('notas') + '</span>' +
      '<h1>' + txt('Suas anotações') + '</h1>' +
      '<p>' + lista.length + ' ' + (lista.length === 1 ? txt('nota') : txt('notas')) + '</p>' +
    '</header>' +
    Object.entries(porCurso).map(([cursoId, doCurso]) => {
      const c = cursoPorId(cursoId);
      const aulas = aulasDoCurso(cursoId);
      return '<section class="bloco">' +
        '<div class="bloco-topo">' +
          '<h2>' + esc(c ? c.nome : cursoId) + '</h2>' +
          '<a class="bloco-link" href="#/curso/' + esc(cursoId) + '">' + txt('abrir o curso') + ' →</a>' +
        '</div>' +
        doCurso.map((n) => {
          const a = aulas[n.aulaIx];
          const s = a && secoesDaAula(cursoId, a.chave).find((x) => x.id === n.secId);
          return '<article class="nota-item">' +
            '<a class="nota-onde" href="#/curso/' + esc(cursoId) + '/aula/' + n.aulaIx + '/' + esc(n.secId) + '">' +
              (a ? esc(a.titulo) : '') + (s ? ' · ' + esc(s.titulo) : '') + ' →' +
            '</a>' +
            '<p class="nota-texto">' + esc(n.texto) + '</p>' +
          '</article>';
        }).join('') +
      '</section>';
    }).join('');

  return { titulo: txt('Notas'), el };
}
