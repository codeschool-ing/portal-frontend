/* ==========================================================================
   O invólucro comum dos sete tipos.

   Tudo o que não depende do tipo mora aqui — enunciado, dica, botão, veredito,
   selo de verificação — e cada módulo de tipo cuida só do miolo interativo.
   O contrato de um tipo é pequeno de propósito:

     tipos     : quais `tipo` este módulo atende
     corpo(ex, uid)      → HTML do miolo
     montar(raiz)        → opcional: escutas de evento, se o tipo precisar
     colher(raiz)        → a resposta, ou null se ainda não respondeu
     revelar(raiz, ex, v)→ marca o que estava certo, DEPOIS de responder
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

/* O selo de verificação vem do pipeline e diz o que garante aquele exercício.
   A doc é explícita: é este campo que decide o que o portal publica primeiro.
   Mostrá-lo desde já é mais barato que retrofitá-lo depois. */
const SELOS = {
  criticado: { rotulo: 'verificado por crítica', classe: 'selo-forte' },
  execucao: { rotulo: 'conferido por execução', classe: 'selo-medio' },
  estrutura: { rotulo: 'só conferência estrutural', classe: 'selo-fraco' },
};

export function montarExercicio(ex, ctx, ix) {
  const mod = REGISTRO[ex.tipo];
  const uid = ex.id || `${ex.curso}:${ex.topico}:${ix}`;
  const el = document.createElement('article');
  el.className = 'ex ex-' + ex.tipo;

  if (!mod) {
    el.innerHTML = '<p class="ex-erro">' + txt('tipo de exercício desconhecido') + ': ' + esc(ex.tipo) + '</p>';
    return el;
  }

  const selo = SELOS[ex._verificacao || 'estrutura'];

  el.innerHTML =
    '<header class="ex-topo">' +
      '<span class="ex-tipo">' + txt(ex.tipo) + '</span>' +
      (ex.dificuldade ? '<span class="ex-dif">' + txt(ex.dificuldade) + '</span>' : '') +
      '<span class="ex-selo ' + selo.classe + '" title="' + txt(selo.rotulo) + '">' + txt(selo.rotulo) + '</span>' +
    '</header>' +
    '<p class="ex-enunciado">' + marcado(ex.enunciado) + '</p>' +
    '<div class="ex-corpo">' + mod.corpo(ex, uid) + '</div>' +
    (ex.dica_socratica
      ? '<details class="ex-dica"><summary>' + txt('dica') + '</summary><p>' + marcado(ex.dica_socratica) + '</p></details>'
      : '') +
    '<div class="ex-acoes">' +
      '<button type="button" class="btn btn-primary ex-responder">' + txt('Responder') + '</button>' +
      '<button type="button" class="btn btn-ghost ex-refazer" hidden>' + txt('Tentar de novo') + '</button>' +
    '</div>' +
    '<div class="ex-veredito" aria-live="polite"></div>';

  const corpo = el.querySelector('.ex-corpo');
  if (mod.montar) mod.montar(corpo);

  const anterior = ctx && respostaDe(ctx.cursoId, ctx.aulaIx, uid);
  if (anterior?.acertou) marcarJaFeito(el, anterior);

  el.querySelector('.ex-responder').addEventListener('click', async () => {
    const resposta = mod.colher(corpo);
    const saida = el.querySelector('.ex-veredito');
    if (resposta === null) {
      saida.className = 'ex-veredito v-vazio';
      saida.textContent = txt('Responda antes de conferir.');
      return;
    }

    const botao = el.querySelector('.ex-responder');
    botao.disabled = true;
    saida.className = 'ex-veredito v-esperando';
    saida.textContent = txt('conferindo…');

    const v = await api.avaliar(ex, resposta);
    if (ctx) guardarResposta(ctx.cursoId, ctx.aulaIx, uid, v);

    mod.revelar(corpo, ex, v);
    mostrarVeredito(el, ex, v);
    el.querySelector('.ex-refazer').hidden = false;
    el.dispatchEvent(new CustomEvent('exercicio:respondido', { bubbles: true, detail: { ex, v } }));
  });

  el.querySelector('.ex-refazer').addEventListener('click', () => {
    const novo = montarExercicio(ex, ctx, ix);
    el.replaceWith(novo);
    novo.scrollIntoView({ block: 'nearest' });
  });

  return el;
}

function mostrarVeredito(el, ex, v) {
  const saida = el.querySelector('.ex-veredito');

  if (v.acertou === null) {
    /* Não conferido NUNCA vira aprovado — é uma regra do pipeline e vale
       inteira aqui. Enquanto o servidor de execução não existe, o portal diz
       que não conferiu, em vez de dar um "certo" que ninguém verificou. */
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
  if (typeof v.certos === 'number') {
    extra = ' ' + v.certos + ' ' + txt('de') + ' ' + v.total + ' ' + txt('pares certos.');
  }
  /* A `armadilha` de uma ordenação é exatamente o que o exercício mede: qual
     par vizinho se inverte e por quê. Como feedback ela vale muito; antes de
     responder, ela seria a resposta. */
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
