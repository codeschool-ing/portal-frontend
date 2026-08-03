/* ==========================================================================
   Texto — escape e o mínimo de marcação.

   O conteúdo dos exercícios usa crase para código o tempo todo (`pip list`,
   `9 // 2`, `sqrt(x**2)`), e trechos de código contêm `<`, `>` e `&`. Então
   escapar não é preciosismo de segurança: sem isso um exercício sobre
   comparação em SQL some da tela.
   ========================================================================== */

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* `crase` vira <code>, **negrito** vira <strong>. Nada mais — não é Markdown,
   é o subconjunto que o conteúdo realmente usa. Escapa ANTES de marcar, senão
   a marcação escaparia junto e sairia literal na tela. */
export function marcado(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/* Prosa de uma seção de aula. Seis formas de bloco, e nada além:

     'texto'                       → parágrafo, com `código` e **negrito**
     ['a', 'b']                    → lista
     { codigo: 'css', texto: … }   → bloco de código
     { imagem: url, legenda, alt } → figura
     { svg: '<svg…>', legenda }    → diagrama desenhado aqui dentro
     { exemplo: { … } }            → código anotado, no estilo Go By Example

   O bloco de código entrou quando o primeiro curso PRÁTICO foi escrito. Em
   `web-fundamentos`, que é conceitual, crase no meio da frase bastava; em
   `html-css` não há como ensinar um seletor sem mostrá-lo em três linhas com a
   indentação preservada. Foi o conteúdo que pediu, não a arquitetura que
   previu — e por isso a forma continua sendo só o que o conteúdo usa.

   Ele reaproveita `.cod-bloco`, o mesmo componente dos exercícios: código tem
   a mesma aparência onde quer que apareça no portal.

   Deliberadamente não é Markdown. O conteúdo real virá de um banco na Etapa 2,
   e inventar um dialeto agora só criaria uma migração. */
export function prosa(corpo) {
  if (!corpo || !corpo.length) return '';
  return corpo.map((bloco) => {
    if (Array.isArray(bloco)) {
      return '<ul class="prosa-lista">' + bloco.map((i) => '<li>' + marcado(i) + '</li>').join('') + '</ul>';
    }
    if (bloco && typeof bloco === 'object') {
      if (bloco.exemplo) return exemploAnotado(bloco.exemplo);
      if (bloco.imagem || bloco.svg) return figura(bloco);
      if (bloco.texto !== undefined) {
        // `esc` e não `marcado`: dentro de um bloco de código, crase é crase e
        // asterisco é asterisco — marcá-los comeria o próprio código
        return '<div class="cod-bloco prosa-cod">' +
          (bloco.codigo ? '<div class="cod-barra"><span class="cod-ling">' + esc(bloco.codigo) + '</span></div>' : '') +
          '<pre class="cod"><code>' + esc(bloco.texto) + '</code></pre>' +
        '</div>';
      }
    }
    return '<p>' + marcado(bloco) + '</p>';
  }).join('');
}

/* ---------- figura ----------

   DUAS FORMAS, e a diferença não é estilo: é de onde vem o pixel.

   `imagem` é um arquivo — captura de tela, foto, diagrama exportado. É o que o
   conteúdo real vai usar, servido de um CDN.

   `svg` é um desenho ESCRITO AQUI, que entra no documento e portanto herda as
   cores do tema. Um diagrama exportado como PNG nasce com um fundo, e esse
   fundo está errado em metade das visitas — o portal tem tema claro e escuro, e
   o aluno alterna. Diagrama de conceito, que é linha e rótulo, é melhor inline.

   O `svg` NÃO é escapado: é marcação nossa, escrita no arquivo de conteúdo,
   como o grafo da trilha. Se um dia o conteúdo vier de fora, este é o campo que
   precisa de sanitização — e o comentário existe para que a pergunta não passe
   despercebida no dia em que isso acontecer. */
function figura(b) {
  const corpo = b.svg
    ? '<div class="fig-svg">' + b.svg + '</div>'
    : '<img src="' + esc(b.imagem) + '" alt="' + esc(b.alt || b.legenda || '') + '" loading="lazy">';
  return '<figure class="fig">' + corpo +
    (b.legenda ? '<figcaption>' + marcado(b.legenda) + '</figcaption>' : '') +
  '</figure>';
}

/* ---------- código como exemplo, no estilo Go By Example ----------

   A FORMA É A DO gobyexample.com, e ela é mais simples do que a primeira
   tentativa daqui: de um lado a explicação, do outro o programa, cada nota na
   ALTURA do trecho que ela comenta.

   O que mudou em relação à versão anterior, e por que:

   1. A NOTA FICA À ESQUERDA, o código à direita. Lê-se a explicação e então
      se olha para o lado — que é a ordem em que a pessoa aprende. Com o código
      primeiro, ela lê algo que ainda não sabe o que é.
   2. NÃO HÁ LINHA ENTRE OS TRECHOS. Elas transformavam o programa numa tabela
      de pedaços, que é exatamente o que este bloco existe para evitar: o
      programa é UM arquivo, e a coluna da direita tem de parecer um arquivo.
      Continuidade é o argumento inteiro.

   O realce vem de `realce.js`, em três cores — vermelho para a estrutura da
   linguagem, azul para os literais, branco para o resto.

     { exemplo: {
         linguagem: 'css',
         arquivo: 'barra.css',                    // opcional
         partes: [ { codigo: '…', nota: 'por que isto' }, … ],
         saida: '…'                               // opcional
     } }

   Em tela estreita as duas colunas viram uma, com a nota ANTES do trecho: ler
   a explicação e então o código é a ordem que funciona sem o alinhamento
   lateral para amarrar os dois. */
function exemploAnotado(ex) {
  const partes = ex.partes || [];
  return '<div class="exemplo">' +
    (ex.arquivo || ex.linguagem
      ? '<div class="exemplo-barra">' +
          '<span class="exemplo-arq mono dim">' + esc(ex.arquivo || ex.linguagem) + '</span>' +
        '</div>'
      : '') +
    '<div class="exemplo-grade">' +
      partes.map((p) => (
        '<p class="exemplo-nota">' + (p.nota ? marcado(p.nota) : '') + '</p>' +
        '<pre class="exemplo-cod"><code>' + realcar(p.codigo, ex.linguagem) + '</code></pre>'
      )).join('') +
      (ex.saida
        ? '<span class="exemplo-vazio" aria-hidden="true"></span>' +
          '<div class="exemplo-saida">' +
            '<span class="exemplo-saida-rot mono dim">' + txt('saída') + '</span>' +
            '<pre class="cod"><code>' + esc(ex.saida) + '</code></pre>' +
          '</div>'
        : '') +
    '</div>' +
  '</div>';
}

/* Embaralhamento com semente: a ordem de apresentação não pode mudar a cada
   render (o aluno perderia o que já arrastou), nem ser a ordem do JSON, que
   nos tipos `ordenacao` e `associacao` É o gabarito. */
export function embaralharCom(semente, lista) {
  let s = 0;
  for (let i = 0; i < String(semente).length; i += 1) s = (s * 31 + String(semente).charCodeAt(i)) & 0x7fffffff;
  const proximo = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(proximo() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ---------- realce de sintaxe ----------

   MORA AQUI, E NÃO NUM MÓDULO PRÓPRIO, por uma razão mecânica: ele precisa de
   `esc`, e `esc` mora aqui. Separá-los criaria um ciclo de imports — que o
   `bundle.py` recusa, e com razão. Também é coerente: este arquivo é o que
   transforma conteúdo em HTML, e realçar é isso.

   TRÊS CORES, E SÃO AS DA MARCA: vermelho (`--amber`) para o que é estrutura
   da linguagem, azul (`--phosphor`) para o que é valor literal, e o branco do
   texto para o resto. Comentário fica no cinza apagado. Não há uma quarta cor,
   e isso é decisão: paleta de editor com dez tons dentro de uma página de
   curso compete com o conteúdo em vez de ajudar a lê-lo.

   ISTO NÃO É UM PARSER. É uma varredura por expressão regular, com as
   alternativas em ordem de precedência — comentário antes de string, string
   antes de tudo — para que nada seja realçado DENTRO de um literal. Ela erra
   nos casos que um parser acertaria (uma barra de divisão parecida com regex,
   por exemplo), e erra devolvendo texto sem cor, nunca texto errado.

   O ESCAPE ACONTECE AQUI, UMA VEZ SÓ. Quem chama recebe HTML pronto e não
   pode escapar de novo — seria escapar o `<span>`. Todo pedaço que sai daqui
   passou por `esc()`: ou o trecho casado, ou o texto entre dois casamentos. */

const PALAVRAS_JS = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new',
  'class', 'extends', 'super', 'this', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
  'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set',
  'null', 'undefined', 'true', 'false', 'NaN'];

/* Cada linguagem é uma lista de [classe, expressão]. A ordem é a precedência:
   a primeira que casar naquela posição vence. */
const REGRAS = {
  javascript: [
    ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['txt', /`(?:\\[\s\S]|[^`\\])*`|"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/],
    ['num', /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b/i],
    ['pal', new RegExp('\\b(?:' + PALAVRAS_JS.join('|') + ')\\b')],
    ['fun', /\b[A-Za-z_$][\w$]*(?=\s*\()/],
  ],
  css: [
    ['com', /\/\*[\s\S]*?\*\//],
    ['txt', /"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/],
    ['pal', /@[\w-]+|![\w-]+/],
    ['num', /#[0-9a-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|ch|%|vw|vh|fr|s|ms|deg)?\b/i],
    ['fun', /[.#][\w-]+|&?::?[\w-]+(?=[\s,{:])/],
    ['pro', /[-a-z]+(?=\s*:)/],
  ],
  html: [
    ['com', /<!--[\s\S]*?-->/],
    ['txt', /"(?:[^"\n])*"|'(?:[^'\n])*'/],
    ['pal', /<\/?[\w-]+|\/?>/],
    ['pro', /\b[\w-]+(?==)/],
  ],
};
REGRAS.js = REGRAS.javascript;

/* Uma expressão só, com as alternativas em grupos nomeados pela classe. Casar
   uma vez por posição é o que garante a precedência — e é o que impede que a
   palavra `const` dentro de uma string vire palavra-chave. */
const compilar = (regras) => new RegExp(
  regras.map(([cls, re]) => '(?<' + cls + '>' + re.source + ')').join('|'),
  'gi',
);

const COMPILADAS = Object.fromEntries(
  Object.entries(REGRAS).map(([ling, regras]) => [ling, compilar(regras)]),
);

function realcar(codigo, linguagem) {
  const re = COMPILADAS[String(linguagem || '').toLowerCase()];
  const cru = String(codigo ?? '');
  if (!re) return esc(cru);           // linguagem que não conhecemos sai sem cor

  let fora = '';
  let ultimo = 0;
  re.lastIndex = 0;
  let m = re.exec(cru);
  while (m) {
    const cls = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
    fora += esc(cru.slice(ultimo, m.index)) + '<span class="t-' + cls + '">' + esc(m[0]) + '</span>';
    ultimo = m.index + m[0].length;
    // casamento vazio travaria o laço; nenhuma regra devia produzir um, mas
    // uma alteração futura pode, e o custo de se proteger é esta linha
    if (m[0].length === 0) re.lastIndex += 1;
    m = re.exec(cru);
  }
  return fora + esc(cru.slice(ultimo));
}
