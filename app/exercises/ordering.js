/* ==========================================================================
   `ordenacao` — putting steps in the right order.

   `itens` in the JSON IS ALREADY in the correct order: it is the answer key.
   Rendering in file order would hand the answer over, so it is shuffled with a
   seed.

   Dragging and the ↑ ↓ buttons do the same thing, deliberately: dragging is the
   natural gesture on mouse and touch, and the buttons are the only route for
   keyboard and screen reader. An exercise type that only works with a mouse
   excludes students, and the list is short (4 to 7 items) — the cost is small.

   The `armadilha` field does NOT reach the screen: it names which neighbouring
   pair students tend to swap, and that is exactly what the exercise measures.
   It becomes feedback.
   ========================================================================== */

import { marcado as formatted, embaralharCom as shuffleWith } from '../texto.js';

/* SVG and not a character. The arrows used to be `↑` and `↓` and the grip was a
   braille character; without the webfont loaded they turned into empty
   rectangles, and a button with no declared `background` still inherited the
   browser's default grey — two ugly things with one cause: trusting what the
   environment provides. A drawing inherits `currentColor` and exists
   everywhere. */
const svg = (d) => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ARROW_UP = svg('<path d="M4 10l4-4 4 4"/>');
const ARROW_DOWN = svg('<path d="M4 6l4 4 4-4"/>');
const GRIP = svg('<path d="M3 5h10M3 8h10M3 11h10"/>');

export default {
  types: ['ordenacao'],

  body(ex, uid) {
    const shuffled = shuffleWith(uid, ex.itens);
    const rows = shuffled.map((item) => (
      '<li class="ord-item" draggable="true" data-item="' + encodeURIComponent(item) + '">' +
        '<span class="ord-pega" aria-hidden="true">' + GRIP + '</span>' +
        '<span class="ord-txt">' + formatted(item) + '</span>' +
        '<span class="ord-setas">' +
          '<button type="button" class="ord-seta" data-dir="-1" aria-label="Mover para cima">' + ARROW_UP + '</button>' +
          '<button type="button" class="ord-seta" data-dir="1" aria-label="Mover para baixo">' + ARROW_DOWN + '</button>' +
        '</span>' +
      '</li>'
    )).join('');
    return '<ol class="ord">' + rows + '</ol>';
  },

  setup(root) {
    const list = root.querySelector('.ord');
    if (!list) return;

    list.addEventListener('click', (e) => {
      const b = e.target.closest('.ord-seta');
      if (!b) return;
      const li = b.closest('.ord-item');
      const dir = Number(b.dataset.dir);
      const neighbour = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!neighbour) return;
      if (dir < 0) list.insertBefore(li, neighbour);
      else list.insertBefore(neighbour, li);
      b.focus();   // focus follows the item, or the keyboard loses its place
    });

    let dragged = null;
    list.addEventListener('dragstart', (e) => {
      dragged = e.target.closest('.ord-item');
      if (dragged) dragged.classList.add('arrastando');
    });
    list.addEventListener('dragend', () => {
      if (dragged) dragged.classList.remove('arrastando');
      dragged = null;
    });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target.closest('.ord-item');
      if (!target || !dragged || target === dragged) return;
      const r = target.getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      list.insertBefore(dragged, after ? target.nextElementSibling : target);
    });
  },

  collect(root) {
    const items = [...root.querySelectorAll('.ord-item')]
      .map((li) => decodeURIComponent(li.dataset.item));
    return items.length ? items : null;
  },

  reveal(root, ex) {
    root.querySelectorAll('.ord-item').forEach((li, i) => {
      const right = decodeURIComponent(li.dataset.item) === ex.itens[i];
      li.classList.toggle('ord-certo', right);
      li.classList.toggle('ord-errado', !right);
      li.draggable = false;
      li.querySelectorAll('.ord-seta').forEach((b) => { b.disabled = true; });
    });
  },
};
