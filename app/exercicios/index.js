/* ==========================================================================
   O invólucro comum dos sete tipos, e o wizard da avaliação.

   Tudo o que não depende do tipo mora aqui — enunciado, dica, botão, veredito —
   e cada módulo de tipo cuida só do miolo interativo. O contrato:

     tipos       : quais `tipo` este módulo atende
     autoConclui : opcional. `true` quando o próprio exercício sabe dizer que
                   terminou (é o caso da associação, que confere par a par).
                   O invólucro esconde o "Responder" e espera o aviso.
     corpo(ex, uid)                  → HTML do miolo
     montar(raiz, {exercicio, concluir})  → opcional: escutas de evento
     colher(raiz)                    → a resposta, ou null se não respondeu
     revelar(raiz, ex, veredito)     → marca o que estava certo, DEPOIS

   O SELO DE `_verificacao` SAIU DA TELA DO ALUNO. Ele continua no dado e
   continua filtrando em `exerciciosDaAula` — a doc do pipeline diz que é ele
   que decide o que o portal publica primeiro, e essa é uma decisão de
   publicação, não uma informação para quem estuda. Dizer "só conferência
   estrutural" a um aluno é avisá-lo de que aquele exercício talvez não preste;
   se ele talvez não preste, não devia estar publicado.
   ========================================================================== */

import { marcado, esc } from '../texto.js';
import * as api from '../api.js';
import { guardarResposta, respostaDe } from '../estado.js';

import alternativas from './alternativas.js';
import ordenacao from './ordenacao.js';
import associacao from './associacao.js';
import saidaEsperada from './saida-esperada.js';
import codigo from './codigo.js';
import respostaExpressao from './resposta-expressao.js';

const MODULOS = [alternativas, ordenacao, associacao, saidaEsperada, codigo, respostaExpressao];

const REGISTRO = {};
MODULOS.forEach((m) => m.tipos.forEach((t) => { REGISTRO[t] = m; }));

export const tipoConhecido = (t) => Boolean(REGISTRO[t]);

export function montarExercicio(ex, ctx, ix) {
  const mod = REGISTRO[ex.tipo];
  const uid = ex.id || `${ex.curso}:${ex.topico}:${ix}`;
  const el = document.createElement('article');
  el.className = 'ex ex-' + ex.tipo;

  if (!mod) {
    el.innerHTML = '<p class="ex-erro">' + txt('tipo de exercício desconhecido') + ': ' + esc(ex.tipo) + '</p>';
    return el;
  }

  el.innerHTML =
    '<header class="ex-topo">' +
      '<span class="ex-tipo">' + txt(ex.tipo) + '</span>' +
      (ex.dificuldade ? '<span class="ex-dif">' + txt(ex.dificuldade) + '</span>' : '') +
    '</header>' +
    '<p class="ex-enunciado">' + marcado(ex.enunciado) + '</p>' +
    '<div class="ex-corpo">' + mod.corpo(ex, uid) + '</div>' +
    (ex.dica_socratica
      ? '<details class="ex-dica"><summary>' + txt('dica') + '</summary><p>' + marcado(ex.dica_socratica) + '</p></details>'
      : '') +
    '<div class="ex-acoes">' +
      (mod.autoConclui ? '' : '<button type="button" class="btn btn-primary ex-responder">' + txt('Responder') + '</button>') +
      '<button type="button" class="btn btn-ghost ex-refazer" hidden>' + txt('Tentar de novo') + '</button>' +
    '</div>' +
    '<div class="ex-veredito" aria-live="polite"></div>';

  const corpo = el.querySelector('.ex-corpo');

  async function conferir(resposta) {
    const saida = el.querySelector('.ex-veredito');
    if (resposta === null) {
      saida.className = 'ex-veredito v-vazio';
      saida.textContent = txt('Responda antes de conferir.');
      return;
    }
    const botao = el.querySelector('.ex-responder');
    if (botao) botao.disabled = true;
    saida.className = 'ex-veredito v-esperando';
    saida.textContent = txt('conferindo…');

    const v = await api.avaliar(ex, resposta);
    if (ctx) guardarResposta(ctx.cursoId, ctx.aulaIx, uid, v);

    mod.revelar(corpo, ex, v);
    mostrarVeredito(el, ex, v);
    el.querySelector('.ex-refazer').hidden = false;
    el.dispatchEvent(new CustomEvent('exercicio:respondido', { bubbles: true, detail: { ex, v } }));
  }

  if (mod.montar) mod.montar(corpo, { exercicio: ex, concluir: conferir });

  const anterior = ctx && respostaDe(ctx.cursoId, ctx.aulaIx, uid);
  if (anterior?.acertou) marcarJaFeito(el, anterior);

  const responder = el.querySelector('.ex-responder');
  if (responder) responder.addEventListener('click', () => conferir(mod.colher(corpo)));

  el.querySelector('.ex-refazer').addEventListener('click', () => {
    const novo = montarExercicio(ex, ctx, ix);
    el.replaceWith(novo);
    novo.dispatchEvent(new CustomEvent('exercicio:refeito', { bubbles: true }));
  });

  return el;
}

function mostrarVeredito(el, ex, v) {
  const saida = el.querySelector('.ex-veredito');

  if (v.acertou === null) {
    /* Não conferido NUNCA vira aprovado — é regra do pipeline e vale inteira
       aqui: enquanto não há execução, o portal diz que não conferiu. */
    saida.className = 'ex-veredito v-pendente';
    saida.innerHTML = '<strong>' + txt('não conferido') + '</strong> ' + esc(v.detalhe || '');
    return;
  }

  if (v.acertou) {
    saida.className = 'ex-veredito v-certo';
    saida.innerHTML = '<strong>' + txt('certo') + '</strong>';
    return;
  }

  saida.className = 'ex-veredito v-errado';
  let extra = '';
  if (v.parcial) extra = ' ' + txt('faltou fechar todos os pares.');
  else if (typeof v.erros === 'number' && v.erros > 0) extra = '';
  /* A `armadilha` de uma ordenação é o que o exercício mede: qual par vizinho
     se inverte e por quê. Como feedback vale muito; antes, seria a resposta. */
  if (ex.tipo === 'ordenacao' && ex.armadilha) {
    extra += '<span class="v-armadilha">' + marcado(ex.armadilha) + '</span>';
  }
  saida.innerHTML = '<strong>' + txt('ainda não') + '</strong>' + extra;
}

function marcarJaFeito(el, anterior) {
  const saida = el.querySelector('.ex-veredito');
  saida.className = 'ex-veredito v-antigo';
  saida.innerHTML = '<strong>' + txt('já resolvido') + '</strong> ' +
    txt('em') + ' ' + anterior.tentativas + ' ' +
    (anterior.tentativas === 1 ? txt('tentativa') : txt('tentativas'));
}

/* ==========================================================================
   O WIZARD DA AVALIAÇÃO — uma questão por vez.

   Empilhar sete exercícios numa página faz a pessoa rolar para achar onde
   parou, e mostra de uma vez um volume que intimida. Uma por vez dá foco, e a
   fileira de marcadores no topo diz quanto falta sem ocupar espaço.

   Os marcadores são CLICÁVEIS: numa prova de papel a pessoa pula a difícil e
   volta depois, e travar o avanço até acertar transformaria avaliação em
   portão. A trilha inteira já é recomendação, não trava — a avaliação não
   podia ser mais rígida que ela.
   ========================================================================== */

export function montarAvaliacao(exercicios, ctx) {
  const el = document.createElement('div');
  el.className = 'wizard';
  const estados = exercicios.map(() => ({ respondido: false, acertou: null }));
  let atual = 0;

  el.innerHTML =
    '<header class="wz-topo">' +
      '<span class="wz-conta"></span>' +
      '<div class="wz-pontos" role="tablist"></div>' +
    '</header>' +
    '<div class="wz-palco"></div>' +
    '<footer class="wz-pe">' +
      '<button type="button" class="btn btn-ghost wz-antes">← ' + txt('anterior') + '</button>' +
      '<button type="button" class="btn btn-primary wz-depois">' + txt('próxima') + ' →</button>' +
    '</footer>';

  const palco = el.querySelector('.wz-palco');
  const pontos = el.querySelector('.wz-pontos');

  function pintarTopo() {
    el.querySelector('.wz-conta').textContent =
      txt('questão') + ' ' + (atual + 1) + ' ' + txt('de') + ' ' + exercicios.length;
    pontos.innerHTML = estados.map((s, i) => {
      const classe = ['wz-ponto'];
      if (i === atual) classe.push('on');
      if (s.respondido) classe.push(s.acertou === true ? 'certo' : (s.acertou === null ? 'pendente' : 'errado'));
      return '<button type="button" class="' + classe.join(' ') + '" data-ir="' + i + '" ' +
        'aria-label="' + txt('questão') + ' ' + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('');
    el.querySelector('.wz-antes').disabled = atual === 0;
    const ultimo = atual === exercicios.length - 1;
    el.querySelector('.wz-depois').textContent = ultimo
      ? txt('ver resultado')
      : txt('próxima') + ' →';
  }

  /* Os elementos são GUARDADOS, não recriados. Ir à questão 3 e voltar à 1
     tem de devolver a 1 como ela ficou — com a resposta marcada e o veredito à
     vista. Remontar apagaria isso, e o aluno acharia que perdeu o que fez. */
  const telas = exercicios.map(() => null);

  /* `ctx` pode ser um contexto só (a avaliação de uma aula) ou um por
     exercício (a tela de refazer, que junta exercícios de aulas diferentes e
     precisa gravar cada resposta na aula de origem). */
  const contexto = (i) => (Array.isArray(ctx) ? ctx[i] : ctx);

  function mostrar(i) {
    atual = i;
    if (!telas[i]) telas[i] = montarExercicio(exercicios[i], contexto(i), i);
    palco.textContent = '';
    palco.appendChild(telas[i]);
    pintarTopo();
  }

  function resultado() {
    const certos = estados.filter((s) => s.acertou === true).length;
    const naoConferidos = estados.filter((s) => s.respondido && s.acertou === null).length;
    const semResposta = estados.filter((s) => !s.respondido).length;
    palco.textContent = '';
    const r = document.createElement('div');
    r.className = 'wz-resultado';
    r.innerHTML =
      '<span class="wz-res-rot">' + txt('resultado') + '</span>' +
      '<p class="wz-res-nota"><strong>' + certos + '</strong>/' + exercicios.length + ' ' + txt('corretas') + '</p>' +
      (naoConferidos ? '<p class="wz-res-obs">' + naoConferidos + ' ' + txt('aguardam conferência no servidor.') + '</p>' : '') +
      (semResposta ? '<p class="wz-res-obs">' + semResposta + ' ' + txt('sem resposta.') + '</p>' : '') +
      '<button type="button" class="btn btn-ghost wz-voltar">' + txt('Rever as questões') + '</button>';
    palco.appendChild(r);
    r.querySelector('.wz-voltar').addEventListener('click', () => mostrar(0));
    el.querySelector('.wz-depois').disabled = true;
    el.dispatchEvent(new CustomEvent('avaliacao:concluida', {
      bubbles: true,
      detail: { certos, total: exercicios.length },
    }));
  }

  el.addEventListener('exercicio:respondido', (e) => {
    estados[atual] = { respondido: true, acertou: e.detail.v.acertou };
    pintarTopo();
  });
  el.addEventListener('exercicio:refeito', () => {
    estados[atual] = { respondido: false, acertou: null };
    telas[atual] = palco.firstElementChild;   // "tentar de novo" troca o elemento
    pintarTopo();
  });

  pontos.addEventListener('click', (e) => {
    const b = e.target.closest('.wz-ponto');
    if (b) mostrar(Number(b.dataset.ir));
  });
  el.querySelector('.wz-antes').addEventListener('click', () => mostrar(Math.max(0, atual - 1)));
  el.querySelector('.wz-depois').addEventListener('click', () => {
    if (atual === exercicios.length - 1) resultado();
    else mostrar(atual + 1);
  });

  mostrar(0);
  return el;
}
