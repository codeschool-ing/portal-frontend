/* ==========================================================================
   `associacao` — pairing by clicking, with immediate feedback.

   The per-row <select> was replaced by two columns of tiles: you click one on
   the left, then one on the right, and the pair is checked ON THE SPOT — green
   and locked if it is right, red and undone if it is not. It is the Duolingo
   gesture, and it is better here for three reasons: it works the same on touch
   and mouse, it does not hide the options inside a menu, and it turns the
   exercise into practice instead of a form.

   WHAT THAT BREAKS, AND HOW IT STAYS HONEST
   With immediate feedback the final mapping is ALWAYS right — you only have to
   keep trying. If the verdict still compared the map to the answer key,
   everyone would score 100%. So the measure becomes ANOTHER one: how many pairs
   were wrong along the way. Zero mistakes is a pass; any mistake is "not yet",
   with the count. The pipeline's yardstick still holds — getting there by
   elimination cannot count as knowing — only now it is measured on the process
   and not on the result.

   The right-hand column stays SORTED ALPHABETICALLY. In the JSON the correct
   pair is `pares[i].esquerda ↔ pares[i].direita`, and presenting it in written
   order would hand over the key by position. It is the same reason the
   pipeline's probe sorts. The `distratores_direita` go in with it, so the last
   pair cannot fall out by elimination.
   ========================================================================== */

import { formatted, esc, shuffleWith } from '../text.js';

const WRONG_PAIR_PAUSE = 700;   // how long a wrong pair stays red before it lets go

export default {
  types: ['associacao'],

  /* This type finishes on its own: when the last pair closes there is nothing
     left to "answer". The wrapper hides the button and waits for the signal. */
  selfCompleting: true,

  body(ex, uid) {
    const left = shuffleWith(uid + ':e', ex.pares.map((p) => p.esquerda));
    const right = [...ex.pares.map((p) => p.direita), ...(ex.distratores_direita || [])]
      .sort((a, b) => a.localeCompare(b, 'pt'));
    const spare = right.length - ex.pares.length;

    const tile = (text, side) =>
      '<button type="button" class="ficha ficha-' + side + '" data-valor="' + esc(text) + '">' +
        formatted(text) +
      '</button>';

    return (
      '<p class="ex-instrucao">' +
        txt('Toque num item da esquerda e depois no par dele à direita.') +
        (spare > 0 ? ' <strong>' + spare + ' ' + txt('opções ficam de fora.') + '</strong>' : '') +
      '</p>' +
      '<div class="assoc-colunas">' +
        '<div class="assoc-col assoc-col-esq">' + left.map((t) => tile(t, 'esq')).join('') + '</div>' +
        '<div class="assoc-col assoc-col-dir">' + right.map((t) => tile(t, 'dir')).join('') + '</div>' +
      '</div>' +
      '<p class="assoc-conta"><span class="assoc-feitos">0</span>/' + ex.pares.length + ' ' + txt('pares') + '</p>'
    );
  },

  setup(root, { exercicio, concluir }) {
    const key = {};
    exercicio.pares.forEach((p) => { key[p.esquerda] = p.direita; });

    const state = { esq: null, erros: 0, feitos: 0, mapa: {}, travado: false };
    const total = exercicio.pares.length;

    const clear = () => {
      root.querySelectorAll('.ficha.sel').forEach((f) => f.classList.remove('sel'));
      state.esq = null;
    };

    root.addEventListener('click', (e) => {
      const f = e.target.closest('.ficha');
      if (!f || f.disabled || state.travado) return;

      if (f.classList.contains('ficha-esq')) {
        clear();
        f.classList.add('sel');
        state.esq = f;
        return;
      }

      // clicked on the right without picking a left one: nothing to pair yet
      if (!state.esq) { f.classList.add('tremendo'); setTimeout(() => f.classList.remove('tremendo'), 300); return; }

      const leftValue = state.esq.dataset.valor;
      const rightValue = f.dataset.valor;
      state.mapa[leftValue] = rightValue;

      if (key[leftValue] === rightValue) {
        [state.esq, f].forEach((el) => {
          el.classList.remove('sel');
          el.classList.add('ficha-certa');
          el.disabled = true;
        });
        state.esq = null;
        state.feitos += 1;
        root.querySelector('.assoc-feitos').textContent = state.feitos;
        if (state.feitos === total) {
          state.travado = true;
          concluir({ mapa: state.mapa, erros: state.erros });
        }
        return;
      }

      // wrong: mark both, count it, and let go after a moment
      state.erros += 1;
      const pair = [state.esq, f];
      pair.forEach((el) => el.classList.add('ficha-errada'));
      state.travado = true;
      setTimeout(() => {
        pair.forEach((el) => el.classList.remove('ficha-errada', 'sel'));
        state.esq = null;
        state.travado = false;
      }, WRONG_PAIR_PAUSE);
    });
  },

  collect(root) {
    // the wrapper only calls this if the student hits "Responder" before closing
    // every pair — that answer is partial, and partial is not a pass
    const done = Number(root.querySelector('.assoc-feitos').textContent);
    return done > 0 ? { mapa: {}, erros: -1, parcial: true } : null;
  },

  reveal(root, ex, v) {
    root.querySelectorAll('.ficha').forEach((f) => { f.disabled = true; });
    if (v.erros > 0) {
      const p = document.createElement('p');
      p.className = 'assoc-erros';
      p.textContent = v.erros === 1
        ? txt('1 par foi tentado errado antes de fechar.')
        : v.erros + ' ' + txt('pares foram tentados errado antes de fechar.');
      root.appendChild(p);
    }
  },
};
