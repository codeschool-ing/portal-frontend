/* ==========================================================================
   Grading — only what can be graded by pure comparison.

   Four of the seven types close on the client because grading them means
   comparing two values: one choice, a set, a sequence, a mapping. The other
   three need a server — `code` and `expected-output` run code, and
   `expression-answer` needs symbolic equivalence (sympy). None of the three
   can be faked in the browser without lying about the result.

   Nothing here reads the DOM: each function takes the exercise and the answer
   that was already collected.

   The exercise fields (`type`, `options`, `items`, `pairs`) are the pipeline's
   contract, not ours: they are named exactly as the tool emits them.
   ========================================================================== */

export const GRADED_ON_CLIENT = ['quiz', 'multiple-choice', 'ordering', 'matching'];
export const NEEDS_SERVER = ['code', 'expected-output', 'expression-answer'];

const sameSet = (a, b) =>
  a.length === b.length && a.every((v) => b.includes(v));

const sameSequence = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function gradeLocally(ex, answer) {
  switch (ex.type) {
    case 'quiz': {
      // exactly one, and it has to be the one flagged as correct
      const right = ex.options.findIndex((a) => a.correct);
      return verdict(answer === right, { right });
    }

    case 'multiple-choice': {
      /* Graded as an EXACT SET, and that is deliberate: the pipeline docs
         record that five choices are five chances to get it wrong rather than
         one. Marking almost all of the right ones is not half a point. */
      const right = ex.options.map((a, i) => (a.correct ? i : -1)).filter((i) => i >= 0);
      return verdict(sameSet(answer || [], right), { right });
    }

    case 'ordering': {
      // `items` in the JSON is already in the right order — it is the key
      return verdict(sameSequence(answer || [], ex.items), { right: ex.items });
    }

    case 'matching': {
      /* This type has immediate feedback: a wrong pair comes undone on the
         spot, so the final mapping is ALWAYS right — you only have to keep
         trying. Comparing the map to the key would give everyone 100%.

         So the measure becomes the PATH: how many pairs were tried and refused
         before it closed. Zero mistakes is a pass. It is the pipeline's
         yardstick applied to the process — getting there by elimination does
         not count as knowing. */
      if (!answer || answer.partial) return verdict(false, { partial: true });
      return verdict(answer.wrong === 0, { wrong: answer.wrong, total: ex.pairs.length });
    }

    default:
      return verdict(null, { error: 'type without local grading: ' + ex.type });
  }
}

const verdict = (passed, extra = {}) => ({ acertou: passed, simulado: false, ...extra });
