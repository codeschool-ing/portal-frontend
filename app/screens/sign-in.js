/* ==========================================================================
   Sign in — and, with a backend, register.

   THREE SHAPES, one screen:

     no backend   the skeleton. Any name gets in, and a track is chosen here
                  because there is no server to restore one from — the offline
                  bundle and the browser suites both rely on this.
     sign in      e-mail and password, nothing else. The name is not a
                  credential (identity checks the pair and hands the name back),
                  and the track is not asked: `adopt` leaves the browser's
                  enrolment alone, so a returning student keeps theirs. Asking
                  for either was friction that also silently reset the track.
     register     name, e-mail and password. The track is chosen later, on the
                  dashboard, the same place a new account is sent to pick one.
   ========================================================================== */

import * as api from '../api.js';
import * as sync from '../sync.js';
import { goTo } from '../routes.js';

import { esc } from '../text.js';

export default async function signIn() {
  const el = document.createElement('div');
  el.className = 'view view-signin';

  const backend = sync.configured();
  let mode = 'signin';        // 'signin' | 'register' — only meaningful with a backend
  let phase = 'credentials';  // 'credentials' | 'mfa'
  let chosenTrack = null;     // captured for the skeleton, before the form can be redrawn

  const trackOptions = TRACKS.map((t) =>
    '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>').join('');

  el.innerHTML =
    '<div class="signin-box">' +
      '<div class="term-bar">' +
        '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
        '<span class="modal-file">session.new</span>' +
      '</div>' +
      '<div class="signin-body">' +
        '<h1>' + txt('Student area') + '</h1>' +
        '<p class="signin-sub" id="e-sub"></p>' +
        '<form id="form-signin" novalidate></form>' +
        '<p class="signin-notice mono dim" id="e-notice" aria-live="polite"></p>' +
      '</div>' +
    '</div>';

  const form = el.querySelector('#form-signin');
  const sub = el.querySelector('#e-sub');
  const notice = el.querySelector('#e-notice');
  const say = (message) => {
    notice.textContent = message;
    notice.className = 'signin-notice mono bad';
  };

  const nameField = () =>
    '<div class="field"><label for="e-name">' + txt('name') + '</label>' +
      '<input id="e-name" type="text" required autocomplete="name" placeholder="' + txt('your name') + '" /></div>';

  function renderForm() {
    if (!backend) {
      sub.textContent = txt('Sign in to pick up where you left off.');
      form.innerHTML =
        nameField() +
        '<div class="field"><label for="e-track">' + txt('your track') + '</label>' +
          '<select id="e-track">' + trackOptions + '</select></div>' +
        '<button type="submit" class="btn btn-primary">' + txt('Sign in') + '</button>';
      notice.textContent = txt('[skeleton — there is no authentication: any name gets in]');
      notice.className = 'signin-notice mono dim';
      return;
    }
    const register = mode === 'register';
    sub.textContent = register
      ? txt('Create an account to start.')
      : txt('Sign in to pick up where you left off.');
    form.innerHTML =
      (register ? nameField() : '') +
      '<div class="field"><label for="e-email">' + txt('sign-in e-mail') + '</label>' +
        '<input id="e-email" type="email" required autocomplete="email" ' +
        'placeholder="' + txt('you@example.com') + '" /></div>' +
      '<div class="field"><label for="e-password">' + txt('password') + '</label>' +
        '<input id="e-password" type="password" required autocomplete="' +
        (register ? 'new-password' : 'current-password') + '" /></div>' +
      '<button type="submit" class="btn btn-primary">' +
        (register ? txt('Create an account') : txt('Sign in')) + '</button>' +
      '<button type="button" class="btn btn-ghost" id="e-toggle">' +
        (register ? txt('Sign in') : txt('Create an account')) + '</button>';
    notice.textContent = '';
    notice.className = 'signin-notice mono dim';
  }

  const focusFirst = () => el.querySelector('#e-name, #e-email, #e-code')?.focus();

  /* Land on the dashboard. The skeleton seeds its track on the way, because
     nothing else will; the backend does not, because the enrolment already
     survived in the browser (or, for a new account, is chosen on the dashboard). */
  const finish = async () => {
    if (!backend && chosenTrack) await api.enrol(chosenTrack);
    goTo('/dashboard');
  };

  // Password was right and a code is owed: swap the form for a code field. The
  // challenge cookie is already set, so only the code is needed now.
  const showCodeStep = () => {
    phase = 'mfa';
    sub.textContent = txt('Enter the code from your authenticator app, or a recovery code.');
    form.innerHTML =
      '<div class="field"><label for="e-code">' + txt('authentication code') + '</label>' +
        '<input id="e-code" type="text" inputmode="numeric" autocomplete="one-time-code" /></div>' +
      '<button type="submit" class="btn btn-primary">' + txt('Verify') + '</button>';
    notice.textContent = '';
    form.querySelector('#e-code').focus();
  };

  const enter = async () => {
    try {
      if (!backend) {
        const name = form.querySelector('#e-name').value.trim();
        if (!name) return form.querySelector('#e-name').focus();
        chosenTrack = form.querySelector('#e-track').value;
        await api.signIn({ name });
      } else {
        const email = form.querySelector('#e-email').value.trim();
        const password = form.querySelector('#e-password').value;
        if (!email || !password) return form.querySelector('#e-email').focus();
        let result;
        if (mode === 'register') {
          const name = form.querySelector('#e-name').value.trim();
          if (!name) return form.querySelector('#e-name').focus();
          result = await api.register({ name, email, password });
        } else {
          result = await api.signIn({ email, password });
        }
        // A second factor is enrolled: collect the code before anything else.
        if (result && result.mfaRequired) return showCodeStep();
      }
    } catch (err) {
      /* The server's own message: identity says the same thing for an unknown
         e-mail as for a wrong password, so relaying it leaks nothing. */
      return say(err.message || txt('that did not work — try again'));
    }
    await finish();
    return undefined;
  };

  const verify = async () => {
    const code = form.querySelector('#e-code').value.trim();
    if (!code) return form.querySelector('#e-code').focus();
    try {
      await api.completeMfa(code);
    } catch (err) {
      return say(err.message || txt('that did not work — try again'));
    }
    await finish();
    return undefined;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (phase === 'mfa') verify();
    else enter();
  });
  // The register/sign-in toggle lives inside the form, which renderForm rebuilds,
  // so the listener is on the form and reads the button by id.
  form.addEventListener('click', (e) => {
    if (e.target.id === 'e-toggle') {
      mode = mode === 'register' ? 'signin' : 'register';
      renderForm();
      focusFirst();
    }
  });

  renderForm();
  return { title: txt('Sign in'), el, after: focusFirst };
}
