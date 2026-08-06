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

    const arrow = e.target.closest('.graph-arrow[data-scroll]');
    if (arrow) {
      const scroller = el.querySelector('.track-graph');
      scroller.scrollBy({ left: Number(arrow.dataset.scroll) * Math.max(220, scroller.clientWidth - 80), behavior: 'smooth' });
    }
  });

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
    onLeave: () => removeEventListener('resize', redraw),
  };
}
