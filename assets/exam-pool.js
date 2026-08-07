/* ==========================================================================
   THE EXAM POOL — and the first thing to know about this file is that
   index.html DOES NOT LOAD IT.

   That is not an omission and it is not an optimisation. It is the whole
   mechanism.

   Every other exercise file is loaded by the page, answer key and all, because
   lesson practice grades on the client and immediate feedback is worth it. Which
   means an exam drawn from those exercises was answerable before it was drawn:
   `window.SAMPLE_EXERCISES.find(e => e.id === …).choices.find(c => c.correct)`,
   no request, no devtools, view-source is enough. Measured on a real paper: nine
   questions drawn, nine of them sitting in the browser, eight with a usable key.

   Closing the server's practice route while a paper is open — which
   portal-backend now does — stops the lookup DURING an exam and cannot stop the
   one before it. Nothing can, while the same exercise is both. So they are not
   both.

   These questions reach the mirror through `tools/snapshot/snapshot.js`, which
   reads this file off disk and stamps `_pool: "exam"` on every row. From there:

     `ExercisesForPractice` filters pool = 'practice'   — never returns these
     `PublicByLesson`       filters pool = 'practice'   — never lists these
     `ExamPoolByLesson`     filters pool = 'exam'       — the draw, public half only

   There is no route out of that server carrying one of these answer keys, and
   no `<script>` here carrying one either.

   ---------------------------------------------------------------------------

   WHAT GOES IN HERE. Questions that decide whether somebody gets a certificate.
   They are not harder than the practice ones on purpose — an exam is not a
   different subject — but they must be DIFFERENT questions, because a student
   who has drilled the practice set has legitimately learned the material and
   should not be examined on the drill itself.

   The `topic` is the join key: it must match a topic of the course exactly, the
   same as in the practice files, or ingestion cannot hang the row off a lesson.

   NO `_pool` FIELD HERE. Which pool an exercise is in is a property of WHICH
   FILE it is in, and the snapshot tool sets it. A field would be one typo away
   from putting a question whose key already shipped onto a paper, and
   `tools/snapshot/snapshot.js` refuses `_pool` in the page-loaded files for that
   reason.

   STATUS: PLACEHOLDER CONTENT. These are real questions about the real topics,
   written to give the mechanism something to draw and to show the shape. They
   have had no pedagogical review and are marked `structure`. Replace them.
   ========================================================================== */

window.EXAM_POOL = (window.EXAM_POOL || []).concat([

  /* ======================================================== javascript ==== */

  {
    id: 'x-js-coercion-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'quiz',
    difficulty: 'medium',
    prompt: '`[] == false` is `true` and `if ([])` runs the block. Both, at the same time. What explains it?',
    socraticHint: 'One of those two is a comparison and the other is a truthiness test. Are they the same operation?',
    choices: [
      {
        text: '`==` converts both sides to numbers — `[]` becomes `0` and `false` becomes `0` — while `if` asks whether the value is truthy, and every object is truthy.',
        correct: true,
        why: 'Two different operations on the same value. `==` coerces; `if` consults the falsy list, which contains no object.',
      },
      {
        text: '`[]` is falsy, and `if ([])` running is a known engine bug kept for compatibility.',
        correct: false,
        why: '`[]` is not falsy. The falsy list is closed: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.',
      },
      {
        text: '`==` compares references and an empty array shares a reference with `false`.',
        correct: false,
        why: 'Nothing shares a reference with a primitive, and `==` between an object and a boolean does not compare references at all.',
      },
      {
        text: '`if` converts to string first, and the empty string is falsy.',
        correct: false,
        why: '`if` converts to boolean, not to string — and `String([])` being `""` is a separate fact that does not apply here.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-falsy-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Which of these are falsy? Tick every one.',
    socraticHint: 'The list is closed and short. Anything not on it is truthy, however empty it looks.',
    choices: [
      { text: '`NaN`', correct: true, why: 'On the list, despite `typeof NaN` being `"number"`.' },
      { text: '`0n`', correct: true, why: 'The BigInt zero is on the list, like the Number zero.' },
      { text: '`document.all`', correct: false, why: 'It is falsy in browsers, and it is the one deliberate exception in the spec — not something to build on, and not what this asks about.' },
      { text: '`" "` (a single space)', correct: false, why: 'One character is one character. Only the EMPTY string is falsy.' },
      { text: '`{}`', correct: false, why: 'An object, therefore truthy, however empty.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-tdz-1',
    course: 'javascript',
    topic: 'ES6+ syntax: let/const, arrow functions and template strings',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Reading a `let` before its declaration throws `ReferenceError`; reading a `var` gives `undefined`. What is the difference?',
    socraticHint: 'Both are hoisted. Ask what each is hoisted AS.',
    choices: [
      {
        text: '`let` is hoisted but left uninitialised — the temporal dead zone — and reading an uninitialised binding throws. `var` is hoisted already initialised to `undefined`.',
        correct: true,
        why: 'Both bindings exist from the top of the scope. Only one of them has a value there.',
      },
      {
        text: '`let` is not hoisted at all, so the name does not exist until the line runs.',
        correct: false,
        why: 'If it did not exist, the lookup would reach an outer scope instead of throwing. It throws precisely because the inner binding is already there.',
      },
      {
        text: '`let` is block scoped and `var` is function scoped, and that is what produces the error.',
        correct: false,
        why: 'True and unrelated: the scoping difference explains WHERE the name is visible, not what reading it early does.',
      },
      {
        text: '`let` throws only in strict mode.',
        correct: false,
        why: 'The temporal dead zone is not a strict-mode behaviour; it applies everywhere `let` and `const` do.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-arrow-1',
    course: 'javascript',
    topic: 'ES6+ syntax: let/const, arrow functions and template strings',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each expression with what it evaluates to.',
    socraticHint: 'One of these returns nothing, and the reason is punctuation rather than logic.',
    pairs: [
      { left: '`(() => ({ a: 1 }))()`', right: 'the object `{ a: 1 }`' },
      { left: '`(() => { a: 1 })()`', right: '`undefined`' },
      { left: '`[1, 2, 3].map(n => n * 2)`', right: '`[2, 4, 6]`' },
      { left: '`` `${1 + 1}` ``', right: 'the string `"2"`' },
    ],
    rightDistractors: ['a `SyntaxError`', 'the number `2`'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-spread-1',
    course: 'javascript',
    topic: 'Objects, arrays, spread and destructuring',
    type: 'expected-output',
    difficulty: 'medium',
    language: 'javascript',
    prompt: 'What does this print, line by line?',
    socraticHint: 'A spread copies one level. Ask what the second level still points at.',
    givenCode: 'const a = { x: 1, deep: { y: 2 } };\nconst b = { ...a };\nb.x = 99;\nb.deep.y = 99;\nconsole.log(a.x);\nconsole.log(a.deep.y);\n',
    answer: '1\n99\n',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-destructuring-1',
    course: 'javascript',
    topic: 'Objects, arrays, spread and destructuring',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'In `const { a = 5 } = { a: null }`, what is `a`?',
    socraticHint: 'A default fires for exactly one absent value, and `null` is not it.',
    choices: [
      { text: '`null` — a default fires only for `undefined`.', correct: true, why: 'Destructuring defaults test against `undefined` and nothing else. `null` is a value, so it is kept.' },
      { text: '`5` — the default fires for any empty value.', correct: false, why: '"Empty" is not a thing the language tests for here; only `undefined` triggers a default.' },
      { text: '`undefined` — the default cancels the property.', correct: false, why: 'A default can only add a value, never remove one.' },
      { text: 'A `TypeError`.', correct: false, why: 'Destructuring `null` from the right-hand side would throw; a property whose value is `null` does not.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-order-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the steps of `"5" - 2` in the order the engine performs them.',
    socraticHint: '`-` has only one meaning, unlike `+`. That decides what it does with a string.',
    items: [
      'Sees `-`, which is defined for numbers alone',
      'Converts `"5"` to the number 5, with ToNumber',
      'Subtracts 2 from 5',
      'Returns 3',
    ],
    trap: 'Anyone who learned this through `+` expects a string concatenation to be considered and rejected. It never is: `+` is overloaded and `-` is not, so there is no branch to take.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-strict-1',
    course: 'javascript',
    topic: 'Types, coercion, strict equality and falsy values',
    type: 'quiz',
    difficulty: 'easy',
    prompt: '`NaN === NaN` is `false`. How do you test whether a value is `NaN`?',
    socraticHint: 'One of these answers is a function that first converts its argument.',
    choices: [
      { text: '`Number.isNaN(v)`', correct: true, why: 'It tests the value as it is: `true` only for the actual `NaN`.' },
      { text: '`isNaN(v)`', correct: false, why: 'The global one coerces first, so `isNaN("abc")` is `true` — it answers "is not a number", which is a different question.' },
      { text: '`v === NaN`', correct: false, why: 'That is the comparison the question says does not work.' },
      { text: '`typeof v === "NaN"`', correct: false, why: '`typeof NaN` is `"number"`.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-const-1',
    course: 'javascript',
    topic: 'ES6+ syntax: let/const, arrow functions and template strings',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Given `const list = [1, 2]`, which of these throw? Tick every one.',
    socraticHint: '`const` freezes one thing, and it is not the contents.',
    choices: [
      { text: '`list = [3]`', correct: true, why: 'Reassigning the binding is exactly what `const` forbids.' },
      { text: '`list = list`', correct: true, why: 'Still an assignment to the binding, whatever the right-hand side is.' },
      { text: '`list.push(3)`', correct: false, why: 'The contents are not frozen. `Object.freeze` would be needed for that.' },
      { text: '`list[0] = 3`', correct: false, why: 'Same reason: the binding is fixed, the object it points at is not.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-js-rest-1',
    course: 'javascript',
    topic: 'Objects, arrays, spread and destructuring',
    type: 'expected-output',
    difficulty: 'hard',
    language: 'javascript',
    prompt: 'What does this print?',
    socraticHint: 'A later key wins. Which of the two is later here?',
    givenCode: 'const base = { a: 1, b: 2 };\nconsole.log(JSON.stringify({ ...base, a: 9 }));\nconsole.log(JSON.stringify({ a: 9, ...base }));\n',
    answer: '{"a":9,"b":2}\n{"a":1,"b":2}\n',
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* =========================================================== html-css ==== */

  {
    id: 'x-hc-specificity-1',
    course: 'html-css',
    topic: 'Selectors, cascade, inheritance and specificity',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Order these selectors from least to most specific.',
    socraticHint: 'The trio is compared position by position, and the first difference settles it.',
    items: [
      '`p`',
      '`.note`',
      '`.note.featured`',
      '`#panel`',
    ],
    trap: 'Counting classes as if they added up to an id. Three classes is (0,3,0) and one id is (1,0,0); the first number is compared first and the rest are never consulted.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-inherit-1',
    course: 'html-css',
    topic: 'Selectors, cascade, inheritance and specificity',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'A `<span>` inside a styled `<div>` shows the div\'s `color` but not its `border`. Why?',
    socraticHint: 'Which of the two would be sensible to pass down to every descendant?',
    choices: [
      { text: '`color` is an inherited property and `border` is not; inheritance is per-property and decided by the specification.', correct: true, why: 'Typography inherits, box decoration does not — otherwise every descendant would draw its own copy of the border.' },
      { text: 'Borders need an explicit width, and the span has none.', correct: false, why: 'The div\'s border has a width; the question is why it is not passed down at all.' },
      { text: 'A span is inline, and inline elements cannot have borders.', correct: false, why: 'They can. An inline border renders, it just does not affect line height.' },
      { text: 'The span has higher specificity than the div.', correct: false, why: 'Specificity compares rules reaching the SAME element. Nothing here targets the span.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-boxsizing-1',
    course: 'html-css',
    topic: 'Box model, box-sizing and units (px, rem, em, %, vw/vh)',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'A box has `width: 200px; padding: 20px; border: 5px solid`. With `box-sizing: border-box`, how wide does it render, and what does the content get?',
    socraticHint: 'The property renames what `width` measures. Ask which parts it now includes.',
    choices: [
      { text: '200px wide; the content gets 150px, because the padding and border are taken from the inside.', correct: true, why: '`border-box` makes `width` the OUTER measurement, so everything else eats into it: 200 − 40 − 10 = 150.' },
      { text: '250px wide; the content gets 200px.', correct: false, why: 'That is `content-box`, the default — where `width` measures the content and the rest is added on.' },
      { text: '200px wide; the content gets 200px and the padding overflows.', correct: false, why: 'Padding does not overflow a box; it is part of it.' },
      { text: '160px wide; the border is subtracted twice.', correct: false, why: 'The 5px is one border on each side, subtracted once as a total of 10.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-units-1',
    course: 'html-css',
    topic: 'Box model, box-sizing and units (px, rem, em, %, vw/vh)',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each unit with what it is relative to.',
    socraticHint: 'Two of these are font-relative and differ in WHOSE font.',
    pairs: [
      { left: '`rem`', right: 'the root element\'s font size' },
      { left: '`em`', right: 'the element\'s own font size' },
      { left: '`vh`', right: '1% of the viewport height' },
      { left: '`%` on `width`', right: 'the containing block\'s width' },
    ],
    rightDistractors: ['the parent element\'s width', '1% of the document height'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-flex-1',
    course: 'html-css',
    topic: 'Flexbox: axes, alignment and distribution',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'With `flex-direction: column`, which property centres the children horizontally?',
    socraticHint: 'The two alignment properties are named after the axes, not after the screen.',
    choices: [
      { text: '`align-items`, because with a column direction the horizontal axis is the CROSS axis.', correct: true, why: 'The direction swaps which axis is which; the property names follow the axis, not left-and-right.' },
      { text: '`justify-content`, which always handles the horizontal.', correct: false, why: 'It handles the MAIN axis, which in a column is vertical.' },
      { text: '`text-align: center` on the container.', correct: false, why: 'That centres inline content inside each child, not the children in the container.' },
      { text: '`margin: 0 auto` on the container.', correct: false, why: 'That centres the container in ITS parent, and says nothing about the children.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-flexgrow-1',
    course: 'html-css',
    topic: 'Flexbox: axes, alignment and distribution',
    type: 'multiple-choice',
    difficulty: 'hard',
    prompt: 'Three items in a row, each `flex: 1`. Which statements are true? Tick every one.',
    socraticHint: '`flex: 1` is shorthand for three properties. One of them is not what people assume.',
    choices: [
      { text: 'They share the FREE space equally, not the total width.', correct: true, why: '`flex-grow` distributes what is left over after the bases are laid out.' },
      { text: '`flex: 1` sets `flex-basis: 0`, which is why they usually end up equal anyway.', correct: true, why: 'With a basis of zero there is no leftover-versus-content distinction: all the width is free space.' },
      { text: 'They will be equal even if one has much more text, with no other properties set.', correct: true, why: 'Because of the zero basis. This stops being true with `flex: auto`, whose basis is the content.' },
      { text: '`flex: 1` prevents them from shrinking below their content.', correct: false, why: 'Shrinking is `flex-shrink`, which `flex: 1` sets to 1. What resists shrinking is `min-width`, whose `auto` value is the usual culprit.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-mobilefirst-1',
    course: 'html-css',
    topic: 'Responsiveness: mobile first, media queries and container queries',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Mobile first means writing the base styles for the small screen and adding `min-width` queries. What does that buy over the reverse?',
    socraticHint: 'Think about what a device that understands no media queries at all would render.',
    choices: [
      { text: 'The base stylesheet is the simplest layout, so anything that fails to apply a query still gets something usable.', correct: true, why: 'The fallback is the narrow layout, which works at any width. The reverse leaves a desktop layout on a phone.' },
      { text: 'Media queries with `min-width` are faster to evaluate than `max-width`.', correct: false, why: 'There is no evaluation-cost difference; the argument is about what the base layer is.' },
      { text: 'It is the only order in which media queries cascade correctly.', correct: false, why: 'Both orders cascade correctly. What differs is which layout is the default.' },
      { text: 'It avoids needing `box-sizing: border-box`.', correct: false, why: 'Unrelated: `border-box` is worth setting either way.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-container-1',
    course: 'html-css',
    topic: 'Responsiveness: mobile first, media queries and container queries',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'A card component must be narrow in a sidebar and wide in the main column, on the same page at the same viewport width. Media query or container query?',
    socraticHint: 'Ask what each one measures.',
    choices: [
      { text: 'Container query: it responds to the size of its own container, which is what differs here — the viewport is identical for both cards.', correct: true, why: 'A media query cannot tell the two cards apart, because there is nothing about the viewport that distinguishes them.' },
      { text: 'Media query, with a breakpoint per placement.', correct: false, why: 'A breakpoint fires for the whole page. Both cards would get the same branch.' },
      { text: 'Either; they measure the same thing with different syntax.', correct: false, why: 'One measures the viewport and the other the containing element. That is the whole distinction.' },
      { text: 'Neither: this needs JavaScript.', correct: false, why: 'It did, before container queries. It does not now.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-cascade-1',
    course: 'html-css',
    topic: 'Selectors, cascade, inheritance and specificity',
    type: 'ordering',
    difficulty: 'hard',
    prompt: 'Order the cascade\'s tests, from the one applied first to the one applied last.',
    socraticHint: 'Specificity is famous, and it is not the first thing consulted.',
    items: [
      'Origin and importance (author, user, user-agent; `!important` flips the order)',
      'Specificity of the selector',
      'Order of appearance — the later rule wins',
    ],
    trap: 'Reaching for specificity first. It is only consulted between declarations of the same origin and importance, which is why an `!important` user style beats any author selector however specific.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-hc-margin-1',
    course: 'html-css',
    topic: 'Box model, box-sizing and units (px, rem, em, %, vw/vh)',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'Two stacked block elements have `margin-bottom: 20px` and `margin-top: 30px`. How much space is between them?',
    socraticHint: 'Vertical margins between blocks do something horizontal ones never do.',
    choices: [
      { text: '30px — adjacent vertical margins collapse to the larger of the two.', correct: true, why: 'Margin collapsing takes the maximum, not the sum. It applies to vertical margins in normal flow.' },
      { text: '50px — margins add up.', correct: false, why: 'They add up horizontally, and inside a flex or grid container. Between blocks in normal flow they collapse.' },
      { text: '20px — the first element\'s margin wins because it comes first.', correct: false, why: 'Order does not decide it; size does.' },
      { text: '0 — one of them is discarded.', correct: false, why: 'Collapsing merges them into one margin; it does not discard both.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* =================================================== web-fundamentals ==== */

  {
    id: 'x-wf-status-1',
    course: 'web-fundamentals',
    topic: 'HTTP and HTTPS: methods, headers and status codes',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each status code with what it tells the client.',
    socraticHint: 'One of these says "you asked correctly and I will not do it", and another says "I do not know who you are".',
    pairs: [
      { left: '`301`', right: 'moved permanently — update your link' },
      { left: '`401`', right: 'not authenticated — say who you are' },
      { left: '`403`', right: 'authenticated and still not allowed' },
      { left: '`503`', right: 'the server is temporarily unable to handle it' },
    ],
    rightDistractors: ['the request itself was malformed', 'moved for now — keep using this link'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-idempotent-1',
    course: 'web-fundamentals',
    topic: 'HTTP and HTTPS: methods, headers and status codes',
    type: 'multiple-choice',
    difficulty: 'hard',
    prompt: 'Which methods are idempotent — repeating the request leaves the server in the same state? Tick every one.',
    socraticHint: 'Idempotent is not the same as safe. One of these changes things and is still idempotent.',
    choices: [
      { text: '`GET`', correct: true, why: 'Safe and therefore idempotent: it changes nothing at all.' },
      { text: '`PUT`', correct: true, why: 'It sets a resource to a given state. Doing it twice leaves the same state.' },
      { text: '`DELETE`', correct: true, why: 'The second delete finds nothing to delete; the end state is the same.' },
      { text: '`POST`', correct: false, why: 'The classic counter-example: two posts usually create two things, which is why double-submit is a real problem.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-dns-1',
    course: 'web-fundamentals',
    topic: 'Domains: registration, DNS, propagation and subdomains',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Order the steps of resolving `www.example.com` from a cold cache.',
    socraticHint: 'The hierarchy is read right to left, and each step hands over a pointer rather than an answer.',
    items: [
      'The resolver asks a root server, which points at the `.com` servers',
      'It asks a `.com` server, which points at example.com\'s nameservers',
      'It asks example.com\'s nameserver, which answers with the address',
      'The answer is cached for its TTL and returned to the browser',
    ],
    trap: 'Expecting the root server to know the address. It never does — every step above the last returns a referral, not a record.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-ttl-1',
    course: 'web-fundamentals',
    topic: 'Domains: registration, DNS, propagation and subdomains',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'You are moving a site to a new host next week. What should you do to the DNS record\'s TTL, and when?',
    socraticHint: 'The TTL in force during the switch is the one that was published BEFORE it.',
    choices: [
      { text: 'Lower it well before the move, so the old value has already expired everywhere by the time you switch.', correct: true, why: 'Resolvers hold the value they last fetched. Lowering it at the moment of the switch changes nothing for anyone still holding the old one.' },
      { text: 'Lower it at the moment of the switch — that is when the short TTL is needed.', correct: false, why: 'Too late: caches are already holding the old record for the old, long TTL.' },
      { text: 'Raise it before the move, so fewer clients ask during the change.', correct: false, why: 'That makes the stale answer last longer, which is the opposite of what you want.' },
      { text: 'Nothing; propagation is controlled by the registrar.', correct: false, why: 'The registrar delegates; the TTL on your record is what governs caching.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-latency-1',
    course: 'web-fundamentals',
    topic: 'Bandwidth, latency and throughput',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'A page of many small files loads slowly on a connection with plenty of bandwidth. Which number explains it?',
    socraticHint: 'One of these is measured in time and does not improve by widening the pipe.',
    choices: [
      { text: 'Latency: each file costs at least one round trip, and round trips do not get shorter with more bandwidth.', correct: true, why: 'Many small files is a latency-bound workload. Bandwidth helps a big file; it does not help waiting.' },
      { text: 'Bandwidth: the files are competing for it.', correct: false, why: 'The premise says there is plenty of it.' },
      { text: 'Throughput, which is a third quantity unrelated to the other two.', correct: false, why: 'Throughput is what you actually achieve — the symptom here, not the cause.' },
      { text: 'Packet loss, which is the only thing that slows a fast link.', correct: false, why: 'Loss hurts, but a lossless high-latency link shows exactly this symptom.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-cookie-1',
    course: 'web-fundamentals',
    topic: 'Cookies, sessions and browser cache',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'What does `SameSite=Lax` on a session cookie actually prevent?',
    socraticHint: 'It distinguishes requests by how they were STARTED, not by where they go.',
    choices: [
      { text: 'The cookie being sent on cross-site requests the user did not navigate with — a form post or an image load from another site.', correct: true, why: 'Top-level navigations still carry it, which is why following a link into the site keeps you signed in. That combination is what makes it a CSRF defence with usable ergonomics.' },
      { text: 'The cookie being read by JavaScript on the page.', correct: false, why: 'That is `HttpOnly`.' },
      { text: 'The cookie travelling over plain HTTP.', correct: false, why: 'That is `Secure`.' },
      { text: 'Any request from a different origin, including a link the user clicked.', correct: false, why: 'That is `SameSite=Strict`, and it is why a link from an email logs you out on arrival.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-render-1',
    course: 'web-fundamentals',
    topic: 'How the browser builds the page: DOM, CSSOM and rendering',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Order the steps from receiving the HTML to pixels on screen.',
    socraticHint: 'Two trees are built before anything is positioned.',
    items: [
      'Parse the HTML into the DOM',
      'Parse the CSS into the CSSOM',
      'Combine them into the render tree',
      'Lay out — compute the geometry of every box',
      'Paint and composite',
    ],
    trap: 'Putting layout before the CSSOM. Geometry cannot be computed without the styles, which is why a stylesheet blocks rendering while a deferred script does not.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-arp-1',
    course: 'web-fundamentals',
    topic: 'IP address, MAC address and ARP',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Your machine knows the destination\'s IP address. Why does it still need ARP?',
    socraticHint: 'The frame that leaves the network card is addressed to something else.',
    choices: [
      { text: 'To learn the MAC address for the next hop, because the link layer addresses frames by MAC and not by IP.', correct: true, why: 'IP identifies the endpoint; MAC identifies the machine on this segment. The frame needs the second.' },
      { text: 'To check that the IP address is still assigned to somebody.', correct: false, why: 'That is not what ARP is for, even though a reply implies it.' },
      { text: 'To find the shortest route to the destination network.', correct: false, why: 'That is routing, and it happens a layer up.' },
      { text: 'To translate the domain name into the IP address.', correct: false, why: 'That is DNS, and the premise says the IP is already known.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-layers-1',
    course: 'web-fundamentals',
    topic: 'Layered networks: from the cable to the browser',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each unit of data with the layer that produces it.',
    socraticHint: 'The names change as the data is wrapped on its way down.',
    pairs: [
      { left: 'frame', right: 'link' },
      { left: 'packet', right: 'network' },
      { left: 'segment', right: 'transport' },
      { left: 'request', right: 'application' },
    ],
    rightDistractors: ['physical', 'session'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-wf-clientserver-1',
    course: 'web-fundamentals',
    topic: 'Client, server and host: who asks and who answers',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'A machine runs a web server and also fetches an API from another machine. What is it?',
    socraticHint: 'The words describe a ROLE in one exchange, not a kind of computer.',
    choices: [
      { text: 'Both: server in one exchange and client in the other. The terms name a role per request, not a machine.', correct: true, why: 'This is the ordinary shape of every backend that calls another service.' },
      { text: 'A server, because that is what it is configured as.', correct: false, why: 'Configuration does not fix the role of every exchange it takes part in.' },
      { text: 'A host, which is a third category distinct from both.', correct: false, why: '"Host" names the machine on the network; it is orthogonal to which role it plays.' },
      { text: 'A proxy.', correct: false, why: 'A proxy forwards somebody else\'s request. Nothing here says it does.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ========================================================= statistics ==== */

  {
    id: 'x-st-skew-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'Salaries at a small company: nine people earn 3,000 and the founder earns 300,000. Which measure describes what a typical person earns?',
    socraticHint: 'One of these is dragged by a single value and the other is not.',
    choices: [
      { text: 'The median, 3,000 — it is a position, so one extreme value moves it by at most one place.', correct: true, why: 'The mean here is 32,700, which nobody earns. That is what a skewed distribution does to a mean.' },
      { text: 'The mean, because it uses every value and therefore describes the whole.', correct: false, why: 'It uses every value, which is exactly why one outlier drags it away from everybody.' },
      { text: 'The mode, because it is the most common salary.', correct: false, why: 'It happens to equal the median here, but the mode says nothing about the rest of the distribution and does not exist for every dataset.' },
      { text: 'Any of them; they agree on a dataset this small.', correct: false, why: 'They differ by an order of magnitude, which is the point of the example.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-st-median-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'expected-output',
    difficulty: 'medium',
    language: 'javascript',
    prompt: 'What does this print?',
    socraticHint: 'Count the values before deciding which position is the middle.',
    givenCode: 'const median = (a) => {\n  const s = [...a].sort((x, y) => x - y);\n  const m = Math.floor(s.length / 2);\n  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;\n};\nconsole.log(median([7, 1, 3]));\nconsole.log(median([7, 1, 3, 5]));\n',
    answer: '3\n4\n',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-st-mode-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Which statements about the mode are true? Tick every one.',
    socraticHint: 'Two of these are about existence and uniqueness rather than about value.',
    choices: [
      { text: 'A dataset can have more than one mode.', correct: true, why: 'Two values tied for most frequent gives a bimodal set.' },
      { text: 'It is the only one of the three that works on categories, not just numbers.', correct: true, why: 'You cannot average colours; you can count which is most frequent.' },
      { text: 'A dataset where every value appears once has no useful mode.', correct: true, why: 'Every value ties, so the mode says nothing.' },
      { text: 'The mode is always one of the values in the dataset, and so is the median.', correct: false, why: 'The mode is; the median of an even-sized set is an average of two values and need not appear in it.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-st-mean-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'ordering',
    difficulty: 'easy',
    prompt: 'Order the steps of computing a median.',
    socraticHint: 'One step must happen before the position means anything.',
    items: [
      'Sort the values',
      'Count them',
      'If the count is odd, take the middle value',
      'If it is even, average the two middle values',
    ],
    trap: 'Taking the middle of the list as written. The median is a position in the SORTED order, and skipping the sort gives an arbitrary element.',
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-st-outlier-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'Adding one enormous value to a dataset. What happens to the mean and the median?',
    socraticHint: 'One is a computation over every value; the other is a position.',
    choices: [
      { text: 'The mean can move without bound; the median moves by at most one position in the sorted order.', correct: true, why: 'That bounded movement is what "robust to outliers" means, and it is why the median is preferred for skewed data.' },
      { text: 'Both move without bound, since both use all the data.', correct: false, why: 'The median uses all the data to find a POSITION, and a single extra value shifts that position by one.' },
      { text: 'Neither moves, since one value out of many is negligible.', correct: false, why: 'The mean moves by the value divided by the count, which is not negligible when the value is enormous.' },
      { text: 'The median can move without bound and the mean is bounded.', correct: false, why: 'That is the two the wrong way round.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  {
    id: 'x-st-match-1',
    course: 'statistics',
    topic: 'Measures of central tendency: mean, median and mode',
    type: 'matching',
    difficulty: 'easy',
    prompt: 'Match each measure with what it is.',
    socraticHint: 'One is a sum, one is a position, one is a count.',
    pairs: [
      { left: 'mean', right: 'the sum divided by how many values there are' },
      { left: 'median', right: 'the value in the middle of the sorted order' },
      { left: 'mode', right: 'the value that appears most often' },
    ],
    rightDistractors: ['the difference between the largest and smallest', 'the average distance from the centre'],
    checkOperation: 'none',
    _verification: 'structure',
  },

]);
