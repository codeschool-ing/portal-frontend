/* ==========================================================================
   Dashboard.

   The first element is "carry on from where you stopped". In an LMS that is the
   action of most sessions, and burying it behind two clicks is the most common
   defect of the category — the person came in to study, not to navigate.
   ========================================================================== */

import * as api from '../api.js';
import { courseLessons, courseById, trackPath } from '../catalog.js';
import { lessonSections } from '../lessons.js';
import { courseProgress, activeOption } from '../state.js';
import { courseState } from '../graph.js';
import { trackProgress, studentTrack, bar } from './common.js';
import { esc } from '../text.js';

export default async function dashboard() {
  const el = document.createElement('div');
  el.className = 'tela tela-painel';

  const session = await api.session();
  const t = studentTrack();
  const next = await api.resumeFrom();

  /* The card points at the SECTION, not at the top of the lesson: sending
     someone back to the start of a four-hour topic is sending them back to
     scrolling. */
  const resume = (() => {
    if (!next) return '';
    const c = courseById(next.courseId);
    const lessons = courseLessons(next.courseId);
    const a = lessons[next.lessonIx] || lessons[0];
    if (!c || !a) return '';
    const sections = lessonSections(c.id, a.key);
    const s = sections.find((x) => x.id === next.sectionId) || sections[0];
    const p = courseProgress(c.id);
    return (
      '<a class="retomar" href="#/curso/' + esc(c.id) + '/aula/' + a.ix + '/' + esc(s.id) + '">' +
        '<span class="retomar-rot">' + txt('continuar de onde parou') + '</span>' +
        '<span class="retomar-aula">' + esc(s.title) + '</span>' +
        '<span class="retomar-curso">' + esc(c.name) + ' · ' + esc(a.title) + '</span>' +
        '<span class="retomar-onde mono dim">' +
          txt('aula') + ' ' + (a.ix + 1) + '/' + lessons.length + ' · ' +
          txt('seção') + ' ' + (sections.indexOf(s) + 1) + '/' + sections.length +
        '</span>' +
        bar(p.pct, p.feitas + ' de ' + p.total) +
        '<span class="retomar-btn btn btn-primary">' + txt('Continuar') + ' →</span>' +
      '</a>'
    );
  })();

  const pt = t ? trackProgress(t) : null;

  // what comes next: whatever is available right now, in track order
  const upcoming = t
    ? trackPath(t, activeOption)
      .map((id) => ({ id, st: courseState(id) }))
      .filter((x) => x.st === 'atual' || x.st === 'disponivel')
      .slice(0, 4)
    : [];

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Olá') + ', ' + esc(session?.name || txt('aluno')) + '</h1>' +
    '</header>' +

    resume +

    (t
      ? '<section class="bloco">' +
          '<div class="bloco-topo">' +
            '<h2>' + esc(t.name) + '</h2>' +
            '<a class="bloco-link" href="#/trilha">' + txt('ver o mapa') + ' →</a>' +
          '</div>' +
          '<div class="trilha-numeros">' +
            '<span><b>' + pt.pct + '%</b>' + txt('da trilha') + '</span>' +
            '<span><b>' + pt.feitas + '/' + pt.total + '</b>' + txt('seções') + '</span>' +
            '<span><b>' + pt.courses + '</b>' + txt('cursos no caminho') + '</span>' +
            '<span><b>→</b>' + esc(t.outcome) + '</span>' +
          '</div>' +
          bar(pt.pct, pt.pct + '%') +
        '</section>'
      : '<section class="bloco"><p class="vazio">' + txt('Você ainda não escolheu uma trilha.') + '</p></section>') +

    (upcoming.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo"><h2>' + txt('Próximos passos') + '</h2></div>' +
          '<div class="cartoes">' +
            upcoming.map(({ id, st }) => {
              const c = courseById(id);
              const p = courseProgress(id);
              return '<a class="cartao no-' + st + '" href="#/curso/' + esc(id) + '">' +
                '<span class="no-estado" data-estado="' + st + '">' +
                  txt(st === 'atual' ? 'em andamento' : 'disponível') + '</span>' +
                '<span class="cartao-nome">' + esc(c.name) + '</span>' +
                '<span class="cartao-meta">' + c.hours + 'h · ' + txt(c.level) + '</span>' +
                bar(p.pct, p.feitas + ' de ' + p.total) +
                '<span class="cartao-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções') + '</span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</section>'
      : '');

  return { title: txt('Painel'), el };
}
