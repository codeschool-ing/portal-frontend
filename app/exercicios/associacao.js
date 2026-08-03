/* ==========================================================================
   `associacao` — emparelhar clicando, com feedback imediato.

   O <select> por linha foi substituído por duas colunas de fichas: clica-se
   numa da esquerda, depois numa da direita, e o par é conferido NA HORA — verde
   e travado se estiver certo, vermelho e desfeito se não. É o gesto do Duolingo,
   e ele é melhor aqui por três motivos: funciona igual no toque e no mouse, não
   esconde as opções dentro de um menu, e transforma o exercício em prática em
   vez de formulário.

   O QUE ISSO QUEBRA, E COMO FICA HONESTO
   Com feedback imediato, o mapeamento final está SEMPRE certo — basta insistir.
   Se o veredito continuasse comparando o mapa com o gabarito, todo mundo tiraria
   100%. Então a medida passa a ser OUTRA: quantos pares foram errados no
   caminho. Zero erros é acerto; qualquer erro é "ainda não", com a contagem.
   A régua do pipeline continua valendo — acertar por eliminação não pode contar
   como saber —, só que agora ela é medida no processo e não no resultado.

   A coluna da direita continua ORDENADA ALFABETICAMENTE. No JSON o par correto
   é `pares[i].esquerda ↔ pares[i].direita`, e apresentá-la na ordem de escrita
   entregaria o gabarito pela posição. É a mesma razão pela qual a sonda do
   pipeline ordena. Os `distratores_direita` entram junto, para o último par não
   sair por eliminação.
   ========================================================================== */

import { marcado, esc, embaralharCom } from '../texto.js';

const ESPERA_ERRO = 700;   // tempo que o par errado fica vermelho antes de soltar

export default {
  tipos: ['associacao'],

  /* Este tipo se conclui sozinho: quando o último par fecha, não há mais nada
     a "responder". O invólucro esconde o botão e espera o aviso. */
  autoConclui: true,

  corpo(ex, uid) {
    const esquerdas = embaralharCom(uid + ':e', ex.pares.map((p) => p.esquerda));
    const direitas = [...ex.pares.map((p) => p.direita), ...(ex.distratores_direita || [])]
      .sort((a, b) => a.localeCompare(b, 'pt'));
    const sobram = direitas.length - ex.pares.length;

    const ficha = (texto, lado) =>
      '<button type="button" class="ficha ficha-' + lado + '" data-valor="' + esc(texto) + '">' +
        marcado(texto) +
      '</button>';

    return (
      '<p class="ex-instrucao">' +
        txt('Toque num item da esquerda e depois no par dele à direita.') +
        (sobram > 0 ? ' <strong>' + sobram + ' ' + txt('opções ficam de fora.') + '</strong>' : '') +
      '</p>' +
      '<div class="assoc-colunas">' +
        '<div class="assoc-col assoc-col-esq">' + esquerdas.map((t) => ficha(t, 'esq')).join('') + '</div>' +
        '<div class="assoc-col assoc-col-dir">' + direitas.map((t) => ficha(t, 'dir')).join('') + '</div>' +
      '</div>' +
      '<p class="assoc-conta"><span class="assoc-feitos">0</span>/' + ex.pares.length + ' ' + txt('pares') + '</p>'
    );
  },

  montar(raiz, { exercicio, concluir }) {
    const certo = {};
    exercicio.pares.forEach((p) => { certo[p.esquerda] = p.direita; });

    const estado = { esq: null, erros: 0, feitos: 0, mapa: {}, travado: false };
    const total = exercicio.pares.length;

    const limpar = () => {
      raiz.querySelectorAll('.ficha.sel').forEach((f) => f.classList.remove('sel'));
      estado.esq = null;
    };

    raiz.addEventListener('click', (e) => {
      const f = e.target.closest('.ficha');
      if (!f || f.disabled || estado.travado) return;

      if (f.classList.contains('ficha-esq')) {
        limpar();
        f.classList.add('sel');
        estado.esq = f;
        return;
      }

      // clicou na direita sem ter escolhido a esquerda: nada a parear ainda
      if (!estado.esq) { f.classList.add('tremendo'); setTimeout(() => f.classList.remove('tremendo'), 300); return; }

      const esquerda = estado.esq.dataset.valor;
      const direita = f.dataset.valor;
      estado.mapa[esquerda] = direita;

      if (certo[esquerda] === direita) {
        [estado.esq, f].forEach((el) => {
          el.classList.remove('sel');
          el.classList.add('ficha-certa');
          el.disabled = true;
        });
        estado.esq = null;
        estado.feitos += 1;
        raiz.querySelector('.assoc-feitos').textContent = estado.feitos;
        if (estado.feitos === total) {
          estado.travado = true;
          concluir({ mapa: estado.mapa, erros: estado.erros });
        }
        return;
      }

      // errou: marca os dois, conta, e solta depois de um instante
      estado.erros += 1;
      const par = [estado.esq, f];
      par.forEach((el) => el.classList.add('ficha-errada'));
      estado.travado = true;
      setTimeout(() => {
        par.forEach((el) => el.classList.remove('ficha-errada', 'sel'));
        estado.esq = null;
        estado.travado = false;
      }, ESPERA_ERRO);
    });
  },

  colher(raiz) {
    // o invólucro só chama isto se o aluno apertar "Responder" antes de fechar
    // todos os pares — aí a resposta é parcial, e parcial não é acerto
    const feitos = Number(raiz.querySelector('.assoc-feitos').textContent);
    return feitos > 0 ? { mapa: {}, erros: -1, parcial: true } : null;
  },

  revelar(raiz, ex, v) {
    raiz.querySelectorAll('.ficha').forEach((f) => { f.disabled = true; });
    if (v.erros > 0) {
      const p = document.createElement('p');
      p.className = 'assoc-erros';
      p.textContent = v.erros === 1
        ? txt('1 par foi tentado errado antes de fechar.')
        : v.erros + ' ' + txt('pares foram tentados errado antes de fechar.');
      raiz.appendChild(p);
    }
  },
};
