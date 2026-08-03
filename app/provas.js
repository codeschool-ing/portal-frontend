/* ==========================================================================
   Provas — a do fim do curso e a do fim da trilha.

   A AVALIAÇÃO DA AULA E A PROVA NÃO SÃO A MESMA COISA, e a diferença não é o
   tamanho:

     avaliação   é PRÁTICA. Confere na hora, mostra o porquê, deixa refazer.
                 Errar ali é parte de aprender, e o feedback imediato é o que
                 faz o erro ensinar.
     prova       é MEDIDA. Responde-se tudo e só então se vê o resultado.
                 Feedback a cada questão numa prova é o que permite tentar até
                 acertar — e aí ela deixa de medir qualquer coisa.

   Por isso o wizard tem `modo: 'prova'`: mesmas telas, veredito represado até
   o fim. Sem isso, a prova seria uma avaliação comprida.

   DE ONDE SAEM AS QUESTÕES
   Do mesmo banco de exercícios das aulas, sorteadas. Não há um banco separado
   de "questões de prova", e não deve haver enquanto o pipeline emitir um
   arquivo por tópico: manter dois bancos alinhados é trabalho recorrente, e o
   que se ganharia — questões inéditas — o sorteio já dá, porque ninguém faz os
   1.503 exercícios de uma trilha antes da prova.

   O SORTEIO É SEMENTEADO PELA TENTATIVA. Sair da tela e voltar devolve a MESMA
   prova (senão fechar a aba sem querer viraria uma prova nova, o que é a
   punição errada para o erro errado). Reprovar e tentar de novo devolve uma
   prova DIFERENTE — decorar a lista de dez não pode ser a estratégia.

   PREFERE OS TIPOS QUE O PORTAL SABE CORRIGIR. `codigo`, `saida-esperada` e
   `resposta-expressao` precisam de servidor e hoje voltam "não conferido" —
   uma prova cheia deles não teria nota. Eles entram só quando não há
   correntáveis suficientes, e ficam fora do denominador, pela mesma régua de
   sempre: não julgado não vira aprovado nem reprovado.
   ========================================================================== */

import { aulasDoCurso, cursoPorId, caminhoDaTrilha } from './catalogo.js';
import { exerciciosDaAula } from './aulas.js';
import { PRECISA_SERVIDOR } from './exercicios/avaliar.js';
import { embaralharCom } from './texto.js';

export const MINIMO = 70;            // % de acerto para passar
export const QUESTOES_CURSO = 10;
export const QUESTOES_TRILHA = 15;

/* Todos os exercícios de um curso, cada um sabendo de que aula veio — o wizard
   grava a resposta em `progresso[curso].aulas[ix]`, e uma prova que juntasse
   aulas sem guardar a origem registraria tudo na aula errada. */
export function bancoDoCurso(cursoId) {
  const fora = [];
  aulasDoCurso(cursoId).forEach((a, ix) => {
    exerciciosDaAula(cursoId, a.chave).forEach((ex) => {
      fora.push({ ex, ctx: { cursoId, aulaIx: ix }, aula: a.titulo });
    });
  });
  return fora;
}

const corrigivel = (item) => !PRECISA_SERVIDOR.includes(item.ex.tipo);

/* Sorteia mantendo a preferência pelos corrigíveis: embaralha os dois grupos
   separadamente e só então concatena, para que a ordem dentro de cada grupo
   continue variando de tentativa para tentativa. */
function sortear(banco, quantas, semente) {
  const bons = embaralharCom(semente + ':ok', banco.filter(corrigivel));
  const resto = embaralharCom(semente + ':srv', banco.filter((i) => !corrigivel(i)));
  return bons.concat(resto).slice(0, quantas);
}

export function provaDoCurso(cursoId, tentativa = 0) {
  const c = cursoPorId(cursoId);
  const banco = bancoDoCurso(cursoId);
  return {
    chave: 'curso:' + cursoId,
    escopo: 'curso',
    alvo: cursoId,
    titulo: c ? c.nome : cursoId,
    voltarPara: '#/curso/' + cursoId,
    itens: sortear(banco, QUESTOES_CURSO, cursoId + ':' + tentativa),
    banco: banco.length,
  };
}

export function provaDaTrilha(trilha, opcaoAtiva, tentativa = 0) {
  const caminho = caminhoDaTrilha(trilha, opcaoAtiva);
  const banco = caminho.flatMap((id) => bancoDoCurso(id));
  return {
    chave: 'trilha:' + trilha.id,
    escopo: 'trilha',
    alvo: trilha.id,
    titulo: trilha.nome,
    voltarPara: '#/trilha',
    itens: sortear(banco, QUESTOES_TRILHA, trilha.id + ':' + tentativa),
    banco: banco.length,
    cursos: caminho.length,
  };
}

/* A nota. `certos / julgadas` — e julgadas exclui o que o servidor ainda não
   conferiu, nunca o que ficou em branco. Deixar em branco é uma resposta, e
   ela está errada; não ter sido conferido não é resposta nenhuma. */
export function notaDaProva(estados) {
  const julgadas = estados.filter((s) => s.acertou !== null || !s.respondido);
  const certos = estados.filter((s) => s.acertou === true).length;
  const pendentes = estados.length - julgadas.length;
  const pct = julgadas.length ? Math.round((certos / julgadas.length) * 100) : 0;
  return { certos, julgadas: julgadas.length, pendentes, pct, aprovado: julgadas.length > 0 && pct >= MINIMO };
}
