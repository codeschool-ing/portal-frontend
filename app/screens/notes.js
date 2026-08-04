/* ==========================================================================
   My notes — everything the student wrote, in one place.

   A note is the only thing in the portal that came neither from the catalogue
   nor from the pipeline: it belongs to the student. That is why it deserves a
   screen of its own instead of staying scattered across the sections where it
   was written — when it is time to revise, nobody remembers which section they
   noted what in.

   They also show up in the global search, under the "suas notas" group.
   ========================================================================== */

import { courseLessons, courseById } from '../catalog.js';
import { lessonSections } from '../lessons.js';
import { allNotes } from '../state.js';
import { empty } from './common.js';
import { esc } from '../text.js';

export default async function notes() {
  const list = allNotes();
  if (!list.length) {
    return {
      titulo: txt('Notas'),
      el: empty(txt('Você ainda não escreveu nenhuma nota. Elas ficam no fim de cada seção.')),
    };
  }

  /* Grouped by course: that is how you look for a note — "the thing I wrote in
     HTML and CSS" — not by date. */
  const byCourse = {};
  list.forEach((n) => { (byCourse[n.cursoId] = byCourse[n.cursoId] || []).push(n); });

  const el = document.createElement('div');
  el.className = 'tela tela-notas';
  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Suas anotações') + '</h1>' +
      '<p>' + list.length + ' ' + (list.length === 1 ? txt('nota') : txt('notas')) + '</p>' +
    '</header>' +
    Object.entries(byCourse).map(([courseId, ofCourse]) => {
      const c = courseById(courseId);
      const lessons = courseLessons(courseId);
      return '<section class="bloco">' +
        '<div class="bloco-topo">' +
          '<h2>' + esc(c ? c.nome : courseId) + '</h2>' +
          '<a class="bloco-link" href="#/curso/' + esc(courseId) + '">' + txt('abrir o curso') + ' →</a>' +
        '</div>' +
        ofCourse.map((n) => {
          const a = lessons[n.aulaIx];
          const s = a && lessonSections(courseId, a.chave).find((x) => x.id === n.secId);
          return '<article class="nota-item">' +
            '<a class="nota-onde" href="#/curso/' + esc(courseId) + '/aula/' + n.aulaIx + '/' + esc(n.secId) + '">' +
              (a ? esc(a.titulo) : '') + (s ? ' · ' + esc(s.titulo) : '') + ' →' +
            '</a>' +
            '<p class="nota-texto">' + esc(n.texto) + '</p>' +
          '</article>';
        }).join('') +
      '</section>';
    }).join('');

  return { titulo: txt('Notas'), el };
}
