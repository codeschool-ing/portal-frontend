/* ==========================================================================
   A prova — a do fim de um curso e a do fim de uma trilha, na mesma tela.

   As duas diferem em três coisas: de onde saem as questões, quantas são, e
   para onde o botão de voltar aponta. Tudo o mais é igual, e por isso é uma
   tela só: duas telas iguais divergem no dia em que alguém corrige uma.

   ELA NÃO TRANCA. Dá para abrir a prova do curso sem ter feito uma aula. O
   portal inteiro mostra e não tranca — a trilha é recomendação, a avaliação
   não exige acerto para avançar —, e uma prova que travasse seria a única
   exceção. O que ela faz é AVISAR: fazer a prova com 20% do curso lido é uma
   decisão do aluno, mas tem de ser uma decisão informada.
   ========================================================================== */

import {
  courseById as cursoPorId,
} from '../catalog.js';
import { courseProgress as progressoDoCurso, activeOption as opcaoAtiva, examResult as resultadoProva, examAttempts as tentativasDeProva, saveExam as guardarProva } from '../state.js';
import { courseExam as provaDoCurso, trackExam as provaDaTrilha, examScore as notaDaProva, PASS_MARK as MINIMO } from '../exams.js';
import { buildAssessment as montarAvaliacao } from '../exercises/index.js';
import { studentTrack as trilhaDoAluno, trackProgress as progressoDaTrilha, bar as barra, empty as vazio } from '../screens/common.js';
import { esc } from '../text.js';

function montar(prova, progresso) {
  const anterior = resultadoProva(prova.chave);
  const tentativa = tentativasDeProva(prova.chave);
  const pronto = progresso.pct >= 100;

  const el = document.createElement('div');
  el.className = 'tela tela-prova';

  if (!prova.itens.length) {
    el.innerHTML =
      '<header class="tela-head">' +
        '<h1>' + txt('Prova') + ' · ' + esc(prova.titulo) + '</h1>' +
      '</header>' +
      '<section class="bloco aval-pendente"><p class="mono dim">' +
        txt('[prova em preparação — este curso ainda não tem exercícios produzidos]') +
      '</p></section>';
    return el;
  }

  el.innerHTML =
    '<nav class="migalhas">' +
      '<a href="' + prova.voltarPara + '">' + esc(prova.titulo) + '</a>' +
      '<span aria-hidden="true">›</span>' +
      '<span>' + txt(prova.escopo === 'trilha' ? 'prova da trilha' : 'prova final') + '</span>' +
    '</nav>' +

    '<header class="tela-head">' +
      '<h1>' + txt(prova.escopo === 'trilha' ? 'Prova da trilha' : 'Prova final do curso') + '</h1>' +
      '<p>' + esc(prova.titulo) + '</p>' +
    '</header>' +

    '<section class="bloco prova-regras">' +
      '<ul class="prosa-lista">' +
        '<li>' + prova.itens.length + ' ' + txt('questões, sorteadas do banco do') + ' ' +
          txt(prova.escopo === 'trilha' ? 'conjunto de cursos da trilha.' : 'curso.') + '</li>' +
        '<li>' + txt('O resultado de cada questão só aparece no fim — aqui a prova mede, não ensina.') + '</li>' +
        '<li>' + txt('Mínimo para passar:') + ' <strong>' + MINIMO + '%</strong>.</li>' +
        '<li>' + txt('Refazer sorteia uma prova diferente. Vale o melhor resultado.') + '</li>' +
      '</ul>' +
      (anterior
        ? '<p class="prova-antes' + (anterior.aprovado ? ' passou' : '') + '">' +
            (anterior.aprovado ? '✓ ' + txt('Você já passou nesta prova.') : txt('Sua melhor nota até agora:')) +
            ' <strong>' + anterior.melhor + '%</strong> ' +
            txt('em') + ' ' + anterior.tentativas + ' ' +
            txt(anterior.tentativas === 1 ? 'tentativa' : 'tentativas') + '.' +
          '</p>'
        : '') +
      (pronto
        ? ''
        : '<p class="prova-aviso">' +
            txt('Você concluiu') + ' <strong>' + progresso.pct + '%</strong> ' +
            txt('do conteúdo. A prova não tranca — mas cobre o material inteiro.') +
          '</p>') +
    '</section>' +

    '<section class="bloco prova-palco"></section>';

  /* O resultado da prova é escrito PELA TELA, não pelo wizard: é aqui que
     "aprovado" quer dizer alguma coisa, e é aqui que ele é gravado. */
  const aoEntregar = ({ estados }) => {
    const n = notaDaProva(estados);
    guardarProva(prova.chave, {
      pct: n.pct, aprovado: n.aprovado, certos: n.certos, total: n.julgadas,
    });
    return {
      html:
        '<span class="wz-res-rot">' + txt(n.aprovado ? 'aprovado' : 'ainda não') + '</span>' +
        '<p class="wz-res-nota prova-nota' + (n.aprovado ? ' passou' : ' faltou') + '">' +
          '<strong>' + n.pct + '%</strong>' +
        '</p>' +
        '<p class="wz-res-obs">' + n.certos + ' ' + txt('de') + ' ' + n.julgadas + ' ' +
          txt('questões corrigidas') + ' · ' + txt('mínimo') + ' ' + MINIMO + '%</p>' +
        (n.aprovado
          ? '<p class="wz-res-obs">' + txt('O certificado sai na tela de Certificados.') + '</p>'
          : '<p class="wz-res-obs">' + txt('Refaça quando quiser: a próxima prova é sorteada de novo.') + '</p>'),
    };
  };

  el.querySelector('.prova-palco').appendChild(
    montarAvaliacao(
      prova.itens.map((i) => i.ex),
      prova.itens.map((i) => i.ctx),
      { prova: true, aoEntregar },
    ),
  );

  return el;
}

export async function provaCurso({ id }) {
  const c = cursoPorId(id);
  if (!c) return { titulo: txt('Prova'), el: vazio(txt('Curso não encontrado.')) };
  const prova = provaDoCurso(id, tentativasDeProva('curso:' + id));
  return { titulo: txt('Prova') + ' · ' + c.nome, el: montar(prova, progressoDoCurso(id)) };
}

export async function provaTrilha() {
  const t = trilhaDoAluno();
  if (!t) return { titulo: txt('Prova'), el: vazio(txt('Você ainda não escolheu uma trilha.')) };
  const prova = provaDaTrilha(t, opcaoAtiva, tentativasDeProva('trilha:' + t.id));
  return { titulo: txt('Prova') + ' · ' + t.nome, el: montar(prova, progressoDaTrilha(t)) };
}

/* Cartão que anuncia a prova, no fim da página do curso e da trilha. É a
   mesma peça nos dois lugares porque é a mesma promessa. */
export function cartaoDeProva({ chave, href, escopo, quantas, progresso }) {
  const r = resultadoProva(chave);
  const estado = r?.aprovado ? 'passou' : (r ? 'tentou' : 'novo');
  return '<section class="bloco prova-cartao ' + estado + '">' +
    '<div class="prova-cartao-texto">' +
      '<span class="prova-cartao-rot mono">' +
        txt(escopo === 'trilha' ? 'fim da trilha' : 'fim do curso') + '</span>' +
      '<h2>' + txt(escopo === 'trilha' ? 'Prova da trilha' : 'Prova final') + '</h2>' +
      '<p>' + quantas + ' ' + txt('questões sorteadas') + ' · ' + txt('mínimo') + ' ' + MINIMO + '% · ' +
        txt('resultado só no fim') + '</p>' +
      (r
        ? '<p class="prova-cartao-nota' + (r.aprovado ? ' passou' : '') + '">' +
            (r.aprovado ? '✓ ' + txt('aprovado com') : txt('melhor nota:')) + ' ' + r.melhor + '%</p>'
        : '') +
    '</div>' +
    '<div class="prova-cartao-acao">' +
      (progresso !== undefined ? barra(progresso, progresso + '%') : '') +
      '<a class="btn btn-primary" href="' + href + '">' +
        txt(r ? 'Refazer a prova' : 'Fazer a prova') + ' →</a>' +
    '</div>' +
  '</section>';
}
