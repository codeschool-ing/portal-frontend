/* ==========================================================================
   My track — the vitrine's graph turned into a progress map.

   `after` exists because the edges are drawn over the REAL positions of the
   cards: measuring outside the document returns zero for everything. And the
   redraw on resize is the vitrine's same care, for the same reason.
   ========================================================================== */

import { buildTrack, drawEdges, adjustGraphArrows } from '../graph.js';
import { chooseOption, activeOption } from '../state.js';
import { goTo } from '../routes.js';
import { trackExam } from '../exams.js';
import { examCard } from './exam.js';
import { studentTrack, trackProgress, empty } from './common.js';

let redrawT = null;

export default async function track() {
  const t = studentTrack();
  if (!t) return { title: txt('Track'), el: empty(txt('You have not chosen a track yet.')) };

  const el = document.createElement('div');
  el.className = 'view view-track';

  /* The exam comes AFTER the graph, and it is the only thing that does: the
     graph ends at the arrival node, and the exam is what exists after arriving.
     The card is rebuilt together with the graph when the fork changes, because
     switching branches switches the courses and therefore the question bank. */
  const card = () => {
    const exam = trackExam(t, activeOption);
    return exam.items.length
      ? examCard({
        key: exam.key, href: '#/track/exam', scope: 'track',
        count: exam.items.length, progress: trackProgress(t).pct,
      })
      : '';
  };
  el.innerHTML = buildTrack(t) + card();

  // open a course from its card in the graph
  el.addEventListener('click', (e) => {
    const card1 = e.target.closest('.course-node[data-course]');
    if (card1) return goTo('/course/' + card1.dataset.course);

    // switching the option of a fork step: rebuilds the whole graph, because the
    // choice changes the path and therefore the levels
    const tab = e.target.closest('.fork-tab');
    if (tab) {
      chooseOption(t.id, Number(tab.dataset.fork), Number(tab.dataset.option));
      el.innerHTML = buildTrack(t) + card();
      drawEdges(el, t);
      return;
    }

    if (e.target.closest('[data-graph-full]')) { fullscreen(!isFull()); return; }

    const arrow = e.target.closest('.graph-arrow[data-scroll]');
    if (arrow) {
      const scroller = el.querySelector('.track-graph');
      scroller.scrollBy({ left: Number(arrow.dataset.scroll) * Math.max(220, scroller.clientWidth - 80), behavior: 'smooth' });
    }
  });

  /* ---------- the graph on the whole screen ----------
     On this screen the graph gets what is left after the heading, the numbers
     and the exam card have taken theirs — around 58vh, with most of a long
     track behind a sideways scroll. The button hands it the window instead.

     Not a second route and not the Fullscreen API: the same DOM moved to a
     fixed layer under the bar, so nothing is rebuilt, the language and the
     theme stay reachable, and Escape gets you out. It is the vitrine's
     feature, and `base.css` already carried every style it needs. */
  const isFull = () => document.body.classList.contains('graph-full');
  const fullscreen = (on) => {
    if (isFull() === on) return;
    document.body.classList.toggle('graph-full', on);
    /* The graph is laid out on measurements and the measurements just changed:
       the levels split by the height they are given, and that is the whole
       point of the button. drawEdges also relabels it, since it now means the
       opposite. */
    requestAnimationFrame(() => {
      drawEdges(el, t);
      el.querySelector('.graph-full-toggle')?.focus({ preventScroll: true });
    });
  };

  const keys = (e) => {
    if (!isFull()) return;
    if (e.key === 'Escape') { e.preventDefault(); fullscreen(false); return; }
    // while the graph owns the window the arrows drive it
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const g = el.querySelector('.track-graph');
      if (g) { e.preventDefault(); g.scrollLeft += (e.key === 'ArrowLeft' ? -1 : 1) * 320; }
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const g = el.querySelector('.track-graph');
      if (g) { e.preventDefault(); g.scrollTop += (e.key === 'ArrowUp' ? -1 : 1) * 220; }
    }
  };
  addEventListener('keydown', keys);

  el.addEventListener('scroll', (e) => {
    if (e.target.classList?.contains('track-graph')) adjustGraphArrows(el);
  }, true);

  /* HOVERING A COURSE LIGHTS UP THE EDGES that arrive at it and leave it. It
     came from the vitrine (`assets/script.js`) verbatim, and `base.css` already
     carried the `.edge.on` style — the portal had copied half the CSS and left
     half the behaviour behind.

     `mouseover`/`mouseout` and not `mouseenter`/`mouseleave`: only the first two
     bubble, and bubbling is what allows ONE listener on the screen instead of
     one per card. The cards are rebuilt on every fork switch, and a listener per
     card leaks on every rebuild. */
  el.addEventListener('mouseover', (e) => {
    const node = e.target.closest('[data-node]');
    if (!node) return;
    const id = node.dataset.node;
    el.querySelectorAll('.edge').forEach((a) => {
      a.classList.toggle('on', a.dataset.from === id || a.dataset.to === id);
    });
  });
  el.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-node]')) el.querySelectorAll('.edge.on').forEach((a) => a.classList.remove('on'));
  });

  const redraw = () => {
    clearTimeout(redrawT);
    redrawT = setTimeout(() => drawEdges(el, t), 120);
  };
  addEventListener('resize', redraw);

  return {
    title: t.name,
    el,
    after: () => {
      drawEdges(el, t);
      // fonts change the height of the cards and therefore the measured positions
      if (document.fonts?.ready) document.fonts.ready.then(() => drawEdges(el, t));
    },
    onLeave: () => {
      removeEventListener('resize', redraw);
      removeEventListener('keydown', keys);
      // the class is on the BODY and the screen is about to be replaced: left
      // behind, it would hide the next screen under `overflow:hidden`
      document.body.classList.remove('graph-full');
    },
  };
}
