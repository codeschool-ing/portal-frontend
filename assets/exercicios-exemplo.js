/* ==========================================================================
   Exercícios de exemplo — conteúdo descartável, formato definitivo.

   Estes exercícios existem para estruturar o portal, não para ensinar ninguém.
   Serão jogados fora quando o pipeline (`ferramentas/exercicios`, no repo da
   vitrine) voltar a rodar e produzir conteúdo de verdade.

   O QUE NÃO É DESCARTÁVEL É O FORMATO. Os campos abaixo são exatamente os que
   o pipeline emite — `topico`, `tipo`, `dificuldade`, `enunciado`,
   `dica_socratica`, `alternativas[].{texto,correta,porque}`, `itens`,
   `armadilha`, `pares[].{esquerda,direita}`, `distratores_direita`,
   `codigo_dado`, `esqueleto`, `testes[].{descricao,entrada,saida_esperada}`,
   `expressao_gabarito`, `variaveis`, `verificacao_*`. Ignorar a ferramenta por
   ora não custa nada; inventar um formato paralelo custaria uma migração.

   Acrescentei dois campos que o pipeline não emite porque são do portal, não
   do exercício: `id` (chave estável para guardar a resposta do aluno) e
   `curso` (o pipeline já sabe de que curso é o arquivo; aqui tudo vive junto).

   UMA IMPUREZA DELIBERADA: `resposta-expressao` numa aula de JavaScript não
   faz sentido pedagógico — o tipo existe para matemática. Ele está aqui para
   que a aula de demonstração exercite os sete renderizadores numa tela só. O
   mesmo tipo aparece de novo em `estatistica`, onde ele é legítimo.
   ========================================================================== */

window.EXERCICIOS_EXEMPLO = [

  /* ================= aula de demonstração: os sete tipos ================= */
  /* javascript · tópico 1 · "Tipos, coerção, igualdade estrita e valores falsos" */

  {
    id: 'js-coercao-quiz-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'quiz',
    dificuldade: 'facil',
    enunciado: 'Em `0 == "0"` o resultado é `true`, mas em `0 === "0"` é `false`. O que explica a diferença?',
    dica_socratica: 'Um dos dois operadores tem uma etapa a mais antes de comparar. Qual etapa seria essa, e o que ela faz com a string?',
    alternativas: [
      {
        texto: '`==` converte os operandos para um tipo comum antes de comparar; `===` compara tipo e valor sem converter nada.',
        correta: true,
        porque: 'É a diferença entre igualdade abstrata e estrita: a primeira aplica coerção, a segunda falha de imediato quando os tipos diferem.',
      },
      {
        texto: '`==` compara apenas o conteúdo textual dos valores, ignorando se são número ou string.',
        correta: false,
        porque: 'Não há comparação textual: `0 == "0"` é verdadeiro porque a string vira o número 0, e não porque `0` e `"0"` se pareçam escritos.',
      },
      {
        texto: '`===` só funciona entre valores primitivos, então com uma string ele devolve `false` por não conseguir comparar.',
        correta: false,
        porque: '`===` funciona com qualquer valor, inclusive strings; ele devolve `false` aqui porque os tipos são diferentes.',
      },
      {
        texto: '`==` arredonda números antes de comparar, e o arredondamento faz `0` coincidir com a string.',
        correta: false,
        porque: 'Não há arredondamento envolvido: a conversão é de string para número, e `"0"` já é exatamente 0.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-coercao-multipla-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'multipla-escolha',
    dificuldade: 'media',
    enunciado: 'Marque todos os valores que são **falsy** em JavaScript — isto é, que se comportam como `false` dentro de um `if`.',
    dica_socratica: 'A lista de valores falsy é fechada e curta. Um objeto vazio continua sendo um objeto; uma string vazia não é a mesma coisa que uma string com um caractere dentro.',
    alternativas: [
      { texto: '`0`', correta: true, porque: 'O zero é um dos valores falsy da lista fechada.' },
      { texto: '`""` (string vazia)', correta: true, porque: 'String vazia é falsy; qualquer string com pelo menos um caractere é truthy.' },
      { texto: '`NaN`', correta: true, porque: '`NaN` é falsy, apesar de `typeof NaN` ser `"number"`.' },
      { texto: '`[]` (array vazio)', correta: false, porque: 'Todo objeto é truthy, e array é objeto — mesmo vazio. É a pegadinha clássica: `[] == false` é `true`, mas `if ([])` entra.' },
      { texto: '`"0"` (string com zero)', correta: false, porque: 'É uma string de um caractere, portanto truthy. Só a string vazia é falsy.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-coercao-ordenacao-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'ordenacao',
    dificuldade: 'media',
    enunciado: 'Ponha na ordem os passos que o interpretador executa ao avaliar `"10" > 9`.',
    dica_socratica: 'Antes de decidir como comparar, algo precisa ser constatado sobre os operandos. Comparar é a última coisa que acontece, não a primeira.',
    itens: [
      'Constata que os operandos têm tipos diferentes: string e número',
      'Converte a string `"10"` para o número 10, com ToNumber',
      'Compara 10 com 9 numericamente',
      'Devolve `true`',
    ],
    armadilha: 'O par constatar–converter. Quem aprendeu que "o operador `>` converte a string" tende a pôr a conversão primeiro, como se ela fosse incondicional. Não é: com duas strings (`"10" > "9"`) não há conversão nenhuma e a comparação é lexicográfica, devolvendo `false`. É a constatação de tipos que decide qual das duas comparações vai acontecer, e por isso ela vem antes.',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-coercao-associacao-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada expressão ao que ela devolve. Sobram opções na coluna da direita.',
    dica_socratica: 'Um destes resultados é um defeito histórico da linguagem, preservado por compatibilidade. Outro surpreende quem espera que o nome do valor descreva o tipo dele.',
    pares: [
      { esquerda: '`typeof null`', direita: '`"object"`' },
      { esquerda: '`typeof NaN`', direita: '`"number"`' },
      { esquerda: '`typeof undefined`', direita: '`"undefined"`' },
      { esquerda: '`typeof (() => {})`', direita: '`"function"`' },
      { esquerda: '`typeof Symbol()`', direita: '`"symbol"`' },
    ],
    distratores_direita: ['`"null"`', '`"array"`'],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-coercao-saida-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'saida-esperada',
    dificuldade: 'dificil',
    linguagem: 'javascript',
    enunciado: 'O que este trecho imprime, linha a linha?',
    dica_socratica: 'Duas das três linhas contrariam a intuição. Uma envolve como frações binárias representam décimos; a outra envolve o que acontece com um array antes de ele ser comparado com um booleano.',
    codigo_dado: 'console.log(0.1 + 0.2 === 0.3);\nconsole.log([] == false);\nconsole.log(typeof NaN);\n',
    resposta: 'false\ntrue\nnumber\n',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-coercao-codigo-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'codigo',
    dificuldade: 'media',
    linguagem: 'javascript',
    enunciado: 'Cada linha da entrada traz um valor em JSON. Para cada uma, imprima `true` se o valor for falsy e `false` caso contrário.',
    dica_socratica: 'Você não precisa listar os valores falsy um a um: a própria linguagem já sabe classificá-los. O que o operador `!` faz com um valor qualquer?',
    esqueleto: 'const linhas = require("fs").readFileSync(0, "utf8").split("\\n").filter(Boolean);\nfor (const linha of linhas) {\n  const valor = JSON.parse(linha);\n  // complete: imprima true se `valor` for falsy\n}\n',
    testes: [
      { descricao: 'zero e string com zero', entrada: '0\n"0"\n', saida_esperada: 'true\nfalse\n' },
      { descricao: 'string vazia e array vazio', entrada: '""\n[]\n', saida_esperada: 'true\nfalse\n' },
      { descricao: 'nulo e objeto vazio', entrada: 'null\n{}\n', saida_esperada: 'true\nfalse\n' },
      { descricao: 'borda: zero negativo', entrada: '-0\n', saida_esperada: 'true\n' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    /* fora de contexto de propósito — ver o cabeçalho deste arquivo */
    id: 'js-demo-expressao-1',
    curso: 'javascript',
    topico: 'Tipos, coerção, igualdade estrita e valores falsos',
    tipo: 'resposta-expressao',
    dificuldade: 'facil',
    enunciado: 'Escreva a derivada de `x**3` em relação a `x`.',
    dica_socratica: 'A regra da potência baixa o expoente para multiplicar e subtrai um dele.',
    expressao_gabarito: '3*x**2',
    variaveis: ['x'],
    verificacao_origem: 'x**3',
    verificacao_operacao: 'diff',
    verificacao_variavel: 'x',
    _verificacao: 'estrutura',
  },

  /* ================= outras aulas, para o curso não ficar oco ============ */

  {
    id: 'js-sintaxe-quiz-1',
    curso: 'javascript',
    topico: 'Sintaxe ES6+: let/const, arrow functions e template strings',
    tipo: 'quiz',
    dificuldade: 'facil',
    enunciado: 'Uma variável declarada com `const` recebe um array. O que é impedido a partir daí?',
    dica_socratica: 'A restrição do `const` recai sobre a ligação entre o nome e o valor. O conteúdo apontado por esse valor está sujeito à mesma regra?',
    alternativas: [
      {
        texto: 'Reatribuir a variável a outro valor — mas o conteúdo do array continua podendo ser alterado.',
        correta: true,
        porque: '`const` congela a ligação nome↔valor, não o objeto apontado. `push` continua funcionando; `=` não.',
      },
      {
        texto: 'Qualquer alteração no array, incluindo `push` e `pop`, porque `const` torna o valor imutável.',
        correta: false,
        porque: 'Imutabilidade de conteúdo exigiria `Object.freeze`; `const` não faz isso.',
      },
      {
        texto: 'Usar a variável antes da linha em que ela foi declarada, o que com `var` seria permitido.',
        correta: false,
        porque: 'Isso é verdade sobre a zona morta temporal, e vale igualmente para `let` — não é o que distingue `const`.',
      },
      {
        texto: 'Passar a variável como argumento de uma função que altere o array recebido.',
        correta: false,
        porque: 'Nada impede a passagem, e a função pode alterar o conteúdo normalmente.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    id: 'js-objetos-associacao-1',
    curso: 'javascript',
    topico: 'Objetos, arrays, espalhamento e desestruturação',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada sintaxe ao efeito que ela produz. Sobram opções na coluna da direita.',
    dica_socratica: 'Três reticências fazem coisas opostas conforme o lado em que aparecem: recebendo ou entregando.',
    pares: [
      { esquerda: '`const { a } = obj`', direita: 'Cria uma variável com o valor de uma propriedade' },
      { esquerda: '`const [x, y] = lista`', direita: 'Cria variáveis a partir das posições de um array' },
      { esquerda: '`{ ...obj, a: 1 }`', direita: 'Copia as propriedades e sobrescreve uma delas' },
      { esquerda: '`f(...lista)`', direita: 'Passa cada item do array como um argumento separado' },
    ],
    distratores_direita: [
      'Congela o objeto, impedindo alterações posteriores',
      'Percorre o array executando uma função para cada item',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  {
    /* aqui `resposta-expressao` está no lugar certo: curso de estatística */
    id: 'est-derivada-1',
    curso: 'estatistica',
    topico: 'Medidas de tendência central: média, mediana e moda',
    tipo: 'resposta-expressao',
    dificuldade: 'media',
    enunciado: 'Escreva a expressão da variância de uma amostra `x` de `n` observações, em torno da média `m`, usando o denominador `n - 1`.',
    dica_socratica: 'O numerador soma os quadrados dos desvios. O denominador não é `n` — pergunte-se por que a correção existe.',
    expressao_gabarito: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    variaveis: ['x', 'm', 'n:positive', 'i'],
    verificacao_origem: 'Sum((x - m)**2, (i, 1, n))/(n - 1)',
    verificacao_operacao: 'simplify',
    verificacao_variavel: 'x',
    _verificacao: 'estrutura',
  },
];
