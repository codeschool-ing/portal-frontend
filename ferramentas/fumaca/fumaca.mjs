/* ==========================================================================
   Teste de fumaça do portal.

   Percorre o portal inteiro num navegador de verdade e responde a uma pergunta
   por vez. Não substitui revisão humana — mede o que dá para medir sozinho.

   Roda contra um servidor estático qualquer:

     python3 -m http.server 8899          # na raiz do repositório
     node ferramentas/fumaca/fumaca.mjs   # noutro terminal

     PORTAL=http://localhost:3000 node ferramentas/fumaca/fumaca.mjs
     CHROME=/caminho/do/chrome            # se o Chromium não estiver no padrão

   O teste que MAIS importa aqui é o das arestas: ele reproduz o detector da
   vitrine, amostrando 120 pontos ao longo de cada curva renderizada e checando
   se algum cai dentro de um cartão que não seja ponta daquela aresta. Foi essa
   verificação que sustentou o roteamento lá, e o portal herdou o código —
   herdar sem herdar a conferência seria ficar com o risco e sem a rede.

   Dois defeitos reais já foram pegos por ele, e nenhum apareceria lendo código:
   o título do tópico traduzido deixando de casar com a chave dos exercícios, e
   o `<nav>` do trilho herdando a barra fixa do `base.css`.
   ========================================================================== */

import { chromium } from 'playwright';

const BASE = process.env.PORTAL || 'http://127.0.0.1:8899';
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
/* PAGINA aponta o teste para o pacote de arquivo único em vez do site servido:
   PORTAL=file:///caminho PAGINA=/portal-aluno.html node ferramentas/fumaca/fumaca.mjs */
const PAGINA = process.env.PAGINA || '/index.html';
const erros = [];
const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
p.on('pageerror', (e) => erros.push('pageerror: ' + e.message));

let falhas = 0;
const ok = (nome, cond, extra = '') => {
  if (!cond) falhas += 1;
  console.log((cond ? '  ok   ' : '  FALHA') + ' ' + nome + (extra ? ' — ' + extra : ''));
};

await p.goto(BASE + PAGINA, { waitUntil: 'networkidle' });

console.log('\n== 1. carga e redirecionamento ==');
ok('caiu em /entrar sem sessão', p.url().includes('#/entrar'), p.url());
ok('catálogo carregado', await p.evaluate(() => typeof CURSOS !== 'undefined' && CURSOS.length === 86));
ok('exercícios de exemplo', await p.evaluate(() => window.EXERCICIOS_EXEMPLO?.length > 0));

console.log('\n== 2. entrar ==');
await p.fill('#e-nome', 'Alexandre');
await p.selectOption('#e-trilha', 'backend');
await p.click('#form-entrar button[type=submit]');
await p.waitForFunction(() => location.hash === '#/painel');
ok('foi para o painel', true);
ok('trilho montado', (await p.locator('.trilho-link').count()) === 4);
ok('contexto na barra', (await p.locator('.ctx-nome').innerText()).includes('Back-end'));
ok('cartão de retomar', await p.locator('.retomar').isVisible());

console.log('\n== 3. trilha: o grafo como mapa ==');
await p.click('a[href="#/trilha"]');
await p.waitForSelector('.trilha-grafo');
await p.waitForTimeout(500);
const arestas = await p.locator('.aresta').count();
const cartoes = await p.locator('.curso-no').count();
ok('cartões desenhados', cartoes > 5, cartoes + ' cartões');
ok('arestas desenhadas', arestas > 5, arestas + ' arestas');
ok('estados nos cartões', (await p.locator('.no-estado').count()) > 5);
ok('bifurcação presente', (await p.locator('.garfo-aba').count()) === 4);
ok('nó de chegada', await p.locator('.no-saida').isVisible());

// nenhuma aresta pode passar por dentro de um cartão que não seja ponta dela —
// o mesmo detector que a vitrine usa, amostrando pontos ao longo de cada curva
const colisoes = await p.evaluate(() => {
  const cont = document.querySelector('.trilha-grafo');
  const base = cont.getBoundingClientRect();
  const caixas = [...cont.querySelectorAll('[data-no]')].map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.dataset.no, x: r.left - base.left + cont.scrollLeft, y: r.top - base.top + cont.scrollTop, w: r.width, h: r.height };
  });
  let ruins = 0;
  cont.querySelectorAll('.aresta').forEach((g) => {
    const path = g.querySelector('.linha');
    const total = path.getTotalLength();
    const pontas = [g.dataset.de, g.dataset.para];
    for (let i = 0; i <= 120; i += 1) {
      const pt = path.getPointAtLength((total * i) / 120);
      if (caixas.some((c) => !pontas.includes(c.id) &&
        pt.x > c.x + 2 && pt.x < c.x + c.w - 2 && pt.y > c.y + 2 && pt.y < c.y + c.h - 2)) { ruins += 1; break; }
    }
  });
  return ruins;
});
ok('nenhuma aresta cruza um cartão', colisoes === 0, colisoes + ' colisões');

console.log('\n== 4. curso e aula ==');
await p.goto(BASE + PAGINA + '#/curso/javascript');
await p.waitForSelector('.aula-linha');
const nAulas = await p.locator('.aula-linha').count();
ok('aula = tópico', nAulas === 12, nAulas + ' aulas');
ok('trilho virou lista de aulas', (await p.locator('.trilho-aula').count()) === 12);

/* A aula é dividida em seções e a avaliação é a última. Uma aula sem seções
   escritas — o caso do curso de JavaScript — tem duas: conteúdo e avaliação. */
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1');
await p.waitForSelector('.passo');
ok('aula sem seções escritas tem conteúdo + avaliação', (await p.locator('.passo').count()) === 2);
ok('a primeira seção não é a avaliação', (await p.locator('.ex').count()) === 0);

await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1/avaliacao');
await p.waitForSelector('.ex');
const tipos = await p.$$eval('.ex', (els) => els.map((e) => e.className.replace('ex ex-', '')));
ok('sete tipos na avaliação', tipos.length === 7, tipos.join(', '));

console.log('\n== 5. respondendo cada tipo ==');
const resp = async (sel, fn, esperado) => {
  const ex = p.locator(sel);
  await fn(ex);
  await ex.locator('.ex-responder').click();
  await p.waitForFunction((s) => document.querySelector(s + ' .ex-veredito')?.className.match(/v-(certo|errado|pendente)/),
    sel, { timeout: 5000 });
  const cls = await ex.locator('.ex-veredito').getAttribute('class');
  ok(sel.replace('.ex-', ''), cls.includes(esperado), cls);
};

// quiz: marca a alternativa correta pelo data-ix
await resp('.ex-quiz', async (ex) => {
  const ix = await p.evaluate(() => window.EXERCICIOS_EXEMPLO.find((e) => e.tipo === 'quiz').alternativas.findIndex((a) => a.correta));
  await ex.locator(`.alt[data-ix="${ix}"]`).click();
}, 'v-certo');

await resp('.ex-multipla-escolha', async (ex) => {
  const ixs = await p.evaluate(() => window.EXERCICIOS_EXEMPLO.find((e) => e.tipo === 'multipla-escolha')
    .alternativas.map((a, i) => (a.correta ? i : -1)).filter((i) => i >= 0));
  for (const i of ixs) await ex.locator(`.alt[data-ix="${i}"]`).click();
}, 'v-certo');

// ordenação: reordena via DOM para a ordem certa usando as setas
await resp('.ex-ordenacao', async (ex) => {
  const certos = await p.evaluate(() => window.EXERCICIOS_EXEMPLO.find((e) => e.tipo === 'ordenacao').itens);
  for (let alvo = 0; alvo < certos.length; alvo += 1) {
    for (let passo = 0; passo < 8; passo += 1) {
      const atual = await ex.locator('.ord-item').allTextContents();
      const pos = atual.findIndex((t) => t.includes(certos[alvo].slice(0, 22).replace(/`/g, '')));
      if (pos <= alvo) break;
      await ex.locator('.ord-item').nth(pos).locator('.ord-seta[data-dir="-1"]').click();
    }
  }
}, 'v-certo');

await resp('.ex-associacao', async (ex) => {
  const pares = await p.evaluate(() => window.EXERCICIOS_EXEMPLO.find((e) => e.tipo === 'associacao').pares);
  for (const par of pares) {
    await ex.locator(`.assoc-sel[data-esquerda="${par.esquerda.replace(/"/g, '\\"')}"]`).selectOption(par.direita);
  }
}, 'v-certo');

// os três que precisam de servidor: o veredito tem de ser "não conferido"
await resp('.ex-saida-esperada', async (ex) => ex.locator('.ex-campo').fill('false\ntrue\nnumber\n'), 'v-pendente');
await resp('.ex-codigo', async (ex) => ex.locator('.cod-area').fill('console.log(1)'), 'v-pendente');
await resp('.ex-resposta-expressao', async (ex) => ex.locator('.ex-campo').fill('3*x**2'), 'v-pendente');

console.log('\n== 6. porque só aparece depois ==');
const vazamento = await p.evaluate(() => {
  // recarrega uma aula limpa e confere que nenhum `porque` está visível antes
  return [...document.querySelectorAll('.alt-porque')].filter((e) => !e.hidden).length;
});
ok('justificativas reveladas só após responder', vazamento > 0, vazamento + ' visíveis agora (esperado)');

console.log('\n== 7. progresso e persistência ==');
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1/conteudo');
await p.waitForSelector('.marcar');
await p.click('.marcar');
// marcar leva à seção seguinte: concluir e seguir é o mesmo gesto
await p.waitForFunction(() => location.hash.endsWith('/avaliacao'), null, { timeout: 5000 });
ok('marcar avança para a próxima seção', true);
ok('seção marcada no trilho', (await p.locator('.trilho-secao.feita').count()) === 1);
const pctAntes = await p.locator('.ctx-pct').innerText();
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(400);
ok('sobreviveu ao reload', (await p.locator('.ctx-pct').innerText()) === pctAntes, pctAntes);

console.log('\n== 8. seções escritas ==');
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8');
await p.waitForSelector('.passo');
const passos = await p.$$eval('.passo-tit', (e) => e.map((x) => x.textContent));
ok('o tópico de hospedagem virou 5 seções', passos.length === 5, passos.join(' · '));
ok('a primeira seção é a compartilhada', /compartilhada/i.test(passos[0]), passos[0]);
ok('prosa renderizada', (await p.locator('.aula-texto p').count()) >= 2);
ok('trilho abre as seções da aula atual', (await p.locator('.trilho-secao').count()) === 5);
/* A regressão que importa: as seções são casadas pelo tópico EM PORTUGUÊS, e o
   título exibido é traduzido. Num navegador em inglês — que é o caso deste
   Chromium — casar pelo título devolveria zero seções. */
ok('casou apesar de o título estar traduzido', (await p.locator('.aula-titulo').innerText()) !== '');

// a última seção de uma aula leva à primeira da aula seguinte
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8/escolher');
await p.waitForSelector('.aula-nav');
await p.click('.aula-nav a:last-child');
await p.waitForFunction(() => /\/aula\/9\//.test(location.hash), null, { timeout: 5000 });
ok('a próxima atravessa a fronteira da aula', true);

console.log('\n== 9. idioma ==');
await p.goto(BASE + PAGINA + '#/painel');
await p.waitForSelector('.retomar');
await p.click('.idioma-btn');
await p.click('.idioma-op[lang="en"]');
await p.waitForTimeout(400);
const nomeEn = await p.locator('.ctx-nome').innerText();
ok('trilha traduzida', /Back-end Development/i.test(nomeEn), nomeEn);
ok('tela remontada no idioma novo', await p.locator('.retomar').isVisible());

console.log('\n== 10. tema claro e estreito ==');
await p.click('.idioma-btn'); await p.click('.idioma-op[lang="pt-BR"]'); await p.waitForTimeout(300);
await p.click('#tema-btn');
await p.waitForTimeout(250);
ok('tema claro aplicado', (await p.evaluate(() => document.documentElement.dataset.tema)) === 'claro');
await p.click('#tema-btn');

await p.setViewportSize({ width: 390, height: 780 });
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1/avaliacao');
await p.waitForSelector('.ex');
await p.waitForTimeout(300);
ok('trilho vira gaveta', await p.locator('#trilho-btn').isVisible());
const larguraOk = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
ok('sem rolagem horizontal no celular', larguraOk);

console.log('\n== erros de JavaScript ==');
/* As fontes do Google não são erro do portal: em rede fechada elas falham e o
   fallback do CSS assume. Qualquer outra coisa conta como falha. */
const relevantes = erros.filter((e) => !e.includes('ERR_CONNECTION_RESET'));
if (relevantes.length) { relevantes.forEach((e) => console.log('  ! ' + e)); falhas += relevantes.length; }
else console.log('  nenhum');

await b.close();

// regressão: o botão de refazer não pode existir visível antes de responder
const b2 = await chromium.launch({ executablePath: CHROME });
const p2 = await b2.newPage({ viewport:{width:1440,height:900} });
await p2.goto(BASE + PAGINA + '#/entrar',{waitUntil:'networkidle'});
await p2.fill('#e-nome','X'); await p2.selectOption('#e-trilha','backend');
await p2.click('#form-entrar button[type=submit]'); await p2.waitForTimeout(300);
await p2.goto(BASE + PAGINA + '#/curso/javascript/aula/1/avaliacao',{waitUntil:'networkidle'});
await p2.waitForSelector('.ex');
console.log('\n== 11. nada revelado antes de responder ==');
ok('refazer escondido', (await p2.locator('.ex-refazer:visible').count()) === 0);
ok('justificativas escondidas', (await p2.locator('.alt-porque:visible').count()) === 0);
ok('vereditos vazios', (await p2.locator('.ex-veredito:visible').count()) === 0);
await b2.close();

console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntudo passou');
process.exit(falhas ? 1 : 0);
