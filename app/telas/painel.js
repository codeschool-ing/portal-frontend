/* ==========================================================================
   Painel.

   O primeiro elemento é "continuar de onde parou". Num LMS essa é a ação da
   maioria das sessões, e enterrá-la atrás de dois cliques é o defeito mais
   comum da categoria — a pessoa entrou para estudar, não para navegar.
   ========================================================================== */

import * as api from '../api.js';
import { aulasDoCurso, cursoPorId, caminhoDaTrilha } from '../catalogo.js';
import { progressoDoCurso, opcaoAtiva } from '../estado.js';
import { estadoDoCurso } from '../grafo.js';
import { progressoDaTrilha, trilhaDoAluno, barra } from './comum.js';
import { esc } from '../texto.js';

export default async function painel() {
  const el = document.createElement('div');
  el.className = 'tela tela-painel';

  const sessao = await api.sessao();
  const t = trilhaDoAluno();
  const seguir = await api.continuarDe();

  const retomar = (() => {
    if (!seguir) return '';
    const c = cursoPorId(seguir.cursoId);
    const aulas = aulasDoCurso(seguir.cursoId);
    const a = aulas[seguir.aulaIx] || aulas[0];
    if (!c || !a) return '';
    const p = progressoDoCurso(c.id, aulas.length);
    return (
      '<a class="retomar" href="#/curso/' + esc(c.id) + '/aula/' + a.ix + '">' +
        '<span class="retomar-rot">' + txt('continuar de onde parou') + '</span>' +
        '<span class="retomar-aula">' + esc(a.titulo) + '</span>' +
        '<span class="retomar-curso">' + esc(c.nome) + ' · ' +
          txt('aula') + ' ' + (a.ix + 1) + ' ' + txt('de') + ' ' + aulas.length + '</span>' +
        barra(p.pct, p.feitas + ' de ' + aulas.length) +
        '<span class="retomar-btn btn btn-primary">' + txt('Continuar') + ' →</span>' +
      '</a>'
    );
  })();

  const pt = t ? progressoDaTrilha(t) : null;

  // os próximos passos: o que está disponível agora, na ordem da trilha
  const proximos = t
    ? caminhoDaTrilha(t, opcaoAtiva)
      .map((id) => ({ id, est: estadoDoCurso(id) }))
      .filter((x) => x.est === 'atual' || x.est === 'disponivel')
      .slice(0, 4)
    : [];

  el.innerHTML =
    '<header class="tela-head">' +
      '<span class="tag">// ' + txt('painel') + '</span>' +
      '<h1>' + txt('Olá') + ', ' + esc(sessao?.nome || txt('aluno')) + '</h1>' +
    '</header>' +

    retomar +

    (t
      ? '<section class="bloco">' +
          '<div class="bloco-topo">' +
            '<h2>' + esc(t.nome) + '</h2>' +
            '<a class="bloco-link" href="#/trilha">' + txt('ver o mapa') + ' →</a>' +
          '</div>' +
          '<div class="trilha-numeros">' +
            '<span><b>' + pt.pct + '%</b>' + txt('da trilha') + '</span>' +
            '<span><b>' + pt.feitas + '/' + pt.total + '</b>' + txt('aulas') + '</span>' +
            '<span><b>' + pt.cursos + '</b>' + txt('cursos no caminho') + '</span>' +
            '<span><b>→</b>' + esc(t.saida) + '</span>' +
          '</div>' +
          barra(pt.pct, pt.pct + '%') +
        '</section>'
      : '<section class="bloco"><p class="vazio">' + txt('Você ainda não escolheu uma trilha.') + '</p></section>') +

    (proximos.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo"><h2>' + txt('Próximos passos') + '</h2></div>' +
          '<div class="cartoes">' +
            proximos.map(({ id, est }) => {
              const c = cursoPorId(id);
              const total = aulasDoCurso(id).length;
              const p = progressoDoCurso(id, total);
              return '<a class="cartao no-' + est + '" href="#/curso/' + esc(id) + '">' +
                '<span class="no-estado" data-estado="' + est + '">' +
                  txt(est === 'atual' ? 'em andamento' : 'disponível') + '</span>' +
                '<span class="cartao-nome">' + esc(c.nome) + '</span>' +
                '<span class="cartao-meta">' + c.horas + 'h · ' + txt(c.nivel) + '</span>' +
                barra(p.pct, p.feitas + ' de ' + total) +
                '<span class="cartao-conta">' + p.feitas + '/' + total + ' ' + txt('aulas') + '</span>' +
              '</a>';
            }).join('') +
          '</div>' +
        '</section>'
      : '');

  return { titulo: txt('Painel'), el };
}
