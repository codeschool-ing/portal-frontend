/* ==========================================================================
   O trilho lateral.

   Responde, sem clique, as duas perguntas que o aluno faz o tempo todo: onde
   estou e quanto falta. Por isso ele MUDA DE CONTEÚDO conforme a rota — dentro
   de um curso, ele é a lista de aulas; fora, é a navegação do portal com a
   trilha logo abaixo. Um trilho que mostrasse sempre a mesma coisa obrigaria a
   pessoa a sair da aula para saber quantas faltam.
   ========================================================================== */

import { aulasDoCurso, cursoPorId, caminhoDaTrilha } from './catalogo.js';
import { aulaConcluida, progressoDoCurso, opcaoAtiva } from './estado.js';
import { estadoDoCurso } from './grafo.js';
import { trilhaDoAluno, barra } from './telas/comum.js';
import { esc } from './texto.js';

const LINKS = [
  { href: '#/painel', rotulo: 'Painel' },
  { href: '#/trilha', rotulo: 'Minha trilha' },
  { href: '#/catalogo', rotulo: 'Catálogo' },
  { href: '#/certificados', rotulo: 'Certificados' },
];

export function montarTrilho(el, caminho, params) {
  const dentroDeCurso = caminho.startsWith('/curso/');
  el.innerHTML = dentroDeCurso ? doCurso(params, caminho) : global(caminho);
}

function global(caminho) {
  const t = trilhaDoAluno();
  const links = LINKS.map((l) =>
    '<a class="trilho-link' + (caminho === l.href.slice(1) ? ' on' : '') + '" href="' + l.href + '">' +
      txt(l.rotulo) + '</a>').join('');

  if (!t) return '<nav class="trilho-nav">' + links + '</nav>';

  const cursos = caminhoDaTrilha(t, opcaoAtiva).map((id) => {
    const c = cursoPorId(id);
    if (!c) return '';
    const total = aulasDoCurso(id).length;
    const p = progressoDoCurso(id, total);
    const est = estadoDoCurso(id);
    return '<a class="trilho-curso no-' + est + '" href="#/curso/' + esc(id) + '">' +
      '<span class="tc-marca" data-estado="' + est + '" aria-hidden="true"></span>' +
      '<span class="tc-nome">' + esc(c.nome) + '</span>' +
      '<span class="tc-conta">' + p.feitas + '/' + total + '</span>' +
    '</a>';
  }).join('');

  return (
    '<nav class="trilho-nav">' + links + '</nav>' +
    '<div class="trilho-sec">' +
      '<span class="trilho-tit">' + esc(t.nome) + '</span>' +
      '<div class="trilho-cursos">' + cursos + '</div>' +
    '</div>'
  );
}

function doCurso(params, caminho) {
  const id = params?.id;
  const c = cursoPorId(id);
  if (!c) return global(caminho);
  const aulas = aulasDoCurso(id);
  const p = progressoDoCurso(id, aulas.length);
  const atual = caminho.match(/\/aula\/(\d+)$/);
  const ixAtual = atual ? Number(atual[1]) : -1;

  return (
    '<a class="trilho-voltar" href="#/trilha">← ' + txt('minha trilha') + '</a>' +
    '<div class="trilho-sec">' +
      '<span class="trilho-tit">' + esc(c.nome) + '</span>' +
      barra(p.pct, p.feitas + ' de ' + aulas.length) +
      '<span class="trilho-conta">' + p.feitas + '/' + aulas.length + ' ' + txt('aulas') + '</span>' +
      '<div class="trilho-aulas">' +
        aulas.map((a) => {
          const feita = aulaConcluida(id, a.ix);
          return '<a class="trilho-aula' + (feita ? ' feita' : '') + (a.ix === ixAtual ? ' on' : '') + '" ' +
            'href="#/curso/' + esc(id) + '/aula/' + a.ix + '">' +
            '<span class="ta-marca" aria-hidden="true">' + (feita ? '✓' : '·') + '</span>' +
            '<span class="ta-num">' + String(a.ix + 1).padStart(2, '0') + '</span>' +
            '<span class="ta-tit">' + esc(a.titulo) + '</span>' +
          '</a>';
        }).join('') +
      '</div>' +
    '</div>'
  );
}
