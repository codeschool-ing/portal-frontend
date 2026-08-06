/* ==========================================================================
   Account.

   "Erase my progress" exists because, while the state lives in localStorage, it
   is the only way back to zero for testing the portal — and because one day,
   with a server, that option becomes a legal requirement rather than a whim. It
   asks for confirmation first: erasing without asking is the kind of thing that
   has no undo.
   ========================================================================== */

import * as api from '../api.js';
import { reset, now, currentPlan, studentAccount } from '../state.js';
import { goTo } from '../routes.js';
import { TRACKS_BY_FAMILY, studentTrack, trackProgress } from './common.js';
import { esc } from '../text.js';

/* The e-mail rule is deliberately LOOSE: "there is an at sign, a dot after it,
   and no spaces". Strict client-side e-mail validation rejects valid addresses
   (`+`, new domains, accents) and prevents nothing — what confirms the address
   exists is the message sent to it, in Stage 2. */
const plausibleEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

/* Password strength by BANDS, not by prohibitive rules. A long passphrase is
   worth more than "P@ss1!" and no "must contain a symbol" rule captures that;
   the bar measures and informs, and the minimum is only the length. */
function passwordStrength(s) {
  const v = String(s || '');
  if (v.length < 8) return { pct: Math.min(30, v.length * 4), label: 'too short', ok: false };
  let points = Math.min(50, v.length * 3);
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) points += 12;
  if (/\d/.test(v)) points += 12;
  if (/[^\w]/.test(v)) points += 14;
  if (new Set(v).size > 10) points += 12;
  const pct = Math.min(100, points);
  return { pct, label: pct >= 80 ? 'strong' : (pct >= 55 ? 'fair' : 'weak'), ok: true };
}

export default async function account() {
  const el = document.createElement('div');
  el.className = 'view view-account';
  const session = await api.session();
  const t = studentTrack();
  const p = t ? trackProgress(t) : null;
  const plan = currentPlan();
  const acc = studentAccount();
  void now;

  const options = TRACKS_BY_FAMILY().map(([family, list]) =>
    '<optgroup label="' + txt('tracks by ' + family) + '">' +
      list.map((x) => '<option value="' + esc(x.id) + '"' + (t && x.id === t.id ? ' selected' : '') + '>' +
        esc(x.name) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + esc(session?.name || txt('student')) + '</h1>' +
    '</header>' +

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('Your track') + '</h2></div>' +
      '<div class="field"><label for="c-track">' + txt('current track') + '</label>' +
        '<select id="c-track">' + options + '</select></div>' +
      (p ? '<p class="account-note">' + p.done + '/' + p.total + ' ' + txt('lessons') + ' · ' + p.pct + '%</p>' : '') +
      '<p class="account-note mono dim">' +
        txt('Switching track erases nothing: progress is per course, and a shared course keeps counting.') +
      '</p>' +
    '</section>' +

    '<section class="block">' +
      '<div class="block-top">' +
        '<h2>' + txt('Plan') + '</h2>' +
        '<a class="block-link" href="#/plan">' + txt('see plan details') + ' →</a>' +
      '</div>' +
      '<p class="account-note">' +
        '<strong>' + esc(plan ? plan.name : '—') + '</strong> · ' +
        (plan && plan.price === 0 ? txt('free') : 'R$ ' + (plan?.price ?? 0) + ' ' + txt(plan?.cycle || '')) +
      '</p>' +
    '</section>' +

    /* E-MAIL AND PASSWORD ARE TWO FORMS, and not fields of one profile form.
       Changing an e-mail and changing a password are operations with different
       consequences, different confirmations and, on the server, different
       endpoints. Joining them under one "save" would only make people change one
       by accident. */
    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('E-mail') + '</h2></div>' +
      '<form id="f-email" novalidate>' +
        '<div class="field">' +
          '<label for="c-email">' + txt('sign-in e-mail') + '</label>' +
          '<input type="email" id="c-email" autocomplete="email" value="' + esc(acc.email) + '" ' +
            'placeholder="you@example.com">' +
        '</div>' +
        '<div class="account-action">' +
          '<button type="submit" class="btn btn-primary">' + txt('Change e-mail') + '</button>' +
          '<span class="account-notice mono" id="a-email" aria-live="polite"></span>' +
        '</div>' +
      '</form>' +
      '<p class="account-note mono dim">' +
        txt('In Stage 2 the change only takes effect once confirmed at the new address — otherwise changing the e-mail would be the easiest way to take over an account.') +
      '</p>' +
    '</section>' +

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('Password') + '</h2></div>' +
      '<form id="f-password" novalidate>' +
        '<div class="field">' +
          '<label for="c-password-current">' + txt('current password') + '</label>' +
          '<input type="password" id="c-password-current" autocomplete="current-password">' +
        '</div>' +
        '<div class="field">' +
          '<label for="c-password-new">' + txt('new password') + '</label>' +
          '<input type="password" id="c-password-new" autocomplete="new-password">' +
          '<span class="password-meter"><span class="bar"><span class="bar-fill" style="width:0"></span></span>' +
            '<span class="password-label mono dim"></span></span>' +
        '</div>' +
        '<div class="field">' +
          '<label for="c-password-repeat">' + txt('repeat the new password') + '</label>' +
          '<input type="password" id="c-password-repeat" autocomplete="new-password">' +
        '</div>' +
        '<div class="account-action">' +
          '<button type="submit" class="btn btn-primary">' + txt('Change password') + '</button>' +
          '<span class="account-notice mono" id="a-password" aria-live="polite"></span>' +
        '</div>' +
      '</form>' +
      '<p class="account-note mono dim">' +
        txt('No password is stored here: there is no authentication in the portal yet, and writing one to the browser would give the opposite impression.') +
      '</p>' +
    '</section>' +

    '<section class="block block-risk">' +
      '<div class="block-top"><h2>' + txt('Erase my progress') + '</h2></div>' +
      '<p class="account-note">' + txt('Removes completed lessons, answers and the enrolment. There is no undo.') + '</p>' +
      '<button type="button" class="btn btn-ghost btn-risk" id="c-erase">' + txt('Erase everything') + '</button>' +
      '<p class="account-confirm" id="c-confirm" hidden>' +
        '<span>' + txt('Are you sure?') + '</span>' +
        '<button type="button" class="btn btn-risk" id="c-yes">' + txt('Yes, erase') + '</button>' +
        '<button type="button" class="btn btn-ghost" id="c-no">' + txt('Cancel') + '</button>' +
      '</p>' +
    '</section>' +

    '<section class="block">' +
      '<button type="button" class="btn btn-ghost" id="c-signout">' + txt('Sign out') + '</button>' +
    '</section>';

  el.querySelector('#c-track').addEventListener('change', async (e) => {
    await api.enrol(e.target.value);
    goTo('/track');
  });

  /* ---------- e-mail ---------- */
  const emailNotice = el.querySelector('#a-email');
  el.querySelector('#f-email').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = el.querySelector('#c-email').value.trim();
    if (!plausibleEmail(value)) {
      emailNotice.className = 'account-notice mono bad';
      emailNotice.textContent = txt('that address does not look like an e-mail');
      return;
    }
    await api.changeEmail(value);
    emailNotice.className = 'account-notice mono good';
    emailNotice.textContent = txt('e-mail updated');
  });

  /* ---------- password ---------- */
  const fresh = el.querySelector('#c-password-new');
  const meter = el.querySelector('.password-meter .bar-fill');
  const label = el.querySelector('.password-label');
  fresh.addEventListener('input', () => {
    const f = passwordStrength(fresh.value);
    meter.style.width = f.pct + '%';
    label.textContent = fresh.value ? txt(f.label) : '';
  });

  const passwordNotice = el.querySelector('#a-password');
  el.querySelector('#f-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = el.querySelector('#c-password-current').value;
    const repeat = el.querySelector('#c-password-repeat').value;
    const say = (text, good) => {
      passwordNotice.className = 'account-notice mono ' + (good ? 'good' : 'bad');
      passwordNotice.textContent = txt(text);
    };
    /* The order of the checks is the order the person filled the form in:
       pointing at the last field when the first is empty tells them to fix the
       wrong thing. */
    if (!currentPassword) return say('type your current password', false);
    if (!passwordStrength(fresh.value).ok) return say('the new password needs at least 8 characters', false);
    if (fresh.value !== repeat) return say('the two new passwords do not match', false);
    if (fresh.value === currentPassword) return say('the new password is the same as the current', false);
    await api.changePassword(fresh.value);
    el.querySelectorAll('#f-password input').forEach((i) => { i.value = ''; });
    meter.style.width = '0';
    label.textContent = '';
    return say('password changed', true);
  });

  const confirm = el.querySelector('#c-confirm');
  el.querySelector('#c-erase').addEventListener('click', () => { confirm.hidden = false; });
  el.querySelector('#c-no').addEventListener('click', () => { confirm.hidden = true; });
  el.querySelector('#c-yes').addEventListener('click', () => { reset(); goTo('/sign-in'); });
  el.querySelector('#c-signout').addEventListener('click', async () => { await api.signOut(); goTo('/sign-in'); });

  return { title: txt('Account'), el };
}
