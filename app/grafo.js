/* ==========================================================================
   O grafo da trilha, agora como MAPA DE PROGRESSO.

   O desenho é o mesmo da vitrine — `repartirNiveis` e `desenharArestas` vieram
   de lá quase sem mudança, com a única diferença de receberem a raiz como
   parâmetro em vez de olharem para uma variável global. O que muda é o que os
   cartões dizem: em vez de "este curso existe", eles dizem "você já fez este".

   ELE MOSTRA, MAS NÃO TRANCA. O FAQ da vitrine promete, por escrito: "Não. A
   trilha é uma recomendação de ordem — se você só precisa de um curso dela,
   assista só ele." Um cadeado aqui contradiria uma promessa já publicada, por
   isso o estado mais restritivo se chama `adiante` e continua clicável: ele
   informa a ordem recomendada, não proíbe o acesso.
   ========================================================================== */

import {
  grafoDaTrilha, cursoPorId, trilhasDoCurso, caminhoDaTrilha,
  horasDe, faixaDeHoras,
} from './catalogo.js';
import { courseDone as cursoConcluido, courseProgress as progressoDoCurso, activeOption as opcaoAtiva, now as agora } from './state.js';
import { esc } from './text.js';

/* ---------- estado de cada curso ---------- */

export function estadoDoCurso(id) {
  if (cursoConcluido(id)) return 'concluido';
  const p = progressoDoCurso(id);
  if (p.feitas > 0) return 'atual';
  const deps = cursoPorId(id)?.depende || [];
  const prontos = deps.every((d) => cursoConcluido(d));
  return prontos ? 'disponivel' : 'adiante';
}

const ROTULO_ESTADO = {
  concluido: 'concluído',
  atual: 'em andamento',
  disponivel: 'disponível',
  adiante: 'mais adiante',
};

/* ---------- os cartões ---------- */

function cartaoCurso(id, ordem, deps) {
  const c = cursoPorId(id);
  if (!c) return '';
  const nT = trilhasDoCurso(id).length;
  const requer = (deps || []).map((d) => cursoPorId(d)?.nome).filter(Boolean);
  const p = progressoDoCurso(id);
  const est = estadoDoCurso(id);

  return (
    '<button class="curso-no no-' + est + '" type="button" data-curso="' + esc(c.id) + '" data-no="' + esc(c.id) + '">' +
      (ordem ? '<span class="ordem">' + txt('nível') + ' ' + ordem + '</span>' : '') +
      '<span class="no-estado" data-estado="' + est + '">' + txt(ROTULO_ESTADO[est]) + '</span>' +
      '<span class="nome">' + esc(c.nome) + '</span>' +
      (nT > 1 ? '<span class="tag-compartilhado">' + txt('em') + ' ' + nT + ' ' + txt('trilhas') + '</span>' : '') +
      '<span class="meta">' + c.horas + 'h · ' + txt(c.nivel) + '</span>' +
      (p.total
        ? '<span class="no-barra" role="img" aria-label="' + p.feitas + ' de ' + p.total + '">' +
            '<span class="no-barra-cheia" style="width:' + p.pct + '%"></span>' +
          '</span>' +
          '<span class="no-conta">' + p.feitas + '/' + p.total + ' ' + txt('seções') + '</span>'
        : '') +
      (requer.length && est === 'adiante'
        ? '<span class="requer">' + txt('recomendado depois de') + ' ' + esc(requer.join(' + ')) + '</span>'
        : '') +
    '</button>'
  );
}

/* ---------- o painel inteiro ---------- */

export function montarTrilha(t) {
  const caminho = caminhoDaTrilha(t, opcaoAtiva);
  const horas = horasDe(caminho);
  const { min, max } = faixaDeHoras(t);
  const g = grafoDaTrilha(t, opcaoAtiva);

  const feitos = caminho.filter((id) => cursoConcluido(id)).length;

  const colunas = g.colunas.map((nos, v) => {
    const cartoes = nos.map((no) => {
      if (no.tipo === 'saida') {
        return '<div class="no-saida" data-no="@saida">' +
          '<span class="saida-selo" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M5 22V4M5 4h11l-2 4 2 4H5"/></svg>' +
          '</span>' +
          '<span class="saida-txt">' +
            '<span class="saida-rotulo">' + txt('chegada') + '</span>' +
            '<span class="saida-nome">' + esc(t.saida) + '</span>' +
          '</span>' +
        '</div>';
      }
      if (no.tipo === 'curso') {
        const nomes = (cursoPorId(no.id)?.depende || []).filter((d) => g.nos.some((x) => x.cursos.includes(d)));
        return cartaoCurso(no.id, String(v + 1).padStart(2, '0'), nomes);
      }
      // etapa de escolha: um bloco só, com as opções em abas
      const item = no.etapa;
      const sel = opcaoAtiva(t.id, no.idx);
      const abas = item.opcoes.map((o, j) =>
        '<button class="garfo-aba' + (j === sel ? ' on' : '') + '" type="button" ' +
        'data-garfo="' + no.idx + '" data-opcao="' + j + '">' + esc(o.nome) +
        '<span class="garfo-h">' + horasDe(o.cursos) + 'h</span></button>').join('');
      const dentro = item.opcoes[sel].cursos.map((id) => cartaoCurso(id)).join('');
      return (
        '<div class="garfo" data-no="' + esc(no.id) + '">' +
          '<div class="garfo-topo">' +
            '<span class="garfo-rotulo">' + txt('nível') + ' ' + String(v + 1).padStart(2, '0') +
              ' · ' + txt('você escolhe') + ' ' + esc(item.escolha) + '</span>' +
            '<div class="garfo-abas" role="tablist">' + abas + '</div>' +
          '</div>' +
          (item.nota ? '<p class="garfo-nota">' + esc(item.nota) + '</p>' : '') +
          '<div class="garfo-cursos">' + dentro + '</div>' +
        '</div>'
      );
    }).join('');
    return '<div class="nivel" data-nivel="' + v + '"><div class="subcol">' + cartoes + '</div></div>';
  }).join('');

  const carga = min === max
    ? '<span><b>' + horas + 'h</b>' + txt('de carga') + '</span>'
    : '<span><b>' + horas + 'h</b>' + txt('neste caminho') + ' <i>(' + min + 'h ' + txt('a') + ' ' + max + 'h)</i></span>';

  return (
    '<div class="trilha-topo">' +
      '<div>' +
        '<h2>' + esc(t.nome) + '</h2>' +
        '<p>' + esc(t.objetivo) + '</p>' +
      '</div>' +
      '<div class="trilha-resumo">' +
        '<span><b>' + feitos + '/' + caminho.length + '</b>' + txt('cursos concluídos') + '</span>' +
        carga +
        '<span><b>→</b>' + esc(t.saida) + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="grafo-caixa">' +
      '<button class="grafo-seta esq" type="button" data-rolar="-1" aria-label="Ver níveis anteriores">←</button>' +
      '<div class="trilha-grafo"><svg class="grafo-arestas" aria-hidden="true"></svg>' +
        '<div class="grafo-niveis">' + colunas + '</div></div>' +
      '<button class="grafo-seta dir" type="button" data-rolar="1" aria-label="Ver próximos níveis">→</button>' +
    '</div>' +
    '<div class="grafo-legenda">' +
      Object.entries(ROTULO_ESTADO).map(([k, r]) =>
        '<span class="leg"><i class="leg-cor no-' + k + '"></i>' + txt(r) + '</span>').join('') +
    '</div>'
  );
}

/* ---------- reparte cada nível em sub-colunas ----------
   Um nível com muitos cursos não pode esticar para baixo da tela: mede-se a
   altura real de cada cartão e enche-se uma sub-coluna até o limite antes de
   abrir a seguinte, então o grafo cresce na horizontal, que é onde existem as
   setas. Nem `flex-wrap` nem multi-coluna do CSS expandem a largura do
   container — os cartões que sobravam iam parar por cima do nível vizinho. */
export function repartirNiveis(raiz) {
  const rol = raiz.querySelector('.trilha-grafo');
  const faixa = raiz.querySelector('.grafo-niveis');
  if (!rol || !faixa) return;
  const caixaG = raiz.querySelector('.grafo-caixa');
  if (caixaG) caixaG.style.flex = '1 1 auto';
  const emLista = getComputedStyle(faixa).flexDirection !== 'row';
  const gap = 10;
  const cs = getComputedStyle(faixa);
  const disponivel = rol.clientHeight - (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) - 4;

  raiz.querySelectorAll('.nivel').forEach((nv) => {
    const itens = [];
    nv.querySelectorAll(':scope > .subcol').forEach((sc) => {
      Array.from(sc.children).forEach((el) => itens.push(el));
    });
    if (itens.length < 2) return;

    if (emLista) {
      nv.textContent = '';
      const sc = document.createElement('div');
      sc.className = 'subcol';
      itens.forEach((el) => sc.appendChild(el));
      nv.appendChild(sc);
      return;
    }

    const cols = [[]];
    let usado = 0;
    itens.forEach((el) => {
      const h = el.offsetHeight;
      const atual = cols[cols.length - 1];
      if (atual.length && usado + gap + h > disponivel) { cols.push([]); usado = 0; }
      cols[cols.length - 1].push(el);
      usado += (usado ? gap : 0) + h;
    });

    nv.textContent = '';
    cols.forEach((col) => {
      const sc = document.createElement('div');
      sc.className = 'subcol';
      col.forEach((el) => sc.appendChild(el));
      nv.appendChild(sc);
    });
  });

  if (!emLista) {
    let alto = 0;
    raiz.querySelectorAll('.nivel > .subcol').forEach((sc) => { alto = Math.max(alto, sc.offsetHeight); });
    const cheio = rol.clientHeight;
    const cx = raiz.querySelector('.grafo-caixa');
    if (alto && cx) {
      const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      cx.style.flex = '0 0 ' + Math.min(cheio, alto + pad) + 'px';
    }
  }
}

/* ---------- as arestas ----------
   Desenhadas sobre medidas reais, depois que o layout existe. A decisão de
   contornar um cartão é GEOMÉTRICA, não topológica: mede-se o retângulo entre
   as duas pontas e, se houver qualquer cartão ali dentro, a linha vai por
   fora. A regra antiga ("pulou mais de uma coluna, contorna") deixava passar o
   caso em que um nível repartido põe um vizinho no corredor de uma aresta
   entre níveis adjacentes. Folga de 16px: com 11 algumas passavam a 1,8px. */
export function desenharArestas(raiz, t) {
  repartirNiveis(raiz);
  const cont = raiz.querySelector('.trilha-grafo');
  const svg = cont && cont.querySelector('.grafo-arestas');
  if (!svg) return;
  const g = grafoDaTrilha(t, opcaoAtiva);
  const base = cont.getBoundingClientRect();
  const L = cont.scrollLeft, T = cont.scrollTop;
  const caixa = (id) => {
    const el = cont.querySelector('[data-no="' + CSS.escape(id) + '"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - base.left + L, y: r.top - base.top + T, w: r.width, h: r.height };
  };

  svg.setAttribute('width', cont.scrollWidth);
  svg.setAttribute('height', cont.scrollHeight);
  svg.setAttribute('viewBox', '0 0 ' + cont.scrollWidth + ' ' + cont.scrollHeight);

  const FOLGA = 16;
  let yTopo = Infinity, yBase = -Infinity;
  g.nos.forEach((n) => {
    const c = caixa(n.id);
    if (!c) return;
    yTopo = Math.min(yTopo, c.y);
    yBase = Math.max(yBase, c.y + c.h);
  });
  if (!isFinite(yTopo)) { yTopo = 0; yBase = cont.scrollHeight; }
  const desvioCima = Math.max(6, yTopo - FOLGA);
  const desvioBaixo = Math.min(cont.scrollHeight - 6, yBase + FOLGA);

  const caixas = g.nos.map((n) => {
    const c = caixa(n.id);
    return c && { id: n.id, x: c.x, y: c.y, w: c.w, h: c.h };
  }).filter(Boolean);
  const noCaminho = (xa, xb, ya, yb, ignora) => caixas.filter((c) =>
    ignora.indexOf(c.id) < 0 && c.x + c.w > xa && c.x < xb && c.y < yb && c.y + c.h > ya);

  /* Folga horizontal livre a partir de um x, dentro da faixa vertical que a
     curva percorre: com sub-colunas o vão ao lado do cartão cai de 48px para
     14px, e uma subida fixa de 26px passaria por dentro do vizinho. */
  const folga = (x, ya, yb, ignora, paraDireita) => {
    let lim = Infinity;
    caixas.forEach((c) => {
      if (ignora.indexOf(c.id) >= 0) return;
      if (c.y >= yb || c.y + c.h <= ya) return;
      const d = paraDireita ? c.x - x : x - (c.x + c.w);
      if (d >= 0) lim = Math.min(lim, d);
    });
    return lim;
  };

  const linhas = [];
  g.nos.forEach((no) => {
    const b = caixa(no.id);
    if (!b) return;
    no.deps.forEach((d) => {
      const a = caixa(d);
      if (!a) return;
      const x1 = a.x + a.w, y1 = a.y + a.h / 2;
      const x2 = b.x, y2 = b.y + b.h / 2;
      let dd;

      const ignora = [d, no.id];
      const obst = noCaminho(x1 + 2, x2 - 2, Math.min(y1, y2) - 4, Math.max(y1, y2) + 4, ignora);

      if (obst.length) {
        const topo = Math.min.apply(null, obst.map((c) => c.y));
        const baseO = Math.max.apply(null, obst.map((c) => c.y + c.h));
        const porCima = (y1 - topo) + (y2 - topo) <= (baseO - y1) + (baseO - y2);
        let yD = porCima ? topo - FOLGA : baseO + FOLGA;
        if (noCaminho(x1 + 2, x2 - 2, yD - 3, yD + 3, ignora).length) {
          yD = (y1 - desvioCima) + (y2 - desvioCima) <= (desvioBaixo - y1) + (desvioBaixo - y2)
            ? desvioCima : desvioBaixo;
        }
        yD = Math.max(6, Math.min(cont.scrollHeight - 6, yD));
        const larg = (x, paraDireita) => {
          const ya = Math.min(paraDireita ? y1 : y2, yD), yb = Math.max(paraDireita ? y1 : y2, yD);
          return Math.max(5, Math.min(26, folga(x, ya, yb, ignora, paraDireita) / 2));
        };
        const eS = larg(x1, true), eE = larg(x2, false);
        dd = 'M' + x1 + ',' + y1 +
          ' C' + (x1 + eS) + ',' + y1 + ' ' + (x1 + eS) + ',' + yD + ' ' + (x1 + eS * 2) + ',' + yD +
          ' L' + (x2 - eE * 2) + ',' + yD +
          ' C' + (x2 - eE) + ',' + yD + ' ' + (x2 - eE) + ',' + y2 + ' ' + x2 + ',' + y2;
      } else {
        const dx = Math.max(18, (x2 - x1) / 2);
        dd = 'M' + x1 + ',' + y1 + ' C' + (x1 + dx) + ',' + y1 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2;
      }

      // a aresta ganha o estado do PRÉ-REQUISITO: verde quando o que ela
      // destrava já foi cumprido, apagada quando ainda não
      const cumprida = cursoPorId(d) && estadoDoCurso(d) === 'concluido';
      linhas.push(
        '<g class="aresta' + (cumprida ? ' aresta-feita' : '') + '" data-de="' + esc(d) + '" data-para="' + esc(no.id) + '">' +
          '<title>' + esc(rotuloNo(d, g)) + ' → ' + esc(rotuloNo(no.id, g)) + '</title>' +
          '<path class="hit" d="' + dd + '"/>' +
          '<path class="linha" d="' + dd + '"/>' +
          '<circle class="ponta" cx="' + x2 + '" cy="' + y2 + '" r="3"/>' +
        '</g>',
      );
    });
  });
  svg.innerHTML = linhas.join('');
  ajustarSetasGrafo(raiz);
}

function rotuloNo(id, g) {
  if (id === '@saida') return txt('chegada');
  const c = cursoPorId(id);
  if (c) return c.nome;
  const no = g.nos.find((n) => n.id === id);
  return no && no.etapa ? 'escolha ' + no.etapa.escolha : id;
}

export function ajustarSetasGrafo(raiz) {
  const cx = raiz.querySelector('.grafo-caixa');
  const rol = cx && cx.querySelector('.trilha-grafo');
  if (!rol) return;
  const sobra = rol.scrollWidth - rol.clientWidth;
  cx.querySelector('.grafo-seta.esq').disabled = !(sobra > 4 && rol.scrollLeft > 4);
  cx.querySelector('.grafo-seta.dir').disabled = !(sobra > 4 && rol.scrollLeft < sobra - 4);
  cx.classList.toggle('sem-setas', sobra <= 4);
  rol.classList.toggle('fade-dir', sobra > 4 && rol.scrollLeft < sobra - 4);
  rol.classList.toggle('fade-esq', sobra > 4 && rol.scrollLeft > 4);
  const sobraY = rol.scrollHeight - rol.clientHeight;
  rol.classList.toggle('fade-baixo', sobraY > 4 && rol.scrollTop < sobraY - 4);
}

export const trilhaMatriculada = () => agora().matricula?.trilhaId || null;
