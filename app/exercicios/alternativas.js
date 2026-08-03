/* ==========================================================================
   `quiz` e `multipla-escolha`.

   Um módulo para os dois: a diferença entre eles é o tipo do input e a regra
   de correção — o resto (ordem, revelação, feedback) é idêntico. Dois arquivos
   que se chamam não separariam nada.

   DUAS REGRAS DA ESCOLA QUE A UI PRECISA RESPEITAR:

   1. `porque` é feedback PÓS-RESPOSTA, não pista visível. Está escrito em
      REGRAS.md como convenção, e o crítico é instruído a saber disso. Se a
      justificativa aparecer antes, o exercício inteiro perde o sentido.
   2. A ordem das alternativas no JSON não é neutra — no material existente a
      correta costuma vir primeiro. Embaralhar é obrigatório, e com semente,
      senão a ordem muda a cada render.
   ========================================================================== */

import { marcado, embaralharCom } from '../texto.js';

export default {
  tipos: ['quiz', 'multipla-escolha'],

  corpo(ex, uid) {
    const varias = ex.tipo === 'multipla-escolha';
    const ordem = embaralharCom(uid, ex.alternativas.map((_, i) => i));

    const opcoes = ordem.map((ix) => {
      const a = ex.alternativas[ix];
      return (
        '<label class="alt" data-ix="' + ix + '">' +
          '<input type="' + (varias ? 'checkbox' : 'radio') + '" name="alt-' + uid + '" value="' + ix + '" />' +
          '<span class="alt-marca" aria-hidden="true"></span>' +
          '<span class="alt-txt">' + marcado(a.texto) + '</span>' +
          '<span class="alt-porque" hidden>' + marcado(a.porque || '') + '</span>' +
        '</label>'
      );
    }).join('');

    return (
      (varias ? '<p class="ex-instrucao">' + txt('Marque todas as que se aplicam.') + '</p>' : '') +
      '<div class="alts">' + opcoes + '</div>'
    );
  },

  colher(raiz) {
    const marcadas = [...raiz.querySelectorAll('.alt input:checked')].map((i) => Number(i.value));
    if (!marcadas.length) return null;
    return raiz.querySelector('.alt input[type="checkbox"]') ? marcadas : marcadas[0];
  },

  revelar(raiz, ex, v) {
    raiz.querySelectorAll('.alt').forEach((el) => {
      const ix = Number(el.dataset.ix);
      const a = ex.alternativas[ix];
      const marcada = el.querySelector('input').checked;
      el.classList.toggle('alt-certa', Boolean(a.correta));
      el.classList.toggle('alt-perdida', Boolean(a.correta) && !marcada);
      el.classList.toggle('alt-errada', !a.correta && marcada);
      el.querySelector('input').disabled = true;
      // só agora: a justificativa é feedback, não pista
      const p = el.querySelector('.alt-porque');
      if (p.textContent.trim()) p.hidden = false;
    });
    void v;
  },
};
