/* ==========================================================================
   Meu Plano.

   Responde três perguntas, nesta ordem, que é a ordem em que elas aparecem:
   o que eu assinei, o que isso me dá, e o que eu ganharia mudando.

   A COMPARAÇÃO É POR RECURSO, NÃO POR CARTÃO DE PREÇO. Três cartões lado a
   lado com listas independentes é o formato de página de VENDA — serve para
   quem ainda não escolheu. Quem já assinou tem outra pergunta: "o que eu NÃO
   tenho?". A tabela responde essa, porque alinha a mesma linha nos três planos
   e a lacuna fica visível sem leitura comparada.

   A troca é imediata e sem cobrança, e a tela diz isso na cara. Fingir um
   checkout que não existe seria a única mentira do portal com consequência real
   — alguém acreditaria ter pago.
   ========================================================================== */

import { currentPlan as planoAtual, studentAccount as contaDoAluno, changePlan as trocarPlano } from '../state.js';
import { despachar } from '../rotas.js';
import { esc } from '../text.js';

const preco = (p) => (p.preco === 0
  ? txt('grátis')
  : 'R$ ' + p.preco + '<span class="pl-ciclo">' + txt(p.ciclo) + '</span>');

const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 5"/></svg>';
const TRACO = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M4 8h8"/></svg>';

export default async function plano() {
  const el = document.createElement('div');
  el.className = 'tela tela-plano';
  const atual = planoAtual();
  const conta = contaDoAluno();
  const planos = window.PLANOS || [];
  const recursos = window.RECURSOS || {};

  if (!atual) {
    el.innerHTML = '<p class="vazio">' + txt('Nenhum plano configurado.') + '</p>';
    return { titulo: txt('Meu plano'), el };
  }

  const desde = conta.desde
    ? new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(conta.desde))
    : null;

  /* Todos os recursos que QUALQUER plano oferece viram linha, na ordem em que
     aparecem em RECURSOS. Listar só os do plano atual esconderia justamente o
     que a pessoa veio ver. */
  const chaves = Object.keys(recursos).filter((k) => planos.some((p) => p.inclui.includes(k)));

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Meu plano') + '</h1>' +
      '<p>' + txt('O que você assinou, o que ele inclui e o que muda se você trocar.') + '</p>' +
    '</header>' +

    '<section class="bloco pl-atual">' +
      '<div class="pl-atual-topo">' +
        '<div>' +
          '<span class="pl-rot mono">' + txt('plano atual') + '</span>' +
          '<h2>' + esc(atual.nome) + '</h2>' +
          '<p class="pl-resumo">' + esc(atual.resumo) + '</p>' +
        '</div>' +
        '<span class="pl-preco">' + preco(atual) + '</span>' +
      '</div>' +
      '<div class="pl-fatos mono dim">' +
        (desde ? '<span>' + txt('desde') + ' ' + esc(desde) + '</span>' : '') +
        '<span>' + atual.inclui.length + ' ' + txt('de') + ' ' + chaves.length + ' ' + txt('recursos') + '</span>' +
        (conta.email ? '<span>' + esc(conta.email) + '</span>' : '') +
      '</div>' +
    '</section>' +

    '<section class="bloco">' +
      '<div class="bloco-topo"><h2>' + txt('O que cada plano inclui') + '</h2></div>' +
      '<div class="pl-tabela-rolo">' +
        '<table class="pl-tabela">' +
          '<thead><tr><th scope="col">' + txt('recurso') + '</th>' +
            planos.map((p) => '<th scope="col"' + (p.id === atual.id ? ' class="on"' : '') + '>' +
              esc(p.nome) +
              (p.id === atual.id ? '<span class="pl-seu mono">' + txt('seu') + '</span>' : '') +
            '</th>').join('') +
          '</tr></thead>' +
          '<tbody>' +
            chaves.map((k) => '<tr><th scope="row">' + txt(recursos[k]) + '</th>' +
              planos.map((p) => {
                const tem = p.inclui.includes(k);
                return '<td class="' + (tem ? 'sim' : 'nao') + (p.id === atual.id ? ' on' : '') + '">' +
                  (tem ? CHECK : TRACO) +
                  '<span class="pl-oculto">' + txt(tem ? 'incluído' : 'não incluído') + '</span>' +
                '</td>';
              }).join('') +
            '</tr>').join('') +
            '<tr class="pl-linha-acao"><th scope="row"></th>' +
              planos.map((p) => '<td' + (p.id === atual.id ? ' class="on"' : '') + '>' +
                (p.id === atual.id
                  ? '<span class="pl-ja mono">' + txt('seu plano') + '</span>'
                  : '<button type="button" class="btn ' + (p.preco > atual.preco ? 'btn-primary' : 'btn-ghost') +
                    ' pl-trocar" data-plano="' + esc(p.id) + '">' +
                    txt(p.preco > atual.preco ? 'Fazer upgrade' : 'Mudar para este') + '</button>') +
              '</td>').join('') +
            '</tr>' +
          '</tbody>' +
        '</table>' +
      '</div>' +
      '<p class="conta-nota mono dim">' +
        txt('Nenhum conteúdo do portal é bloqueado por plano hoje — travar exige servidor, e com o estado no navegador qualquer trava seria teatro.') +
      '</p>' +
    '</section>';

  el.addEventListener('click', (e) => {
    const b = e.target.closest('.pl-trocar');
    if (!b) return;
    trocarPlano(b.dataset.plano);
    // remonta a tela para a tabela e o cabeçalho concordarem com o novo plano
    despachar();
  });

  return { titulo: txt('Meu plano'), el };
}
