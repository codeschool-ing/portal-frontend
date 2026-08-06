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

   The Portuguese is in assets/exercises-pt.js; what decides an answer is not
   translated.

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
    prompt: 'Two rules reach the same element: `#panel p { color: red }` and `.warning.featured p { color: blue }`. Which colour wins, and why?',
    socraticHint: 'Specificity is a trio compared from left to right. How many classes would it take to beat an id?',
    choices: [
      {
        text: 'Red: the id counts in the first number of the trio, and that is compared before the classes — no number of classes reaches it.',
        correct: true,
        why: '(1,0,1) against (0,2,1): the first number decides and the others are never even consulted.',
      },
      {
        text: 'Blue: two classes add up to more weight than one id, because the sum is a weighted total.',
        correct: false,
        why: 'The sum is not a total: it is a position-by-position comparison, and the first difference settles it.',
      },
      {
        text: 'Blue: between rules reaching the same element, the one written last always wins.',
        correct: false,
        why: 'Order only breaks a tie when specificity ties, which is not the case here.',
      },
      {
        text: 'Red: `color` is inherited, and inherited properties ignore specificity.',
        correct: false,
        why: 'Inheritance explains how a child gets a value with no rule of its own; here there are two direct rules, and the cascade decides.',
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
    prompt: 'Match each selector to what it reaches. There are options left over in the right-hand column.',
    socraticHint: 'Two of them differ by a single character between the names, and that difference is the distance in the tree.',
    pairs: [
      { left: '`nav a`', right: 'Every link at any depth inside nav' },
      { left: '`nav > a`', right: 'Only the links that are direct children of nav' },
      { left: '`li + li`', right: 'Each item that comes right after another item' },
      { left: '`a[href^="http"]`', right: 'Links whose address starts with http' },
    ],
    rightDistractors: [
      'The first item of every list on the page',
      'Links inside an element with the class http',
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
    prompt: 'An element has `width: 200px`, `padding: 20px` and `border: 2px`. How much horizontal space does it occupy, in CSS\'s default behaviour?',
    socraticHint: 'By default, `width` measures only one of the box\'s four layers. Which one — and do the others go inwards or outwards?',
    choices: [
      { text: '244px, because by default `width` measures only the content and padding and border add outwards.', correct: true, why: '200 + 20 + 20 + 2 + 2 = 244. It is what `box-sizing: border-box` corrects.' },
      { text: '200px, because `width` always sets the element\'s final width on screen.', correct: false, why: 'That becomes true with `border-box`, which is not the default.' },
      { text: '240px, because the border is drawn over the padding and adds no width.', correct: false, why: 'The border takes up space of its own, between padding and margin.' },
      { text: '204px, because the padding is inside the content and does not add up.', correct: false, why: 'Padding is inside the box, but outside the content — and it adds up by default.' },
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
    prompt: 'Tick the true statements about units.',
    socraticHint: 'One of them is the reason text sized in pixels is an accessibility problem. Another concerns a unit that compounds when elements nest.',
    choices: [
      { text: '`rem` respects whoever enlarged the default font in the browser; `px` ignores that preference.', correct: true, why: 'It is why typography is measured in `rem`.' },
      { text: '`em` compounds in nested elements, because it is relative to the element\'s own font size.', correct: true, why: 'Two levels of `1.2em` give 1.44 times the size, not 1.2.' },
      { text: 'On a phone, `svh` and `dvh` cope better than `vh` with the browser bar appearing and disappearing.', correct: true, why: '`vh` pins the height to the larger window and leaves content hidden behind the bar.' },
      { text: '`%` is always relative to the size of the window.', correct: false, why: '`%` is relative to the container; the ones referring to the window are `vw`/`vh`.' },
      { text: '`box-sizing: border-box` changes the meaning of `margin` as well as `width`.', correct: false, why: 'Margin is outside the box and is unaffected; what changes is what `width` and `height` measure.' },
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
    prompt: 'In a container with `display: flex` and `flex-direction: column`, what does `justify-content: center` do?',
    socraticHint: 'The two alignment properties are not "horizontal" and "vertical": they are "main" and "cross". What has `flex-direction` just changed?',
    choices: [
      { text: 'It centres vertically, because with `column` the main axis has become the vertical one.', correct: true, why: '`justify-content` always acts on the main axis, and it is `flex-direction` that decides which one that is.' },
      { text: 'It centres horizontally, because `justify-content` always deals with the horizontal axis.', correct: false, why: 'It looks horizontal only because `row` is the default; with `column`, the one dealing with the horizontal is `align-items`.' },
      { text: 'It does nothing, because in a column only `align-items` has any effect.', correct: false, why: 'Both go on working; what swapped was the axis each of them acts on.' },
      { text: 'It centres in both directions, because `column` merges the axes.', correct: false, why: 'There are still two distinct axes; they merely changed orientation.' },
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
    prompt: 'Match each declaration to the item\'s behaviour. There are options left over in the right-hand column.',
    socraticHint: 'Two of them differ only in the basis — `0` or `auto` — and it is the basis that decides whether the item\'s content influences the final width.',
    pairs: [
      { left: '`flex: 0 0 240px`', right: 'Stays at a fixed 240px, neither growing nor shrinking' },
      { left: '`flex: 1`', right: 'Divides the space equally, ignoring the content' },
      { left: '`flex: 1 1 auto`', right: 'Takes whatever is left, starting from the content size' },
      { left: '`min-width: 0`', right: 'Allows shrinking below the content, avoiding the overflow' },
    ],
    rightDistractors: [
      'Aligns the item on its own on the cross axis, ignoring its siblings',
      'Changes the item\'s visual order without altering the HTML',
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
    prompt: 'Put the steps of writing a responsive component mobile first in order.',
    socraticHint: 'One of the steps has no media query at all, and that is exactly why it comes first. Does measuring come before choosing where to break?',
    items: [
      'Write the one-column layout, with no media query at all',
      'Widen the window until the one-column layout gets hard to read',
      'Note that width down as the component\'s breakpoint',
      'Add a `min-width` media query introducing the second column',
    ],
    trap: 'The measure–note pair. It is tempting to choose the breakpoint before looking, using the usual numbers (768, 1024). But a breakpoint is a property of the content, not of a device catalogue: the component breaks where reading gets worse, and that width changes with the text size and the density of each component. Fixing it before measuring produces a break in an arbitrary place and forces a correction later.',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'hc-10-quiz',
    course: 'html-css',
    topic: 'Responsiveness: mobile first, media queries and container queries',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'A reusable card appears sometimes in a narrow bar and sometimes filling the whole screen. With a media query it comes out wrong in one of the two. Why?',
    socraticHint: 'A media query asks the size of what? And is that the measure determining the space the card actually received?',
    choices: [
      {
        text: 'The media query measures the window, not the space given to the card — and both cases happen in the same window.',
        correct: true,
        why: 'It is what container queries solve: `@container` measures the container, so the component adapts to the space it received.',
      },
      {
        text: 'A media query is only re-evaluated on load, and not when the card moves.',
        correct: false,
        why: 'Media queries are re-evaluated continuously; the problem is what they measure, not when.',
      },
      {
        text: '`container-type` is missing from the card, so the media query does not take it into account.',
        correct: false,
        why: '`container-type` enables `@container`, and does not change how `@media` behaves.',
      },
      {
        text: 'The specificity of the rule inside the media query is lower than that of the base rule.',
        correct: false,
        why: 'A media query does not change specificity; the rule inside carries the weight of its own selector.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
]);
