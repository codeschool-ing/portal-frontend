/* ==========================================================================
   Minha trilha — o grafo da vitrine virando mapa de progresso.

   O `depois` existe porque as arestas são desenhadas sobre posições REAIS dos
   cartões: medir fora do documento devolve zero em tudo. E o redesenho no
   resize é o mesmo cuidado da vitrine, pelo mesmo motivo.
   ========================================================================== */

import { montarTrilha, desenharArestas, ajustarSetasGrafo } from '../grafo.js';
import { chooseOption as escolherOpcao, activeOption as opcaoAtiva } from '../state.js';
import { irPara } from '../rotas.js';
import { provaDaTrilha } from '../provas.js';
import { cartaoDeProva } from './prova.js';
import { trilhaDoAluno, progressoDaTrilha, vazio } from './comum.js';

let redesenhaT = null;

export default async function trilha() {
  const t = trilhaDoAluno();
  if (!t) return { titulo: txt('Trilha'), el: vazio(txt('Você ainda não escolheu uma trilha.')) };

  const el = document.createElement('div');
  el.className = 'tela tela-trilha';

  /* A prova vem DEPOIS do grafo, e é a única coisa que vem: o grafo termina no
     nó de chegada, e a prova é o que existe depois de chegar. O cartão é
     remontado junto com o grafo quando a bifurcação muda, porque trocar de
     ramo troca os cursos e portanto o banco de questões. */
  const cartao = () => {
    const prova = provaDaTrilha(t, opcaoAtiva);
    return prova.itens.length
      ? cartaoDeProva({
        chave: prova.chave, href: '#/trilha/prova', escopo: 'trilha',
        quantas: prova.itens.length, progresso: progressoDaTrilha(t).pct,
      })
      : '';
  };
  el.innerHTML = montarTrilha(t) + cartao();

  // abrir um curso pelo cartão do grafo
  el.addEventListener('click', (e) => {
    const cartao1 = e.target.closest('.curso-no[data-curso]');
    if (cartao1) return irPara('/curso/' + cartao1.dataset.curso);

    // trocar a opção de uma etapa com bifurcação: remonta o grafo inteiro,
    // porque a escolha muda o caminho e portanto os níveis
    const aba = e.target.closest('.garfo-aba');
    if (aba) {
      escolherOpcao(t.id, Number(aba.dataset.garfo), Number(aba.dataset.opcao));
      el.innerHTML = montarTrilha(t) + cartao();
      desenharArestas(el, t);
      return;
    }

    const seta = e.target.closest('.grafo-seta[data-rolar]');
    if (seta) {
      const rol = el.querySelector('.trilha-grafo');
      rol.scrollBy({ left: Number(seta.dataset.rolar) * Math.max(220, rol.clientWidth - 80), behavior: 'smooth' });
    }
  });

  el.addEventListener('scroll', (e) => {
    if (e.target.classList?.contains('trilha-grafo')) ajustarSetasGrafo(el);
  }, true);

  /* PASSAR O CURSOR POR UM CURSO ACENDE AS ARESTAS que chegam nele e saem
     dele. Veio da vitrine (`assets/script.js`) verbatim, e o `base.css` já
     trazia o estilo do `.aresta.on` — o portal tinha copiado a metade do CSS e
     deixado a metade do comportamento para trás.

     `mouseover`/`mouseout` e não `mouseenter`/`mouseleave`: só os primeiros
     borbulham, e é o borbulhar que permite UM ouvinte na tela em vez de um por
     cartão. Os cartões são refeitos a cada troca de bifurcação, e ouvinte por
     cartão vaza a cada remontagem. */
  el.addEventListener('mouseover', (e) => {
    const no = e.target.closest('[data-no]');
    if (!no) return;
    const id = no.dataset.no;
    el.querySelectorAll('.aresta').forEach((a) => {
      a.classList.toggle('on', a.dataset.de === id || a.dataset.para === id);
    });
  });
  el.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-no]')) el.querySelectorAll('.aresta.on').forEach((a) => a.classList.remove('on'));
  });

  const redesenhar = () => {
    clearTimeout(redesenhaT);
    redesenhaT = setTimeout(() => desenharArestas(el, t), 120);
  };
  addEventListener('resize', redesenhar);

  return {
    titulo: t.nome,
    el,
    depois: () => {
      desenharArestas(el, t);
      // as fontes mudam a altura dos cartões e portanto as posições medidas
      if (document.fonts?.ready) document.fonts.ready.then(() => desenharArestas(el, t));
    },
    aoSair: () => removeEventListener('resize', redesenhar),
  };
}
