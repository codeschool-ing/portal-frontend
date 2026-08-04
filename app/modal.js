/* ==========================================================================
   Modal — the vitrine's, reused as is.

   The classes (`.modal`, `.modal-caixa`, `html.modal-aberto`) come from
   `base.css`, which is a copy of the vitrine's: the dimming, the blur, the
   entrance animation and the frozen background were already solved there, and
   solved for the same reason that would apply here.

   THE FREEZING IS IN THE CSS, NOT IN JAVASCRIPT, and the base.css comment
   explains why: catching only the wheel and touch still let through the
   scrollbar, trackpad inertia and the arrow keys inside a field.
   `overflow:hidden` on the document solves all three, and without repositioning
   anything — the page stays exactly where it was.

   WHAT THIS MODULE ADDS is what a portal needs and a shop window does not:
   giving focus back to whoever opened it. Someone who arrived by keyboard has to
   return to the same place on close, or focus lands at the top of the document
   and they have to scroll the whole list again to find where they were.
   ========================================================================== */

let open = null;

export const modalOpen = () => Boolean(open);

export function closeModal() {
  if (!open) return;
  const { el, focusedBefore } = open;
  open = null;
  el.remove();
  document.documentElement.classList.remove('modal-aberto');
  if (focusedBefore && document.contains(focusedBefore)) focusedBefore.focus();
}

/* `content` is HTML already escaped by the caller — this module does not know
   what it is showing, and should not know. `actions` is what appears ABOVE the
   box, on the right: on a certificate, the sharing buttons. */
export function openModal(content, { classe = '', acoes = '', rotulo = '' } = {}) {
  closeModal();

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
      '<div class="modal-caixa">' + content + '</div>' +
    '</div>';

  /* Clicking OUTSIDE closes; clicking inside does not. The target has to be the
     veil itself — `closest('.modal-caixa')` is not enough, because the stack is
     also background. */
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.modal-fechar')) closeModal();
  });

  document.body.appendChild(el);
  document.documentElement.classList.add('modal-aberto');
  open = { el, focusedBefore: document.activeElement };
  el.querySelector('.modal-fechar').focus();
  return el;
}
