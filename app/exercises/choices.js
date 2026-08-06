/* ==========================================================================
   `quiz` and `multiple-choice`.

   One module for both: the difference between them is the input type and the
   grading rule — everything else (order, reveal, feedback) is identical. Two
   files calling into each other would not separate anything.

   TWO SCHOOL RULES THE UI HAS TO RESPECT:

   1. `why` is POST-ANSWER feedback, not a visible hint. `RULES.md` writes it
      down as a convention, and the critic is told to know it. If the
      justification shows up first, the whole exercise loses its point.
   2. The order of the choices in the JSON is not neutral — in the existing
      material the correct one tends to come first. Shuffling is mandatory, and
      it needs a seed, or the order changes on every render.
   ========================================================================== */

import { formatted, shuffleWith } from '../text.js';

export default {
  types: ['quiz', 'multiple-choice'],

  body(ex, uid) {
    const many = ex.type === 'multiple-choice';
    const order = shuffleWith(uid, ex.choices.map((_, i) => i));

    const options = order.map((ix) => {
      const a = ex.choices[ix];
      return (
        '<label class="alt" data-ix="' + ix + '">' +
          '<input type="' + (many ? 'checkbox' : 'radio') + '" name="alt-' + uid + '" value="' + ix + '" />' +
          '<span class="alt-marca" aria-hidden="true"></span>' +
          '<span class="alt-txt">' + formatted(a.text) + '</span>' +
          '<span class="alt-porque" hidden>' + formatted(a.why || '') + '</span>' +
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
      const a = ex.choices[ix];
      const ticked = el.querySelector('input').checked;
      el.classList.toggle('alt-certa', Boolean(a.correct));
      el.classList.toggle('alt-perdida', Boolean(a.correct) && !ticked);
      el.classList.toggle('alt-errada', !a.correct && ticked);
      el.querySelector('input').disabled = true;
      // only now: the justification is feedback, not a hint
      const p = el.querySelector('.alt-porque');
      if (p.textContent.trim()) p.hidden = false;
    });
    void v;
  },
};
