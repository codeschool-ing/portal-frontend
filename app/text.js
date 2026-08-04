/* ==========================================================================
   Text — escaping and the bare minimum of markup.

   Exercise content uses backticks for code all the time (`pip list`, `9 // 2`,
   `sqrt(x**2)`), and code snippets contain `<`, `>` and `&`. So escaping is not
   security fussiness: without it an exercise about comparison in SQL simply
   disappears from the screen.
   ========================================================================== */

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* `backticks` become <code>, **bold** becomes <strong>. Nothing else — this is
   not Markdown, it is the subset the content actually uses. It escapes BEFORE
   marking up, or the markup would be escaped along with everything else and
   come out literal on screen. */
export function formatted(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/* The prose of a lesson section. Six block forms, and nothing beyond them:

     'text'                        → paragraph, with `code` and **bold**
     ['a', 'b']                    → list
     { codigo: 'css', texto: … }   → code block
     { imagem: url, legenda, alt } → figure
     { svg: '<svg…>', legenda }    → diagram drawn right here
     { exemplo: { … } }            → annotated code, Go By Example style

   The code block arrived when the first PRACTICAL course was written. In
   `web-fundamentos`, which is conceptual, a backtick mid-sentence was enough;
   in `html-css` there is no way to teach a selector without showing it over
   three lines with the indentation intact. The content asked for it, the
   architecture did not foresee it — and that is why the shape is still only
   what the content uses.

   It reuses `.cod-bloco`, the same component the exercises use: code looks the
   same wherever it shows up in the portal.

   Deliberately not Markdown. The real content will come from a database in
   Etapa 2, and inventing a dialect now would only create a migration.

   The block keys stay in Portuguese because they are content-file fields, and
   the content files are written by the school. */
export function prose(body) {
  if (!body || !body.length) return '';
  return body.map((block) => {
    if (Array.isArray(block)) {
      return '<ul class="prosa-lista">' + block.map((i) => '<li>' + formatted(i) + '</li>').join('') + '</ul>';
    }
    if (block && typeof block === 'object') {
      if (block.exemplo) return annotatedExample(block.exemplo);
      if (block.imagem || block.svg) return figure(block);
      if (block.texto !== undefined) {
        // `esc` and not `formatted`: inside a code block a backtick is a
        // backtick and an asterisk is an asterisk — marking them up would eat
        // the code itself
        return '<div class="cod-bloco prosa-cod">' +
          (block.codigo ? '<div class="cod-barra"><span class="cod-ling">' + esc(block.codigo) + '</span></div>' : '') +
          '<pre class="cod"><code>' + esc(block.texto) + '</code></pre>' +
        '</div>';
      }
    }
    return '<p>' + formatted(block) + '</p>';
  }).join('');
}

/* ---------- figure ----------

   TWO FORMS, and the difference is not style: it is where the pixel comes from.

   `imagem` is a file — a screenshot, a photo, an exported diagram. It is what
   the real content will use, served from a CDN.

   `svg` is a drawing WRITTEN HERE, which enters the document and therefore
   inherits the theme's colours. A diagram exported as a PNG is born with a
   background, and that background is wrong on half the visits — the portal has
   a light and a dark theme, and students switch. A concept diagram, which is
   lines and labels, is better inline.

   The `svg` is NOT escaped: it is our own markup, written in the content file,
   like the track graph. If content ever comes from outside, this is the field
   that needs sanitising — and this comment exists so the question does not slip
   by on the day that happens. */
function figure(b) {
  const body = b.svg
    ? '<div class="fig-svg">' + b.svg + '</div>'
    : '<img src="' + esc(b.imagem) + '" alt="' + esc(b.alt || b.legenda || '') + '" loading="lazy">';
  return '<figure class="fig">' + body +
    (b.legenda ? '<figcaption>' + formatted(b.legenda) + '</figcaption>' : '') +
  '</figure>';
}

/* ---------- code as an example, Go By Example style ----------

   THE SHAPE IS gobyexample.com's, and it is simpler than the first attempt
   here: the explanation on one side, the program on the other, each note at the
   HEIGHT of the snippet it comments on.

   What changed from the earlier version, and why:

   1. THE NOTE GOES ON THE LEFT, the code on the right. You read the
      explanation and then look sideways — which is the order in which a person
      learns. With the code first, they read something they do not yet know
      what it is.
   2. THERE IS NO LINE BETWEEN SNIPPETS. The lines turned the program into a
      table of pieces, which is exactly what this block exists to avoid: the
      program is ONE file, and the right column has to look like a file.
      Continuity is the whole argument.

   The highlighting comes from further down this file, in three colours — red
   for the structure of the language, blue for literals, white for the rest.

     { exemplo: {
         linguagem: 'css',
         arquivo: 'barra.css',                    // optional
         partes: [ { codigo: '…', nota: 'why this' }, … ],
         saida: '…'                               // optional
     } }

   On a narrow screen the two columns become one, with the note BEFORE the
   snippet: reading the explanation and then the code is the order that works
   without the sideways alignment tying the two together. */
function annotatedExample(ex) {
  const parts = ex.partes || [];
  return '<div class="exemplo">' +
    (ex.arquivo || ex.linguagem
      ? '<div class="exemplo-barra">' +
          '<span class="exemplo-arq mono dim">' + esc(ex.arquivo || ex.linguagem) + '</span>' +
        '</div>'
      : '') +
    '<div class="exemplo-grade">' +
      parts.map((p) => (
        '<p class="exemplo-nota">' + (p.nota ? formatted(p.nota) : '') + '</p>' +
        '<pre class="exemplo-cod"><code>' + highlight(p.codigo, ex.linguagem) + '</code></pre>'
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

/* Seeded shuffling: the presentation order cannot change on every render (the
   student would lose whatever they had already dragged), nor be the JSON order,
   which in the `ordering` and `matching` types IS the answer key. */
export function shuffleWith(seed, list) {
  let s = 0;
  for (let i = 0; i < String(seed).length; i += 1) s = (s * 31 + String(seed).charCodeAt(i)) & 0x7fffffff;
  const next = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ---------- syntax highlighting ----------

   IT LIVES HERE, AND NOT IN A MODULE OF ITS OWN, for a mechanical reason: it
   needs `esc`, and `esc` lives here. Splitting them would create an import
   cycle — which `bundle.py` refuses, and rightly so. It is also coherent: this
   file is the one that turns content into HTML, and highlighting is that.

   THREE COLOURS, AND THEY ARE THE BRAND'S: red (`--amber`) for what is the
   structure of the language, blue (`--phosphor`) for what is a literal value,
   and the text white for everything else. Comments stay in the dim grey. There
   is no fourth colour, and that is a decision: an editor palette with ten
   shades inside a course page competes with the content instead of helping
   anyone read it.

   THIS IS NOT A PARSER. It is a regular-expression sweep with the alternatives
   in order of precedence — comment before string, string before everything —
   so that nothing is highlighted INSIDE a literal. It gets wrong the cases a
   parser would get right (a division slash that looks like a regex, say), and
   it gets them wrong by returning text with no colour, never the wrong text.

   ESCAPING HAPPENS HERE, EXACTLY ONCE. Callers get finished HTML and must not
   escape it again — that would escape the `<span>`. Every piece that leaves
   here went through `esc()`: either the matched snippet, or the text between
   two matches. */

const JS_KEYWORDS = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new',
  'class', 'extends', 'super', 'this', 'typeof', 'instanceof', 'in', 'of', 'delete', 'void',
  'import', 'export', 'from', 'default', 'async', 'await', 'yield', 'static', 'get', 'set',
  'null', 'undefined', 'true', 'false', 'NaN'];

/* Each language is a list of [class, expression]. The order is the precedence:
   the first one to match at a position wins. The class names are short because
   they reach the DOM as `t-com`, `t-txt`, `t-num`… */
const RULES = {
  javascript: [
    ['com', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['txt', /`(?:\\[\s\S]|[^`\\])*`|"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/],
    ['num', /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?\b/i],
    ['pal', new RegExp('\\b(?:' + JS_KEYWORDS.join('|') + ')\\b')],
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
RULES.js = RULES.javascript;

/* One single expression, with the alternatives in groups named after the class.
   Matching once per position is what guarantees the precedence — and it is what
   stops the word `const` inside a string from becoming a keyword. */
const compile = (rules) => new RegExp(
  rules.map(([cls, re]) => '(?<' + cls + '>' + re.source + ')').join('|'),
  'gi',
);

const COMPILED = Object.fromEntries(
  Object.entries(RULES).map(([lang, rules]) => [lang, compile(rules)]),
);

function highlight(code, language) {
  const re = COMPILED[String(language || '').toLowerCase()];
  const raw = String(code ?? '');
  if (!re) return esc(raw);           // a language we do not know comes out colourless

  let out = '';
  let last = 0;
  re.lastIndex = 0;
  let m = re.exec(raw);
  while (m) {
    const cls = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
    out += esc(raw.slice(last, m.index)) + '<span class="t-' + cls + '">' + esc(m[0]) + '</span>';
    last = m.index + m[0].length;
    // an empty match would lock the loop; no rule should produce one, but a
    // future change might, and the cost of guarding is this line
    if (m[0].length === 0) re.lastIndex += 1;
    m = re.exec(raw);
  }
  return out + esc(raw.slice(last));
}
