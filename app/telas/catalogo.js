/* ==========================================================================
   Catálogo — os 86 cursos, com busca e filtro por categoria.

   As categorias não são uma lista fixa: saem do próprio `dados.js`, como na
   vitrine. Curso novo com categoria nova aparece sozinho no filtro.
   ========================================================================== */

import { aulasDoCurso } from '../catalogo.js';
import { progressoDoCurso } from '../estado.js';
import { estadoDoCurso } from '../grafo.js';
import { barra } from './comum.js';
import { esc } from '../texto.js';

export default async function catalogo() {
  const el = document.createElement('div');
  el.className = 'tela tela-catalogo';

  const categorias = ['todas', ...new Set(CURSOS.map((c) => c.categoria))];

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Todos os cursos') + '</h1>' +
    '</header>' +
    '<div class="filtros">' +
      '<div class="busca">' +
        '<span class="busca-ico" aria-hidden="true">⌕</span>' +
        '<input type="search" id="cat-busca" placeholder="' + txt('buscar curso...') + '" aria-label="' + txt('Buscar curso') + '" />' +
      '</div>' +
      '<div class="chips" id="cat-chips" role="group">' +
        categorias.map((k, i) =>
          '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-cat="' + esc(k) + '">' +
            txt(k) + '</button>').join('') +
      '</div>' +
    '</div>' +
    '<div class="cartoes" id="cat-grade"></div>' +
    '<p class="vazio" id="cat-vazio" hidden>' + txt('nenhum curso encontrado — tente outro termo.') + '</p>';

  const grade = el.querySelector('#cat-grade');
  const campo = el.querySelector('#cat-busca');
  let categoria = 'todas';

  function pintar() {
    const termo = campo.value.trim().toLowerCase();
    const lista = CURSOS.filter((c) => {
      if (categoria !== 'todas' && c.categoria !== categoria) return false;
      if (!termo) return true;
      // busca em nome, resumo, ementa e tópicos — como na vitrine
      const alvo = [c.nome, c.resumo, ...(c.ementa || []), ...(c.topicos || [])].join(' ').toLowerCase();
      return alvo.includes(termo);
    });

    grade.innerHTML = lista.map((c) => {
      const aulas = aulasDoCurso(c.id).length;
      const p = progressoDoCurso(c.id);
      const est = estadoDoCurso(c.id);
      return '<a class="cartao no-' + est + '" href="#/curso/' + esc(c.id) + '">' +
        '<span class="cartao-cat">' + esc(c.categoria) + '</span>' +
        '<span class="cartao-nome">' + esc(c.nome) + '</span>' +
        '<span class="cartao-resumo">' + esc(c.resumo) + '</span>' +
        '<span class="cartao-meta">' + c.horas + 'h · ' + txt(c.nivel) + ' · ' + aulas + ' ' + txt('aulas') + '</span>' +
        (p.feitas ? barra(p.pct, p.feitas + ' de ' + p.total) : '') +
      '</a>';
    }).join('');
    el.querySelector('#cat-vazio').hidden = lista.length > 0;
  }

  campo.addEventListener('input', pintar);
  el.querySelector('#cat-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    categoria = b.dataset.cat;
    el.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
    pintar();
  });

  pintar();
  return { titulo: txt('Catálogo'), el };
}
