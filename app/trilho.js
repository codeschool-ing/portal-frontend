/* ==========================================================================
   O trilho lateral.

   Responde, sem clique, as duas perguntas que o aluno faz o tempo todo: onde
   estou e quanto falta. Por isso ele MUDA DE CONTEÚDO conforme a rota — dentro
   de um curso é a lista de aulas; fora, é a navegação do portal com a trilha
   logo abaixo.

   Dentro de um curso ele é uma SANFONA: só a aula atual mostra as seções. As
   demais ficam recolhidas. A alternativa — todas abertas — colocaria umas
   quarenta linhas num curso médio e transformaria o trilho numa segunda tela
   de rolagem, que é o oposto do trabalho dele.
   ========================================================================== */

import { aulasDoCurso, cursoPorId, caminhoDaTrilha } from './catalogo.js';
import { secoesDaAula } from './aulas.js';
import { aulaConcluida, secaoConcluida, progressoDaAula, progressoDoCurso, opcaoAtiva } from './estado.js';
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
  const aberta = el.querySelector('.trilho-aula.on');
  if (aberta) aberta.scrollIntoView({ block: 'nearest' });
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
    const p = progressoDoCurso(id);
    const est = estadoDoCurso(id);
    return '<a class="trilho-curso no-' + est + '" href="#/curso/' + esc(id) + '">' +
      '<span class="tc-marca" data-estado="' + est + '" aria-hidden="true"></span>' +
      '<span class="tc-nome">' + esc(c.nome) + '</span>' +
      '<span class="tc-conta">' + p.feitas + '/' + p.total + '</span>' +
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
  const p = progressoDoCurso(id);
  const atual = caminho.match(/\/aula\/(\d+)(?:\/([^/]+))?$/);
  const ixAtual = atual ? Number(atual[1]) : -1;
  const secAtual = atual && atual[2] ? decodeURIComponent(atual[2]) : null;

  const linhas = aulas.map((a) => {
    const secoes = secoesDaAula(id, a.chave);
    const feita = aulaConcluida(id, a.ix);
    const ehAtual = a.ix === ixAtual;
    const pa = progressoDaAula(id, a.ix);

    const cabeca =
      '<a class="trilho-aula' + (feita ? ' feita' : '') + (ehAtual ? ' on' : '') + '" ' +
        'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(secoes[0].id) + '">' +
        '<span class="ta-marca" aria-hidden="true">' + (feita ? '✓' : '·') + '</span>' +
        '<span class="ta-num">' + String(a.ix + 1).padStart(2, '0') + '</span>' +
        '<span class="ta-tit">' + esc(a.titulo) + '</span>' +
        (secoes.length > 1
          ? '<span class="ta-conta">' + pa.feitas + '/' + pa.total + '</span>'
          : '') +
      '</a>';

    // só a aula atual abre: ver o cabeçalho deste arquivo
    if (!ehAtual || secoes.length < 2) return cabeca;

    const dentro = secoes.map((s) =>
      '<a class="trilho-secao' + (secaoConcluida(id, a.ix, s.id) ? ' feita' : '') +
        (s.id === secAtual ? ' on' : '') + (s.tipo === 'avaliacao' ? ' aval' : '') + '" ' +
        'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(s.id) + '">' +
        '<span class="ts-marca" aria-hidden="true"></span>' +
        '<span class="ts-tit">' + esc(s.titulo) + '</span>' +
      '</a>').join('');

    return cabeca + '<div class="trilho-secoes">' + dentro + '</div>';
  }).join('');

  return (
    '<a class="trilho-voltar" href="#/trilha">← ' + txt('minha trilha') + '</a>' +
    '<div class="trilho-sec">' +
      '<span class="trilho-tit">' + esc(c.nome) + '</span>' +
      barra(p.pct, p.feitas + ' de ' + p.total) +
      '<span class="trilho-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções') + '</span>' +
      '<div class="trilho-aulas">' + linhas + '</div>' +
    '</div>'
  );
}
