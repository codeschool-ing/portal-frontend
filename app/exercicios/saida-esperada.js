/* ==========================================================================
   `saida-esperada` — o aluno digita o que o trecho imprime.

   É o tipo mais forte do conjunto: quem corrige é o interpretador, comparando
   byte a byte. Duas consequências para a tela:

   1. A comparação é byte a byte, então ESPAÇO IMPORTA. O campo é <textarea>
      com fonte monoespaçada e sem correção automática — um corretor de
      celular transformando aspas retas em curvas reprovaria resposta certa.
   2. A dica deste tipo nunca manda executar o trecho (regra do gerador: aqui
      "rode e observe" equivale a mandar copiar o gabarito do terminal). A tela
      não precisa fazer nada quanto a isso além de não oferecer um botão
      "executar" ao lado.

   A correção real é do servidor. Aqui a resposta só é colhida.
   ========================================================================== */

import { esc } from '../texto.js';

export default {
  tipos: ['saida-esperada'],

  corpo(ex, uid) {
    return (
      '<div class="cod-bloco">' +
        '<div class="cod-barra"><span class="cod-ling">' + esc(ex.linguagem || 'texto') + '</span></div>' +
        '<pre class="cod"><code>' + esc(ex.codigo_dado) + '</code></pre>' +
      '</div>' +
      '<label class="ex-rotulo" for="saida-' + uid + '">' + txt('o que aparece na tela') + '</label>' +
      '<textarea id="saida-' + uid + '" class="ex-campo mono" rows="4" spellcheck="false" ' +
        'autocapitalize="off" autocorrect="off" placeholder="' + txt('digite a saída exata') + '"></textarea>' +
      '<p class="ex-nota">' + txt('A comparação é exata: espaços e quebras de linha contam.') + '</p>'
    );
  },

  colher(raiz) {
    const v = raiz.querySelector('.ex-campo').value;
    return v.trim() ? v : null;
  },

  revelar(raiz, ex, v) {
    raiz.querySelector('.ex-campo').disabled = true;
    if (v && v.simulado) return;      // servidor ausente: não afirma nada
    const bate = raiz.querySelector('.ex-campo').value.replace(/\s+$/, '') === String(ex.resposta).replace(/\s+$/, '');
    raiz.querySelector('.ex-campo').classList.toggle('campo-certo', bate);
    raiz.querySelector('.ex-campo').classList.toggle('campo-errado', !bate);
  },
};
