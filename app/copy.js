/* ==========================================================================
   Copying a code block to the clipboard.

   ONE LISTENER FOR THE WHOLE DOCUMENT, and not one per block. Code blocks are
   rebuilt on every section change and on every language switch, and a listener
   per block would leak one on each rebuild — the same reasoning the graph
   already follows with its edge highlight. The button carries `data-copiar` and
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

/* Inside an `exemplo` the program is cut into snippets with a note beside each
   one; joining them back is the point — nobody wants a third of a program.
   Inside a `.cod-bloco` there is a single `<pre>`.

   `textContent` and never `innerHTML`: the snippets went through `highlight()`
   and are wrapped in `<span>`s, so reading the markup would paste the colours
   along with the code. It also decodes what `esc()` wrote, which is the round
   trip we want — what is copied is what the author typed. */
export function codeToCopy(button) {
  const example = button.closest('.exemplo');
  if (example) {
    return [...example.querySelectorAll('.exemplo-cod')].map((el) => el.textContent).join('\n');
  }
  const block = button.closest('.cod-bloco');
  const pre = block && block.querySelector('pre.cod');
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
  const label = ok ? txt('código copiado') : txt('não foi possível copiar');
  button.innerHTML = ok ? COPY_ICONS.copied : COPY_ICONS.copy;
  button.classList.toggle('copiado', ok);
  button.classList.toggle('falhou', !ok);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  button.dataset.timer = setTimeout(() => {
    button.innerHTML = COPY_ICONS.copy;
    button.classList.remove('copiado', 'falhou');
    button.setAttribute('aria-label', txt('Copiar o código'));
    button.setAttribute('title', txt('Copiar o código'));
  }, HELD);
}

export function wireCopy() {
  document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copiar]');
    if (!button) return;
    const code = codeToCopy(button);
    if (!code) return;
    flash(button, await toClipboard(code));
  });
}
