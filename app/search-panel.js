/* ==========================================================================
   The search panel — what ⌘K opens.

   Keyboard from start to finish, because that is how a shortcut-driven search
   gets used: it opens as you type, you pick with the arrows, enter with Enter,
   leave with Esc. Anyone who needs the mouse can still get there, but the design
   is for someone who does not take their hands off the keyboard.

   THERE IS NO DEBOUNCE, and that is measured: the whole index is ~1,700 entries
   and the sweep is one `indexOf` per entry. It costs less than a millisecond, so
   delaying the response would only add perceived latency for nothing.
   ========================================================================== */

import { search, excerpt, GROUP_LABEL, forgetIndex } from './search.js';
import { esc } from './text.js';

const MAGNIFIER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>';

let panel = null;
let field = null;
let list = null;
let selected = 0;
let hits = [];

function create() {
  panel = document.createElement('div');
  panel.className = 'search-veil';
  panel.id = 'busca-painel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="search-box" role="dialog" aria-modal="true" aria-label="' + txt('Search') + '">' +
      '<div class="search-top">' +
        '<span class="search-glass" aria-hidden="true">' + MAGNIFIER + '</span>' +
        '<input type="search" class="search-field" autocomplete="off" spellcheck="false" ' +
          'placeholder="' + txt('search courses, lessons, sections and exercises…') + '" ' +
          'aria-label="' + txt('Search') + '" />' +
      '</div>' +
      '<div class="search-res" role="listbox"></div>' +
      '<div class="search-foot">' +
        '<span><kbd>↑</kbd><kbd>↓</kbd> ' + txt('navigate') + '</span>' +
        '<span><kbd>↵</kbd> ' + txt('open') + '</span>' +
        '<span><kbd>esc</kbd> ' + txt('close') + '</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);
  field = panel.querySelector('.search-field');
  list = panel.querySelector('.search-res');

  field.addEventListener('input', paint);
  panel.addEventListener('click', (e) => {
    if (e.target === panel) return close();       // clicking outside closes
    const item = e.target.closest('.search-item');
    if (item) open(Number(item.dataset.ix));
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); open(selected); }
  });
}

function flat() {
  // the groups become one list so the arrows walk between them without stopping
  return hits.flatMap((g) => g.items);
}

function paint() {
  const term = field.value;
  hits = search(term);
  selected = 0;

  if (term.trim().length < 2) {
    list.innerHTML = '<p class="search-hint">' + txt('Type at least two letters.') + '</p>';
    return;
  }
  if (!hits.length) {
    list.innerHTML = '<p class="search-hint">' + txt('Nothing found for') + ' “' + esc(term) + '”.</p>';
    return;
  }

  let i = -1;
  list.innerHTML = hits.map((g) =>
    '<div class="search-group">' + txt(GROUP_LABEL[g.group]) + '</div>' +
    g.items.map((it) => {
      i += 1;
      const ctx = excerpt(it, term);
      return '<button type="button" class="search-item' + (i === 0 ? ' on' : '') + '" ' +
        'data-ix="' + i + '" role="option">' +
        '<span class="bi-tit">' + esc(it.title) + '</span>' +
        '<span class="bi-sub">' + esc(it.sub) + '</span>' +
        (ctx ? '<span class="bi-ctx">' + esc(ctx) + '</span>' : '') +
      '</button>';
    }).join(''),
  ).join('');
}

function move(d) {
  const items = [...list.querySelectorAll('.search-item')];
  if (!items.length) return;
  selected = (selected + d + items.length) % items.length;
  items.forEach((el, i) => el.classList.toggle('on', i === selected));
  items[selected].scrollIntoView({ block: 'nearest' });
}

function open(ix) {
  const it = flat()[ix];
  if (!it) return;
  close();
  location.hash = it.href;
}

export function openSearch() {
  if (!panel) create();
  /* The index is rebuilt on every opening because two things it indexes change
     between one search and the next: the language and the student's notes.
     Building costs a few milliseconds; serving a stale result costs trust. */
  forgetIndex();
  panel.hidden = false;
  document.body.classList.add('with-search');
  field.value = '';
  paint();
  field.focus();
}

export function close() {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  document.body.classList.remove('with-search');
}

export const searchOpen = () => Boolean(panel) && !panel.hidden;
