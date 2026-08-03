/* ==========================================================================
   O painel da busca — o que abre com ⌘K.

   Teclado do começo ao fim, porque é assim que se usa uma busca por atalho:
   abre digitando, escolhe com as setas, entra com Enter, sai com Esc. Quem
   precisa do mouse também consegue, mas o desenho é para quem não tira as mãos
   do teclado.

   NÃO HÁ DEBOUNCE, e é medido: o índice inteiro são ~1.700 entradas e a
   varredura é um `indexOf` por entrada. Custa menos de um milissegundo, então
   adiar a resposta só acrescentaria latência percebida a troco de nada.
   ========================================================================== */

import { procurar, trecho, ROTULO_GRUPO, esquecerIndice } from './busca.js';
import { esc } from './texto.js';

const LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>';

let painel = null;
let campo = null;
let lista = null;
let selecionado = 0;
let achados = [];

function criar() {
  painel = document.createElement('div');
  painel.className = 'busca-veu';
  painel.id = 'busca-painel';
  painel.hidden = true;
  painel.innerHTML =
    '<div class="busca-caixa" role="dialog" aria-modal="true" aria-label="' + txt('Buscar') + '">' +
      '<div class="busca-topo">' +
        '<span class="busca-lupa" aria-hidden="true">' + LUPA + '</span>' +
        '<input type="search" class="busca-campo" autocomplete="off" spellcheck="false" ' +
          'placeholder="' + txt('buscar em cursos, aulas, seções e exercícios…') + '" ' +
          'aria-label="' + txt('Buscar') + '" />' +
      '</div>' +
      '<div class="busca-res" role="listbox"></div>' +
      '<div class="busca-pe">' +
        '<span><kbd>↑</kbd><kbd>↓</kbd> ' + txt('navegar') + '</span>' +
        '<span><kbd>↵</kbd> ' + txt('abrir') + '</span>' +
        '<span><kbd>esc</kbd> ' + txt('fechar') + '</span>' +
      '</div>' +
    '</div>';
  document.body.appendChild(painel);
  campo = painel.querySelector('.busca-campo');
  lista = painel.querySelector('.busca-res');

  campo.addEventListener('input', pintar);
  painel.addEventListener('click', (e) => {
    if (e.target === painel) return fechar();       // clicar fora fecha
    const item = e.target.closest('.busca-item');
    if (item) abrir(Number(item.dataset.ix));
  });
  painel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); fechar(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); abrir(selecionado); }
  });
}

function planos() {
  // os grupos viram uma lista só para as setas andarem entre eles sem parar
  return achados.flatMap((g) => g.itens);
}

function pintar() {
  const termo = campo.value;
  achados = procurar(termo);
  selecionado = 0;

  if (termo.trim().length < 2) {
    lista.innerHTML = '<p class="busca-dica">' + txt('Digite ao menos duas letras.') + '</p>';
    return;
  }
  if (!achados.length) {
    lista.innerHTML = '<p class="busca-dica">' + txt('Nada encontrado para') + ' “' + esc(termo) + '”.</p>';
    return;
  }

  let i = -1;
  lista.innerHTML = achados.map((g) =>
    '<div class="busca-grupo">' + txt(ROTULO_GRUPO[g.grupo]) + '</div>' +
    g.itens.map((it) => {
      i += 1;
      const ctx = trecho(it, termo);
      return '<button type="button" class="busca-item' + (i === 0 ? ' on' : '') + '" ' +
        'data-ix="' + i + '" role="option">' +
        '<span class="bi-tit">' + esc(it.titulo) + '</span>' +
        '<span class="bi-sub">' + esc(it.sub) + '</span>' +
        (ctx ? '<span class="bi-ctx">' + esc(ctx) + '</span>' : '') +
      '</button>';
    }).join(''),
  ).join('');
}

function mover(d) {
  const itens = [...lista.querySelectorAll('.busca-item')];
  if (!itens.length) return;
  selecionado = (selecionado + d + itens.length) % itens.length;
  itens.forEach((el, i) => el.classList.toggle('on', i === selecionado));
  itens[selecionado].scrollIntoView({ block: 'nearest' });
}

function abrir(ix) {
  const it = planos()[ix];
  if (!it) return;
  fechar();
  location.hash = it.href;
}

export function abrirBusca() {
  if (!painel) criar();
  /* O índice é remontado a cada abertura porque duas coisas que ele indexa
     mudam entre uma busca e outra: o idioma e as notas do aluno. Montar custa
     poucos milissegundos; servir resultado velho custa confiança. */
  esquecerIndice();
  painel.hidden = false;
  document.body.classList.add('com-busca');
  campo.value = '';
  pintar();
  campo.focus();
}

export function fechar() {
  if (!painel || painel.hidden) return;
  painel.hidden = true;
  document.body.classList.remove('com-busca');
}

export const buscaAberta = () => Boolean(painel) && !painel.hidden;
