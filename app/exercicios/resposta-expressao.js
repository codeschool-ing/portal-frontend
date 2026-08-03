/* ==========================================================================
   `resposta-expressao` — o aluno escreve uma expressão, comparada por
   EQUIVALÊNCIA SIMBÓLICA, não por texto: `2*x`, `x*2` e `x+x` são a mesma
   resposta, e em integral o `+ C` é aceito.

   É o único tipo cujo gabarito se PROVA — o CAS recalcula a resposta a partir
   da expressão de origem em vez de confiar no que foi escrito.

   A tela mostra as suposições de domínio declaradas em `variaveis` porque elas
   mudam o que é aceito: sem `x:positive`, `sqrt(x**2)` não simplifica para `x`
   e o aluno que responder assim é reprovado. Esconder a suposição seria
   esconder a regra do jogo.

   Comparar exige o CAS no servidor — não há como fingir no navegador.
   ========================================================================== */

import { esc, marcado } from '../texto.js';

const NOME_OP = {
  diff: 'derivada',
  integrate: 'integral',
  simplify: 'simplificação',
};

export default {
  tipos: ['resposta-expressao'],

  corpo(ex, uid) {
    const vars = ex.variaveis || [];
    const supostos = vars.filter((v) => String(v).includes(':'));

    return (
      (ex.verificacao_origem
        ? '<div class="expr-origem">' +
            '<span class="expr-rot">' + txt(NOME_OP[ex.verificacao_operacao] || 'expressão') + ' ' + txt('de') + '</span>' +
            '<code class="expr-cod">' + esc(ex.verificacao_origem) + '</code>' +
          '</div>'
        : '') +
      '<label class="ex-rotulo" for="expr-' + uid + '">' + txt('sua resposta') + '</label>' +
      '<input id="expr-' + uid + '" class="ex-campo mono" type="text" spellcheck="false" ' +
        'autocapitalize="off" autocorrect="off" placeholder="x**3/3" />' +
      '<p class="ex-nota">' + txt('Vale qualquer forma equivalente.') +
        (vars.length ? ' ' + txt('variáveis') + ': <code>' + esc(vars.join(', ')) + '</code>' : '') +
      '</p>' +
      (supostos.length
        ? '<p class="ex-nota ex-nota-dom">' + txt('Suposições de domínio') + ': <code>' +
            esc(supostos.join(', ')) + '</code></p>'
        : '') +
      (ex.verificacao_operacao === 'nenhuma'
        ? '<p class="ex-nota ex-nota-aviso">' + marcado(txt('Este exercício não declara recálculo — o gabarito não foi conferido por ninguém.')) + '</p>'
        : '')
    );
  },

  colher(raiz) {
    const v = raiz.querySelector('.ex-campo').value;
    return v.trim() ? v.trim() : null;
  },

  revelar(raiz) {
    raiz.querySelector('.ex-campo').disabled = true;
  },
};
