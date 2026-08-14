/* ==========================================================================
   Lesson content — JavaScript.

   WHY THIS COURSE USES `example` THE MOST
   In `web-fundamentals` the subject is concepts: what a packet is, why
   propagation takes time. Prose covers it. In `html-css` the code shows up, but
   in short fragments — one selector, three properties.

   Here the subject is a LANGUAGE, and a language is learned by reading programs.
   A three-line snippet teaches the syntax and hides what matters: how the parts
   fit together. The `example` block exists for that — the program runs down the
   left in one piece, the explanation of each fragment sits beside it, and nobody
   has to break the file into paragraphs in order to comment on it.

   THE RULE THAT HOLDS FOR EVERY EXAMPLE HERE: it has to RUN. Every `output` was
   written from what the program actually prints, including the parts that
   surprise — `0.30000000000000004`, `'11'`, `[object Object]`. An example with
   invented output teaches the wrong thing, and the student finds out in their
   own console.

   Join key: course + the topic's text in the source language (see the header of
   lessons-web-fundamentals.js). The Portuguese is in assets/lessons-pt.js.
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {
  javascript: {

    /* --------------------------------------------------------------- 01 */
    'ES6+ syntax: let/const, arrow functions and template strings': [
      {
        // video only: the course's opening, with no text to read along
        id: 'intro',
        title: 'Introduction to the course',
        video: true,
        duration: '03 min',
      },
      {
        id: 'let-const',
        video: true,
        duration: '09 min',
        title: 'let and const: the end of var',
        body: [
          '`var` has two properties nobody asked for: it leaks out of the block it was declared in, and it can be redeclared without complaint. `let` and `const` do neither, and that is why `var` no longer shows up in new code.',
          {
            example: {
              language: 'javascript',
              file: 'scope.js',
              parts: [
                {
                  code: 'if (true) {\n  var old = "I leak";\n  let fresh = "I stay put";\n}',
                  note: 'Both are declared inside the `if`. Only one of them still exists after the closing brace.',
                },
                {
                  code: 'console.log(old);',
                  note: '`var` is FUNCTION-scoped, not block-scoped: it was hoisted to the top of the function and survived the block. That is where nearly every swapped-variable-in-a-loop bug comes from.',
                },
                {
                  code: 'try {\n  console.log(fresh);\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  note: '`let` dies with the block. Outside it the name does not even exist — and the error is a `ReferenceError`, not `undefined`, which is an important difference: failing loudly beats carrying on with rubbish.',
                },
                {
                  code: 'const list = [1, 2];\nlist.push(3);\nconsole.log(list);',
                  note: 'The most common confusion about `const`: it freezes the BINDING, not the value. `list = []` would be an error; changing things inside the array is not. To freeze the contents there is `Object.freeze`.',
                },
              ],
              output: 'I leak\nReferenceError\n[ 1, 2, 3 ]',
            },
          },
          'The practical rule: **`const` by default, `let` when the value really is going to change, `var` never.** Starting from `const` makes the compiler warn you when you reassign by accident — and most of the reassignments we write without thinking are accidents.',
        ],
      },
      {
        id: 'arrow',
        title: 'Arrow functions, and what they do not have',
        body: [
          'The arrow shortens the writing, but that is the least important part. What really changes is that it **has no `this` of its own** — it uses the `this` of wherever it was written.',
          {
            example: {
              language: 'javascript',
              file: 'arrow.js',
              parts: [
                {
                  code: 'const double = n => n * 2;\nconsole.log(double(4));',
                  note: 'One parameter, one return: no parentheses, no `return`, no braces. It is the form that shows up inside `map` and `filter` all the time.',
                },
                {
                  code: 'const pair = (a, b) => ({ a, b });\nconsole.log(pair(1, 2));',
                  note: 'Returning an object requires the parentheses around it. Without them, `{` is read as the start of a block, and the function returns `undefined` — silently.',
                },
                {
                  code: 'const counter = {\n  n: 7,\n  plain() { return this.n; },\n  arrow: () => (typeof this === "undefined" ? "no this" : "outer this"),\n};',
                  note: 'The difference that matters. The plain function gets `this` from whoever CALLED it; the arrow inherited the `this` of the place where it was WRITTEN — and in an ES module that place has no `this` at all.',
                },
                {
                  code: 'console.log(counter.plain());\nconsole.log(counter.arrow());',
                  note: 'The arrow cannot even see the object it is a property of. That is why it is excellent for a callback — it carries the outer `this` along — and terrible for a method.',
                },
              ],
              output: '8\n{ a: 1, b: 2 }\n7\nno this',
            },
          },
        ],
      },
      {
        id: 'template',
        title: 'Template strings',
        body: [
          'Backticks instead of quotes, `${}` to interpolate, and a line break counts literally. Concatenation with `+` disappears, which is where the missing spaces are born.',
          { code: 'javascript', text: 'const name = "Ana";\nconst n = 3;\n\nconsole.log(`${name} finished ${n} ${n === 1 ? "course" : "courses"}.`);\n// Ana finished 3 courses.' },
          'Interpolation accepts **any expression**, not just a variable — a function call, a ternary, an operation. What it must not receive is user text destined to become HTML: that is where interpolation turns into the hole, and it is why this portal has an `esc()` in `app/text.js`.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Types, coercion, strict equality and falsy values': [
      {
        id: 'coercion',
        title: 'Coercion: when the language guesses',
        body: [
          'JavaScript converts types on its own when an operator receives something it did not expect. That solves small conveniences and creates the language\'s biggest surprises.',
          {
            example: {
              language: 'javascript',
              file: 'coercion.js',
              parts: [
                {
                  code: 'console.log(1 + "1");\nconsole.log(1 - "1");',
                  note: '`+` is overloaded: with a string on one side it CONCATENATES. `-` has no such ambiguity, so it converts to a number. The same pair of values, two results of different natures.',
                },
                {
                  code: 'console.log([] + {});\nconsole.log([1, 2] + [3]);',
                  note: 'An object becoming a string goes through `toString()`. An array\'s joins with commas; a plain object\'s returns `[object Object]`. That is why that message shows up on screen sometimes.',
                },
                {
                  code: 'console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);',
                  note: 'This is not a JavaScript bug: it is IEEE-754 floating point, and it holds the same in Python, Java and C. Money is stored in whole cents, never in a `float`.',
                },
                {
                  code: 'console.log(Number("12px"));\nconsole.log(parseInt("12px", 10));',
                  note: '`Number` is all or nothing; `parseInt` reads as far as it can and stops. Reading a width out of CSS calls for the second — and the `10` is not optional out of habit, it is what avoids the wrong base.',
                },
              ],
              output: '11\n0\n[object Object]\n1,23\n0.30000000000000004\nfalse\nNaN\n12',
            },
          },
        ],
      },
      {
        id: 'equality',
        video: true,
        duration: '08 min',
        title: '== against ===',
        body: [
          '`==` compares after converting; `===` compares without converting. The `==` table has cases nobody memorises, and the conclusion is simple: **use `===` always.**',
          {
            example: {
              language: 'javascript',
              file: 'equality.js',
              parts: [
                {
                  code: 'console.log(0 == "");\nconsole.log(0 == "0");\nconsole.log("" == "0");',
                  note: 'All three with `==`. Note that the first two are true and the third is false: `==` **is not transitive**, which is enough to rule it out.',
                },
                {
                  code: 'console.log(null == undefined);\nconsole.log(null === undefined);',
                  note: 'The one exception worth knowing: `x == null` is the short way of asking "is it `null` or `undefined`?". It is the only defensible use of `==`.',
                },
                {
                  code: 'console.log(NaN === NaN);\nconsole.log(Number.isNaN(NaN));',
                  note: '`NaN` is the only value different from itself. Testing with `===` never works; the right question is `Number.isNaN`.',
                },
              ],
              output: 'true\ntrue\nfalse\ntrue\nfalse\nfalse\ntrue',
            },
          },
        ],
      },
      {
        id: 'falsy',
        video: true,
        duration: '11 min',
        title: 'The eight falsy values',
        body: [
          'In an `if`, any value becomes a boolean. **Eight** of them become `false` — and everything else becomes `true`, including `[]`, `{}` and `"0"`:',
          [
            '`false`, `0`, `-0`, `0n` (BigInt zero)',
            '`""` (the empty string)',
            '`null`, `undefined`, `NaN`',
          ],
          'The practical trap is that `0` and `""` are falsy: `if (quantity)` ignores a quantity of zero, and `if (name)` ignores an empty name — in both cases treating "exists and is zero/empty" as "does not exist".',
          {
            example: {
              language: 'javascript',
              file: 'falsy.js',
              parts: [
                {
                  code: 'const config = { retries: 0, title: "" };',
                  note: 'Two legitimate values that happen to be falsy. Zero retries is a decision; an empty title is one too.',
                },
                {
                  code: 'console.log(config.retries || 3);\nconsole.log(config.title || "no title");',
                  note: 'The classic `||` runs over both: it tests "is it falsy?", not "is it absent?". The zero the user chose became three.',
                },
                {
                  code: 'console.log(config.retries ?? 3);\nconsole.log(JSON.stringify(config.title ?? "no title"));',
                  note: '`??` only kicks in for `null` and `undefined` — the zero and the empty string pass through untouched. It is the operator most default-value `||`s really wanted to be. (The `JSON.stringify` is there only so the empty string shows as `""` instead of a blank line.)',
                },
              ],
              output: '3\nno title\n0\n""',
            },
          },
        ],
        materials: ['js-coercion-table'],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Objects, arrays, spread and destructuring': [
      {
        id: 'destructuring',
        title: 'Destructuring',
        body: [
          'Pulling fields out of an object or items out of an array without repeating the source name on every line. It is the syntax that shows up most in modern code after the arrow.',
          {
            example: {
              language: 'javascript',
              file: 'destructure.js',
              parts: [
                {
                  code: 'const course = { id: "js", name: "JavaScript", hours: 80 };',
                  note: 'The starting object.',
                },
                {
                  code: 'const { name, hours } = course;\nconsole.log(name, hours);',
                  note: 'The names on the left are the KEYS, not positions. Order does not matter; spelling does.',
                },
                {
                  code: 'const { name: title, level = "open" } = course;\nconsole.log(title, level);',
                  note: 'Two things at once: renaming on the way out, and a default for the key that does not exist. The default only kicks in when the value is `undefined` — `null` goes straight through.',
                },
                {
                  code: 'function summary({ name, hours }) {\n  return `${name}: ${hours}h`;\n}\nconsole.log(summary(course));',
                  note: 'Destructuring in the PARAMETER is where it pays off most: the signature starts documenting what the function uses, instead of taking an opaque `options`.',
                },
              ],
              output: 'JavaScript 80\nJavaScript open\nJavaScript: 80h',
            },
          },
        ],
      },
      {
        id: 'spread',
        video: true,
        duration: '09 min',
        title: 'Spreading and gathering',
        body: [
          'The same three dots do opposite things depending on which side they are on: on the right they **spread**, on the left they **gather**.',
          {
            example: {
              language: 'javascript',
              file: 'spread.js',
              parts: [
                {
                  code: 'const base = { theme: "dark", language: "pt" };\nconst fresh = { ...base, language: "en" };\nconsole.log(fresh);',
                  note: 'A copy with a change, without touching the original. The order decides who wins: the last repeated key overwrites — which is why `language` comes out as `en`.',
                },
                {
                  code: 'const a = [1, 2];\nconst b = [0, ...a, 3];\nconsole.log(b);',
                  note: 'The same for an array, keeping the order. It replaces `concat` and the old `push.apply`.',
                },
                {
                  code: 'function sum(...numbers) {\n  return numbers.reduce((t, n) => t + n, 0);\n}\nconsole.log(sum(1, 2, 3, 4));',
                  note: 'On the other side: here the dots GATHER the arguments into a real array. It is the replacement for `arguments`, which was not an array and does not exist in an arrow function.',
                },
                {
                  code: 'const orig = { owner: { name: "Ana" } };\nconst copy = { ...orig };\ncopy.owner.name = "Bia";\nconsole.log(orig.owner.name);',
                  note: 'The gotcha: the copy is SHALLOW. The inner object is still the same one, and changing it changes both. For a deep copy there is `structuredClone`.',
                },
              ],
              output: "{ theme: 'dark', language: 'en' }\n[ 0, 1, 2, 3 ]\n10\nBia",
            },
          },
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Functions, scope, closures and the value of `this`': [
      {
        id: 'closure',
        title: 'Closure: the function that remembers',
        body: [
          'A function created inside another one goes on seeing the outer one\'s variables, even after the outer one has finished. That is not an advanced feature: it is what makes callbacks, `setTimeout` and almost every module pattern work.',
          {
            example: {
              language: 'javascript',
              file: 'closure.js',
              parts: [
                {
                  code: 'function counter() {\n  let n = 0;',
                  note: '`n` lives inside `counter`. Nobody outside can touch it — there is no `private`, and none is needed.',
                },
                {
                  code: '  return {\n    increment: () => ++n,\n    read: () => n,\n  };\n}',
                  note: 'Both arrows close over the same `n`. Returning functions instead of the value is what turns scope into encapsulation.',
                },
                {
                  code: 'const c = counter();\nc.increment();\nc.increment();\nconsole.log(c.read());',
                  note: '`counter()` returned long ago, and `n` is still alive — because somebody still references it. The garbage collector decides, not the call stack.',
                },
                {
                  code: 'const other = counter();\nconsole.log(other.read());',
                  note: 'Every call creates a NEW scope. Two counters share nothing, which is what separates a closure from a global variable.',
                },
              ],
              output: '2\n0',
            },
          },
        ],
      },
      {
        id: 'this',
        video: true,
        duration: '13 min',
        title: 'The value of this',
        body: [
          '`this` is not decided where the function is written, but **where it is called** — with one exception, the arrow function. Almost every `this` bug is the same function having been separated from its object.',
          {
            example: {
              language: 'javascript',
              file: 'this.js',
              parts: [
                {
                  code: 'const student = {\n  name: "Ana",\n  hello() { return `hi, ${this.name}`; },\n};\nconsole.log(student.hello());',
                  note: 'Called as a method: `this` is whatever is to the left of the dot.',
                },
                {
                  code: 'const loose = student.hello;\ntry {\n  console.log(loose());\n} catch (e) {\n  console.log(e.constructor.name);\n}',
                  note: 'The SAME function, called with no owner. In an ES module `this` is `undefined`, and reading `.name` off it blows up. It is exactly what happens when you pass `obj.method` as a callback — and the `try` is here only so the example keeps running.',
                },
                {
                  code: 'const bound = student.hello.bind(student);\nconsole.log(bound());',
                  note: '`bind` ties `this` down once and for all. The modern alternative is to pass an arrow: `() => student.hello()`, which carries the outer context along.',
                },
              ],
              output: 'hi, Ana\nTypeError\nhi, Ana',
            },
          },
        ],
        materials: ['js-this-map'],
      },
    ],
  },
});
