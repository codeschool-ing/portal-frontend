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
/* ---------- the released version ----------

   THE PERSON ASKING IS NOT THE STUDENT. It answers "which build am I looking
   at", which is what nobody can say when a student writes in about something
   broken. So it goes at the very bottom of the account screen — the last line
   of the last screen anyone opens on purpose — and not anywhere a student
   passes through on the way to a lesson.

   THE PORTAL NEVER INVENTS IT. The single source is the `version` meta tag,
   and the release workflow refuses a tag that disagrees with it. Anything but
   a semantic version — `dev`, which is every build that is not a release —
   renders nothing, rather than link to a GitHub tag nobody created. */
function versionLine() {
  const version = document.querySelector('meta[name="version"]')?.content?.trim() || '';
  if (!/^\d+\.\d+\.\d+(?:[-+][\w.]+)?$/.test(version)) return '';
  const url = 'https://github.com/codeschool-ing/portal-frontend/releases/tag/v' + version;
  return '<p class="account-version mono dim">' +
    '<a href="' + esc(url) + '" target="_blank" rel="noopener">v' + esc(version) + '</a></p>';
}

// The base32 setup key, in groups of four, so it can be read off a screen and
// typed into an app without losing the place.
function groupKey(secret) {
  return String(secret || '').replace(/(.{4})/g, '$1 ').trim();
}

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
  const mfa = await api.mfaState();
  const t = studentTrack();
  const p = t ? trackProgress(t) : null;
  const plan = currentPlan();
  const acc = studentAccount();
  // The data-export and delete-account controls are the server's to carry out,
  // so they appear only with a backend wired; without one there is no server
  // account, only the local copy the "erase my progress" block already clears.
  const backend = api.configured();
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

    '<section class="block">' +
      '<div class="block-top"><h2>' + txt('Name') + '</h2></div>' +
      '<form id="f-name" novalidate>' +
        '<div class="field">' +
          '<label for="c-name">' + txt('your name') + '</label>' +
          '<input type="text" id="c-name" autocomplete="name" value="' + esc(session?.name || '') + '" ' +
            'placeholder="' + txt('your name') + '">' +
        '</div>' +
        '<div class="account-action">' +
          '<button type="submit" class="btn btn-primary">' + txt('Change name') + '</button>' +
          '<span class="account-notice mono" id="a-name" aria-live="polite"></span>' +
        '</div>' +
      '</form>' +
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
            'placeholder="' + txt('you@example.com') + '">' +
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
        (backend
          ? txt('Your password goes to the server, which keeps only a hash of it — it never stays in the browser. Changing it signs out your other devices.')
          : txt('No password is stored here: there is no authentication in the portal yet, and writing one to the browser would give the opposite impression.')) +
      '</p>' +
    '</section>' +

    /* Two-factor, only when the server offers it (a key is configured). Its own
       state machine — off / setting up / recovery codes / on — lives below, in
       #mfa-block, because the steps replace one another in place. */
    (mfa.available ? '<section class="block" id="mfa-block"></section>' : '') +

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

    (backend ?
      '<section class="block">' +
        '<div class="block-top"><h2>' + txt('Your data') + '</h2></div>' +
        '<p class="account-note">' +
          txt('Download a copy of everything the portal holds about you — profile, progress, exam results and certificates — as a file.') + '</p>' +
        '<div class="account-action">' +
          '<button type="button" class="btn btn-ghost" id="c-export">' + txt('Download my data') + '</button>' +
          '<span class="account-notice mono" id="a-export" aria-live="polite"></span>' +
        '</div>' +
      '</section>'
    : '') +

    (backend ?
      '<section class="block block-risk">' +
        '<div class="block-top"><h2>' + txt('Delete my account') + '</h2></div>' +
        '<p class="account-note">' +
          txt('This erases your account and everything in it — progress, notes, exam results and certificates. It cannot be undone.') + '</p>' +
        '<form id="f-delete" novalidate>' +
          '<div class="field"><label for="c-del-pass">' + txt('confirm your password to delete') + '</label>' +
            '<input type="password" id="c-del-pass" autocomplete="current-password"></div>' +
          '<div class="account-action">' +
            '<button type="submit" class="btn btn-risk">' + txt('Delete my account') + '</button>' +
            '<span class="account-notice mono" id="a-delete" aria-live="polite"></span>' +
          '</div>' +
        '</form>' +
      '</section>'
    : '') +

    '<section class="block">' +
      '<button type="button" class="btn btn-ghost" id="c-signout">' + txt('Sign out') + '</button>' +
    '</section>' +

    versionLine();

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
    try {
      const res = await api.changeEmail(value);
      emailNotice.className = 'account-notice mono good';
      // With a backend the change waits on a link at the new address; the
      // skeleton has already moved it.
      emailNotice.textContent = res && res.pending
        ? txt('Check the new address for a link to confirm the change.')
        : txt('e-mail updated');
    } catch (err) {
      emailNotice.className = 'account-notice mono bad';
      emailNotice.textContent = err.message || txt('that did not work — try again');
    }
  });

  /* ---------- name ---------- */
  const nameNotice = el.querySelector('#a-name');
  el.querySelector('#f-name').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = el.querySelector('#c-name').value.trim();
    if (!value) {
      nameNotice.className = 'account-notice mono bad';
      nameNotice.textContent = txt('type your name');
      return;
    }
    try {
      await api.changeName(value);
      el.querySelector('.view-head h1').textContent = value;
      nameNotice.className = 'account-notice mono good';
      nameNotice.textContent = txt('name updated');
    } catch (err) {
      nameNotice.className = 'account-notice mono bad';
      nameNotice.textContent = err.message || txt('that did not work — try again');
    }
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
      passwordNotice.textContent = text;
    };
    /* The order of the checks is the order the person filled the form in:
       pointing at the last field when the first is empty tells them to fix the
       wrong thing. */
    if (!currentPassword) return say(txt('type your current password'), false);
    if (!passwordStrength(fresh.value).ok) return say(txt('the new password needs at least 8 characters'), false);
    if (fresh.value !== repeat) return say(txt('the two new passwords do not match'), false);
    if (fresh.value === currentPassword) return say(txt('the new password is the same as the current'), false);
    try {
      await api.changePassword(currentPassword, fresh.value);
    } catch (err) {
      // The server's answer to a wrong current password lands here.
      return say(err.message || txt('that did not work — try again'), false);
    }
    el.querySelectorAll('#f-password input').forEach((i) => { i.value = ''; });
    meter.style.width = '0';
    label.textContent = '';
    return say(txt('password changed'), true);
  });

  /* ---------- two-factor ----------
     A small state machine in one block: off → setting up → recovery codes → on,
     and on → off. Each step replaces the last in place, so there is one place to
     look and no half-open dialogs to leave behind. */
  if (mfa.available) {
    const block = el.querySelector('#mfa-block');
    const head = '<div class="block-top"><h2>' + txt('Two-factor authentication') + '</h2></div>';
    const noticed = (cls) => {
      const n = block.querySelector('#mfa-msg');
      n.className = 'account-notice mono ' + cls;
      return n;
    };

    const renderOff = () => {
      block.innerHTML = head +
        '<p class="account-note">' + txt('Add a second step at sign-in with an authenticator app.') + '</p>' +
        '<div class="account-action">' +
          '<button type="button" class="btn btn-primary" id="mfa-enable">' + txt('Enable two-factor') + '</button>' +
          '<span class="account-notice mono" id="mfa-msg" aria-live="polite"></span>' +
        '</div>';
      block.querySelector('#mfa-enable').addEventListener('click', beginSetup);
    };

    const renderOn = () => {
      block.innerHTML = head +
        '<p class="account-note"><strong>' + txt('Two-factor is on.') + '</strong></p>' +
        '<form id="mfa-off" novalidate>' +
          '<div class="field"><label for="mfa-pass">' + txt('confirm your password to turn it off') + '</label>' +
            '<input type="password" id="mfa-pass" autocomplete="current-password"></div>' +
          '<div class="account-action">' +
            '<button type="submit" class="btn btn-ghost btn-risk">' + txt('Turn off two-factor') + '</button>' +
            '<span class="account-notice mono" id="mfa-msg" aria-live="polite"></span>' +
          '</div>' +
        '</form>';
      block.querySelector('#mfa-off').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = block.querySelector('#mfa-pass').value;
        if (!pass) { noticed('bad').textContent = txt('type your password'); return; }
        try {
          await api.mfaDisable(pass);
        } catch (err) {
          noticed('bad').textContent = err.message || txt('that did not work — try again');
          return;
        }
        renderOff();
      });
    };

    const renderCodes = (codes) => {
      block.innerHTML = head +
        '<p class="account-note"><strong>' + txt('Two-factor is on now.') + '</strong></p>' +
        '<p class="account-note">' +
          txt('Save these recovery codes. Each works once — they are the way back in if you lose your phone.') + '</p>' +
        '<ul class="mfa-codes mono">' +
          (codes || []).map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul>' +
        '<button type="button" class="btn btn-primary" id="mfa-done">' + txt('Done') + '</button>';
      block.querySelector('#mfa-done').addEventListener('click', renderOn);
    };

    async function beginSetup() {
      let data;
      try {
        data = await api.mfaSetup();
      } catch (err) {
        noticed('bad').textContent = err.message || txt('that did not work — try again');
        return;
      }
      block.innerHTML = head +
        '<p class="account-note">' +
          txt('Add this account to your authenticator app, then enter the code it shows.') + '</p>' +
        // The QR the server rendered from the same otpauth URI: scan it to add
        // the account. It is our own trusted markup (rectangles, no text or
        // script), so it goes in as-is; if the server omitted it, the key below
        // still enrols by hand.
        (data.qrSvg ? '<div class="mfa-qr">' + data.qrSvg + '</div>' : '') +
        '<p class="account-note mono">' + txt('setup key') + ': <span class="mfa-key">' +
          esc(groupKey(data.secret)) + '</span></p>' +
        '<p class="account-note"><a href="' + esc(data.otpauthUrl) + '">' +
          txt('Open in your authenticator app') + '</a></p>' +
        '<form id="mfa-confirm" novalidate>' +
          '<div class="field"><label for="mfa-code">' + txt('authentication code') + '</label>' +
            '<input type="text" id="mfa-code" inputmode="numeric" autocomplete="one-time-code"></div>' +
          '<div class="account-action">' +
            '<button type="submit" class="btn btn-primary">' + txt('Confirm') + '</button>' +
            '<button type="button" class="btn btn-ghost" id="mfa-cancel">' + txt('Cancel') + '</button>' +
            '<span class="account-notice mono" id="mfa-msg" aria-live="polite"></span>' +
          '</div>' +
        '</form>';
      block.querySelector('#mfa-cancel').addEventListener('click', renderOff);
      block.querySelector('#mfa-confirm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = block.querySelector('#mfa-code').value.trim();
        if (!code) { noticed('bad').textContent = txt('type the code from your app'); return; }
        let res;
        try {
          res = await api.mfaConfirm(code);
        } catch (err) {
          noticed('bad').textContent = err.message || txt('that did not work — try again');
          return;
        }
        renderCodes(res.recoveryCodes);
      });
    }

    if (mfa.enabled) renderOn();
    else renderOff();
  }

  const confirm = el.querySelector('#c-confirm');
  el.querySelector('#c-erase').addEventListener('click', () => { confirm.hidden = false; });
  el.querySelector('#c-no').addEventListener('click', () => { confirm.hidden = true; });
  el.querySelector('#c-yes').addEventListener('click', () => { reset(); goTo('/sign-in'); });
  el.querySelector('#c-signout').addEventListener('click', async () => { await api.signOut(); goTo('/sign-in'); });

  /* ---------- data export ---------- (only rendered with a backend) */
  const exportBtn = el.querySelector('#c-export');
  if (exportBtn) {
    const exportNotice = el.querySelector('#a-export');
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportNotice.className = 'account-notice mono';
      exportNotice.textContent = txt('Preparing…');
      try {
        const blob = await api.exportData();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codeschool-data.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        exportNotice.className = 'account-notice mono good';
        exportNotice.textContent = txt('downloaded');
      } catch (err) {
        exportNotice.className = 'account-notice mono bad';
        exportNotice.textContent = err.message || txt('that did not work — try again');
      } finally {
        exportBtn.disabled = false;
      }
    });
  }

  /* ---------- delete account ---------- (only rendered with a backend) */
  const deleteForm = el.querySelector('#f-delete');
  if (deleteForm) {
    const deleteNotice = el.querySelector('#a-delete');
    deleteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = el.querySelector('#c-del-pass').value;
      if (!pass) {
        deleteNotice.className = 'account-notice mono bad';
        deleteNotice.textContent = txt('type your password');
        return;
      }
      try {
        await api.deleteAccount(pass);
        goTo('/sign-in');
      } catch (err) {
        deleteNotice.className = 'account-notice mono bad';
        deleteNotice.textContent = err.message || txt('that did not work — try again');
      }
    });
  }

  return { title: txt('Account'), el };
}
