/* ==========================================================================
   Correção — só o que se corrige por comparação pura.

   Quatro dos sete tipos fecham no cliente porque a correção é comparar dois
   valores: uma alternativa, um conjunto, uma sequência, um mapeamento. Os
   outros três precisam de servidor — `codigo` e `saida-esperada` executam,
   `resposta-expressao` precisa de equivalência simbólica (sympy). Não dá para
   fingir nenhum dos três no navegador sem mentir sobre o resultado.

   Nenhuma função daqui lê o DOM: recebe o exercício e a resposta colhida.
   ========================================================================== */

export const CORRIGE_NO_CLIENTE = ['quiz', 'multipla-escolha', 'ordenacao', 'associacao'];
export const PRECISA_SERVIDOR = ['codigo', 'saida-esperada', 'resposta-expressao'];

const mesmoConjunto = (a, b) =>
  a.length === b.length && a.every((v) => b.includes(v));

const mesmaSequencia = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function avaliarLocal(ex, resposta) {
  switch (ex.tipo) {
    case 'quiz': {
      // uma só, e tem de ser a marcada como correta
      const certa = ex.alternativas.findIndex((a) => a.correta);
      return veredito(resposta === certa, { certa });
    }

    case 'multipla-escolha': {
      /* Correção por CONJUNTO EXATO, e é de propósito: a doc do pipeline
         registra que cinco alternativas são cinco chances de errar em vez de
         uma. Marcar quase todas as certas não é meio ponto. */
      const certas = ex.alternativas.map((a, i) => (a.correta ? i : -1)).filter((i) => i >= 0);
      return veredito(mesmoConjunto(resposta || [], certas), { certas });
    }

    case 'ordenacao': {
      // `itens` no JSON já está na ordem certa — é o gabarito
      return veredito(mesmaSequencia(resposta || [], ex.itens), { certa: ex.itens });
    }

    case 'associacao': {
      /* resposta = { [esquerda]: direita }. Conta quantos pares saíram certos
         para o feedback conseguir dizer "3 de 5", mas acertar é acertar todos:
         par certo por eliminação não vale meio exercício. */
      const certos = ex.pares.filter((p) => (resposta || {})[p.esquerda] === p.direita).length;
      return veredito(certos === ex.pares.length, { certos, total: ex.pares.length });
    }

    default:
      return veredito(null, { erro: 'tipo sem correção local: ' + ex.tipo });
  }
}

const veredito = (acertou, extra = {}) => ({ acertou, simulado: false, ...extra });
