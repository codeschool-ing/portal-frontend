/* ==========================================================================
   Rotas por hash.

   Hash, e não History API, por um motivo prático: o portal é servido como
   arquivo estático (a vitrine já mora no GitHub Pages) e `history.pushState`
   exige o servidor devolver o index em qualquer caminho. Hash funciona em
   qualquer lugar, inclusive abrindo o arquivo do disco.

   Uma tela é uma função `async (params) => { titulo, el, depois? }`.
   `depois` roda DEPOIS de o elemento entrar no documento — o grafo mede
   posições reais e não pode ser medido fora da árvore.
   ========================================================================== */

const rotas = [];

export function rota(padrao, carregar) {
  // '/curso/:id/aula/:ix' → regex com grupos nomeados
  const nomes = [];
  const re = new RegExp('^' + padrao.replace(/:([a-z]+)/gi, (_, n) => {
    nomes.push(n);
    return '([^/]+)';
  }) + '$');
  rotas.push({ re, nomes, carregar });
}

export const irPara = (caminho) => { location.hash = '#' + caminho; };

export function caminhoAtual() {
  const h = location.hash.replace(/^#/, '');
  return h || '/painel';
}

function casar(caminho) {
  for (const r of rotas) {
    const m = caminho.match(r.re);
    if (!m) continue;
    const params = {};
    r.nomes.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
    return { r, params };
  }
  return null;
}

let aoTrocar = () => {};
export function quandoTrocar(f) { aoTrocar = f; }

export async function despachar() {
  const caminho = caminhoAtual();
  const achado = casar(caminho);
  await aoTrocar(caminho, achado);
}

export function iniciar() {
  addEventListener('hashchange', despachar);
  return despachar();
}
