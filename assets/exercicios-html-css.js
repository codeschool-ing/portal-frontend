/* ==========================================================================
   `html-css` exercises — four lessons out of thirteen.

   The course is deliberately HALF DONE: lessons 04, 05, 07 and 10 have an
   assessment, the other nine do not. That is how a course looks while it is
   being produced, and it serves to show the pending assessment in its place —
   present in the structure, marked, with no complete button and outside the
   denominator.

   Five types, and the absence of the other two has a cause:
   - `codigo` and `saida-esperada` need an interpreter. The pipeline's validator
     executes python, javascript and sql; HTML and CSS are not verified against
     test cases, because what would be verified is the rendering — and no
     interpreter judges that.
   - `resposta-expressao` is for symbolic mathematics. There is nothing here for
     sympy to recompute.

   STATUS: sample content, no pedagogical review, marked `estrutura`.
   ========================================================================== */

window.EXERCICIOS_EXEMPLO = (window.EXERCICIOS_EXEMPLO || []).concat([

  /* ============================================================== lesson 04 */
  {
    id: 'hc-04-quiz',
    curso: 'html-css',
    topico: 'Seletores, cascata, herança e especificidade',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Duas regras atingem o mesmo elemento: `#painel p { color: red }` e `.aviso.destaque p { color: blue }`. Qual cor vence, e por quê?',
    dica_socratica: 'A especificidade é um trio comparado da esquerda para a direita. Quantas classes seriam necessárias para superar um id?',
    alternativas: [
      {
        texto: 'Vermelha: o id vale no primeiro número do trio, e ele é comparado antes das classes — nenhuma quantidade de classes o alcança.',
        correta: true,
        porque: '(1,0,1) contra (0,2,1): o primeiro número decide e os demais nem são consultados.',
      },
      {
        texto: 'Azul: duas classes somam mais peso que um id, porque a conta é uma soma ponderada.',
        correta: false,
        porque: 'A conta não é soma: é comparação posição a posição, e a primeira diferença encerra o desempate.',
      },
      {
        texto: 'Azul: entre regras que atingem o mesmo elemento, vence sempre a escrita por último.',
        correta: false,
        porque: 'A ordem só desempata quando a especificidade empata, o que não é o caso aqui.',
      },
      {
        texto: 'Vermelha: `color` é herdada, e propriedades herdadas ignoram a especificidade.',
        correta: false,
        porque: 'Herança explica como um filho recebe valor sem regra própria; aqui há duas regras diretas, e quem decide é a cascata.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'hc-04-assoc',
    curso: 'html-css',
    topico: 'Seletores, cascata, herança e especificidade',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada seletor ao que ele atinge. Sobram opções na coluna da direita.',
    dica_socratica: 'Dois deles diferem por um único caractere entre os nomes, e essa diferença é a distância na árvore.',
    pares: [
      { esquerda: '`nav a`', direita: 'Todo link em qualquer profundidade dentro de nav' },
      { esquerda: '`nav > a`', direita: 'Só os links que são filhos diretos de nav' },
      { esquerda: '`li + li`', direita: 'Cada item que vem logo depois de outro item' },
      { esquerda: '`a[href^="http"]`', direita: 'Links cujo endereço começa com http' },
    ],
    distratores_direita: [
      'O primeiro item de cada lista da página',
      'Links que estão dentro de um elemento com a classe http',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 05 */
  {
    id: 'hc-05-quiz',
    curso: 'html-css',
    topico: 'Modelo de caixa, box-sizing e unidades (px, rem, em, %, vw/vh)',
    tipo: 'quiz',
    dificuldade: 'facil',
    enunciado: 'Um elemento tem `width: 200px`, `padding: 20px` e `border: 2px`. Quanto ele ocupa na horizontal, no comportamento padrão do CSS?',
    dica_socratica: 'No padrão, `width` mede apenas uma das quatro camadas da caixa. Qual delas — e as outras entram para dentro ou para fora?',
    alternativas: [
      { texto: '244px, porque no padrão `width` mede só o conteúdo e padding e borda somam para fora.', correta: true, porque: '200 + 20 + 20 + 2 + 2 = 244. É o que `box-sizing: border-box` corrige.' },
      { texto: '200px, porque `width` sempre define a largura final do elemento na tela.', correta: false, porque: 'Isso passa a valer com `border-box`, que não é o padrão.' },
      { texto: '240px, porque a borda é desenhada por cima do padding e não acrescenta largura.', correta: false, porque: 'A borda ocupa espaço próprio, entre padding e margem.' },
      { texto: '204px, porque o padding é interno ao conteúdo e não soma.', correta: false, porque: 'Padding é interno à caixa, mas externo ao conteúdo — e soma no padrão.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'hc-05-mult',
    curso: 'html-css',
    topico: 'Modelo de caixa, box-sizing e unidades (px, rem, em, %, vw/vh)',
    tipo: 'multipla-escolha',
    dificuldade: 'media',
    enunciado: 'Marque as afirmações verdadeiras sobre unidades.',
    dica_socratica: 'Uma delas é a razão de tamanho de texto em pixel ser um problema de acessibilidade. Outra trata de uma unidade que acumula quando os elementos se aninham.',
    alternativas: [
      { texto: '`rem` respeita quem aumentou a fonte padrão no navegador; `px` ignora essa preferência.', correta: true, porque: 'É por isso que tipografia se mede em `rem`.' },
      { texto: '`em` acumula em elementos aninhados, porque é relativo à fonte do próprio elemento.', correta: true, porque: 'Dois níveis com `1.2em` dão 1,44 vezes o tamanho, não 1,2.' },
      { texto: 'No celular, `svh` e `dvh` lidam melhor que `vh` com a barra do navegador que aparece e some.', correta: true, porque: '`vh` fixa a altura na janela maior e deixa conteúdo escondido atrás da barra.' },
      { texto: '`%` é sempre relativo ao tamanho da janela.', correta: false, porque: '`%` é relativo ao contêiner; quem se refere à janela é `vw`/`vh`.' },
      { texto: '`box-sizing: border-box` altera o significado de `margin` além do de `width`.', correta: false, porque: 'Margem é externa à caixa e não é afetada; muda o que `width` e `height` medem.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 07 */
  {
    id: 'hc-07-quiz',
    curso: 'html-css',
    topico: 'Flexbox: eixos, alinhamento e distribuição',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Num contêiner com `display: flex` e `flex-direction: column`, o que `justify-content: center` faz?',
    dica_socratica: 'As duas propriedades de alinhamento não são "horizontal" e "vertical": elas são "principal" e "cruzado". O que `flex-direction` acabou de mudar?',
    alternativas: [
      { texto: 'Centraliza na vertical, porque com `column` o eixo principal passou a ser o vertical.', correta: true, porque: '`justify-content` age sempre no eixo principal, e é `flex-direction` que decide qual é ele.' },
      { texto: 'Centraliza na horizontal, porque `justify-content` sempre trata do eixo horizontal.', correta: false, porque: 'Ele parece horizontal só porque `row` é o padrão; com `column`, quem trata da horizontal é `align-items`.' },
      { texto: 'Não faz nada, porque em coluna só `align-items` tem efeito.', correta: false, porque: 'As duas continuam funcionando; o que trocou foi o eixo de cada uma.' },
      { texto: 'Centraliza nos dois sentidos, porque `column` funde os eixos.', correta: false, porque: 'Os eixos continuam sendo dois e distintos; eles apenas trocaram de orientação.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'hc-07-assoc',
    curso: 'html-css',
    topico: 'Flexbox: eixos, alinhamento e distribuição',
    tipo: 'associacao',
    dificuldade: 'dificil',
    enunciado: 'Associe cada declaração ao comportamento do item. Sobram opções na coluna da direita.',
    dica_socratica: 'Duas delas diferem só na base — `0` ou `auto` —, e é a base que decide se o conteúdo do item influencia a largura final.',
    pares: [
      { esquerda: '`flex: 0 0 240px`', direita: 'Fica com 240px fixos, sem crescer nem encolher' },
      { esquerda: '`flex: 1`', direita: 'Divide o espaço igualmente, ignorando o conteúdo' },
      { esquerda: '`flex: 1 1 auto`', direita: 'Ocupa o que sobrar, partindo do tamanho do conteúdo' },
      { esquerda: '`min-width: 0`', direita: 'Permite encolher abaixo do conteúdo, evitando o estouro' },
    ],
    distratores_direita: [
      'Alinha o item sozinho no eixo cruzado, ignorando os irmãos',
      'Muda a ordem visual do item sem alterar o HTML',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 10 */
  {
    id: 'hc-10-ord',
    curso: 'html-css',
    topico: 'Responsividade: mobile first, media queries e container queries',
    tipo: 'ordenacao',
    dificuldade: 'media',
    enunciado: 'Ponha em ordem os passos de escrever um componente responsivo em mobile first.',
    dica_socratica: 'Um dos passos não tem media query nenhuma, e é justamente por isso que ele vem primeiro. Medir vem antes de escolher onde quebrar?',
    itens: [
      'Escrever o layout de uma coluna, sem nenhuma media query',
      'Aumentar a janela até o layout de uma coluna ficar ruim de ler',
      'Anotar essa largura como o ponto de quebra do componente',
      'Acrescentar uma media query `min-width` que introduz a segunda coluna',
    ],
    armadilha: 'O par medir–anotar. É tentador escolher o ponto de quebra antes de olhar, usando os números de sempre (768, 1024). Mas ponto de quebra é propriedade do conteúdo, não do catálogo de aparelhos: o componente quebra onde a leitura piora, e essa largura muda com o tamanho do texto e a densidade de cada componente. Fixar antes de medir produz quebra em lugar arbitrário e obriga a corrigir depois.',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'hc-10-quiz',
    curso: 'html-css',
    topico: 'Responsividade: mobile first, media queries e container queries',
    tipo: 'quiz',
    dificuldade: 'dificil',
    enunciado: 'Um cartão reutilizável aparece ora numa barra estreita, ora ocupando a tela inteira. Com media query, ele fica errado num dos dois. Por quê?',
    dica_socratica: 'A media query pergunta o tamanho de quê? E é essa a medida que determina o espaço que o cartão realmente recebeu?',
    alternativas: [
      {
        texto: 'A media query mede a janela, não o espaço dado ao cartão — e os dois casos acontecem na mesma janela.',
        correta: true,
        porque: 'É o que as container queries resolvem: `@container` mede o contêiner, então o componente se adapta ao espaço que ele recebeu.',
      },
      {
        texto: 'A media query só é reavaliada no carregamento, e não quando o cartão muda de lugar.',
        correta: false,
        porque: 'Media queries são reavaliadas continuamente; o problema é o que elas medem, não quando.',
      },
      {
        texto: 'Falta declarar `container-type` no cartão para a media query passar a considerá-lo.',
        correta: false,
        porque: '`container-type` habilita `@container`, e não altera o comportamento de `@media`.',
      },
      {
        texto: 'A especificidade da regra dentro da media query é menor que a da regra base.',
        correta: false,
        porque: 'Media query não altera especificidade; a regra de dentro tem o peso do próprio seletor.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
]);
