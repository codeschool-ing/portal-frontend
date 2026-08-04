/* ==========================================================================
   Grading — only what can be graded by pure comparison.

   Four of the seven types close on the client because grading them means
   comparing two values: one choice, a set, a sequence, a mapping. The other
   three need a server — `codigo` and `saida-esperada` run code, and
   `resposta-expressao` needs symbolic equivalence (sympy). None of the three
   can be faked in the browser without lying about the result.

   Nothing here reads the DOM: each function takes the exercise and the answer
   that was already collected.

   The exercise fields (`tipo`, `alternativas`, `itens`, `pares`) keep their
   Portuguese names on purpose — they are the pipeline's contract, not ours.
   ========================================================================== */

export const GRADED_ON_CLIENT = ['quiz', 'multipla-escolha', 'ordenacao', 'associacao'];
export const NEEDS_SERVER = ['codigo', 'saida-esperada', 'resposta-expressao'];

const sameSet = (a, b) =>
  a.length === b.length && a.every((v) => b.includes(v));

const sameSequence = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function gradeLocally(ex, answer) {
  switch (ex.tipo) {
    case 'quiz': {
      // exactly one, and it has to be the one flagged as correct
      const right = ex.alternativas.findIndex((a) => a.correta);
      return verdict(answer === right, { certa: right });
    }

    case 'multipla-escolha': {
      /* Graded as an EXACT SET, and that is deliberate: the pipeline docs
         record that five choices are five chances to get it wrong rather than
         one. Marking almost all of the right ones is not half a point. */
      const right = ex.alternativas.map((a, i) => (a.correta ? i : -1)).filter((i) => i >= 0);
      return verdict(sameSet(answer || [], right), { certas: right });
    }

    case 'ordenacao': {
      // `itens` in the JSON is already in the right order — it is the key
      return verdict(sameSequence(answer || [], ex.itens), { certa: ex.itens });
    }

    case 'associacao': {
      /* This type has immediate feedback: a wrong pair comes undone on the
         spot, so the final mapping is ALWAYS right — you only have to keep
         trying. Comparing the map to the key would give everyone 100%.

         So the measure becomes the PATH: how many pairs were tried and refused
         before it closed. Zero mistakes is a pass. It is the pipeline's
         yardstick applied to the process — getting there by elimination does
         not count as knowing. */
      if (!answer || answer.parcial) return verdict(false, { parcial: true });
      return verdict(answer.erros === 0, { erros: answer.erros, total: ex.pares.length });
    }

    default:
      return verdict(null, { erro: 'type without local grading: ' + ex.tipo });
  }
}

const verdict = (passed, extra = {}) => ({ acertou: passed, simulado: false, ...extra });
