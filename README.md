# portal-frontend — codeschool.ing's Student Portal

**Stage 2** of the project: the student area. Stage 1 is the vitrine
([`codeschool-ing.github.io`](https://github.com/codeschool-ing/codeschool-ing.github.io)),
which presents 122 courses and 19 tracks and hands whoever is convinced to this portal. This is where
whoever enrolled actually studies.

No build and no dependencies, like the vitrine: plain HTML, CSS and ES modules.
It opens from any static server.

> **Status: live, on a real backend.** The portal publishes to GitHub Pages on
> every merge to `main` and talks to `api.codeschool.ing`
> (`codeschool-ing/portal-backend`, on Cloud Run): real accounts, password
> sign-in, e-mail confirmation, optional two-factor, session management, progress
> and exam attempts kept server-side, and certificates issued against a public
> validation page.
>
> **It still runs with no server at all**, and that is a property to keep rather
> than a leftover: `<meta name="backend">` is empty in the repository, which means
> local-only, and that is the mode the single-file bundle, the `file://` path and
> the browser suites all use. The served site is the one exception, filled in at
> publish time — see "The server, when there is one".
>
> **What is still make-believe is the content**, not the machinery: 3 of 86
> courses have written lessons, and the exam pool is placeholder and unreviewed.
> See "What is skeleton and what is settled".

## Running it

```sh
python3 -m http.server 8899
# open http://localhost:8899
```

Checking that it still stands:

```sh
npm i playwright
node tools/smoke/smoke.mjs      # the whole portal, in a browser
node tools/examples/check.mjs   # the code examples really do run
node tools/i18n/check.mjs       # nothing on screen is stuck in English
node tools/snapshot/snapshot.js  # the backend's snapshot still builds
```

All four run in CI on every pull request — `.github/workflows/ci.yml`. They are
not `aleogr/pipeline`'s: the organisation's shared workflows are Go, and there
is none here.

## The staff console is a different repository

`codeschool-ing/console-frontend`, served at **admin.codeschool.ing**. It started
as a folder here and moved out for one narrow reason: GitHub Pages serves one
custom domain per repository, `CNAME` holds exactly one, and this repository's is
`app.codeschool.ing`.

Two things follow for whoever works here. **`assets/base.css` now has three
copies** — the vitrine's `style.css`, this one, and the console's — so an edit
goes to two other places, not one; the file's own header says so. And **the
console has no backend of its own**: its endpoints belong in `portal-backend`
behind a `RequireStaff`, and what it costs the API is one entry in
`PORTAL_ALLOWED_ORIGINS`.

The rail becomes a drawer at **1180px** and the graph becomes a list at **861px**
— both cut points are the vitrine's, reused because they were measured there, not
chosen.

**The track in the bar is a selector, and asking for the screen you are already
on still renders it.** Assigning `location.hash` the value it already has fires
no `hashchange`, so nothing re-runs — and the screen goes on showing what it was
built from, which is not always what the state says any more. That is how
choosing a track from the bar while standing on the graph left the old track on
screen: the enrolment was written and the navigation was a no-op, so the only way
to see the new one was to leave for another screen and come back. `goTo`
re-dispatches instead, for every caller and not only that one — it is asked for a
screen, and a screen built from stale state is the wrong screen.

## The graph became a progress map

It is the project's best reuse, and it comes almost free: `requires` already is,
literally, an unlocking rule. The algorithm is the same — levels by Kahn,
Sugiyama ordering with a three-criterion lexicographic cost, geometric edge
routing with 16px of clearance. What changed is what the card says.

Four states: **completed · in progress · available · further ahead**.

**It shows, but it does not lock.** The vitrine's FAQ promises, in writing:
*"No. The track is a recommended order — if you only need one course from it,
watch just that one."* A padlock here would contradict an already published
promise. That is why the most restrictive state is called `ahead`, remains
clickable, and the card's footer says "recommended after X" instead of "locked".

**The cursor lights up a course's edges** — the ones arriving at it and the ones
leaving it. This existed in the vitrine and had fallen by the wayside quietly:
`base.css` came with the `.edge.on` style, and the listener that adds the class
did not. Half a copy raises an error nowhere — it simply does not happen. There
is a single listener, on the screen, and not one per card: the cards are rebuilt
on every fork switch, and a per-card listener leaks on every rebuild.

**On a window taller than it is wide the graph is transposed** — levels stack,
the cards of a level sit side by side, and the edges are still drawn. `base.css`
turns the layout with a media query; the router is told by reading that layout
back, and it draws in a single axis either way: the boxes go in with `x` and `y`
swapped and every point comes out swapped back, so "the lane above the cards" is
the margin to their left, and not one line of the routing is written twice.

That is what a copy costs when only half of it travels. The portal's router came
from the vitrine before the transposition existed, so the layout turned and the
edges did not: on a narrow monitor **every** track drew a tangle — 6 of
back-end's 20 edges through a card, 144 crossings across seventeen tracks. The
same copy also predated the corridor threading, which is why an edge would ride
over a whole fork block when there was a clear gap beneath it, and the re-packing
pass, which is why a sub-column could overflow its lane. All three arrived
together with the port.

**The graph can take the whole screen.** It gets what the heading, the legend and
the exam card leave it — around 400px on a 900px window — and it is wider than it
is tall, so a button hands it the window: the screen becomes a fixed layer under
the bar, the objective and the exam card stand down, and Escape gives it back.
Not a second route and not the Fullscreen API — the same DOM moved, so nothing is
rebuilt and the language, the theme and the way out stay reachable. It can also
be **taken hold of and dragged**, on both axes, because the arrows page one
screenful at a time and that is the wrong unit for reading across the fold.

**The screen fits the window instead of scrolling it.** The graph used to ask for
58vh — a guess at what would be left over, and too much: the heading, the legend
and the exam card took the rest and then some, so the screen had *two* scroll
surfaces and the wheel did different things depending on where the pointer was
(161px of page scroll at 912×930, and 53px even at 1440×900). It now takes what
is actually left. Two things had to be right for that. `.view` carries
`margin:0 auto`, and an auto margin cancels the stretch a column flex container
would otherwise apply — without an explicit `width:100%` the screen sized itself
to its widest child and ran 206px past the window sideways. And the floor is
360px, which is not a taste: the tallest thing a level can hold is a fork block
at ~334px, and squeezed below that the block overflows its lane, a card ends up
outside it, and the corridor an edge detours through is gone — 16 edges crossed a
card when 220px was tried. Under about 800px of window height the floor wins and
the column scrolls again, which is the honest outcome: there is genuinely not
room.

The smoke suite reproduces the vitrine's collision detector — 120 points per
curve, checking whether any of them falls inside a card that is not an endpoint
of that edge. Inheriting the routing without inheriting the check would mean
keeping the risk and losing the net. It runs it in a landscape window, on the
whole screen, and at 900×1000 over four tracks — a router is only exercised by
the shapes it is given. It measures the two overflows too, on four window shapes
and both axes. It also checks the highlight, and there is a
measurement trap there: the line's thickness has a `transition`, and
`getComputedStyle` mid-transition returns the intermediate value — measuring
immediately reads 1.5px and fails a rule that is correct.

## Lesson = topic, section = subject

The catalogue has no concept of a lesson; the finest grain is `topics`, and
there are 1,503 of them. The portal adopts **topic as lesson** instead of
inventing a third key: the exercises the pipeline emits already carry `topic` as
a first-class field, so curriculum and content already agreed with each other.

**But a topic is not one subject — it is a handful of them.** The catalogue's
numbers:

| | |
| --- | --- |
| topics with a colon (`X: a, b and c`) | **811 (54%)** |
| topics enumerating **3+ subjects** in the title | **734 (49%)** |
| average load per topic | **4.0h** |
| worst case (`react-ts`) | **7.5h per topic** |

Four hours is not one page, and a single "completed" checkbox at the end of them
makes the student's bar move in jumps that correspond to nothing. So a lesson is
divided into **sections**, and the last one is always the assessment.

**The sections are written, never derived.** It would have been possible to split
the title on the `:` and the commas and get 734 divisions for free, and it would
have been a mistake: that is lexical heuristics over authored prose, exactly what
`RULES.md` records having tried and discarded when checking "requires a later
topic" — *"the answer is in the authoring, not in the detection"*. It would fail
the same way here: `Client, server and host: who asks and who answers` would
become a section called "who asks and who answers". The enumeration in the title is
**evidence** that the sections are needed; it is not a source for reading them.

The sections live in `assets/lessons-*.js`, and not in the catalogue, because that
one is a copy of the vitrine's catalogue and the modal over there renders
`topicos` as a flat list. That leaves three files with three owners and the same
join key:

| file | what | whose |
| --- | --- | --- |
| `dados.js` | catalogue: courses, tracks, topics | shared with the vitrine |
| `lessons-*.js` | the sections and their text | the portal's |
| exercises | the assessment | the pipeline's |

**Moving on is completing.** There is no "mark as completed" button: it and the
next arrow did the same thing, and merging them into a "Complete and continue"
only postponed the question. Moving to the next section marks the current one as
done — which is what the student already meant to say by clicking next. The cost
is real and is on the record: there is no way to unmark, and whoever skims
through accumulates progress without having read. It is the trade accepted in
favour of a single gesture, and it fits the rest of the portal, which shows and
does not lock.

The shape of a lesson is fixed: **N content sections, and the assessment at the
end.**

### The section declares what it is

Not every section has the same nature, and the layout follows the nature:

| the section says | what shows up |
| --- | --- |
| `video: 'ID'` | the player, playing right there |
| `video: true` | the reserved frame — "there will be one, there isn't yet" |
| (no `video`) | nothing. No grey frame, no promise |
| `video` **and no `body`** | a **video-only** section: the lesson's opening |

The frame was once on **every** content section, reserved, on the argument that
publishing the videos one at a time would not reorganise anyone's screen. The
argument still holds for a section that *will* have a video — and it is terrible
for one that never will: a text section with a grey rectangle on top promises
something that does not come, and the promise does not expire. The reservation
was not lost; it stopped being automatic and became **stated**.

**The title goes above the player**, as in the text sections — "where am I" comes
before "what am I watching", and the answer has to be the same in both shapes.
(The player was once above the title, so as not to push play below the fold; the
price was landing in a section without knowing which lesson it belonged to.)

### The lesson has one width, and that width has two values

| | |
| --- | --- |
| `--rail` | the menu column |
| `--reading` | 820px, the narrow column |
| `--wide` | 934–1074px, the wide column |
| `--screen` | which of the two is in force — **everything** in the lesson uses it |

This was the third attempt, and the first two got it wrong the same way.

The first let the **player** bleed edge to edge while the text stayed at 820. The
second released the **example** to `--wide` — and then the player along with it
— and left the rest at 820. Both produced the same thing: different margins
inside one lesson, the eye hunting for where the line starts on every scroll.
Fixing it element by element did not converge, because the defect belonged to no
element: it was that there was more than one width.

Now there is `--screen`, and it holds for the title, the breadcrumbs, the steps,
the prose, the player, the example, the material and the footer. A single
variable settles it **by construction** — there is no way for one element to
disagree with another, not even mid-resize.

**The price is declared.** The prose lost its `max-width:68ch`, so at 1074px the
line reaches **121ch** (measured), against the 68 that are comfortable for long
reading. It was a choice between two defects and alignment won; if the long line
turns out to hurt, the ceiling comes back in `ch` and what is lost is the
alignment on the right, not the one on the left.

#### The two numbers, and where they come from

The wide column was **measured, not guessed**. The longest line that exists in
the examples has 74 characters; IBM Plex Mono at 12.64px advances 7.601px per
character — 562px, plus 36px of padding, 598px. Hence `--code:604px`: a little
more than the line, not the whole screen. The note has `--note:440px` as its
ceiling and `--note-min:300px` as its floor, and it is the note that shrinks when
space runs short, because the code cannot.

The wide column's ceiling comes from the **navigation arrow**, which lives in the
gap. It is 44px wide, and to leave 16px between it and the content the gap needs
`4 × 38 = 152`:

```
--wide <= 100vw - rail - 152
```

And the cut between the two columns comes from equating that ceiling to what the
example's two columns ask for — `604 + 300 + 30 = 934`:

```
100vw - 380 - 152 >= 934   →   100vw >= 1466
```

A single cut, and two things happen at it: the code block opens into two columns
**and** the whole lesson moves to the wide width. Between 1466 and 1606 the
lesson grows along with the window, from 934 up to 1074; from there on it stops,
because widening further would only stretch the text column.

| screen | lesson | example | clearance to the arrow |
| --- | --- | --- | --- |
| 1280 | 818 | stacked | arrows in the footer |
| 1440 | 820 | stacked | 38px |
| 1466 | 934 | two columns | 16px |
| 1500 | 968 | two columns | 16px |
| 1606 | 1074 | two columns | 16px |
| 1920 | 1074 | two columns | 95px |
| 2400 | 1074 | two columns | 215px |

#### The only slack belongs to the player, and only downwards

The player's height ceiling (`min(64vh, 100vh - 300px)`, so that play does not
push the rest of the section below the fold) limits the **width**, and the 16/9
ratio derives the height from it. Capping the height of an `aspect-ratio` box
does not shrink the box: it flattens it, and the video inside stretches — at
1920×700 the player reached 2.05:1 before this. In a short window it ends up
smaller than the rest of the lesson, left-aligned like everything else, and never
deformed.

#### The test changed its question

It used to ask *"who went past the ceiling?"*, with a list of who was allowed to
— and the list grew with every element that earned the right to escape, while the
real defect slipped through. Now it asks the rule: **every child of the screen
starts and ends in the same column**. The test walks the 89 written sections of
the three courses, one by one — it is expensive, one navigation per section, and
it is the only way for the rule to hold for the content that exists rather than
for the section someone remembered to open.

**Video is not a synonym for a lesson's opening.** Of the 26 sections with video,
5 are the first of their lesson, 15 the second, 5 the third and 1 the fourth. If
they were all the first, the shape would have become a convention with nobody
deciding it — and there is a test that fails if the positions cluster again.

In the rail, the icon states the nature along with the status: **play** for
video, **lines** for reading, **star** for the assessment, **check** for what is
already done. Everything used to be play, which promised video in every section.

### The other rules of the shape

- **The assessment never has video** — there the student answers, does not watch.
- **The assessment is always the last section**, whether it has exercises or not.
  The structure stays predictable and an empty assessment says what is coming,
  instead of disappearing.
- **The assessment is per topic, not per section.** Pushing it down to the section
  level would force a change to the key the pipeline emits — and it covers the
  whole topic either way.
- **A lesson with no written sections becomes a single section**, with the earlier
  behaviour. Content lands course by course, with no transition day on which half
  the portal is broken.

**An empty assessment does not count towards progress.** If it did, no course
would ever reach 100% while the exercises did not exist, and no certificate would
ever be issued. It shows on screen, marked as pending and with no complete
button — marking as done what was not done is the cheapest way for a portal to
lie about progress. The denominator grows when the exercises arrive, which is
honest: the lesson really did gain more work inside it.

**The unit of progress became the section.** `lessonDone` became derived: a
lesson is done when all of its sections are. A record in the old format (one
checkbox per lesson) is migrated on the first write, so whoever already had
progress does not see it reset.

**And the exam follows the same rule, one level up.** It did not, and that is
what the reader saw: the exam card was rendered only when the draw came back with
questions, so on Technical Leadership — five courses, none of them written yet —
the *Track exam* section was simply not on the screen. Nothing said why, and
nothing said it was coming. Five tracks were in that state, and 118 of the 122
course pages. The card is now always there, dashed and reading *in preparation*,
exactly like the assessment at the foot of a lesson.

The other half of the same rule: **a paper too thin to be passed without being
perfect is not offered either.** `statistics` has one written exercise and was
advertising a one-question "final exam". `MIN_QUESTIONS` is derived from the pass
mark rather than chosen — a paper of n questions scores in steps of 100/n, and at
70% three questions means passing requires three out of three, which is not the
exam the rules on the screen describe. The floor comes out at four. The exam
screen applies the same test, so *coming soon* is never a doorway.

### The three written courses

There is one file per course, as the pipeline does — `lessons-<course>.js` and
`exercises-<course>.js` — and each one **merges** into the global object instead
of assigning it: none of them may depend on being the first to load.

| course | lessons written | sections | assessments | what it exercises |
| --- | --- | --- | --- | --- |
| `web-fundamentals` | 11 of 11 | 39 | 11 of 11, 23 exercises | prose, inline diagram, material, video-only section |
| `html-css` | 13 of 13 | 39 | 4 of 13, 8 exercises | code block, figure from a file |
| `javascript` | 4 of 12 | 11 | 3 of 12, 9 exercises | annotated `example`, all 7 types, video-only section |

The two that are **half done** are so on purpose: `html-css` has incomplete
assessments and `javascript` has incomplete lessons. That is how a course looks
while it is being produced, and it is what exercises the two states of a gap —
the pending assessment (present in the structure, marked, outside the
denominator) and the lesson with no text yet (which falls back to the
single-section wrapper).

**Neither of the first two has `code`, and the absence is information.** In
`web-fundamentals`, writing a program would demand what the course does not give —
it is the school's first course, with no language prerequisite, and asking for it
would violate the generator's rule that an exercise from topic N may only require
what topics 1..N taught. In `html-css` the reason is different: the pipeline's
validator executes python, javascript and sql, and HTML/CSS are not verified
against test cases because what would be verified is the rendering. It is the
same finding `RULES.md` recorded in `architect-communication`, where three of the
seven types were inapplicable. All seven together are still in `javascript`,
lesson 2.

**`html-css` is what made the prose grow.** In a conceptual course, a backtick
mid-sentence is enough; there is no way to teach a selector without showing it in
three lines with the indentation preserved. Hence the third kind of block:

```js
body: [
  'text with `code` and **bold**',
  ['item', 'item'],                      // becomes a <ul>
  { code: 'css', text: '.a { … }' },     // becomes a code block
]
```

The shape grew because the content asked for it, and only as much as it asked.
The block reuses `.code-block`, the exercises' component, and is escaped with
`esc` and not with `formatted`: inside code, a backtick is a backtick and an
asterisk is an asterisk.

**A section title is plain text.** It appears in the `h2`, in the step chip and in
the rail line, and in the last two it is a label, not prose — markup in a 200px
chip becomes noise.

The content of both is technically correct and **has had no pedagogical review**:
it serves to evaluate the structure, and the school rewrites it.

**And the displayed title is not usable as a key.** `applyContent()` rewrites
`c.topics` in place on every language switch — in English the topic becomes
*"Types, coercion, strict equality and falsy values"* and no exercise matches.
The defect appears without anyone touching anything: it is enough for the browser
to be configured in another language, which is the case for most people outside
Brazil. That is how it turned up, in an English Chromium.

The key is the **Portuguese text**, stored by `saveBase()` on load. It is the
vitrine's own i18n decision — *the translation key is the Portuguese text itself*
— applied to the join with the content. Each lesson carries both things: `title`
to display, `key` to match on.

## The translation has two halves, and only one crosses intact

| half | in the vitrine | in the portal |
| --- | --- | --- |
| `txt('the English text')` | the exception | **the main path** |
| the walk over the text nodes | the main path | only the static skeleton |
| `applyContent()`, which rewrites `COURSES`/`TRACKS` in place | the same | the same |

The walk (`mapTexts`) works in the vitrine because the HTML is static and
there is a `DINAMICOS` list with eleven containers to skip. In a portal nearly
all text is born in JavaScript, and that list would become the whole page. The
mechanism is the same; what changes is the weight of each half.

The `DINAMICOS` list is where that shows: it moved out of the code and became
`window.I18N_DYNAMIC`, defined in `index.html`.

**It is no longer the only divergence, and the claim that it was has been
retired.** The two files have grown apart on both sides and for good reasons:
the vitrine's copy translates `TESTIMONIALS`, which the portal does not have,
and this one translates lessons, exercises, plans and features, which the
vitrine does not. What is still shared — the detection, the stored choice and
its migration, and the rewrite-in-place of the catalogue objects — is worth
keeping in step, and the rest is each page's own.

**Interface and content are different things.** The interface translates into the
five languages; an exercise statement and a lesson's text are database content,
and in Stage 2 they either arrive translated from the server or they do not
arrive. The sample exercises are in Portuguese only on purpose — and since every
missing key falls back to Portuguese on its own, browsing in English with a
Portuguese exercise breaks nothing.

## The seven exercise types

A type's contract is small: `body(ex, uid)`, `setup(root)` (optional),
`collect(root)`, `reveal(root, ex, verdict)`. The common wrapper — statement,
hint, button, verdict, seal — lives in `app/exercises/index.js`.

What divides the seven is not the UI, it is **where the grading can happen**:

| type | grades where | today |
| --- | --- | --- |
| `quiz` · `multiple-choice` · `ordering` · `matching` | client — it is pure comparison | **really works** |
| `code` · `expected-output` | server: execution in a container | "not checked" verdict |
| `expression-answer` | server: symbolic equivalence (sympy) | "not checked" verdict |

Both paths go through `api.grade()` with the same verdict shape, so the day the
server exists changes the body of one `if`.

**Not checked never becomes passed.** It is the pipeline's rule and it holds
entirely here: while there is no execution, the portal says it did not check,
instead of handing out a "correct" nobody verified.

Three of the school's rules that the interface has respected since day one,
because they are easy to get wrong and expensive to fix later:

- **`why` is post-answer feedback, not a visible hint.** It only appears after
  answering.
- **The JSON's order is the answer key** in `ordering` (the `items` are in the
  right order) and in `matching` (`pairs[i].left ↔ pairs[i].right`). Both
  are shuffled with a seed, and the matching exercise's right-hand column comes
  out **alphabetically sorted** — the same reason the pipeline's probe does it.
- **`trap` does not go on screen** before the answer: it names exactly what
  the exercise measures. It becomes feedback afterwards.

In `codigo`, the first test cases become the example and the rest stay hidden:
showing all of them invites building the solution that passes the cases without
solving the problem — which is the defect the pipeline's generator has to discard
before closing an exercise.

## What is skeleton and what is settled

**Disposable:** the content of `assets/exercises-sample.js`, the lessons' text,
and the exam pool, which has had no pedagogical review.

The sign-in screen used to be on that list. It is not any more: with a backend
configured it asks for real credentials and the server answers them. It keeps the
name-only skeleton for the no-backend mode, which is what the bundle and the
suites drive — one screen, two modes, and the mode is `<meta name="backend">`.

**Settled:** the exercise format — the fields are exactly the ones the pipeline
emits (`prompt`, `socraticHint`, `options[].{text,correct,why}`, `items`,
`trap`, `pairs`, `rightDistractors`,
`tests[].{description,input,expected_output}`, `check_*`). The portal adds
two fields that are its own, not the exercise's: `id` and `course`.

Ignoring the tool for now costs nothing; inventing a parallel format would cost a
migration.

Also settled: `_verification` (`critiqued` / `execution` / `structure`) appears on
every exercise and already filters in `api.lessonExercises()`. The pipeline's
docs say it is this field that decides what the portal publishes first — better
for it to exist empty than to be retrofitted.

## Structure

```
index.html                     the shell: bar, rail and <main>
assets/base.css                the vitrine's CSS — selectors now English, so it has diverged
assets/portal.css              only what the vitrine did not have
assets/catalog.js              catalogue, in English (mirrored server-side; see the snapshot tool)
assets/lessons-*.js            each topic's sections and their text
assets/exercises-*.js          one file per course, as the pipeline does
app/catalog.js                 reading the catalogue and the graph — no DOM
app/lessons.js                 what a lesson is made of: sections + assessment
app/graph.js                   the graph as a progress map
app/state.js                   the student's progress (localStorage → server)
app/api.js                     one signature, two modes: server when configured, local when not
app/routes.js                  the hash router
app/rail.js                    the side rail
app/search.js                  the global search index — no DOM
app/search-panel.js            the ⌘K panel
app/modal.js                   the vitrine's modal, reused
app/exams.js                   builds the course exam and the track exam
app/materials.js               the list of material to download
assets/plans.js                the plans and what each one includes
assets/materials.js            GENERATED — the PDFs, as data: URIs
tools/materials/               generates assets/materials.js
tools/examples/                runs the `example` blocks and checks the output
app/screens/*.js               one per screen
app/exercises/*.js             one per type, plus the wrapper and the grading
tools/smoke/                   the smoke suite
tools/i18n/                    every string on screen has all four translations
tools/version/                 reads or sets the released version
tools/bundle/                  generates the single HTML file
```

Nobody outside `state.js` reads `localStorage`, and nobody outside `api.js` reads
`state.js` to fetch data. Swapping the persistence means swapping one file.

Hash and not the History API: the portal is served as a static file, and
`pushState` would require the server to return the index at any path.

## The assessment is a wizard

One question at a time, with markers at the top. Stacking seven exercises on one
page makes you scroll to find where you left off and shows all at once a volume
that intimidates.

The markers are **clickable** and the screens are **kept**: going back to
question 1 returns question 1 as it was, with the verdict and the justifications
on view. Rebuilding would erase that, and the student would think they lost what
they did. Blocking progress until you get it right is also out — the whole track
is a recommendation and does not lock; the assessment could not be stricter than
it.

**Matching became click-by-click, in Duolingo's gesture:** you tap an item on the
left, then its pair on the right, and the pair is checked right away. This works
the same on touch and on mouse, does not hide the options in a menu, and becomes
practice instead of a form.

But it breaks the measurement, and the fix matters: **with immediate feedback the
final mapping is always right** — you just have to persist. If the verdict kept
comparing the map against the key, everyone would score 100%. The measurement
became the path: **how many pairs were tried wrong before closing**. Zero is a
clean answer. It is the pipeline's ruler — getting it right by elimination does
not count as knowing — applied to the process instead of the result.

**The `_verification` seal left the student's screen.** It stays in the data and
keeps filtering in `lessonExercises`: it is a *publication* decision, not
information for whoever is studying. Telling a student "structural check only" is
warning them that this exercise may be no good — and if it may be no good, it
should not be published.

## Search, performance and notes

Three screens that invent no data at all: they show what the portal already had
and did not display.

### Search (`⌘K`, `/`, or the magnifier)

The magnifier and `⌘K` existed from day one and both led to the catalogue — a
shortcut that promised search and delivered navigation. **It matters more here
than on an ordinary site:** there are 122 courses and 2,402 lessons, and someone
who remembers "that part about the DNS TTL" had no path there at all — not
through the menu, not through the graph, not through the rail.

It indexes five groups, in order of decreasing usefulness: **sections** (the
grain people actually look for), **lessons**, **courses**, **exercises** and **the
student's own notes**.

Two decisions come from defects already paid for in this project:

1. **It matches against the displayed text and against the Portuguese at the same
   time.** The catalogue is translated at runtime; in an English browser the
   lesson title is "Hosting: shared, VPS, cloud and CDN", but the sections, the
   notes and the exercises are in Portuguese. Indexing only one of the two would
   make half the content vanish depending on the language — which is exactly the
   defect that already bit the exercise join.
2. **It ignores accents**, on both sides of the comparison. People typing on a
   phone almost never accent.

The snippet beside each result comes from the **body**, never from the title:
repeating below the title that is above informs nothing. And it is plain text —
the body's minimal markup (backtick and `**`) is stripped before indexing, or it
would show up raw on screen. Both cases are in the smoke suite.

Sections only enter where the content was written. In the 84 courses with no
text, the "section" is a wrapper carrying the lesson's own name, and listing it
would return every result twice.

### Performance, and why it has three states

Every answer already recorded attempts, correctness and whether it ever got
checked. That died there: the student answered, saw the verdict and never met it
again.

**"Got it wrong" and "nobody checked" do not become the same bar.** The types
that need a server (`code`, `expected-output`, `expression-answer`) answer
`correct: null` while there is no execution, and counting them as errors would
invent a failure that did not happen. It is the funnel's ruler from the other
side: there, not judged never becomes approved; here, not judged never becomes
failed. They show up as "waiting for the server" and stay out of the rate.

**Redoing the wrong ones** builds the same assessment wizard with whatever the
student got wrong in any course — it is the only screen that gathers content from
different lessons, and it makes sense because the criterion here is not the
curriculum, it is the error. Each exercise comes back with **the course and the
lesson it came from**: the wizard writes to `progress[course].lessons[ix]`, and a
single context would record the correct answer against the wrong lesson, making
the performance screen lie about where the person improved.

### Notes

A collapsed field at the end of each section, with automatic saving. It is the
only thing in the portal that came neither from the catalogue nor from the
pipeline: it is the student's. That is why it has a screen of its own, grouped by
course — when it is time to revise nobody remembers which section they wrote what
in — and enters the search along with everything else.

## Course exam and track exam

The lesson's assessment and the exam are not the same thing, and the difference
is not the size:

| | lesson assessment | exam |
|---|---|---|
| what for | practising | measuring |
| feedback | immediate, question by question | only at the end |
| socratic hint | shows | does not show |
| redo | freely, right away | only by redoing the whole exam |
| result | not recorded | counts for a grade, and the best one stands |

**Immediate feedback in an exam is what allows trying until you get it right** —
and then it stops measuring. That is why the wizard gained `options.exam`: the
same screens, with the verdict held back. While the exam is open, answering
returns only "answer recorded", and the marker at the top says *whether* you
answered, never *whether you got it right*. On submission everything opens at
once and answering stops being possible — that is the line between measuring and
teaching.

**The questions come from the lessons' own bank, drawn at random.** There is no
separate bank of "exam questions" and there should not be while the pipeline
emits one file per topic: keeping two banks aligned is recurring work, and what
would be gained — unseen questions — the draw already gives, because nobody does
all 1,503 exercises of a track before the exam.

**The draw is seeded by the attempt.** Leaving the screen and coming back returns
the *same* exam; otherwise, closing the tab by accident would become a new exam —
the wrong punishment for the wrong mistake. Failing and trying again returns a
*different* exam: memorising the list of ten cannot be the strategy.

**The exam prefers the types the portal knows how to grade.** `codigo`,
`expected-output` and `expression-answer` need a server and today come back "not
checked" — an exam full of them would have no grade. They only come in when there
are not enough gradable ones, and they stay out of the denominator, by the usual
ruler: not judged becomes neither passed nor failed. Leaving something blank, by
contrast, counts as wrong — leaving it blank is an answer.

**It does not lock.** You can open the exam without having done a single lesson.
The whole portal shows and does not lock, and an exam that locked would be the
only exception. What it does is warn you how much of the content you have
completed. Submitting with blank questions asks for a second click, and the
button itself says how many there are.

Minimum to pass: **70%**. The best result always stands — failing after having
already passed cannot take away an issued certificate.

### The certificate came to require the exam

Completing every section says the person **went through** the material — and
since moving on is completing, going through is nearly automatic. A certificate
that comes from going through asserts nothing about whoever receives it. The exam
is what makes the document mean something.

With the track exam came the **second unit of certification**: whoever finishes
the path's courses and passes the track's final exam takes away a certificate for
the whole track. This answers *in part* the question the vitrine's README left
open: the track is the large unit, and the real doubt — whether there is
something between a 40h course and a 400h track — remains open, and remains cheap
while no certificate has been issued to a real student.

The certificates screen shows **samples** of each type the student does not have
yet, assembled with the real data from their catalogue. They declare themselves
samples in three places at once — dashed frame, a seal in the bar and, in place
of the validation code, the phrase "no code has been issued". A fake certificate
that looks like a real one is a problem, not a preview.

### The paper is the server's, when there is one

Everything above draws from the exercise bank in the page — which means the
answer key is in the page, and an open devtools is a guaranteed 100%. With
`<meta name="backend">` configured the paper comes from `internal/assessment`
instead:

```
POST /api/exams/course/{id}                       the attempt in progress, or a new draw
PUT  /api/exams/attempts/{id}/answers/{exerciseId} recorded, never graded
POST /api/exams/attempts/{id}/submit               and only now, the result
```

The exam an answer belongs to is the whole difference: `api.grade()` takes an
`attempt`, and its presence is what turns grading into recording. The verdict
comes back at submit with the right answer and the `why` beside it, and the
screen grafts those onto the exercise before revealing — the renderers mark the
right answer by reading the exercise, and a server-drawn paper has no such
field until the exam is over.

**Both paths stay**, and that is not a hedge: `bundle.py` produces a file
opened off a disk with no server near it, and the smoke suite drives that file.
What the local one cannot do is hold a verdict it already has. That is the
honest limit of a portal with no server, and it is the reason the server exists.

`matching` has TWO GESTURES, and the difference is not cosmetic. In practice
every pair is checked as it lands — green and locked, red and undone — so the
final mapping is always right and the measure has to be the PATH: how many were
tried wrong before it closed. In an exam nothing is checked until the exam is,
so the mapping is where the student put it and the mapping is the answer, which
is how `internal/assessment` grades one. Both sides implement the same rule,
because the same paper must not score differently depending on whether a backend
was configured.

The exam gesture needs an undo, which practice never did: there a wrong pair
undoes itself, and here tapping a pair — either side — is the only way to change
your mind. Without it a mis-tap would be a lost mark.

Two suites, because the two modes need different things to run:
`tools/smoke/smoke.mjs` covers the local exam and runs in CI;
`tools/exam-server/check.mjs` covers the server one and needs a Go process, a
database and an ingested catalogue, so it is run by hand.

### `assets/exam-pool.js`, which index.html does not load

That line is the whole mechanism, and it is worth saying plainly because it
looks like an omission.

Every other exercise file is in a `<script>` tag, answer key and all, because
lesson practice grades on the client and immediate feedback is worth it. Which
means an exam drawn from those exercises was answerable before it was drawn:
`window.SAMPLE_EXERCISES.find(e => e.id === …).choices.find(c => c.correct)`, no
request, no devtools — view-source is enough. Measured on a real server-drawn
paper: **nine questions, nine of them in the page, eight with a usable key.**

The backend now refuses the practice route while a paper drawn on that course is
open, which stops the lookup DURING an exam. It cannot stop the one before it,
and neither can anything else while the same exercise is both a lesson's practice
and a paper's question. So they are not both.

| | practice | exam |
|---|---|---|
| file | `assets/exercises-*.js` | `assets/exam-pool.js` |
| in a `<script>` tag | yes | **no** |
| in the bundle | yes | no — the bundler inlines what index.html references |
| reaches the mirror | through `snapshot.js`, `_pool: "practice"` | through `snapshot.js`, `_pool: "exam"` |
| a route serves it | `GET /api/exercises/…` | none |

**The pool follows the FILE, not a field.** `snapshot.js` stamps `_pool` on the
way out, refuses to export if a page-loaded file declares one, and refuses if
`index.html` ever references `exam-pool.js`. A field would be one typo away from
putting a question whose key already shipped onto a paper, which is the exact
failure the two pools exist to make impossible.

Three checks guard it, and all three were confirmed to fail when the guard is
removed: the snapshot tool's refusal, `smoke.mjs` §27 — `window.EXAM_POOL` is
undefined in a real browser and no `x-` id reached `SAMPLE_EXERCISES`, and the
same for the single-file bundle — and `tools/exam-server/check.mjs`, which sweeps
every lesson of a course against a real server with nothing open and finds no
exam question.

That last suite now reads the pool **off disk**, which it could not do before and
which a student cannot do at all. When the harness needed a new road, that was
the sign the old one had really been shut.

What it costs is content: exam questions have to be written separately from
practice ones. That is not only a cost — a student who has drilled the practice
set has learned the material and should not then be examined on the drill.
`assets/exam-pool.js` currently holds 36 placeholder questions across the four
courses that have exercises, marked `structure` and unreviewed.

### The certificate is issued, or it is not

The screen used to hash the course id and the student's name into something
shaped like `CS-XXXX-XXXX-XXXX`. That was the right placeholder while nothing
issued one — deterministic, so it did not change between visits — and it became
the wrong thing to keep the moment `GET /api/certificates` started answering.
Two codes for one document is worse than none, because the one a student can
read and copy is the one the public page answers *"no certificate under this
code"* to.

So there are two modes, and they differ in what EXISTS rather than in where a
number comes from:

| | with a backend | without one |
|---|---|---|
| the list | `GET /api/certificates`, which mints whatever a passed exam owes | derived here, from a completed course and a passed exam |
| the code | the server's | none, and the footer says so |
| LinkedIn | `profile/add`, filled in | disabled, with the reason on the button |
| the PNG | yes | yes |

The PNG stays in both, and the LinkedIn button does not, because they answer to
different facts. `profile/add` posts a **credential naming an issuer**, and with
no server there is no issuer. A picture is a picture, and this one carries "no
code has been issued" in its own footer wherever it goes.

Everything the document asserts — the holder's name, the title, the workload —
comes from the row and never from the catalogue. The row is a **snapshot** taken
when the exam was passed, so retitling a course does not silently rewrite a
document already on a profile; reading the catalogue instead would undo the only
thing a snapshot is for. That includes the language: the title is English even
when the interface is not, because the validation page is English and the number
in the footer is an invitation to go and compare the two.

The validation URL is built from where the API is and not from where the portal
is. `GET /certificate/{code}` is the backend's route — server-rendered HTML,
because a crawler building a preview card cannot run a hash-routed
single-page app — and `api.codeschool.ing` is the same site at a different
origin. A hard-coded `codeschool.ing/certificate/…` would be a dead link on
somebody's profile.

A **revoked** certificate is shown and marked, not hidden. The URL is already
out there answering "revoked"; dropping the card would leave the holder the last
to know.

## Content: image, diagram and annotated code

`prose()` went from three block shapes to six. The three new ones:

```js
{ image: url, caption, alt }    // a file — photo, screenshot, exported diagram
{ svg: '<svg…>', caption }      // a drawing, which enters the document
{ example: { language, file, parts: [{ code, note }], output } }
```

**Why image and svg are separate things.** A diagram exported as a PNG is born
with a background, and that background is wrong on half the visits: the portal
has a light theme and a dark one, and the student switches. A concept diagram —
which is lines and labels — goes inline and inherits the theme's colour. Photos
and screenshots stay files. (The `svg` is not escaped: it is our own markup,
written in the content file. It is the field that will need sanitising the day
the content comes from outside, and the comment in the code exists so that
question does not slip by.)

**The `example` is [Go By Example](https://gobyexample.com)'s shape:** the
explanation on one side, the program on the other, each note at the height of the
snippet it comments on. It earns a block of its own because **a paragraph between
two snippets breaks the program** — the reader loses the thread that this is one
single file.

The first version here got two things wrong, and both were fixed:

1. **The note goes on the left, the code on the right.** You read the explanation
   and then look to the side, which is the order in which a person learns. With
   the code first, they read something they do not yet know what it is.
2. **There is no line between the snippets.** The borders turned the program into
   a table of fragments — exactly what this block exists to avoid. The right
   column has to look like a file, and continuity is the whole argument. There is
   a test that measures whether the snippets join with no gap.

### One door out, and it is the copy button

The only thing a student can put on the clipboard is code, through that button.
Selecting a paragraph and pressing Ctrl+C does nothing: the content is
`user-select:none`, and a document-level listener cancels `copy` and `cut`
anywhere outside a field. The button is unaffected, because it writes with
`navigator.clipboard` and never fires a `copy` event — and when the
`execCommand` fallback runs, its off-screen textarea *is* a field, so it passes
through the same exemption.

**What the student writes stays theirs.** Name, e-mail, password, search, notes
and every answer field, the code editor included, remain selectable, copyable
and pasteable. That work is not the school's content, and a field you cannot
select is a field you cannot fix a typo in. Blocking paste there was considered
and left out: it breaks password managers, and it stops someone pasting a
solution they wrote in their own editor — which is not the thing being
protected.

**This is friction, not protection, and the repository makes that obvious.**
`portal-student.html` ships every lesson inline, so view-source, DevTools or
JavaScript turned off all read the whole course. What actually protects content
is a server that does not serve what the student has not bought — Stage 2's job,
not this layer's. It is worth writing down so nobody later mistakes the one for
the other.

**The cost is real, and it is not the usual one.** Screen readers still read,
find-in-page still finds, browser translation still translates — none of them
need a selection. What is lost is the reader who highlights a line to keep their
place, and the one who copies an unfamiliar term to go look it up. That second
one is a student doing exactly what a school wants.

Right-click is **not** blocked. It stops nobody who knows Ctrl+U, and it breaks
"open in a new tab" for every link on the page.

### The copy button hands over the file, not the fragment

Every code component has a button in the top-right corner, as on
gobyexample.com: the annotated `example`, the prose code block and the given
code of a `expected-output` exercise.

**In an `example` it copies the WHOLE program.** The block cuts the file into
snippets precisely so each one can carry a note beside it — that is the entire
argument for the shape. A button that handed over the snippet under the cursor
would answer a question nobody asked; the reader wants the program. So it
gathers every `.example-code` in order and joins them back. The output block is
deliberately *not* copyable: it is what the program prints, not something
anyone pastes into an editor.

It reads `textContent` and never `innerHTML`. The snippets have been through
the highlighter and are wrapped in `<span>`s, so reading the markup would paste
the colours along with the code; `textContent` also decodes what `esc()` wrote,
which is the round trip that returns exactly what the author typed. A test
checks that what leaves carries no markup.

**Two ways to write, because of `file://`.** The portal has to work opened off
disk — that is what the bundle exists for. `navigator.clipboard` is available
there in Chromium and Firefox, which treat `file://` as a secure context
(measured in both, not assumed), but it also rejects when the document is not
focused or the permission is denied. So the async API is tried first and the
old `execCommand` selection is the fallback.

**And when both fail, the button says so.** Always showing the check would be
easy and nobody would notice until they pasted. It is the same rule the grading
follows at the other end of the portal: not checked never becomes passed, so
not copied never becomes copied. That also makes the test cheap — the `copied`
class only appears when the write resolved, so asserting the class proves the
copy happened, with no clipboard-read permission needed.

One listener for the whole document, not one per block: code blocks are rebuilt
on every section change and every language switch, and a listener per block
would leak one on each rebuild — the same reasoning the graph already follows
with its edge highlight.

Below 1466px the two columns become one, with the note *before* the snippet — and
it is the same cut at which the whole lesson goes back to the narrow column.
These are not two decisions: it is the block's width that defines the lesson's
width, by the arithmetic described in *The lesson has one width*.

**The syntax highlighting has three colours, and they are the brand's:** red for
the language's structure, blue for the literals, white for the rest — comments in
the muted grey. There is no fourth: an editor palette with ten tones inside a
course page competes with the content instead of helping to read it.

It **is not a parser**, and the code says so: it is a regular-expression sweep
with the alternatives in order of precedence — comment before string, string
before everything — so that nothing gets highlighted inside a literal. It gets
wrong the cases a parser would get right, and it gets them wrong by returning
text with no colour, never wrong text. It lives in `text.js` and not in a module
of its own for a mechanical reason: it needs `esc`, and separating them would
create an import cycle that `bundle.py` refuses.

### Where it pays off most: the JavaScript course

In `web-fundamentals` the subject is concepts and prose is enough. In `html-css`
the code appears in short fragments. In `javascript` the subject is a
**language**, and a language is learned by reading programs — the first four
lessons were written almost entirely in `example`.

**Every example has to run**, and there is a tool to guarantee that:

```sh
node tools/examples/check.mjs
```

It concatenates each block's `parts[].code`, executes it in a real Node and
compares against the `saida` written in the content. On its first run it caught
two real defects, neither of which would show up by reading the text: the arrow
functions example **blew up halfway through** (`this.n` with `this` undefined in
an ES module) and listed the output of two `console.log` calls that were not even
in the program; and the `this` example aborted at the `TypeError` before reaching
the line that was the lesson.

An example with invented output is worse than no example at all: it teaches the
wrong thing with the authority of someone who showed the result, and the student
only finds out in their own console.

## Supporting material

The section references material by key (`materials: ['wf-dns-cheatsheet']`); the
record with title, type and size lives in `window.MATERIALS`. The indirection
exists for one day only: when the file leaves the `data:` URI and becomes a
signed bucket URL, the record changes — not one line of content has to be
rewritten.

The sample PDFs are **generated**, not committed
(`tools/materials/generate.py`). Their text is versioned and readable in the
diff; the binary is output. And they come inlined as `data:` URIs because the
portal has to work opened off disk — a link to `assets/something.pdf` dies after
the bundle. They are hand-written PDFs, no dependency, ~3 KB each.

The link uses `download`, and not `target`: opening the PDF in the built-in
viewer takes the student out of the lesson.

## The content does not live inside a card

The section's prose was a `.block`: background, border, rounded corner. That
draws a border between "the content area" and "the rest" — and the rest is
nothing, it is the margin left over from centring. Separating text from emptiness
is not a distinction worth a line on screen.

A card is for what gets **compared side by side**: courses, materials, the blocks
on the course page. Running text meant to be read for half an hour wants the
opposite — nothing around it. The figures, the code and the video kept their
frame, and now it means something ("this here is not prose"), which it could not
say while it lived inside another frame.

The rail got some air too: the items had 2px of slack between 8px lines, and a
list of thirteen lessons with the sections open became a wall read line by line.
The air between the items is what makes a menu **consulted** rather than read.

## The certificate is a document, not a window

It was born reusing the vitrine's `.term-bar` — the three dots and the file name.
That is the right frame for a code panel and the wrong one for this: the
certificate is the **only artefact of the portal that leaves here**, and it goes
to a profile, an email attachment, a job application. No document has a window
bar on top.

The shape is now a diploma's — issuer at the top, "certifies that", the name of
whoever receives it in a large size, what was completed, and a footer with date
and code. The identity is still the school's (same typography, same phosphor, the
brand LED), applied to a document instead of to a window. The smoke suite keeps
the regression: `.cert .term-bar` has to keep matching zero elements.

## Account: email, password and plan

**Email and password are two forms, not fields of one "save".** The two
operations have different consequences, different confirmations and, on the
server, different endpoints; merging them would let a person change one by
accident.

Two decisions the code records and the screen repeats to the student:

- **The password is not stored anywhere.** There is no client-side hash worth
  anything, and writing it to `localStorage` would be worse than having no screen:
  it would give the impression that authentication exists. What stays is the date
  of the change. The test searches the whole storage for the typed password and
  fails if it finds it.
- **Email validation is loose on purpose** — "has an at sign, has a dot after it,
  no spaces". A strict rule rejects valid addresses (`+`, a new TLD, an accent)
  and prevents nothing: what confirms that the address exists is the message sent
  to it.

**My Plan compares by feature, not by price card.** Three cards side by side with
independent lists is the format of a *sales* page, for someone who has not chosen
yet. Someone who already subscribed has a different question — "what do I **not**
have?" — and the table answers that one, because it aligns the same row across
the three plans.

The plans in `assets/plans.js` are deliberate fiction with the right shape: price,
cycle and billing belong to a payment service. And **nothing is locked by plan
today**: locking requires a server, and with the state in the browser any lock
would be theatre — you would only have to edit a key. The screen says so.

## Space: the graph, the arrows and the reading column

Three adjustments that are the same idea — **let the emptiness do some work**:

**The graph breathes.** The vitrine uses 48px between the levels, and there that
is enough: the graph is one of the seven screens and disappears after a single
scroll. Here it is the screen the student comes back to in order to get their
bearings, and at 48px the edges shave past the cards. They do not collide — the
test's collision detector still reports zero — but the eye does not separate one
column from the next. They went to 88px, and the trade is horizontal scrolling,
which the graph had already solved (arrows and a fade at the borders).

**The navigation arrows moved into the screen's leftover.** The reading column is
820px and is centred in the area the rail leaves; what remains on both sides is
space no content uses. It is exactly where a navigation control belongs: close
enough to be reached, far enough not to fight for the line with the word being
read.

```
gap on each side = (100vw - rail - column) / 2
left arrow  → centred in the gap between the rail and the column
right arrow → centred in the gap between the column and the screen edge
```

The rail and the column became **CSS variables** (`--rail`, `--screen`) because
the arrow's position derives from both — and a number repeated in two places
diverges. It already diverged once, in the content's padding, and it cost 2px of
horizontal scrolling on the phone. It is `--screen` and not `--reading`: when the
lesson widens the gap shrinks, and an arrow positioned by the narrow column would
sit on top of the wide one's content.

## The tab is called codeschool.ing, and nothing else

The tab's title used to say where the student was — *"ES6+ syntax: let/const,
arrow functions and template strings · codeschool.ing"*. The effect was the
opposite of the one intended: in a window with several tabs, the browser truncates
the title from the end, and what was left was the beginning of the lesson's name.
The brand — which is what one looks for when coming back here — never showed.

Now the name is constant. The HTML's `<title>` and the router say the same thing,
because the first paint comes from one and every other from the other.

**The screen's name was not lost.** It was `document.title` that announced the
screen change to the screen reader; freezing the tab without passing that name on
would leave the navigation mute for whoever cannot see. The `title` each screen
returns now names the content region (`aria-label` on the `<main>`), which is
what gets announced when the content changes. A test walks nine routes of
different natures — including the not-found page, which leaves the router by a
path of its own — and checks both things.

## The certificate opens big

Clicking a certificate enlarges it over the rest of the screen, with the
background dimmed and **frozen** — the vitrine's own modal, reused whole. The
freezing is `overflow:hidden` on the document and not JavaScript, for the reason
`base.css` already recorded: trapping only the wheel and the touch let through
the scrollbar, the trackpad's inertia and the arrow keys inside a field.

Above the box, to the right, are the actions. There are two, and they do different
things:

| button | what it does |
| --- | --- |
| the LinkedIn icon | opens the *licenses and certifications* form pre-filled — name, institution, month, year and code |
| **Share** | publishes a post with the validation link |

The first is **only the icon**: LinkedIn's brand is recognised without a caption,
and the label took up half the strip to say what the drawing already says. The
text did not disappear — it went to the `aria-label` and the `title`, which is
what the screen reader announces and what the cursor shows. A test fails if the
button goes mute.

The colour is their brand's, `#0A66C2`, on the light theme. On dark it gives
2.5:1 of contrast against the panel — below the 3:1 an icon needs — so the dark
theme lightens it. Lightening a brand's colour is not a liberty: it is what makes
it visible, and invisible it represents no brand at all.

The first is what the person actually wants: a certificate on a profile is a
credential; a post disappears from the feed in two days.

The `certUrl` points at a validation page that **exists**: the backend serves
`GET /certificate/{code}` as server-rendered HTML — the one route over there that
answers without a session, because what opens it is a person checking a claim or
a crawler building a preview card, and neither is served by a hash-routed
single-page app. The URL was built in this format before that route existed, on
purpose: the day the server arrived could not also be the day of discovering the
format was different. A test checks that the seven fields LinkedIn expects are
there and that the code in the URL is the one printed on the document — a
malformed URL would only give a signal on LinkedIn's site.

A **sample certificate does not share**. The sentence that said so left the inside
of the modal — it explained, but stole the whole strip to explain something nobody
had asked. The button stayed, **disabled**, with the reason in the `title` and the
`aria-label`. Of the three possible outcomes — hide the button, leave it working,
disable it with a reason — only the last one does not lie: hiding makes it look
like the function does not exist, and working would publish a credential nobody
earned.

## The certificate on a phone

The certificate modal overflowed the screen on both axes at 390px, and the cause
was not the certificate: it was `.modal`, which is `display:grid;
place-items:center` with the track at `auto`. In an `auto` track,
`width:min(1040px,100%)` resolves against the child's own `max-content` — the
arithmetic bites its own tail and limits nothing. The track became
`minmax(0,1fr)`, which is the `0` floor that was missing, and the vertical
alignment moved out of `place-items` into `margin:auto 0` on the stack, so the
document can scroll when the certificate is taller than the screen instead of
bursting out top and bottom. Below 640px the document tightens up too: less
padding, smaller type, and the footer on two lines. A test measures the sheet
inside a 390×844 and fails if it goes past the width or hangs off the bottom.

## Two rows that scroll, and one colour that separates

**The catalogue's categories gained arrows.** There are nine, and not even with
the rail closed do they fit on one line: the last ones were clipped at the border
with nothing saying there was more. The structure is the vitrine's —
`.chips-box` with an arrow on each side and a fade at the ends — and `base.css`
already carried the style for all three pieces. Reimplementing it would mean
maintaining two of everything. When everything fits, the arrows disappear: a
disabled arrow that never does anything is noise.

**The search's group label became red.** In blue it blended with each result's
context, which is also blue and also monospaced, and the list became a single
column. It is the only line there that is not a result — it is the divider
between them, and it deserves the brand's other colour.

## Four traps that only showed up on screen

They are on the record because none of them appears by reading the code:

1. **`base.css` styles the `nav` element**, not a class — the vitrine has exactly
   one. The portal has three (bar, rail, breadcrumbs), and the two inner ones
   inherited `position:fixed` and became a second bar on top of the content.
   Neutralised in `portal.css`, and not in `base.css`, which has to stay syncable
   with the vitrine.
2. **`[hidden]` loses to `.btn{display:inline-flex}`** — the browser's rule has
   zero specificity. The "Try again" button showed up before there was anything to
   redo.
3. **The browser does not know the page is dark.** The portal is dark because the
   CSS paints everything dark — and none of that counts for the browser, which
   keeps drawing what is *its own* with the system theme: the scrollbar, the
   `<select>`, the search field's clear button. `color-scheme` was missing.

   The symptom is not the same everywhere, and that is how it slipped through: in
   Firefox the thin bar is discreet enough that nobody notices; in Chromium — and
   therefore in Brave, Chrome and Edge — it is a light grey strip in the middle of
   a dark screen. One defect, visible in half the browsers.

   The vitrine already knew half of this: where it leaves a bar on show
   (`.courses-scroll`), it declares `scrollbar-width` **and** `scrollbar-color`
   together. The portal's rail had copied only the first. Now there is
   `color-scheme` at the root following the theme, the colour declared on every
   scrollable container, and a test that **sweeps the whole page** looking for any
   element that scrolls with the system colour — instead of a hand-written list
   that ages.

4. **`base.css` never resets the `button` element** — every vitrine component
   declares its own background (`.theme`, `.burger`, `.nav-cta`). Every new button
   has to declare its own, otherwise it inherits the browser's light grey. That is
   what left the magnifier, the avatar and the ordering arrows white on the dark
   theme: one symptom, three places, one cause.

## English is the source language

**The whole product is English**: identifiers, file and directory names, every
comment, this and every other document, the DOM contract, the routes, the
catalogue and the wire contract with the backend.

**Portuguese was not deleted — it changed role.** It used to be the base, which
is why it needed no dictionary: every translation key WAS the Portuguese string.
It is now the fifth translation, alongside Spanish, French and Italian:

| file | holds |
| --- | --- |
| `assets/i18n-pt.js` | the interface in Portuguese |
| `assets/i18n-courses-pt.js` | the catalogue in Portuguese — names, summaries, syllabus, topics, prerequisites, and the tracks |

The `en` dictionaries are gone: they would have been identity maps. A missing
entry in any language falls back to the key, and the key is already the string
to show. Browser detection falls back to English.

### The three things that could not simply be renamed

**The persisted state.** Renaming `progresso` to `progress` does not raise an
error — the read finds nothing, falls back to the empty shape, and the portal
reports a student who never started. `migrate()` in `state.js` rewrites the
document on read, once, and is idempotent by construction: it fires only when a
legacy key is present, and the new shape has none. It moves the top-level keys,
every nested field, the exam scope keys (`curso:` → `course:`) and the stored
plan ids. `tools/migration/check.mjs` seeds a real browser with a pre-rename
document and asserts every value came across, field for field.

**The join key.** Content is matched by course plus topic title. The catalogue
is authored in English now, so the lesson files and the exercises had to adopt
the English title in the SAME commit — split across two, all 41 exercises would
have unjoined from their lessons without a single error anywhere.

**The certificate path.** `/certificado/` became `/certificate/`, which is free
today only because no certificate has been issued to a real student. It is built
into the LinkedIn "add to profile" URL, so the day one exists, the path is
permanent.

### What is still Portuguese, and it is content

The authored prose of the lessons and the exercises — statements, hints,
explanations, the notes beside each code snippet — and the study material the
PDF generator writes. That is content, and content belongs in the translation
layer like the catalogue does. It has no English version yet, so it is the one
piece of this rename that is authoring rather than inversion.

The comments inside the code an `example` or a `{ code }` block TEACHES also
stay: a Brazilian student reads them, and they are the lesson.

## What comes next

- **A server**: authentication, per-student progress, code execution in a
  disposable container and the CAS for `expression-answer`.
- **Real content**: reconnect `tools/exercises` from the vitrine's repo and
  ingest the approved JSON, starting with the `_verification: critiqued` ones.
- **The videos.** The frame is already reserved in the sections that declared
  `video`, with the duration and the edge-to-edge layout ready. Only the id is
  missing.
- **The INTERMEDIATE unit of certification.** Two already exist: course and track.
  What is missing is knowing whether there is something between a 40h course and a
  400h track. The vitrine's README leaves four questions open about it — the axis,
  the name, the anchor and the translation cost — and records the trap: cutting by
  level would repeat the Go case's mistake. The cost only jumps at the first
  certificate issued to a real student.
- **A separate exam question bank**, if and when drawing from the lessons' bank
  stops being enough. Today it is enough and costs no maintenance at all.
