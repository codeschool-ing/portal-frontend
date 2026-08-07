/* ==========================================================================
   `matching` — pairing by clicking, with immediate feedback.

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
   pair is `pairs[i].left ↔ pairs[i].right`, and presenting it in written
   order would hand over the key by position. It is the same reason the
   pipeline's probe sorts. The `rightDistractors` go in with it, so the last
   pair cannot fall out by elimination.
   ========================================================================== */

import { formatted, esc, shuffleWith } from '../text.js';

const WRONG_PAIR_PAUSE = 700;   // how long a wrong pair stays red before it lets go

export default {
  types: ['matching'],

  /* During PRACTICE this type finishes on its own: the last pair closes and
     there is nothing left to "answer", so the wrapper hides the button and
     waits for the signal.

     IN AN EXAM IT DOES NOT, because there is nothing to close ON. See the note
     below the header. */
  selfCompleting: (exam) => !exam,

  body(ex, uid, { exam } = {}) {
    const left = shuffleWith(uid + ':e', ex.pairs.map((p) => p.left));
    /* In an exam the right-hand column arrives from the server as `rights`,
       already shuffled there, with the pairing removed — `pairs[i].right` does
       not exist to sort. During practice it is built here, and sorted, so that
       written order does not hand over the key by position. */
    const right = exam && Array.isArray(ex.rights)
      ? ex.rights.slice()
      : [...ex.pairs.map((p) => p.right), ...(ex.rightDistractors || [])]
        .sort((a, b) => a.localeCompare(b, 'pt'));
    const spare = right.length - ex.pairs.length;

    /* The left tiles carry their index in the EXERCISE's order, not in the
       shuffled order on screen: an exam's answer is the mapping by pair index,
       and reading it off the DOM order would file every choice against its
       neighbour. */
    const at = new Map(ex.pairs.map((p, i) => [p.left, i]));
    const tile = (text, side) =>
      '<button type="button" class="tile tile-' + side + '" data-value="' + esc(text) + '"' +
        (side === 'left' ? ' data-pair="' + at.get(text) + '"' : '') + '>' +
        formatted(text) +
      '</button>';

    return (
      '<p class="ex-instruction">' +
        txt(exam
          ? 'Tap an item on the left, then its pair on the right. Tap a pair again to undo it.'
          : 'Tap an item on the left, then its pair on the right.') +
        (spare > 0 ? ' <strong>' + spare + ' ' + txt('options are left out.') + '</strong>' : '') +
      '</p>' +
      '<div class="matching-cols">' +
        '<div class="matching-col matching-col-left">' + left.map((t) => tile(t, 'left')).join('') + '</div>' +
        '<div class="matching-col matching-col-right">' + right.map((t) => tile(t, 'right')).join('') + '</div>' +
      '</div>' +
      '<p class="matching-count"><span class="assoc-done">0</span>/' + ex.pairs.length + ' ' + txt('pairs') + '</p>'
    );
  },

  setup(root, { exercise, done, exam }) {
    if (exam) return setupExam(root, exercise);
    return setupPractice(root, exercise, done);
  },

  collect(root, { exam } = {}) {
    if (exam) {
      /* The mapping, BY INDEX of the left-hand pair — which is what the server
         grades against, because the left texts live in the public half and the
         grading does not read it. The order here is the exercise's own and not
         the shuffled order on screen: `data-pair` carries it. */
      const chosen = new Array(root.querySelectorAll('.tile-left').length).fill('');
      root.querySelectorAll('.tile-left[data-with]').forEach((f) => {
        chosen[Number(f.dataset.pair)] = f.dataset.with;
      });
      return chosen.some(Boolean) ? chosen : null;
    }
    // Practice: the wrapper only calls this if the student hits "Responder"
    // before closing every pair — that answer is partial, and partial is not a
    // pass.
    const done = Number(root.querySelector('.assoc-done').textContent);
    return done > 0 ? { map: {}, errors: -1, partial: true } : null;
  },

  reveal(root, ex, v) {
    root.querySelectorAll('.tile').forEach((f) => { f.disabled = true; });

    /* An exam reveals the PAIRING, because until now nobody has seen it: no
       pair was ever checked on screen, so this is the first time the student
       learns which of them were right. Practice reveals the PATH instead —
       there every pair was checked as it landed, and what was not visible is
       how many were tried and refused. */
    if (v && Array.isArray(v.expected)) {
      root.querySelectorAll('.tile-left').forEach((f) => {
        const want = v.expected[Number(f.dataset.pair)];
        const got = f.dataset.with || '';
        f.classList.add(got === want ? 'tile-right' : 'tile-wrong');
        const mark = f.querySelector('.tile-chosen');
        if (mark && got !== want) {
          mark.textContent = '→ ' + want;
          mark.classList.add('tile-answer');
        }
      });
      return;
    }

    if (v && v.errors > 0) {
      const p = document.createElement('p');
      p.className = 'matching-errors';
      p.textContent = v.errors === 1
        ? txt('1 pair was tried wrong before it closed.')
        : v.errors + ' ' + txt('pairs were tried wrong before closing.');
      root.appendChild(p);
    }
  },
};

/* ---------- practice: every pair is checked as it lands ---------- */
function setupPractice(root, exercise, done) {
  const key = {};
  exercise.pairs.forEach((p) => { key[p.left] = p.right; });

  const state = { left: null, errors: 0, done: 0, map: {}, locked: false };
  const total = exercise.pairs.length;

  const clear = () => {
    root.querySelectorAll('.tile.sel').forEach((f) => f.classList.remove('sel'));
    state.left = null;
  };

  root.addEventListener('click', (e) => {
    const f = e.target.closest('.tile');
    if (!f || f.disabled || state.locked) return;

    if (f.classList.contains('tile-left')) {
      clear();
      f.classList.add('sel');
      state.left = f;
      return;
    }

    // clicked on the right without picking a left one: nothing to pair yet
    if (!state.left) { f.classList.add('shaking'); setTimeout(() => f.classList.remove('shaking'), 300); return; }

    const leftValue = state.left.dataset.value;
    const rightValue = f.dataset.value;
    state.map[leftValue] = rightValue;

    if (key[leftValue] === rightValue) {
      [state.left, f].forEach((el) => {
        el.classList.remove('sel');
        el.classList.add('tile-right');
        el.disabled = true;
      });
      state.left = null;
      state.done += 1;
      root.querySelector('.assoc-done').textContent = state.done;
      if (state.done === total) {
        state.locked = true;
        done({ map: state.map, errors: state.errors });
      }
      return;
    }

    // wrong: mark both, count it, and let go after a moment
    state.errors += 1;
    const pair = [state.left, f];
    pair.forEach((el) => el.classList.add('tile-wrong'));
    state.locked = true;
    setTimeout(() => {
      pair.forEach((el) => el.classList.remove('tile-wrong', 'sel'));
      state.left = null;
      state.locked = false;
    }, WRONG_PAIR_PAUSE);
  });
}

/* ---------- an exam: nothing is checked until the exam closes ----------

   THIS IS NOT THE SAME EXERCISE WITH THE COLOURS TURNED OFF. With immediate
   feedback the final mapping is always right and the measure has to be the
   PATH — how many pairs were tried and refused. Here there is no path: a pair
   lands where the student put it and stays there, so the mapping IS the answer,
   which is how the server grades one.

   That changes the gesture too. Practice never needs an undo, because a wrong
   pair undoes itself; here it is the only way to change your mind, and without
   it a mis-tap would be a lost mark. Tapping a paired tile — either side —
   breaks the pair. */
function setupExam(root, exercise) {
  const state = { left: null };
  const total = exercise.pairs.length;

  const count = () => {
    const n = root.querySelectorAll('.tile-left[data-with]').length;
    root.querySelector('.assoc-done').textContent = n;
    return n;
  };

  const unpair = (leftTile) => {
    const rightValue = leftTile.dataset.with;
    delete leftTile.dataset.with;
    leftTile.classList.remove('tile-paired');
    const mark = leftTile.querySelector('.tile-chosen');
    if (mark) mark.remove();
    root.querySelectorAll('.tile-right').forEach((f) => {
      if (f.dataset.value === rightValue) {
        f.classList.remove('tile-taken');
        f.disabled = false;
      }
    });
  };

  root.addEventListener('click', (e) => {
    const f = e.target.closest('.tile');
    if (!f) return;

    if (f.classList.contains('tile-left')) {
      // A paired tile is a request to undo it, not to start a new pair.
      if (f.dataset.with) { unpair(f); count(); return; }
      root.querySelectorAll('.tile.sel').forEach((t) => t.classList.remove('sel'));
      f.classList.add('sel');
      state.left = f;
      return;
    }

    // The right-hand side, taken: the pair it belongs to comes undone.
    if (f.classList.contains('tile-taken')) {
      const owner = [...root.querySelectorAll('.tile-left[data-with]')]
        .find((t) => t.dataset.with === f.dataset.value);
      if (owner) { unpair(owner); count(); }
      return;
    }

    if (!state.left) { f.classList.add('shaking'); setTimeout(() => f.classList.remove('shaking'), 300); return; }

    // Re-pairing a left tile that already had one: the old right comes free.
    if (state.left.dataset.with) unpair(state.left);

    state.left.dataset.with = f.dataset.value;
    state.left.classList.remove('sel');
    state.left.classList.add('tile-paired');
    const mark = document.createElement('span');
    mark.className = 'tile-chosen';
    mark.textContent = f.textContent.trim();
    state.left.appendChild(mark);

    f.classList.add('tile-taken');
    state.left = null;

    const n = count();
    /* Nothing closes at the end. The button is there from the start — it is not
       a self-completing exercise in an exam — and the count is what says how
       much is left, which is the only feedback there is. */
    void n;
    void total;
  });
}
