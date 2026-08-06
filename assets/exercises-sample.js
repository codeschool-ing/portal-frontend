/* ==========================================================================
   Sample exercises — disposable content, settled format.

   These exercises exist to give the portal structure, not to teach anyone. They
   will be thrown away when the pipeline (`tools/exercises`, in the
   vitrine's repo) runs again and produces real content.

   WHAT IS NOT DISPOSABLE IS THE FORMAT. The fields below are exactly the ones
   the pipeline emits — `topic`, `type`, `difficulty`, `prompt`,
   `socraticHint`, `options[].{text,correct,why}`, `items`, `trap`,
   `pairs[].{left,right}`, `rightDistractors`, `givenCode`, `skeleton`,
   `tests[].{description,input,expected_output}`, `referenceExpression`,
   `variables`, `check_*`. Ignoring the tool for now costs nothing; inventing a
   parallel format would cost a migration.

   Two fields were added that the pipeline does not emit, because they belong to
   the portal and not to the exercise: `id` (a stable key for storing the
   student's answer) and `course` (the pipeline already knows which course a file
   belongs to; here everything lives together).

   ONE DELIBERATE IMPURITY: `expression-answer` in a JavaScript lesson makes no
   pedagogical sense — the type exists for mathematics. It is here so that the
   demonstration lesson exercises all seven renderers on a single screen. The
   same type turns up again in `estatistica`, where it is legitimate.
   ========================================================================== */

/* Concatenates instead of assigning: there is one file per course, as in the
   pipeline, and none of them may depend on being the first to load. */
window.SAMPLE_EXERCISES = (window.SAMPLE_EXERCISES || []).concat([

  /* ================= demonstration lesson: the seven types ================ */
  /* javascript · topic 1 · "Tipos, coerção, igualdade estrita e valores falsos" */

  {
    id: 'js-coercao-quiz-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'Em `0 == "0"` o resultado é `true`, mas em `0 === "0"` é `false`. O que explica a diferença?',
    socraticHint: 'Um dos dois operadores tem uma etapa a mais antes de comparar. Qual etapa seria essa, e o que ela faz com a string?',
    choices: [
      {
        text: '`==` converte os operandos para um tipo comum antes de comparar; `===` compara tipo e valor sem converter nada.',
        correct: true,
        why: 'É a diferença entre igualdade abstrata e estrita: a primeira aplica coerção, a segunda falha de imediato quando os tipos diferem.',
      },
      {
        text: '`==` compara apenas o conteúdo textual dos valores, ignorando se são número ou string.',
        correct: false,
        why: 'Não há comparação textual: `0 == "0"` é verdadeiro porque a string vira o número 0, e não porque `0` e `"0"` se pareçam escritos.',
      },
      {
        text: '`===` só funciona entre valores primitivos, então com uma string ele devolve `false` por não conseguir comparar.',
        correct: false,
        why: '`===` funciona com qualquer valor, inclusive strings; ele devolve `false` aqui porque os tipos são diferentes.',
      },
      {
        text: '`==` arredonda números antes de comparar, e o arredondamento faz `0` coincidir com a string.',
        correct: false,
        why: 'Não há arredondamento envolvido: a conversão é de string para número, e `"0"` já é exatamente 0.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercao-multipla-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Marque todos os valores que são **falsy** em JavaScript — isto é, que se comportam como `false` dentro de um `if`.',
    socraticHint: 'A lista de valores falsy é fechada e curta. Um objeto vazio continua sendo um objeto; uma string vazia não é a mesma coisa que uma string com um caractere dentro.',
    choices: [
      { text: '`0`', correct: true, why: 'O zero é um dos valores falsy da lista fechada.' },
      { text: '`""` (string vazia)', correct: true, why: 'String vazia é falsy; qualquer string com pelo menos um caractere é truthy.' },
      { text: '`NaN`', correct: true, why: '`NaN` é falsy, apesar de `typeof NaN` ser `"number"`.' },
      { text: '`[]` (array vazio)', correct: false, why: 'Todo objeto é truthy, e array é objeto — mesmo vazio. É a pegadinha clássica: `[] == false` é `true`, mas `if ([])` entra.' },
      { text: '`"0"` (string com zero)', correct: false, why: 'É uma string de um caractere, portanto truthy. Só a string vazia é falsy.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercao-ordenacao-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Ponha na ordem os passos que o interpretador executa ao avaliar `"10" > 9`.',
    socraticHint: 'Antes de decidir como comparar, algo precisa ser constatado sobre os operandos. Comparar é a última coisa que acontece, não a primeira.',
    items: [
      'Constata que os operandos têm tipos diferentes: string e número',
      'Converte a string `"10"` para o número 10, com ToNumber',
      'Compara 10 com 9 numericamente',
      'Devolve `true`',
    ],
    trap: 'O par constatar–converter. Quem aprendeu que "o operador `>` converte a string" tende a pôr a conversão primeiro, como se ela fosse incondicional. Não é: com duas strings (`"10" > "9"`) não há conversão nenhuma e a comparação é lexicográfica, devolvendo `false`. É a constatação de tipos que decide qual das duas comparações vai acontecer, e por isso ela vem antes.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercao-associacao-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Associe cada expressão ao que ela devolve. Sobram opções na coluna da direita.',
    socraticHint: 'Um destes resultados é um defeito histórico da linguagem, preservado por compatibilidade. Outro surpreende quem espera que o nome do valor descreva o tipo dele.',
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
    id: 'js-coercao-saida-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'expected-output',
    difficulty: 'hard',
    language: 'javascript',
    prompt: 'O que este trecho imprime, linha a linha?',
    socraticHint: 'Duas das três linhas contrariam a intuição. Uma envolve como frações binárias representam décimos; a outra envolve o que acontece com um array antes de ele ser comparado com um booleano.',
    givenCode: 'console.log(0.1 + 0.2 === 0.3);\nconsole.log([] == false);\nconsole.log(typeof NaN);\n',
    answer: 'false\ntrue\nnumber\n',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-coercao-codigo-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'code',
    difficulty: 'medium',
    language: 'javascript',
    prompt: 'Cada linha da entrada traz um valor em JSON. Para cada uma, imprima `true` se o valor for falsy e `false` caso contrário.',
    socraticHint: 'Você não precisa listar os valores falsy um a um: a própria linguagem já sabe classificá-los. O que o operador `!` faz com um valor qualquer?',
    skeleton: 'const linhas = require("fs").readFileSync(0, "utf8").split("\\n").filter(Boolean);\nfor (const linha of linhas) {\n  const valor = JSON.parse(linha);\n  // complete: imprima true se `valor` for falsy\n}\n',
    tests: [
      { description: 'zero e string com zero', input: '0\n"0"\n', expectedOutput: 'true\nfalse\n' },
      { description: 'string vazia e array vazio', input: '""\n[]\n', expectedOutput: 'true\nfalse\n' },
      { description: 'nulo e objeto vazio', input: 'null\n{}\n', expectedOutput: 'true\nfalse\n' },
      { description: 'borda: zero negativo', input: '-0\n', expectedOutput: 'true\n' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    /* out of context on purpose — see this file's header */
    id: 'js-demo-expressao-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'expression-answer',
    difficulty: 'easy',
    prompt: 'Escreva a derivada de `x**3` em relação a `x`.',
    socraticHint: 'A regra da potência baixa o expoente para multiplicar e subtrai um dele.',
    referenceExpression: '3*x**2',
    variables: ['x'],
    checkOrigin: 'x**3',
    checkOperation: 'diff',
    checkVariable: 'x',
    _verification: 'structure',
  },

  /* ============ other lessons, so the course is not hollow =============== */

  {
    id: 'js-sintaxe-quiz-1',
    course: 'javascript',
    topic: 'ES6+ syntax: let/const, arrow functions and template strings',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'Uma variável declarada com `const` recebe um array. O que é impedido a partir daí?',
    socraticHint: 'A restrição do `const` recai sobre a ligação entre o nome e o valor. O conteúdo apontado por esse valor está sujeito à mesma regra?',
    choices: [
      {
        text: 'Reatribuir a variável a outro valor — mas o conteúdo do array continua podendo ser alterado.',
        correct: true,
        why: '`const` congela a ligação nome↔valor, não o objeto apontado. `push` continua funcionando; `=` não.',
      },
      {
        text: 'Qualquer alteração no array, incluindo `push` e `pop`, porque `const` torna o valor imutável.',
        correct: false,
        why: 'Imutabilidade de conteúdo exigiria `Object.freeze`; `const` não faz isso.',
      },
      {
        text: 'Usar a variável antes da linha em que ela foi declarada, o que com `var` seria permitido.',
        correct: false,
        why: 'Isso é verdade sobre a zona morta temporal, e vale igualmente para `let` — não é o que distingue `const`.',
      },
      {
        text: 'Passar a variável como argumento de uma função que altere o array recebido.',
        correct: false,
        why: 'Nada impede a passagem, e a função pode alterar o conteúdo normalmente.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'js-objetos-associacao-1',
    course: 'javascript',
    topic: 'Objects, arrays, spread and destructuring',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Associe cada sintaxe ao efeito que ela produz. Sobram opções na coluna da direita.',
    socraticHint: 'Três reticências fazem coisas opostas conforme o lado em que aparecem: recebendo ou entregando.',
    pairs: [
      { left: '`const { a } = obj`', right: 'Cria uma variável com o valor de uma propriedade' },
      { left: '`const [x, y] = lista`', right: 'Cria variáveis a partir das posições de um array' },
      { left: '`{ ...obj, a: 1 }`', right: 'Copia as propriedades e sobrescreve uma delas' },
      { left: '`f(...lista)`', right: 'Passa cada item do array como um argumento separado' },
    ],
    rightDistractors: [
      'Congela o objeto, impedindo alterações posteriores',
      'Percorre o array executando uma função para cada item',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    /* here `expression-answer` is in the right place: a statistics course */
    id: 'est-derivada-1',
    course: 'estatistica',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'expression-answer',
    difficulty: 'medium',
    prompt: 'Escreva a expressão da variância de uma amostra `x` de `n` observações, em torno da média `m`, usando o denominador `n - 1`.',
    socraticHint: 'O numerador soma os quadrados dos desvios. O denominador não é `n` — pergunte-se por que a correção existe.',
    referenceExpression: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    variables: ['x', 'm', 'n:positive', 'i'],
    checkOrigin: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    checkOperation: 'simplify',
    checkVariable: 'x',
    _verification: 'structure',
  },
]);
