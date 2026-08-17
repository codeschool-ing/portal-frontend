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

import { currentPlan, studentAccount } from '../state.js';
import { esc } from '../text.js';
import { subscribeHref, withCounts } from './common.js';

const price = (p) => (p.price === 0
  ? txt('free')
  : 'R$ ' + p.price + '<span class="pl-cycle">' + txt(p.cycle) + '</span>');

/* The catalogue's real size, dropped into an already-translated sentence.

   THE SIZE USED TO BE TYPED INTO THE SENTENCE, and it went stale: this card
   said 86 courses and 16 tracks long after the catalogue passed 122 and 19 —
   the school underselling itself by a third on the one screen where somebody
   decides whether to pay. The numbers live in COURSES and TRACKS, and now they
   are read from there.

   The counts in `{courses}` / `{tracks}` are filled by `withCounts`, which
   moved to ./common.js when the subscription invitation started needing the
   same feature sentences. */


const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 5"/></svg>';
const DASH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M4 8h8"/></svg>';

export default async function plan() {
  const el = document.createElement('div');
  el.className = 'view screen-plan';
  const current = currentPlan();
  const account = studentAccount();
  const plans = window.PLANS || [];
  const features = window.FEATURES || {};

  if (!current) {
    el.innerHTML = '<p class="empty">' + txt('No plan configured.') + '</p>';
    return { title: txt('My plan'), el };
  }

  const since = account.since
    ? new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(account.since))
    : null;

  /* Every feature ANY plan offers becomes a row, in the order they appear in
     FEATURES. Listing only the current plan's would hide precisely what the
     person came to see. */
  const keys = Object.keys(features).filter((k) => plans.some((p) => p.includes.includes(k)));

  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + txt('My plan') + '</h1>' +
      '<p>' + txt('What you subscribed to, what it includes and what changes if you switch.') + '</p>' +
    '</header>' +

    '<section class="block pl-current">' +
      '<div class="pl-current-top">' +
        '<div>' +
          '<span class="pl-label mono">' + txt('current plan') + '</span>' +
          '<h2>' + esc(current.name) + '</h2>' +
          '<p class="pl-summary">' + esc(current.summary) + '</p>' +
        '</div>' +
        '<span class="pl-price">' + price(current) + '</span>' +
      '</div>' +
      '<div class="pl-facts mono dim">' +
        (since ? '<span>' + txt('since') + ' ' + esc(since) + '</span>' : '') +
        '<span>' + current.includes.length + ' ' + txt('of') + ' ' + keys.length + ' ' + txt('features') + '</span>' +
        (account.email ? '<span>' + esc(account.email) + '</span>' : '') +
      '</div>' +
    '</section>' +

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('What each plan includes') + '</h2></div>' +
      '<div class="pl-table-scroll">' +
        '<table class="pl-table">' +
          '<thead><tr><th scope="col">' + txt('feature') + '</th>' +
            plans.map((p) => '<th scope="col"' + (p.id === current.id ? ' class="on"' : '') + '>' +
              esc(p.name) +
              (p.id === current.id ? '<span class="pl-yours mono">' + txt('yours') + '</span>' : '') +
            '</th>').join('') +
          '</tr></thead>' +
          '<tbody>' +
            keys.map((k) => '<tr><th scope="row">' + withCounts(txt(features[k])) + '</th>' +
              plans.map((p) => {
                const has = p.includes.includes(k);
                return '<td class="' + (has ? 'yes' : 'no') + (p.id === current.id ? ' on' : '') + '">' +
                  (has ? CHECK : DASH) +
                  '<span class="pl-hidden">' + txt(has ? 'included' : 'not included') + '</span>' +
                '</td>';
              }).join('') +
            '</tr>').join('') +
            '<tr class="pl-action-row"><th scope="row"></th>' +
              plans.map((p) => '<td' + (p.id === current.id ? ' class="on"' : '') + '>' +
                (p.id === current.id
                  ? '<span class="pl-already mono">' + txt('your plan') + '</span>'
                  /* THE BUTTON WROTE localStorage AND NOTHING ELSE, which was
                     harmless make-believe until the server started enforcing
                     the plan. After that it produced a student who believed
                     they had paid and went on being refused every paid course,
                     with nothing on screen explaining the contradiction.
                     It asks for the subscription now, the same way the locked
                     course does. Going DOWN a plan is not offered at all:
                     nobody has ever asked to be given less, and cancelling is
                     a conversation rather than a button. */
                  : (p.price > current.price
                    ? '<a class="btn btn-primary" href="' + subscribeHref('') + '">'
                      + esc(txt('Ask for the subscription')) + '</a>'
                    : '<span class="pl-already mono">' + txt('free') + '</span>')) +
              '</td>').join('') +
            '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
      /* THIS PARAGRAPH SAID THE OPPOSITE, and it was right when it was
         written: nothing was locked, because locking needs a server and a lock
         kept in the browser is theatre. The server exists now and the lock is
         real, so the sentence had to go rather than be softened — a screen that
         tells a student their plan changes nothing is worse than one that says
         nothing at all. */
      '<p class="account-note mono dim">' +
        txt('The first course of every track is free, in full. Everything past it is the subscription.') +
      '</p>' +
    '</section>';

  return { title: txt('My plan'), el };
}
