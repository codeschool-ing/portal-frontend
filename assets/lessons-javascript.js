/* ==========================================================================
   Conteúdo das aulas — JavaScript.

   POR QUE ESTE CURSO É O QUE MAIS USA `exemplo`
   Em `web-fundamentos` o assunto é conceito: o que é um pacote, por que a
   propagação demora. Prosa dá conta. Em `html-css` o código aparece, mas em
   pedaços curtos — um seletor, três propriedades.

   Aqui o assunto é uma LINGUAGEM, e linguagem se aprende lendo programa. Um
   trecho de três linhas ensina a sintaxe e esconde o que importa: como as
   partes se encaixam. O bloco `exemplo` existe para isso — o programa desce
   inteiro pela esquerda, a explicação de cada pedaço fica ao lado, e ninguém
   precisa quebrar o arquivo em parágrafos para poder comentá-lo.

   A REGRA QUE VALE PARA TODO EXEMPLO DAQUI: ele tem de RODAR. Cada `saida` foi
   escrita a partir do que o programa realmente imprime, incluindo as partes
   que surpreendem — `0.30000000000000004`, `'11'`, `[object Object]`. Exemplo
   com saída inventada ensina a coisa errada, e o aluno descobre no console.

   Chave de junção: curso + o texto do tópico EM PORTUGUÊS (ver o cabeçalho de
   aulas-web-fundamentos.js).
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {
  javascript: {

    /* --------------------------------------------------------------- 01 */
    'Sintaxe ES6+: let/const, arrow functions e template strings': [
      {
        // só vídeo: a abertura do curso, sem texto para ler junto
        id: 'apresentacao',
        titulo: 'Apresentação do curso',
        video: true,
        duracao: '03 min',
      },
      {
        id: 'let-const',
        video: true,
        duracao: '09 min',
        titulo: 'let e const: o fim do var',
        corpo: [
          '`var` tem duas propriedades que ninguém pediu: ela vaza para fora do bloco onde foi declarada e pode ser redeclarada sem reclamação. `let` e `const` não fazem nem uma coisa nem outra, e por isso `var` não aparece mais em código novo.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'escopo.js',
              partes: [
                {
                  codigo: 'if (true) {\n  var antiga = "eu vazo";\n  let nova = "eu fico";\n}',
                  nota: 'As duas são declaradas dentro do `if`. Só uma delas continua existindo depois da chave que fecha.',
                },
                {
                  codigo: 'console.log(antiga);',
                  nota: '`var` é de FUNÇÃO, não de bloco: ela foi içada para o topo da função e sobreviveu ao bloco. É daí que vem quase todo bug de variável trocada em laço.',
                },
                {
                  codigo: 'try {\n  console.log(nova);\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  nota: '`let` morre com o bloco. Fora dele o nome nem existe — e o erro é `ReferenceError`, não `undefined`, o que é uma diferença importante: falhar alto é melhor que seguir com lixo.',
                },
                {
                  codigo: 'const lista = [1, 2];\nlista.push(3);\nconsole.log(lista);',
                  nota: 'A confusão mais comum de `const`: ela congela a LIGAÇÃO, não o valor. `lista = []` daria erro; mexer dentro do array, não. Para congelar o conteúdo existe `Object.freeze`.',
                },
              ],
              saida: 'eu vazo\nReferenceError\n[ 1, 2, 3 ]',
            },
          },
          'A regra prática: **`const` por padrão, `let` quando o valor for mesmo trocar, `var` nunca.** Começar por `const` faz o compilador avisar quando você reatribui sem querer — e a maioria das reatribuições que a gente escreve sem pensar é acidente.',
        ],
      },
      {
        id: 'arrow',
        titulo: 'Arrow functions, e o que elas não têm',
        corpo: [
          'A seta encurta a escrita, mas essa é a parte menos importante. O que muda de verdade é que ela **não tem `this` próprio** — ela usa o `this` de onde foi escrita.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'seta.js',
              partes: [
                {
                  codigo: 'const dobro = n => n * 2;\nconsole.log(dobro(4));',
                  nota: 'Um parâmetro, um retorno: sem parênteses, sem `return`, sem chaves. É a forma que aparece dentro de `map` e `filter` o tempo todo.',
                },
                {
                  codigo: 'const par = (a, b) => ({ a, b });\nconsole.log(par(1, 2));',
                  nota: 'Devolver um objeto exige os parênteses em volta. Sem eles, `{` é lido como início de bloco, e a função devolve `undefined` — em silêncio.',
                },
                {
                  codigo: 'const contador = {\n  n: 7,\n  comum() { return this.n; },\n  seta: () => (typeof this === "undefined" ? "sem this" : "this de fora"),\n};',
                  nota: 'A diferença que importa. A função comum recebe `this` de quem a CHAMOU; a seta herdou o `this` do lugar onde foi ESCRITA — e num módulo ES esse lugar não tem `this` nenhum.',
                },
                {
                  codigo: 'console.log(contador.comum());\nconsole.log(contador.seta());',
                  nota: 'A seta nem enxerga o objeto de que é propriedade. Por isso ela é ótima para callback — carrega o `this` de fora junto — e péssima para método.',
                },
              ],
              saida: '8\n{ a: 1, b: 2 }\n7\nsem this',
            },
          },
        ],
      },
      {
        id: 'template',
        titulo: 'Template strings',
        corpo: [
          'Crase em vez de aspas, `${}` para interpolar, e a quebra de linha vale literalmente. Some a concatenação com `+`, que é onde nascem os espaços faltando.',
          { codigo: 'javascript', texto: 'const nome = "Ana";\nconst n = 3;\n\nconsole.log(`${nome} concluiu ${n} ${n === 1 ? "curso" : "cursos"}.`);\n// Ana concluiu 3 cursos.' },
          'A interpolação aceita **qualquer expressão**, não só variável — chamada de função, ternário, operação. O que ela não deve receber é texto vindo do usuário destinado a virar HTML: aí a interpolação vira o furo, e é por isso que este portal tem um `esc()` em `app/texto.js`.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Tipos, coerção, igualdade estrita e valores falsos': [
      {
        id: 'coercao',
        titulo: 'Coerção: quando a linguagem adivinha',
        corpo: [
          'JavaScript converte tipos sozinho quando um operador recebe o que não esperava. Isso resolve pequenas conveniências e cria as maiores surpresas da linguagem.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'coercao.js',
              partes: [
                {
                  codigo: 'console.log(1 + "1");\nconsole.log(1 - "1");',
                  nota: '`+` é sobrecarregado: com uma string de um lado ele CONCATENA. `-` não tem essa ambiguidade, então converte para número. Mesmo par de valores, dois resultados de naturezas diferentes.',
                },
                {
                  codigo: 'console.log([] + {});\nconsole.log([1, 2] + [3]);',
                  nota: 'Objeto virando string passa por `toString()`. O de array junta com vírgula; o de objeto comum devolve `[object Object]`. É por isso que aquela mensagem aparece na tela às vezes.',
                },
                {
                  codigo: 'console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);',
                  nota: 'Este não é bug de JavaScript: é ponto flutuante IEEE-754, e vale igual em Python, Java e C. Dinheiro se guarda em centavos inteiros, nunca em `float`.',
                },
                {
                  codigo: 'console.log(Number("12px"));\nconsole.log(parseInt("12px", 10));',
                  nota: '`Number` é tudo ou nada; `parseInt` lê enquanto der e para. Ler a largura de um CSS pede o segundo — e o `10` não é opcional por hábito, é o que evita a base errada.',
                },
              ],
              saida: '11\n0\n[object Object]\n1,23\n0.30000000000000004\nfalse\nNaN\n12',
            },
          },
        ],
      },
      {
        id: 'igualdade',
        video: true,
        duracao: '08 min',
        titulo: '== contra ===',
        corpo: [
          '`==` compara depois de converter; `===` compara sem converter. A tabela do `==` tem casos que ninguém memoriza, e a saída disso é simples: **use `===` sempre.**',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'igual.js',
              partes: [
                {
                  codigo: 'console.log(0 == "");\nconsole.log(0 == "0");\nconsole.log("" == "0");',
                  nota: 'Os três com `==`. Repare que os dois primeiros são verdadeiros e o terceiro é falso: `==` **não é transitivo**, o que basta para descartá-lo.',
                },
                {
                  codigo: 'console.log(null == undefined);\nconsole.log(null === undefined);',
                  nota: 'A única exceção que vale conhecer: `x == null` é o jeito curto de perguntar "é `null` ou `undefined`?". É o único uso defensável de `==`.',
                },
                {
                  codigo: 'console.log(NaN === NaN);\nconsole.log(Number.isNaN(NaN));',
                  nota: '`NaN` é o único valor diferente de si mesmo. Testar com `===` nunca funciona; a pergunta certa é `Number.isNaN`.',
                },
              ],
              saida: 'true\ntrue\nfalse\ntrue\nfalse\nfalse\ntrue',
            },
          },
        ],
      },
      {
        id: 'falsos',
        video: true,
        duracao: '11 min',
        titulo: 'Os oito valores falsos',
        corpo: [
          'Num `if`, qualquer valor vira booleano. São **oito** os que viram `false` — e todo o resto vira `true`, inclusive `[]`, `{}` e `"0"`:',
          [
            '`false`, `0`, `-0`, `0n` (BigInt zero)',
            '`""` (string vazia)',
            '`null`, `undefined`, `NaN`',
          ],
          'A armadilha prática está em `0` e `""` serem falsos: `if (quantidade)` ignora a quantidade zero, e `if (nome)` ignora o nome vazio — nos dois casos tratando "existe e vale zero/vazio" como "não existe".',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'falsos.js',
              partes: [
                {
                  codigo: 'const config = { retries: 0, titulo: "" };',
                  nota: 'Dois valores legítimos que por acaso são falsos. Zero tentativas é uma decisão; título vazio também.',
                },
                {
                  codigo: 'console.log(config.retries || 3);\nconsole.log(config.titulo || "sem título");',
                  nota: 'O `||` clássico atropela os dois: ele testa "é falso?", não "está ausente?". O zero que o usuário escolheu virou três.',
                },
                {
                  codigo: 'console.log(config.retries ?? 3);\nconsole.log(JSON.stringify(config.titulo ?? "sem título"));',
                  nota: '`??` só entra em ação para `null` e `undefined` — o zero e a string vazia passam intactos. É o operador que a maioria dos `||` de valor padrão realmente queria ser. (O `JSON.stringify` está aí só para a string vazia aparecer como `""` em vez de uma linha em branco.)',
                },
              ],
              saida: '3\nsem título\n0\n""',
            },
          },
        ],
        materiais: ['js-coercao-tabela'],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Objetos, arrays, espalhamento e desestruturação': [
      {
        id: 'desestruturar',
        titulo: 'Desestruturação',
        corpo: [
          'Tirar campos de um objeto ou itens de um array sem repetir o nome da fonte em cada linha. É a sintaxe que mais aparece em código moderno depois da seta.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'destruct.js',
              partes: [
                {
                  codigo: 'const curso = { id: "js", nome: "JavaScript", horas: 80 };',
                  nota: 'O objeto de partida.',
                },
                {
                  codigo: 'const { nome, horas } = curso;\nconsole.log(nome, horas);',
                  nota: 'Os nomes à esquerda são as CHAVES, não posições. Ordem não importa; grafia importa.',
                },
                {
                  codigo: 'const { nome: titulo, nivel = "livre" } = curso;\nconsole.log(titulo, nivel);',
                  nota: 'Duas coisas de uma vez: renomear na saída, e um padrão para a chave que não existe. O padrão só entra quando o valor é `undefined` — `null` passa direto.',
                },
                {
                  codigo: 'function resumo({ nome, horas }) {\n  return `${nome}: ${horas}h`;\n}\nconsole.log(resumo(curso));',
                  nota: 'Desestruturar no PARÂMETRO é onde ela mais rende: a assinatura passa a documentar o que a função usa, em vez de receber um `opcoes` opaco.',
                },
              ],
              saida: 'JavaScript 80\nJavaScript livre\nJavaScript: 80h',
            },
          },
        ],
      },
      {
        id: 'espalhar',
        video: true,
        duracao: '09 min',
        titulo: 'Espalhar e juntar',
        corpo: [
          'As mesmas três reticências fazem coisas opostas conforme o lado em que estão: à direita elas **espalham**, à esquerda elas **juntam**.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'spread.js',
              partes: [
                {
                  codigo: 'const base = { tema: "escuro", idioma: "pt" };\nconst novo = { ...base, idioma: "en" };\nconsole.log(novo);',
                  nota: 'Cópia com alteração, sem mexer no original. A ordem decide quem vence: a última chave repetida sobrescreve — por isso `idioma` sai `en`.',
                },
                {
                  codigo: 'const a = [1, 2];\nconst b = [0, ...a, 3];\nconsole.log(b);',
                  nota: 'O mesmo em array, mantendo a ordem. Substitui `concat` e o velho `push.apply`.',
                },
                {
                  codigo: 'function soma(...numeros) {\n  return numeros.reduce((t, n) => t + n, 0);\n}\nconsole.log(soma(1, 2, 3, 4));',
                  nota: 'Do outro lado: aqui as reticências JUNTAM os argumentos num array de verdade. É o substituto de `arguments`, que não era array e não existe em arrow function.',
                },
                {
                  codigo: 'const orig = { dono: { nome: "Ana" } };\nconst copia = { ...orig };\ncopia.dono.nome = "Bia";\nconsole.log(orig.dono.nome);',
                  nota: 'A pegadinha: a cópia é RASA. O objeto de dentro continua sendo o mesmo, e alterá-lo altera os dois. Para cópia profunda existe `structuredClone`.',
                },
              ],
              saida: "{ tema: 'escuro', idioma: 'en' }\n[ 0, 1, 2, 3 ]\n10\nBia",
            },
          },
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Funções, escopo, closures e o valor de this': [
      {
        id: 'closure',
        titulo: 'Closure: a função que lembra',
        corpo: [
          'Uma função criada dentro de outra continua enxergando as variáveis da de fora, mesmo depois de a de fora ter terminado. Isso não é um recurso avançado: é o que faz callback, `setTimeout` e quase todo padrão de módulo funcionarem.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'closure.js',
              partes: [
                {
                  codigo: 'function contador() {\n  let n = 0;',
                  nota: '`n` vive dentro de `contador`. Ninguém de fora consegue tocá-lo — não há `private`, e não precisa.',
                },
                {
                  codigo: '  return {\n    incrementar: () => ++n,\n    ler: () => n,\n  };\n}',
                  nota: 'As duas setas fecham sobre o mesmo `n`. Devolver funções em vez do valor é o que transforma escopo em encapsulamento.',
                },
                {
                  codigo: 'const c = contador();\nc.incrementar();\nc.incrementar();\nconsole.log(c.ler());',
                  nota: '`contador()` já retornou faz tempo, e `n` continua vivo — porque alguém ainda o referencia. É o coletor de lixo que decide, não a pilha de chamadas.',
                },
                {
                  codigo: 'const outro = contador();\nconsole.log(outro.ler());',
                  nota: 'Cada chamada cria um escopo NOVO. Dois contadores não compartilham nada, que é o que separa closure de variável global.',
                },
              ],
              saida: '2\n0',
            },
          },
        ],
      },
      {
        id: 'this',
        video: true,
        duracao: '13 min',
        titulo: 'O valor de this',
        corpo: [
          '`this` não é decidido onde a função é escrita, e sim **onde ela é chamada** — com uma exceção, a arrow function. Quase todo bug de `this` é a mesma função tendo sido separada do objeto dela.',
          {
            exemplo: {
              linguagem: 'javascript',
              arquivo: 'this.js',
              partes: [
                {
                  codigo: 'const aluno = {\n  nome: "Ana",\n  ola() { return `oi, ${this.nome}`; },\n};\nconsole.log(aluno.ola());',
                  nota: 'Chamada como método: `this` é o que está à esquerda do ponto.',
                },
                {
                  codigo: 'const solta = aluno.ola;\ntry {\n  console.log(solta());\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  nota: 'A MESMA função, chamada sem dono. Em módulo ES o `this` é `undefined`, e ler `.nome` dele explode. É exatamente o que acontece ao passar `obj.metodo` como callback — e o `try` está aqui só para o exemplo continuar rodando.',
                },
                {
                  codigo: 'const presa = aluno.ola.bind(aluno);\nconsole.log(presa());',
                  nota: '`bind` amarra o `this` de uma vez. A alternativa moderna é passar uma seta: `() => aluno.ola()`, que carrega o contexto de fora.',
                },
              ],
              saida: 'oi, Ana\nTypeError\noi, Ana',
            },
          },
        ],
        materiais: ['js-this-mapa'],
      },
    ],
  },
});
