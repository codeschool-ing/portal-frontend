/* ==========================================================================
   Estado do aluno.

   Hoje mora em localStorage; na Etapa 2 mora no servidor. Por isso ninguém
   fora deste módulo lê `localStorage` diretamente — quem precisa de dado
   chama `api.js`, que chama daqui. Trocar a persistência é trocar um arquivo.
   ========================================================================== */

const CHAVE = 'codeschool-portal';

const VAZIO = {
  sessao: null,                 // { nome, email }
  matricula: null,              // { trilhaId, escolhas: { 'backend:3': 1 } }
  progresso: {},                // { cursoId: { aulas: { ix: { concluida, exercicios } } } }
  ultima: null,                 // { cursoId, aulaIx } — alimenta o "continuar de onde parou"
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

/* ---------- leituras derivadas ----------
   Ficam aqui, e não nas telas, porque mais de uma tela pergunta a mesma coisa
   e duas contas do mesmo número divergem no dia em que uma delas muda. */

export const progressoDoCurso = (cursoId, totalAulas) => {
  const c = estado.progresso[cursoId];
  const feitas = c ? Object.values(c.aulas || {}).filter((a) => a.concluida).length : 0;
  return { feitas, total: totalAulas, pct: totalAulas ? Math.round((feitas / totalAulas) * 100) : 0 };
};

export const aulaConcluida = (cursoId, ix) =>
  Boolean(estado.progresso[cursoId]?.aulas?.[ix]?.concluida);

export const cursoConcluido = (cursoId, totalAulas) =>
  totalAulas > 0 && progressoDoCurso(cursoId, totalAulas).feitas >= totalAulas;

export const respostaDe = (cursoId, ix, exId) =>
  estado.progresso[cursoId]?.aulas?.[ix]?.exercicios?.[exId] || null;

/* ---------- escritas ---------- */

function garantirAula(cursoId, ix) {
  const p = estado.progresso;
  p[cursoId] = p[cursoId] || { aulas: {} };
  p[cursoId].aulas[ix] = p[cursoId].aulas[ix] || { concluida: false, exercicios: {} };
  return p[cursoId].aulas[ix];
}

export function marcarAula(cursoId, ix, concluida) {
  mudar(() => {
    garantirAula(cursoId, ix).concluida = concluida;
    estado.ultima = { cursoId, aulaIx: ix };
  });
}

export function visitarAula(cursoId, ix) {
  mudar(() => {
    garantirAula(cursoId, ix);
    estado.ultima = { cursoId, aulaIx: ix };
  });
}

export function guardarResposta(cursoId, ix, exId, veredito) {
  mudar(() => {
    const a = garantirAula(cursoId, ix);
    const antes = a.exercicios[exId] || { tentativas: 0, acertou: false };
    a.exercicios[exId] = {
      tentativas: antes.tentativas + 1,
      // uma vez acertado, continua acertado: refazer para praticar não tira o crédito
      acertou: antes.acertou || veredito.acertou,
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
