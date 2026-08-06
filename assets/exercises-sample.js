/* ==========================================================================
   Sample exercises — disposable content, settled format.

   These exercises exist to give the portal structure, not to teach anyone. They
   will be thrown away when the pipeline (`tools/exercises`, in the
   vitrine's repo) runs again and produces real content.

   WHAT IS NOT DISPOSABLE IS THE FORMAT. The fields below are exactly the ones
   the pipeline emits — `topic`, `type`, `difficulty`, `prompt`,
   `socraticHint`, `choices[].{text,correct,why}`, `items`, `trap`,
   `pairs[].{left,right}`, `rightDistractors`, `givenCode`, `skeleton`,
   `tests[].{description,input,expectedOutput}`, `referenceExpression`,
   `variables`, `check*`. Ignoring the tool for now costs nothing; inventing a
   parallel format would cost a migration.

   Two fields were added that the pipeline does not emit, because they belong to
   the portal and not to the exercise: `id` (a stable key for storing the
   student's answer) and `course` (the pipeline already knows which course a file
   belongs to; here everything lives together).

   The Portuguese of every prompt, hint, option and justification is in
   assets/exercises-pt.js. What decides an answer — `correct`, `answer`,
   `expectedOutput`, `referenceExpression` — is not translated.

   ONE DELIBERATE IMPURITY: `expression-answer` in a JavaScript lesson makes no
   pedagogical sense — the type exists for mathematics. It is here so that the
   demonstration lesson exercises all seven renderers on a single screen. The
   same type turns up again in `statistics`, where it is legitimate.
   ========================================================================== */

/* Concatenates instead of assigning: there is one file per course, as in the
   pipeline, and none of them may depend on being the first to load. */
window.SAMPLE_EXERCISES = (window.SAMPLE_EXERCISES || []).concat([

  /* ================= demonstration lesson: the seven types ================ */
  /* javascript · topic 1 · "Types, coercion, strict equality and falsy values" */

  {
    id: 'js-coercion-quiz-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'In `0 == "0"` the result is `true`, but in `0 === "0"` it is `false`. What explains the difference?',
    socraticHint: 'One of the two operators has an extra step before comparing. What step would that be, and what does it do to the string?',
    choices: [
      {
        text: '`==` converts the operands to a common type before comparing; `===` compares type and value without converting anything.',
        correct: true,
        why: 'It is the difference between abstract and strict equality: the first applies coercion, the second fails immediately when the types differ.',
      },
      {
        text: '`==` compares only the textual content of the values, ignoring whether they are a number or a string.',
        correct: false,
        why: 'There is no textual comparison: `0 == "0"` is true because the string becomes the number 0, not because `0` and `"0"` look alike written down.',
      },
      {
        text: '`===` only works between primitive values, so with a string it returns `false` because it cannot compare them.',
        correct: false,
        why: '`===` works with any value, strings included; it returns `false` here because the types are different.',
      },
      {
        text: '`==` rounds numbers before comparing, and the rounding makes `0` coincide with the string.',
        correct: false,
        why: 'No rounding is involved: the conversion is from string to number, and `"0"` is already exactly 0.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercion-multiple-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Tick every value that is **falsy** in JavaScript — that is, that behaves like `false` inside an `if`.',
    socraticHint: 'The list of falsy values is closed and short. An empty object is still an object; an empty string is not the same thing as a string with one character in it.',
    choices: [
      { text: '`0`', correct: true, why: 'Zero is one of the values on the closed falsy list.' },
      { text: '`""` (the empty string)', correct: true, why: 'An empty string is falsy; any string with at least one character is truthy.' },
      { text: '`NaN`', correct: true, why: '`NaN` is falsy, even though `typeof NaN` is `"number"`.' },
      { text: '`[]` (an empty array)', correct: false, why: 'Every object is truthy, and an array is an object — even an empty one. It is the classic trap: `[] == false` is `true`, but `if ([])` runs.' },
      { text: '`"0"` (a string with a zero)', correct: false, why: 'It is a one-character string, therefore truthy. Only the empty string is falsy.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercion-ordering-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the steps the interpreter takes when evaluating `"10" > 9` in order.',
    socraticHint: 'Before deciding how to compare, something has to be established about the operands. Comparing is the last thing that happens, not the first.',
    items: [
      'Establishes that the operands have different types: a string and a number',
      'Converts the string `"10"` to the number 10, with ToNumber',
      'Compares 10 with 9 numerically',
      'Returns `true`',
    ],
    trap: 'The establish–convert pair. Anyone who learned that "the `>` operator converts the string" tends to put the conversion first, as if it were unconditional. It is not: with two strings (`"10" > "9"`) there is no conversion at all and the comparison is lexicographic, returning `false`. It is establishing the types that decides which of the two comparisons will happen, which is why it comes first.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercion-matching-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each expression to what it returns. There are options left over in the right-hand column.',
    socraticHint: 'One of these results is a historical defect in the language, preserved for compatibility. Another surprises anyone expecting the value\'s name to describe its type.',
    pairs: [
      { left: '`typeof null`', right: '`"object"`' },
      { left: '`typeof NaN`', right: '`"number"`' },
      { left: '`typeof undefined`', right: '`"undefined"`' },
      { left: '`typeof (() => {})`', right: '`"function"`' },
      { left: '`typeof Symbol()`', right: '`"symbol"`' },
    ],
    rightDistractors: ['`"null"`', '`"array"`'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercion-output-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'expected-output',
    difficulty: 'hard',
    language: 'javascript',
    prompt: 'What does this snippet print, line by line?',
    socraticHint: 'Two of the three lines defy intuition. One involves how binary fractions represent tenths; the other involves what happens to an array before it is compared with a boolean.',
    givenCode: 'console.log(0.1 + 0.2 === 0.3);\nconsole.log([] == false);\nconsole.log(typeof NaN);\n',
    answer: 'false\ntrue\nnumber\n',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercion-code-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'code',
    difficulty: 'medium',
    language: 'javascript',
    prompt: 'Each line of the input carries one value in JSON. For each of them, print `true` if the value is falsy and `false` otherwise.',
    socraticHint: 'You do not need to list the falsy values one by one: the language already knows how to classify them. What does the `!` operator do to any value?',
    skeleton: 'const lines = require("fs").readFileSync(0, "utf8").split("\\n").filter(Boolean);\nfor (const line of lines) {\n  const value = JSON.parse(line);\n  // complete: print true if `value` is falsy\n}\n',
    tests: [
      { description: 'zero and a string with a zero', input: '0\n"0"\n', expectedOutput: 'true\nfalse\n' },
      { description: 'the empty string and an empty array', input: '""\n[]\n', expectedOutput: 'true\nfalse\n' },
      { description: 'null and an empty object', input: 'null\n{}\n', expectedOutput: 'true\nfalse\n' },
      { description: 'edge case: negative zero', input: '-0\n', expectedOutput: 'true\n' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    /* out of context on purpose — see this file's header */
    id: 'js-demo-expression-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'expression-answer',
    difficulty: 'easy',
    prompt: 'Write the derivative of `x**3` with respect to `x`.',
    socraticHint: 'The power rule brings the exponent down to multiply and subtracts one from it.',
    referenceExpression: '3*x**2',
    variables: ['x'],
    checkOrigin: 'x**3',
    checkOperation: 'diff',
    checkVariable: 'x',
    _verification: 'structure',
  },

  /* ============ other lessons, so the course is not hollow =============== */

  {
    id: 'js-syntax-quiz-1',
    course: 'javascript',
    topic: 'ES6+ syntax: let/const, arrow functions and template strings',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'A variable declared with `const` is given an array. What is prevented from then on?',
    socraticHint: 'The restriction `const` imposes falls on the binding between the name and the value. Is the content that value points at subject to the same rule?',
    choices: [
      {
        text: 'Reassigning the variable to another value — but the array\'s contents can still be changed.',
        correct: true,
        why: '`const` freezes the name↔value binding, not the object pointed at. `push` still works; `=` does not.',
      },
      {
        text: 'Any change to the array, `push` and `pop` included, because `const` makes the value immutable.',
        correct: false,
        why: 'Immutable contents would require `Object.freeze`; `const` does not do that.',
      },
      {
        text: 'Using the variable before the line it was declared on, which with `var` would be allowed.',
        correct: false,
        why: 'That is true of the temporal dead zone, and it applies equally to `let` — it is not what distinguishes `const`.',
      },
      {
        text: 'Passing the variable as an argument to a function that changes the array it receives.',
        correct: false,
        why: 'Nothing stops it being passed, and the function can change the contents as normal.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-objects-matching-1',
    course: 'javascript',
    topic: 'Objects, arrays, spread and destructuring',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each piece of syntax to the effect it produces. There are options left over in the right-hand column.',
    socraticHint: 'Three dots do opposite things depending on which side they appear: receiving or handing over.',
    pairs: [
      { left: '`const { a } = obj`', right: 'Creates a variable holding the value of a property' },
      { left: '`const [x, y] = list`', right: 'Creates variables from the positions of an array' },
      { left: '`{ ...obj, a: 1 }`', right: 'Copies the properties and overwrites one of them' },
      { left: '`f(...list)`', right: 'Passes each item of the array as a separate argument' },
    ],
    rightDistractors: [
      'Freezes the object, preventing later changes',
      'Walks the array running a function for each item',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    /* here `expression-answer` is in the right place: a statistics course */
    id: 'stats-derivative-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'expression-answer',
    difficulty: 'medium',
    prompt: 'Write the expression for the variance of a sample `x` of `n` observations, about the mean `m`, using the denominator `n - 1`.',
    socraticHint: 'The numerator sums the squared deviations. The denominator is not `n` — ask yourself why the correction exists.',
    referenceExpression: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    variables: ['x', 'm', 'n:positive', 'i'],
    checkOrigin: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    checkOperation: 'simplify',
    checkVariable: 'x',
    _verification: 'structure',
  },
]);
