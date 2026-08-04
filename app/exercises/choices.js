/* ==========================================================================
   `quiz` and `multipla-escolha`.

   One module for both: the difference between them is the input type and the
   grading rule — everything else (order, reveal, feedback) is identical. Two
   files calling into each other would not separate anything.

   TWO SCHOOL RULES THE UI HAS TO RESPECT:

   1. `porque` is POST-ANSWER feedback, not a visible hint. REGRAS.md writes it
      down as a convention, and the critic is told to know it. If the
      justification shows up first, the whole exercise loses its point.
   2. The order of the choices in the JSON is not neutral — in the existing
      material the correct one tends to come first. Shuffling is mandatory, and
      it needs a seed, or the order changes on every render.
   ========================================================================== */

import { formatted, shuffleWith } from '../text.js';

export default {
  types: ['quiz', 'multipla-escolha'],

  body(ex, uid) {
    const many = ex.tipo === 'multipla-escolha';
    const order = shuffleWith(uid, ex.alternativas.map((_, i) => i));

    const options = order.map((ix) => {
      const a = ex.alternativas[ix];
      return (
        '<label class="alt" data-ix="' + ix + '">' +
          '<input type="' + (many ? 'checkbox' : 'radio') + '" name="alt-' + uid + '" value="' + ix + '" />' +
          '<span class="alt-marca" aria-hidden="true"></span>' +
          '<span class="alt-txt">' + formatted(a.texto) + '</span>' +
          '<span class="alt-porque" hidden>' + formatted(a.porque || '') + '</span>' +
        '</label>'
      );
    }).join('');

    return (
      (many ? '<p class="ex-instrucao">' + txt('Marque todas as que se aplicam.') + '</p>' : '') +
      '<div class="alts">' + options + '</div>'
    );
  },

  collect(root) {
    const ticked = [...root.querySelectorAll('.alt input:checked')].map((i) => Number(i.value));
    if (!ticked.length) return null;
    return root.querySelector('.alt input[type="checkbox"]') ? ticked : ticked[0];
  },

  reveal(root, ex, v) {
    root.querySelectorAll('.alt').forEach((el) => {
      const ix = Number(el.dataset.ix);
      const a = ex.alternativas[ix];
      const ticked = el.querySelector('input').checked;
      el.classList.toggle('alt-certa', Boolean(a.correta));
      el.classList.toggle('alt-perdida', Boolean(a.correta) && !ticked);
      el.classList.toggle('alt-errada', !a.correta && ticked);
      el.querySelector('input').disabled = true;
      // only now: the justification is feedback, not a hint
      const p = el.querySelector('.alt-porque');
      if (p.textContent.trim()) p.hidden = false;
    });
    void v;
  },
};
