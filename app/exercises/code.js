/* ==========================================================================
   `code` — the student writes the solution, graded by running it.

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
  types: ['code'],

  body(ex, uid) {
    const tests = ex.tests || [];
    const shown = tests.slice(0, SHOWN_CASES);
    const hidden = Math.max(0, tests.length - shown.length);

    const cases = shown.map((t) => (
      '<div class="case">' +
        '<span class="case-desc">' + formatted(t.description || '') + '</span>' +
        '<div class="case-io">' +
          '<div><span class="case-label">' + txt('input') + '</span><pre class="code"><code>' + esc(t.input) + '</code></pre></div>' +
          '<div><span class="case-label">' + txt('output') + '</span><pre class="code"><code>' + esc(t.expectedOutput) + '</code></pre></div>' +
        '</div>' +
      '</div>'
    )).join('');

    return (
      '<label class="ex-label" for="cod-' + uid + '">' + txt('your solution') + '</label>' +
      '<div class="code-block code-editor">' +
        '<div class="code-bar"><span class="code-lang">' + esc(ex.language || '') + '</span></div>' +
        '<textarea id="cod-' + uid + '" class="ex-field mono code-area" rows="10" spellcheck="false" ' +
          'autocapitalize="off" autocorrect="off">' + esc(ex.skeleton || '') + '</textarea>' +
      '</div>' +
      (cases
        ? '<div class="cases"><span class="cases-title">' + txt('examples') + '</span>' + cases +
          (hidden ? '<p class="ex-note">' + hidden + ' ' + txt('test cases stay hidden.') + '</p>' : '') +
          '</div>'
        : '')
    );
  },

  setup(root) {
    // Tab inside the editor indents instead of jumping to the next field —
    // without this you cannot write any Python at all.
    const area = root.querySelector('.code-area');
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
    const v = root.querySelector('.code-area').value;
    return v.trim() ? v : null;
  },

  reveal(root) {
    root.querySelector('.code-area').disabled = true;
  },
};
