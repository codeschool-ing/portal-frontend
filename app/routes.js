/* ==========================================================================
   Hash routing.

   Hash, and not the History API, for a practical reason: the portal is served as
   a static file (the vitrine already lives on GitHub Pages) and
   `history.pushState` requires the server to return the index at any path. A
   hash works anywhere, including opening the file straight off disk.

   A screen is a function `async (params) => { titulo, el, depois? }`.
   `depois` runs AFTER the element enters the document — the graph measures real
   positions and cannot be measured outside the tree.

   The keys of that returned object stay in Portuguese for now: fourteen screens
   still speak them, and they get renamed when those screens are translated.
   ========================================================================== */

const routes = [];

export function route(pattern, load) {
  // '/curso/:id/aula/:ix' → a regex with named groups
  const names = [];
  const re = new RegExp('^' + pattern.replace(/:([a-z]+)/gi, (_, n) => {
    names.push(n);
    return '([^/]+)';
  }) + '$');
  routes.push({ re, nomes: names, carregar: load });
}

export const goTo = (path) => { location.hash = '#' + path; };

export function currentPath() {
  const h = location.hash.replace(/^#/, '');
  return h || '/painel';
}

function match(path) {
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = {};
    r.nomes.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
    return { r, params };
  }
  return null;
}

let onChange = () => {};
export function whenChanged(f) { onChange = f; }

export async function dispatch() {
  const path = currentPath();
  const found = match(path);
  await onChange(path, found);
}

export function start() {
  addEventListener('hashchange', dispatch);
  return dispatch();
}
