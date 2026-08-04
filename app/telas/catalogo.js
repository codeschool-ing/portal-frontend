/* ==========================================================================
   Catálogo — os 86 cursos, com busca e filtro por categoria.

   As categorias não são uma lista fixa: saem do próprio `dados.js`, como na
   vitrine. Curso novo com categoria nova aparece sozinho no filtro.
   ========================================================================== */

import {
  courseLessons as aulasDoCurso,
} from '../catalog.js';
import { courseProgress as progressoDoCurso } from '../state.js';
import { courseState as estadoDoCurso } from '../graph.js';
import { bar as barra } from '../screens/common.js';
import { esc } from '../text.js';

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
      /* A FILEIRA DE CATEGORIAS ROLA, E COM SETAS. São nove categorias, e nem
         com o trilho fechado elas cabem numa linha: as últimas ficavam
         cortadas na borda, sem nada dizendo que havia mais.

         A estrutura é a da vitrine — `.chips-caixa` com uma seta de cada lado
         e o esmaecido nas pontas —, e o `base.css` já traz o estilo dos três.
         Reimplementar aqui seria manter dois de tudo. */
      '<div class="chips-caixa">' +
        '<button type="button" class="abas-seta" data-rolar="-1" aria-label="' +
          txt('Categorias anteriores') + '">←</button>' +
        '<div class="chips" id="cat-chips" role="group">' +
          categorias.map((k, i) =>
            '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-cat="' + esc(k) + '">' +
              txt(k) + '</button>').join('') +
        '</div>' +
        '<button type="button" class="abas-seta" data-rolar="1" aria-label="' +
          txt('Próximas categorias') + '">→</button>' +
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

  /* ---------- a fileira rolável ----------
     Mesma mecânica do grafo: as setas rolam por quase uma tela cheia, e o
     esmaecido das pontas diz de que lado ainda há coisa. Quando tudo cabe, as
     duas somem — seta desabilitada que nunca faz nada é ruído. */
  const chips = el.querySelector('#cat-chips');
  const caixa = el.querySelector('.chips-caixa');

  function ajustarSetas() {
    const sobra = chips.scrollWidth - chips.clientWidth;
    caixa.classList.toggle('sem-setas', sobra <= 1);
    chips.classList.toggle('fade-esq', chips.scrollLeft > 4);
    chips.classList.toggle('fade-dir', chips.scrollLeft < sobra - 4);
    caixa.querySelector('[data-rolar="-1"]').disabled = chips.scrollLeft <= 4;
    caixa.querySelector('[data-rolar="1"]').disabled = chips.scrollLeft >= sobra - 4;
  }

  caixa.addEventListener('click', (e) => {
    const seta = e.target.closest('.abas-seta');
    if (!seta) return;
    chips.scrollBy({ left: Number(seta.dataset.rolar) * Math.max(200, chips.clientWidth - 80), behavior: 'smooth' });
  });
  chips.addEventListener('scroll', ajustarSetas);

  let ajusteT = null;
  const aoRedimensionar = () => { clearTimeout(ajusteT); ajusteT = setTimeout(ajustarSetas, 120); };
  addEventListener('resize', aoRedimensionar);

  pintar();
  return {
    titulo: txt('Catálogo'),
    el,
    // as medidas só existem depois de o elemento entrar no documento
    depois: ajustarSetas,
    aoSair: () => removeEventListener('resize', aoRedimensionar),
  };
}
