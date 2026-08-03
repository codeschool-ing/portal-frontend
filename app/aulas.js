/* ==========================================================================
   O que existe dentro de uma aula: as seções e os exercícios.

   Este módulo é o dono da resposta para "do que esta aula é feita". Ele junta
   três fontes que têm donos diferentes e a mesma chave de junção — o curso
   mais o texto do tópico em português:

     dados.js       o tópico existe (catálogo, compartilhado com a vitrine)
     aulas.js       as seções de conteúdo (do portal)
     exercicios     a avaliação (do pipeline)

   REGRAS QUE ELE APLICA
   - Aula sem seções escritas vira UMA seção. Assim o portal funciona igual
     para os 85 cursos que ainda não foram escritos, e o conteúdo entra curso a
     curso sem um dia de transição em que metade da tela fica quebrada.
   - A avaliação é sempre a ÚLTIMA seção, e só existe se o tópico tiver
     exercícios. Sem isso nasceriam 1.500 páginas de avaliação vazias.
   - A avaliação é por TÓPICO, não por seção. É o que mantém `topico` como
     chave de junção com o pipeline — descer a avaliação para o nível da seção
     obrigaria a mudar o formato que a ferramenta emite, e ela cobra o tópico
     inteiro de qualquer forma.
   ========================================================================== */

import { aulasDoCurso } from './catalogo.js';

/* Ordem de força das marcas de verificação do pipeline. `criticado` passou por
   sondas e juiz; `execucao` teve o gabarito confirmado pelo interpretador;
   `estrutura` só passou pelas conferências mecânicas. */
const FORCA = { estrutura: 0, execucao: 1, criticado: 2 };

export function exerciciosDaAula(cursoId, chave, { minimo = 'estrutura' } = {}) {
  return (window.EXERCICIOS_EXEMPLO || []).filter(
    (e) => e.curso === cursoId
      && e.topico === chave
      && FORCA[e._verificacao ?? 'estrutura'] >= FORCA[minimo],
  );
}

export function secoesDaAula(cursoId, chave) {
  const escritas = window.AULAS?.[cursoId]?.[chave];

  const secoes = escritas?.length
    ? escritas.map((s) => ({ ...s, tipo: 'conteudo' }))
    : [{ id: 'conteudo', titulo: 'Conteúdo', tipo: 'conteudo', corpo: null }];

  const exercicios = exerciciosDaAula(cursoId, chave);
  if (exercicios.length) {
    secoes.push({
      id: 'avaliacao',
      titulo: 'Avaliação',
      tipo: 'avaliacao',
      quantos: exercicios.length,
    });
  }
  return secoes;
}

/* A aula, com as seções já resolvidas. É o que as telas consomem. */
export function aulaCompleta(cursoId, ix) {
  const a = aulasDoCurso(cursoId)[ix];
  if (!a) return null;
  return { ...a, secoes: secoesDaAula(cursoId, a.chave) };
}

export const secoesDoCurso = (cursoId) =>
  aulasDoCurso(cursoId).map((a) => secoesDaAula(cursoId, a.chave));

/* Total de seções de um curso — o denominador de todo progresso do portal.
   Contar aulas mediria errado: uma aula pode ter uma seção ou seis, e a barra
   andaria em saltos que não correspondem ao esforço. */
export const totalSecoes = (cursoId) =>
  secoesDoCurso(cursoId).reduce((s, secs) => s + secs.length, 0);

export const indiceDaSecao = (secoes, secId) => {
  const i = secoes.findIndex((s) => s.id === secId);
  return i < 0 ? 0 : i;
};
