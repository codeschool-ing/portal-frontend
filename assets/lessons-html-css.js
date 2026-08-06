/* ==========================================================================
   Lesson content for `html-css` — 13 lessons, 5.4h each in the catalogue.

   It is the first PRACTICAL course written for the portal, and it is what forced
   the prose to gain a code block. In `web-fundamentals`, which is conceptual, a
   backtick mid-sentence was enough; here there is no way to teach a selector
   without showing it in three lines with the indentation preserved. The shape
   grew because the content asked for it, and only as much as it asked — see
   `prose()` in app/text.js.

   THE STATE OF THE ASSESSMENTS, AND IT IS ON PURPOSE
   Four lessons have exercises (04, 05, 07 and 10) and nine do not. That is what
   a course really looks like while it is being produced, and it serves to show
   the pending assessment in its place: it appears in the structure, marked, with
   no complete button and outside the progress denominator.

   `codigo` still does not show up, for the same reason as `web-fundamentals` by a
   different route: the pipeline's validator executes python, javascript and sql.
   HTML and CSS are not executed against test cases — what would be verified is
   the rendering, and no interpreter judges that.

   A SECTION TITLE IS PLAIN TEXT, no backticks and no asterisks. It appears in
   three places — the screen's `h2`, the step chip and the rail line — and in the
   last two it is a label, not prose: markup there becomes noise in a 200px chip.
   The body's prose still accepts `code` and **bold**.

   STATUS: sample content, technically correct and with no pedagogical review.
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {

  'html-css': {

    /* --------------------------------------------------------------- 01 */
    'Structure of an HTML document and metadata': [
      {
        id: 'esqueleto',
        title: 'O esqueleto de toda página',
        body: [
          'Todo documento HTML tem a mesma moldura, e vale digitá-la à mão algumas vezes antes de deixar o editor gerá-la:',
          { code: 'html', text: '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8" />\n  <title>Minha página</title>\n</head>\n<body>\n  <h1>Olá</h1>\n</body>\n</html>' },
          'O `<!DOCTYPE html>` não é uma tag: é uma declaração que diz ao navegador para usar o modo padrão. Sem ela, ele entra em *quirks mode* e passa a imitar bugs de navegadores dos anos 90 — o mais famoso deles muda o modelo de caixa inteiro, e o layout desanda sem erro nenhum aparecer.',
          'O `lang` no `<html>` também não é enfeite: é o que faz o leitor de tela escolher a pronúncia certa e o corretor ortográfico escolher o dicionário certo.',
        ],
      },
      {
        id: 'metadados',
        video: true,
        duration: '08 min',
        title: 'Metadados que fazem diferença',
        body: [
          'O `<head>` não aparece na tela e decide muita coisa do que acontece nela.',
          [
            '`<meta charset="UTF-8">` — sem ele, acentos viram símbolos. Vem primeiro, porque o navegador precisa saber a codificação antes de interpretar o resto.',
            '`<meta name="viewport" content="width=device-width, initial-scale=1">` — sem ele, o celular finge ter 980px de largura e desenha a página miniaturizada. É a linha que separa "responsivo" de "página de computador espremida".',
            '`<title>` — vai na aba, no favorito e no resultado do buscador.',
            '`<meta name="description">` — o parágrafo que o buscador mostra abaixo do título.',
          ],
          'A do *viewport* é a que mais dói quando falta, porque a página parece funcionar no computador e nasce quebrada no celular — que é onde está a maioria dos visitantes.',
        ],
      },
      {
        id: 'onde-entra',
        title: 'Onde entram o CSS e o JavaScript',
        body: [
          'A folha de estilo vai no `<head>`, e o script vai no fim do `<body>` ou com `defer`:',
          { code: 'html', text: '<head>\n  <link rel="stylesheet" href="estilo.css" />\n  <script src="app.js" defer></script>\n</head>' },
          'Os dois lugares vêm do mesmo raciocínio, com resultados opostos. **CSS bloqueia a renderização de propósito** — mostrar a página sem estilo e reestilizá-la depois piscaria a tela inteira —, então quanto antes ele começar a baixar, melhor.',
          '**Script comum bloqueia a montagem do DOM**, porque pode alterar a árvore que está sendo construída. Por isso `<script>` no topo do `<head>` sem `defer` é a receita clássica de página em branco. Com `defer`, ele baixa em paralelo e executa depois do HTML montado, preservando a ordem entre scripts.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Semantic HTML: header, nav, main, section, article and footer': [
      {
        id: 'por-que',
        title: 'Por que não basta div',
        body: [
          'Do ponto de vista visual, `<div>` e `<main>` são idênticos: nenhum dos dois tem estilo próprio relevante. A diferença é que um deles **significa** alguma coisa.',
          'Quem lê esse significado: leitores de tela, que oferecem pular direto ao conteúdo principal; buscadores, que distinguem artigo de menu; o modo leitura do navegador, que precisa adivinhar onde o texto começa; e a pessoa que abrir seu código daqui a um ano.',
          'O custo de usar o elemento certo é zero — é o mesmo número de caracteres. O custo de não usar aparece depois, e sempre em quem tem menos escolha.',
        ],
      },
      {
        id: 'regioes',
        title: 'Os elementos de região',
        body: [
          'Seis elementos cobrem quase toda página:',
          { code: 'html', text: '<body>\n  <header>\n    <nav>… menu …</nav>\n  </header>\n\n  <main>\n    <article>\n      <h1>Título do texto</h1>\n      <section>… um bloco do texto …</section>\n    </article>\n  </main>\n\n  <footer>… contato, direitos …</footer>\n</body>' },
          '`<main>` é o único que deve aparecer **uma vez só** por página, e é ele que dá ao leitor de tela o atalho "pular para o conteúdo". `<header>` e `<footer>` podem se repetir: um `<article>` pode ter os seus próprios.',
        ],
      },
      {
        id: 'section-article',
        title: 'section, article ou div?',
        body: [
          'A dúvida mais comum do HTML semântico tem uma régua curta.',
          [
            '**`<article>`** — faz sentido sozinho, fora da página. Um post, uma notícia, um comentário, um cartão de produto. Teste: dá para publicar isto num feed RSS?',
            '**`<section>`** — um bloco temático **dentro** de algo maior, e que tem um título. Se você não consegue dar um título a ele, provavelmente não é uma `section`.',
            '**`<div>`** — não significa nada, e está certo assim. É o elemento para agrupar por motivo puramente visual: um contêiner que existe só para receber um `display: flex`.',
          ],
          '`<div>` não é derrota. Usar `<section>` onde só havia necessidade de layout é pior: cria estrutura semântica falsa, e o leitor de tela anuncia uma região que não existe.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Forms, fields, labels and native validation': [
      {
        id: 'rotulos',
        title: 'Campo sem rótulo é campo quebrado',
        body: [
          'Todo campo precisa de um `<label>` ligado a ele. A ligação é pelo `for` que aponta para o `id`:',
          { code: 'html', text: '<label for="email">E-mail</label>\n<input type="email" id="email" name="email" required />' },
          'A ligação faz três coisas de uma vez: o leitor de tela anuncia o rótulo quando o campo recebe foco, clicar no texto foca o campo, e a área de toque no celular cresce — o que importa mais do que parece em caixas de seleção.',
          '`placeholder` **não** substitui rótulo. Ele some quando a pessoa começa a digitar, e aí ninguém mais sabe o que aquele campo era. É complemento, não substituto.',
        ],
      },
      {
        id: 'tipos',
        title: 'O tipo do campo muda o teclado',
        body: [
          'No computador, `type="email"` e `type="text"` parecem iguais. No celular, não: o tipo escolhe qual teclado aparece.',
          [
            '`email` — traz o `@` e o ponto na primeira tela.',
            '`tel` — teclado numérico grande, o de discagem.',
            '`number` — numérico, mas cuidado: ele recusa zeros à esquerda e caracteres de formatação, então **não** serve para CEP, CPF nem cartão.',
            '`url`, `date`, `search` — cada um com o seu teclado e o seu seletor nativo.',
          ],
          'Para CEP e telefone com máscara, o par que funciona é `type="text"` com `inputmode="numeric"`: teclado numérico, sem as restrições de `number`.',
        ],
      },
      {
        id: 'validacao',
        title: 'Validação nativa, e onde ela para',
        body: [
          'O navegador valida sozinho com atributos, sem uma linha de JavaScript:',
          { code: 'html', text: '<input type="email" required />\n<input type="text" minlength="3" maxlength="40" />\n<input type="text" pattern="[0-9]{5}-[0-9]{3}" />' },
          'E dá para estilizar o estado com `:valid`, `:invalid` e — o mais útil — `:user-invalid`, que só pinta de vermelho **depois** de a pessoa ter interagido com o campo. Sem ele, um formulário nasce todo vermelho antes de alguém digitar nada.',
          '**Validação no navegador é conveniência, nunca segurança.** Qualquer pessoa remove um `required` pelo inspetor em dois segundos. O servidor valida tudo de novo, sempre — a do cliente existe para evitar a viagem até o servidor, não para proteger dele.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Tables, responsive images and media': [
      {
        id: 'tabelas',
        title: 'Tabela é para dado, não para layout',
        body: [
          'Tabela existe para dado tabular — coisa que tem linha, coluna e sentido em ambas. Uma tabela bem marcada diz ao leitor de tela a que coluna cada célula pertence, e a pessoa consegue navegar entre elas:',
          { code: 'html', text: '<table>\n  <caption>Notas do semestre</caption>\n  <thead>\n    <tr><th scope="col">Aluno</th><th scope="col">Nota</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope="row">Ana</th><td>9,0</td></tr>\n  </tbody>\n</table>' },
          'O `scope` é o que faz a diferença: sem ele, o leitor de tela lê "9,0" sem dizer de quem nem de quê. Com ele, lê "Ana, Nota, 9,0".',
          'Usar tabela para posicionar coisas na tela foi normal nos anos 90 e hoje é erro: cria estrutura de dados falsa, e Flexbox e Grid resolvem melhor. Layout é a próxima metade do curso.',
        ],
      },
      {
        id: 'imagens',
        video: true,
        duration: '10 min',
        title: 'Imagens que não desperdiçam banda',
        body: [
          'Servir a mesma imagem de 2000px para um celular é jogar fora banda e bateria de quem tem menos dos dois. `srcset` deixa o navegador escolher:',
          { code: 'html', text: '<img\n  src="foto-800.jpg"\n  srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1600.jpg 1600w"\n  sizes="(max-width: 700px) 100vw, 700px"\n  alt="Fachada da escola vista da calçada"\n  width="800" height="600"\n  loading="lazy" />' },
          '`width` e `height` não fixam o tamanho quando há CSS — eles informam a **proporção**, e é isso que impede a página de pular quando a imagem termina de carregar. `loading="lazy"` adia o que está fora da tela.',
          {
            /* This is the figure's other route: a FILE, and not an inline
               drawing. In Stage 2 `imagem` becomes a bucket URL; here it is a
               `data:` URI so the single-file bundle stays whole. */
            image: 'data:image/svg+xml,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20640%20200%22><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221.3%22><rect%20x=%2212%22%20y=%22118%22%20width=%2270%22%20height=%2252%22%20rx=%223%22/><rect%20x=%22106%22%20y=%2284%22%20width=%22120%22%20height=%2286%22%20rx=%223%22/><rect%20x=%22250%22%20y=%2226%22%20width=%22230%22%20height=%22144%22%20rx=%223%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2211%22%20text-anchor=%22middle%22><text%20x=%2247%22%20y=%22148%22>400w</text><text%20x=%22166%22%20y=%22130%22>800w</text><text%20x=%22365%22%20y=%22102%22>1600w</text><text%20x=%2247%22%20y=%22188%22>celular</text><text%20x=%22166%22%20y=%22188%22>tablet</text><text%20x=%22365%22%20y=%22188%22>desktop</text></g><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221%22%20stroke-dasharray=%223%203%22%20opacity=%22.7%22><path%20d=%22M520%2026v144%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2210%22><text%20x=%22534%22%20y=%2290%22>o%20navegador</text><text%20x=%22534%22%20y=%22106%22>escolhe%20uma,</text><text%20x=%22534%22%20y=%22122%22>n%C3%A3o%20as%20tr%C3%AAs</text></g></svg>',
            alt: 'Três retângulos de tamanhos diferentes rotulados 400w, 800w e 1600w, sob os rótulos celular, tablet e desktop',
            caption: 'O `srcset` oferece as três; quem escolhe é o navegador, que sabe a largura da tela e a densidade dela — coisas que o servidor não sabe.',
          },
          'O `alt` descreve a imagem para quem não a vê. Imagem puramente decorativa leva `alt=""` — vazio, não ausente: assim o leitor de tela a ignora em vez de anunciar o nome do arquivo.',
        ],
      },
      {
        id: 'midia',
        title: 'Vídeo e áudio',
        body: [
          'Os elementos nativos dispensam biblioteca para o caso comum:',
          { code: 'html', text: '<video controls preload="metadata" poster="capa.jpg" width="640">\n  <source src="aula.webm" type="video/webm" />\n  <source src="aula.mp4" type="video/mp4" />\n  <track kind="captions" src="aula.vtt" srclang="pt" label="Português" default />\n</video>' },
          'Vários `<source>` deixam o navegador pegar o formato que ele reproduz. `preload="metadata"` baixa só o suficiente para saber a duração — `auto` baixaria o vídeo inteiro de quem talvez não o assista.',
          'A faixa de legenda não é opcional na prática: ela serve a quem não ouve, a quem está em lugar barulhento e a quem prefere ler. E, ao contrário do resto, ela não se acrescenta depois sem voltar a produzir o conteúdo.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 05 */
    'Selectors, cascade, inheritance and specificity': [
      {
        id: 'seletores',
        title: 'O vocabulário dos seletores',
        body: [
          'Seletor é a pergunta "quais elementos?". As formas que resolvem quase tudo:',
          { code: 'css', text: '.cartao          { }   /* classe */\n#topo            { }   /* id */\nnav a            { }   /* descendente: todo `a` dentro de nav */\nnav > a          { }   /* filho direto */\nli + li          { }   /* irmão imediatamente seguinte */\na[href^="http"]  { }   /* atributo que começa com */\nli:nth-child(2n) { }   /* pseudo-classe */' },
          'Na prática, **classe resolve 90% dos casos**, e é o que se deve preferir. Id é único por página e, como se vê na próxima seção, tem um peso na especificidade que atrapalha mais do que ajuda.',
        ],
      },
      {
        id: 'especificidade',
        video: true,
        duration: '12 min',
        title: 'Especificidade: a conta que decide quem ganha',
        body: [
          'Quando duas regras atingem o mesmo elemento e declaram a mesma propriedade, vence a mais específica. A especificidade é um trio de números — **(ids, classes, elementos)** — comparado da esquerda para a direita:',
          { code: 'css', text: 'p                 /* (0,0,1) */\n.aviso            /* (0,1,0)  vence de p */\nnav a.ativo       /* (0,1,2) */\n#topo             /* (1,0,0)  vence de tudo acima */' },
          'O primeiro número esmaga os outros: **um id vence qualquer quantidade de classes**. É por isso que estilizar por id acaba forçando o próximo a usar `!important` — e uma vez que `!important` entra num arquivo, ele se espalha.',
          'Empate de especificidade é desempatado pela ordem: a última regra escrita ganha.',
        ],
      },
      {
        id: 'cascata',
        title: 'Cascata e herança são coisas diferentes',
        body: [
          '**Cascata** é como o navegador escolhe entre regras que disputam o mesmo elemento: origem, `!important`, especificidade e, por fim, ordem.',
          '**Herança** é outra coisa: algumas propriedades passam de pai para filho sem ninguém pedir. `color`, `font-family` e `line-height` herdam; `border`, `padding` e `background` não.',
          'A distinção importa porque explica um erro comum: definir `font-family` no `body` funciona para a página inteira (herança), mas definir `border` no `body` não desenha borda nenhuma nos filhos. E há o caso híbrido do `<button>`, que **não** herda a fonte por padrão — daí a linha `font: inherit` que aparece em quase todo CSS sério.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 06 */
    'Box model, box-sizing and units (px, rem, em, %, vw/vh)': [
      {
        id: 'caixa',
        title: 'Toda coisa é uma caixa',
        body: [
          'Cada elemento é um retângulo com quatro camadas, de dentro para fora: **conteúdo**, **padding**, **borda** e **margem**.',
          'Padding é espaço interno — ele empurra o conteúdo para longe da borda e recebe a cor de fundo. Margem é espaço externo — separa esta caixa das vizinhas e é transparente.',
          'Um detalhe que confunde todo mundo uma vez: **margens verticais adjacentes se fundem**. Dois parágrafos com 20px de margem embaixo e em cima não ficam com 40px de distância; ficam com 20. É o *colapso de margens*, vale só na vertical, e é a razão de muita gente usar `gap` do flex/grid em vez de margem.',
        ],
      },
      {
        id: 'box-sizing',
        video: true,
        duration: '07 min',
        title: 'box-sizing, e a primeira linha de todo CSS',
        body: [
          'Por padrão, `width` mede só o conteúdo. Então uma caixa declarada com 200px e mais padding e borda ocupa **mais** que 200px:',
          { code: 'css', text: '.caixa {\n  width: 200px;\n  padding: 20px;\n  border: 2px solid;\n}\n/* largura real: 200 + 20+20 + 2+2 = 244px */' },
          'Isso torna qualquer layout uma conta de cabeça. A correção é uma linha, e ela abre praticamente todo CSS moderno:',
          { code: 'css', text: '*, *::before, *::after {\n  box-sizing: border-box;\n}' },
          'Com `border-box`, `width: 200px` significa 200px na tela, com padding e borda **para dentro**. É o comportamento que todo mundo esperava desde o começo.',
        ],
      },
      {
        id: 'unidades',
        title: 'Qual unidade para quê',
        body: [
          'Cada unidade responde a uma pergunta diferente, e escolher errado é a origem de metade dos problemas de acessibilidade em tipografia.',
          [
            '**`px`** — absoluto. Bom para borda e para sombra, onde o valor é físico mesmo.',
            '**`rem`** — múltiplo da fonte-raiz. É o padrão para tipografia e espaçamento, porque **respeita quem aumentou a fonte no navegador**. Tamanho de texto em `px` ignora essa preferência.',
            '**`em`** — múltiplo da fonte do próprio elemento. Útil para espaçamento que deve acompanhar o texto, mas cuidado: ele acumula em elementos aninhados.',
            '**`%`** — relativo ao contêiner. Largura.',
            '**`vw` / `vh`** — relativo à janela. Bom para telas cheias; no celular, prefira `svh`/`dvh`, que lidam com a barra do navegador que aparece e some.',
          ],
          'A regra prática que resolve quase tudo: **`rem` para texto e espaço, `%` ou `fr` para largura, `px` só para detalhes finos.**',
        ],
      },
    ],

    /* --------------------------------------------------------------- 07 */
    'Positioning: static, relative, absolute, fixed and sticky': [
      {
        id: 'fluxo',
        title: 'O fluxo normal, e sair um pouco dele',
        body: [
          'Por padrão todo elemento é `position: static`: ele fica onde o fluxo o colocou, e `top`/`left` não fazem nada.',
          '`position: relative` mantém o elemento no fluxo — **o espaço dele continua reservado** — e desloca só o desenho. Por isso ele quase nunca é usado para mover coisas: é usado para virar **âncora** de um filho `absolute`, que é o assunto da próxima seção.',
        ],
      },
      {
        id: 'absolute',
        title: 'absolute e o contexto de posicionamento',
        body: [
          '`position: absolute` tira o elemento do fluxo: o espaço dele deixa de existir e os vizinhos se fecham como se ele não estivesse ali. Ele passa a se posicionar em relação ao **ancestral posicionado mais próximo** — qualquer um que não seja `static`.',
          { code: 'css', text: '.cartao      { position: relative; }\n.cartao .selo {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n}' },
          'É o padrão mais usado do CSS inteiro: o pai vira `relative` só para servir de referência, e o filho se pendura no canto dele. **Esquecer o `relative` no pai** é o defeito clássico — o selo sobe até o canto da página, porque na falta de ancestral posicionado a referência vira a janela.',
        ],
      },
      {
        id: 'fixed-sticky',
        title: 'fixed e sticky',
        body: [
          '`fixed` prende o elemento à janela: ele não sai do lugar quando a página rola. É o que segura a barra do topo deste portal.',
          '`sticky` é o híbrido: o elemento rola normalmente até atingir o limite declarado, e ali gruda.',
          { code: 'css', text: '.cabecalho-tabela {\n  position: sticky;\n  top: 0;\n}' },
          'Duas pegadinhas do `sticky` explicam quase todo caso de "não funciona": ele **exige** um deslocamento declarado (`top`, `bottom`…), sem o qual não faz nada; e ele gruda dentro do **pai**, não da janela — se o pai tem `overflow: hidden` ou acaba logo, o efeito termina junto.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 08 */
    'Flexbox: axes, alignment and distribution': [
      {
        id: 'eixos',
        title: 'Tudo depende do eixo principal',
        video: true,
        duration: '14 min',
        body: [
          'Flexbox organiza os filhos ao longo de **um** eixo. `flex-direction` escolhe qual:',
          { code: 'css', text: '.barra {\n  display: flex;\n  flex-direction: row;   /* padrão: eixo principal na horizontal */\n}' },
          'Entender isso resolve a confusão que mais atrasa quem está aprendendo: `justify-content` age no **eixo principal** e `align-items` no **cruzado**. Como o padrão é `row`, `justify-content` parece "horizontal" e `align-items` parece "vertical" — até alguém escrever `flex-direction: column`, e os dois trocarem de sentido.',
          'A pergunta certa nunca é "como centralizo na horizontal?", e sim "qual é o meu eixo principal?".',
          {
            svg: [
              '<svg viewBox="0 0 760 226" role="img" aria-label="Com flex-direction row o eixo principal é horizontal e o cruzado é vertical; com column os dois trocam de lugar">',
              '<g font-family="IBM Plex Mono, monospace" font-size="11" fill="currentColor" opacity=".65">',
              '<text x="30" y="18">flex-direction: row</text>',
              '<text x="430" y="18">flex-direction: column</text>',
              '</g>',
              '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".4">',
              '<rect x="30" y="30" width="300" height="140" rx="4"/>',
              '<rect x="430" y="30" width="300" height="140" rx="4"/>',
              '</g>',
              '<g fill="currentColor" opacity=".2">',
              '<rect x="48" y="44" width="62" height="76" rx="3"/>',
              '<rect x="118" y="44" width="62" height="76" rx="3"/>',
              '<rect x="188" y="44" width="62" height="76" rx="3"/>',
              '<rect x="450" y="42" width="180" height="30" rx="3"/>',
              '<rect x="450" y="78" width="180" height="30" rx="3"/>',
              '<rect x="450" y="114" width="180" height="30" rx="3"/>',
              '</g>',
              '<g fill="none" stroke-width="1.8" style="stroke:var(--phosphor)">',
              '<path d="M44 150h268" marker-end="url(#ep)"/>',
              '<path d="M690 42v112" marker-end="url(#ep)"/>',
              '</g>',
              '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45" stroke-dasharray="4 4">',
              '<path d="M282 40v82" marker-end="url(#ec)"/>',
              '<path d="M450 158h190" marker-end="url(#ec)"/>',
              '</g>',
              '<g font-family="IBM Plex Mono, monospace" font-size="11">',
              '<path d="M30 194h26" fill="none" stroke-width="1.8" style="stroke:var(--phosphor)"/>',
              '<text x="64" y="198" style="fill:var(--phosphor)">eixo principal → justify-content</text>',
              '<path d="M30 214h26" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45" stroke-dasharray="4 4"/>',
              '<text x="64" y="218" fill="currentColor" opacity=".6">eixo cruzado → align-items</text>',
              '</g>',
              '<defs>',
              '<marker id="ep" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">',
              '<path d="M0 0l8 4-8 4z" style="fill:var(--phosphor)"/></marker>',
              '<marker id="ec" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">',
              '<path d="M0 0l8 4-8 4z" fill="currentColor" opacity=".45"/></marker>',
              '</defs>',
              '</svg>',
            ].join(''),
            caption: 'Trocar `row` por `column` não move só os itens: **troca de lugar** as duas propriedades de alinhamento. É por isso que a que funcionava "parou de funcionar".',
          },
        ],
      },
      {
        id: 'alinhamento',
        video: true,
        duration: '14 min',
        title: 'Alinhar e distribuir',
        body: [
          'Centralizar nos dois sentidos, que já foi um quebra-cabeça, hoje são três linhas. Em vez de mostrar as três soltas, vale ler uma barra de navegação inteira — que é onde essas propriedades realmente aparecem — com a explicação de cada trecho ao lado dele:',
          {
            example: {
              language: 'css',
              file: 'barra.css',
              parts: [
                {
                  code: '.barra {\n  display: flex;',
                  note: 'A partir daqui os filhos diretos de `.barra` são itens flex. Nada acontece com os netos — flex vale um nível só.',
                },
                {
                  code: '  align-items: center;',
                  note: 'Alinha no eixo **cruzado**. Com `flex-direction: row` (o padrão), o cruzado é a vertical: é isto que deixa a logo e os links na mesma altura mesmo tendo tamanhos diferentes.',
                },
                {
                  code: '  gap: 24px;',
                  note: 'O espaço entre os itens. `gap` não sobra na ponta, não colapsa, e dispensa o `:last-child { margin: 0 }` que todo CSS antigo carrega.',
                },
                {
                  code: '  padding: 0 32px;\n}',
                  note: 'Espaço interno da barra. Repare que ele NÃO é `gap`: um é a moldura, o outro é a distância entre os itens.',
                },
                {
                  code: '.barra .menu {\n  margin-left: auto;\n}',
                  note: 'O truque mais útil do flexbox. `margin: auto` come todo o espaço livre daquele lado, então este item — e tudo depois dele — é empurrado para a direita. Faz o que `justify-content: space-between` faria, mas para UM item, e sem mexer no resto.',
                },
                {
                  code: '.barra .titulo {\n  min-width: 0;\n}',
                  note: 'A linha mais misteriosa e mais útil. Um item flex não encolhe abaixo do próprio conteúdo por padrão, e um título longo estoura a barra em vez de reticenciar. `min-width: 0` devolve a permissão de encolher.',
                },
              ],
              output: '┌──────────────────────────────────────────────┐\n│ ◐ codeschool.ing   Trilhas          Entrar   │\n└──────────────────────────────────────────────┘\n  └ logo e título              └ empurrados pelo margin-left:auto',
            },
          },
          'No eixo principal, os valores que se usam são `flex-start`, `center`, `flex-end`, `space-between` (extremos colados nas pontas, espaço igual entre os itens) e `space-evenly` (espaço igual em toda parte, inclusive nas bordas).',
        ],
        materials: ['hc-flex-mapa'],
      },
      {
        id: 'crescer',
        title: 'Crescer, encolher e a base',
        body: [
          'A propriedade `flex` é um atalho para três coisas: quanto o item pode crescer, quanto pode encolher e de que tamanho ele parte.',
          { code: 'css', text: '.lado    { flex: 0 0 240px; }  /* não cresce, não encolhe: 240px fixos */\n.miolo   { flex: 1 1 auto; }   /* ocupa o que sobrar */\n.igual   { flex: 1; }          /* atalho de 1 1 0: todos com a mesma largura */' },
          'A diferença entre `flex: 1` e `flex: 1 1 auto` derruba muita gente: com base `0`, os itens ficam todos do mesmo tamanho; com base `auto`, o conteúdo de cada um influencia, e um item com texto longo fica maior que os outros.',
          'E um item flex **não encolhe abaixo do conteúdo** por padrão, o que faz texto longo estourar o contêiner. A cura é `min-width: 0` no item — a linha mais misteriosa e mais útil do flexbox.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 09 */
    'CSS Grid: rows, columns, areas and the implicit grid': [
      {
        id: 'linhas-colunas',
        title: 'Duas dimensões de uma vez',
        body: [
          'Flexbox organiza ao longo de um eixo; Grid organiza linhas e colunas ao mesmo tempo. A unidade nova é `fr`, uma fração do espaço livre:',
          { code: 'css', text: '.pagina {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  gap: 16px;\n}' },
          'Isso é uma barra lateral fixa e um conteúdo que ocupa o resto — exatamente o esqueleto deste portal. Em flexbox daria para fazer, mas exigiria declarar o comportamento em cada filho; em grid, o pai declara a forma e os filhos não precisam saber de nada.',
        ],
      },
      {
        id: 'areas',
        video: true,
        duration: '11 min',
        title: 'Áreas nomeadas: o layout desenhado',
        body: [
          'A forma mais legível de grid é dar nome às regiões e desenhá-las:',
          { code: 'css', text: '.app {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  grid-template-areas:\n    "barra  barra"\n    "trilho conteudo"\n    "rodape rodape";\n}\n.barra    { grid-area: barra; }\n.trilho   { grid-area: trilho; }\n.conteudo { grid-area: conteudo; }\n.rodape   { grid-area: rodape; }' },
          'O CSS passa a **parecer** o layout, e reorganizar tudo no celular é reescrever as três linhas de aspas dentro de uma media query — sem tocar em nenhum filho.',
        ],
      },
      {
        id: 'implicito',
        title: 'Grid implícito e grades que se ajustam',
        body: [
          'Se você declara duas colunas e entram seis itens, o grid cria linhas novas sozinho: é o **grid implícito**, controlado por `grid-auto-rows`.',
          'A combinação mais rentável do CSS moderno faz uma grade responsiva **sem nenhuma media query**:',
          { code: 'css', text: '.cartoes {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  gap: 12px;\n}' },
          'Lê-se: quantas colunas couberem, cada uma com no mínimo 220px e dividindo o resto igualmente. A grade se reorganiza sozinha em qualquer largura.',
          '`auto-fill` mantém as colunas vazias reservadas; `auto-fit` as colapsa, fazendo os itens existentes esticarem para preencher. Com poucos itens numa tela larga, a escolha entre os dois é bem visível.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 10 */
    'CSS variables and organising stylesheets': [
      {
        id: 'variaveis',
        title: 'Custom properties',
        body: [
          'Variáveis de CSS são declaradas com dois hífens e lidas com `var()`:',
          { code: 'css', text: ':root {\n  --azul: #5b8cff;\n  --espaco: 16px;\n}\n\n.botao {\n  background: var(--azul);\n  padding: var(--espaco);\n}' },
          'A diferença para as variáveis de um pré-processador é decisiva: estas **existem no navegador**. Elas herdam, podem ser trocadas dentro de um seletor, respondem a media query e são legíveis e escrevíveis pelo JavaScript em tempo de execução. Uma variável de Sass some na compilação; esta continua lá.',
        ],
      },
      {
        id: 'tema',
        title: 'Tema claro e escuro com uma chave',
        body: [
          'Como as variáveis herdam, trocar um tema inteiro é redeclará-las num escopo acima:',
          { code: 'css', text: ':root {\n  --fundo: #0a0e14;\n  --texto: #e8e6df;\n}\n\nhtml[data-tema="claro"] {\n  --fundo: #f2f4f9;\n  --texto: #1a1f28;\n}\n\nbody { background: var(--fundo); color: var(--texto); }' },
          'O resto do CSS nunca menciona cor de tema: ele lê `var(--fundo)` e não sabe que existem dois. Trocar o tema vira acrescentar um atributo no `<html>` — uma linha de JavaScript, sem reescrever regra nenhuma. É exatamente como o portal e a vitrine fazem.',
        ],
      },
      {
        id: 'organizar',
        title: 'Organizar sem virar arqueologia',
        body: [
          'Um CSS que cresce sem ordem vira um arquivo em que ninguém ousa apagar nada. Três hábitos seguram isso:',
          [
            '**Ordem previsível no arquivo**: reset, variáveis, base, componentes, utilitários, media queries. Regra nova tem um lugar óbvio para entrar.',
            '**Especificidade baixa e plana**: classe simples, quase sem aninhar. Seletor com quatro níveis obriga o próximo a ter cinco.',
            '**Nome pelo que a coisa é, não pelo que ela parece**: `.aviso` sobrevive à decisão de deixar o aviso azul; `.texto-vermelho` não.',
          ],
          'Se um `!important` apareceu, quase sempre a causa foi um seletor específico demais lá atrás. O conserto é baixar a especificidade daquele, não subir a deste.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 11 */
    'Responsiveness: mobile first, media queries and container queries': [
      {
        id: 'mobile-first',
        title: 'Mobile first é sobre o que é padrão',
        body: [
          'Mobile first não é "começar desenhando o celular": é **escrever o CSS do celular sem media query nenhuma**, e usar as media queries só para acrescentar o que telas maiores permitem.',
          { code: 'css', text: '/* padrão: uma coluna, vale para todo mundo */\n.grade { display: grid; gap: 12px; }\n\n/* a partir de 860px, duas colunas */\n@media (min-width: 860px) {\n  .grade { grid-template-columns: 1fr 1fr; }\n}' },
          'A ordem importa mais do que parece. Escrito ao contrário — desktop primeiro, com `max-width` — o celular precisa **desfazer** regras, e desfazer custa mais linhas e mais especificidade que acrescentar. Além disso, o aparelho mais fraco passa a baixar e aplicar o CSS que não vai usar.',
        ],
      },
      {
        id: 'media',
        video: true,
        duration: '09 min',
        title: 'Media queries além da largura',
        body: [
          'Largura é a mais usada, e longe de ser a única:',
          { code: 'css', text: '@media (max-height: 560px)          { }  /* teclado virtual aberto */\n@media (prefers-color-scheme: dark) { }  /* tema do sistema */\n@media (prefers-reduced-motion: reduce) { }  /* movimento reduzido */\n@media (hover: none)                { }  /* toque, sem cursor */' },
          'A de `prefers-reduced-motion` é a que mais gente esquece e a que mais importa para quem precisa dela: há pessoas para quem animação de deslocamento causa enjoo real. Respeitá-la é desligar transições dentro dessa consulta.',
          '`hover: none` resolve o menu que "não abre no celular": efeitos pendurados em `:hover` não existem no toque.',
        ],
      },
      {
        id: 'container',
        title: 'Container queries: o componente que se mede',
        body: [
          'Media query pergunta o tamanho da **janela**. Isso quebra para componentes reutilizáveis: o mesmo cartão pode estar numa barra estreita ou ocupando a tela inteira, e a janela não distingue os dois casos.',
          'Container queries perguntam o tamanho do **contêiner**:',
          { code: 'css', text: '.lista { container-type: inline-size; }\n\n@container (min-width: 400px) {\n  .cartao { display: grid; grid-template-columns: 80px 1fr; }\n}' },
          'O cartão passa a se adaptar ao espaço que **ele** recebeu, não ao tamanho do monitor. É a resposta certa para biblioteca de componentes, e hoje tem suporte em todos os navegadores atuais.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 12 */
    'Transitions, animations and transforms': [
      {
        id: 'transicao',
        title: 'Transição: suavizar uma mudança',
        body: [
          '`transition` interpola entre dois valores quando a propriedade muda:',
          { code: 'css', text: '.botao {\n  background: var(--azul);\n  transition: background .2s ease, transform .2s ease;\n}\n.botao:hover {\n  transform: translateY(-2px);\n}' },
          'A transição é declarada no estado **normal**, não no `:hover` — assim ela vale na ida e na volta. Declarada só no `:hover`, o efeito entra suave e sai seco.',
          'Evite `transition: all`. Ele passa a animar propriedades que você nem sabia que mudaram, e é uma fonte silenciosa de travamento.',
        ],
      },
      {
        id: 'transform',
        video: true,
        duration: '10 min',
        title: 'Transformações',
        body: [
          '`transform` move, gira, escala e inclina sem tirar o elemento do fluxo: **o espaço dele continua reservado** onde sempre esteve, e nada em volta se mexe.',
          { code: 'css', text: '.selo {\n  transform: translateX(10px) rotate(-3deg) scale(1.05);\n  transform-origin: left center;\n}' },
          'A ordem das funções importa: girar e depois deslocar não dá no mesmo que deslocar e depois girar, porque cada uma opera no sistema de coordenadas deixado pela anterior.',
        ],
      },
      {
        id: 'keyframes',
        title: 'Animações, e o custo de cada propriedade',
        body: [
          'Para algo que acontece sozinho, `@keyframes` descreve o caminho:',
          { code: 'css', text: '@keyframes surgir {\n  from { opacity: 0; transform: translateY(8px); }\n  to   { opacity: 1; transform: none; }\n}\n\n.painel { animation: surgir .3s ease both; }' },
          'Repare no que está sendo animado, e é a regra mais rentável desta aula inteira: **anime `transform` e `opacity`.** Elas mexem só na composição, que a placa de vídeo faz sozinha. Animar `width`, `top` ou `margin` refaz o layout de tudo em volta a cada quadro, e é isso que trava em celular.',
          'E respeite quem pediu menos movimento:',
          { code: 'css', text: '@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}' },
        ],
      },
    ],

    /* --------------------------------------------------------------- 13 */
    'Tailwind CSS: utilities, configuration and components': [
      {
        id: 'utilitarios',
        title: 'A ideia: uma classe, uma propriedade',
        body: [
          'Tailwind inverte a organização do CSS. Em vez de nomear componentes e descrevê-los num arquivo à parte, você compõe o estilo no próprio HTML com classes de uma propriedade cada:',
          { code: 'html', text: '<button class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">\n  Enviar\n</button>' },
          'O ganho real não é digitar menos — é que **o CSS para de crescer**. Não há nome a inventar, não há arquivo a caçar, e apagar o HTML apaga o estilo junto. Some a classe órfã que ninguém tem coragem de remover.',
          'O custo é igualmente real: o HTML fica poluído, e a leitura de um trecho longo piora. É uma troca, não uma vitória.',
        ],
      },
      {
        id: 'configurar',
        title: 'Configuração é onde o design system mora',
        body: [
          'As classes saem de uma escala configurável. Personalizar a escala é o que impede o Tailwind de ser um monte de valores mágicos:',
          { code: 'css', text: '@theme {\n  --color-marca: #5b8cff;\n  --spacing-secao: 4.5rem;\n}\n/* passam a existir bg-marca, text-marca, p-secao… */' },
          'Feito isso, `bg-marca` é a cor da marca em todo lugar, e trocá-la é editar uma linha. É o mesmo papel das variáveis CSS da aula 09 — a diferença é que aqui a escala também gera as classes.',
        ],
      },
      {
        id: 'quando',
        title: 'Quando não usar',
        body: [
          'Repetir a mesma sequência de dez classes em quinze lugares é sinal de que ali havia um componente. A saída certa é o componente do framework que você já usa — um `<Botao>` em React, um parcial no template —, não uma classe nova que reagrupa utilitários.',
          'E Tailwind **não** dispensa saber CSS. Cada classe é uma propriedade: quem não entende especificidade, modelo de caixa e flexbox não entende `flex-1`, `min-w-0` nem por que a sombra sumiu. As doze aulas anteriores continuam sendo o pré-requisito.',
          'A régua honesta: Tailwind rende em produto com muitos componentes e um time que compartilha a escala. Numa página institucional de cinco telas, o CSS escrito à mão é menor, mais legível e não traz ferramenta nenhuma junto.',
        ],
      },
    ],
  },
});
