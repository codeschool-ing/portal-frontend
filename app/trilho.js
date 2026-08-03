/* ==========================================================================
   O trilho lateral.

   Responde, sem clique, as duas perguntas que o aluno faz o tempo todo: onde
   estou e quanto falta. Muda de conteúdo conforme a rota — dentro de um curso
   é a lista de aulas; fora, é a navegação do portal com a trilha logo abaixo.

   A HIERARQUIA PRECISA SER VISÍVEL DE RELANCE. Antes, aula e seção eram duas
   linhas parecidas com recuos diferentes, e não dava para distinguir uma da
   outra sem ler. Agora a aula é um CABEÇALHO — caixa alta, monoespaçada, com
   contador — e a seção é uma linha comum com ícone. São duas coisas de
   naturezas diferentes e passam a parecer duas coisas.

   Cada seção traz um ÍCONE DE ESTADO: play para o que falta, check verde para
   o que foi feito. O ícone diz o estado sem depender de cor sozinha, e diz
   também o que aquilo é — algo para percorrer, não um item de lista.

   MAIS DE UMA AULA PODE FICAR ABERTA. A versão anterior era sanfona pura: só
   a aula atual abria. Isso obriga a fechar o que se está vendo para espiar o
   que vem depois, e a comparação entre duas aulas fica impossível. Agora a
   atual abre sozinha e as outras abrem a clique, com o estado guardado
   enquanto a sessão durar.
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

const ICO_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4.5l5 3.5-5 3.5z" fill="currentColor"/></svg>';
const ICO_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true">' +
  '<circle cx="8" cy="8" r="7" fill="currentColor" opacity=".18"/>' +
  '<path d="M4.8 8.2l2.2 2.2 4.2-4.4" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICO_CHEVRON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6l3 3 3-3"/></svg>';

/* Quais aulas estão abertas, por curso. Vive em memória: é preferência de
   navegação do momento, não progresso — não merece ocupar o armazenamento
   nem viajar para o servidor na Etapa 2. */
const abertas = {};
const chaveAberta = (cursoId, ix) => cursoId + ':' + ix;
export const alternarAula = (cursoId, ix) => {
  const k = chaveAberta(cursoId, ix);
  abertas[k] = !abertas[k];
};

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
    /* A aula atual abre sozinha, então para ela o registro significa
       "fechei à mão"; para as outras significa "abri à mão". Um mapa só, com
       leitura invertida onde o padrão é invertido. */
    const marcada = Boolean(abertas[chaveAberta(id, a.ix)]);
    const aberto = ehAtual ? !marcada : marcada;

    const cabeca =
      '<div class="trilho-aula' + (feita ? ' feita' : '') + (ehAtual ? ' on' : '') + (aberto ? ' aberta' : '') + '">' +
        '<button type="button" class="ta-abrir" data-aula="' + a.ix + '" ' +
          'aria-expanded="' + aberto + '" aria-label="' + txt('Mostrar seções') + '">' + ICO_CHEVRON + '</button>' +
        '<a class="ta-titulo" href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(secoes[0].id) + '">' +
          '<span class="ta-num">' + txt('aula') + ' ' + String(a.ix + 1).padStart(2, '0') + '</span>' +
          '<span class="ta-tit">' + esc(a.titulo) + '</span>' +
        '</a>' +
        '<span class="ta-conta">' + pa.feitas + '/' + pa.total + '</span>' +
      '</div>';

    if (!aberto) return cabeca;

    const dentro = secoes.map((s) => {
      const ok = secaoConcluida(id, a.ix, s.id);
      return '<a class="trilho-secao' + (ok ? ' feita' : '') +
        (s.id === secAtual && ehAtual ? ' on' : '') +
        (s.tipo === 'avaliacao' ? ' aval' : '') + (s.pendente ? ' pendente' : '') + '" ' +
        'href="#/curso/' + esc(id) + '/aula/' + a.ix + '/' + esc(s.id) + '">' +
        '<span class="ts-marca" aria-hidden="true">' + (ok ? ICO_CHECK : ICO_PLAY) + '</span>' +
        '<span class="ts-tit">' + esc(s.titulo) + '</span>' +
      '</a>';
    }).join('');

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
