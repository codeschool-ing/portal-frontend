/* ==========================================================================
   `html-css` exercises — four lessons out of thirteen.

   The course is deliberately HALF DONE: lessons 04, 05, 07 and 10 have an
   assessment, the other nine do not. That is how a course looks while it is
   being produced, and it serves to show the pending assessment in its place —
   present in the structure, marked, with no complete button and outside the
   denominator.

   Five types, and the absence of the other two has a cause:
   - `code` and `expected-output` need an interpreter. The pipeline's validator
     executes python, javascript and sql; HTML and CSS are not verified against
     test cases, because what would be verified is the rendering — and no
     interpreter judges that.
   - `expression-answer` is for symbolic mathematics. There is nothing here for
     sympy to recompute.

   STATUS: sample content, no pedagogical review, marked `structure`.
   ========================================================================== */

window.SAMPLE_EXERCISES = (window.SAMPLE_EXERCISES || []).concat([

  /* ============================================================== lesson 04 */
  {
    id: 'hc-04-quiz',
    course: 'html-css',
    topic: 'Selectors, cascade, inheritance and specificity',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Duas regras atingem o mesmo elemento: `#painel p { color: red }` e `.aviso.destaque p { color: blue }`. Qual cor vence, e por quê?',
    socraticHint: 'A especificidade é um trio comparado da esquerda para a direita. Quantas classes seriam necessárias para superar um id?',
    choices: [
      {
        text: 'Vermelha: o id vale no primeiro número do trio, e ele é comparado antes das classes — nenhuma quantidade de classes o alcança.',
        correct: true,
        why: '(1,0,1) contra (0,2,1): o primeiro número decide e os demais nem são consultados.',
      },
      {
        text: 'Azul: duas classes somam mais peso que um id, porque a conta é uma soma ponderada.',
        correct: false,
        why: 'A conta não é soma: é comparação posição a posição, e a primeira diferença encerra o desempate.',
      },
      {
        text: 'Azul: entre regras que atingem o mesmo elemento, vence sempre a escrita por último.',
        correct: false,
        why: 'A ordem só desempata quando a especificidade empata, o que não é o caso aqui.',
      },
      {
        text: 'Vermelha: `color` é herdada, e propriedades herdadas ignoram a especificidade.',
        correct: false,
        why: 'Herança explica como um filho recebe valor sem regra própria; aqui há duas regras diretas, e quem decide é a cascata.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'hc-04-assoc',
    course: 'html-css',
    topic: 'Selectors, cascade, inheritance and specificity',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Associe cada seletor ao que ele atinge. Sobram opções na coluna da direita.',
    socraticHint: 'Dois deles diferem por um único caractere entre os nomes, e essa diferença é a distância na árvore.',
    pairs: [
      { left: '`nav a`', right: 'Todo link em qualquer profundidade dentro de nav' },
      { left: '`nav > a`', right: 'Só os links que são filhos diretos de nav' },
      { left: '`li + li`', right: 'Cada item que vem logo depois de outro item' },
      { left: '`a[href^="http"]`', right: 'Links cujo endereço começa com http' },
    ],
    rightDistractors: [
      'O primeiro item de cada lista da página',
      'Links que estão dentro de um elemento com a classe http',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 05 */
  {
    id: 'hc-05-quiz',
    course: 'html-css',
    topic: 'Box model, box-sizing and units (px, rem, em, %, vw/vh)',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'Um elemento tem `width: 200px`, `padding: 20px` e `border: 2px`. Quanto ele ocupa na horizontal, no comportamento padrão do CSS?',
    socraticHint: 'No padrão, `width` mede apenas uma das quatro camadas da caixa. Qual delas — e as outras entram para dentro ou para fora?',
    choices: [
      { text: '244px, porque no padrão `width` mede só o conteúdo e padding e borda somam para fora.', correct: true, why: '200 + 20 + 20 + 2 + 2 = 244. É o que `box-sizing: border-box` corrige.' },
      { text: '200px, porque `width` sempre define a largura final do elemento na tela.', correct: false, why: 'Isso passa a valer com `border-box`, que não é o padrão.' },
      { text: '240px, porque a borda é desenhada por cima do padding e não acrescenta largura.', correct: false, why: 'A borda ocupa espaço próprio, entre padding e margem.' },
      { text: '204px, porque o padding é interno ao conteúdo e não soma.', correct: false, why: 'Padding é interno à caixa, mas externo ao conteúdo — e soma no padrão.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'hc-05-mult',
    course: 'html-css',
    topic: 'Box model, box-sizing and units (px, rem, em, %, vw/vh)',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Marque as afirmações verdadeiras sobre unidades.',
    socraticHint: 'Uma delas é a razão de tamanho de texto em pixel ser um problema de acessibilidade. Outra trata de uma unidade que acumula quando os elementos se aninham.',
    choices: [
      { text: '`rem` respeita quem aumentou a fonte padrão no navegador; `px` ignora essa preferência.', correct: true, why: 'É por isso que tipografia se mede em `rem`.' },
      { text: '`em` acumula em elementos aninhados, porque é relativo à fonte do próprio elemento.', correct: true, why: 'Dois níveis com `1.2em` dão 1,44 vezes o tamanho, não 1,2.' },
      { text: 'No celular, `svh` e `dvh` lidam melhor que `vh` com a barra do navegador que aparece e some.', correct: true, why: '`vh` fixa a altura na janela maior e deixa conteúdo escondido atrás da barra.' },
      { text: '`%` é sempre relativo ao tamanho da janela.', correct: false, why: '`%` é relativo ao contêiner; quem se refere à janela é `vw`/`vh`.' },
      { text: '`box-sizing: border-box` altera o significado de `margin` além do de `width`.', correct: false, why: 'Margem é externa à caixa e não é afetada; muda o que `width` e `height` medem.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 07 */
  {
    id: 'hc-07-quiz',
    course: 'html-css',
    topic: 'Flexbox: axes, alignment and distribution',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Num contêiner com `display: flex` e `flex-direction: column`, o que `justify-content: center` faz?',
    socraticHint: 'As duas propriedades de alinhamento não são "horizontal" e "vertical": elas são "principal" e "cruzado". O que `flex-direction` acabou de mudar?',
    choices: [
      { text: 'Centraliza na vertical, porque com `column` o eixo principal passou a ser o vertical.', correct: true, why: '`justify-content` age sempre no eixo principal, e é `flex-direction` que decide qual é ele.' },
      { text: 'Centraliza na horizontal, porque `justify-content` sempre trata do eixo horizontal.', correct: false, why: 'Ele parece horizontal só porque `row` é o padrão; com `column`, quem trata da horizontal é `align-items`.' },
      { text: 'Não faz nada, porque em coluna só `align-items` tem efeito.', correct: false, why: 'As duas continuam funcionando; o que trocou foi o eixo de cada uma.' },
      { text: 'Centraliza nos dois sentidos, porque `column` funde os eixos.', correct: false, why: 'Os eixos continuam sendo dois e distintos; eles apenas trocaram de orientação.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'hc-07-assoc',
    course: 'html-css',
    topic: 'Flexbox: axes, alignment and distribution',
    type: 'matching',
    difficulty: 'hard',
    prompt: 'Associe cada declaração ao comportamento do item. Sobram opções na coluna da direita.',
    socraticHint: 'Duas delas diferem só na base — `0` ou `auto` —, e é a base que decide se o conteúdo do item influencia a largura final.',
    pairs: [
      { left: '`flex: 0 0 240px`', right: 'Fica com 240px fixos, sem crescer nem encolher' },
      { left: '`flex: 1`', right: 'Divide o espaço igualmente, ignorando o conteúdo' },
      { left: '`flex: 1 1 auto`', right: 'Ocupa o que sobrar, partindo do tamanho do conteúdo' },
      { left: '`min-width: 0`', right: 'Permite encolher abaixo do conteúdo, evitando o estouro' },
    ],
    rightDistractors: [
      'Alinha o item sozinho no eixo cruzado, ignorando os irmãos',
      'Muda a ordem visual do item sem alterar o HTML',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 10 */
  {
    id: 'hc-10-ord',
    course: 'html-css',
    topic: 'Responsiveness: mobile first, media queries and container queries',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Ponha em ordem os passos de escrever um componente responsivo em mobile first.',
    socraticHint: 'Um dos passos não tem media query nenhuma, e é justamente por isso que ele vem primeiro. Medir vem antes de escolher onde quebrar?',
    items: [
      'Escrever o layout de uma coluna, sem nenhuma media query',
      'Aumentar a janela até o layout de uma coluna ficar ruim de ler',
      'Anotar essa largura como o ponto de quebra do componente',
      'Acrescentar uma media query `min-width` que introduz a segunda coluna',
    ],
    trap: 'O par medir–anotar. É tentador escolher o ponto de quebra antes de olhar, usando os números de sempre (768, 1024). Mas ponto de quebra é propriedade do conteúdo, não do catálogo de aparelhos: o componente quebra onde a leitura piora, e essa largura muda com o tamanho do texto e a densidade de cada componente. Fixar antes de medir produz quebra em lugar arbitrário e obriga a corrigir depois.',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'hc-10-quiz',
    course: 'html-css',
    topic: 'Responsiveness: mobile first, media queries and container queries',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'Um cartão reutilizável aparece ora numa barra estreita, ora ocupando a tela inteira. Com media query, ele fica errado num dos dois. Por quê?',
    socraticHint: 'A media query pergunta o tamanho de quê? E é essa a medida que determina o espaço que o cartão realmente recebeu?',
    choices: [
      {
        text: 'A media query mede a janela, não o espaço dado ao cartão — e os dois casos acontecem na mesma janela.',
        correct: true,
        why: 'É o que as container queries resolvem: `@container` mede o contêiner, então o componente se adapta ao espaço que ele recebeu.',
      },
      {
        text: 'A media query só é reavaliada no carregamento, e não quando o cartão muda de lugar.',
        correct: false,
        why: 'Media queries são reavaliadas continuamente; o problema é o que elas medem, não quando.',
      },
      {
        text: 'Falta declarar `container-type` no cartão para a media query passar a considerá-lo.',
        correct: false,
        why: '`container-type` habilita `@container`, e não altera o comportamento de `@media`.',
      },
      {
        text: 'A especificidade da regra dentro da media query é menor que a da regra base.',
        correct: false,
        why: 'Media query não altera especificidade; a regra de dentro tem o peso do próprio seletor.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
]);
