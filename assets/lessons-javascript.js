/* ==========================================================================
   Lesson content — JavaScript.

   WHY THIS COURSE USES `exemplo` THE MOST
   In `web-fundamentals` the subject is concepts: what a packet is, why
   propagation takes time. Prose covers it. In `html-css` the code shows up, but
   in short fragments — one selector, three properties.

   Here the subject is a LANGUAGE, and a language is learned by reading programs.
   A three-line snippet teaches the syntax and hides what matters: how the parts
   fit together. The `exemplo` block exists for that — the program runs down the
   left in one piece, the explanation of each fragment sits beside it, and nobody
   has to break the file into paragraphs in order to comment on it.

   THE RULE THAT HOLDS FOR EVERY EXAMPLE HERE: it has to RUN. Every `saida` was
   written from what the program actually prints, including the parts that
   surprise — `0.30000000000000004`, `'11'`, `[object Object]`. An example with
   invented output teaches the wrong thing, and the student finds out in their
   own console.

   Join key: course + the topic's text IN PORTUGUESE (see the header of
   lessons-web-fundamentals.js).
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {
  javascript: {

    /* --------------------------------------------------------------- 01 */
    'ES6+ syntax: let/const, arrow functions and template strings': [
      {
        // video only: the course's opening, with no text to read along
        id: 'apresentacao',
        title: 'Apresentação do curso',
        video: true,
        duration: '03 min',
      },
      {
        id: 'let-const',
        video: true,
        duration: '09 min',
        title: 'let e const: o fim do var',
        body: [
          '`var` tem duas propriedades que ninguém pediu: ela vaza para fora do bloco onde foi declarada e pode ser redeclarada sem reclamação. `let` e `const` não fazem nem uma coisa nem outra, e por isso `var` não aparece mais em código novo.',
          {
            example: {
              language: 'javascript',
              file: 'escopo.js',
              parts: [
                {
                  code: 'if (true) {\n  var antiga = "eu vazo";\n  let nova = "eu fico";\n}',
                  note: 'As duas são declaradas dentro do `if`. Só uma delas continua existindo depois da chave que fecha.',
                },
                {
                  code: 'console.log(antiga);',
                  note: '`var` é de FUNÇÃO, não de bloco: ela foi içada para o topo da função e sobreviveu ao bloco. É daí que vem quase todo bug de variável trocada em laço.',
                },
                {
                  code: 'try {\n  console.log(nova);\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  note: '`let` morre com o bloco. Fora dele o nome nem existe — e o erro é `ReferenceError`, não `undefined`, o que é uma diferença importante: falhar alto é melhor que seguir com lixo.',
                },
                {
                  code: 'const lista = [1, 2];\nlista.push(3);\nconsole.log(lista);',
                  note: 'A confusão mais comum de `const`: ela congela a LIGAÇÃO, não o valor. `lista = []` daria erro; mexer dentro do array, não. Para congelar o conteúdo existe `Object.freeze`.',
                },
              ],
              output: 'eu vazo\nReferenceError\n[ 1, 2, 3 ]',
            },
          },
          'A regra prática: **`const` por padrão, `let` quando o valor for mesmo trocar, `var` nunca.** Começar por `const` faz o compilador avisar quando você reatribui sem querer — e a maioria das reatribuições que a gente escreve sem pensar é acidente.',
        ],
      },
      {
        id: 'arrow',
        title: 'Arrow functions, e o que elas não têm',
        body: [
          'A seta encurta a escrita, mas essa é a parte menos importante. O que muda de verdade é que ela **não tem `this` próprio** — ela usa o `this` de onde foi escrita.',
          {
            example: {
              language: 'javascript',
              file: 'seta.js',
              parts: [
                {
                  code: 'const dobro = n => n * 2;\nconsole.log(dobro(4));',
                  note: 'Um parâmetro, um retorno: sem parênteses, sem `return`, sem chaves. É a forma que aparece dentro de `map` e `filter` o tempo todo.',
                },
                {
                  code: 'const par = (a, b) => ({ a, b });\nconsole.log(par(1, 2));',
                  note: 'Devolver um objeto exige os parênteses em volta. Sem eles, `{` é lido como início de bloco, e a função devolve `undefined` — em silêncio.',
                },
                {
                  code: 'const contador = {\n  n: 7,\n  comum() { return this.n; },\n  seta: () => (typeof this === "undefined" ? "sem this" : "this de fora"),\n};',
                  note: 'A diferença que importa. A função comum recebe `this` de quem a CHAMOU; a seta herdou o `this` do lugar onde foi ESCRITA — e num módulo ES esse lugar não tem `this` nenhum.',
                },
                {
                  code: 'console.log(contador.comum());\nconsole.log(contador.seta());',
                  note: 'A seta nem enxerga o objeto de que é propriedade. Por isso ela é ótima para callback — carrega o `this` de fora junto — e péssima para método.',
                },
              ],
              output: '8\n{ a: 1, b: 2 }\n7\nsem this',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Template strings',
        body: [
          'Crase em vez de aspas, `${}` para interpolar, e a quebra de linha vale literalmente. Some a concatenação com `+`, que é onde nascem os espaços faltando.',
          { code: 'javascript', text: 'const nome = "Ana";\nconst n = 3;\n\nconsole.log(`${nome} concluiu ${n} ${n === 1 ? "curso" : "cursos"}.`);\n// Ana concluiu 3 cursos.' },
          'A interpolação aceita **qualquer expressão**, não só variável — chamada de função, ternário, operação. O que ela não deve receber é texto vindo do usuário destinado a virar HTML: aí a interpolação vira o furo, e é por isso que este portal tem um `esc()` em `app/text.js`.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Types, coercion, strict equality and falsy values': [
      {
        id: 'coercao',
        title: 'Coerção: quando a linguagem adivinha',
        body: [
          'JavaScript converte tipos sozinho quando um operador recebe o que não esperava. Isso resolve pequenas conveniências e cria as maiores surpresas da linguagem.',
          {
            example: {
              language: 'javascript',
              file: 'coercao.js',
              parts: [
                {
                  code: 'console.log(1 + "1");\nconsole.log(1 - "1");',
                  note: '`+` é sobrecarregado: com uma string de um lado ele CONCATENA. `-` não tem essa ambiguidade, então converte para número. Mesmo par de valores, dois resultados de naturezas diferentes.',
                },
                {
                  code: 'console.log([] + {});\nconsole.log([1, 2] + [3]);',
                  note: 'Objeto virando string passa por `toString()`. O de array junta com vírgula; o de objeto comum devolve `[object Object]`. É por isso que aquela mensagem aparece na tela às vezes.',
                },
                {
                  code: 'console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);',
                  note: 'Este não é bug de JavaScript: é ponto flutuante IEEE-754, e vale igual em Python, Java e C. Dinheiro se guarda em centavos inteiros, nunca em `float`.',
                },
                {
                  code: 'console.log(Number("12px"));\nconsole.log(parseInt("12px", 10));',
                  note: '`Number` é tudo ou nada; `parseInt` lê enquanto der e para. Ler a largura de um CSS pede o segundo — e o `10` não é opcional por hábito, é o que evita a base errada.',
                },
              ],
              output: '11\n0\n[object Object]\n1,23\n0.30000000000000004\nfalse\nNaN\n12',
            },
          },
        ],
      },
      {
        id: 'igualdade',
        video: true,
        duration: '08 min',
        title: '== contra ===',
        body: [
          '`==` compara depois de converter; `===` compara sem converter. A tabela do `==` tem casos que ninguém memoriza, e a saída disso é simples: **use `===` sempre.**',
          {
            example: {
              language: 'javascript',
              file: 'igual.js',
              parts: [
                {
                  code: 'console.log(0 == "");\nconsole.log(0 == "0");\nconsole.log("" == "0");',
                  note: 'Os três com `==`. Repare que os dois primeiros são verdadeiros e o terceiro é falso: `==` **não é transitivo**, o que basta para descartá-lo.',
                },
                {
                  code: 'console.log(null == undefined);\nconsole.log(null === undefined);',
                  note: 'A única exceção que vale conhecer: `x == null` é o jeito curto de perguntar "é `null` ou `undefined`?". É o único uso defensável de `==`.',
                },
                {
                  code: 'console.log(NaN === NaN);\nconsole.log(Number.isNaN(NaN));',
                  note: '`NaN` é o único valor diferente de si mesmo. Testar com `===` nunca funciona; a pergunta certa é `Number.isNaN`.',
                },
              ],
              output: 'true\ntrue\nfalse\ntrue\nfalse\nfalse\ntrue',
            },
          },
        ],
      },
      {
        id: 'falsos',
        video: true,
        duration: '11 min',
        title: 'Os oito valores falsos',
        body: [
          'Num `if`, qualquer valor vira booleano. São **oito** os que viram `false` — e todo o resto vira `true`, inclusive `[]`, `{}` e `"0"`:',
          [
            '`false`, `0`, `-0`, `0n` (BigInt zero)',
            '`""` (string vazia)',
            '`null`, `undefined`, `NaN`',
          ],
          'A armadilha prática está em `0` e `""` serem falsos: `if (quantidade)` ignora a quantidade zero, e `if (nome)` ignora o nome vazio — nos dois casos tratando "existe e vale zero/vazio" como "não existe".',
          {
            example: {
              language: 'javascript',
              file: 'falsos.js',
              parts: [
                {
                  code: 'const config = { retries: 0, titulo: "" };',
                  note: 'Dois valores legítimos que por acaso são falsos. Zero tentativas é uma decisão; título vazio também.',
                },
                {
                  code: 'console.log(config.retries || 3);\nconsole.log(config.titulo || "sem título");',
                  note: 'O `||` clássico atropela os dois: ele testa "é falso?", não "está ausente?". O zero que o usuário escolheu virou três.',
                },
                {
                  code: 'console.log(config.retries ?? 3);\nconsole.log(JSON.stringify(config.titulo ?? "sem título"));',
                  note: '`??` só entra em ação para `null` e `undefined` — o zero e a string vazia passam intactos. É o operador que a maioria dos `||` de valor padrão realmente queria ser. (O `JSON.stringify` está aí só para a string vazia aparecer como `""` em vez de uma linha em branco.)',
                },
              ],
              output: '3\nsem título\n0\n""',
            },
          },
        ],
        materials: ['js-coercao-tabela'],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Objects, arrays, spread and destructuring': [
      {
        id: 'desestruturar',
        title: 'Desestruturação',
        body: [
          'Tirar campos de um objeto ou itens de um array sem repetir o nome da fonte em cada linha. É a sintaxe que mais aparece em código moderno depois da seta.',
          {
            example: {
              language: 'javascript',
              file: 'destruct.js',
              parts: [
                {
                  code: 'const curso = { id: "js", nome: "JavaScript", horas: 80 };',
                  note: 'O objeto de partida.',
                },
                {
                  code: 'const { nome, horas } = curso;\nconsole.log(nome, horas);',
                  note: 'Os nomes à esquerda são as CHAVES, não posições. Ordem não importa; grafia importa.',
                },
                {
                  code: 'const { nome: titulo, nivel = "livre" } = curso;\nconsole.log(titulo, nivel);',
                  note: 'Duas coisas de uma vez: renomear na saída, e um padrão para a chave que não existe. O padrão só entra quando o valor é `undefined` — `null` passa direto.',
                },
                {
                  code: 'function resumo({ nome, horas }) {\n  return `${nome}: ${horas}h`;\n}\nconsole.log(resumo(curso));',
                  note: 'Desestruturar no PARÂMETRO é onde ela mais rende: a assinatura passa a documentar o que a função usa, em vez de receber um `opcoes` opaco.',
                },
              ],
              output: 'JavaScript 80\nJavaScript livre\nJavaScript: 80h',
            },
          },
        ],
      },
      {
        id: 'espalhar',
        video: true,
        duration: '09 min',
        title: 'Espalhar e juntar',
        body: [
          'As mesmas três reticências fazem coisas opostas conforme o lado em que estão: à direita elas **espalham**, à esquerda elas **juntam**.',
          {
            example: {
              language: 'javascript',
              file: 'spread.js',
              parts: [
                {
                  code: 'const base = { tema: "escuro", idioma: "pt" };\nconst novo = { ...base, idioma: "en" };\nconsole.log(novo);',
                  note: 'Cópia com alteração, sem mexer no original. A ordem decide quem vence: a última chave repetida sobrescreve — por isso `idioma` sai `en`.',
                },
                {
                  code: 'const a = [1, 2];\nconst b = [0, ...a, 3];\nconsole.log(b);',
                  note: 'O mesmo em array, mantendo a ordem. Substitui `concat` e o velho `push.apply`.',
                },
                {
                  code: 'function soma(...numeros) {\n  return numeros.reduce((t, n) => t + n, 0);\n}\nconsole.log(soma(1, 2, 3, 4));',
                  note: 'Do outro lado: aqui as reticências JUNTAM os argumentos num array de verdade. É o substituto de `arguments`, que não era array e não existe em arrow function.',
                },
                {
                  code: 'const orig = { dono: { nome: "Ana" } };\nconst copia = { ...orig };\ncopia.dono.nome = "Bia";\nconsole.log(orig.dono.nome);',
                  note: 'A pegadinha: a cópia é RASA. O objeto de dentro continua sendo o mesmo, e alterá-lo altera os dois. Para cópia profunda existe `structuredClone`.',
                },
              ],
              output: "{ tema: 'escuro', idioma: 'en' }\n[ 0, 1, 2, 3 ]\n10\nBia",
            },
          },
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Functions, scope, closures and the value of this': [
      {
        id: 'closure',
        title: 'Closure: a função que lembra',
        body: [
          'Uma função criada dentro de outra continua enxergando as variáveis da de fora, mesmo depois de a de fora ter terminado. Isso não é um recurso avançado: é o que faz callback, `setTimeout` e quase todo padrão de módulo funcionarem.',
          {
            example: {
              language: 'javascript',
              file: 'closure.js',
              parts: [
                {
                  code: 'function contador() {\n  let n = 0;',
                  note: '`n` vive dentro de `contador`. Ninguém de fora consegue tocá-lo — não há `private`, e não precisa.',
                },
                {
                  code: '  return {\n    incrementar: () => ++n,\n    ler: () => n,\n  };\n}',
                  note: 'As duas setas fecham sobre o mesmo `n`. Devolver funções em vez do valor é o que transforma escopo em encapsulamento.',
                },
                {
                  code: 'const c = contador();\nc.incrementar();\nc.incrementar();\nconsole.log(c.ler());',
                  note: '`contador()` já retornou faz tempo, e `n` continua vivo — porque alguém ainda o referencia. É o coletor de lixo que decide, não a pilha de chamadas.',
                },
                {
                  code: 'const outro = contador();\nconsole.log(outro.ler());',
                  note: 'Cada chamada cria um escopo NOVO. Dois contadores não compartilham nada, que é o que separa closure de variável global.',
                },
              ],
              output: '2\n0',
            },
          },
        ],
      },
      {
        id: 'this',
        video: true,
        duration: '13 min',
        title: 'O valor de this',
        body: [
          '`this` não é decidido onde a função é escrita, e sim **onde ela é chamada** — com uma exceção, a arrow function. Quase todo bug de `this` é a mesma função tendo sido separada do objeto dela.',
          {
            example: {
              language: 'javascript',
              file: 'this.js',
              parts: [
                {
                  code: 'const aluno = {\n  nome: "Ana",\n  ola() { return `oi, ${this.nome}`; },\n};\nconsole.log(aluno.ola());',
                  note: 'Chamada como método: `this` é o que está à esquerda do ponto.',
                },
                {
                  code: 'const solta = aluno.ola;\ntry {\n  console.log(solta());\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  note: 'A MESMA função, chamada sem dono. Em módulo ES o `this` é `undefined`, e ler `.nome` dele explode. É exatamente o que acontece ao passar `obj.metodo` como callback — e o `try` está aqui só para o exemplo continuar rodando.',
                },
                {
                  code: 'const presa = aluno.ola.bind(aluno);\nconsole.log(presa());',
                  note: '`bind` amarra o `this` de uma vez. A alternativa moderna é passar uma seta: `() => aluno.ola()`, que carrega o contexto de fora.',
                },
              ],
              output: 'oi, Ana\nTypeError\noi, Ana',
            },
          },
        ],
        materials: ['js-this-mapa'],
      },
    ],
  },
});
