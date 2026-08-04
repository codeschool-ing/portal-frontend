/* ==========================================================================
   Material complementar — a lista e o botão de baixar.

   Um componente só, usado na seção e na página do curso, porque baixar um PDF
   é o mesmo gesto nos dois lugares e duas marcações divergiriam no dia em que
   uma delas mudasse.

   O `download` no link é o que faz o navegador SALVAR em vez de abrir o PDF no
   visualizador embutido e tirar o aluno da aula. O nome do arquivo vem do
   registro, não da URL — com `data:` URI não há nome nenhum na URL, e sem o
   atributo o arquivo salvaria como "download".
   ========================================================================== */

import { esc } from './text.js';

const ICONE = {
  pdf: 'M8 2h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5',
  zip: 'M10 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7zM10 2v5H5M9 12h2M9 15h2M9 18h2',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
};

const SETA_BAIXAR = 'M12 3v12m0 0l-4-4m4 4l4-4M4 19h16';

const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

/* Tamanho legível. Arredonda para cima a partir de 1 KB porque "0,9 KB" é
   preciso e inútil — o número existe para a pessoa saber se cabe no plano de
   dados dela, não para bater com o `ls`. */
export function tamanho(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
}

export function listaDeMateriais(materiais, { titulo } = {}) {
  if (!materiais.length) return '';
  return '<section class="materiais">' +
    '<div class="materiais-topo">' +
      '<h3>' + txt(titulo || 'Material complementar') + '</h3>' +
      '<span class="mono dim">' + materiais.length + ' ' +
        txt(materiais.length === 1 ? 'arquivo' : 'arquivos') + '</span>' +
    '</div>' +
    materiais.map((m) => {
      const tipo = m.tipo || 'link';
      const externo = tipo === 'link';
      return '<a class="mat" href="' + esc(m.dados || m.url || '#') + '"' +
        // link externo abre fora; arquivo baixa, com o nome do registro
        (externo ? ' target="_blank" rel="noopener"' : ' download="' + esc(m.arquivo || '') + '"') + '>' +
        '<span class="mat-icone" aria-hidden="true">' + svg(ICONE[tipo] || ICONE.link) + '</span>' +
        '<span class="mat-meio">' +
          '<span class="mat-tit">' + esc(m.titulo) + '</span>' +
          '<span class="mat-meta mono dim">' + esc(tipo.toUpperCase()) +
            (m.bytes ? ' · ' + tamanho(m.bytes) : '') +
            (m.aula ? ' · ' + esc(m.aula) : '') +
          '</span>' +
        '</span>' +
        '<span class="mat-baixar" aria-hidden="true">' + svg(externo ? ICONE.link : SETA_BAIXAR) + '</span>' +
      '</a>';
    }).join('') +
  '</section>';
}
