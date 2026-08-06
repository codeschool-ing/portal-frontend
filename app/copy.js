/* ==========================================================================
   The clipboard policy: one door out, and it is the code button.

   THE BUTTON IS THE ONLY SANCTIONED WAY OUT. Selecting the prose of a lesson
   and pressing Ctrl+C does nothing; the code button does. Everything below is
   in service of that single rule, and it is worth being precise about what it
   buys, because the file this repository ships makes the limit obvious:
   `portal-student.html` carries every lesson inline, so view-source, DevTools or
   JavaScript turned off all read the whole course. This is friction, not
   protection. What protects content is a server that does not serve what the
   student has not bought — which is Stage 2's job, not this file's.

   WHAT STAYS SELECTABLE: anything the student types into. The name and e-mail
   fields, the password, the search box, the notes, and the answer fields —
   including the code editor. Those hold the student's own work, not the
   school's content, and a field you cannot select is a field you cannot correct
   a typo in. Blocking paste there was considered and left out: it would break
   password managers, and stop someone pasting a solution they wrote in their
   own editor, which is not the thing being protected.

   THE COST IS REAL AND IT IS NOT SECURITY THEATRE'S USUAL ONE. Screen readers
   still read, find-in-page still finds, browser translation still translates —
   none of them need a selection. What is lost is the reader who highlights a
   line to keep their place, and the one who copies an unfamiliar term to go
   look it up. That second one is a student doing exactly what a school wants,
   and it is the price this rule charges.

   Right-click is NOT blocked. It stops nobody who knows Ctrl+U, and it breaks
   "open in a new tab" for every link on the page.

   ---------------------------------------------------------------------------
   Copying a code block to the clipboard.

   ONE LISTENER FOR THE WHOLE DOCUMENT, and not one per block. Code blocks are
   rebuilt on every section change and on every language switch, and a listener
   per block would leak one on each rebuild — the same reasoning the graph
   already follows with its edge highlight. The button carries `data-copy` and
   the document decides what to do with it.

   WHAT GETS COPIED IS DECIDED BY WHERE THE BUTTON SITS, not by an attribute
   holding a copy of the code. An attribute would be a second copy of the same
   text, and the day someone edits the block without editing the attribute it
   would hand over the old program in silence.

   TWO WAYS TO WRITE TO THE CLIPBOARD, and the second is not superstition. The
   portal has to work opened from `file://` — that is what the whole bundle
   exists for. `navigator.clipboard` is available there in Chromium and Firefox,
   which treat `file://` as a secure context (measured, not assumed), but it
   also rejects when the document is not focused or the permission is denied,
   and other engines are not obliged to agree. So the async API is tried first
   and the old `execCommand` selection is the fallback.

   AND IF BOTH FAIL, THE BUTTON SAYS SO. It would be easy to always show the
   check — nobody would notice until they pasted. That is the same rule the
   grading follows on the other side of the portal: not checked never becomes
   passed, so not copied never becomes copied.
   ========================================================================== */
import { COPY_ICONS } from './text.js';

const HELD = 1600;   // how long the button stays in its "copied" state

/* Inside an `example` the program is cut into snippets with a note beside each
   one; joining them back is the point — nobody wants a third of a program.
   Inside a `.code-block` there is a single `<pre>`.

   `textContent` and never `innerHTML`: the snippets went through `highlight()`
   and are wrapped in `<span>`s, so reading the markup would paste the colours
   along with the code. It also decodes what `esc()` wrote, which is the round
   trip we want — what is copied is what the author typed. */
export function codeToCopy(button) {
  const example = button.closest('.example');
  if (example) {
    return [...example.querySelectorAll('.example-code')].map((el) => el.textContent).join('\n');
  }
  const block = button.closest('.code-block');
  const pre = block && block.querySelector('pre.code');
  return pre ? pre.textContent : '';
}

async function toClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* denied, or the document lost focus — try the old way */ }

  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    // off-screen rather than hidden: `display:none` cannot be selected
    field.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(field);
    field.select();
    const done = document.execCommand('copy');
    field.remove();
    return done;
  } catch (e) {
    return false;
  }
}

/* The state is announced, not only drawn. The icon alone says nothing to a
   screen reader, so the accessible name changes with it — and it goes back to
   the original afterwards, because a button permanently called "copied" would
   describe the past instead of what it does. */
function flash(button, ok) {
  clearTimeout(button.dataset.timer);
  const label = ok ? txt('code copied') : txt('could not copy');
  button.innerHTML = ok ? COPY_ICONS.copied : COPY_ICONS.copy;
  button.classList.toggle('copied', ok);
  button.classList.toggle('failed', !ok);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  button.dataset.timer = setTimeout(() => {
    button.innerHTML = COPY_ICONS.copy;
    button.classList.remove('copied', 'failed');
    button.setAttribute('aria-label', txt('Copy the code'));
    button.setAttribute('title', txt('Copy the code'));
  }, HELD);
}

/* A field the student writes in, or the off-screen textarea the fallback above
   builds. Both are places where a selection belongs to the person, not to the
   school, so the clipboard stays theirs. `closest` and not a tag test: the
   event target inside a field is the field, but this also survives the day a
   `contenteditable` shows up. */
const ownField = (node) => Boolean(node?.closest?.('input, textarea, [contenteditable="true"]'));

export function wireCopy() {
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    const code = codeToCopy(button);
    if (!code) return;
    flash(button, await toClipboard(code));
  });

  /* Content does not leave by hand. The button writes with
     `navigator.clipboard`, which fires no `copy` event, so blocking the event
     never blocks the sanctioned path — and when the fallback runs, its
     textarea is a field, so it passes through here too. */
  ['copy', 'cut'].forEach((kind) => {
    document.addEventListener(kind, (e) => {
      if (ownField(e.target)) return;
      e.preventDefault();
    });
  });
}
