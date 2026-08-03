/* ==========================================================================
   Aula — uma SEÇÃO por vez.

   TODA SEÇÃO DE CONTEÚDO ABRE COM UM QUADRO DE VÍDEO, reservado quando ainda
   não há id: o espaço já fica guardado, então publicar os vídeos um a um não
   reorganiza a tela de ninguém. A avaliação não tem vídeo — ali o aluno
   responde, não assiste.

   DUAS COISAS QUE MUDARAM DE LUGAR, E POR QUÊ

   1. "Anterior" e "próxima" saíram do rodapé e viraram setas nas LATERAIS, em
      tela larga. O conteúdo é preso a uma coluna de leitura, então sobra
      espaço nos dois lados e falta na vertical — onde cada pixel gasto é
      texto empurrado para baixo da dobra. Abaixo de 1180px não há lateral
      sobrando e elas voltam para o rodapé.

   2. O botão de concluir e o de avançar faziam a mesma coisa: marcar já
      levava adiante. Agora é UM botão — "Concluir e continuar" —, que é o
      gesto real. Quem só quer passar adiante usa a seta; quem terminou usa o
      botão. E quem marcou por engano tem um "desmarcar" discreto, que antes
      não existia.
   ========================================================================== */

import * as api from '../api.js';
import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { secoesDaAula } from '../aulas.js';
import { secaoConcluida, visitarSecao } from '../estado.js';
import { montarAvaliacao } from '../exercicios/index.js';
import { irPara } from '../rotas.js';
import { vazio } from './comum.js';
import { esc, prosa } from '../texto.js';

const SETA = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
const SETA_ESQ = SETA('M15 5l-7 7 7 7');
const SETA_DIR = SETA('M9 5l7 7-7 7');

/* A seção seguinte e a anterior atravessam a fronteira da aula: no fim da
   última seção o "próxima" leva à primeira seção da aula seguinte. Sem isso o
   aluno voltaria ao índice do curso a cada tópico, que é atrito puro. */
function vizinhas(cursoId, ix, pos) {
  const aulas = aulasDoCurso(cursoId);
  const secoes = secoesDaAula(cursoId, aulas[ix].chave);
  const ultimaDe = (i) => {
    const s = secoesDaAula(cursoId, aulas[i].chave);
    return s[s.length - 1].id;
  };
  const anterior = pos > 0
    ? { ix, secId: secoes[pos - 1].id }
    : (ix > 0 ? { ix: ix - 1, secId: ultimaDe(ix - 1) } : null);
  const proxima = pos + 1 < secoes.length
    ? { ix, secId: secoes[pos + 1].id }
    : (ix + 1 < aulas.length
      ? { ix: ix + 1, secId: secoesDaAula(cursoId, aulas[ix + 1].chave)[0].id }
      : null);
  return { anterior, proxima };
}

export default async function aula({ id, ix, sec }) {
  const c = cursoPorId(id);
  const aulas = aulasDoCurso(id);
  const n = Number(ix);
  const a = aulas[n];
  if (!c || !a) return { titulo: txt('Aula'), el: vazio(txt('Aula não encontrada.')) };

  const secoes = secoesDaAula(id, a.chave);
  const pos = Math.max(0, secoes.findIndex((s) => s.id === sec));
  const secao = secoes[pos];

  visitarSecao(id, n, secao.id);

  const feita = secaoConcluida(id, n, secao.id);
  const { anterior, proxima } = vizinhas(id, n, pos);
  const rota = (v) => '#/curso/' + esc(id) + '/aula/' + v.ix + '/' + esc(v.secId);

  const el = document.createElement('div');
  el.className = 'tela tela-aula';

  const passos = secoes.map((s, i) => (
    '<a class="passo' + (i === pos ? ' on' : '') + (secaoConcluida(id, n, s.id) ? ' feito' : '') +
      (s.tipo === 'avaliacao' ? ' passo-aval' : '') + (s.pendente ? ' passo-pendente' : '') + '" ' +
      'href="#/curso/' + esc(id) + '/aula/' + n + '/' + esc(s.id) + '">' +
      '<span class="passo-n">' + (s.tipo === 'avaliacao' ? '★' : String(i + 1).padStart(2, '0')) + '</span>' +
      '<span class="passo-tit">' + esc(s.titulo) + '</span>' +
    '</a>'
  )).join('');

  const lateral = (v, lado, seta, rotulo) => (v
    ? '<a class="lado-seta lado-' + lado + '" href="' + rota(v) + '" aria-label="' + txt(rotulo) + '">' + seta + '</a>'
    : '');

  el.innerHTML =
    lateral(anterior, 'esq', SETA_ESQ, 'seção anterior') +
    lateral(proxima, 'dir', SETA_DIR, 'próxima seção') +

    '<nav class="migalhas">' +
      '<a href="#/curso/' + esc(id) + '">' + esc(c.nome) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt('aula') + ' ' + (n + 1) + ' ' + txt('de') + ' ' + aulas.length + '</span>' +
    '</nav>' +

    '<header class="aula-cabeca">' +
      '<h1 class="aula-titulo">' + esc(a.titulo) + '</h1>' +
      '<nav class="passos" aria-label="' + txt('Seções desta aula') + '">' + passos + '</nav>' +
    '</header>' +

    '<h2 class="secao-titulo">' + esc(secao.titulo) + '</h2>' +

    (secao.tipo === 'conteudo'
      ? '<div class="video-fachada" data-video="' + esc(secao.video || '') + '">' +
          (secao.video
            ? '<button type="button" class="video-play" aria-label="' + txt('Assistir') + '">▶</button>'
            : '<span class="video-breve mono dim">' + txt('vídeo em breve') + '</span>') +
        '</div>'
      : '') +

    (secao.tipo === 'avaliacao'
      ? '<section class="bloco aula-exercicios' + (secao.pendente ? ' aval-pendente' : '') + '">' +
          (secao.pendente
            ? '<p class="mono dim">' + txt('[avaliação em preparação — os exercícios deste tópico ainda não foram produzidos]') + '</p>'
            : '') +
        '</section>'
      : '<section class="bloco aula-texto">' +
          (secao.corpo
            ? prosa(secao.corpo)
            : '<p class="mono dim">' + txt('[conteúdo da aula — entra com o material real na Etapa 2]') + '</p>') +
        '</section>') +

    '<footer class="aula-pe">' +
      (secao.pendente
        ? '<span class="pe-nota mono dim">' + txt('nada a concluir aqui ainda') + '</span>'
        : '<button type="button" class="btn ' + (feita ? 'btn-ghost' : 'btn-primary') + ' marcar">' +
            (feita ? txt('Continuar') + ' →' : txt('Concluir e continuar') + ' →') +
          '</button>' +
          (feita ? '<button type="button" class="pe-desmarcar">' + txt('desmarcar') + '</button>' : '')) +
      /* as mesmas duas rotas das setas laterais, para quando não há lateral */
      '<div class="aula-nav">' +
        (anterior ? '<a class="btn btn-ghost" href="' + rota(anterior) + '">← ' + txt('anterior') + '</a>' : '') +
        (proxima ? '<a class="btn btn-ghost" href="' + rota(proxima) + '">' + txt('próxima') + ' →</a>' : '') +
      '</div>' +
    '</footer>';

  if (secao.tipo === 'avaliacao' && !secao.pendente) {
    const exercicios = await api.exerciciosDaAula(id, a.chave);
    el.querySelector('.aula-exercicios').appendChild(montarAvaliacao(exercicios, { cursoId: id, aulaIx: n }));
  }

  const quadro = el.querySelector('.video-fachada');
  if (quadro) {
    quadro.addEventListener('click', (e) => {
      const cx = e.currentTarget;
      if (!cx.dataset.video) return;
      cx.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(cx.dataset.video) +
        '?autoplay=1" title="' + esc(secao.titulo) + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    });
  }

  const seguir = () => {
    if (proxima) irPara(rota(proxima).slice(1));
    else irPara('/curso/' + id);
  };

  const marcar = el.querySelector('.marcar');
  if (marcar) marcar.addEventListener('click', async () => {
    if (!secaoConcluida(id, n, secao.id)) await api.concluirSecao(id, n, secao.id, true);
    seguir();
  });

  const desmarcar = el.querySelector('.pe-desmarcar');
  if (desmarcar) desmarcar.addEventListener('click', async () => {
    await api.concluirSecao(id, n, secao.id, false);
    irPara(location.hash.slice(1));   // remonta a tela no estado novo
    globalThis.redesenharTudo?.();
  });

  return { titulo: a.titulo + ' · ' + secao.titulo, el };
}
