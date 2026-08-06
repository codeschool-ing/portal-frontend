/* ==========================================================================
   Sign in.

   FUTURE: real authentication. Today any name gets in — the screen exists so the
   rest of the portal can assume a session exists, not to protect anything. It
   says so on the screen itself, so nobody confuses a skeleton with security.
   ========================================================================== */

import * as api from '../api.js';
import { goTo } from '../routes.js';
import { TRACKS_BY_FAMILY } from './common.js';
import { esc } from '../text.js';

export default async function signIn() {
  const el = document.createElement('div');
  el.className = 'view view-signin';

  const options = TRACKS_BY_FAMILY().map(([family, list]) =>
    '<optgroup label="' + txt('tracks por ' + family) + '">' +
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
          '<div class="field"><label for="e-track">' + txt('your track') + '</label>' +
            '<select id="e-track">' + options + '</select></div>' +
          '<button type="submit" class="btn btn-primary">' + txt('Sign in') + '</button>' +
        '</form>' +
        '<p class="signin-notice mono dim">' +
          txt('[skeleton — there is no authentication: any name gets in]') +
        '</p>' +
      '</div>' +
    '</div>';

  el.querySelector('#form-signin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el.querySelector('#e-name').value.trim();
    if (!name) return el.querySelector('#e-name').focus();
    await api.signIn({ name: name });
    await api.enrol(el.querySelector('#e-track').value);
    goTo('/dashboard');
  });

  return { title: txt('Sign in'), el, after: () => el.querySelector('#e-name').focus() };
}
