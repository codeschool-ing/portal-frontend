/* ==========================================================================
   Modal — o mesmo da vitrine, reaproveitado.

   As classes (`.modal`, `.modal-caixa`, `html.modal-aberto`) vêm do
   `base.css`, que é cópia da vitrine: o esmaecido, o desfoque, a animação de
   entrada e o congelamento do fundo já estavam resolvidos lá, e resolvidos
   pelo mesmo motivo que valeria aqui.

   O CONGELAMENTO É NO CSS, NÃO NO JAVASCRIPT, e o comentário do base.css
   explica: prender só a roda e o toque deixava passar a barra de rolagem, a
   inércia do trackpad e as setas dentro de um campo. `overflow:hidden` no
   documento resolve os três, e sem reposicionar nada — a página fica
   exatamente onde estava.

   O QUE ESTE MÓDULO ACRESCENTA é o que um portal precisa e uma vitrine não:
   devolver o foco a quem abriu. Quem chegou pelo teclado tem de voltar para o
   mesmo lugar ao fechar, senão o foco cai no começo do documento e a pessoa
   reencontra a lista rolando tudo de novo.
   ========================================================================== */

let aberto = null;

export const modalAberto = () => Boolean(aberto);

export function fecharModal() {
  if (!aberto) return;
  const { el, focoAntes } = aberto;
  aberto = null;
  el.remove();
  document.documentElement.classList.remove('modal-aberto');
  if (focoAntes && document.contains(focoAntes)) focoAntes.focus();
}

/* `conteudo` é HTML já escapado por quem chamou — este módulo não sabe o que
   está mostrando, e não deve saber. `acoes` é o que aparece ACIMA da caixa, à
   direita: no certificado, os botões de compartilhar. */
export function abrirModal(conteudo, { classe = '', acoes = '', rotulo = '' } = {}) {
  fecharModal();

  const el = document.createElement('div');
  el.className = 'modal' + (classe ? ' ' + classe : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (rotulo) el.setAttribute('aria-label', rotulo);
  el.innerHTML =
    '<div class="modal-pilha">' +
      '<div class="modal-acoes">' +
        acoes +
        '<button type="button" class="modal-fechar" aria-label="' + txt('Fechar') + '">✕</button>' +
      '</div>' +
      '<div class="modal-caixa">' + conteudo + '</div>' +
    '</div>';

  /* Clicar FORA fecha; clicar dentro, não. O alvo tem de ser o próprio véu —
     `closest('.modal-caixa')` não basta, porque a pilha também é fundo. */
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.modal-fechar')) fecharModal();
  });

  document.body.appendChild(el);
  document.documentElement.classList.add('modal-aberto');
  aberto = { el, focoAntes: document.activeElement };
  el.querySelector('.modal-fechar').focus();
  return el;
}
