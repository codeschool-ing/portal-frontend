/* ==========================================================================
   Catalogue — the 86 courses, with a search field and a category filter.

   The categories are not a fixed list: they come out of `dados.js` itself, as on
   the vitrine. A new course with a new category shows up in the filter on its
   own.
   ========================================================================== */

import { courseLessons } from '../catalog.js';
import { courseProgress } from '../state.js';
import { courseState } from '../graph.js';
import { bar } from './common.js';
import { esc } from '../text.js';

export default async function catalogue() {
  const el = document.createElement('div');
  el.className = 'tela tela-catalogo';

  const categories = ['todas', ...new Set(COURSES.map((c) => c.category))];

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Todos os cursos') + '</h1>' +
    '</header>' +
    '<div class="filtros">' +
      '<div class="busca">' +
        '<span class="busca-ico" aria-hidden="true">⌕</span>' +
        '<input type="search" id="cat-busca" placeholder="' + txt('buscar curso...') + '" aria-label="' + txt('Buscar curso') + '" />' +
      '</div>' +
      /* THE CATEGORY ROW SCROLLS, AND WITH ARROWS. There are nine categories,
         and not even with the rail closed do they fit on one line: the last ones
         were cut off at the edge with nothing saying there was more.

         The structure is the vitrine's — `.chips-caixa` with an arrow on each
         side and the fade at the ends — and `base.css` already brings the style
         for all three. Reimplementing here would mean maintaining two of
         everything. */
      '<div class="chips-caixa">' +
        '<button type="button" class="abas-seta" data-rolar="-1" aria-label="' +
          txt('Categorias anteriores') + '">←</button>' +
        '<div class="chips" id="cat-chips" role="group">' +
          categories.map((k, i) =>
            '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-cat="' + esc(k) + '">' +
              txt(k) + '</button>').join('') +
        '</div>' +
        '<button type="button" class="abas-seta" data-rolar="1" aria-label="' +
          txt('Próximas categorias') + '">→</button>' +
      '</div>' +
    '</div>' +
    '<div class="cartoes" id="cat-grade"></div>' +
    '<p class="vazio" id="cat-vazio" hidden>' + txt('nenhum curso encontrado — tente outro termo.') + '</p>';

  const grid = el.querySelector('#cat-grade');
  const field = el.querySelector('#cat-busca');
  let category = 'todas';

  function paint() {
    const term = field.value.trim().toLowerCase();
    const list = COURSES.filter((c) => {
      if (category !== 'todas' && c.category !== category) return false;
      if (!term) return true;
      // searches name, summary, syllabus and topics — as on the vitrine
      const target = [c.name, c.summary, ...(c.syllabus || []), ...(c.topics || [])].join(' ').toLowerCase();
      return target.includes(term);
    });

    grid.innerHTML = list.map((c) => {
      const lessons = courseLessons(c.id).length;
      const p = courseProgress(c.id);
      const st = courseState(c.id);
      return '<a class="cartao no-' + st + '" href="#/curso/' + esc(c.id) + '">' +
        '<span class="cartao-cat">' + esc(c.category) + '</span>' +
        '<span class="cartao-nome">' + esc(c.name) + '</span>' +
        '<span class="cartao-resumo">' + esc(c.summary) + '</span>' +
        '<span class="cartao-meta">' + c.hours + 'h · ' + txt(c.level) + ' · ' + lessons + ' ' + txt('aulas') + '</span>' +
        (p.feitas ? bar(p.pct, p.feitas + ' de ' + p.total) : '') +
      '</a>';
    }).join('');
    el.querySelector('#cat-vazio').hidden = list.length > 0;
  }

  field.addEventListener('input', paint);
  el.querySelector('#cat-chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    category = b.dataset.cat;
    el.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
    paint();
  });

  /* ---------- the scrolling row ----------
     Same mechanics as the graph: the arrows scroll by nearly a full screen, and
     the fade at the ends says which side still has something. When everything
     fits, both disappear — a disabled arrow that never does anything is noise. */
  const chips = el.querySelector('#cat-chips');
  const box = el.querySelector('.chips-caixa');

  function adjustArrows() {
    const spare = chips.scrollWidth - chips.clientWidth;
    box.classList.toggle('sem-setas', spare <= 1);
    chips.classList.toggle('fade-esq', chips.scrollLeft > 4);
    chips.classList.toggle('fade-dir', chips.scrollLeft < spare - 4);
    box.querySelector('[data-rolar="-1"]').disabled = chips.scrollLeft <= 4;
    box.querySelector('[data-rolar="1"]').disabled = chips.scrollLeft >= spare - 4;
  }

  box.addEventListener('click', (e) => {
    const arrow = e.target.closest('.abas-seta');
    if (!arrow) return;
    chips.scrollBy({ left: Number(arrow.dataset.rolar) * Math.max(200, chips.clientWidth - 80), behavior: 'smooth' });
  });
  chips.addEventListener('scroll', adjustArrows);

  let adjustT = null;
  const onResize = () => { clearTimeout(adjustT); adjustT = setTimeout(adjustArrows, 120); };
  addEventListener('resize', onResize);

  paint();
  return {
    title: txt('Catálogo'),
    el,
    // the measurements only exist once the element is in the document
    after: adjustArrows,
    onLeave: () => removeEventListener('resize', onResize),
  };
}
