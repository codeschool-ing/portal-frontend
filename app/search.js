/* ==========================================================================
   Global search.

   The magnifier button and `⌘K` had been in the bar since day one and both only
   led to the catalogue — a shortcut that promised search and delivered
   navigation. This module is what was missing for them to stop lying.

   WHY IT MATTERS MORE HERE THAN ON AN ORDINARY SITE: there are 86 courses and
   1,503 lessons. The catalogue's field searches courses, and nothing else.
   Someone who remembers "that part about the DNS TTL" has no route to it at all
   — not through the menu, not through the graph, not through the rail.

   WHAT IT INDEXES, in order of decreasing usefulness:
     sections   — the grain people actually look for ("how to pick a CDN")
     lessons    — the catalogue topic
     courses    — name, summary, syllabus
     exercises  — the prompt
     notes      — what the student wrote themselves

   TWO DECISIONS THAT COME FROM DEFECTS ALREADY PAID FOR IN THIS PROJECT

   1. It matches against the DISPLAYED text and against the PORTUGUESE text at
      the same time. The catalogue is translated at runtime, so in an
      English-language browser the lesson title is "Hosting: shared, VPS, cloud
      and CDN" — but the sections, the notes and the exercises are in Portuguese.
      Indexing only one of the two would make half the content vanish from search
      depending on the language, which is exactly the defect that already bit the
      exercise join and the section matching.

   2. It ignores accents. Someone typing "coercao" wants to find "coerção", and
      on a phone people almost always type without accents.

   The group keys (`secoes`, `aulas`, `cursos`…) stay in Portuguese: they are
   i18n keys for the group labels, and the key is the Portuguese text by design.
   ========================================================================== */

import { courseLessons, courseById } from './catalog.js';
import { lessonSections, lessonExercises } from './lessons.js';
import { allNotes } from './state.js';

/* lowercase and accent-free, on both sides of the comparison */
const fold = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');   // the combining marks, by code point

const plainText = (body) => (body || [])
  .map((b) => {
    if (Array.isArray(b)) return b.join(' ');
    if (b && typeof b === 'object') return b.texto || '';
    return b;
  })
  .join(' ');

/* Section bodies are written with the minimal markup from `text.js` — backticks
   for code, ** for emphasis. It is interpreted when the section renders; in the
   search excerpt, which is plain text, it was left on screen as `**TTL**`. Strip
   it BEFORE deriving `raw` and `target`, or the two stop having the same length
   and the match index points at the wrong place. */
const stripMarkup = (s) => String(s || '').replace(/\*\*|`/g, '');

/* The index is expensive to build (1,503 lessons) and cheap to keep. It is
   cached and invalidated when something it indexes changes: language and
   notes. */
let index = null;
export const forgetIndex = () => { index = null; };

function buildIndex() {
  const items = [];
  /* `texts` is the BODY — the title goes in on its own, at the front, and
     `bodyFrom` marks where it ends. That is what stops the excerpt from
     repeating the title the result already shows above it: matching in the title
     now shows the start of the body, which is the new information. */
  const add = (group, title, sub, href, ...texts) => {
    // `raw` keeps the text as it reads; `target` is the folded version, for
    // matching. Without both, the excerpt would come out lowercase and unaccented.
    const head = stripMarkup(title);
    const raw = [head, ...texts.map(stripMarkup)].filter(Boolean).join(' ');
    items.push({ grupo: group, titulo: title, sub, href, bruto: raw, alvo: fold(raw), daqui: head.length + 1 });
  };

  CURSOS.forEach((c) => {
    add('cursos', c.nome, c.categoria + ' · ' + c.horas + 'h', '#/curso/' + c.id,
      c.resumo, c.categoria, (c.ementa || []).join(' '));

    const lessons = courseLessons(c.id);
    const hasContent = Boolean(window.AULAS?.[c.id]);

    lessons.forEach((a) => {
      const sections = lessonSections(c.id, a.chave);
      const first = '#/curso/' + c.id + '/aula/' + a.ix + '/' + sections[0].id;
      /* The translated title AND the Portuguese key: see the header of this
         file. In Portuguese the two are the same string, and then the key stays
         out — repeated, it would become the excerpt of the result. */
      add('aulas', a.titulo, c.nome, first, a.chave === a.titulo ? '' : a.chave);

      /* A section only becomes a result where the content was written. In the 84
         courses with no text, the "section" is a wrapper with the same name as
         the lesson, and listing it would return every result twice. */
      if (hasContent) {
        sections.forEach((s) => {
          if (s.tipo !== 'conteudo') return;
          add('secoes', s.titulo, c.nome + ' · ' + a.titulo,
            '#/curso/' + c.id + '/aula/' + a.ix + '/' + s.id,
            plainText(s.corpo));
        });
      }

      /* Only the prompt. The type was here once and left: nobody searches for
         "ordenacao", and as the item's body it became a one-word excerpt under
         every exercise. */
      lessonExercises(c.id, a.chave).forEach((ex) => {
        add('exercicios', ex.enunciado, c.nome + ' · ' + a.titulo,
          '#/curso/' + c.id + '/aula/' + a.ix + '/avaliacao');
      });
    });
  });

  allNotes().forEach((note) => {
    const c = courseById(note.cursoId);
    const a = courseLessons(note.cursoId)[note.aulaIx];
    if (!c || !a) return;
    add('notas', note.texto, c.nome + ' · ' + a.titulo,
      '#/curso/' + note.cursoId + '/aula/' + note.aulaIx + '/' + note.secId);
  });

  return items;
}

const GROUPS = ['secoes', 'aulas', 'cursos', 'exercicios', 'notas'];
export const GROUP_LABEL = {
  secoes: 'seções', aulas: 'aulas', cursos: 'cursos', exercicios: 'exercícios', notas: 'suas notas',
};

const PER_GROUP = 5;

export function search(term, { porGrupo = PER_GROUP } = {}) {
  const q = fold(term).trim();
  if (q.length < 2) return [];
  if (!index) index = buildIndex();

  const hits = [];
  index.forEach((it) => {
    const at = it.alvo.indexOf(q);
    if (at < 0) return;
    /* Simple, explainable scoring: matching at the start of the title is worth
       more than matching in the middle of the body. No statistical relevance —
       at this volume it would cost more in surprise than it earns in order. */
    const inTitle = fold(it.titulo).indexOf(q);
    const weight = (inTitle === 0 ? 0 : (inTitle > 0 ? 1 : 2)) * 1000 + at;
    hits.push({ ...it, peso: weight, onde: at });
  });

  hits.sort((a, b) => a.peso - b.peso);

  const out = [];
  GROUPS.forEach((g) => {
    const ofGroup = hits.filter((a) => a.grupo === g).slice(0, porGrupo);
    if (ofGroup.length) out.push({ grupo: g, itens: ofGroup });
  });
  return out;
}

/* A piece of the text around the match, so the result shows context instead of
   just the title. Without this, five sections of the same course look like five
   indistinguishable rows. */
export function excerpt(item, term, width = 90) {
  const q = fold(term).trim();
  const bodyFrom = item.daqui || 0;
  if (bodyFrom >= item.bruto.length) return '';   // no body: the title is already on screen

  /* Search from the body onwards. If the term only appears in the title, show
     the start of the body — repeating the title underneath it says nothing. */
  const inBody = item.alvo.indexOf(q, bodyFrom);
  const from = inBody < 0
    ? bodyFrom
    : Math.max(bodyFrom, inBody - Math.floor(width / 3));

  // both strings have the same length (folding does not change it), so the index
  // found in the folded one holds in the raw one
  const piece = item.bruto.slice(from, from + width);
  return (from > bodyFrom ? '…' : '') + piece + (from + width < item.bruto.length ? '…' : '');
}
