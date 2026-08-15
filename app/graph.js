/* ==========================================================================
   The track graph, now as a PROGRESS MAP.

   The drawing is the vitrine's — `graphFlow`, `splitLevels` and `drawEdges` came
   from there almost unchanged, the only difference being that they take the root
   as a parameter instead of reaching for a global. What changed is what the
   cards say: instead of "this course exists", they say "you have done this one".

   KEEP THEM IN STEP WITH `assets/script.js` OVER THERE. The first copy was taken
   before the vitrine grew the portrait transposition, the corridor threading and
   the re-packing pass, and stopping at "it works here" cost all three: on a
   window taller than it is wide the CSS turned the layout and the router did
   not, so every track drew a tangle — 144 crossings across seventeen tracks, and
   nothing threw. A router is only exercised by the shapes it is given, which is
   why the smoke suite now measures it in three window shapes and not one.

   IT SHOWS, BUT IT DOES NOT LOCK. The vitrine's FAQ promises, in writing: "No.
   The track is a recommended order — if you only need one course from it, watch
   just that one." A padlock here would contradict a promise that is already
   published, which is why the most restrictive state is called `ahead` and
   stays clickable: it tells you the recommended order, it does not forbid
   access.

   The class names, the `data-*` attributes and the course states (`done`,
   `current`, `available`, `ahead`) are the DOM contract that base.css styles.
   base.css is the vitrine's stylesheet with its selectors renamed to English;
   the shapes and the cascade are untouched.
   ========================================================================== */

import {
  trackGraph, courseById, tracksWithCourse, trackPath, hoursOf, hoursRange,
} from './catalog.js';
import { courseDone, courseProgress, activeOption, now } from './state.js';
import { esc } from './text.js';

/* ---------- the state of each course ---------- */

export function courseState(id) {
  if (courseDone(id)) return 'done';
  const p = courseProgress(id);
  if (p.done > 0) return 'current';
  const deps = courseById(id)?.requires || [];
  const ready = deps.every((d) => courseDone(d));
  return ready ? 'available' : 'ahead';
}

const STATE_LABEL = {
  done: 'completed',
  current: 'in progress',
  available: 'available',
  ahead: 'further ahead',
};

/* ---------- the cards ---------- */

function courseCard(id, order, deps) {
  const c = courseById(id);
  if (!c) return '';
  const trackCount = tracksWithCourse(id).length;
  const requires = (deps || []).map((d) => courseById(d)?.name).filter(Boolean);
  const p = courseProgress(id);
  const st = courseState(id);

  return (
    '<button class="course-node node-' + st + '" type="button" data-course="' + esc(c.id) + '" data-node="' + esc(c.id) + '">' +
      (order ? '<span class="order">' + txt('level') + ' ' + order + '</span>' : '') +
      '<span class="node-state" data-state="' + st + '">' + txt(STATE_LABEL[st]) + '</span>' +
      '<span class="name">' + esc(c.name) + '</span>' +
      (trackCount > 1 ? '<span class="tag-shared">' + txt('in') + ' ' + trackCount + ' ' + txt('tracks') + '</span>' : '') +
      '<span class="meta">' + c.hours + 'h · ' + txt(c.level) + '</span>' +
      (p.total
        ? '<span class="node-bar" role="img" aria-label="' + p.done + ' ' + txt('of') + ' ' + p.total + '">' +
            '<span class="node-bar-fill" style="width:' + p.pct + '%"></span>' +
          '</span>' +
          '<span class="node-count">' + p.done + '/' + p.total + ' ' + txt('sections') + '</span>'
        : '') +
      (requires.length && st === 'ahead'
        ? '<span class="requires">' + txt('recommended after') + ' ' + esc(requires.join(' + ')) + '</span>'
        : '') +
    '</button>'
  );
}

/* ---------- the whole panel ---------- */

export function buildTrack(t) {
  const path = trackPath(t, activeOption);
  const hours = hoursOf(path);
  const { min, max } = hoursRange(t);
  const g = trackGraph(t, activeOption);

  const done = path.filter((id) => courseDone(id)).length;

  const columns = g.columns.map((nodes, v) => {
    const cards = nodes.map((node) => {
      if (node.kind === 'outcome') {
        return '<div class="node-outcome" data-node="@outcome">' +
          '<span class="outcome-seal" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M5 22V4M5 4h11l-2 4 2 4H5"/></svg>' +
          '</span>' +
          '<span class="outcome-text">' +
            '<span class="outcome-label">' + txt('finish') + '</span>' +
            '<span class="outcome-name">' + esc(t.outcome) + '</span>' +
          '</span>' +
        '</div>';
      }
      if (node.kind === 'course') {
        const names = (courseById(node.id)?.requires || []).filter((d) => g.nodes.some((x) => x.courses.includes(d)));
        return courseCard(node.id, String(v + 1).padStart(2, '0'), names);
      }
      // a choice step: one single block, with the options as tabs
      const item = node.step;
      const sel = activeOption(t.id, node.idx);
      const tabs = item.options.map((o, j) =>
        '<button class="fork-tab' + (j === sel ? ' on' : '') + '" type="button" ' +
        'data-fork="' + node.idx + '" data-option="' + j + '">' + esc(o.name) +
        '<span class="fork-h">' + hoursOf(o.courses) + 'h</span></button>').join('');
      const inside = item.options[sel].courses.map((id) => courseCard(id)).join('');
      return (
        '<div class="fork" data-node="' + esc(node.id) + '">' +
          '<div class="fork-top">' +
            '<span class="fork-label">' + txt('level') + ' ' + String(v + 1).padStart(2, '0') +
              ' · ' + txt('you choose') + ' ' + esc(item.choice) + '</span>' +
            '<div class="fork-tabs" role="tablist">' + tabs + '</div>' +
          '</div>' +
          (item.note ? '<p class="fork-note">' + esc(item.note) + '</p>' : '') +
          '<div class="fork-courses">' + inside + '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="level" data-level="' + v + '"><div class="subcol">' + cards + '</div></div>';
  }).join('');

  const workload = min === max
    ? '<span><b>' + hours + 'h</b>' + txt('total') + '</span>'
    : '<span><b>' + hours + 'h</b>' + txt('on this path') + ' <i>(' + min + 'h ' + txt('to') + ' ' + max + 'h)</i></span>';

  return (
    '<div class="track-top">' +
      '<div>' +
        '<h2>' + esc(t.name) + '</h2>' +
        '<p>' + esc(t.goal) + '</p>' +
      '</div>' +
      '<div class="track-summary">' +
        '<span><b>' + done + '/' + path.length + '</b>' + txt('courses completed') + '</span>' +
        workload +
        '<span><b>→</b>' + esc(t.outcome) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="graph-box">' +
      '<button class="graph-full-toggle" type="button" data-graph-full ' +
        'aria-label="' + txt('see the graph on the whole screen') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path class="i-open" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>' +
        '<path class="i-close" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>' +
      '</button>' +
      '<button class="graph-arrow left" type="button" data-scroll="-1" aria-label="' + txt('See previous levels') + '">←</button>' +
      '<div class="track-graph"><svg class="graph-edges" aria-hidden="true"></svg>' +
        '<div class="graph-levels">' + columns + '</div></div>' +
      '<button class="graph-arrow right" type="button" data-scroll="1" aria-label="' + txt('See next levels') + '">→</button>' +
    '</div>' +
    '<div class="graph-legend">' +
      Object.entries(STATE_LABEL).map(([k, r]) =>
        '<span class="leg"><i class="leg-color node-' + k + '"></i>' + txt(r) + '</span>').join('') +
    '</div>'
  );
}

/* ---------- which way the graph flows ----------
   Three layouts, and the CSS decides which one is in force — the JS only reads
   it back, so there is one breakpoint to change and not two:

     right — levels side by side, cards stacked inside each level. The landscape
             desktop layout, and what the whole router was written for.
     down  — levels stacked, cards side by side inside each level. A portrait
             monitor, or simply a window taller than it is wide: marching to the
             right there hides two thirds of the track behind a scrollbar and
             leaves the height empty. It is the same graph transposed, edges
             included.
     list  — one column, no edges, `requires` shown as text. The phone.

   The flags are the flex directions themselves: the lane says whether the
   levels stack, and a sub-column says whether the cards inside one do. */
function graphFlow(root) {
  const lane = root.querySelector('.graph-levels');
  if (!lane) return 'right';
  if (getComputedStyle(lane).flexDirection === 'row') return 'right';
  const sub = lane.querySelector('.subcol');
  return sub && getComputedStyle(sub).flexDirection === 'row' ? 'down' : 'list';
}

/* ---------- splits each level into sub-columns ----------
   A level with many courses cannot stretch below the fold: the real height of
   each card is measured and a sub-column is filled to the limit before the next
   one opens, so the graph grows horizontally, which is where the arrows are.
   Neither `flex-wrap` nor CSS multi-column expands the container's width — the
   cards that overflowed ended up on top of the neighbouring level. */
export function splitLevels(root) {
  const scroller = root.querySelector('.track-graph');
  const strip = root.querySelector('.graph-levels');
  if (!scroller || !strip) return;
  // back to full size before measuring: it is the available height that decides
  // the split, not whatever was left over from the previous track
  const box = root.querySelector('.graph-box');
  if (box) box.style.flex = '1 1 auto';
  const flow = graphFlow(root);
  const asList = flow === 'list';
  // flowing down, a level breaks when the cards run out of WIDTH, and what it
  // breaks into is another row. Same algorithm, other axis.
  const across = flow === 'down';
  const gap = 10;
  const cs = getComputedStyle(strip);
  const sp = getComputedStyle(scroller);
  const pad = (s) => (across
    ? parseFloat(s.paddingLeft) + parseFloat(s.paddingRight)
    : parseFloat(s.paddingTop) + parseFloat(s.paddingBottom));
  /* The scroller's own padding counts too: `clientHeight` includes it and the
     cards never get it, so a column packed against that number comes out that
     much taller than the box that holds it. Measured again on every pass,
     because packing changes the box — a column that fitted at the height the
     graph had before the split can stop fitting at the height it has after. */
  const measure = () => (across ? scroller.clientWidth : scroller.clientHeight) -
    pad(cs) - pad(sp) - 2;

  root.querySelectorAll('.level').forEach((lv) => {
    const items = [];
    lv.querySelectorAll(':scope > .subcol').forEach((sc) => {
      Array.from(sc.children).forEach((el) => items.push(el));
    });
    if (items.length < 2) return;

    if (asList) {
      lv.textContent = '';
      const sc = document.createElement('div');
      sc.className = 'subcol';
      items.forEach((el) => sc.appendChild(el));
      lv.appendChild(sc);
      return;
    }

    /* Packed against the sizes the cards have RIGHT NOW — and re-packed if the
       result does not fit, because a card can change size by being moved. A
       fork block re-wraps when its column changes width and comes out taller
       than it measured; the column then overflowed the lane, `align-items:
       center` centred the overflow, and a block ended up at y = -1. Above it
       there was no room left for the lane an edge detours through, and the edge
       was drawn through the block. Two passes settle every case in the
       catalogue; the third is there so a future one cannot loop. */
    for (let pass = 0; pass < 3; pass++) {
      const available = measure();
      const cols = [[]];
      let used = 0;
      items.forEach((el) => {
        const h = across ? el.offsetWidth : el.offsetHeight;
        const current = cols[cols.length - 1];
        if (current.length && used + gap + h > available) { cols.push([]); used = 0; }
        cols[cols.length - 1].push(el);
        used += (used ? gap : 0) + h;
      });

      lv.textContent = '';
      cols.forEach((col) => {
        const sc = document.createElement('div');
        sc.className = 'subcol';
        col.forEach((el) => sc.appendChild(el));
        lv.appendChild(sc);
      });

      let over = 0;
      lv.querySelectorAll(':scope > .subcol').forEach((sc) => {
        over = Math.max(over, (across ? sc.offsetWidth : sc.offsetHeight) - available);
      });
      if (over <= 0) break;
    }
  });

  /* The lane hugs the graph instead of taking up all the height left over.
     Not on the whole screen: there the space below the graph belongs to nothing
     else. And only where the graph is as tall as it needs to be — flowing down
     it is taller than the box on purpose, and hugging would cut it off. */
  if (flow === 'right' && !document.body.classList.contains('graph-full')) {
    let tallest = 0;
    root.querySelectorAll('.level > .subcol').forEach((sc) => { tallest = Math.max(tallest, sc.offsetHeight); });
    const full = scroller.clientHeight;
    const cx = root.querySelector('.graph-box');
    if (tallest && cx) {
      cx.style.flex = '0 0 ' + Math.min(full, tallest + pad(cs)) + 'px';
    }
  }
}

/* ---------- the edges ----------
   Drawn over real measurements, once the layout exists. The decision to route
   around a card is GEOMETRIC, not topological: the rectangle between the two
   endpoints is measured and, if there is any card inside it, the line goes
   around. The old rule ("skipped more than one column, so route around") let
   through the case where a split level puts a neighbour in the corridor of an
   edge between adjacent levels. A 16px clearance: with 11 some passed within
   1.8px. */
export function drawEdges(root, t) {
  splitLevels(root);
  const cont = root.querySelector('.track-graph');
  const svg = cont && cont.querySelector('.graph-edges');
  if (!svg) return;
  const g = trackGraph(t, activeOption);
  const base = cont.getBoundingClientRect();
  const L = cont.scrollLeft, T = cont.scrollTop;
  /* THE ROUTER RUNS IN ONE AXIS AND SERVES BOTH. Everything below this line
     thinks the graph goes left to right: an edge leaves a card's right side,
     crosses a corridor and comes in on the next card's left. Flowing down, the
     boxes go in with x and y swapped and every point comes out swapped back —
     so "the lane above the cards" is the margin to their left, and not one line
     of the routing had to be written twice. */
  const down = graphFlow(root) === 'down';
  const boxOf = (id) => {
    const el = cont.querySelector('[data-node="' + CSS.escape(id) + '"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const b = { x: r.left - base.left + L, y: r.top - base.top + T, w: r.width, h: r.height };
    return down ? { x: b.y, y: b.x, w: b.h, h: b.w } : b;
  };
  // the far edge of the drawing, in the same swapped coordinates
  const far = down ? cont.scrollWidth : cont.scrollHeight;
  // a point, written the way the SVG has to read it
  const P = (x, y) => (down ? y + ',' + x : x + ',' + y);

  svg.setAttribute('width', cont.scrollWidth);
  svg.setAttribute('height', cont.scrollHeight);
  svg.setAttribute('viewBox', '0 0 ' + cont.scrollWidth + ' ' + cont.scrollHeight);

  /* The distance a detour line keeps from the card it goes around. */
  const CLEARANCE = 16;
  /* The narrowest gap between two cards a line may thread. It is not CLEARANCE:
     that is how far a detour stays from a card it goes AROUND, with open space
     on the other side. Threading needs only enough room to read as a corridor —
     half of this on each side of a 1.5px line. */
  const CORRIDOR = 14;
  // the detour lane sits just above and just below the cards, not at the
  // container's edges: short curves instead of arcs crossing the screen
  let yTop = Infinity, yBottom = -Infinity;
  g.nodes.forEach((n) => {
    const c = boxOf(n.id);
    if (!c) return;
    yTop = Math.min(yTop, c.y);
    yBottom = Math.max(yBottom, c.y + c.h);
  });
  if (!isFinite(yTop)) { yTop = 0; yBottom = far; }
  const detourUp = Math.max(6, yTop - CLEARANCE);
  const detourDown = Math.min(far - 6, yBottom + CLEARANCE);

  const boxes = g.nodes.map((n) => {
    const c = boxOf(n.id);
    return c && { id: n.id, x: c.x, y: c.y, w: c.w, h: c.h };
  }).filter(Boolean);
  const inTheWay = (xa, xb, ya, yb, ignore) => boxes.filter((c) =>
    ignore.indexOf(c.id) < 0 && c.x + c.w > xa && c.x < xb && c.y < yb && c.y + c.h > ya);

  /* The horizontal corridors that cross a span with nothing in them: above the
     cards in the way, below them, and every gap between them wide enough to
     take the line plus its clearance on both sides. Overlapping cards are
     merged first, or the gap between two cards in the same column would be
     offered as a corridor when a third card spans across it. */
  const freeLanes = (xa, xb, ignore) => {
    const spans = boxes
      .filter((c) => ignore.indexOf(c.id) < 0 && c.x + c.w > xa && c.x < xb)
      .map((c) => [c.y, c.y + c.h])
      .sort((a, b) => a[0] - b[0]);
    if (!spans.length) return [];
    const merged = [spans[0].slice()];
    spans.forEach((s) => {
      const last = merged[merged.length - 1];
      if (s[0] <= last[1]) last[1] = Math.max(last[1], s[1]);
      else merged.push(s.slice());
    });
    const lanes = [merged[0][0] - CLEARANCE, merged[merged.length - 1][1] + CLEARANCE];
    for (let i = 0; i < merged.length - 1; i++) {
      if (merged[i + 1][0] - merged[i][1] >= CORRIDOR) {
        lanes.push((merged[i][1] + merged[i + 1][0]) / 2);
      }
    }
    return lanes;
  };

  /* The free horizontal room from an x, within the vertical band the curve
     travels through: with sub-columns the gap beside a card drops from 48px to
     14px, and a fixed 26px rise would pass straight through the neighbour. */
  const room = (x, ya, yb, ignore, toTheRight) => {
    let limit = Infinity;
    boxes.forEach((c) => {
      if (ignore.indexOf(c.id) >= 0) return;
      if (c.y >= yb || c.y + c.h <= ya) return;
      const d = toTheRight ? c.x - x : x - (c.x + c.w);
      if (d >= 0) limit = Math.min(limit, d);
    });
    return limit;
  };

  const lines = [];
  g.nodes.forEach((node) => {
    const b = boxOf(node.id);
    if (!b) return;
    node.deps.forEach((d) => {
      const a = boxOf(d);
      if (!a) return;
      const x1 = a.x + a.w, y1 = a.y + a.h / 2;
      const x2 = b.x, y2 = b.y + b.h / 2;
      let dd;

      /* the simple curve has its control points at the endpoints' height, so it
         never leaves the band between y1 and y2: that rectangle is all we check */
      const ignore = [d, node.id];
      const blocking = inTheWay(x1 + 2, x2 - 2, Math.min(y1, y2) - 4, Math.max(y1, y2) + 4, ignore);

      if (blocking.length) {
        /* WHICH LANE TO CROSS IN.
           Above every card in the way, below every one of them, or through any
           gap between them wide enough to hold the line and its clearance. The
           corridor that deviates least from the two endpoints wins — which is
           any corridor lying between them, since the cost is then exactly the
           height difference the edge had to cover anyway. Knowing only the two
           outermost lanes is what sent an edge riding over a whole fork block
           when there was a clear corridor beneath it. */
        const lanes = freeLanes(x1 + 2, x2 - 2, ignore);
        let yD = null, cheapest = Infinity;
        lanes.forEach((y) => {
          if (inTheWay(x1 + 2, x2 - 2, y - 3, y + 3, ignore).length) return;
          const cost = Math.abs(y1 - y) + Math.abs(y2 - y) +
            Math.abs(y - (y1 + y2) / 2) / 1000;
          if (cost < cheapest) { cheapest = cost; yD = y; }
        });
        // nothing free between the two: the lane above or below the whole graph
        // is, and it always is
        if (yD === null) {
          yD = (y1 - detourUp) + (y2 - detourUp) <= (detourDown - y1) + (detourDown - y2)
            ? detourUp : detourDown;
        }
        // the clamp keeps the lane inside the drawing, and can therefore push it
        // into a card that sits against the edge. When it does, the other side
        // is tried before a line is drawn through anything.
        const clamp = (y) => Math.max(6, Math.min(far - 6, y));
        yD = clamp(yD);
        if (inTheWay(x1 + 2, x2 - 2, yD - 3, yD + 3, ignore).length) {
          const other = clamp(yD <= (detourUp + detourDown) / 2 ? detourDown : detourUp);
          if (!inTheWay(x1 + 2, x2 - 2, other - 3, other + 3, ignore).length) yD = other;
        }
        // each endpoint uses the clearance it actually has: the rise out of the
        // prerequisite fits the gap to its right, the one into the dependent
        // fits the gap to its left
        const width = (x, toTheRight) => {
          const ya = Math.min(toTheRight ? y1 : y2, yD), yb = Math.max(toTheRight ? y1 : y2, yD);
          return Math.max(5, Math.min(26, room(x, ya, yb, ignore, toTheRight) / 2));
        };
        const eS = width(x1, true), eE = width(x2, false);
        dd = 'M' + P(x1, y1) +
          ' C' + P(x1 + eS, y1) + ' ' + P(x1 + eS, yD) + ' ' + P(x1 + eS * 2, yD) +
          ' L' + P(x2 - eE * 2, yD) +
          ' C' + P(x2 - eE, yD) + ' ' + P(x2 - eE, y2) + ' ' + P(x2, y2);
      } else {
        const dx = Math.max(18, (x2 - x1) / 2);
        dd = 'M' + P(x1, y1) + ' C' + P(x1 + dx, y1) +
          ' ' + P(x2 - dx, y2) + ' ' + P(x2, y2);
      }

      // the edge takes on the state of the PREREQUISITE: green when what it
      // unlocks has been finished, dimmed when it has not
      const met = courseById(d) && courseState(d) === 'done';
      lines.push(
        '<g class="edge' + (met ? ' edge-done' : '') + '" data-from="' + esc(d) + '" data-to="' + esc(node.id) + '">' +
          '<title>' + esc(nodeLabel(d, g)) + ' → ' + esc(nodeLabel(node.id, g)) + '</title>' +
          '<path class="hit" d="' + dd + '"/>' +
          '<path class="row" d="' + dd + '"/>' +
          '<circle class="tip" cx="' + (down ? y2 : x2) + '" cy="' + (down ? x2 : y2) + '" r="3"/>' +
        '</g>',
      );
    });
  });
  svg.innerHTML = lines.join('');
  adjustGraphArrows(root);
  // the screen is rebuilt whenever a fork changes branch, and it can be rebuilt
  // while the graph owns the window: the button that came back says what it
  // does now, not what it did the first time it was built
  const toggle = root.querySelector('.graph-full-toggle');
  if (toggle) {
    toggle.setAttribute('aria-label', txt(document.body.classList.contains('graph-full')
      ? 'leave the whole screen' : 'see the graph on the whole screen'));
  }
}

function nodeLabel(id, g) {
  if (id === '@outcome') return txt('finish');
  const c = courseById(id);
  if (c) return c.name;
  const node = g.nodes.find((n) => n.id === id);
  return node && node.step ? 'choice ' + node.step.choice : id;
}

export function adjustGraphArrows(root) {
  const cx = root.querySelector('.graph-box');
  const scroller = cx && cx.querySelector('.track-graph');
  if (!scroller) return;
  const spare = scroller.scrollWidth - scroller.clientWidth;
  cx.querySelector('.graph-arrow.left').disabled = !(spare > 4 && scroller.scrollLeft > 4);
  cx.querySelector('.graph-arrow.right').disabled = !(spare > 4 && scroller.scrollLeft < spare - 4);
  cx.classList.toggle('no-arrows', spare <= 4);
  scroller.classList.toggle('fade-right', spare > 4 && scroller.scrollLeft < spare - 4);
  scroller.classList.toggle('fade-left', spare > 4 && scroller.scrollLeft > 4);
  const spareY = scroller.scrollHeight - scroller.clientHeight;
  scroller.classList.toggle('fade-down', spareY > 4 && scroller.scrollTop < spareY - 4);
  // and if there is anywhere to go on either axis, it can be dragged there
  scroller.classList.toggle('can-pan', spare > 4 || spareY > 4);
}

export const enrolledTrack = () => now().enrollment?.trackId || null;

/* ---------- the graph can be taken hold of and pulled ----------
   The arrows page it one screenful at a time, which is fine for reading a track
   end to end and wrong for looking at the two levels on either side of the fold.
   The vitrine's listeners, verbatim: on the document rather than on the screen,
   because the screen is rebuilt on every fork switch and a listener per build
   leaks on every build.

   Below the threshold nothing moves, so a click on a card is still a click. */
const DRAG_FROM = 5;   // pixels before a press becomes a drag
const dragging = { on: false, el: null, id: -1, x: 0, y: 0, left: 0, top: 0, swallow: false };

function endDrag() {
  if (dragging.el) {
    if (dragging.el.releasePointerCapture) {
      try { dragging.el.releasePointerCapture(dragging.id); } catch (err) { /* already released */ }
    }
    dragging.el.classList.remove('is-dragging');
  }
  dragging.on = false;
  dragging.el = null;
  dragging.id = -1;
}

document.addEventListener('pointerdown', (e) => {
  // touch scrolls natively, and a middle or right button is not a drag
  if (e.button !== 0 || e.pointerType === 'touch') return;
  const el = e.target.closest('.track-graph.can-pan');
  if (!el) return;
  dragging.swallow = false;
  dragging.el = el;
  dragging.id = e.pointerId;
  dragging.x = e.clientX;
  dragging.y = e.clientY;
  dragging.left = el.scrollLeft;
  dragging.top = el.scrollTop;
  dragging.on = false;
});

document.addEventListener('pointermove', (e) => {
  if (!dragging.el || e.pointerId !== dragging.id) return;
  const dx = e.clientX - dragging.x;
  const dy = e.clientY - dragging.y;
  if (!dragging.on) {
    if (Math.hypot(dx, dy) < DRAG_FROM) return;
    dragging.on = true;
    dragging.swallow = true;
    dragging.el.classList.add('is-dragging');
    // keep the move and the release even when the pointer leaves the graph
    if (dragging.el.setPointerCapture) {
      try { dragging.el.setPointerCapture(e.pointerId); } catch (err) { /* not captured */ }
    }
  }
  dragging.el.scrollLeft = dragging.left - dx;
  dragging.el.scrollTop = dragging.top - dy;
});

['pointerup', 'pointercancel'].forEach((type) => document.addEventListener(type, endDrag));
addEventListener('blur', endDrag);

/* The release fires a click, and after a drag that click would open whatever
   card the pointer happened to land on. Swallowed in the capture phase, before
   the screen's own handler sees it. */
document.addEventListener('click', (e) => {
  if (!dragging.swallow) return;
  dragging.swallow = false;
  if (e.target.closest('.track-graph')) {
    e.stopPropagation();
    e.preventDefault();
  }
}, true);
