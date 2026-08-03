/* ==========================================================================
   Conta.

   "Apagar meu progresso" existe porque, enquanto o estado mora em
   localStorage, é a única forma de voltar ao zero para testar o portal — e
   porque um dia, com servidor, essa opção vira exigência legal e não caprício.
   Ela confirma antes: apagar sem perguntar é o tipo de coisa que não tem
   desfazer.
   ========================================================================== */

import * as api from '../api.js';
import { zerar } from '../estado.js';
import { irPara } from '../rotas.js';
import { TRILHAS_POR_FAMILIA, trilhaDoAluno, progressoDaTrilha } from './comum.js';
import { esc } from '../texto.js';

export default async function conta() {
  const el = document.createElement('div');
  el.className = 'tela tela-conta';
  const sessao = await api.sessao();
  const t = trilhaDoAluno();
  const p = t ? progressoDaTrilha(t) : null;

  const opcoes = TRILHAS_POR_FAMILIA().map(([familia, lista]) =>
    '<optgroup label="' + txt('trilhas por ' + familia) + '">' +
      lista.map((x) => '<option value="' + esc(x.id) + '"' + (t && x.id === t.id ? ' selected' : '') + '>' +
        esc(x.nome) + '</option>').join('') +
    '</optgroup>').join('');

  el.innerHTML =
    '<header class="tela-head">' +
      '<span class="tag">// ' + txt('conta') + '</span>' +
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
      '<div class="bloco-topo"><h2>' + txt('Idioma') + '</h2></div>' +
      '<p class="conta-nota">' + txt('O idioma fica no seletor da barra do topo, ao lado do tema.') + '</p>' +
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
    await api.matricular(e.target.value);
    irPara('/trilha');
  });

  const confirma = el.querySelector('#c-confirma');
  el.querySelector('#c-zerar').addEventListener('click', () => { confirma.hidden = false; });
  el.querySelector('#c-nao').addEventListener('click', () => { confirma.hidden = true; });
  el.querySelector('#c-sim').addEventListener('click', () => { zerar(); irPara('/entrar'); });
  el.querySelector('#c-sair').addEventListener('click', async () => { await api.sair(); irPara('/entrar'); });

  return { titulo: txt('Conta'), el };
}
