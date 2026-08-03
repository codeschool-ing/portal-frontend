/* ==========================================================================
   `codigo` — o aluno escreve a solução, corrigida por execução.

   Os casos de teste NÃO são todos mostrados. Os primeiros viram exemplo — o
   aluno precisa entender o formato de entrada e saída — e o resto fica oculto.
   É o mesmo motivo pelo qual o validador do pipeline escreve a solução de
   referência ÀS CEGAS: solução ajustada aos casos visíveis não é solução, e
   uma das quatro perguntas que o gerador tem de responder antes de fechar um
   exercício é justamente "existe solução que ignora o tópico e passa em todos
   os casos?". Mostrar tudo convida a construir exatamente essa solução.

   Executar é do servidor, em contêiner descartável — a doc da vitrine já
   registra isso como o desenho previsto, não como limitação temporária.
   ========================================================================== */

import { esc, marcado } from '../texto.js';

const EXEMPLOS = 2;

export default {
  tipos: ['codigo'],

  corpo(ex, uid) {
    const testes = ex.testes || [];
    const visiveis = testes.slice(0, EXEMPLOS);
    const ocultos = Math.max(0, testes.length - visiveis.length);

    const casos = visiveis.map((t) => (
      '<div class="caso">' +
        '<span class="caso-desc">' + marcado(t.descricao || '') + '</span>' +
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
      (casos
        ? '<div class="casos"><span class="casos-tit">' + txt('exemplos') + '</span>' + casos +
          (ocultos ? '<p class="ex-nota">' + ocultos + ' ' + txt('casos de teste ficam ocultos.') + '</p>' : '') +
          '</div>'
        : '')
    );
  },

  montar(raiz) {
    // Tab dentro do editor indenta, em vez de pular para o próximo campo —
    // sem isto não dá para escrever Python nenhum.
    const area = raiz.querySelector('.cod-area');
    if (!area) return;
    area.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const { selectionStart: i, selectionEnd: f, value } = area;
      area.value = value.slice(0, i) + '    ' + value.slice(f);
      area.selectionStart = area.selectionEnd = i + 4;
    });
  },

  colher(raiz) {
    const v = raiz.querySelector('.cod-area').value;
    return v.trim() ? v : null;
  },

  revelar(raiz) {
    raiz.querySelector('.cod-area').disabled = true;
  },
};
