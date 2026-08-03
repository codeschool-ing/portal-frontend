/* ==========================================================================
   Curso — a ementa que a vitrine mostra, mais a lista de aulas.

   AULA = TÓPICO. O catálogo não tem conceito de aula; o grão mais fino é
   `topicos`, e os exercícios do pipeline já são indexados pelo texto do
   tópico. Inventar uma terceira chave aqui criaria um mapeamento para manter
   sincronizado com duas pontas que já concordam entre si.
   ========================================================================== */

import { aulasDoCurso, cursoPorId, trilhasDoCurso, depoisDe } from '../catalogo.js';
import { secoesDaAula } from '../aulas.js';
import { progressoDoCurso, progressoDaAula, aulaConcluida } from '../estado.js';
import { estadoDoCurso } from '../grafo.js';
import { barra, vazio } from './comum.js';
import { esc, marcado } from '../texto.js';

export default async function curso({ id }) {
  const c = cursoPorId(id);
  if (!c) return { titulo: txt('Curso'), el: vazio(txt('Curso não encontrado.')) };

  const aulas = aulasDoCurso(id);
  const p = progressoDoCurso(id);
  const est = estadoDoCurso(id);
  const abre = depoisDe(id);

  const el = document.createElement('div');
  el.className = 'tela tela-curso';

  el.innerHTML =
    '<header class="curso-head">' +
      '<span class="no-estado" data-estado="' + est + '">' + txt({
        concluido: 'concluído', atual: 'em andamento', disponivel: 'disponível', adiante: 'mais adiante',
      }[est]) + '</span>' +
      '<h1>' + esc(c.nome) + '</h1>' +
      '<p class="curso-resumo">' + esc(c.resumo) + '</p>' +
      '<div class="curso-meta">' +
        '<span>' + c.horas + 'h</span>' +
        '<span>' + txt(c.nivel) + '</span>' +
        '<span>' + aulas.length + ' ' + txt('aulas') + '</span>' +
        '<span>' + txt('em') + ' ' + trilhasDoCurso(id).length + ' ' + txt('trilhas') + '</span>' +
      '</div>' +
      barra(p.pct, p.feitas + ' de ' + p.total) +
      '<p class="curso-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções concluídas') + '</p>' +
    '</header>' +

    '<div class="curso-colunas">' +
      '<section class="bloco">' +
        '<div class="bloco-topo"><h2>' + txt('Aulas') + '</h2></div>' +
        '<ol class="aulas">' +
          aulas.map((a) => {
            const feita = aulaConcluida(id, a.ix);
            const secoes = secoesDaAula(id, a.chave);
            const pa = progressoDaAula(id, a.ix);
            const temAval = secoes.some((s) => s.tipo === 'avaliacao');
            return '<li><a class="aula-linha' + (feita ? ' feita' : '') + '" ' +
              'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(secoes[0].id) + '">' +
              '<span class="aula-marca" aria-hidden="true">' + (feita ? '✓' : '') + '</span>' +
              '<span class="aula-num">' + String(a.ix + 1).padStart(2, '0') + '</span>' +
              '<span class="aula-tit">' + esc(a.titulo) + '</span>' +
              '<span class="aula-secoes">' +
                (secoes.length > 1 ? secoes.length + ' ' + txt('seções') : txt('1 seção')) +
                (temAval ? ' · ' + txt('com avaliação') : '') +
              '</span>' +
              '<span class="aula-prog">' + pa.feitas + '/' + pa.total + '</span>' +
            '</a></li>';
          }).join('') +
        '</ol>' +
      '</section>' +

      '<aside class="curso-lado">' +
        (c.ementa?.length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Ementa') + '</h2></div>' +
            '<ul class="ementa">' + c.ementa.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul></section>'
          : '') +
        (c.requisitos
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Pré-requisitos') + '</h2></div>' +
            '<p class="requisitos">' + marcado(c.requisitos) + '</p></section>'
          : '') +
        ((c.depende || []).length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Depois de') + '</h2></div>' +
            '<div class="ligados">' + c.depende.map((d) => elo(d, 'antes')).join('') + '</div></section>'
          : '') +
        (abre.length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Abre caminho para') + '</h2></div>' +
            '<div class="ligados">' + abre.map((x) => elo(x.id, 'depois')).join('') + '</div></section>'
          : '') +
      '</aside>' +
    '</div>';

  return { titulo: c.nome, el };
}

function elo(id, dir) {
  const c = cursoPorId(id);
  if (!c) return '';
  return '<a class="elo elo-' + dir + '" href="#/curso/' + esc(id) + '">' + esc(c.nome) + '</a>';
}
