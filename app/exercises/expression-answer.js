/* ==========================================================================
   `expression-answer` — the student writes an expression, compared by
   SYMBOLIC EQUIVALENCE rather than by text: `2*x`, `x*2` and `x+x` are the same
   answer, and on an integral the `+ C` is accepted.

   It is the only type whose answer key is PROVEN — the CAS recomputes the
   answer from the source expression instead of trusting what was written down.

   The screen shows the domain assumptions declared in `variaveis` because they
   change what is accepted: without `x:positive`, `sqrt(x**2)` does not simplify
   to `x`, and a student who answers that way fails. Hiding the assumption would
   be hiding the rules of the game.

   Comparing needs the CAS on the server — there is no way to fake it in the
   browser.
   ========================================================================== */

import { esc, formatted } from '../text.js';

const OP_NAME = {
  diff: 'derivada',
  integrate: 'integral',
  simplify: 'simplificação',
};

export default {
  types: ['expression-answer'],

  body(ex, uid) {
    const vars = ex.variables || [];
    const assumptions = vars.filter((v) => String(v).includes(':'));

    return (
      (ex.checkOrigin
        ? '<div class="expr-origem">' +
            '<span class="expr-rot">' + txt(OP_NAME[ex.checkOperation] || 'expression') + ' ' + txt('of') + '</span>' +
            '<code class="expr-cod">' + esc(ex.checkOrigin) + '</code>' +
          '</div>'
        : '') +
      '<label class="ex-rotulo" for="expr-' + uid + '">' + txt('your answer') + '</label>' +
      '<input id="expr-' + uid + '" class="ex-campo mono" type="text" spellcheck="false" ' +
        'autocapitalize="off" autocorrect="off" placeholder="x**3/3" />' +
      '<p class="ex-nota">' + txt('Any equivalent form counts.') +
        (vars.length ? ' ' + txt('variables') + ': <code>' + esc(vars.join(', ')) + '</code>' : '') +
      '</p>' +
      (assumptions.length
        ? '<p class="ex-nota ex-nota-dom">' + txt('Domain assumptions') + ': <code>' +
            esc(assumptions.join(', ')) + '</code></p>'
        : '') +
      (ex.checkOperation === 'none'
        ? '<p class="ex-nota ex-nota-aviso">' + formatted(txt('This exercise declares no recomputation — nobody checked the answer key.')) + '</p>'
        : '')
    );
  },

  collect(root) {
    const v = root.querySelector('.ex-campo').value;
    return v.trim() ? v.trim() : null;
  },

  reveal(root) {
    root.querySelector('.ex-campo').disabled = true;
  },
};
