/* ==========================================================================
   Entrar.

   FUTURO: autenticação de verdade. Hoje qualquer nome entra — a tela existe
   para que o resto do portal possa assumir que existe uma sessão, não para
   proteger coisa alguma. Está escrito na própria tela, para ninguém confundir
   esqueleto com segurança.
   ========================================================================== */

import * as api from '../api.js';
import { irPara } from '../rotas.js';
import { TRILHAS_POR_FAMILIA } from './comum.js';
import { esc } from '../texto.js';

export default async function entrar() {
  const el = document.createElement('div');
  el.className = 'tela tela-entrar';

  const opcoes = TRILHAS_POR_FAMILIA().map(([familia, lista]) =>
    '<optgroup label="' + txt('trilhas por ' + familia) + '">' +
      lista.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.nome) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<div class="entrar-caixa">' +
      '<div class="term-bar">' +
        '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
        '<span class="modal-arquivo">sessao.nova</span>' +
      '</div>' +
      '<div class="entrar-corpo">' +
        '<h1>' + txt('Área do aluno') + '</h1>' +
        '<p class="entrar-sub">' + txt('Entre para retomar de onde parou.') + '</p>' +
        '<form id="form-entrar" novalidate>' +
          '<div class="campo"><label for="e-nome">' + txt('nome') + '</label>' +
            '<input id="e-nome" type="text" required autocomplete="name" placeholder="' + txt('seu nome') + '" /></div>' +
          '<div class="campo"><label for="e-trilha">' + txt('sua trilha') + '</label>' +
            '<select id="e-trilha">' + opcoes + '</select></div>' +
          '<button type="submit" class="btn btn-primary">' + txt('Entrar') + '</button>' +
        '</form>' +
        '<p class="entrar-aviso mono dim">' +
          txt('[esqueleto — não há autenticação: qualquer nome entra]') +
        '</p>' +
      '</div>' +
    '</div>';

  el.querySelector('#form-entrar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = el.querySelector('#e-nome').value.trim();
    if (!nome) return el.querySelector('#e-nome').focus();
    await api.entrar({ nome });
    await api.matricular(el.querySelector('#e-trilha').value);
    irPara('/painel');
  });

  return { titulo: txt('Entrar'), el, depois: () => el.querySelector('#e-nome').focus() };
}
