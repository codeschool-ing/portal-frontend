/* ==========================================================================
   The side rail.

   It answers, without a click, the two questions a student asks all the time:
   where am I and how much is left. Its content changes with the route — inside a
   course it is the list of lessons; outside, it is the portal's navigation with
   the track just below.

   THE HIERARCHY HAS TO BE VISIBLE AT A GLANCE. Before, a lesson and a section
   were two similar rows with different indents, and you could not tell one from
   the other without reading. Now the lesson is a HEADING — uppercase,
   monospaced, with a counter — and the section is an ordinary row with an icon.
   They are two things of different natures and they now look like two things.

   Every section carries an ICON. It says two things at once: the STATE (a green
   check on what is done) and the NATURE of what is coming (play for video, lines
   for reading, a star for the assessment). Before, everything was a play, which
   promised video in every section — including the text-only ones.

   MORE THAN ONE LESSON CAN BE OPEN. The earlier version was a pure accordion:
   only the current lesson opened. That forces you to close what you are looking
   at to peek at what comes next, and comparing two lessons becomes impossible.
   Now the current one opens by itself and the others open on a click, with the
   state kept for as long as the session lasts.
   ========================================================================== */

import { courseLessons, courseById, trackPath } from './catalog.js';
import { lessonSections } from './lessons.js';
import {
  lessonDone, sectionDone, lessonProgress, courseProgress, activeOption, examPassed,
} from './state.js';
import { courseExam } from './exams.js';
import { courseState } from './graph.js';
import { studentTrack, bar } from './screens/common.js';
import { esc } from './text.js';

const LINKS = [
  { href: '#/painel', rotulo: 'Painel' },
  { href: '#/trilha', rotulo: 'Minha trilha' },
  { href: '#/catalogo', rotulo: 'Catálogo' },
  { href: '#/desempenho', rotulo: 'Desempenho' },
  { href: '#/notas', rotulo: 'Notas' },
  { href: '#/certificados', rotulo: 'Certificados' },
];

const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.5l5 3.5-5 3.5z" fill="currentColor"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18"/>' +
  '<path d="M4.8 8.2l2.2 2.2 4.2-4.4" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CHEVRON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6l3 3 3-3"/></svg>';
const ICON_TEXT = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M3.5 4h9M3.5 7h9M3.5 10h6"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" ' +
  'stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M8 2.5l1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.2l-3.4 1.8.7-3.8L2.5 6.5l3.8-.5z"/></svg>';
const ICON_TROPHY = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4.5 2.5h7v3a3.5 3.5 0 0 1-7 0zM4.5 3.5H3a1.5 1.5 0 0 0 1.5 3M11.5 3.5H13a1.5 1.5 0 0 1-1.5 3M8 9v2.5M6 13.5h4"/></svg>';

/* Which lessons are open, per course. It lives in memory: it is a navigation
   preference of the moment, not progress — it does not deserve storage, nor a
   trip to the server in Etapa 2. */
const opened = {};
const openKey = (courseId, ix) => courseId + ':' + ix;
export const toggleLesson = (courseId, ix) => {
  const k = openKey(courseId, ix);
  opened[k] = !opened[k];
};

export function buildRail(el, path, params) {
  const insideCourse = path.startsWith('/curso/');
  el.innerHTML = insideCourse ? courseRail(params, path) : globalRail(path);
  const open = el.querySelector('.trilho-aula.on');
  if (open) open.scrollIntoView({ block: 'nearest' });
}

function globalRail(path) {
  const t = studentTrack();
  const links = LINKS.map((l) =>
    '<a class="trilho-link' + (path === l.href.slice(1) ? ' on' : '') + '" href="' + l.href + '">' +
      txt(l.rotulo) + '</a>').join('');

  if (!t) return '<nav class="trilho-nav">' + links + '</nav>';

  const courses = trackPath(t, activeOption).map((id) => {
    const c = courseById(id);
    if (!c) return '';
    const p = courseProgress(id);
    const st = courseState(id);
    return '<a class="trilho-curso no-' + st + '" href="#/curso/' + esc(id) + '">' +
      '<span class="tc-marca" data-estado="' + st + '" aria-hidden="true"></span>' +
      '<span class="tc-nome">' + esc(c.nome) + '</span>' +
      '<span class="tc-conta">' + p.feitas + '/' + p.total + '</span>' +
    '</a>';
  }).join('');

  return (
    '<nav class="trilho-nav">' + links + '</nav>' +
    '<div class="trilho-sec">' +
      '<span class="trilho-tit">' + esc(t.nome) + '</span>' +
      '<div class="trilho-cursos">' + courses + '</div>' +
    '</div>'
  );
}

function courseRail(params, path) {
  const id = params?.id;
  const c = courseById(id);
  if (!c) return globalRail(path);

  const lessons = courseLessons(id);
  const p = courseProgress(id);
  const here = path.match(/\/aula\/(\d+)(?:\/([^/]+))?$/);
  const currentIx = here ? Number(here[1]) : -1;
  const currentSec = here && here[2] ? decodeURIComponent(here[2]) : null;

  const rows = lessons.map((a) => {
    const sections = lessonSections(id, a.chave);
    const done = lessonDone(id, a.ix);
    const isCurrent = a.ix === currentIx;
    const pa = lessonProgress(id, a.ix);
    /* The current lesson opens on its own, so for it the record means "I closed
       it by hand"; for the others it means "I opened it by hand". One map, read
       inverted where the default is inverted. */
    const marked = Boolean(opened[openKey(id, a.ix)]);
    const open = isCurrent ? !marked : marked;

    const head =
      '<div class="trilho-aula' + (done ? ' feita' : '') + (isCurrent ? ' on' : '') + (open ? ' aberta' : '') + '">' +
        '<button type="button" class="ta-abrir" data-aula="' + a.ix + '" ' +
          'aria-expanded="' + open + '" aria-label="' + txt('Mostrar seções') + '">' + ICON_CHEVRON + '</button>' +
        '<a class="ta-titulo" href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(sections[0].id) + '">' +
          '<span class="ta-num">' + txt('aula') + ' ' + String(a.ix + 1).padStart(2, '0') + '</span>' +
          '<span class="ta-tit">' + esc(a.titulo) + '</span>' +
        '</a>' +
        '<span class="ta-conta">' + pa.feitas + '/' + pa.total + '</span>' +
      '</div>';

    if (!open) return head;

    const inside = sections.map((s) => {
      const ok = sectionDone(id, a.ix, s.id);
      /* The icon says what the section IS, not only its state: play for what has
         video, a page for what is reading, a star for the assessment. Before,
         every section was a play, which promised video in all of them. */
      const mark = ok ? ICON_CHECK
        : (s.tipo === 'avaliacao' ? ICON_STAR
          : (s.video !== undefined ? ICON_PLAY : ICON_TEXT));
      return '<a class="trilho-secao' + (ok ? ' feita' : '') +
        (s.id === currentSec && isCurrent ? ' on' : '') +
        (s.tipo === 'avaliacao' ? ' aval' : '') + (s.pending ? ' pendente' : '') + '" ' +
        'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(s.id) + '">' +
        '<span class="ts-marca" aria-hidden="true">' + mark + '</span>' +
        '<span class="ts-meio">' +
          '<span class="ts-tit">' + esc(s.titulo) + '</span>' +
          (s.duracao ? '<span class="ts-dur mono">' + esc(s.duracao) + '</span>' : '') +
        '</span>' +
      '</a>';
    }).join('');

    return head + '<div class="trilho-secoes">' + inside + '</div>';
  }).join('');

  /* The exam comes in as a row at the end of the list, shaped like a section —
     because that is what it is to someone navigating: the last item of the
     course. It only shows up where there is a question bank, for the same reason
     as the pending assessment: announcing what does not exist is noise. */
  const exam = courseExam(id);
  const onExam = path === '/curso/' + id + '/prova';
  const passed = examPassed(exam.chave);
  const examRow = exam.items.length
    ? '<a class="trilho-prova' + (passed ? ' feita' : '') + (onExam ? ' on' : '') + '" ' +
      'href="#/curso/' + esc(id) + '/prova">' +
      '<span class="ts-marca" aria-hidden="true">' + (passed ? ICON_CHECK : ICON_TROPHY) + '</span>' +
      '<span class="ts-tit">' + txt('Prova final') + '</span>' +
    '</a>'
    : '';

  return (
    '<a class="trilho-voltar" href="#/trilha">← ' + txt('minha trilha') + '</a>' +
    '<div class="trilho-sec">' +
      '<span class="trilho-tit">' + esc(c.nome) + '</span>' +
      bar(p.pct, p.feitas + ' de ' + p.total) +
      '<span class="trilho-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções') + '</span>' +
      '<div class="trilho-aulas">' + rows + '</div>' +
      examRow +
    '</div>'
  );
}
