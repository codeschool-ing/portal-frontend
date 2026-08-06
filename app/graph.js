/* ==========================================================================
   The track graph, now as a PROGRESS MAP.

   The drawing is the vitrine's — `splitLevels` and `drawEdges` came from there
   almost unchanged, the only difference being that they take the root as a
   parameter instead of reaching for a global. What changed is what the cards
   say: instead of "this course exists", they say "you have done this one".

   IT SHOWS, BUT IT DOES NOT LOCK. The vitrine's FAQ promises, in writing: "No.
   The track is a recommended order — if you only need one course from it, watch
   just that one." A padlock here would contradict a promise that is already
   published, which is why the most restrictive state is called `adiante` and
   stays clickable: it tells you the recommended order, it does not forbid
   access.

   The class names, the `data-*` attributes and the course states (`concluido`,
   `atual`, `disponivel`, `adiante`) stay in Portuguese: they are the DOM
   contract that base.css — a verbatim copy of the vitrine's stylesheet — styles.
   ========================================================================== */

import {
  trackGraph, courseById, tracksWithCourse, trackPath, hoursOf, hoursRange,
} from './catalog.js';
import { courseDone, courseProgress, activeOption, now } from './state.js';
import { esc } from './text.js';

/* ---------- the state of each course ---------- */

export function courseState(id) {
  if (courseDone(id)) return 'concluido';
  const p = courseProgress(id);
  if (p.feitas > 0) return 'atual';
  const deps = courseById(id)?.requires || [];
  const ready = deps.every((d) => courseDone(d));
  return ready ? 'disponivel' : 'adiante';
}

const STATE_LABEL = {
  concluido: 'completed',
  atual: 'in progress',
  disponivel: 'available',
  adiante: 'further ahead',
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
    '<button class="curso-no no-' + st + '" type="button" data-curso="' + esc(c.id) + '" data-no="' + esc(c.id) + '">' +
      (order ? '<span class="ordem">' + txt('level') + ' ' + order + '</span>' : '') +
      '<span class="no-estado" data-estado="' + st + '">' + txt(STATE_LABEL[st]) + '</span>' +
      '<span class="nome">' + esc(c.name) + '</span>' +
      (trackCount > 1 ? '<span class="tag-compartilhado">' + txt('in') + ' ' + trackCount + ' ' + txt('tracks') + '</span>' : '') +
      '<span class="meta">' + c.hours + 'h · ' + txt(c.level) + '</span>' +
      (p.total
        ? '<span class="no-barra" role="img" aria-label="' + p.feitas + ' de ' + p.total + '">' +
            '<span class="no-barra-cheia" style="width:' + p.pct + '%"></span>' +
          '</span>' +
          '<span class="no-conta">' + p.feitas + '/' + p.total + ' ' + txt('sections') + '</span>'
        : '') +
      (requires.length && st === 'adiante'
        ? '<span class="requer">' + txt('recommended after') + ' ' + esc(requires.join(' + ')) + '</span>'
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
      if (node.kind === 'saida') {
        return '<div class="no-saida" data-no="@saida">' +
          '<span class="saida-selo" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M5 22V4M5 4h11l-2 4 2 4H5"/></svg>' +
          '</span>' +
          '<span class="saida-txt">' +
            '<span class="saida-rotulo">' + txt('finish') + '</span>' +
            '<span class="saida-nome">' + esc(t.outcome) + '</span>' +
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
        '<button class="garfo-aba' + (j === sel ? ' on' : '') + '" type="button" ' +
        'data-garfo="' + node.idx + '" data-opcao="' + j + '">' + esc(o.name) +
        '<span class="garfo-h">' + hoursOf(o.courses) + 'h</span></button>').join('');
      const inside = item.options[sel].courses.map((id) => courseCard(id)).join('');
      return (
        '<div class="garfo" data-no="' + esc(node.id) + '">' +
          '<div class="garfo-topo">' +
            '<span class="garfo-rotulo">' + txt('level') + ' ' + String(v + 1).padStart(2, '0') +
              ' · ' + txt('you choose') + ' ' + esc(item.choice) + '</span>' +
            '<div class="garfo-abas" role="tablist">' + tabs + '</div>' +
          '</div>' +
          (item.note ? '<p class="garfo-nota">' + esc(item.note) + '</p>' : '') +
          '<div class="garfo-cursos">' + inside + '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="nivel" data-nivel="' + v + '"><div class="subcol">' + cards + '</div></div>';
  }).join('');

  const workload = min === max
    ? '<span><b>' + hours + 'h</b>' + txt('total') + '</span>'
    : '<span><b>' + hours + 'h</b>' + txt('on this path') + ' <i>(' + min + 'h ' + txt('to') + ' ' + max + 'h)</i></span>';

  return (
    '<div class="trilha-topo">' +
      '<div>' +
        '<h2>' + esc(t.name) + '</h2>' +
        '<p>' + esc(t.goal) + '</p>' +
      '</div>' +
      '<div class="trilha-resumo">' +
        '<span><b>' + done + '/' + path.length + '</b>' + txt('courses completed') + '</span>' +
        workload +
        '<span><b>→</b>' + esc(t.outcome) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="grafo-caixa">' +
      '<button class="grafo-seta esq" type="button" data-rolar="-1" aria-label="Ver níveis anteriores">←</button>' +
      '<div class="trilha-grafo"><svg class="grafo-arestas" aria-hidden="true"></svg>' +
        '<div class="grafo-niveis">' + columns + '</div></div>' +
      '<button class="grafo-seta dir" type="button" data-rolar="1" aria-label="Ver próximos níveis">→</button>' +
    '</div>' +
    '<div class="grafo-legenda">' +
      Object.entries(STATE_LABEL).map(([k, r]) =>
        '<span class="leg"><i class="leg-cor no-' + k + '"></i>' + txt(r) + '</span>').join('') +
    '</div>'
  );
}

/* ---------- splits each level into sub-columns ----------
   A level with many courses cannot stretch below the fold: the real height of
   each card is measured and a sub-column is filled to the limit before the next
   one opens, so the graph grows horizontally, which is where the arrows are.
   Neither `flex-wrap` nor CSS multi-column expands the container's width — the
   cards that overflowed ended up on top of the neighbouring level. */
export function splitLevels(root) {
  const scroller = root.querySelector('.trilha-grafo');
  const strip = root.querySelector('.grafo-niveis');
  if (!scroller || !strip) return;
  const box = root.querySelector('.grafo-caixa');
  if (box) box.style.flex = '1 1 auto';
  const asList = getComputedStyle(strip).flexDirection !== 'row';
  const gap = 10;
  const cs = getComputedStyle(strip);
  const available = scroller.clientHeight - (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) - 4;

  root.querySelectorAll('.nivel').forEach((lv) => {
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

    const cols = [[]];
    let used = 0;
    items.forEach((el) => {
      const h = el.offsetHeight;
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
  });

  if (!asList) {
    let tallest = 0;
    root.querySelectorAll('.nivel > .subcol').forEach((sc) => { tallest = Math.max(tallest, sc.offsetHeight); });
    const full = scroller.clientHeight;
    const cx = root.querySelector('.grafo-caixa');
    if (tallest && cx) {
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      cx.style.flex = '0 0 ' + Math.min(full, tallest + pad) + 'px';
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
  const cont = root.querySelector('.trilha-grafo');
  const svg = cont && cont.querySelector('.grafo-arestas');
  if (!svg) return;
  const g = trackGraph(t, activeOption);
  const base = cont.getBoundingClientRect();
  const L = cont.scrollLeft, T = cont.scrollTop;
  const boxOf = (id) => {
    const el = cont.querySelector('[data-no="' + CSS.escape(id) + '"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left + L, y: r.top - base.top + T, w: r.width, h: r.height };
  };

  svg.setAttribute('width', cont.scrollWidth);
  svg.setAttribute('height', cont.scrollHeight);
  svg.setAttribute('viewBox', '0 0 ' + cont.scrollWidth + ' ' + cont.scrollHeight);

  const CLEARANCE = 16;
  let yTop = Infinity, yBottom = -Infinity;
  g.nodes.forEach((n) => {
    const c = boxOf(n.id);
    if (!c) return;
    yTop = Math.min(yTop, c.y);
    yBottom = Math.max(yBottom, c.y + c.h);
  });
  if (!isFinite(yTop)) { yTop = 0; yBottom = cont.scrollHeight; }
  const detourUp = Math.max(6, yTop - CLEARANCE);
  const detourDown = Math.min(cont.scrollHeight - 6, yBottom + CLEARANCE);

  const boxes = g.nodes.map((n) => {
    const c = boxOf(n.id);
    return c && { id: n.id, x: c.x, y: c.y, w: c.w, h: c.h };
  }).filter(Boolean);
  const inTheWay = (xa, xb, ya, yb, ignore) => boxes.filter((c) =>
    ignore.indexOf(c.id) < 0 && c.x + c.w > xa && c.x < xb && c.y < yb && c.y + c.h > ya);

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

      const ignore = [d, node.id];
      const blocking = inTheWay(x1 + 2, x2 - 2, Math.min(y1, y2) - 4, Math.max(y1, y2) + 4, ignore);

      if (blocking.length) {
        const top = Math.min.apply(null, blocking.map((c) => c.y));
        const bottom = Math.max.apply(null, blocking.map((c) => c.y + c.h));
        const overTheTop = (y1 - top) + (y2 - top) <= (bottom - y1) + (bottom - y2);
        let yD = overTheTop ? top - CLEARANCE : bottom + CLEARANCE;
        if (inTheWay(x1 + 2, x2 - 2, yD - 3, yD + 3, ignore).length) {
          yD = (y1 - detourUp) + (y2 - detourUp) <= (detourDown - y1) + (detourDown - y2)
            ? detourUp : detourDown;
        }
        yD = Math.max(6, Math.min(cont.scrollHeight - 6, yD));
        const width = (x, toTheRight) => {
          const ya = Math.min(toTheRight ? y1 : y2, yD), yb = Math.max(toTheRight ? y1 : y2, yD);
          return Math.max(5, Math.min(26, room(x, ya, yb, ignore, toTheRight) / 2));
        };
        const eS = width(x1, true), eE = width(x2, false);
        dd = 'M' + x1 + ',' + y1 +
          ' C' + (x1 + eS) + ',' + y1 + ' ' + (x1 + eS) + ',' + yD + ' ' + (x1 + eS * 2) + ',' + yD +
          ' L' + (x2 - eE * 2) + ',' + yD +
          ' C' + (x2 - eE) + ',' + yD + ' ' + (x2 - eE) + ',' + y2 + ' ' + x2 + ',' + y2;
      } else {
        const dx = Math.max(18, (x2 - x1) / 2);
        dd = 'M' + x1 + ',' + y1 + ' C' + (x1 + dx) + ',' + y1 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2;
      }

      // the edge takes on the state of the PREREQUISITE: green when what it
      // unlocks has been finished, dimmed when it has not
      const met = courseById(d) && courseState(d) === 'concluido';
      lines.push(
        '<g class="aresta' + (met ? ' aresta-feita' : '') + '" data-de="' + esc(d) + '" data-para="' + esc(node.id) + '">' +
          '<title>' + esc(nodeLabel(d, g)) + ' → ' + esc(nodeLabel(node.id, g)) + '</title>' +
          '<path class="hit" d="' + dd + '"/>' +
          '<path class="linha" d="' + dd + '"/>' +
          '<circle class="ponta" cx="' + x2 + '" cy="' + y2 + '" r="3"/>' +
        '</g>',
      );
    });
  });
  svg.innerHTML = lines.join('');
  adjustGraphArrows(root);
}

function nodeLabel(id, g) {
  if (id === '@saida') return txt('finish');
  const c = courseById(id);
  if (c) return c.name;
  const node = g.nodes.find((n) => n.id === id);
  return node && node.step ? 'escolha ' + node.step.choice : id;
}

export function adjustGraphArrows(root) {
  const cx = root.querySelector('.grafo-caixa');
  const scroller = cx && cx.querySelector('.trilha-grafo');
  if (!scroller) return;
  const spare = scroller.scrollWidth - scroller.clientWidth;
  cx.querySelector('.grafo-seta.esq').disabled = !(spare > 4 && scroller.scrollLeft > 4);
  cx.querySelector('.grafo-seta.dir').disabled = !(spare > 4 && scroller.scrollLeft < spare - 4);
  cx.classList.toggle('sem-setas', spare <= 4);
  scroller.classList.toggle('fade-dir', spare > 4 && scroller.scrollLeft < spare - 4);
  scroller.classList.toggle('fade-esq', spare > 4 && scroller.scrollLeft > 4);
  const spareY = scroller.scrollHeight - scroller.clientHeight;
  scroller.classList.toggle('fade-baixo', spareY > 4 && scroller.scrollTop < spareY - 4);
}

export const enrolledTrack = () => now().enrollment?.trackId || null;
