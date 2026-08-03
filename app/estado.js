/* ==========================================================================
   Estado do aluno.

   Hoje mora em localStorage; na Etapa 2 mora no servidor. Por isso ninguém
   fora deste módulo lê `localStorage` diretamente — quem precisa de dado
   chama `api.js`, que chama daqui. Trocar a persistência é trocar um arquivo.

   A UNIDADE DE PROGRESSO É A SEÇÃO, NÃO A AULA.
   Um tópico do catálogo tem 4 horas em média, e metade deles enumera três ou
   mais assuntos no título. Contar aulas fazia a barra do aluno andar em saltos
   de quatro horas, o que é quase o mesmo que não andar. `aulaConcluida` passou
   a ser derivado: uma aula está feita quando todas as seções dela estão.
   ========================================================================== */

import { aulasDoCurso } from './catalogo.js';
import { secoesDaAula, secoesContaveis, totalSecoes } from './aulas.js';

const CHAVE = 'codeschool-portal';

const VAZIO = {
  sessao: null,                 // { nome, email }
  matricula: null,              // { trilhaId, escolhas: { 'backend:3': 1 } }
  progresso: {},                // { cursoId: { aulas: { ix: { secoes, exercicios } } } }
  ultima: null,                 // { cursoId, aulaIx, secId } — o "continuar de onde parou"
};

function ler() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return structuredClone(VAZIO);
    return { ...structuredClone(VAZIO), ...JSON.parse(cru) };
  } catch (e) {
    return structuredClone(VAZIO);   // modo privado ou JSON corrompido
  }
}

let estado = ler();
const ouvintes = new Set();

function gravar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* modo privado */ }
  ouvintes.forEach((f) => f(estado));
}

export const agora = () => estado;
export function assinar(f) { ouvintes.add(f); return () => ouvintes.delete(f); }

export function mudar(fn) {
  fn(estado);
  gravar();
}

export function zerar() {
  estado = structuredClone(VAZIO);
  gravar();
}

/* ---------- leituras ----------
   Ficam aqui, e não nas telas, porque mais de uma tela pergunta a mesma coisa
   e duas contas do mesmo número divergem no dia em que uma delas muda. */

const registroDaAula = (cursoId, ix) => estado.progresso[cursoId]?.aulas?.[ix];

export function secaoConcluida(cursoId, ix, secId) {
  const r = registroDaAula(cursoId, ix);
  if (!r) return false;
  /* Compatibilidade com o formato anterior, em que a aula inteira era uma
     caixinha só: um registro antigo marcado como concluído vale por todas as
     seções. Sem isto, quem já tinha progresso o veria zerar. */
  if (r.secoes === undefined) return Boolean(r.concluida);
  return Boolean(r.secoes[secId]);
}

export function progressoDaAula(cursoId, ix) {
  const a = aulasDoCurso(cursoId)[ix];
  if (!a) return { feitas: 0, total: 0, pct: 0 };
  // só as contáveis: uma avaliação ainda sem exercícios aparece na tela mas
  // não entra no denominador, senão o curso nunca fecharia
  const secoes = secoesContaveis(cursoId, a.chave);
  const feitas = secoes.filter((s) => secaoConcluida(cursoId, ix, s.id)).length;
  return { feitas, total: secoes.length, pct: secoes.length ? Math.round((feitas / secoes.length) * 100) : 0 };
}

export const aulaConcluida = (cursoId, ix) => {
  const p = progressoDaAula(cursoId, ix);
  return p.total > 0 && p.feitas === p.total;
};

export function progressoDoCurso(cursoId) {
  const total = totalSecoes(cursoId);
  let feitas = 0;
  aulasDoCurso(cursoId).forEach((a, ix) => {
    secoesContaveis(cursoId, a.chave).forEach((s) => {
      if (secaoConcluida(cursoId, ix, s.id)) feitas += 1;
    });
  });
  return { feitas, total, pct: total ? Math.round((feitas / total) * 100) : 0 };
}

export const cursoConcluido = (cursoId) => {
  const p = progressoDoCurso(cursoId);
  return p.total > 0 && p.feitas === p.total;
};

export const respostaDe = (cursoId, ix, exId) =>
  registroDaAula(cursoId, ix)?.exercicios?.[exId] || null;

/* ---------- escritas ---------- */

function garantirAula(cursoId, ix) {
  const p = estado.progresso;
  p[cursoId] = p[cursoId] || { aulas: {} };
  const r = p[cursoId].aulas[ix] || {};
  if (r.secoes === undefined) {
    // migra o formato antigo na primeira escrita, em vez de carregar os dois
    const a = aulasDoCurso(cursoId)[ix];
    const todas = a ? secoesDaAula(cursoId, a.chave) : [];
    r.secoes = {};
    if (r.concluida) todas.forEach((s) => { r.secoes[s.id] = true; });
    delete r.concluida;
  }
  r.exercicios = r.exercicios || {};
  p[cursoId].aulas[ix] = r;
  return r;
}

export function marcarSecao(cursoId, ix, secId, feita = true) {
  mudar(() => {
    const r = garantirAula(cursoId, ix);
    if (feita) r.secoes[secId] = true;
    else delete r.secoes[secId];
    estado.ultima = { cursoId, aulaIx: ix, secId };
  });
}

export function visitarSecao(cursoId, ix, secId) {
  mudar(() => {
    garantirAula(cursoId, ix);
    estado.ultima = { cursoId, aulaIx: ix, secId };
  });
}

export function guardarResposta(cursoId, ix, exId, veredito) {
  mudar(() => {
    const r = garantirAula(cursoId, ix);
    const antes = r.exercicios[exId] || { tentativas: 0, acertou: false };
    r.exercicios[exId] = {
      tentativas: antes.tentativas + 1,
      // uma vez acertado, continua acertado: refazer para praticar não tira o crédito
      acertou: antes.acertou || veredito.acertou === true,
      ultimaEm: new Date().toISOString(),
    };
  });
}

export function opcaoAtiva(trilhaId, idx) {
  return estado.matricula?.escolhas?.[trilhaId + ':' + idx] ?? 0;
}

export function escolherOpcao(trilhaId, idx, opcao) {
  mudar(() => {
    estado.matricula = estado.matricula || { trilhaId, escolhas: {} };
    estado.matricula.escolhas = estado.matricula.escolhas || {};
    estado.matricula.escolhas[trilhaId + ':' + idx] = opcao;
  });
}
