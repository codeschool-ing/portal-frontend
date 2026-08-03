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
