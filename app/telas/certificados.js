/* ==========================================================================
   Certificados.

   DUAS UNIDADES AGORA, E NÃO UMA. Antes só existia certificado de CURSO,
   porque curso era a única unidade que o portal media. Com a prova da trilha
   existe a segunda: quem termina os cursos do caminho e passa na prova final
   da trilha leva um certificado da trilha inteira.

   Isso responde em parte — e só em parte — a pergunta que o README da vitrine
   deixou em aberto sobre a "unidade intermediária". A trilha é a unidade
   GRANDE; a pergunta de verdade é se existe algo entre um curso de 40h e uma
   trilha de 400h. Continua em aberto, e continua barata enquanto nenhum
   certificado tiver sido emitido para aluno real.

   O CERTIFICADO PASSOU A EXIGIR A PROVA. Concluir todas as seções diz que a
   pessoa PERCORREU o material — e como avançar é concluir, percorrer é quase
   automático. Um certificado que sai de percorrer não afirma nada sobre quem
   o recebe. A prova é o que faz o documento significar alguma coisa; sem ela
   não valia a pena emitir.

   OS EXEMPLOS EXISTEM PARA MOSTRAR O QUE VEM. Eles são marcados como exemplo
   na marcação, no texto e na aparência — um certificado falso parecido com um
   verdadeiro é um problema, não uma prévia. Somem assim que o aluno tem o
   certificado de verdade daquele tipo.
   ========================================================================== */

import { caminhoDaTrilha, cursoPorId } from '../catalogo.js';
import { cursoConcluido, opcaoAtiva, provaAprovada, resultadoProva, agora } from '../estado.js';
import { trilhaDoAluno } from './comum.js';
import { esc } from '../texto.js';

const DATA = (d) => new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(d);

/* Um código com cara de código. Determinístico, para não mudar a cada visita —
   um número de validação que muda sozinho é pior que nenhum. FUTURO: quem
   emite é o servidor, e aí ele passa a ser verificável de verdade. */
function codigo(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i += 1) h = (h * 33 + semente.charCodeAt(i)) >>> 0;
  const bloco = (n) => (n >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
  return 'CS-' + bloco(h) + '-' + bloco(h >>> 7) + '-' + bloco(h >>> 13);
}

/* O cartão. `exemplo` muda três coisas ao mesmo tempo — a moldura, o selo e o
   texto do código —, e é de propósito: quem olha rápido, quem lê o rótulo e
   quem for conferir o número recebem a mesma informação. */
function cartao({ rotulo, nome, meta, quem, quando, chave, exemplo, nota }) {
  return '<article class="cert' + (exemplo ? ' cert-exemplo' : '') + '">' +
    '<div class="term-bar">' +
      '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
      '<span class="modal-arquivo">certificado.' + esc(chave) + '</span>' +
      (exemplo ? '<span class="cert-selo">' + txt('exemplo') + '</span>' : '') +
    '</div>' +
    '<div class="cert-corpo">' +
      '<span class="cert-rot">' + txt(rotulo) + '</span>' +
      '<h2>' + esc(nome) + '</h2>' +
      '<p class="cert-meta">' + esc(meta) + '</p>' +
      '<div class="cert-linha">' +
        '<span class="cert-campo"><b>' + txt('aluno') + '</b>' + esc(quem) + '</span>' +
        '<span class="cert-campo"><b>' + txt('emitido em') + '</b>' + esc(quando) + '</span>' +
      '</div>' +
      '<p class="cert-codigo mono dim">' +
        (exemplo ? txt('exemplo — nenhum código foi emitido') : codigo(chave + quem)) +
      '</p>' +
      (nota ? '<p class="cert-nota mono dim">' + esc(nota) + '</p>' : '') +
    '</div>' +
  '</article>';
}

export default async function certificados() {
  const el = document.createElement('div');
  el.className = 'tela tela-certificados';

  const quem = agora().sessao?.nome || 'Aluno';
  const hoje = DATA(new Date());
  const t = trilhaDoAluno();
  const doCaminho = t ? caminhoDaTrilha(t, opcaoAtiva) : [];

  /* Curso concluído E prova passada. As duas condições, e nesta ordem, porque
     é assim que a tela explica o que falta quando falta. */
  const feitos = CURSOS.filter((c) => cursoConcluido(c.id) && provaAprovada('curso:' + c.id));
  const quaseFeitos = CURSOS.filter((c) => cursoConcluido(c.id) && !provaAprovada('curso:' + c.id));

  const trilhaPronta = Boolean(t)
    && doCaminho.length > 0
    && doCaminho.every((id) => cursoConcluido(id))
    && provaAprovada('trilha:' + t.id);

  const emitidos =
    (trilhaPronta
      ? cartao({
        rotulo: 'trilha concluída',
        nome: t.nome,
        meta: doCaminho.length + ' ' + txt('cursos') + ' · ' +
          doCaminho.reduce((s, id) => s + (cursoPorId(id)?.horas || 0), 0) + 'h',
        quem,
        quando: hoje,
        chave: 'trilha.' + t.id,
        nota: txt('prova da trilha:') + ' ' + resultadoProva('trilha:' + t.id).melhor + '%',
      })
      : '') +
    feitos.map((c) => cartao({
      rotulo: 'curso concluído',
      nome: c.nome,
      meta: c.horas + 'h · ' + txt(c.nivel) + (doCaminho.includes(c.id) && t ? ' · ' + t.nome : ''),
      quem,
      quando: hoje,
      chave: c.id,
      nota: txt('prova final:') + ' ' + resultadoProva('curso:' + c.id).melhor + '%',
    })).join('');

  /* Os exemplos: um de cada tipo que o aluno ainda não tem. Quem já tem o
     certificado de curso não precisa ver como seria um.

     Os dados saem do CATÁLOGO — o primeiro curso da trilha da pessoa, a trilha
     dela —, e não de nomes inventados. Assim o exemplo já está no idioma certo
     (o catálogo é traduzido em runtime) e mostra o certificado que ela vai
     tirar de fato, não um genérico. */
  const modelo = cursoPorId(doCaminho[0]) || CURSOS[0];
  const exemplos =
    (feitos.length ? '' : cartao({
      rotulo: 'curso concluído',
      nome: modelo.nome,
      meta: modelo.horas + 'h · ' + txt(modelo.nivel) + (t ? ' · ' + t.nome : ''),
      quem,
      quando: hoje,
      chave: 'exemplo.curso',
      exemplo: true,
      nota: txt('prova final:') + ' 90%',
    })) +
    (trilhaPronta ? '' : cartao({
      rotulo: 'trilha concluída',
      nome: t ? t.nome : TRILHAS[0].nome,
      meta: (doCaminho.length || 10) + ' ' + txt('cursos') + ' · ' +
        (doCaminho.reduce((s, id) => s + (cursoPorId(id)?.horas || 0), 0) || 380) + 'h',
      quem,
      quando: hoje,
      chave: 'exemplo.trilha',
      exemplo: true,
      nota: txt('prova da trilha:') + ' 84%',
    }));

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Seus certificados') + '</h1>' +
      '<p>' + txt('Um por curso concluído com prova aprovada, e um por trilha inteira.') + '</p>' +
    '</header>' +

    (emitidos ? '<div class="certs">' + emitidos + '</div>' : '') +

    (quaseFeitos.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo"><h2>' + txt('Falta só a prova') + '</h2></div>' +
          '<ul class="cert-falta">' +
            quaseFeitos.map((c) => '<li>' +
              '<span>' + esc(c.nome) + ' — ' + txt('conteúdo concluído') + '</span>' +
              '<a class="btn btn-primary" href="#/curso/' + esc(c.id) + '/prova">' +
                txt('Fazer a prova') + ' →</a>' +
            '</li>').join('') +
          '</ul>' +
        '</section>'
      : '') +

    (exemplos
      ? '<section class="cert-previa">' +
          '<div class="bloco-topo">' +
            '<h2>' + txt('Como será o seu') + '</h2>' +
            '<span class="mono dim">' + txt('exemplos — não valem como certificado') + '</span>' +
          '</div>' +
          '<div class="certs">' + exemplos + '</div>' +
        '</section>'
      : '');

  return { titulo: txt('Certificados'), el };
}
