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

   A forma do gobyexample.com: o programa inteiro descendo pela esquerda, e a
   explicação de cada trecho ao LADO dele, não antes nem depois. Ler é seguir
   uma coluna; entender é olhar para o lado.

   Por que ela vale um bloco próprio em vez de alternar código e parágrafo: o
   parágrafo entre dois trechos QUEBRA o programa. Quem lê perde o fio de que
   aquilo é um arquivo só, e não consegue copiar o conjunto. Aqui o código
   continua contínuo na coluna da esquerda e mesmo assim cada pedaço tem a sua
   nota — que é exatamente o problema que o Go By Example resolveu.

     { exemplo: {
         linguagem: 'css',
         partes: [ { codigo: '…', nota: 'por que isto' }, … ],
         saida: '…'                              // opcional
     } }

   Em tela estreita as duas colunas viram uma, com a nota ANTES do trecho: ler
   a explicação e então o código é a ordem que funciona sem o alinhamento
   lateral. */
function exemploAnotado(ex) {
  const partes = ex.partes || [];
  return '<div class="exemplo">' +
    '<div class="exemplo-barra">' +
      '<span class="cod-ling">' + esc(ex.linguagem || 'código') + '</span>' +
      (ex.arquivo ? '<span class="exemplo-arq mono dim">' + esc(ex.arquivo) + '</span>' : '') +
    '</div>' +
    partes.map((p) => '<div class="exemplo-par' + (p.nota ? '' : ' sem-nota') + '">' +
      '<pre class="exemplo-cod"><code>' + esc(p.codigo) + '</code></pre>' +
      (p.nota ? '<p class="exemplo-nota">' + marcado(p.nota) + '</p>' : '') +
    '</div>').join('') +
    (ex.saida
      ? '<div class="exemplo-saida">' +
          '<span class="exemplo-saida-rot mono dim">' + txt('saída') + '</span>' +
          '<pre class="cod"><code>' + esc(ex.saida) + '</code></pre>' +
        '</div>'
      : '') +
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
