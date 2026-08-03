/* ==========================================================================
   `ordenacao` — pôr passos na ordem certa.

   `itens` no JSON JÁ ESTÁ na ordem correta: é o gabarito. Renderizar na ordem
   do arquivo entregaria a resposta, então embaralha-se com semente.

   Arrastar e as setas ↑ ↓ fazem a mesma coisa, de propósito: arrastar é o
   gesto natural no mouse e no toque, e as setas são o único caminho para
   teclado e leitor de tela. Um tipo de exercício que só funciona com mouse
   exclui aluno, e a lista é curta (4 a 7 itens) — o custo é pequeno.

   O campo `armadilha` NÃO vai para a tela: ele nomeia qual par vizinho o aluno
   costuma inverter, e é justamente o que o exercício mede. Vira feedback.
   ========================================================================== */

import { marcado, embaralharCom } from '../texto.js';

/* SVG e não caractere. As setas eram `↑` e `↓` e a alça era um caractere
   braille; sem a webfont carregada elas viravam retângulos vazios, e o botão
   sem `background` declarado ainda herdava o cinza padrão do navegador — duas
   feiuras com a mesma origem: confiar no que o ambiente fornece. Desenho
   herda `currentColor` e existe em qualquer lugar. */
const svg = (d) => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const SETA_CIMA = svg('<path d="M4 10l4-4 4 4"/>');
const SETA_BAIXO = svg('<path d="M4 6l4 4 4-4"/>');
const PEGA = svg('<path d="M3 5h10M3 8h10M3 11h10"/>');

export default {
  tipos: ['ordenacao'],

  corpo(ex, uid) {
    const baralho = embaralharCom(uid, ex.itens);
    const linhas = baralho.map((item) => (
      '<li class="ord-item" draggable="true" data-item="' + encodeURIComponent(item) + '">' +
        '<span class="ord-pega" aria-hidden="true">' + PEGA + '</span>' +
        '<span class="ord-txt">' + marcado(item) + '</span>' +
        '<span class="ord-setas">' +
          '<button type="button" class="ord-seta" data-dir="-1" aria-label="Mover para cima">' + SETA_CIMA + '</button>' +
          '<button type="button" class="ord-seta" data-dir="1" aria-label="Mover para baixo">' + SETA_BAIXO + '</button>' +
        '</span>' +
      '</li>'
    )).join('');
    return '<ol class="ord">' + linhas + '</ol>';
  },

  montar(raiz) {
    const lista = raiz.querySelector('.ord');
    if (!lista) return;

    lista.addEventListener('click', (e) => {
      const b = e.target.closest('.ord-seta');
      if (!b) return;
      const li = b.closest('.ord-item');
      const dir = Number(b.dataset.dir);
      const vizinho = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
      if (!vizinho) return;
      if (dir < 0) lista.insertBefore(li, vizinho);
      else lista.insertBefore(vizinho, li);
      b.focus();   // o foco segue o item, senão o teclado perde o lugar
    });

    let arrastado = null;
    lista.addEventListener('dragstart', (e) => {
      arrastado = e.target.closest('.ord-item');
      if (arrastado) arrastado.classList.add('arrastando');
    });
    lista.addEventListener('dragend', () => {
      if (arrastado) arrastado.classList.remove('arrastando');
      arrastado = null;
    });
    lista.addEventListener('dragover', (e) => {
      e.preventDefault();
      const alvo = e.target.closest('.ord-item');
      if (!alvo || !arrastado || alvo === arrastado) return;
      const r = alvo.getBoundingClientRect();
      const depois = e.clientY > r.top + r.height / 2;
      lista.insertBefore(arrastado, depois ? alvo.nextElementSibling : alvo);
    });
  },

  colher(raiz) {
    const itens = [...raiz.querySelectorAll('.ord-item')]
      .map((li) => decodeURIComponent(li.dataset.item));
    return itens.length ? itens : null;
  },

  revelar(raiz, ex) {
    raiz.querySelectorAll('.ord-item').forEach((li, i) => {
      const certo = decodeURIComponent(li.dataset.item) === ex.itens[i];
      li.classList.toggle('ord-certo', certo);
      li.classList.toggle('ord-errado', !certo);
      li.draggable = false;
      li.querySelectorAll('.ord-seta').forEach((b) => { b.disabled = true; });
    });
  },
};
