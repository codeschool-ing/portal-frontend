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
  el.className = 'tela tela-entrar';

  const options = TRACKS_BY_FAMILY().map(([family, list]) =>
    '<optgroup label="' + txt('trilhas por ' + family) + '">' +
      list.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<div class="entrar-caixa">' +
      '<div class="term-bar">' +
        '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
        '<span class="modal-arquivo">sessao.nova</span>' +
      '</div>' +
      '<div class="entrar-corpo">' +
        '<h1>' + txt('Student area') + '</h1>' +
        '<p class="entrar-sub">' + txt('Sign in to pick up where you left off.') + '</p>' +
        '<form id="form-entrar" novalidate>' +
          '<div class="campo"><label for="e-nome">' + txt('name') + '</label>' +
            '<input id="e-nome" type="text" required autocomplete="name" placeholder="' + txt('your name') + '" /></div>' +
          '<div class="campo"><label for="e-trilha">' + txt('your track') + '</label>' +
            '<select id="e-trilha">' + options + '</select></div>' +
          '<button type="submit" class="btn btn-primary">' + txt('Sign in') + '</button>' +
        '</form>' +
        '<p class="entrar-aviso mono dim">' +
          txt('[skeleton — there is no authentication: any name gets in]') +
        '</p>' +
      '</div>' +
    '</div>';

  el.querySelector('#form-entrar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el.querySelector('#e-nome').value.trim();
    if (!name) return el.querySelector('#e-nome').focus();
    await api.signIn({ name: name });
    await api.enrol(el.querySelector('#e-trilha').value);
    goTo('/painel');
  });

  return { title: txt('Sign in'), el, after: () => el.querySelector('#e-nome').focus() };
}
