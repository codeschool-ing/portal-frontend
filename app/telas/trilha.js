/* ==========================================================================
   Minha trilha — o grafo da vitrine virando mapa de progresso.

   O `depois` existe porque as arestas são desenhadas sobre posições REAIS dos
   cartões: medir fora do documento devolve zero em tudo. E o redesenho no
   resize é o mesmo cuidado da vitrine, pelo mesmo motivo.
   ========================================================================== */

import { montarTrilha, desenharArestas, ajustarSetasGrafo } from '../grafo.js';
import { escolherOpcao } from '../estado.js';
import { irPara } from '../rotas.js';
import { trilhaDoAluno, vazio } from './comum.js';

let redesenhaT = null;

export default async function trilha() {
  const t = trilhaDoAluno();
  if (!t) return { titulo: txt('Trilha'), el: vazio(txt('Você ainda não escolheu uma trilha.')) };

  const el = document.createElement('div');
  el.className = 'tela tela-trilha';
  el.innerHTML = montarTrilha(t);

  // abrir um curso pelo cartão do grafo
  el.addEventListener('click', (e) => {
    const cartao = e.target.closest('.curso-no[data-curso]');
    if (cartao) return irPara('/curso/' + cartao.dataset.curso);

    // trocar a opção de uma etapa com bifurcação: remonta o grafo inteiro,
    // porque a escolha muda o caminho e portanto os níveis
    const aba = e.target.closest('.garfo-aba');
    if (aba) {
      escolherOpcao(t.id, Number(aba.dataset.garfo), Number(aba.dataset.opcao));
      el.innerHTML = montarTrilha(t);
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
