/* ==========================================================================
   Aula — uma SEÇÃO por vez.

   Antes, a aula inteira era uma página e uma caixinha de "concluída". Com 4
   horas de carga média por tópico e metade deles enumerando três ou mais
   assuntos no título, isso era uma parede de texto com um marco só no fim.
   Agora cada seção é uma tela, e a última — quando o tópico tem exercícios —
   é a avaliação.

   TODA SEÇÃO DE CONTEÚDO ABRE COM UM QUADRO DE VÍDEO, reservado quando ainda
   não há id. É a mesma decisão da vitrine, e pelo mesmo motivo escrito lá: o
   espaço já fica guardado, então publicar os vídeos um a um não reorganiza a
   tela de ninguém. (Numa versão anterior o quadro só aparecia onde a seção
   declarasse `video`, para não espalhar retângulos vazios — mas isso fazia a
   aula mudar de forma conforme o vídeo chegasse, que é exatamente o defeito
   que reservar o espaço existe para evitar.)

   A seção de avaliação não tem vídeo: ali o aluno responde, não assiste.
   ========================================================================== */

import * as api from '../api.js';
import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { secoesDaAula } from '../aulas.js';
import { secaoConcluida, visitarSecao } from '../estado.js';
import { montarExercicio } from '../exercicios/index.js';
import { irPara } from '../rotas.js';
import { vazio } from './comum.js';
import { esc, prosa } from '../texto.js';

/* A seção seguinte e a anterior atravessam a fronteira da aula: no fim da
   última seção o "próxima" leva à primeira seção da aula seguinte. Sem isso o
   aluno teria de voltar ao curso a cada tópico, que é atrito puro. */
function vizinhas(cursoId, ix, pos) {
  const aulas = aulasDoCurso(cursoId);
  const secoes = secoesDaAula(cursoId, aulas[ix].chave);
  const anterior = pos > 0
    ? { ix, secId: secoes[pos - 1].id }
    : (ix > 0
      ? { ix: ix - 1, secId: ultimaSecao(cursoId, aulas, ix - 1) }
      : null);
  const proxima = pos + 1 < secoes.length
    ? { ix, secId: secoes[pos + 1].id }
    : (ix + 1 < aulas.length
      ? { ix: ix + 1, secId: secoesDaAula(cursoId, aulas[ix + 1].chave)[0].id }
      : null);
  return { anterior, proxima };
}

const ultimaSecao = (cursoId, aulas, ix) => {
  const s = secoesDaAula(cursoId, aulas[ix].chave);
  return s[s.length - 1].id;
};

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
      '<span class="passo-n">' + (s.tipo === 'avaliacao' ? '✓' : String(i + 1).padStart(2, '0')) + '</span>' +
      '<span class="passo-tit">' + esc(s.titulo) + '</span>' +
    '</a>'
  )).join('');

  el.innerHTML =
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
            : '<p class="aval-intro">' + secao.quantos + ' ' +
                txt('exercícios, cobrindo o tópico inteiro e não só a última seção.') + '</p>') +
          '<div class="lista-ex"></div>' +
        '</section>'
      : '<section class="bloco aula-texto">' +
          (secao.corpo
            ? prosa(secao.corpo)
            : '<p class="mono dim">' + txt('[conteúdo da aula — entra com o material real na Etapa 2]') + '</p>') +
        '</section>') +

    '<footer class="aula-pe">' +
      /* Avaliação sem exercícios não se conclui: marcar "feito" o que não foi
         feito é a forma mais barata de um portal mentir sobre progresso. */
      (secao.pendente
        ? '<span class="pe-nota mono dim">' + txt('nada a concluir aqui ainda') + '</span>'
        : '<button type="button" class="btn ' + (feita ? 'btn-ghost' : 'btn-primary') + ' marcar">' +
            (feita ? '✓ ' + txt('seção concluída') : txt('Marcar como concluída')) +
          '</button>') +
      '<div class="aula-nav">' +
        (anterior ? '<a class="btn btn-ghost" href="' + rota(anterior) + '">← ' + txt('anterior') + '</a>' : '') +
        (proxima ? '<a class="btn btn-ghost" href="' + rota(proxima) + '">' + txt('próxima') + ' →</a>' : '') +
      '</div>' +
    '</footer>';

  if (secao.tipo === 'avaliacao') {
    const exercicios = await api.exerciciosDaAula(id, a.chave);
    const lista = el.querySelector('.lista-ex');
    exercicios.forEach((ex, i) => lista.appendChild(montarExercicio(ex, { cursoId: id, aulaIx: n }, i)));
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

  const botaoMarcar = el.querySelector('.marcar');
  if (botaoMarcar) botaoMarcar.addEventListener('click', async (e) => {
    const agoraFeita = !secaoConcluida(id, n, secao.id);
    await api.concluirSecao(id, n, secao.id, agoraFeita);
    const b = e.currentTarget;
    b.className = 'btn ' + (agoraFeita ? 'btn-ghost' : 'btn-primary') + ' marcar';
    b.textContent = agoraFeita ? '✓ ' + txt('seção concluída') : txt('Marcar como concluída');
    el.querySelectorAll('.passo')[pos].classList.toggle('feito', agoraFeita);
    // concluir e seguir é o gesto natural: sem isto a pessoa marca e procura
    // o botão de avançar, que está do outro lado do rodapé
    if (agoraFeita && proxima) irPara(rota(proxima).slice(1));
    else if (agoraFeita && !proxima) irPara('/curso/' + id);
  });

  return { titulo: a.titulo + ' · ' + secao.titulo, el };
}
