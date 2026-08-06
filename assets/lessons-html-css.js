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

   `code` still does not show up, for the same reason as `web-fundamentals` by a
   different route: the pipeline's validator executes python, javascript and sql.
   HTML and CSS are not executed against test cases — what would be verified is
   the rendering, and no interpreter judges that.

   A SECTION TITLE IS PLAIN TEXT, no backticks and no asterisks. It appears in
   three places — the screen's `h2`, the step chip and the rail line — and in the
   last two it is a label, not prose: markup there becomes noise in a 200px chip.
   The body's prose still accepts `code` and **bold**.

   The Portuguese of every title and body is in assets/lessons-pt.js.

   STATUS: sample content, technically correct and with no pedagogical review.
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {

  'html-css': {

    /* --------------------------------------------------------------- 01 */
    'Structure of an HTML document and metadata': [
      {
        id: 'skeleton',
        title: 'The skeleton of every page',
        body: [
          'Every HTML document has the same frame, and it is worth typing it out by hand a few times before letting the editor generate it:',
          { code: 'html', text: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My page</title>\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>' },
          '`<!DOCTYPE html>` is not a tag: it is a declaration telling the browser to use standards mode. Without it, the browser enters *quirks mode* and starts imitating bugs from 1990s browsers — the most famous of them changes the whole box model, and the layout falls apart with no error showing up at all.',
          'The `lang` on `<html>` is not decoration either: it is what makes the screen reader pick the right pronunciation and the spell checker pick the right dictionary.',
        ],
      },
      {
        id: 'metadata',
        video: true,
        duration: '08 min',
        title: 'Metadata that makes a difference',
        body: [
          'The `<head>` does not appear on screen and decides a great deal of what happens there.',
          [
            '`<meta charset="UTF-8">` — without it, accented characters turn into symbols. It comes first, because the browser needs to know the encoding before interpreting the rest.',
            '`<meta name="viewport" content="width=device-width, initial-scale=1">` — without it, the phone pretends to be 980px wide and draws the page in miniature. It is the line separating "responsive" from "a desktop page squeezed".',
            '`<title>` — it goes in the tab, in the bookmark and in the search result.',
            '`<meta name="description">` — the paragraph the search engine shows under the title.',
          ],
          'The *viewport* one hurts most when missing, because the page seems to work on the computer and is born broken on the phone — which is where most visitors are.',
        ],
      },
      {
        id: 'where-they-go',
        title: 'Where the CSS and the JavaScript go',
        body: [
          'The stylesheet goes in the `<head>`, and the script goes at the end of the `<body>` or with `defer`:',
          { code: 'html', text: '<head>\n  <link rel="stylesheet" href="style.css" />\n  <script src="app.js" defer></script>\n</head>' },
          'Both places come from the same reasoning, with opposite results. **CSS blocks rendering on purpose** — showing the page unstyled and restyling it afterwards would flash the whole screen — so the sooner it starts downloading, the better.',
          '**An ordinary script blocks the DOM being built**, because it may alter the tree under construction. That is why a `<script>` at the top of the `<head>` without `defer` is the classic recipe for a blank page. With `defer` it downloads in parallel and executes after the HTML is built, preserving the order between scripts.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Semantic HTML: header, nav, main, section, article and footer': [
      {
        id: 'why-not-div',
        title: 'Why a div is not enough',
        body: [
          'Visually, `<div>` and `<main>` are identical: neither has any relevant styling of its own. The difference is that one of them **means** something.',
          'Who reads that meaning: screen readers, which offer to skip straight to the main content; search engines, which tell an article from a menu; the browser\'s reading mode, which has to guess where the text starts; and the person who opens your code a year from now.',
          'The cost of using the right element is zero — it is the same number of characters. The cost of not using it shows up later, and always on whoever has the least choice.',
        ],
      },
      {
        id: 'regions',
        title: 'The region elements',
        body: [
          'Six elements cover almost any page:',
          { code: 'html', text: '<body>\n  <header>\n    <nav>… menu …</nav>\n  </header>\n\n  <main>\n    <article>\n      <h1>Title of the text</h1>\n      <section>… a block of the text …</section>\n    </article>\n  </main>\n\n  <footer>… contact, rights …</footer>\n</body>' },
          '`<main>` is the only one that should appear **once only** per page, and it is what gives the screen reader the "skip to content" shortcut. `<header>` and `<footer>` may repeat: an `<article>` can have its own.',
        ],
      },
      {
        id: 'section-article',
        title: 'section, article or div?',
        body: [
          'The most common question in semantic HTML has a short ruler.',
          [
            '**`<article>`** — it makes sense on its own, outside the page. A post, a news item, a comment, a product card. The test: could you publish this in an RSS feed?',
            '**`<section>`** — a thematic block **inside** something larger, and one that has a heading. If you cannot give it a heading, it is probably not a `section`.',
            '**`<div>`** — it means nothing, and that is fine. It is the element for grouping on purely visual grounds: a container that exists only to receive a `display: flex`.',
          ],
          '`<div>` is not a defeat. Using `<section>` where all you needed was layout is worse: it creates false semantic structure, and the screen reader announces a region that does not exist.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Forms, fields, labels and native validation': [
      {
        id: 'labels',
        title: 'A field with no label is a broken field',
        body: [
          'Every field needs a `<label>` tied to it. The tie is the `for` pointing at the `id`:',
          { code: 'html', text: '<label for="email">E-mail</label>\n<input type="email" id="email" name="email" required />' },
          'The tie does three things at once: the screen reader announces the label when the field takes focus, clicking the text focuses the field, and the touch target on a phone grows — which matters more than it looks on checkboxes.',
          'A `placeholder` does **not** replace a label. It disappears as soon as the person starts typing, and then nobody knows what that field was any more. It is a complement, not a substitute.',
        ],
      },
      {
        id: 'field-types',
        title: 'The field type changes the keyboard',
        body: [
          'On a computer, `type="email"` and `type="text"` look the same. On a phone they do not: the type picks which keyboard appears.',
          [
            '`email` — brings the `@` and the dot onto the first screen.',
            '`tel` — the big numeric keypad, the dialling one.',
            '`number` — numeric, but careful: it refuses leading zeros and formatting characters, so it does **not** work for postcodes, national IDs or card numbers.',
            '`url`, `date`, `search` — each with its own keyboard and its own native picker.',
          ],
          'For a postcode or a masked phone number, the pair that works is `type="text"` with `inputmode="numeric"`: a numeric keypad, without the restrictions of `number`.',
        ],
      },
      {
        id: 'validation',
        title: 'Native validation, and where it stops',
        body: [
          'The browser validates on its own from attributes, with no line of JavaScript:',
          { code: 'html', text: '<input type="email" required />\n<input type="text" minlength="3" maxlength="40" />\n<input type="text" pattern="[0-9]{5}-[0-9]{3}" />' },
          'And you can style the state with `:valid`, `:invalid` and — most useful of all — `:user-invalid`, which only turns red **after** the person has interacted with the field. Without it, a form is born entirely red before anyone types anything.',
          '**Validation in the browser is convenience, never security.** Anybody removes a `required` through the inspector in two seconds. The server validates everything again, always — the client-side one exists to avoid the trip to the server, not to protect it.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Tables, responsive images and media': [
      {
        id: 'tables',
        title: 'A table is for data, not for layout',
        body: [
          'A table exists for tabular data — something with rows, columns and meaning in both. A well-marked table tells the screen reader which column each cell belongs to, and the person can navigate between them:',
          { code: 'html', text: '<table>\n  <caption>Marks for the term</caption>\n  <thead>\n    <tr><th scope="col">Student</th><th scope="col">Mark</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope="row">Ana</th><td>9.0</td></tr>\n  </tbody>\n</table>' },
          '`scope` is what makes the difference: without it, the screen reader reads "9.0" without saying whose or of what. With it, it reads "Ana, Mark, 9.0".',
          'Using a table to position things on screen was normal in the 1990s and today is a mistake: it creates false data structure, and Flexbox and Grid do it better. Layout is the next half of the course.',
        ],
      },
      {
        id: 'images',
        video: true,
        duration: '10 min',
        title: 'Images that do not waste bandwidth',
        body: [
          'Serving the same 2000px image to a phone throws away the bandwidth and the battery of whoever has least of both. `srcset` lets the browser choose:',
          { code: 'html', text: '<img\n  src="photo-800.jpg"\n  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"\n  sizes="(max-width: 700px) 100vw, 700px"\n  alt="The school front seen from the pavement"\n  width="800" height="600"\n  loading="lazy" />' },
          '`width` and `height` do not fix the size when there is CSS — they state the **aspect ratio**, and that is what stops the page from jumping when the image finishes loading. `loading="lazy"` defers whatever is off screen.',
          {
            /* This is the figure's other route: a FILE, and not an inline
               drawing. In Stage 2 `image` becomes a bucket URL; here it is a
               `data:` URI so the single-file bundle stays whole. */
            image: 'data:image/svg+xml,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20640%20200%22><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221.3%22><rect%20x=%2212%22%20y=%22118%22%20width=%2270%22%20height=%2252%22%20rx=%223%22/><rect%20x=%22106%22%20y=%2284%22%20width=%22120%22%20height=%2286%22%20rx=%223%22/><rect%20x=%22250%22%20y=%2226%22%20width=%22230%22%20height=%22144%22%20rx=%223%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2211%22%20text-anchor=%22middle%22><text%20x=%2247%22%20y=%22148%22>400w</text><text%20x=%22166%22%20y=%22130%22>800w</text><text%20x=%22365%22%20y=%22102%22>1600w</text><text%20x=%2247%22%20y=%22188%22>phone</text><text%20x=%22166%22%20y=%22188%22>tablet</text><text%20x=%22365%22%20y=%22188%22>desktop</text></g><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221%22%20stroke-dasharray=%223%203%22%20opacity=%22.7%22><path%20d=%22M520%2026v144%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2210%22><text%20x=%22534%22%20y=%2290%22>the%20browser</text><text%20x=%22534%22%20y=%22106%22>picks%20one,</text><text%20x=%22534%22%20y=%22122%22>not%20all%20three</text></g></svg>',
            alt: 'Three rectangles of different sizes labelled 400w, 800w and 1600w, under the labels phone, tablet and desktop',
            caption: '`srcset` offers all three; the one who chooses is the browser, which knows the screen width and its density — things the server does not know.',
          },
          '`alt` describes the image for whoever cannot see it. A purely decorative image takes `alt=""` — empty, not absent: that way the screen reader ignores it instead of announcing the file name.',
        ],
      },
      {
        id: 'media',
        title: 'Video and audio',
        body: [
          'The native elements need no library for the common case:',
          { code: 'html', text: '<video controls preload="metadata" poster="cover.jpg" width="640">\n  <source src="lesson.webm" type="video/webm" />\n  <source src="lesson.mp4" type="video/mp4" />\n  <track kind="captions" src="lesson.vtt" srclang="en" label="English" default />\n</video>' },
          'Several `<source>` elements let the browser take the format it can play. `preload="metadata"` downloads only enough to know the duration — `auto` would download the whole video for someone who may never watch it.',
          'The caption track is not optional in practice: it serves whoever cannot hear, whoever is somewhere noisy and whoever would rather read. And unlike the rest, it cannot be added later without producing the content again.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 05 */
    'Selectors, cascade, inheritance and specificity': [
      {
        id: 'selectors',
        title: 'The vocabulary of selectors',
        body: [
          'A selector is the question "which elements?". The forms that solve almost everything:',
          { code: 'css', text: '.card            { }   /* class */\n#top             { }   /* id */\nnav a            { }   /* descendant: every `a` inside nav */\nnav > a          { }   /* direct child */\nli + li          { }   /* immediately following sibling */\na[href^="http"]  { }   /* attribute starting with */\nli:nth-child(2n) { }   /* pseudo-class */' },
          'In practice, **a class solves 90% of cases**, and it is what you should prefer. An id is unique per page and, as the next section shows, carries a weight in specificity that gets in the way more than it helps.',
        ],
      },
      {
        id: 'specificity',
        video: true,
        duration: '12 min',
        title: 'Specificity: the sum that decides who wins',
        body: [
          'When two rules reach the same element and declare the same property, the more specific one wins. Specificity is a trio of numbers — **(ids, classes, elements)** — compared from left to right:',
          { code: 'css', text: 'p                 /* (0,0,1) */\n.warning          /* (0,1,0)  beats p */\nnav a.active      /* (0,1,2) */\n#top              /* (1,0,0)  beats everything above */' },
          'The first number crushes the others: **one id beats any number of classes**. That is why styling by id ends up forcing the next person to use `!important` — and once `!important` gets into a file, it spreads.',
          'A specificity tie is broken by order: the last rule written wins.',
        ],
      },
      {
        id: 'cascade',
        title: 'Cascade and inheritance are different things',
        body: [
          '**Cascade** is how the browser chooses between rules competing for the same element: origin, `!important`, specificity and, finally, order.',
          '**Inheritance** is something else: some properties pass from parent to child without anyone asking. `color`, `font-family` and `line-height` inherit; `border`, `padding` and `background` do not.',
          'The distinction matters because it explains a common mistake: setting `font-family` on the `body` works for the whole page (inheritance), but setting `border` on the `body` draws no border on any child. And there is the hybrid case of `<button>`, which does **not** inherit the font by default — hence the `font: inherit` line that shows up in almost every serious stylesheet.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 06 */
    'Box model, box-sizing and units (px, rem, em, %, vw/vh)': [
      {
        id: 'box',
        title: 'Everything is a box',
        body: [
          'Every element is a rectangle with four layers, from the inside out: **content**, **padding**, **border** and **margin**.',
          'Padding is inner space — it pushes the content away from the border and takes the background colour. Margin is outer space — it separates this box from its neighbours and is transparent.',
          'One detail confuses everybody once: **adjacent vertical margins merge**. Two paragraphs with 20px of margin below and above do not end up 40px apart; they end up 20 apart. That is *margin collapsing*, it only applies vertically, and it is the reason many people use flex/grid `gap` instead of margin.',
        ],
      },
      {
        id: 'box-sizing',
        video: true,
        duration: '07 min',
        title: 'box-sizing, and the first line of every stylesheet',
        body: [
          'By default, `width` measures only the content. So a box declared at 200px plus padding and border occupies **more** than 200px:',
          { code: 'css', text: '.box {\n  width: 200px;\n  padding: 20px;\n  border: 2px solid;\n}\n/* real width: 200 + 20+20 + 2+2 = 244px */' },
          'That turns any layout into mental arithmetic. The fix is one line, and it opens practically every modern stylesheet:',
          { code: 'css', text: '*, *::before, *::after {\n  box-sizing: border-box;\n}' },
          'With `border-box`, `width: 200px` means 200px on screen, with the padding and border **inside**. It is the behaviour everybody expected from the start.',
        ],
      },
      {
        id: 'units',
        title: 'Which unit for what',
        body: [
          'Each unit answers a different question, and choosing the wrong one is the source of half the accessibility problems in typography.',
          [
            '**`px`** — absolute. Good for borders and shadows, where the value really is physical.',
            '**`rem`** — a multiple of the root font size. It is the default for typography and spacing, because it **respects whoever enlarged the font in the browser**. Text sized in `px` ignores that preference.',
            '**`em`** — a multiple of the element\'s own font size. Useful for spacing that should follow the text, but careful: it compounds in nested elements.',
            '**`%`** — relative to the container. Width.',
            '**`vw` / `vh`** — relative to the window. Good for full screens; on a phone, prefer `svh`/`dvh`, which cope with the browser bar appearing and disappearing.',
          ],
          'The practical rule that settles almost everything: **`rem` for text and space, `%` or `fr` for width, `px` only for fine detail.**',
        ],
      },
    ],

    /* --------------------------------------------------------------- 07 */
    'Positioning: static, relative, absolute, fixed and sticky': [
      {
        id: 'flow',
        title: 'The normal flow, and leaving it a little',
        body: [
          'By default every element is `position: static`: it stays where the flow put it, and `top`/`left` do nothing.',
          '`position: relative` keeps the element in the flow — **its space stays reserved** — and shifts only the drawing. That is why it is almost never used to move things: it is used to become the **anchor** of an `absolute` child, which is the next section\'s subject.',
        ],
      },
      {
        id: 'absolute',
        title: 'absolute and the positioning context',
        body: [
          '`position: absolute` takes the element out of the flow: its space stops existing and the neighbours close up as if it were not there. It positions itself relative to the **nearest positioned ancestor** — any one that is not `static`.',
          { code: 'css', text: '.card       { position: relative; }\n.card .badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n}' },
          'It is the most used pattern in all of CSS: the parent becomes `relative` purely to serve as a reference, and the child hangs off its corner. **Forgetting the `relative` on the parent** is the classic defect — the badge climbs to the corner of the page, because with no positioned ancestor the reference becomes the window.',
        ],
      },
      {
        id: 'fixed-sticky',
        title: 'fixed and sticky',
        body: [
          '`fixed` pins the element to the window: it does not move when the page scrolls. It is what holds this portal\'s top bar in place.',
          '`sticky` is the hybrid: the element scrolls normally until it reaches the declared limit, and sticks there.',
          { code: 'css', text: '.table-header {\n  position: sticky;\n  top: 0;\n}' },
          'Two gotchas with `sticky` explain almost every "it does not work" case: it **requires** a declared offset (`top`, `bottom`…), without which it does nothing; and it sticks inside its **parent**, not the window — if the parent has `overflow: hidden` or ends soon, the effect ends with it.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 08 */
    'Flexbox: axes, alignment and distribution': [
      {
        id: 'axes',
        title: 'Everything depends on the main axis',
        video: true,
        duration: '14 min',
        body: [
          'Flexbox arranges the children along **one** axis. `flex-direction` picks which:',
          { code: 'css', text: '.bar {\n  display: flex;\n  flex-direction: row;   /* default: main axis horizontal */\n}' },
          'Understanding that settles the confusion that slows learners down most: `justify-content` acts on the **main axis** and `align-items` on the **cross** one. Since the default is `row`, `justify-content` looks "horizontal" and `align-items` looks "vertical" — until somebody writes `flex-direction: column`, and the two swap meaning.',
          'The right question is never "how do I centre horizontally?", it is "what is my main axis?".',
          {
            svg: [
              '<svg viewBox="0 0 760 226" role="img" aria-label="With flex-direction row the main axis is horizontal and the cross axis vertical; with column the two swap places">',
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
              '<text x="64" y="198" style="fill:var(--phosphor)">main axis → justify-content</text>',
              '<path d="M30 214h26" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45" stroke-dasharray="4 4"/>',
              '<text x="64" y="218" fill="currentColor" opacity=".6">cross axis → align-items</text>',
              '</g>',
              '<defs>',
              '<marker id="ep" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5.5" markerHeight="5.5" orient="auto">',
              '<path d="M0 0l8 4-8 4z" style="fill:var(--phosphor)"/></marker>',
              '<marker id="ec" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">',
              '<path d="M0 0l8 4-8 4z" fill="currentColor" opacity=".45"/></marker>',
              '</defs>',
              '</svg>',
            ].join(''),
            caption: 'Swapping `row` for `column` does not just move the items: it **swaps** the two alignment properties around. That is why the one that used to work "stopped working".',
          },
        ],
      },
      {
        id: 'alignment',
        video: true,
        duration: '14 min',
        title: 'Aligning and distributing',
        body: [
          'Centring in both directions, once a puzzle, is three lines today. Rather than showing the three on their own, it is worth reading a whole navigation bar — which is where these properties really turn up — with the explanation of each piece beside it:',
          {
            example: {
              language: 'css',
              file: 'bar.css',
              parts: [
                {
                  code: '.bar {\n  display: flex;',
                  note: 'From here on the direct children of `.bar` are flex items. Nothing happens to the grandchildren — flex applies one level only.',
                },
                {
                  code: '  align-items: center;',
                  note: 'Aligns on the **cross** axis. With `flex-direction: row` (the default), the cross axis is the vertical one: this is what puts the logo and the links at the same height even though they are different sizes.',
                },
                {
                  code: '  gap: 24px;',
                  note: 'The space between the items. `gap` leaves nothing over at the ends, does not collapse, and does away with the `:last-child { margin: 0 }` every old stylesheet carries.',
                },
                {
                  code: '  padding: 0 32px;\n}',
                  note: 'The bar\'s inner space. Note that it is NOT `gap`: one is the frame, the other is the distance between the items.',
                },
                {
                  code: '.bar .menu {\n  margin-left: auto;\n}',
                  note: 'The most useful trick in flexbox. `margin: auto` eats all the free space on that side, so this item — and everything after it — is pushed to the right. It does what `justify-content: space-between` would do, but for ONE item, and without touching the rest.',
                },
                {
                  code: '.bar .title {\n  min-width: 0;\n}',
                  note: 'The most mysterious and most useful line. A flex item does not shrink below its own content by default, and a long title bursts the bar instead of getting an ellipsis. `min-width: 0` gives the permission to shrink back.',
                },
              ],
              output: '┌──────────────────────────────────────────────┐\n│ ◐ codeschool.ing   Tracks           Sign in  │\n└──────────────────────────────────────────────┘\n  └ logo and title             └ pushed by margin-left:auto',
            },
          },
          'On the main axis, the values you use are `flex-start`, `center`, `flex-end`, `space-between` (the ends flush against the edges, equal space between the items) and `space-evenly` (equal space everywhere, edges included).',
        ],
        materials: ['hc-flex-map'],
      },
      {
        id: 'grow-shrink',
        title: 'Growing, shrinking and the basis',
        body: [
          'The `flex` property is a shorthand for three things: how much the item may grow, how much it may shrink, and what size it starts from.',
          { code: 'css', text: '.side   { flex: 0 0 240px; }  /* does not grow, does not shrink: a fixed 240px */\n.middle { flex: 1 1 auto; }   /* takes whatever is left */\n.equal  { flex: 1; }          /* shorthand for 1 1 0: all the same width */' },
          'The difference between `flex: 1` and `flex: 1 1 auto` trips a lot of people up: with a basis of `0`, the items all end up the same size; with a basis of `auto`, each one\'s content matters, and an item with a long text ends up larger than the others.',
          'And a flex item **does not shrink below its content** by default, which makes a long text burst the container. The cure is `min-width: 0` on the item — the most mysterious and most useful line in flexbox.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 09 */
    'CSS Grid: rows, columns, areas and the implicit grid': [
      {
        id: 'rows-columns',
        title: 'Two dimensions at once',
        body: [
          'Flexbox arranges along one axis; Grid arranges rows and columns at the same time. The new unit is `fr`, a fraction of the free space:',
          { code: 'css', text: '.page {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  gap: 16px;\n}' },
          'That is a fixed sidebar and a content area taking the rest — exactly this portal\'s skeleton. It could be done in flexbox, but it would require declaring the behaviour on each child; in grid, the parent declares the shape and the children need to know nothing.',
        ],
      },
      {
        id: 'areas',
        video: true,
        duration: '11 min',
        title: 'Named areas: the layout drawn out',
        body: [
          'The most readable form of grid is to name the regions and draw them:',
          { code: 'css', text: '.app {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  grid-template-areas:\n    "bar    bar"\n    "rail   content"\n    "footer footer";\n}\n.bar     { grid-area: bar; }\n.rail    { grid-area: rail; }\n.content { grid-area: content; }\n.footer  { grid-area: footer; }' },
          'The CSS starts to **look like** the layout, and rearranging everything for a phone means rewriting the three quoted lines inside a media query — without touching a single child.',
        ],
      },
      {
        id: 'implicit',
        title: 'The implicit grid and grids that adjust themselves',
        body: [
          'If you declare two columns and six items arrive, the grid creates new rows on its own: that is the **implicit grid**, controlled by `grid-auto-rows`.',
          'The most profitable combination in modern CSS makes a responsive grid **with no media query at all**:',
          { code: 'css', text: '.cards {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  gap: 12px;\n}' },
          'It reads: as many columns as fit, each at least 220px and sharing the rest equally. The grid rearranges itself at any width.',
          '`auto-fill` keeps the empty columns reserved; `auto-fit` collapses them, making the existing items stretch to fill. With few items on a wide screen, the choice between the two is very visible.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 10 */
    'CSS variables and organising stylesheets': [
      {
        id: 'variables',
        title: 'Custom properties',
        body: [
          'CSS variables are declared with two hyphens and read with `var()`:',
          { code: 'css', text: ':root {\n  --blue: #5b8cff;\n  --space: 16px;\n}\n\n.button {\n  background: var(--blue);\n  padding: var(--space);\n}' },
          'The difference from a preprocessor\'s variables is decisive: these **exist in the browser**. They inherit, they can be swapped inside a selector, they respond to a media query and they are readable and writable from JavaScript at run time. A Sass variable disappears at compile time; this one is still there.',
        ],
      },
      {
        id: 'theme',
        title: 'Light and dark themes with one switch',
        body: [
          'Because variables inherit, swapping a whole theme is redeclaring them in a scope above:',
          { code: 'css', text: ':root {\n  --background: #0a0e14;\n  --text: #e8e6df;\n}\n\nhtml[data-theme="light"] {\n  --background: #f2f4f9;\n  --text: #1a1f28;\n}\n\nbody { background: var(--background); color: var(--text); }' },
          'The rest of the stylesheet never mentions a theme colour: it reads `var(--background)` and does not know two exist. Swapping the theme becomes adding an attribute on `<html>` — one line of JavaScript, without rewriting a single rule. It is exactly how the portal and the vitrine do it.',
        ],
      },
      {
        id: 'organising',
        title: 'Organising without turning it into archaeology',
        body: [
          'A stylesheet that grows without order becomes a file nobody dares delete anything from. Three habits hold that back:',
          [
            '**A predictable order in the file**: reset, variables, base, components, utilities, media queries. A new rule has an obvious place to go.',
            '**Low, flat specificity**: a simple class, with almost no nesting. A four-level selector forces the next one to have five.',
            '**Name it for what the thing is, not for what it looks like**: `.warning` survives the decision to make the warning blue; `.red-text` does not.',
          ],
          'If an `!important` has shown up, the cause was almost always an over-specific selector further back. The fix is to lower that one\'s specificity, not to raise this one\'s.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 11 */
    'Responsiveness: mobile first, media queries and container queries': [
      {
        id: 'mobile-first',
        title: 'Mobile first is about what the default is',
        body: [
          'Mobile first is not "start by designing the phone": it is **writing the phone\'s CSS with no media query at all**, and using media queries only to add what larger screens allow.',
          { code: 'css', text: '/* default: one column, applies to everyone */\n.grid { display: grid; gap: 12px; }\n\n/* from 860px up, two columns */\n@media (min-width: 860px) {\n  .grid { grid-template-columns: 1fr 1fr; }\n}' },
          'The order matters more than it looks. Written the other way round — desktop first, with `max-width` — the phone has to **undo** rules, and undoing costs more lines and more specificity than adding. On top of that, the weakest device ends up downloading and applying the CSS it will not use.',
        ],
      },
      {
        id: 'media',
        video: true,
        duration: '09 min',
        title: 'Media queries beyond width',
        body: [
          'Width is the most used, and far from the only one:',
          { code: 'css', text: '@media (max-height: 560px)          { }  /* on-screen keyboard open */\n@media (prefers-color-scheme: dark) { }  /* system theme */\n@media (prefers-reduced-motion: reduce) { }  /* reduced motion */\n@media (hover: none)                { }  /* touch, no cursor */' },
          'The `prefers-reduced-motion` one is the most forgotten and the one that matters most to whoever needs it: there are people for whom a sliding animation causes real nausea. Respecting it means switching transitions off inside that query.',
          '`hover: none` solves the menu that "does not open on the phone": effects hung off `:hover` do not exist on touch.',
        ],
      },
      {
        id: 'container',
        title: 'Container queries: the component that measures itself',
        body: [
          'A media query asks the size of the **window**. That breaks down for reusable components: the same card may be in a narrow bar or filling the whole screen, and the window cannot tell the two cases apart.',
          'Container queries ask the size of the **container**:',
          { code: 'css', text: '.list { container-type: inline-size; }\n\n@container (min-width: 400px) {\n  .card { display: grid; grid-template-columns: 80px 1fr; }\n}' },
          'The card starts adapting to the space **it** was given, not to the size of the monitor. It is the right answer for a component library, and today it is supported in every current browser.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 12 */
    'Transitions, animations and transforms': [
      {
        id: 'transition',
        title: 'Transition: smoothing a change',
        body: [
          '`transition` interpolates between two values when the property changes:',
          { code: 'css', text: '.button {\n  background: var(--blue);\n  transition: background .2s ease, transform .2s ease;\n}\n.button:hover {\n  transform: translateY(-2px);\n}' },
          'The transition is declared on the **normal** state, not on the `:hover` — that way it applies on the way in and on the way out. Declared only on the `:hover`, the effect eases in and snaps out.',
          'Avoid `transition: all`. It starts animating properties you did not know had changed, and it is a silent source of jank.',
        ],
      },
      {
        id: 'transform',
        video: true,
        duration: '10 min',
        title: 'Transforms',
        body: [
          '`transform` moves, rotates, scales and skews without taking the element out of the flow: **its space stays reserved** where it always was, and nothing around it moves.',
          { code: 'css', text: '.badge {\n  transform: translateX(10px) rotate(-3deg) scale(1.05);\n  transform-origin: left center;\n}' },
          'The order of the functions matters: rotating and then translating is not the same as translating and then rotating, because each one operates in the coordinate system the previous one left behind.',
        ],
      },
      {
        id: 'keyframes',
        title: 'Animations, and what each property costs',
        body: [
          'For something that happens on its own, `@keyframes` describes the path:',
          { code: 'css', text: '@keyframes appear {\n  from { opacity: 0; transform: translateY(8px); }\n  to   { opacity: 1; transform: none; }\n}\n\n.panel { animation: appear .3s ease both; }' },
          'Note what is being animated, and it is the most profitable rule in this whole lesson: **animate `transform` and `opacity`.** They touch only composition, which the graphics card does on its own. Animating `width`, `top` or `margin` redoes the layout of everything around it on every frame, and that is what stutters on a phone.',
          'And respect whoever asked for less motion:',
          { code: 'css', text: '@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}' },
        ],
      },
    ],

    /* --------------------------------------------------------------- 13 */
    'Tailwind CSS: utilities, configuration and components': [
      {
        id: 'utilities',
        title: 'The idea: one class, one property',
        body: [
          'Tailwind inverts how CSS is organised. Instead of naming components and describing them in a separate file, you compose the style in the HTML itself with classes of one property each:',
          { code: 'html', text: '<button class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">\n  Send\n</button>' },
          'The real gain is not typing less — it is that **the CSS stops growing**. There is no name to invent, no file to hunt down, and deleting the HTML deletes the style with it. The orphan class nobody dares remove disappears.',
          'The cost is equally real: the HTML gets cluttered, and reading a long stretch of it gets harder. It is a trade, not a victory.',
        ],
      },
      {
        id: 'configuration',
        title: 'Configuration is where the design system lives',
        body: [
          'The classes come out of a configurable scale. Customising the scale is what stops Tailwind from being a pile of magic values:',
          { code: 'css', text: '@theme {\n  --color-brand: #5b8cff;\n  --spacing-section: 4.5rem;\n}\n/* bg-brand, text-brand, p-section… now exist */' },
          'Once that is done, `bg-brand` is the brand colour everywhere, and changing it means editing one line. It is the same role the CSS variables of lesson 09 play — the difference is that here the scale also generates the classes.',
        ],
      },
      {
        id: 'when-not',
        title: 'When not to use it',
        body: [
          'Repeating the same sequence of ten classes in fifteen places is a sign there was a component there. The right way out is the component of whatever framework you already use — a `<Button>` in React, a partial in the template — not a new class regrouping utilities.',
          'And Tailwind does **not** excuse you from knowing CSS. Every class is a property: whoever does not understand specificity, the box model and flexbox does not understand `flex-1`, `min-w-0` or why the shadow disappeared. The twelve previous lessons are still the prerequisite.',
          'The honest ruler: Tailwind pays off in a product with many components and a team sharing the scale. On a five-screen company site, hand-written CSS is smaller, more readable and brings no tooling along with it.',
        ],
      },
    ],
  },
});
