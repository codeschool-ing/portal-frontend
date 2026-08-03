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
  notas: {},                    // { cursoId: { aulaIx: { secId: texto } } }
  provas: {},                   // { 'curso:javascript': { tentativas, melhor, aprovado } }
  conta: null,                  // { planoId, desde } — o que hoje é mentira e amanhã vem da cobrança
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

/* ---------- provas ----------
   Guarda o MELHOR resultado, não o último. Reprovar depois de já ter passado
   não pode tirar um certificado emitido — e refazer uma prova já passada, para
   praticar, é exatamente o que se quer incentivar.

   A contagem de tentativas é o que semeia o sorteio da próxima prova: mesma
   tentativa, mesma prova; tentativa nova, prova nova. */
export const resultadoProva = (chave) => estado.provas[chave] || null;
export const provaAprovada = (chave) => Boolean(estado.provas[chave]?.aprovado);
export const tentativasDeProva = (chave) => estado.provas[chave]?.tentativas || 0;

export function guardarProva(chave, { pct, aprovado, certos, total }) {
  mudar(() => {
    const antes = estado.provas[chave] || { tentativas: 0, melhor: 0, aprovado: false };
    estado.provas[chave] = {
      tentativas: antes.tentativas + 1,
      melhor: Math.max(antes.melhor, pct),
      aprovado: antes.aprovado || aprovado,
      ultimoPct: pct,
      ultimoCertos: certos,
      ultimoTotal: total,
      ultimaEm: new Date().toISOString(),
    };
  });
}

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
    const antes = r.exercicios[exId] || { tentativas: 0, acertou: false, conferido: false };
    r.exercicios[exId] = {
      tentativas: antes.tentativas + 1,
      // uma vez acertado, continua acertado: refazer para praticar não tira o crédito
      acertou: antes.acertou || veredito.acertou === true,
      /* `conferido` separa "errou" de "ninguém checou". Sem ele, um exercício
         de código respondido e não executado ficava indistinguível de um erro,
         e a tela de desempenho contaria como falha algo que nunca foi julgado —
         a mesma confusão que "não julgado nunca vira aprovado" evita do outro
         lado da régua. */
      conferido: antes.conferido || veredito.acertou !== null,
      ultimaEm: new Date().toISOString(),
    };
  });
}

/* ---------- anotações ----------
   Uma por seção, texto livre. É a única coisa no portal que o ALUNO escreve, e
   por isso ela não se perde nem quando o conteúdo muda: a chave é a mesma do
   progresso — curso, índice da aula, id da seção. */
export const notaDe = (cursoId, ix, secId) =>
  estado.notas[cursoId]?.[ix]?.[secId] || '';

export function guardarNota(cursoId, ix, secId, texto) {
  mudar(() => {
    const limpo = String(texto || '').trim();
    if (!limpo) {
      // nota vazia é nota apagada: não vale ocupar espaço nem aparecer na lista
      if (estado.notas[cursoId]?.[ix]) delete estado.notas[cursoId][ix][secId];
      return;
    }
    estado.notas[cursoId] = estado.notas[cursoId] || {};
    estado.notas[cursoId][ix] = estado.notas[cursoId][ix] || {};
    estado.notas[cursoId][ix][secId] = limpo;
  });
}

/* Todas as notas, achatadas, da mais recente para a mais antiga por curso.
   A tela de notas e a busca leem daqui — duas leituras da mesma fonte. */
export function todasAsNotas() {
  const fora = [];
  Object.entries(estado.notas).forEach(([cursoId, aulas]) => {
    Object.entries(aulas).forEach(([ix, secoes]) => {
      Object.entries(secoes).forEach(([secId, texto]) => {
        fora.push({ cursoId, aulaIx: Number(ix), secId, texto });
      });
    });
  });
  return fora;
}

/* ---------- desempenho ----------
   O portal já gravava tentativas e acertos de cada exercício e nunca mostrava.
   Isto é só a leitura: quem interpreta é a tela. */
export function respostasDadas() {
  const fora = [];
  Object.entries(estado.progresso).forEach(([cursoId, curso]) => {
    Object.entries(curso.aulas || {}).forEach(([ix, aula]) => {
      Object.entries(aula.exercicios || {}).forEach(([exId, r]) => {
        fora.push({ cursoId, aulaIx: Number(ix), exId, ...r });
      });
    });
  });
  return fora;
}

/* ---------- conta e plano ----------
   FUTURO: `planoId` vem do serviço de cobrança, e trocar de plano é um POST
   que devolve o novo. Aqui é um campo, para as telas serem escritas contra a
   forma certa desde já.

   Quem entra sem plano cai no primeiro da lista — não em "nenhum": um portal
   sem plano nenhum tem estados que não existem na vida real, e cada um deles
   vira um `if` que ninguém vai exercitar. */
export function contaDoAluno() {
  const c = estado.conta;
  const planoId = c?.planoId || (window.PLANOS?.[0]?.id ?? 'estudante');
  return { planoId, desde: c?.desde || null, email: estado.sessao?.email || '' };
}

export const planoAtual = () =>
  (window.PLANOS || []).find((p) => p.id === contaDoAluno().planoId) || (window.PLANOS || [])[0] || null;

export function trocarPlano(planoId) {
  mudar(() => {
    estado.conta = { ...(estado.conta || {}), planoId, desde: new Date().toISOString() };
  });
}

export function trocarEmail(email) {
  mudar(() => {
    estado.sessao = { ...(estado.sessao || {}), email: String(email || '').trim() };
  });
}

/* A senha NÃO é guardada. Não há hash no cliente que valha alguma coisa, e
   gravar a senha em localStorage seria pior do que não ter tela nenhuma: daria
   a impressão de que existe autenticação. O que fica é a DATA da troca — que é
   o que o aluno precisa ver, e o que o servidor vai confirmar na Etapa 2. */
export function marcarTrocaDeSenha() {
  mudar(() => {
    estado.conta = { ...(estado.conta || {}), senhaEm: new Date().toISOString() };
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
