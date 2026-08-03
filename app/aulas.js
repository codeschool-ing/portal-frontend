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
   - A avaliação é SEMPRE a última seção de toda aula, tenha ela exercícios ou
     não. A estrutura da aula passa a ser previsível — conteúdo, conteúdo, …,
     avaliação —, e a avaliação vazia diz o que vem, em vez de sumir. É o mesmo
     princípio do quadro de vídeo reservado na vitrine: publicar um a um não
     reorganiza a tela de ninguém.
   - A avaliação é por TÓPICO, não por seção. É o que mantém `topico` como
     chave de junção com o pipeline — descer a avaliação para o nível da seção
     obrigaria a mudar o formato que a ferramenta emite, e ela cobra o tópico
     inteiro de qualquer forma.

   A CONSEQUÊNCIA DA AVALIAÇÃO SEMPRE PRESENTE, E COMO ELA É TRATADA
   Se a avaliação vazia contasse no progresso, nenhum curso jamais chegaria a
   100% enquanto os exercícios não existissem — e certificado nenhum sairia.
   Por isso ela nasce com `contaProgresso: false` e sai do denominador até ter
   exercícios. O denominador cresce quando o conteúdo chega, o que é honesto:
   a aula passou mesmo a ter mais trabalho dentro.
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
  secoes.push({
    id: 'avaliacao',
    titulo: 'Avaliação',
    tipo: 'avaliacao',
    quantos: exercicios.length,
    pendente: exercicios.length === 0,
    contaProgresso: exercicios.length > 0,
  });
  return secoes;
}

/* As seções que entram na conta do progresso. Uma avaliação ainda sem
   exercícios aparece na tela, para a estrutura ser previsível, mas fica fora
   do denominador — senão o curso nunca fecharia. */
export const secoesContaveis = (cursoId, chave) =>
  secoesDaAula(cursoId, chave).filter((s) => s.contaProgresso !== false);

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
  aulasDoCurso(cursoId).reduce((s, a) => s + secoesContaveis(cursoId, a.chave).length, 0);

export const indiceDaSecao = (secoes, secId) => {
  const i = secoes.findIndex((s) => s.id === secId);
  return i < 0 ? 0 : i;
};

/* ---------- material complementar ----------

   A seção referencia o material por CHAVE (`materiais: ['wf-dns-resumo']`), e
   o registro com título, tamanho e bytes mora em `window.MATERIAIS`. Duas
   razões, e a segunda é a que importa:

   1. O mesmo PDF serve mais de uma seção sem ser duplicado.
   2. O registro é o que muda quando o arquivo sai do `data:` URI e vira URL
      assinada de um bucket, na Etapa 2. A seção continua dizendo só a chave —
      nenhuma linha de conteúdo precisa ser reescrita nesse dia.

   Chave que não existe no registro é IGNORADA, e de propósito: material
   removido do bucket não pode derrubar a aula inteira. */
export const materialPorChave = (chave) => (window.MATERIAIS || {})[chave] || null;

export const materiaisDaSecao = (secao) =>
  (secao?.materiais || []).map(materialPorChave).filter(Boolean);

/* Todos os materiais de um curso, sem repetir — é o que a página do curso
   mostra, para quem quer baixar tudo de uma vez em vez de caçar seção a seção. */
export function materiaisDoCurso(cursoId) {
  const vistos = new Set();
  const fora = [];
  aulasDoCurso(cursoId).forEach((a, ix) => {
    secoesDaAula(cursoId, a.chave).forEach((s) => {
      (s.materiais || []).forEach((chave) => {
        if (vistos.has(chave)) return;
        const m = materialPorChave(chave);
        if (!m) return;
        vistos.add(chave);
        fora.push({ ...m, chave, aulaIx: ix, secId: s.id, aula: a.titulo });
      });
    });
  });
  return fora;
}
