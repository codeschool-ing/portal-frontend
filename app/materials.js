/* ==========================================================================
   Supplementary material — the list and the download button.

   One component, used both in the section and on the course page, because
   downloading a PDF is the same gesture in both places and two pieces of markup
   would diverge the day one of them changed.

   The `download` attribute on the link is what makes the browser SAVE the file
   instead of opening the PDF in the built-in viewer and taking the student out
   of the lesson. The file name comes from the record, not from the URL — with a
   `data:` URI there is no name in the URL at all, and without the attribute the
   file would be saved as "download".
   ========================================================================== */

import { esc } from './text.js';

const ICON = {
  pdf: 'M8 2h6l4 4v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5',
  zip: 'M10 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7zM10 2v5H5M9 12h2M9 15h2M9 18h2',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
};

const DOWNLOAD_ARROW = 'M12 3v12m0 0l-4-4m4 4l4-4M4 19h16';

const svg = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

/* A readable size. It rounds up from 1 KB because "0.9 KB" is precise and
   useless — the number exists so people know whether it fits their data plan,
   not so it matches `ls`. */
export function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
}

export function materialList(materials, { title } = {}) {
  if (!materials.length) return '';
  return '<section class="materials">' +
    '<div class="materials-top">' +
      '<h3>' + (title || txt('Supporting material')) + '</h3>' +
      '<span class="mono dim">' + materials.length + ' ' +
        txt(materials.length === 1 ? 'file' : 'files') + '</span>' +
    '</div>' +
    materials.map((m) => {
      const kind = m.kind || 'link';
      const external = kind === 'link';
      return '<a class="mat" href="' + esc(m.data || m.url || '#') + '"' +
        // an external link opens away; a file downloads, under the record's name
        (external ? ' target="_blank" rel="noopener"' : ' download="' + esc(m.file || '') + '"') + '>' +
        '<span class="mat-icone" aria-hidden="true">' + svg(ICON[kind] || ICON.link) + '</span>' +
        '<span class="mat-middle">' +
          '<span class="mat-tit">' + esc(m.title) + '</span>' +
          '<span class="mat-meta mono dim">' + esc(kind.toUpperCase()) +
            (m.bytes ? ' · ' + fileSize(m.bytes) : '') +
            (m.lesson ? ' · ' + esc(m.lesson) : '') +
          '</span>' +
        '</span>' +
        '<span class="mat-download" aria-hidden="true">' + svg(external ? ICON.link : DOWNLOAD_ARROW) + '</span>' +
      '</a>';
    }).join('') +
  '</section>';
}
