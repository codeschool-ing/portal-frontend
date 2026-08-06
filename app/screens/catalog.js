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
  el.className = 'view view-catalog';

  const categories = ['all', ...new Set(COURSES.map((c) => c.category))];

  el.innerHTML =
    '<header class="screen-head">' +
      '<h1>' + txt('All courses') + '</h1>' +
    '</header>' +
    '<div class="filters">' +
      '<div class="search">' +
        '<span class="search-ico" aria-hidden="true">⌕</span>' +
        '<input type="search" id="cat-search" placeholder="' + txt('search courses...') + '" aria-label="' + txt('Search courses') + '" />' +
      '</div>' +
      /* THE CATEGORY ROW SCROLLS, AND WITH ARROWS. There are nine categories,
         and not even with the rail closed do they fit on one line: the last ones
         were cut off at the edge with nothing saying there was more.

         The structure is the vitrine's — `.chips-box` with an arrow on each
         side and the fade at the ends — and `base.css` already brings the style
         for all three. Reimplementing here would mean maintaining two of
         everything. */
      '<div class="chips-box">' +
        '<button type="button" class="tabs-arrow" data-scroll="-1" aria-label="' +
          txt('Previous categories') + '">←</button>' +
        '<div class="chips" id="cat-chips" role="group">' +
          categories.map((k, i) =>
            '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-cat="' + esc(k) + '">' +
              txt(k) + '</button>').join('') +
        '</div>' +
        '<button type="button" class="tabs-arrow" data-scroll="1" aria-label="' +
          txt('Next categories') + '">→</button>' +
      '</div>' +
    '</div>' +
    '<div class="cards" id="cat-grid"></div>' +
    '<p class="empty" id="cat-empty" hidden>' + txt('no course found — try another term.') + '</p>';

  const grid = el.querySelector('#cat-grid');
  const field = el.querySelector('#cat-search');
  let category = 'all';

  function paint() {
    const term = field.value.trim().toLowerCase();
    const list = COURSES.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (!term) return true;
      // searches name, summary, syllabus and topics — as on the vitrine
      const target = [c.name, c.summary, ...(c.syllabus || []), ...(c.topics || [])].join(' ').toLowerCase();
      return target.includes(term);
    });

    grid.innerHTML = list.map((c) => {
      const lessons = courseLessons(c.id).length;
      const p = courseProgress(c.id);
      const st = courseState(c.id);
      return '<a class="card node-' + st + '" href="#/course/' + esc(c.id) + '">' +
        '<span class="card-cat">' + txt(c.category) + '</span>' +
        '<span class="card-name">' + esc(c.name) + '</span>' +
        '<span class="card-summary">' + esc(c.summary) + '</span>' +
        '<span class="card-meta">' + c.hours + 'h · ' + txt(c.level) + ' · ' + lessons + ' ' + txt('lessons') + '</span>' +
        (p.done ? bar(p.pct, p.done + ' ' + txt('of') + ' ' + p.total) : '') +
      '</a>';
    }).join('');
    el.querySelector('#cat-empty').hidden = list.length > 0;
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
  const box = el.querySelector('.chips-box');

  function adjustArrows() {
    const spare = chips.scrollWidth - chips.clientWidth;
    box.classList.toggle('no-arrows', spare <= 1);
    chips.classList.toggle('fade-left', chips.scrollLeft > 4);
    chips.classList.toggle('fade-right', chips.scrollLeft < spare - 4);
    box.querySelector('[data-scroll="-1"]').disabled = chips.scrollLeft <= 4;
    box.querySelector('[data-scroll="1"]').disabled = chips.scrollLeft >= spare - 4;
  }

  box.addEventListener('click', (e) => {
    const arrow = e.target.closest('.tabs-arrow');
    if (!arrow) return;
    chips.scrollBy({ left: Number(arrow.dataset.scroll) * Math.max(200, chips.clientWidth - 80), behavior: 'smooth' });
  });
  chips.addEventListener('scroll', adjustArrows);

  let adjustT = null;
  const onResize = () => { clearTimeout(adjustT); adjustT = setTimeout(adjustArrows, 120); };
  addEventListener('resize', onResize);

  paint();
  return {
    title: txt('Catalog'),
    el,
    // the measurements only exist once the element is in the document
    after: adjustArrows,
    onLeave: () => removeEventListener('resize', onResize),
  };
}
