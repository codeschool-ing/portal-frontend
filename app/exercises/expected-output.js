/* ==========================================================================
   `expected-output` — the student types what the snippet prints.

   It is the strongest type of the set: the grader is the interpreter, comparing
   byte for byte. Two consequences for the screen:

   1. The comparison is byte for byte, so WHITESPACE MATTERS. The field is a
      <textarea> with a monospaced font and no autocorrect — a phone keyboard
      turning straight quotes into curly ones would fail a correct answer.
   2. This type's hint never tells the student to run the snippet (generator
      rule: here "run it and see" amounts to telling them to copy the answer key
      off the terminal). The screen does not have to do anything about that
      beyond not offering a "run" button next to it.

   The real grading belongs to the server. Here the answer is only collected.
   ========================================================================== */

import { esc, copyButton } from '../text.js';

export default {
  types: ['expected-output'],

  body(ex, uid) {
    return (
      '<div class="code-block">' +
        '<div class="code-bar">' +
          '<span class="code-lang">' + esc(ex.language || 'texto') + '</span>' +
          copyButton() +
        '</div>' +
        '<pre class="code"><code>' + esc(ex.givenCode) + '</code></pre>' +
      '</div>' +
      '<label class="ex-label" for="saida-' + uid + '">' + txt('what appears on screen') + '</label>' +
      '<textarea id="saida-' + uid + '" class="ex-field mono" rows="4" spellcheck="false" ' +
        'autocapitalize="off" autocorrect="off" placeholder="' + txt('type the exact output') + '"></textarea>' +
      '<p class="ex-note">' + txt('The comparison is exact: spaces and line breaks count.') + '</p>'
    );
  },

  collect(root) {
    const v = root.querySelector('.ex-field').value;
    return v.trim() ? v : null;
  },

  reveal(root, ex, v) {
    root.querySelector('.ex-field').disabled = true;
    if (v && v.simulated) return;      // no server: claim nothing
    const matches = root.querySelector('.ex-field').value.replace(/\s+$/, '') === String(ex.answer).replace(/\s+$/, '');
    root.querySelector('.ex-field').classList.toggle('field-right', matches);
    root.querySelector('.ex-field').classList.toggle('field-wrong', !matches);
  },
};
