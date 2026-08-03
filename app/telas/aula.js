/* ==========================================================================
   Aula — onde o aluno realmente passa o tempo.

   Três blocos, nesta ordem: o que assistir, o que ler, o que fazer. O terceiro
   é o único que já existe de verdade; os outros dois estão reservados, e a
   tela diz isso em vez de fingir conteúdo.

   O QUADRO DE VÍDEO É UMA FACHADA, como na vitrine: mostra a capa e um botão,
   e só carrega o player depois do clique. Quem não assiste não recebe cookie
   nenhum do YouTube, e a aula abre leve. Aula sem vídeo mostra o quadro
   reservado — o espaço já fica guardado, então publicar os vídeos um a um não
   reorganiza a tela de ninguém.
   ========================================================================== */

import * as api from '../api.js';
import { aulasDoCurso, cursoPorId } from '../catalogo.js';
import { aulaConcluida, visitarAula } from '../estado.js';
import { montarExercicio } from '../exercicios/index.js';
import { irPara } from '../rotas.js';
import { vazio } from './comum.js';
import { esc } from '../texto.js';

export default async function aula({ id, ix }) {
  const c = cursoPorId(id);
  const aulas = aulasDoCurso(id);
  const n = Number(ix);
  const a = aulas[n];
  if (!c || !a) return { titulo: txt('Aula'), el: vazio(txt('Aula não encontrada.')) };

  visitarAula(id, n);

  // `a.chave` e não `a.titulo`: o título é traduzido, a chave é o português
  const exercicios = await api.exerciciosDaAula(id, a.chave);
  const feita = aulaConcluida(id, n);

  const el = document.createElement('div');
  el.className = 'tela tela-aula';

  el.innerHTML =
    '<nav class="migalhas">' +
      '<a href="#/curso/' + esc(id) + '">' + esc(c.nome) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt('aula') + ' ' + (n + 1) + ' ' + txt('de') + ' ' + aulas.length + '</span>' +
    '</nav>' +

    '<h1 class="aula-titulo">' + esc(a.titulo) + '</h1>' +

    '<div class="video-fachada" data-video="' + esc(c.video || '') + '">' +
      (c.video
        ? '<button type="button" class="video-play" aria-label="' + txt('Assistir') + '">▶</button>'
        : '<span class="video-breve mono dim">' + txt('vídeo em breve') + '</span>') +
    '</div>' +

    '<section class="bloco aula-texto">' +
      '<p class="mono dim">' + txt('[conteúdo da aula — entra com o material real na Etapa 2]') + '</p>' +
    '</section>' +

    '<section class="bloco aula-exercicios">' +
      '<div class="bloco-topo">' +
        '<h2>' + txt('Exercícios') + '</h2>' +
        (exercicios.length ? '<span class="conta-ex">' + exercicios.length + '</span>' : '') +
      '</div>' +
      '<div class="lista-ex"></div>' +
    '</section>' +

    '<footer class="aula-pe">' +
      '<button type="button" class="btn ' + (feita ? 'btn-ghost' : 'btn-primary') + ' marcar">' +
        (feita ? '✓ ' + txt('aula concluída') : txt('Marcar como concluída')) +
      '</button>' +
      '<div class="aula-nav">' +
        (n > 0 ? '<a class="btn btn-ghost" href="#/curso/' + esc(id) + '/aula/' + (n - 1) + '">← ' + txt('anterior') + '</a>' : '') +
        (n + 1 < aulas.length ? '<a class="btn btn-ghost" href="#/curso/' + esc(id) + '/aula/' + (n + 1) + '">' + txt('próxima') + ' →</a>' : '') +
      '</div>' +
    '</footer>';

  const lista = el.querySelector('.lista-ex');
  if (!exercicios.length) {
    lista.innerHTML = '<p class="vazio">' + txt('Esta aula ainda não tem exercícios.') + '</p>';
  } else {
    exercicios.forEach((ex, i) => lista.appendChild(montarExercicio(ex, { cursoId: id, aulaIx: n }, i)));
  }

  /* a fachada só vira player depois do clique */
  el.querySelector('.video-fachada').addEventListener('click', (e) => {
    const cx = e.currentTarget;
    if (!cx.dataset.video) return;
    cx.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(cx.dataset.video) +
      '?autoplay=1" title="' + esc(a.titulo) + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
  });

  el.querySelector('.marcar').addEventListener('click', async (e) => {
    const agoraFeita = !aulaConcluida(id, n);
    await api.concluirAula(id, n, agoraFeita);
    const b = e.currentTarget;
    b.className = 'btn ' + (agoraFeita ? 'btn-ghost' : 'btn-primary') + ' marcar';
    b.textContent = agoraFeita ? '✓ ' + txt('aula concluída') : txt('Marcar como concluída');
    // concluir a última aula do curso é um marco: leva de volta ao curso para
    // a pessoa ver a barra fechar, em vez de ficar numa aula já terminada
    if (agoraFeita && n + 1 >= aulas.length) irPara('/curso/' + id);
  });

  return { titulo: a.titulo, el };
}
