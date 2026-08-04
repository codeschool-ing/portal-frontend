/* ==========================================================================
   Busca global.

   O botão da lupa e o `⌘K` existiam na barra desde o primeiro dia e os dois só
   levavam ao catálogo — um atalho que prometia busca e entregava navegação.
   Este módulo é o que faltava para eles pararem de mentir.

   POR QUE ELA IMPORTA MAIS AQUI QUE NUM SITE COMUM: são 86 cursos e 1.503
   aulas. O campo do catálogo procura em curso, e só. Quem lembra "aquela parte
   sobre o TTL do DNS" não tem caminho nenhum até ela — nem pelo menu, nem pelo
   grafo, nem pelo trilho.

   O QUE ELA INDEXA, e a ordem é a de utilidade decrescente:
     seções   — o grão que a pessoa realmente procura ("como escolher CDN")
     aulas    — o tópico do catálogo
     cursos   — nome, resumo, ementa
     exercícios — o enunciado
     notas    — o que o próprio aluno escreveu

   DUAS DECISÕES QUE VÊM DE DEFEITOS JÁ PAGOS NESTE PROJETO

   1. Casa contra o texto EXIBIDO e contra o texto EM PORTUGUÊS ao mesmo tempo.
      O catálogo é traduzido em runtime, então num navegador em inglês o título
      da aula é "Hosting: shared, VPS, cloud and CDN" — mas as seções, as notas
      e os exercícios estão em português. Indexar só um dos dois faria metade do
      conteúdo sumir da busca conforme o idioma, que é exatamente o defeito que
      já mordeu a junção dos exercícios e o casamento das seções.

   2. Ignora acento. Quem digita "coercao" quer achar "coerção", e quem está no
      celular quase sempre digita sem acento.
   ========================================================================== */

import {
  courseLessons as aulasDoCurso,
  courseById as cursoPorId,
} from './catalog.js';
import { lessonSections as secoesDaAula, lessonExercises as exerciciosDaAula } from './lessons.js';
import { allNotes as todasAsNotas } from './state.js';

/* minúscula e sem acento, dos dois lados da comparação */
const dobra = (s) => String(s || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');   // as marcas combinantes, por código

const soTexto = (corpo) => (corpo || [])
  .map((b) => {
    if (Array.isArray(b)) return b.join(' ');
    if (b && typeof b === 'object') return b.texto || '';
    return b;
  })
  .join(' ');

/* O corpo das seções é escrito com a marcação mínima de `texto.js` — crase
   para código, ** para ênfase. Ela é interpretada na hora de renderizar a
   seção; no trecho da busca, que é texto puro, sobrava na tela como `**TTL**`.
   Some com ela ANTES de derivar `bruto` e `alvo`, senão os dois deixam de ter
   o mesmo comprimento e o índice do casamento aponta para o lugar errado. */
const semMarcacao = (s) => String(s || '').replace(/\*\*|`/g, '');

/* O índice é caro de montar (1.503 aulas) e barato de guardar. Fica em cache e
   é invalidado quando algo que ele indexa muda: idioma e notas. */
let indice = null;
export const esquecerIndice = () => { indice = null; };

function montarIndice() {
  const itens = [];
  /* `textos` é o CORPO — o título entra sozinho, na frente, e `daqui` marca
     onde ele acaba. É isso que impede o trecho de repetir o título que o
     resultado já mostra em cima dele: casar no título passa a mostrar o começo
     do corpo, que é a informação nova. */
  const põe = (grupo, titulo, sub, href, ...textos) => {
    // `bruto` guarda o texto como se lê; `alvo` é a versão dobrada, para casar.
    // Sem os dois, o trecho do resultado sairia em minúsculas e sem acento.
    const cabeca = semMarcacao(titulo);
    const bruto = [cabeca, ...textos.map(semMarcacao)].filter(Boolean).join(' ');
    itens.push({ grupo, titulo, sub, href, bruto, alvo: dobra(bruto), daqui: cabeca.length + 1 });
  };

  CURSOS.forEach((c) => {
    põe('cursos', c.nome, c.categoria + ' · ' + c.horas + 'h', '#/curso/' + c.id,
      c.resumo, c.categoria, (c.ementa || []).join(' '));

    const aulas = aulasDoCurso(c.id);
    const temConteudo = Boolean(window.AULAS?.[c.id]);

    aulas.forEach((a) => {
      const secoes = secoesDaAula(c.id, a.chave);
      const primeira = '#/curso/' + c.id + '/aula/' + a.ix + '/' + secoes[0].id;
      /* O título traduzido E a chave em português: ver o cabeçalho deste
         arquivo. Em português os dois são a mesma cadeia, e aí a chave não
         entra — repetida, ela viraria o trecho do resultado. */
      põe('aulas', a.titulo, c.nome, primeira, a.chave === a.titulo ? '' : a.chave);

      /* Seção só vira resultado onde o conteúdo foi escrito. Nos 84 cursos sem
         texto, a "seção" é um invólucro com o mesmo nome da aula, e listá-la
         devolveria cada resultado duas vezes. */
      if (temConteudo) {
        secoes.forEach((s) => {
          if (s.tipo !== 'conteudo') return;
          põe('secoes', s.titulo, c.nome + ' · ' + a.titulo,
            '#/curso/' + c.id + '/aula/' + a.ix + '/' + s.id,
            soTexto(s.corpo));
        });
      }

      /* Só o enunciado. O tipo já esteve aqui e saiu: ninguém procura por
         "ordenacao", e como corpo do item ele virava um trecho de uma palavra
         só embaixo de cada exercício. */
      exerciciosDaAula(c.id, a.chave).forEach((ex) => {
        põe('exercicios', ex.enunciado, c.nome + ' · ' + a.titulo,
          '#/curso/' + c.id + '/aula/' + a.ix + '/avaliacao');
      });
    });
  });

  todasAsNotas().forEach((nota) => {
    const c = cursoPorId(nota.cursoId);
    const a = aulasDoCurso(nota.cursoId)[nota.aulaIx];
    if (!c || !a) return;
    põe('notas', nota.texto, c.nome + ' · ' + a.titulo,
      '#/curso/' + nota.cursoId + '/aula/' + nota.aulaIx + '/' + nota.secId);
  });

  return itens;
}

const GRUPOS = ['secoes', 'aulas', 'cursos', 'exercicios', 'notas'];
export const ROTULO_GRUPO = {
  secoes: 'seções', aulas: 'aulas', cursos: 'cursos', exercicios: 'exercícios', notas: 'suas notas',
};

const POR_GRUPO = 5;

export function procurar(termo, { porGrupo = POR_GRUPO } = {}) {
  const q = dobra(termo).trim();
  if (q.length < 2) return [];
  if (!indice) indice = montarIndice();

  const achados = [];
  indice.forEach((it) => {
    const onde = it.alvo.indexOf(q);
    if (onde < 0) return;
    /* Pontuação simples e explicável: casar no começo do título vale mais que
       casar no meio do corpo. Nada de relevância estatística — com este volume
       ela custaria mais em surpresa do que renderia em ordem. */
    const noTitulo = dobra(it.titulo).indexOf(q);
    const peso = (noTitulo === 0 ? 0 : (noTitulo > 0 ? 1 : 2)) * 1000 + onde;
    achados.push({ ...it, peso, onde });
  });

  achados.sort((a, b) => a.peso - b.peso);

  const fora = [];
  GRUPOS.forEach((g) => {
    const doGrupo = achados.filter((a) => a.grupo === g).slice(0, porGrupo);
    if (doGrupo.length) fora.push({ grupo: g, itens: doGrupo });
  });
  return fora;
}

/* Um pedaço do texto em volta do casamento, para o resultado mostrar o
   contexto em vez de só o título. Sem isto, cinco seções do mesmo curso
   aparecem como cinco linhas indistinguíveis. */
export function trecho(item, termo, largura = 90) {
  const q = dobra(termo).trim();
  const daqui = item.daqui || 0;
  if (daqui >= item.bruto.length) return '';   // item sem corpo: o título já está na tela

  /* Procura a partir do corpo. Se o termo só aparece no título, mostra o
     começo do corpo — repetir o título embaixo dele não informa nada. */
  const noCorpo = item.alvo.indexOf(q, daqui);
  const ini = noCorpo < 0
    ? daqui
    : Math.max(daqui, noCorpo - Math.floor(largura / 3));

  // as duas cadeias têm o mesmo comprimento (dobrar não muda o tamanho), então
  // o índice achado na dobrada vale na bruta
  const pedaco = item.bruto.slice(ini, ini + largura);
  return (ini > daqui ? '…' : '') + pedaco + (ini + largura < item.bruto.length ? '…' : '');
}
