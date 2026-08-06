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
  if (v.length < 8) return { pct: Math.min(30, v.length * 4), rotulo: 'curta demais', ok: false };
  let points = Math.min(50, v.length * 3);
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) points += 12;
  if (/\d/.test(v)) points += 12;
  if (/[^\w]/.test(v)) points += 14;
  if (new Set(v).size > 10) points += 12;
  const pct = Math.min(100, points);
  return { pct, rotulo: pct >= 80 ? 'forte' : (pct >= 55 ? 'razoável' : 'fraca'), ok: true };
}

export default async function account() {
  const el = document.createElement('div');
  el.className = 'tela tela-conta';
  const session = await api.session();
  const t = studentTrack();
  const p = t ? trackProgress(t) : null;
  const plan = currentPlan();
  const acc = studentAccount();
  void now;

  const options = TRACKS_BY_FAMILY().map(([family, list]) =>
    '<optgroup label="' + txt('trilhas por ' + family) + '">' +
      list.map((x) => '<option value="' + esc(x.id) + '"' + (t && x.id === t.id ? ' selected' : '') + '>' +
        esc(x.nome) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + esc(session?.nome || txt('aluno')) + '</h1>' +
    '</header>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Sua trilha') + '</h2></div>' +
      '<div class="campo"><label for="c-trilha">' + txt('trilha atual') + '</label>' +
        '<select id="c-trilha">' + options + '</select></div>' +
      (p ? '<p class="conta-nota">' + p.feitas + '/' + p.total + ' ' + txt('aulas') + ' · ' + p.pct + '%</p>' : '') +
      '<p class="conta-nota mono dim">' +
        txt('Trocar de trilha não apaga nada: o progresso é por curso, e curso compartilhado continua contando.') +
      '</p>' +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo">' +
        '<h2>' + txt('Plano') + '</h2>' +
        '<a class="bloco-link" href="#/plano">' + txt('ver detalhes do plano') + ' →</a>' +
      '</div>' +
      '<p class="conta-nota">' +
        '<strong>' + esc(plan ? plan.name : '—') + '</strong> · ' +
        (plan && plan.price === 0 ? txt('grátis') : 'R$ ' + (plan?.price ?? 0) + ' ' + txt(plan?.cycle || '')) +
      '</p>' +
    '</section>' +

    /* E-MAIL AND PASSWORD ARE TWO FORMS, and not fields of one profile form.
       Changing an e-mail and changing a password are operations with different
       consequences, different confirmations and, on the server, different
       endpoints. Joining them under one "save" would only make people change one
       by accident. */
    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('E-mail') + '</h2></div>' +
      '<form id="f-email" novalidate>' +
        '<div class="campo">' +
          '<label for="c-email">' + txt('e-mail de acesso') + '</label>' +
          '<input type="email" id="c-email" autocomplete="email" value="' + esc(acc.email) + '" ' +
            'placeholder="voce@exemplo.com">' +
        '</div>' +
        '<div class="conta-acao">' +
          '<button type="submit" class="btn btn-primary">' + txt('Trocar e-mail') + '</button>' +
          '<span class="conta-aviso mono" id="a-email" aria-live="polite"></span>' +
        '</div>' +
      '</form>' +
      '<p class="conta-nota mono dim">' +
        txt('Na Etapa 2 a troca só vale depois de confirmada no endereço novo — senão trocar o e-mail seria a forma mais fácil de tomar uma conta.') +
      '</p>' +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Senha') + '</h2></div>' +
      '<form id="f-senha" novalidate>' +
        '<div class="campo">' +
          '<label for="c-senha-atual">' + txt('senha atual') + '</label>' +
          '<input type="password" id="c-senha-atual" autocomplete="current-password">' +
        '</div>' +
        '<div class="campo">' +
          '<label for="c-senha-nova">' + txt('senha nova') + '</label>' +
          '<input type="password" id="c-senha-nova" autocomplete="new-password">' +
          '<span class="senha-medida"><span class="barra"><span class="barra-cheia" style="width:0"></span></span>' +
            '<span class="senha-rotulo mono dim"></span></span>' +
        '</div>' +
        '<div class="campo">' +
          '<label for="c-senha-rep">' + txt('repita a senha nova') + '</label>' +
          '<input type="password" id="c-senha-rep" autocomplete="new-password">' +
        '</div>' +
        '<div class="conta-acao">' +
          '<button type="submit" class="btn btn-primary">' + txt('Trocar senha') + '</button>' +
          '<span class="conta-aviso mono" id="a-senha" aria-live="polite"></span>' +
        '</div>' +
      '</form>' +
      '<p class="conta-nota mono dim">' +
        txt('Nenhuma senha é guardada aqui: não há autenticação no portal ainda, e gravá-la no navegador daria a impressão contrária.') +
      '</p>' +
    '</section>' +

    '<section class="bloco bloco-risco">' +
      '<div class="bloco-topo"><h2>' + txt('Apagar meu progresso') + '</h2></div>' +
      '<p class="conta-nota">' + txt('Remove aulas concluídas, respostas e a matrícula. Não há desfazer.') + '</p>' +
      '<button type="button" class="btn btn-ghost btn-risco" id="c-zerar">' + txt('Apagar tudo') + '</button>' +
      '<p class="conta-confirma" id="c-confirma" hidden>' +
        '<span>' + txt('Tem certeza?') + '</span>' +
        '<button type="button" class="btn btn-risco" id="c-sim">' + txt('Sim, apagar') + '</button>' +
        '<button type="button" class="btn btn-ghost" id="c-nao">' + txt('Cancelar') + '</button>' +
      '</p>' +
    '</section>' +

    '<section class="bloco">' +
      '<button type="button" class="btn btn-ghost" id="c-sair">' + txt('Sair') + '</button>' +
    '</section>';

  el.querySelector('#c-trilha').addEventListener('change', async (e) => {
    await api.enrol(e.target.value);
    goTo('/trilha');
  });

  /* ---------- e-mail ---------- */
  const emailNotice = el.querySelector('#a-email');
  el.querySelector('#f-email').addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = el.querySelector('#c-email').value.trim();
    if (!plausibleEmail(value)) {
      emailNotice.className = 'conta-aviso mono ruim';
      emailNotice.textContent = txt('esse endereço não parece um e-mail');
      return;
    }
    await api.changeEmail(value);
    emailNotice.className = 'conta-aviso mono bom';
    emailNotice.textContent = txt('e-mail atualizado');
  });

  /* ---------- password ---------- */
  const fresh = el.querySelector('#c-senha-nova');
  const meter = el.querySelector('.senha-medida .barra-cheia');
  const label = el.querySelector('.senha-rotulo');
  fresh.addEventListener('input', () => {
    const f = passwordStrength(fresh.value);
    meter.style.width = f.pct + '%';
    label.textContent = fresh.value ? txt(f.rotulo) : '';
  });

  const passwordNotice = el.querySelector('#a-senha');
  el.querySelector('#f-senha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = el.querySelector('#c-senha-atual').value;
    const repeat = el.querySelector('#c-senha-rep').value;
    const say = (text, good) => {
      passwordNotice.className = 'conta-aviso mono ' + (good ? 'bom' : 'ruim');
      passwordNotice.textContent = txt(text);
    };
    /* The order of the checks is the order the person filled the form in:
       pointing at the last field when the first is empty tells them to fix the
       wrong thing. */
    if (!currentPassword) return say('digite a senha atual', false);
    if (!passwordStrength(fresh.value).ok) return say('a senha nova precisa de pelo menos 8 caracteres', false);
    if (fresh.value !== repeat) return say('as duas senhas novas não conferem', false);
    if (fresh.value === currentPassword) return say('a senha nova é igual à atual', false);
    await api.changePassword(fresh.value);
    el.querySelectorAll('#f-senha input').forEach((i) => { i.value = ''; });
    meter.style.width = '0';
    label.textContent = '';
    return say('senha trocada', true);
  });

  const confirm = el.querySelector('#c-confirma');
  el.querySelector('#c-zerar').addEventListener('click', () => { confirm.hidden = false; });
  el.querySelector('#c-nao').addEventListener('click', () => { confirm.hidden = true; });
  el.querySelector('#c-sim').addEventListener('click', () => { reset(); goTo('/entrar'); });
  el.querySelector('#c-sair').addEventListener('click', async () => { await api.signOut(); goTo('/entrar'); });

  return { title: txt('Conta'), el };
}
