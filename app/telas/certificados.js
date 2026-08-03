/* ==========================================================================
   Certificados.

   UMA DECISÃO EM ABERTO, DE PROPÓSITO: aqui o certificado é por CURSO, porque
   é a única unidade que existe hoje. O README da vitrine deixa registrado que
   a "unidade intermediária" — algo entre um curso e a trilha inteira, que é o
   que a Alura chama de Trilha — é decisão da Etapa 2, e lista quatro perguntas
   ainda não respondidas, incluindo qual ramo certificar quando a trilha
   termina em leque com escolha terminal.

   O custo dessa decisão só salta no PRIMEIRO CERTIFICADO EMITIDO PARA ALUNO
   REAL, porque a partir dali trocar a unidade vira reemissão. Enquanto o
   portal for esqueleto, certificar por curso não compromete nada.
   ========================================================================== */

import { aulasDoCurso, caminhoDaTrilha } from '../catalogo.js';
import { cursoConcluido, opcaoAtiva } from '../estado.js';
import { trilhaDoAluno } from './comum.js';
import { esc } from '../texto.js';

export default async function certificados() {
  const el = document.createElement('div');
  el.className = 'tela tela-certificados';

  const t = trilhaDoAluno();
  const doCaminho = t ? caminhoDaTrilha(t, opcaoAtiva) : [];
  const feitos = CURSOS.filter((c) => cursoConcluido(c.id, aulasDoCurso(c.id).length));

  el.innerHTML =
    '<header class="tela-head">' +
      '<span class="tag">// ' + txt('certificados') + '</span>' +
      '<h1>' + txt('Seus certificados') + '</h1>' +
      '<p>' + txt('Um por curso concluído, com carga horária e código de validação.') + '</p>' +
    '</header>' +
    (feitos.length
      ? '<div class="certs">' + feitos.map((c) => (
          '<article class="cert">' +
            '<div class="term-bar">' +
              '<span class="dot d-r"></span><span class="dot d-y"></span><span class="dot d-g"></span>' +
              '<span class="modal-arquivo">certificado.' + esc(c.id) + '</span>' +
            '</div>' +
            '<div class="cert-corpo">' +
              '<span class="cert-rot">' + txt('curso concluído') + '</span>' +
              '<h2>' + esc(c.nome) + '</h2>' +
              '<p class="cert-meta">' + c.horas + 'h · ' + txt(c.nivel) +
                (doCaminho.includes(c.id) && t ? ' · ' + esc(t.nome) : '') + '</p>' +
              '<p class="cert-codigo mono dim">' + txt('[código de validação — emitido pelo servidor na Etapa 2]') + '</p>' +
            '</div>' +
          '</article>'
        )).join('') + '</div>'
      : '<p class="vazio">' + txt('Nenhum curso concluído ainda. Termine todas as aulas de um curso para emitir o certificado.') + '</p>');

  return { titulo: txt('Certificados'), el };
}
