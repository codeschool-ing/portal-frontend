/* ==========================================================================
   `associacao` — emparelhar duas colunas.

   REGRA QUE VEIO DO PIPELINE E VALE IGUAL AQUI: no JSON o par correto é
   `pares[i].esquerda ↔ pares[i].direita`. Apresentar a coluna da direita na
   ordem de escrita entregaria o gabarito pela posição — em REGRAS.md isso está
   registrado como o motivo de a sonda apresentar a direita ORDENADA
   ALFABETICAMENTE. O portal faz o mesmo, e pela mesma razão.

   Os `distratores_direita` entram na lista junto com as direitas corretas:
   existem para que o último par não saia por eliminação. Por isso a tela diz,
   em texto, que sobram opções — quem não sabe disso tenta encaixar todas e
   força uma associação errada.
   ========================================================================== */

import { marcado, esc } from '../texto.js';

export default {
  tipos: ['associacao'],

  corpo(ex, uid) {
    const direitas = [...ex.pares.map((p) => p.direita), ...(ex.distratores_direita || [])]
      .sort((a, b) => a.localeCompare(b, 'pt'));

    const sobram = direitas.length - ex.pares.length;

    const opcoes = (sel) => '<option value="">—</option>' + direitas
      .map((d) => '<option value="' + esc(d) + '"' + (sel === d ? ' selected' : '') + '>' + esc(d) + '</option>')
      .join('');

    const linhas = ex.pares.map((p, i) => (
      '<li class="assoc-par">' +
        '<span class="assoc-esq">' + marcado(p.esquerda) + '</span>' +
        '<span class="assoc-liga" aria-hidden="true">→</span>' +
        '<select class="assoc-sel" data-esquerda="' + esc(p.esquerda) + '" ' +
          'aria-label="Par para ' + esc(p.esquerda) + '" id="assoc-' + uid + '-' + i + '">' +
          opcoes(null) +
        '</select>' +
      '</li>'
    )).join('');

    return (
      '<p class="ex-instrucao">' +
        txt('Escolha o par de cada item.') + ' ' +
        (sobram > 0
          ? '<strong>' + sobram + ' ' + txt('opções ficam de fora.') + '</strong>'
          : '') +
      '</p>' +
      '<ul class="assoc">' + linhas + '</ul>'
    );
  },

  colher(raiz) {
    const mapa = {};
    let algum = false;
    raiz.querySelectorAll('.assoc-sel').forEach((s) => {
      if (s.value) { mapa[s.dataset.esquerda] = s.value; algum = true; }
    });
    return algum ? mapa : null;
  },

  revelar(raiz, ex) {
    const certo = {};
    ex.pares.forEach((p) => { certo[p.esquerda] = p.direita; });
    raiz.querySelectorAll('.assoc-par').forEach((li) => {
      const s = li.querySelector('.assoc-sel');
      const esperado = certo[s.dataset.esquerda];
      const acertou = s.value === esperado;
      li.classList.toggle('assoc-certo', acertou);
      li.classList.toggle('assoc-errado', !acertou);
      s.disabled = true;
      if (!acertou) {
        const p = document.createElement('span');
        p.className = 'assoc-gabarito';
        p.innerHTML = marcado(esperado);
        li.appendChild(p);
      }
    });
  },
};
