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

   2. Não há mais botão de concluir. Ele e a seta faziam a mesma coisa, e
      juntar os dois num "Concluir e continuar" só adiou a pergunta: se avançar
      já era concluir, o botão era um segundo caminho para o mesmo gesto.

      AGORA AVANÇAR É CONCLUIR. Passar para a próxima seção marca a atual como
      feita — que é o que o aluno já queria dizer ao clicar em avançar. O
      feedback continua imediato e em dois lugares: o passo ganha o check e o
      trilho também.

      O que se perde, e vale saber: não há mais como marcar sem sair da seção,
      nem desmarcar. Quem passar batido acumula progresso sem ter lido. É a
      troca aceita em favor de um gesto só — e ela combina com o resto do
      portal, que mostra e não tranca.
   ========================================================================== */

import * as api from '../api.js';
import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { secoesDaAula, materiaisDaSecao } from '../aulas.js';
import { listaDeMateriais } from '../materiais.js';
import { sectionDone as secaoConcluida, visitSection as visitarSecao, noteFor as notaDe, saveNote as guardarNota } from '../state.js';
import { buildAssessment as montarAvaliacao } from '../exercises/index.js';
import { vazio } from './comum.js';
import { esc, prose as prosa } from '../text.js';

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

  const { anterior, proxima } = vizinhas(id, n, pos);
  const nota = notaDe(id, n, secao.id);
  const rota = (v) => '#/curso/' + esc(id) + '/aula/' + v.ix + '/' + esc(v.secId);

  const el = document.createElement('div');
  const temVideoAqui = secao.tipo === 'conteudo' && secao.video !== undefined;
  el.className = 'tela tela-aula' + (temVideoAqui ? ' aula-com-video' : ' aula-so-texto');

  const passos = secoes.map((s, i) => (
    '<a class="passo' + (i === pos ? ' on' : '') + (secaoConcluida(id, n, s.id) ? ' feito' : '') +
      (s.tipo === 'avaliacao' ? ' passo-aval' : '') + (s.pendente ? ' passo-pendente' : '') + '" ' +
      'href="#/curso/' + esc(id) + '/aula/' + n + '/' + esc(s.id) + '">' +
      '<span class="passo-n">' + (s.tipo === 'avaliacao' ? '★' : String(i + 1).padStart(2, '0')) + '</span>' +
      '<span class="passo-tit">' + esc(s.titulo) + '</span>' +
    '</a>'
  )).join('');

  /* A seta de avançar existe SEMPRE. Na última seção do curso ela leva à
     página do curso — se ela sumisse ali, a última seção seria a única que
     nunca poderia ser concluída, porque concluir passou a ser avançar. */
  const destinoProximo = proxima ? rota(proxima) : '#/curso/' + esc(id);
  const lateral = (destino, lado, seta, rotulo, avanca) => (destino
    ? '<a class="lado-seta lado-' + lado + (avanca ? ' avancar' : '') + '" href="' + destino +
      '" aria-label="' + txt(rotulo) + '">' + seta + '</a>'
    : '');

  /* O QUADRO DE VÍDEO SÓ EXISTE ONDE A SEÇÃO DIZ QUE TEM VÍDEO.

     Ele já esteve em toda seção de conteúdo, reservado, com o argumento de que
     publicar os vídeos um a um não reorganizaria a tela de ninguém. O
     argumento continua bom para a seção que VAI ter vídeo — e é péssimo para a
     que nunca vai. Uma seção de texto com um retângulo cinza em cima promete
     algo que não vem, e a promessa não expira.

     O que resolve é a seção DECLARAR:

       video: 'ID'   um vídeo publicado — toca ali
       video: true   vai ter vídeo, ainda não tem — o espaço fica guardado
       (ausente)     seção de texto: nenhum quadro, nenhuma promessa

     A reserva não se perdeu; ela deixou de ser automática e passou a ser dita.

     E a seção com vídeo TROCA DE LAYOUT: o player sobe para o topo, de ponta a
     ponta da área de conteúdo, e o título desce para baixo dele. Vídeo é o que
     a pessoa veio fazer ali — pôr um cabeçalho na frente empurra o play para
     baixo da dobra em tela de notebook. */
  const temVideo = temVideoAqui;
  const videoPronto = temVideo && typeof secao.video === 'string' && secao.video;

  el.innerHTML =
    lateral(anterior && rota(anterior), 'esq', SETA_ESQ, 'seção anterior') +
    lateral(destinoProximo, 'dir', SETA_DIR, 'concluir e ir para a próxima seção', true) +

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

    /* O PLAYER VEM DEPOIS DO CABEÇALHO. Ele já esteve antes, para não empurrar
       o play para baixo da dobra — e o preço era a pessoa cair numa seção sem
       saber de que aula ela é. Onde estou vem antes de o que assisto, e a
       resposta é a mesma nas seções de texto. */
    (temVideo
      ? '<div class="video-fachada" data-video="' + esc(videoPronto || '') + '">' +
          (videoPronto
            ? '<button type="button" class="video-play" aria-label="' + txt('Assistir') + '">▶</button>'
            : '<span class="video-breve mono dim">' + txt('vídeo em breve') + '</span>') +
          (secao.duracao ? '<span class="video-duracao mono">' + esc(secao.duracao) + '</span>' : '') +
        '</div>'
      : '') +

    (secao.tipo === 'avaliacao'
      ? '<section class="bloco aula-exercicios' + (secao.pendente ? ' aval-pendente' : '') + '">' +
          (secao.pendente
            ? '<p class="mono dim">' + txt('[avaliação em preparação — os exercícios deste tópico ainda não foram produzidos]') + '</p>'
            : '') +
        '</section>'
      /* Seção só de vídeo não ganha bloco de texto nenhum — nem o aviso de
         "conteúdo a entrar", que ali seria falso: o conteúdo é o vídeo. O
         aviso continua valendo para a aula ainda sem nada escrito. */
      : (secao.corpo
        ? '<section class="bloco aula-texto">' + prosa(secao.corpo) + '</section>'
        : (temVideo
          ? ''
          : '<section class="bloco aula-texto"><p class="mono dim">' +
            txt('[conteúdo da aula — entra com o material real na Etapa 2]') + '</p></section>'))) +

    /* O material vem DEPOIS do texto e ANTES da anotação: baixar o PDF é o que
       se faz tendo lido, e anotar é o último gesto da seção. */
    listaDeMateriais(materiaisDaSecao(secao)) +

    /* A anotação fica no FIM da seção, e não flutuando ao lado: anotar é o que
       se faz depois de ler, não durante. Recolhida quando vazia, para não pedir
       atenção de quem não vai usar. */
    '<details class="nota" ' + (nota ? 'open' : '') + '>' +
      '<summary>' + (nota ? '✎ ' + txt('sua anotação') : '＋ ' + txt('anotar esta seção')) + '</summary>' +
      '<textarea class="nota-campo" rows="4" placeholder="' +
        txt('o que você quer lembrar desta seção…') + '">' + esc(nota) + '</textarea>' +
      '<span class="nota-estado mono dim" aria-live="polite"></span>' +
    '</details>' +

    /* O rodapé só existe onde não há setas laterais — abaixo de 1400px. Não
       há botão de concluir: avançar é concluir. */
    '<footer class="aula-pe">' +
      (anterior ? '<a class="btn btn-ghost" href="' + rota(anterior) + '">← ' + txt('anterior') + '</a>' : '<span></span>') +
      '<a class="btn btn-primary avancar" href="' + destinoProximo + '">' + txt('próxima') + ' →</a>' +
    '</footer>';

  if (secao.tipo === 'avaliacao' && !secao.pendente) {
    const exercicios = await api.lessonExercises(id, a.chave);
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

  /* A nota grava sozinha, com um respiro depois da última tecla. Botão de
     salvar seria uma chance a mais de perder o que se escreveu. */
  const campoNota = el.querySelector('.nota-campo');
  const aviso = el.querySelector('.nota-estado');
  let gravarT = null;
  campoNota.addEventListener('input', () => {
    clearTimeout(gravarT);
    aviso.textContent = txt('escrevendo…');
    gravarT = setTimeout(() => {
      guardarNota(id, n, secao.id, campoNota.value);
      aviso.textContent = txt('anotação salva');
      setTimeout(() => { aviso.textContent = ''; }, 1600);
    }, 600);
  });
  // sair da seção não pode perder o que ainda não gravou
  campoNota.addEventListener('blur', () => {
    clearTimeout(gravarT);
    guardarNota(id, n, secao.id, campoNota.value);
  });

  /* Avançar conclui. A marcação é síncrona por dentro, então acontece antes de
     o navegador processar a troca de hash — não há corrida. A avaliação ainda
     sem exercícios fica de fora: não há o que concluir nela. */
  el.addEventListener('click', (e) => {
    if (!e.target.closest('.avancar')) return;
    if (secao.pendente) return;
    if (!secaoConcluida(id, n, secao.id)) api.completeSection(id, n, secao.id, true);
  });

  return { titulo: a.titulo + ' · ' + secao.titulo, el };
}
