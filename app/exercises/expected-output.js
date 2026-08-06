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
      '<div class="cod-bloco">' +
        '<div class="cod-barra">' +
          '<span class="cod-ling">' + esc(ex.language || 'texto') + '</span>' +
          copyButton() +
        '</div>' +
        '<pre class="cod"><code>' + esc(ex.given_code) + '</code></pre>' +
      '</div>' +
      '<label class="ex-rotulo" for="saida-' + uid + '">' + txt('o que aparece na tela') + '</label>' +
      '<textarea id="saida-' + uid + '" class="ex-campo mono" rows="4" spellcheck="false" ' +
        'autocapitalize="off" autocorrect="off" placeholder="' + txt('digite a saída exata') + '"></textarea>' +
      '<p class="ex-nota">' + txt('A comparação é exata: espaços e quebras de linha contam.') + '</p>'
    );
  },

  collect(root) {
    const v = root.querySelector('.ex-campo').value;
    return v.trim() ? v : null;
  },

  reveal(root, ex, v) {
    root.querySelector('.ex-campo').disabled = true;
    if (v && v.simulado) return;      // no server: claim nothing
    const matches = root.querySelector('.ex-campo').value.replace(/\s+$/, '') === String(ex.answer).replace(/\s+$/, '');
    root.querySelector('.ex-campo').classList.toggle('campo-certo', matches);
    root.querySelector('.ex-campo').classList.toggle('campo-errado', !matches);
  },
};
