/* ==========================================================================
   Course — the syllabus the vitrine shows, plus the list of lessons.

   LESSON = TOPIC. The catalogue has no concept of a lesson; the finest grain is
   `topicos`, and the pipeline's exercises are already indexed by the topic text.
   Inventing a third key here would create a mapping to keep in sync with two
   ends that already agree with each other.
   ========================================================================== */

import { courseLessons, courseById, tracksWithCourse, unlockedBy } from '../catalog.js';
import { lessonSections, courseMaterials } from '../lessons.js';
import { courseProgress, lessonProgress, lessonDone } from '../state.js';
import { courseState } from '../graph.js';
import { courseExam } from '../exams.js';
import { examCard } from './exam.js';
import { materialList } from '../materials.js';
import { bar, empty } from './common.js';
import { esc, formatted } from '../text.js';

export default async function course({ id }) {
  const c = courseById(id);
  if (!c) return { titulo: txt('Curso'), el: empty(txt('Curso não encontrado.')) };

  const lessons = courseLessons(id);
  const p = courseProgress(id);
  const st = courseState(id);
  const opens = unlockedBy(id);
  const exam = courseExam(id);
  const materials = courseMaterials(id);

  const el = document.createElement('div');
  el.className = 'tela tela-curso';

  el.innerHTML =
    '<header class="curso-head">' +
      '<span class="no-estado" data-estado="' + st + '">' + txt({
        concluido: 'concluído', atual: 'em andamento', disponivel: 'disponível', adiante: 'mais adiante',
      }[st]) + '</span>' +
      '<h1>' + esc(c.nome) + '</h1>' +
      '<p class="curso-resumo">' + esc(c.resumo) + '</p>' +
      '<div class="curso-meta">' +
        '<span>' + c.horas + 'h</span>' +
        '<span>' + txt(c.nivel) + '</span>' +
        '<span>' + lessons.length + ' ' + txt('aulas') + '</span>' +
        '<span>' + txt('em') + ' ' + tracksWithCourse(id).length + ' ' + txt('trilhas') + '</span>' +
      '</div>' +
      bar(p.pct, p.feitas + ' de ' + p.total) +
      '<p class="curso-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções concluídas') + '</p>' +
    '</header>' +

    '<div class="curso-colunas">' +
      /* The main column is ONE child of the grid, not two: the exam lives inside
         it, below the lessons. Loose, it became a second column and pushed the
         sidebar down to the next row. */
      '<div class="curso-principal">' +
      '<section class="bloco">' +
        '<div class="bloco-topo"><h2>' + txt('Aulas') + '</h2></div>' +
        '<ol class="aulas">' +
          lessons.map((a) => {
            const done = lessonDone(id, a.ix);
            const sections = lessonSections(id, a.chave);
            const pa = lessonProgress(id, a.ix);
            const hasAssessment = sections.some((s) => s.tipo === 'avaliacao');
            return '<li><a class="aula-linha' + (done ? ' feita' : '') + '" ' +
              'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(sections[0].id) + '">' +
              '<span class="aula-marca" aria-hidden="true">' + (done ? '✓' : '') + '</span>' +
              '<span class="aula-num">' + String(a.ix + 1).padStart(2, '0') + '</span>' +
              '<span class="aula-tit">' + esc(a.titulo) + '</span>' +
              '<span class="aula-secoes">' +
                (sections.length > 1 ? sections.length + ' ' + txt('seções') : txt('1 seção')) +
                (hasAssessment ? ' · ' + txt('com avaliação') : '') +
              '</span>' +
              '<span class="aula-prog">' + pa.feitas + '/' + pa.total + '</span>' +
            '</a></li>';
          }).join('') +
        '</ol>' +
      '</section>' +

      /* The exam closes the lesson column, not the sidebar: it is the last step
         of the course, and its place is after the last lesson. */
      (exam.itens.length
        ? examCard({
          chave: exam.chave, href: '#/curso/' + esc(id) + '/prova', escopo: 'curso',
          quantas: exam.itens.length, progresso: p.pct,
        })
        : '') +
      '</div>' +

      '<aside class="curso-lado">' +
        (materials.length
          ? '<section class="bloco">' + materialList(materials, { titulo: 'Material do curso' }) + '</section>'
          : '') +
        (c.ementa?.length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Ementa') + '</h2></div>' +
            '<ul class="ementa">' + c.ementa.map((l) => '<li>' + esc(l) + '</li>').join('') + '</ul></section>'
          : '') +
        (c.requisitos
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Pré-requisitos') + '</h2></div>' +
            '<p class="requisitos">' + formatted(c.requisitos) + '</p></section>'
          : '') +
        ((c.depende || []).length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Depois de') + '</h2></div>' +
            '<div class="ligados">' + c.depende.map((d) => link(d, 'antes')).join('') + '</div></section>'
          : '') +
        (opens.length
          ? '<section class="bloco"><div class="bloco-topo"><h2>' + txt('Abre caminho para') + '</h2></div>' +
            '<div class="ligados">' + opens.map((x) => link(x.id, 'depois')).join('') + '</div></section>'
          : '') +
      '</aside>' +
    '</div>';

  return { titulo: c.nome, el };
}

function link(id, dir) {
  const c = courseById(id);
  if (!c) return '';
  return '<a class="elo elo-' + dir + '" href="#/curso/' + esc(id) + '">' + esc(c.nome) + '</a>';
}
