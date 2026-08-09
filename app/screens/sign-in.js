/* ==========================================================================
   Sign in.

   FUTURE: real authentication. Today any name gets in — the screen exists so the
   rest of the portal can assume a session exists, not to protect anything. It
   says so on the screen itself, so nobody confuses a skeleton with security.
   ========================================================================== */

import * as api from '../api.js';
import * as sync from '../sync.js';
import { goTo } from '../routes.js';
import { TRACKS_BY_FAMILY } from './common.js';
import { esc } from '../text.js';

export default async function signIn() {
  const el = document.createElement('div');
  el.className = 'view view-signin';

  const options = TRACKS_BY_FAMILY().map(([family, list]) =>
    '<optgroup label="' + txt('tracks by ' + family) + '">' +
      list.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<div class="signin-box">' +
      '<div class="term-bar">' +
        '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
        '<span class="modal-file">session.new</span>' +
      '</div>' +
      '<div class="signin-body">' +
        '<h1>' + txt('Student area') + '</h1>' +
        '<p class="signin-sub">' + txt('Sign in to pick up where you left off.') + '</p>' +
        '<form id="form-signin" novalidate>' +
          '<div class="field"><label for="e-name">' + txt('name') + '</label>' +
            '<input id="e-name" type="text" required autocomplete="name" placeholder="' + txt('your name') + '" /></div>' +
          /* The credentials exist only when there is somebody to check them.
             With no backend the fields would be a form that pretends, and the
             notice below says so instead. */
          (sync.configured()
            ? '<div class="field"><label for="e-email">' + txt('sign-in e-mail') + '</label>' +
                '<input id="e-email" type="email" required autocomplete="email" ' +
                'placeholder="' + txt('you@example.com') + '" /></div>' +
              '<div class="field"><label for="e-password">' + txt('password') + '</label>' +
                '<input id="e-password" type="password" required autocomplete="current-password" /></div>'
            : '') +
          '<div class="field"><label for="e-track">' + txt('your track') + '</label>' +
            '<select id="e-track">' + options + '</select></div>' +
          '<button type="submit" class="btn btn-primary">' + txt('Sign in') + '</button>' +
          (sync.configured()
            ? '<button type="button" class="btn btn-ghost" id="e-register">' +
                txt('Create an account') + '</button>'
            : '') +
        '</form>' +
        '<p class="signin-notice mono dim" id="e-notice" aria-live="polite">' +
          (sync.configured() ? '' : txt('[skeleton — there is no authentication: any name gets in]')) +
        '</p>' +
      '</div>' +
    '</div>';

  const notice = el.querySelector('#e-notice');
  const say = (message) => {
    notice.textContent = message;
    notice.className = 'signin-notice mono bad';
  };

  /* Enrol then land on the dashboard — the tail both a plain sign-in and a
     second-factor one end with. The track is captured before the form is
     redrawn for the code step, so the choice survives that redraw. */
  let chosenTrack = null;
  const finish = async () => {
    await api.enrol(chosenTrack);
    goTo('/dashboard');
  };

  // Password was right and a code is owed. Swap the form for a code field; the
  // challenge cookie is already set, so only the code is needed now.
  let phase = 'credentials';
  const showCodeStep = () => {
    phase = 'mfa';
    const form = el.querySelector('#form-signin');
    form.innerHTML =
      '<p class="signin-sub">' + txt('Enter the code from your authenticator app, or a recovery code.') + '</p>' +
      '<div class="field"><label for="e-code">' + txt('authentication code') + '</label>' +
        '<input id="e-code" type="text" inputmode="numeric" autocomplete="one-time-code" /></div>' +
      '<button type="submit" class="btn btn-primary">' + txt('Verify') + '</button>';
    notice.textContent = '';
    form.querySelector('#e-code').focus();
  };

  /* One submit path for both buttons: everything after the credentials is the
     same, and two copies of "enrol, then go to the dashboard" is two places for
     the enrolment to be forgotten. */
  const enter = async (create) => {
    const name = el.querySelector('#e-name').value.trim();
    if (!name) return el.querySelector('#e-name').focus();
    chosenTrack = el.querySelector('#e-track').value;

    try {
      if (!sync.configured()) {
        await api.signIn({ name });
      } else {
        const email = el.querySelector('#e-email').value.trim();
        const password = el.querySelector('#e-password').value;
        if (!email || !password) return el.querySelector('#e-email').focus();
        const result = await (create
          ? api.register({ name, email, password })
          : api.signIn({ name, email, password }));
        // A second factor is enrolled: collect the code before anything else.
        if (result && result.mfaRequired) return showCodeStep();
      }
    } catch (err) {
      /* The server's own message, because it is the one that knows what went
         wrong — and identity is careful to say the same thing for an unknown
         e-mail as for a wrong password, so relaying it leaks nothing. */
      return say(err.message || txt('that did not work — try again'));
    }
    await finish();
    return undefined;
  };

  // The second step: the code against the challenge cookie.
  const verify = async () => {
    const code = el.querySelector('#e-code').value.trim();
    if (!code) return el.querySelector('#e-code').focus();
    try {
      await api.completeMfa(code);
    } catch (err) {
      return say(err.message || txt('that did not work — try again'));
    }
    await finish();
    return undefined;
  };

  el.querySelector('#form-signin').addEventListener('submit', (e) => {
    e.preventDefault();
    if (phase === 'mfa') verify();
    else enter(false);
  });
  el.querySelector('#e-register')?.addEventListener('click', () => enter(true));

  return { title: txt('Sign in'), el, after: () => el.querySelector('#e-name').focus() };
}
