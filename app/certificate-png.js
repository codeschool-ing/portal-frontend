/* ==========================================================================
   The certificate, as a PNG.

   WHY A CANVAS AND NOT A SCREENSHOT OF THE CARD. The usual trick — wrap the
   DOM in an SVG <foreignObject> and draw that to a canvas — loses exactly what
   a certificate is made of. Fonts referenced from a stylesheet do not load
   inside the SVG image context, so the document comes out in Times while the
   screen shows Space Grotesk, and the person only finds out after sending it
   to somebody. Drawing it here costs a layout written twice and gets a file
   that looks like what they were shown.

   IT READS THE CARD, NOT THE DATA. Every string comes out of the element the
   student is looking at, so the PNG is in the language they are reading, with
   the grade they earned and the date they saw. There is no second source that
   could disagree with the first.

   AND IT READS THE THEME. The colours come from the live custom properties, so
   whoever studies in the light theme gets a light certificate. This is the one
   place a fixed palette was tempting — a document is forwarded, and the person
   receiving it did not pick the theme — but a file that does not look like the
   preview is a bug report, and the preview is what they clicked.
   ========================================================================== */

/* Logical pixels; the bitmap is this times SCALE. 2 is the smallest that still
   reads cleanly when someone drops it into a slide and it gets scaled up. */
const W = 1000;
const H = 580;
const SCALE = 2;
const PAD = 64;

const SANS = "'Space Grotesk', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

/* The fields, read off the card. Anything missing comes back as an empty
   string and simply does not draw — a certificate without a grade is a
   certificate, not an error. */
function readCard(art) {
  const text = (sel) => (art.querySelector(sel)?.textContent || '').trim();
  const lines = [...art.querySelectorAll('.cert-line')].map((n) => n.textContent.trim());
  const foot = [...art.querySelectorAll('.cert-foot > span')].map((n) => n.textContent.trim());
  return {
    brand: text('.cert-brand') || 'codeschool.ing',
    type: text('.cert-type'),
    certifies: lines[0] || '',
    completed: lines[1] || '',
    student: text('.cert-student'),
    course: text('.cert-course'),
    meta: text('.cert-meta'),
    when: foot[0] || '',
    code: text('.cert-code'),
    /* The code as a DATUM, next to the code as a line of text, and they are not
       the same thing. The footer says "no code has been issued" when none was,
       which is right on the document and wrong in a file name — scraping it
       produced `codeschool-ing-nocodehasbeenissued.png`, and something
       different in each of the five languages. The attribute is absent instead
       of being a sentence, which is what a file name can fall back from. */
    id: art.dataset.code || '',
  };
}

/* The theme's own values, so the file matches the screen in both themes. */
function palette() {
  const s = getComputedStyle(document.documentElement);
  const v = (name, fallback) => (s.getPropertyValue(name).trim() || fallback);
  return {
    ink: v('--ink', '#0a0e14'),
    panel: v('--panel', '#111721'),
    wire: v('--wire', '#233043'),
    paper: v('--paper', '#e8e6df'),
    paperDim: v('--paper-dim', '#9aa0a8'),
    phosphor: v('--phosphor', '#5b8cff'),
    phosphorDim: v('--phosphor-dim', '#33549e'),
  };
}

/* Canvas gained `letterSpacing` recently and not everywhere. The tracked
   labels are the ones that carry the document's tone, so they are drawn a
   glyph at a time rather than left to a property that may not exist. */
function tracked(ctx, str, x, y, spacing) {
  let cx = x;
  for (const ch of str) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx - x - spacing;
}

const trackedWidth = (ctx, str, spacing) =>
  [...str].reduce((w, ch) => w + ctx.measureText(ch).width + spacing, 0) - spacing;

/* Wrapping by measurement rather than by character count: a course name is
   proportional text and the two do not agree. */
function wrap(ctx, str, maxWidth) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > maxWidth) { out.push(line); line = word; }
    else line = next;
  }
  if (line) out.push(line);
  return out;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function draw(ctx, d, c, light) {
  ctx.fillStyle = c.panel;
  ctx.fillRect(0, 0, W, H);

  // The corner glow the sheet has in CSS: paper catching light, at no cost.
  const glow = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.9);
  glow.addColorStop(0, hexA(c.phosphor, 0.06));
  glow.addColorStop(1, hexA(c.phosphor, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = c.wire;
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 6);
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';

  /* ---- top: the mark, and what kind of certificate this is ---- */
  const topY = PAD + 10;
  ctx.fillStyle = c.phosphor;
  ctx.beginPath();
  ctx.arc(PAD + 6, topY - 6, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '500 21px ' + SANS;
  // The brand is one word to the eye: "codeschool" in the text colour and
  // ".ing" in the accent, exactly as .cert-brand b does it.
  const brand = d.brand.toUpperCase();
  const cut = brand.lastIndexOf('.ING');
  const head = cut > 0 ? brand.slice(0, cut) : brand;
  const tail = cut > 0 ? brand.slice(cut) : '';
  ctx.fillStyle = c.paper;
  const headW = tracked(ctx, head, PAD + 24, topY, 1.4);
  if (tail) {
    ctx.fillStyle = c.phosphor;
    tracked(ctx, tail, PAD + 24 + headW + 1.4, topY, 1.4);
  }

  if (d.type) {
    ctx.font = '500 13px ' + MONO;
    const label = d.type.toUpperCase();
    const w = trackedWidth(ctx, label, 3.6) + 26;
    ctx.strokeStyle = c.wire;
    ctx.lineWidth = 1.5;
    roundRect(ctx, W - PAD - w, topY - 20, w, 30, 4);
    ctx.stroke();
    ctx.fillStyle = c.paperDim;
    tracked(ctx, label, W - PAD - w + 13, topY, 3.6);
  }

  /* ---- body: the name is the largest thing on the page, because it is what
     the holder looks for first and what the reader looks for after ---- */
  let y = 208;
  if (d.certifies) {
    ctx.font = '400 15px ' + MONO;
    ctx.fillStyle = c.paperDim;
    tracked(ctx, d.certifies.toUpperCase(), PAD, y, 2.4);
    y += 46;
  }

  ctx.font = '500 46px ' + SANS;
  ctx.fillStyle = c.paper;
  for (const line of wrap(ctx, d.student, W - PAD * 2)) {
    ctx.fillText(line, PAD, y);
    y += 54;
  }
  y += 16;

  if (d.completed) {
    ctx.font = '400 15px ' + MONO;
    ctx.fillStyle = c.paperDim;
    tracked(ctx, d.completed.toUpperCase(), PAD, y, 2.4);
    y += 44;
  }

  ctx.font = '500 27px ' + SANS;
  ctx.fillStyle = c.paper;
  for (const line of wrap(ctx, d.course, W - PAD * 2)) {
    ctx.fillText(line, PAD, y);
    y += 34;
  }

  if (d.meta) {
    y += 10;
    ctx.font = '400 15px ' + MONO;
    ctx.fillStyle = c.phosphorDim;
    ctx.fillText(d.meta, PAD, y);
  }

  /* ---- foot: when, and the code that makes it checkable ---- */
  const footY = H - PAD + 6;
  ctx.strokeStyle = c.wire;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD, footY - 30);
  ctx.lineTo(W - PAD, footY - 30);
  ctx.stroke();

  ctx.font = '400 14px ' + MONO;
  ctx.fillStyle = c.paperDim;
  ctx.fillText(d.when, PAD, footY);
  if (d.code) {
    ctx.fillStyle = c.phosphorDim;
    const w = trackedWidth(ctx, d.code, 2.2);
    tracked(ctx, d.code, W - PAD - w, footY, 2.2);
  }

  /* ---- the portal's scanline grain, last so it lies over everything ----
     body::before lays a fixed 4px scanline across the whole viewport, the
     certificate included, so the card on screen wears a faint horizontal
     weave. The file did not — it came out flat, whitest of all in the light
     theme where the page's texture is most visible — and a file that does not
     look like its preview is the one bug this module exists to avoid. Replayed
     here as the same thing it is there: a 1px black band every 4px under
     `multiply`, at the same opacity the overlay uses per theme (.10 light,
     .35 dark). Over the light sheet it darkens into the grain; over the dark
     one it all but vanishes, exactly as it does on the page. */
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = light ? 0.10 : 0.35;
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let ly = 3; ly < H; ly += 4) ctx.fillRect(0, ly, W, 1);
  ctx.restore();
}

/* The glow needs the accent colour at an alpha. The custom properties are hex,
   but a theme could put anything there, so anything not hex falls through to a
   colour the canvas will accept rather than throwing. */
function hexA(colour, alpha) {
  const m = /^#([0-9a-f]{6})$/i.exec(colour.trim());
  if (!m) return alpha === 0 ? 'rgba(0,0,0,0)' : colour;
  const n = parseInt(m[1], 16);
  return 'rgba(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',') + ',' + alpha + ')';
}

/* Renders the card and hands the browser a file to save.
   Returns false when the browser cannot produce one, so the caller can say so
   instead of leaving a button that looks broken. */
export async function downloadCertificatePNG(art) {
  const d = readCard(art);

  /* Without this the first render can land before the web fonts arrive, and
     the file comes out in the fallback face while the screen shows the real
     one — the exact failure this module exists to avoid. */
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch (e) { /* draw with what we have */ }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.scale(SCALE, SCALE);
  draw(ctx, d, palette(), document.documentElement.dataset.theme === 'light');

  const blob = await new Promise((res) => {
    if (canvas.toBlob) canvas.toBlob(res, 'image/png');
    else res(null);
  });
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codeschool-ing-' + (d.id || 'certificate').replace(/[^\w-]+/g, '') + '.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoked on the next frame: revoking immediately races the download in
  // Safari, which has not read the blob yet when click() returns.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
  return true;
}
