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

/* Prosa de uma seção de aula. Três formas de bloco, e nada além:

     'texto'                     → parágrafo, com `código` e **negrito**
     ['a', 'b']                  → lista
     { codigo: 'css', texto: … } → bloco de código

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
    if (bloco && typeof bloco === 'object' && bloco.texto !== undefined) {
      // `esc` e não `marcado`: dentro de um bloco de código, crase é crase e
      // asterisco é asterisco — marcá-los comeria o próprio código
      return '<div class="cod-bloco prosa-cod">' +
        (bloco.codigo ? '<div class="cod-barra"><span class="cod-ling">' + esc(bloco.codigo) + '</span></div>' : '') +
        '<pre class="cod"><code>' + esc(bloco.texto) + '</code></pre>' +
      '</div>';
    }
    return '<p>' + marcado(bloco) + '</p>';
  }).join('');
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
