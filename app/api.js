/* ==========================================================================
   API — camada de mentira, com as assinaturas que o backend real terá.

   Tudo aqui é `async` de propósito, mesmo lendo de localStorage: se as telas
   forem escritas contra funções síncronas, trocar para `fetch` depois vira
   uma refatoração de todas elas. Async agora custa uma palavra; síncrono
   depois custa o portal inteiro.

   O que hoje é mentira e amanhã é servidor está marcado com FUTURO.
   ========================================================================== */

import * as estado from './estado.js';
import { aulasDoCurso, cursoPorId, trilhaPorId } from './catalogo.js';
import { exerciciosDaAula as buscarExercicios, secoesDaAula } from './aulas.js';
import { avaliarLocal, PRECISA_SERVIDOR } from './exercicios/avaliar.js';

const eco = (v) => Promise.resolve(v);

/* ---------- sessão ---------- */

export const sessao = () => eco(estado.agora().sessao);

// FUTURO: autenticação de verdade. Hoje qualquer nome entra — é um esqueleto.
export function entrar({ nome, email }) {
  estado.mudar((e) => { e.sessao = { nome: nome || 'Aluno', email: email || '' }; });
  return eco(estado.agora().sessao);
}

export function sair() {
  estado.mudar((e) => { e.sessao = null; });
  return eco(null);
}

/* FUTURO: `PATCH /conta/email`, e a troca só vale depois de confirmada no
   endereço NOVO — senão trocar o e-mail vira a forma mais fácil de tomar uma
   conta. Aqui vale na hora, porque não há para onde mandar a confirmação. */
export function trocarEmail(email) {
  estado.trocarEmail(email);
  return eco(estado.agora().sessao);
}

/* FUTURO: `PATCH /conta/senha`, com a senha atual conferida NO SERVIDOR. A
   senha nova não é guardada em lugar nenhum aqui — ver estado.js. */
export function trocarSenha() {
  estado.marcarTrocaDeSenha();
  return eco(true);
}

/* FUTURO: o serviço de cobrança. Trocar de plano vai passar por checkout,
   prorrateio e nota — nada disso existe, e o portal não finge que existe. */
export function trocarPlano(planoId) {
  estado.trocarPlano(planoId);
  return eco(estado.planoAtual());
}

/* ---------- matrícula ---------- */

export const matricula = () => eco(estado.agora().matricula);

export function matricular(trilhaId) {
  estado.mudar((e) => {
    e.matricula = { trilhaId, escolhas: e.matricula?.escolhas || {} };
  });
  return eco(estado.agora().matricula);
}

/* ---------- progresso ---------- */

export const progresso = () => eco(estado.agora().progresso);

export function concluirSecao(cursoId, ix, secId, feita = true) {
  estado.marcarSecao(cursoId, ix, secId, feita);
  return eco(true);
}

/* Onde o aluno parou — e agora com a SEÇÃO, não só a aula. Devolver o topo de
   uma aula de quatro horas é devolver a pessoa à rolagem; é a diferença entre
   o recurso ser útil e ser decorativo.

   Cai na primeira seção da trilha quando ainda não há histórico, em vez de
   devolver nulo e obrigar cada tela a inventar um fallback. */
export function continuarDe() {
  const e = estado.agora();
  const primeiraSecao = (cursoId, ix) => {
    const a = aulasDoCurso(cursoId)[ix];
    return a ? secoesDaAula(cursoId, a.chave)[0]?.id : undefined;
  };

  if (e.ultima && cursoPorId(e.ultima.cursoId)) {
    const { cursoId, aulaIx } = e.ultima;
    return eco({ ...e.ultima, secId: e.ultima.secId || primeiraSecao(cursoId, aulaIx) });
  }
  const t = e.matricula && trilhaPorId(e.matricula.trilhaId);
  if (!t) return eco(null);
  const primeiro = t.cursos.find((i) => typeof i === 'string');
  if (!primeiro) return eco(null);
  return eco({ cursoId: primeiro, aulaIx: 0, secId: primeiraSecao(primeiro, 0) });
}

/* ---------- exercícios ----------
   FUTURO: vem do banco, filtrado por `_verificacao` — a doc do pipeline diz
   que é esse campo que decide o que o portal publica primeiro. Hoje sai do
   arquivo de exemplos, e o filtro já existe para não ser retrofitado depois. */
export function exerciciosDaAula(cursoId, chaveDoTopico, opcoes) {
  return eco(buscarExercicios(cursoId, chaveDoTopico, opcoes));
}

/* Avaliar uma resposta.

   Quatro tipos corrigem no cliente porque são comparação pura. Três não:
   `codigo` e `saida-esperada` precisam executar, e `resposta-expressao`
   precisa de um CAS (sympy). A doc da vitrine já registra que executar código
   de aluno exige contêiner descartável — não é atalho, é o desenho previsto.

   Os dois caminhos passam por AQUI, com o mesmo formato de veredito, então o
   dia em que o servidor existir muda só o corpo do `if`. */
export async function avaliar(ex, resposta) {
  if (PRECISA_SERVIDOR.includes(ex.tipo)) return avaliarNoServidor(ex, resposta);
  return avaliarLocal(ex, resposta);
}

// FUTURO: POST /avaliar → contêiner descartável (execução) ou sympy (CAS).
async function avaliarNoServidor(ex, resposta) {
  await new Promise((r) => setTimeout(r, 420));   // a espera é parte da UI
  return {
    acertou: null,                                 // null = não foi conferido
    simulado: true,
    detalhe: ex.tipo === 'resposta-expressao'
      ? 'Equivalência simbólica exige o CAS no servidor.'
      : 'A execução dos casos de teste exige o contêiner no servidor.',
    resposta,
  };
}
