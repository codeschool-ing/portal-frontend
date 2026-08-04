/* ==========================================================================
   `codigo` — the student writes the solution, graded by running it.

   The test cases are NOT all shown. The first ones become examples — the
   student needs to understand the input and output format — and the rest stay
   hidden. It is the same reason the pipeline's validator writes the reference
   solution BLIND: a solution fitted to the visible cases is not a solution, and
   one of the four questions the generator has to answer before closing an
   exercise is exactly "is there a solution that ignores the topic and passes
   every case?". Showing everything invites building precisely that solution.

   Running code belongs to the server, in a throwaway container — the vitrine's
   docs already record that as the intended design, not a temporary limitation.
   ========================================================================== */

import { esc, formatted } from '../text.js';

const SHOWN_CASES = 2;

export default {
  types: ['codigo'],

  body(ex, uid) {
    const tests = ex.testes || [];
    const shown = tests.slice(0, SHOWN_CASES);
    const hidden = Math.max(0, tests.length - shown.length);

    const cases = shown.map((t) => (
      '<div class="caso">' +
        '<span class="caso-desc">' + formatted(t.descricao || '') + '</span>' +
        '<div class="caso-io">' +
          '<div><span class="caso-rot">' + txt('entrada') + '</span><pre class="cod"><code>' + esc(t.entrada) + '</code></pre></div>' +
          '<div><span class="caso-rot">' + txt('saída') + '</span><pre class="cod"><code>' + esc(t.saida_esperada) + '</code></pre></div>' +
        '</div>' +
      '</div>'
    )).join('');

    return (
      '<label class="ex-rotulo" for="cod-' + uid + '">' + txt('sua solução') + '</label>' +
      '<div class="cod-bloco cod-editor">' +
        '<div class="cod-barra"><span class="cod-ling">' + esc(ex.linguagem || '') + '</span></div>' +
        '<textarea id="cod-' + uid + '" class="ex-campo mono cod-area" rows="10" spellcheck="false" ' +
          'autocapitalize="off" autocorrect="off">' + esc(ex.esqueleto || '') + '</textarea>' +
      '</div>' +
      (cases
        ? '<div class="casos"><span class="casos-tit">' + txt('exemplos') + '</span>' + cases +
          (hidden ? '<p class="ex-nota">' + hidden + ' ' + txt('casos de teste ficam ocultos.') + '</p>' : '') +
          '</div>'
        : '')
    );
  },

  setup(root) {
    // Tab inside the editor indents instead of jumping to the next field —
    // without this you cannot write any Python at all.
    const area = root.querySelector('.cod-area');
    if (!area) return;
    area.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const { selectionStart: i, selectionEnd: f, value } = area;
      area.value = value.slice(0, i) + '    ' + value.slice(f);
      area.selectionStart = area.selectionEnd = i + 4;
    });
  },

  collect(root) {
    const v = root.querySelector('.cod-area').value;
    return v.trim() ? v : null;
  },

  reveal(root) {
    root.querySelector('.cod-area').disabled = true;
  },
};
