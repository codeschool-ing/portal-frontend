/* ==========================================================================
   Conta.

   "Apagar meu progresso" existe porque, enquanto o estado mora em
   localStorage, é a única forma de voltar ao zero para testar o portal — e
   porque um dia, com servidor, essa opção vira exigência legal e não caprício.
   Ela confirma antes: apagar sem perguntar é o tipo de coisa que não tem
   desfazer.
   ========================================================================== */

import * as api from '../api.js';
import { reset as zerar, now as agora, currentPlan as planoAtual, studentAccount as contaDoAluno } from '../state.js';
import { irPara } from '../rotas.js';
import { TRILHAS_POR_FAMILIA, trilhaDoAluno, progressoDaTrilha } from './comum.js';
import { esc } from '../text.js';

/* Regra de e-mail deliberadamente FROUXA: "tem arroba, tem ponto depois dele,
   e não tem espaço". Validação estrita de e-mail no cliente rejeita endereços
   válidos (`+`, domínios novos, acentos) e não impede nada — quem confirma que
   o endereço existe é a mensagem enviada para ele, na Etapa 2. */
const emailPlausivel = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

/* Força da senha por FAIXAS, não por regra proibitiva. Uma senha longa de
   palavras vale mais que "P@ss1!" e nenhuma regra de "precisa ter símbolo"
   captura isso; a barra mede e informa, e o mínimo é só o comprimento. */
function forcaDaSenha(s) {
  const v = String(s || '');
  if (v.length < 8) return { pct: Math.min(30, v.length * 4), rotulo: 'curta demais', ok: false };
  let pontos = Math.min(50, v.length * 3);
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) pontos += 12;
  if (/\d/.test(v)) pontos += 12;
  if (/[^\w]/.test(v)) pontos += 14;
  if (new Set(v).size > 10) pontos += 12;
  const pct = Math.min(100, pontos);
  return { pct, rotulo: pct >= 80 ? 'forte' : (pct >= 55 ? 'razoável' : 'fraca'), ok: true };
}

export default async function conta() {
  const el = document.createElement('div');
  el.className = 'tela tela-conta';
  const sessao = await api.session();
  const t = trilhaDoAluno();
  const p = t ? progressoDaTrilha(t) : null;
  const plano = planoAtual();
  const conta = contaDoAluno();
  void agora;

  const opcoes = TRILHAS_POR_FAMILIA().map(([familia, lista]) =>
    '<optgroup label="' + txt('trilhas por ' + familia) + '">' +
      lista.map((x) => '<option value="' + esc(x.id) + '"' + (t && x.id === t.id ? ' selected' : '') + '>' +
        esc(x.nome) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + esc(sessao?.nome || txt('aluno')) + '</h1>' +
    '</header>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('Sua trilha') + '</h2></div>' +
      '<div class="campo"><label for="c-trilha">' + txt('trilha atual') + '</label>' +
        '<select id="c-trilha">' + opcoes + '</select></div>' +
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
        '<strong>' + esc(plano ? plano.nome : '—') + '</strong> · ' +
        (plano && plano.preco === 0 ? txt('grátis') : 'R$ ' + (plano?.preco ?? 0) + ' ' + txt(plano?.ciclo || '')) +
      '</p>' +
    '</section>' +

    /* E-MAIL E SENHA SÃO DOIS FORMULÁRIOS, e não campos de um formulário de
       perfil. Trocar e-mail e trocar senha são operações com consequências
       diferentes, confirmações diferentes e, no servidor, endpoints diferentes.
       Juntá-las num "salvar" só faria a pessoa alterar uma sem querer. */
    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('E-mail') + '</h2></div>' +
      '<form id="f-email" novalidate>' +
        '<div class="campo">' +
          '<label for="c-email">' + txt('e-mail de acesso') + '</label>' +
          '<input type="email" id="c-email" autocomplete="email" value="' + esc(conta.email) + '" ' +
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
    irPara('/trilha');
  });

  /* ---------- e-mail ---------- */
  const avisoEmail = el.querySelector('#a-email');
  el.querySelector('#f-email').addEventListener('submit', async (e) => {
    e.preventDefault();
    const valor = el.querySelector('#c-email').value.trim();
    if (!emailPlausivel(valor)) {
      avisoEmail.className = 'conta-aviso mono ruim';
      avisoEmail.textContent = txt('esse endereço não parece um e-mail');
      return;
    }
    await api.changeEmail(valor);
    avisoEmail.className = 'conta-aviso mono bom';
    avisoEmail.textContent = txt('e-mail atualizado');
  });

  /* ---------- senha ---------- */
  const nova = el.querySelector('#c-senha-nova');
  const medida = el.querySelector('.senha-medida .barra-cheia');
  const rotulo = el.querySelector('.senha-rotulo');
  nova.addEventListener('input', () => {
    const f = forcaDaSenha(nova.value);
    medida.style.width = f.pct + '%';
    rotulo.textContent = nova.value ? txt(f.rotulo) : '';
  });

  const avisoSenha = el.querySelector('#a-senha');
  el.querySelector('#f-senha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const atualSenha = el.querySelector('#c-senha-atual').value;
    const rep = el.querySelector('#c-senha-rep').value;
    const dizer = (texto, bom) => {
      avisoSenha.className = 'conta-aviso mono ' + (bom ? 'bom' : 'ruim');
      avisoSenha.textContent = txt(texto);
    };
    /* A ordem das conferências é a ordem em que a pessoa preencheu: apontar o
       último campo quando o primeiro está vazio manda corrigir a coisa errada. */
    if (!atualSenha) return dizer('digite a senha atual', false);
    if (!forcaDaSenha(nova.value).ok) return dizer('a senha nova precisa de pelo menos 8 caracteres', false);
    if (nova.value !== rep) return dizer('as duas senhas novas não conferem', false);
    if (nova.value === atualSenha) return dizer('a senha nova é igual à atual', false);
    await api.changePassword(nova.value);
    el.querySelectorAll('#f-senha input').forEach((i) => { i.value = ''; });
    medida.style.width = '0';
    rotulo.textContent = '';
    return dizer('senha trocada', true);
  });

  const confirma = el.querySelector('#c-confirma');
  el.querySelector('#c-zerar').addEventListener('click', () => { confirma.hidden = false; });
  el.querySelector('#c-nao').addEventListener('click', () => { confirma.hidden = true; });
  el.querySelector('#c-sim').addEventListener('click', () => { zerar(); irPara('/entrar'); });
  el.querySelector('#c-sair').addEventListener('click', async () => { await api.signOut(); irPara('/entrar'); });

  return { titulo: txt('Conta'), el };
}
