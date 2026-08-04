/* ==========================================================================
   My Plan.

   It answers three questions, in the order they appear: what I subscribed to,
   what that gives me, and what I would gain by changing.

   THE COMPARISON IS BY FEATURE, NOT BY PRICE CARD. Three cards side by side with
   independent lists is the format of a SALES page — it serves someone who has
   not chosen yet. Someone who already subscribed has a different question: "what
   do I NOT have?". The table answers that one, because it lines the same row up
   across all three plans and the gap becomes visible without comparative
   reading.

   Switching is immediate and free, and the screen says so outright. Faking a
   checkout that does not exist would be the portal's only lie with a real
   consequence — somebody would believe they had paid.
   ========================================================================== */

import { currentPlan, studentAccount, changePlan } from '../state.js';
import { dispatch } from '../routes.js';
import { esc } from '../text.js';

const price = (p) => (p.preco === 0
  ? txt('grátis')
  : 'R$ ' + p.preco + '<span class="pl-ciclo">' + txt(p.ciclo) + '</span>');

const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 5"/></svg>';
const DASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M4 8h8"/></svg>';

export default async function plan() {
  const el = document.createElement('div');
  el.className = 'tela tela-plano';
  const current = currentPlan();
  const account = studentAccount();
  const plans = window.PLANOS || [];
  const features = window.RECURSOS || {};

  if (!current) {
    el.innerHTML = '<p class="vazio">' + txt('Nenhum plano configurado.') + '</p>';
    return { titulo: txt('Meu plano'), el };
  }

  const since = account.desde
    ? new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(account.desde))
    : null;

  /* Every feature ANY plan offers becomes a row, in the order they appear in
     RECURSOS. Listing only the current plan's would hide precisely what the
     person came to see. */
  const keys = Object.keys(features).filter((k) => plans.some((p) => p.inclui.includes(k)));

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Meu plano') + '</h1>' +
      '<p>' + txt('O que você assinou, o que ele inclui e o que muda se você trocar.') + '</p>' +
    '</header>' +

    '<section class="bloco pl-atual">' +
      '<div class="pl-atual-topo">' +
        '<div>' +
          '<span class="pl-rot mono">' + txt('plano atual') + '</span>' +
          '<h2>' + esc(current.nome) + '</h2>' +
          '<p class="pl-resumo">' + esc(current.resumo) + '</p>' +
        '</div>' +
        '<span class="pl-preco">' + price(current) + '</span>' +
      '</div>' +
      '<div class="pl-fatos mono dim">' +
        (since ? '<span>' + txt('desde') + ' ' + esc(since) + '</span>' : '') +
        '<span>' + current.inclui.length + ' ' + txt('de') + ' ' + keys.length + ' ' + txt('recursos') + '</span>' +
        (account.email ? '<span>' + esc(account.email) + '</span>' : '') +
      '</div>' +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('O que cada plano inclui') + '</h2></div>' +
      '<div class="pl-tabela-rolo">' +
        '<table class="pl-tabela">' +
          '<thead><tr><th scope="col">' + txt('recurso') + '</th>' +
            plans.map((p) => '<th scope="col"' + (p.id === current.id ? ' class="on"' : '') + '>' +
              esc(p.nome) +
              (p.id === current.id ? '<span class="pl-seu mono">' + txt('seu') + '</span>' : '') +
            '</th>').join('') +
          '</tr></thead>' +
          '<tbody>' +
            keys.map((k) => '<tr><th scope="row">' + txt(features[k]) + '</th>' +
              plans.map((p) => {
                const has = p.inclui.includes(k);
                return '<td class="' + (has ? 'sim' : 'nao') + (p.id === current.id ? ' on' : '') + '">' +
                  (has ? CHECK : DASH) +
                  '<span class="pl-oculto">' + txt(has ? 'incluído' : 'não incluído') + '</span>' +
                '</td>';
              }).join('') +
            '</tr>').join('') +
            '<tr class="pl-linha-acao"><th scope="row"></th>' +
              plans.map((p) => '<td' + (p.id === current.id ? ' class="on"' : '') + '>' +
                (p.id === current.id
                  ? '<span class="pl-ja mono">' + txt('seu plano') + '</span>'
                  : '<button type="button" class="btn ' + (p.preco > current.preco ? 'btn-primary' : 'btn-ghost') +
                    ' pl-trocar" data-plano="' + esc(p.id) + '">' +
                    txt(p.preco > current.preco ? 'Fazer upgrade' : 'Mudar para este') + '</button>') +
              '</td>').join('') +
            '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<p class="conta-nota mono dim">' +
        txt('Nenhum conteúdo do portal é bloqueado por plano hoje — travar exige servidor, e com o estado no navegador qualquer trava seria teatro.') +
      '</p>' +
    '</section>';

  el.addEventListener('click', (e) => {
    const b = e.target.closest('.pl-trocar');
    if (!b) return;
    changePlan(b.dataset.plano);
    // rebuild the screen so the table and the header agree with the new plan
    dispatch();
  });

  return { titulo: txt('Meu plano'), el };
}
