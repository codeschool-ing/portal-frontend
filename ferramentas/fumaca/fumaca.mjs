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
ok('trilho montado', (await p.locator('.trilho-link').count()) === 6);
ok('contexto na barra', (await p.locator('.ctx-nome').innerText()).includes('Back-end'));
ok('cartão de retomar', await p.locator('.retomar').isVisible());

console.log('\n== 3. trilha: o grafo como mapa ==');
await p.click('.trilho-link[href="#/trilha"]');
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

/* A aula é dividida em seções e a avaliação é a última. Uma aula ainda SEM
   seções escritas tem duas: conteúdo e avaliação. O curso usado aqui já foi o
   de JavaScript, e deixou de servir no dia em que ele ganhou conteúdo — o que
   é o comportamento certo, e a razão de o teste apontar para um curso que
   continua sem texto. */
await p.goto(BASE + PAGINA + '#/curso/git/aula/1');
await p.waitForSelector('.passo');
ok('aula sem seções escritas tem conteúdo + avaliação', (await p.locator('.passo').count()) === 2);

await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1');
await p.waitForSelector('.passo');
ok('a primeira seção não é a avaliação', (await p.locator('.ex').count()) === 0);

/* A avaliação é um WIZARD: uma questão por vez, com marcadores no topo. */
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/1/avaliacao');
await p.waitForSelector('.wizard');
ok('uma questão por vez', (await p.locator('.ex').count()) === 1);
ok('sete marcadores', (await p.locator('.wz-ponto').count()) === 7);

const tipos = [];
for (let i = 0; i < 7; i += 1) {
  await p.locator('.wz-ponto').nth(i).click();
  await p.waitForTimeout(120);
  tipos.push((await p.locator('.ex').getAttribute('class')).replace('ex ex-', ''));
}
ok('os sete tipos estão no wizard', new Set(tipos).size === 7, tipos.join(', '));

console.log('\n== 5. respondendo cada tipo ==');
// leva o wizard até a questão daquele tipo, responde e confere o veredito
const irAte = async (tipo) => {
  const n = await p.locator('.wz-ponto').count();
  for (let i = 0; i < n; i += 1) {
    await p.locator('.wz-ponto').nth(i).click();
    await p.waitForTimeout(120);
    if (await p.locator('.ex-' + tipo).count()) return true;
  }
  return false;
};
const resp = async (sel, fn, esperado) => {
  const tipo = sel.replace('.ex-', '');
  if (!await irAte(tipo)) { ok(tipo, false, 'não achei no wizard'); return; }
  const ex = p.locator(sel);
  await fn(ex);
  const botao = ex.locator('.ex-responder');
  if (await botao.count()) await botao.click();   // a associação se conclui sozinha
  await p.waitForFunction((s) => document.querySelector(s + ' .ex-veredito')?.className.match(/v-(certo|errado|pendente)/),
    sel, { timeout: 5000 });
  const cls = await ex.locator('.ex-veredito').getAttribute('class');
  ok(tipo, cls.includes(esperado), cls);
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

/* A associação virou clique-a-clique com feedback imediato, no gesto do
   Duolingo. Como o par errado se desfaz, o mapa final está sempre certo — o
   veredito passa a medir os ERROS do caminho, e acertar é fechar sem nenhum. */
await resp('.ex-associacao', async (ex) => {
  const pares = await p.evaluate(() => window.EXERCICIOS_EXEMPLO.find((e) => e.tipo === 'associacao').pares);
  for (const par of pares) {
    await ex.locator('.ficha-esq').filter({ hasText: par.esquerda.replace(/`/g, '') }).first().click();
    await ex.locator('.ficha-dir').filter({ hasText: par.direita.replace(/`/g, '') }).first().click();
    await p.waitForTimeout(80);
  }
}, 'v-certo');

// os três que precisam de servidor: o veredito tem de ser "não conferido"
await resp('.ex-saida-esperada', async (ex) => ex.locator('.ex-campo').fill('false\ntrue\nnumber\n'), 'v-pendente');
await resp('.ex-codigo', async (ex) => ex.locator('.cod-area').fill('console.log(1)'), 'v-pendente');
await resp('.ex-resposta-expressao', async (ex) => ex.locator('.ex-campo').fill('3*x**2'), 'v-pendente');

console.log('\n== 6. o wizard guarda o que foi respondido ==');
/* Voltar a uma questão já respondida tem de devolvê-la como ficou: com o
   veredito à vista e as justificativas reveladas. Remontar apagaria isso, e o
   aluno acharia que perdeu o que fez. */
await irAte('quiz');
ok('veredito continua lá ao voltar',
  (await p.locator('.ex-quiz .ex-veredito').getAttribute('class')).includes('v-certo'));
const reveladas = await p.locator('.ex-quiz .alt-porque:visible').count();
ok('justificativas continuam reveladas', reveladas > 0, reveladas + ' visíveis');
ok('marcador da questão ficou verde', (await p.locator('.wz-ponto.certo').count()) >= 4);

console.log('\n== 7. progresso e persistência ==');
// curso ainda sem texto, para a aula ter exatamente conteúdo + avaliação e o
// "avançar" cair na avaliação em um passo
await p.goto(BASE + PAGINA + '#/curso/git/aula/1/conteudo');
await p.waitForSelector('.lado-dir');
ok('não há mais botão de concluir', (await p.locator('.marcar').count()) === 0);
await p.click('.lado-dir');
// avançar É concluir: um gesto só, sem botão separado
await p.waitForFunction(() => location.hash.endsWith('/avaliacao'), null, { timeout: 5000 });
ok('avançar leva à próxima seção', true);
ok('seção marcada no trilho', (await p.locator('.trilho-secao.feita').count()) === 1);
const pctAntes = await p.locator('.ctx-pct').innerText();
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(400);
ok('sobreviveu ao reload', (await p.locator('.ctx-pct').innerText()) === pctAntes, pctAntes);

console.log('\n== 8. seções escritas ==');
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8');
await p.waitForSelector('.passo');
const passos = await p.$$eval('.passo-tit', (e) => e.map((x) => x.textContent));
ok('o tópico de hospedagem virou 5 seções + avaliação', passos.length === 6, passos.join(' · '));
ok('a primeira seção é a compartilhada', /compartilhada/i.test(passos[0]), passos[0]);
ok('a última é sempre a avaliação', /avalia/i.test(passos[passos.length - 1]), passos[passos.length - 1]);
ok('prosa renderizada', (await p.locator('.aula-texto p').count()) >= 2);
ok('seção de conteúdo reserva o quadro de vídeo', await p.locator('.video-fachada').isVisible());
ok('trilho abre as seções da aula atual', (await p.locator('.trilho-secao').count()) === 6);
/* A regressão que importa: as seções são casadas pelo tópico EM PORTUGUÊS, e o
   título exibido é traduzido. Num navegador em inglês — que é o caso deste
   Chromium — casar pelo título devolveria zero seções. */
ok('casou apesar de o título estar traduzido', (await p.locator('.aula-titulo').innerText()) !== '');

// a última seção de uma aula leva à primeira da aula seguinte
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8/avaliacao');
await p.waitForSelector('.lado-dir');
await p.click('.lado-dir');
await p.waitForFunction(() => /\/aula\/9\//.test(location.hash), null, { timeout: 5000 });
ok('a próxima atravessa a fronteira da aula', true);

/* Toda aula termina em avaliação, tenha exercícios ou não. A vazia aparece —
   a estrutura é previsível — mas não conta no progresso, senão nenhum curso
   fecharia enquanto o conteúdo não existisse. */
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8/avaliacao');
await p.waitForSelector('.wizard');
// no wizard só uma questão fica na tela; quem conta é a fileira de marcadores
ok('a avaliação de hospedagem tem 2 questões', (await p.locator('.wz-ponto').count()) === 2);

await p.goto(BASE + PAGINA + '#/curso/javascript/aula/3/avaliacao');
await p.waitForSelector('.aval-pendente');
ok('avaliação sem exercícios aparece como pendente', true);
/* avançar conclui — MENOS numa avaliação pendente, que não tem o que concluir */
await p.click('.lado-dir');
await p.waitForTimeout(300);
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/3/avaliacao');
await p.waitForSelector('.passo');
ok('avaliação pendente não é concluída ao avançar',
  (await p.locator('.passo.passo-aval.feito').count()) === 0);

const denominadores = await p.evaluate(() => {
  const aulas = CURSOS.find((c) => c.id === 'javascript').topicos.length;
  const conta = document.querySelector('.trilho-conta').textContent;
  return { aulas, conta };
});
/* 12 aulas de javascript. Seções de CONTEÚDO: as quatro primeiras foram
   escritas (4+3+2+2 = 11) e as outras oito ainda caem no invólucro de uma
   seção só (8). Somam 19. AVALIAÇÕES: só as três aulas que têm exercícios
   entram no denominador. 19 + 3 = 22.

   O número muda quando mais conteúdo é escrito, e isso é o comportamento
   certo: a aula passou mesmo a ter mais trabalho dentro. O que o teste guarda
   é a REGRA — sem a exclusão das avaliações vazias o denominador seria 31, e
   o curso nunca chegaria a 100%. */
ok('avaliação pendente fora do denominador', /\b22\b/.test(denominadores.conta), denominadores.conta);

console.log('\n== 9. curso prático: código na prosa ==');
await p.goto(BASE + PAGINA + '#/curso/html-css');
await p.waitForSelector('.aula-linha');
ok('html-css tem 13 aulas', (await p.locator('.aula-linha').count()) === 13);
/* 13 aulas × 3 seções = 39, mais as 4 avaliações que já têm exercícios.
   As 9 avaliações pendentes ficam de fora do denominador. */
ok('denominador conta só as avaliações prontas',
  /\b43\b/.test(await p.locator('.curso-conta').innerText()),
  await p.locator('.curso-conta').innerText());

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/7/eixos');
await p.waitForSelector('.prosa-cod');
const bloco = await p.locator('.prosa-cod .cod').first().innerText();
ok('bloco de código na prosa', bloco.includes('display: flex'), JSON.stringify(bloco.slice(0, 40)));
ok('com rótulo de linguagem', (await p.locator('.prosa-cod .cod-ling').first().innerText()).toLowerCase() === 'css');
/* O bloco NÃO passa por `marcado`: crase e asterisco dentro de código são
   caracteres, não marcação. Um `<` mal escapado sumiria a linha inteira. */
// o <code> de dentro não pode conter TAG NENHUMA: só texto escapado
const html = await p.locator('.prosa-cod .cod code').first().innerHTML();
ok('código escapado, sem marcação aplicada', !/<[a-z]/i.test(html));

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/0/esqueleto');
await p.waitForSelector('.prosa-cod');
const htmlBloco = await p.locator('.prosa-cod .cod').first().innerText();
ok('tags HTML sobrevivem ao escape', htmlBloco.includes('<!DOCTYPE html>'), JSON.stringify(htmlBloco.slice(0, 24)));

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/0/avaliacao');
await p.waitForSelector('.aval-pendente');
ok('curso pela metade mostra avaliação pendente', (await p.locator('.marcar').count()) === 0);

console.log('\n== 10. busca global ==');
await p.goto(BASE + PAGINA + '#/painel');
await p.waitForSelector('.retomar');
await p.keyboard.press('Control+k');
await p.waitForSelector('.busca-campo');
ok('⌘K abre o painel', true);

await p.fill('.busca-campo', 'ttl');
await p.waitForTimeout(200);
const grupos = await p.locator('.busca-grupo').count();
ok('acha em mais de um grupo', grupos >= 2, grupos + ' grupos');
ok('resultado traz o contexto', (await p.locator('.bi-ctx').count()) > 0);

/* Sem acento tem de achar com acento: quem digita no celular quase nunca
   acentua, e a dobra é feita dos dois lados da comparação. */
await p.fill('.busca-campo', 'coercao');
await p.waitForTimeout(200);
ok('busca sem acento acha o acentuado', (await p.locator('.busca-item').count()) > 0);

/* A regressão que importa: o catálogo é traduzido em runtime, então indexar só
   o texto exibido faria as seções (que estão em português) sumirem em inglês. */
await p.fill('.busca-campo', 'hospedagem');
await p.waitForTimeout(200);
ok('acha conteúdo em português com a interface em inglês',
  (await p.locator('.busca-item').count()) > 0);

/* O trecho é texto puro: a marcação mínima do corpo (crase e **) é
   interpretada na seção, não aqui, e sobrava na tela como `**TTL**`. */
await p.fill('.busca-campo', 'cache');
await p.waitForTimeout(200);
const trechos = await p.locator('.bi-ctx').allInnerTexts();
ok('trecho sem marcação crua', trechos.every((t) => !/\*\*|`/.test(t)),
  trechos.length + ' trechos');

/* E ele não repete o título que está logo acima dele: o trecho existe para
   mostrar o que a linha do título não mostra. */
const repetiu = await p.locator('.busca-item').evaluateAll((els) => els.some((el) => {
  const tit = el.querySelector('.bi-tit')?.textContent.trim() || '';
  const tre = el.querySelector('.bi-ctx')?.textContent.trim() || '';
  return tit.length > 8 && tre.startsWith(tit);
}));
ok('trecho não repete o título', !repetiu);

await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
ok('Enter navega para o resultado', /#\/curso\//.test(await p.evaluate(() => location.hash)),
  await p.evaluate(() => location.hash));

await p.keyboard.press('Control+k');
await p.waitForSelector('.busca-campo');
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
ok('Esc fecha', (await p.locator('.busca-campo:visible').count()) === 0);

console.log('\n== 11. desempenho, refazer e notas ==');
/* Erra uma de propósito: sem erro não há o que a tela de desempenho mostre
   nem o que a de refazer reúna, e o teste passaria sem exercitar nada. */
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/2/avaliacao');
await p.waitForSelector('.wizard');
await irAte('quiz');
const errada = await p.evaluate(() =>
  window.EXERCICIOS_EXEMPLO.find((e) => e.id === 'wf-03-quiz').alternativas.findIndex((a) => !a.correta));
await p.locator(`.ex-quiz .alt[data-ix="${errada}"]`).click();
await p.locator('.ex-quiz .ex-responder').click();
await p.waitForFunction(() => document.querySelector('.ex-quiz .ex-veredito')?.className.includes('v-errado'),
  null, { timeout: 5000 });
ok('errou de propósito', true);

await p.goto(BASE + PAGINA + '#/desempenho');
await p.waitForSelector('.tela-desempenho, .tela-vazia');
ok('desempenho mostra o que foi respondido', (await p.locator('.dsp-linha').count()) > 0);
const errados = await p.locator('.dsp-errados li').count();
ok('lista os errados', errados > 0, errados + ' errados');
/* Errar e não-ser-conferido são estados diferentes: os tipos que precisam de
   servidor respondem `null` e não podem contar como reprovação. */
ok('separa "não conferido" de "errou"',
  (await p.locator('.trilha-numeros').innerText()).includes('aguardando'));

ok('há link para refazer', (await p.locator('a[href="#/refazer"]').count()) === 1);
await p.goto(BASE + PAGINA + '#/refazer');
await p.waitForSelector('.wizard');
ok('refazer monta o wizard com os errados', (await p.locator('.wz-ponto').count()) === errados);

// uma nota, escrita numa seção e reencontrada na tela de notas e na busca
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/8/vps');
await p.waitForSelector('.nota summary');
// a anotação nasce recolhida: só pede atenção de quem vai usá-la
ok('a nota começa recolhida', (await p.locator('.nota-campo:visible').count()) === 0);
await p.click('.nota summary');
await p.fill('.nota-campo', 'lembrar: VPS é responsabilidade, não potência');
await p.waitForTimeout(800);
ok('nota é salva sozinha', (await p.locator('.nota-estado').innerText()).length > 0);

await p.goto(BASE + PAGINA + '#/notas');
await p.waitForSelector('.nota-item');
ok('a nota aparece na tela de notas',
  (await p.locator('.nota-texto').innerText()).includes('responsabilidade'));

await p.keyboard.press('Control+k');
await p.waitForSelector('.busca-campo');
await p.fill('.busca-campo', 'responsabilidade, nao');
await p.waitForTimeout(250);
ok('a nota entra na busca', (await p.locator('.busca-grupo').allInnerTexts()).join(' ').length > 0);
await p.keyboard.press('Escape');

console.log('\n== 12. idioma ==');
await p.goto(BASE + PAGINA + '#/painel');
await p.waitForSelector('.retomar');
await p.click('.idioma-btn');
await p.click('.idioma-op[lang="en"]');
await p.waitForTimeout(400);
const nomeEn = await p.locator('.ctx-nome').innerText();
ok('trilha traduzida', /Back-end Development/i.test(nomeEn), nomeEn);
ok('tela remontada no idioma novo', await p.locator('.retomar').isVisible());

console.log('\n== 13. figuras, código anotado e material ==');
await p.goto(BASE + PAGINA + '#/curso/html-css/aula/7/alinhamento');
await p.waitForSelector('.exemplo');
const partes = await p.locator('.exemplo-cod').count();
ok('exemplo anotado, um trecho por nota', partes >= 5, partes + ' trechos');
ok('a saída do exemplo aparece', await p.locator('.exemplo-saida').isVisible());

/* DUAS FORMAS, E A ESCOLHA É POR LARGURA DISPONÍVEL.

   Empilhado é o padrão: a nota ANTES do trecho, as duas em uma coluna só. As
   duas colunas só aparecem quando as DUAS cabem — o código sem rolar e a nota
   ainda legível —, o que dá 1580px de janela. Onde não cabem, o que sobraria é
   código picotado ao lado de nota espremida, pior que empilhado em qualquer
   tela. */
ok('em 1440px o bloco fica empilhado', await p.evaluate(() => {
  const n = document.querySelector('.exemplo-nota').getBoundingClientRect();
  const c = document.querySelector('.exemplo-cod').getBoundingClientRect();
  return n.bottom <= c.top + 2;                      // um em cima do outro
}));
ok('e a nota vem antes do trecho dela', await p.evaluate(() => {
  const g = document.querySelector('.exemplo-grade');
  return g.children[0].classList.contains('exemplo-nota');
}));

await p.setViewportSize({ width: 1920, height: 950 });
await p.waitForTimeout(250);

/* A FORMA DO GO BY EXAMPLE: a explicação à ESQUERDA, o programa à direita, e
   cada nota na altura do trecho que ela comenta. */
ok('em 1920px a nota fica à esquerda do código', await p.evaluate(() => {
  const n = document.querySelector('.exemplo-nota').getBoundingClientRect();
  const c = document.querySelector('.exemplo-cod').getBoundingClientRect();
  return n.right <= c.left + 2;
}));
ok('cada nota alinha com o trecho dela', await p.evaluate(() => {
  const notas = [...document.querySelectorAll('.exemplo-nota')];
  const cods = [...document.querySelectorAll('.exemplo-cod')];
  return notas.every((n, i) => Math.abs(n.getBoundingClientRect().top
    - cods[i].getBoundingClientRect().top) < 4);
}));

/* E a coluna da direita tem de parecer UM arquivo: os trechos se emendam sem
   folga. Foi por causa disso que as bordas entre eles saíram. */
ok('o código é contínuo, sem costura entre os trechos', await p.evaluate(() => {
  const cods = [...document.querySelectorAll('.exemplo-cod')];
  return cods.slice(1).every((c, i) =>
    Math.abs(c.getBoundingClientRect().top - cods[i].getBoundingClientRect().bottom) < 1);
}));

/* A LARGURA DA COLUNA DE CÓDIGO SAI DA MEDIDA DO CONTEÚDO: a linha mais longa
   dos exemplos tem 74 caracteres, que a .79rem da IBM Plex Mono dão 562px;
   com os 36px de recuo, 598. A coluna tem 604 — pouco mais, de propósito. */
const colunaCod = await p.evaluate(() => {
  const c = document.querySelector('.exemplo-cod');
  return { larg: Math.round(c.getBoundingClientRect().width),
    sobra: Math.round(c.getBoundingClientRect().width - c.scrollWidth) };
});
ok('a coluna de código cabe a linha mais longa, com folga',
  colunaCod.larg >= 598 && colunaCod.sobra >= 0,
  colunaCod.larg + 'px, ' + colunaCod.sobra + 'px de sobra');

await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(250);

/* O realce usa as três cores da marca. O teste procura pelo menos duas
   famílias diferentes num exemplo que tem palavra-chave e literal. */
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/0/let-const');
await p.waitForSelector('.exemplo-cod .t-pal');
const cores = await p.evaluate(() => {
  const cor = (s) => {
    const e = document.querySelector('.exemplo-cod ' + s);
    return e ? getComputedStyle(e).color : null;
  };
  return { pal: cor('.t-pal'), txt: cor('.t-txt') };
});
ok('o realce distingue palavra-chave de literal',
  cores.pal && cores.txt && cores.pal !== cores.txt, cores.pal + ' vs ' + cores.txt);

/* A regressão que o realce pode criar: marcação escapando errado. Uma tag
   dentro de um exemplo de HTML tem de continuar aparecendo como texto. */
await p.goto(BASE + PAGINA + '#/curso/html-css/aula/7/alinhamento');
await p.waitForSelector('.exemplo-cod');
ok('o código realçado continua escapado', await p.evaluate(() =>
  !document.querySelector('.exemplo-cod').innerHTML.includes('<script')));

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/7/alinhamento');
await p.waitForSelector('.exemplo');

/* Material: o link tem de baixar (e não navegar), com nome de arquivo. */
const mat = p.locator('.mat').first();
ok('material listado na seção', await mat.isVisible());
ok('o link baixa em vez de abrir', (await mat.getAttribute('download'))?.endsWith('.pdf'),
  await mat.getAttribute('download'));
ok('o PDF é mesmo um PDF', (await mat.getAttribute('href')).startsWith('data:application/pdf;base64,'));

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/7/eixos');
await p.waitForSelector('.fig');
ok('diagrama inline herda a cor do tema', await p.evaluate(() => {
  const t = document.querySelector('.fig-svg svg text');
  return getComputedStyle(t).fill !== 'rgb(0, 0, 0)';
}));

await p.goto(BASE + PAGINA + '#/curso/html-css/aula/3/imagens');
await p.waitForSelector('.fig img');
/* `scrollIntoViewIfNeeded` NÃO é firula do teste: a figura tem
   `loading="lazy"`, e imagem preguiçosa abaixo da dobra não é carregada até
   aparecer. Sem o rolar, `complete` é falso e o teste acusaria um defeito que
   não existe — foi o que aconteceu, e só no pacote de arquivo único, onde a
   altura da página difere o suficiente para tirar a figura da margem. */
await p.locator('.fig img').scrollIntoViewIfNeeded();
await p.waitForTimeout(200);
ok('figura de arquivo carregou', await p.evaluate(() => {
  const i = document.querySelector('.fig img');
  return i.complete && i.naturalWidth > 0;
}));
ok('figura tem legenda e alt', (await p.locator('.fig figcaption').count()) > 0
  && Boolean(await p.locator('.fig img').getAttribute('alt')));

console.log('\n== 14. prova do curso ==');
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos');
await p.waitForSelector('.prova-cartao');
ok('o curso anuncia a prova', await p.locator('.prova-cartao').isVisible());
ok('a prova aparece no trilho', (await p.locator('.trilho-prova').count()) === 1);

await p.click('.prova-cartao .btn');
await p.waitForSelector('.wizard-prova');
const nQ = await p.locator('.wz-ponto').count();
ok('dez questões sorteadas', nQ === 10, nQ + ' questões');
ok('a dica não aparece na prova', (await p.locator('.ex-dica').count()) === 0);
ok('não há "tentar de novo" na prova', (await p.locator('.ex-refazer').count()) === 0);

/* A REGRESSÃO QUE IMPORTA: numa prova o veredito fica represado. Se ele
   aparecesse, dava para tentar até acertar e a prova pararia de medir. */
const responderTudo = async (certo) => {
  for (let i = 0; i < nQ; i += 1) {
    await p.locator('.wz-ponto').nth(i).click();
    await p.waitForTimeout(90);
    // o id vem do DOM, não do texto: o enunciado é renderizado com marcação
    const id = await p.locator('.ex').getAttribute('data-ex');
    const ixs = await p.evaluate((exId) => {
      const ex = window.EXERCICIOS_EXEMPLO.find((e) => e.id === exId);
      if (!ex?.alternativas) return null;
      return ex.alternativas.map((a, k) => (a.correta ? k : -1)).filter((k) => k >= 0);
    }, id);
    if (!ixs) continue;                       // tipo que este laço não sabe responder
    const alvos = certo ? ixs : [ixs.includes(0) ? 1 : 0];
    for (const k of alvos) await p.locator(`.ex .alt[data-ix="${k}"]`).click();
    const bt = p.locator('.ex .ex-responder');
    if (await bt.count()) await bt.click();
    await p.waitForTimeout(130);
  }
};
await responderTudo(true);
ok('nenhum veredito de certo/errado antes de entregar',
  (await p.locator('.ex-veredito.v-certo, .ex-veredito.v-errado').count()) === 0);
ok('a resposta é registrada, e diz isso', (await p.locator('.v-registrado').count()) > 0);

await p.locator('.wz-ponto').nth(nQ - 1).click();
await p.locator('.wz-depois').click();               // entregar (ou pedir confirmação)
await p.waitForTimeout(200);
if (!(await p.locator('.wz-resultado').count())) await p.locator('.wz-depois').click();
await p.waitForSelector('.wz-resultado');
const nota = await p.locator('.prova-nota').innerText();
ok('a prova fecha com uma nota', /%/.test(nota), nota);
ok('o resultado é gravado', await p.evaluate(() =>
  Boolean(JSON.parse(localStorage.getItem('codeschool-portal')).provas['curso:web-fundamentos'])));

/* Percorre as questões uma a uma: o wizard mantém UMA no documento por vez,
   então contar no documento inteiro mediria só a que está na tela. */
await p.locator('.wz-voltar').click();
await p.waitForTimeout(150);
let abertos = 0;
for (let i = 0; i < nQ; i += 1) {
  await p.locator('.wz-ponto').nth(i).click();
  await p.waitForTimeout(80);
  abertos += await p.locator('.ex-veredito.v-certo, .ex-veredito.v-errado').count();
}
ok('depois de entregar, os vereditos abrem', abertos > 0, abertos + ' de ' + nQ);
ok('nenhuma resposta ficou represada', (await p.locator('.v-registrado').count()) === 0);
ok('depois de entregar, não dá para responder de novo',
  await p.evaluate(() => [...document.querySelectorAll('.ex input, .ex .ex-responder')].every((e) => e.disabled)));

console.log('\n== 15. prova da trilha e certificados ==');
await p.goto(BASE + PAGINA + '#/trilha');
await p.waitForSelector('.prova-cartao');
ok('a trilha anuncia a prova dela', await p.locator('.prova-cartao').isVisible());
await p.click('.prova-cartao .btn');
await p.waitForSelector('.wizard-prova');
const nT = await p.locator('.wz-ponto').count();
ok('quinze questões, de mais de um curso', nT === 15, nT + ' questões');

await p.goto(BASE + PAGINA + '#/certificados');
await p.waitForSelector('.cert');
ok('há exemplos de certificado', (await p.locator('.cert-exemplo').count()) === 2);
ok('o exemplo se declara exemplo', (await p.locator('.cert-selo').first().innerText()).length > 0);
ok('nenhum certificado emitido sem prova aprovada',
  (await p.locator('.cert:not(.cert-exemplo)').count()) === 0);

console.log('\n== 16. as tags // saíram ==');
for (const [rota, sel] of [['#/painel', '.retomar'], ['#/catalogo', '.tela-catalogo'], ['#/certificados', '.cert']]) {
  await p.goto(BASE + PAGINA + rota);
  await p.waitForSelector(sel);
  ok('sem a tag em ' + rota, (await p.locator('.tela-head .tag').count()) === 0);
}

console.log('\n== 17. as duas formas de seção ==');
/* A REGRESSÃO QUE ESTE BLOCO GUARDA: o quadro de vídeo já esteve em TODA seção
   de conteúdo, reservado. Uma seção de texto com um retângulo cinza em cima
   promete um vídeo que nunca vem — e a promessa não expira. */
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/0/papeis');
await p.waitForSelector('.aula-texto');
ok('seção de texto não tem quadro de vídeo', (await p.locator('.video-fachada').count()) === 0);
ok('e o texto começa no topo', await p.evaluate(() =>
  document.querySelector('.migalhas').getBoundingClientRect().top < 200));

await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/0/apresentacao');
await p.waitForSelector('.video-fachada');
ok('seção de vídeo tem o quadro', true);
ok('seção só de vídeo não inventa bloco de texto', (await p.locator('.aula-texto').count()) === 0);
ok('a duração aparece no player', (await p.locator('.video-duracao').innerText()).includes('min'));

/* O PLAYER ACOMPANHA A COLUNA DE LEITURA. Ele já foi de ponta a ponta da área
   inteira, e o efeito colateral era a aula ter alinhamentos diferentes conforme
   a seção — o olho procurando a margem esquerda a cada troca. */
const bleed = await p.evaluate(() => {
  const v = document.querySelector('.video-fachada').getBoundingClientRect();
  const t = document.querySelector('.aula-titulo').getBoundingClientRect();
  return { esq: Math.abs(v.left - t.left), larg: Math.round(v.width) };
});
ok('o player alinha com o texto da seção', bleed.esq < 2,
  bleed.larg + 'px, ' + bleed.esq.toFixed(1) + 'px de desalinho');

await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(250);
const sobra = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('o player não estoura a tela do celular', sobra <= 0, sobra + 'px de sobra');
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(250);

/* E o título fica ACIMA do vídeo, como nas seções de texto: "onde estou" vem
   antes de "o que eu assisto", e a resposta tem de ser a mesma nas duas. */
ok('o título fica acima do player', await p.evaluate(() => {
  const v = document.querySelector('.video-fachada').getBoundingClientRect();
  return document.querySelector('.aula-titulo').getBoundingClientRect().bottom <= v.top + 1;
}));
ok('o player cabe na tela', await p.evaluate(() =>
  document.querySelector('.video-fachada').getBoundingClientRect().height <= window.innerHeight * 0.8));

/* A AULA TEM UMA LARGURA SÓ, e ela vale para o título, a prosa, o player e o
   exemplo ao mesmo tempo. O corte é 1466px: abaixo dele a aula fica em 820 com
   o bloco de código empilhado; acima, os quatro crescem juntos até 1074.

   Duas tentativas anteriores soltaram um elemento de cada vez — primeiro o
   player, depois o exemplo — e as duas produziram margens diferentes dentro da
   mesma aula. Por isso o teste mede os quatro juntos, e não um contra o outro. */
for (const [larg, alt, esperado] of [
  [1280, 900, 818], [1440, 900, 820], [1466, 950, 934], [1580, 950, 1048],
  [1700, 950, 1074], [1920, 950, 1074],
]) {
  await p.setViewportSize({ width: larg, height: alt });
  await p.goto(BASE + PAGINA + '#/curso/javascript/aula/0/let-const');
  await p.waitForSelector('.exemplo');
  const um = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const cx = ['.aula-titulo', '.aula-texto p', '.video-fachada', '.exemplo'].map(r);
    const v = r('.video-fachada');
    return {
      larguras: cx.map((c) => Math.round(c.width)),
      esquerdas: [...new Set(cx.map((c) => Math.round(c.left)))],
      proporcao: v.width / v.height,
    };
  });
  const iguais = um.larguras.every((w) => Math.abs(w - esperado) <= 1);
  ok('a ' + larg + 'px título, prosa, player e exemplo têm a mesma largura',
    iguais && um.esquerdas.length === 1, JSON.stringify(um.larguras));
  ok('a ' + larg + 'px o player mantém a proporção 16/9',
    Math.abs(um.proporcao - 16 / 9) < 0.02, um.proporcao.toFixed(2));
}

/* Janela baixa: o teto de altura passou a encolher a LARGURA, porque cortar a
   altura de uma caixa com `aspect-ratio` não encolhe a caixa — achata, e o
   vídeo dentro dela estica. Aqui o player fica MENOR que o exemplo, e nunca
   deformado. */
await p.setViewportSize({ width: 1920, height: 700 });
await p.goto(BASE + PAGINA + '#/curso/javascript/aula/0/let-const');
await p.waitForSelector('.video-fachada');
const baixa = await p.evaluate(() => {
  const v = document.querySelector('.video-fachada').getBoundingClientRect();
  const t = document.querySelector('.aula-titulo').getBoundingClientRect();
  return {
    prop: v.width / v.height, larg: Math.round(v.width),
    alt: Math.round(v.height), esq: Math.abs(v.left - t.left),
  };
});
ok('em janela baixa o player encolhe sem deformar', Math.abs(baixa.prop - 16 / 9) < 0.02,
  baixa.larg + '×' + baixa.alt);
ok('e volta a começar onde o texto começa', baixa.esq < 2, baixa.esq.toFixed(1) + 'px de desalinho');
await p.setViewportSize({ width: 1440, height: 900 });
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos/aula/0/apresentacao');
await p.waitForSelector('.video-fachada');

/* No trilho o ícone diz a NATUREZA da seção, não só o estado. */
const icones = await p.evaluate(() => {
  const linhas = [...document.querySelectorAll('.trilho-secao')];
  return {
    comDuracao: linhas.filter((l) => l.querySelector('.ts-dur')).length,
    total: linhas.length,
  };
});
ok('o trilho mostra a duração das seções de vídeo', icones.comDuracao === 2,
  icones.comDuracao + ' de ' + icones.total);

/* Vídeo NÃO é sinônimo de abertura de aula. Se todas as seções de vídeo
   fossem a primeira da aula, a forma teria virado convenção sem que ninguém
   decidisse isso — e a segunda, a terceira e a quarta seção também podem ser
   a hora de assistir. */
const posicoes = await p.evaluate(() => {
  const fora = {};
  Object.values(window.AULAS).forEach((curso) => {
    Object.values(curso).forEach((secoes) => {
      secoes.forEach((s, i) => { if (s.video !== undefined) fora[i + 1] = (fora[i + 1] || 0) + 1; });
    });
  });
  return fora;
});
ok('há vídeo fora da primeira seção', Object.keys(posicoes).length >= 3,
  JSON.stringify(posicoes));

/* TODA SEÇÃO TEM UMA LARGURA SÓ, SEM EXCEÇÃO.

   A pergunta que este teste faz mudou. Antes era "quem passou do teto?", com
   uma lista de quem podia passar — e a lista crescia a cada elemento que ganhava
   o direito de escapar, enquanto o defeito real (margens diferentes dentro da
   mesma aula) passava. Agora a pergunta é a regra: TODOS os filhos da tela
   começam e terminam na mesma coluna, e ela é `--tela`.

   O teste percorre TODAS as seções escritas dos três cursos, uma a uma. É caro
   (uma navegação por seção) e é o único jeito de a regra valer para o conteúdo
   que existe, e não para a seção que eu lembrei de abrir. */
await p.setViewportSize({ width: 1920, height: 1000 });
await p.waitForTimeout(200);
const foraDoLimite = await p.evaluate(async () => {
  const fora = [];
  for (const curso of Object.keys(window.AULAS)) {
    const topicos = Object.keys(window.AULAS[curso]);
    for (let i = 0; i < topicos.length; i += 1) {
      for (const sec of window.AULAS[curso][topicos[i]]) {
        location.hash = `#/curso/${curso}/aula/${i}/${sec.id}`;
        await new Promise((r) => setTimeout(r, 50));
        const tela = document.querySelector('.tela-aula');
        if (!tela) continue;
        const alvo = tela.getBoundingClientRect();
        [...tela.children].forEach((f) => {
          if (f.classList.contains('lado-seta')) return;    // flutua, não é conteúdo
          const r = f.getBoundingClientRect();
          if (r.width === 0) return;                        // escondido nesta largura
          const nome = `${curso}/${sec.id}:${f.className.split(' ')[0]}`;
          if (Math.abs(r.left - alvo.left) > 1) {
            fora.push(nome + ' começa fora da coluna (' + Math.round(r.left - alvo.left) + 'px)');
          }
          /* o player é a única folga, e só para baixo: em janela baixa o teto de
             altura o encolhe, e encolher é o oposto de estourar */
          const podeEncolher = f.classList.contains('video-fachada');
          const sobra = alvo.right - r.right;
          if (sobra < -1 || (sobra > 1 && !podeEncolher)) {
            fora.push(nome + ' termina fora da coluna (' + Math.round(-sobra) + 'px)');
          }
        });
      }
    }
  }
  return fora;
});
ok('em toda seção o conteúdo tem uma coluna só', foraDoLimite.length === 0,
  foraDoLimite.slice(0, 3).join(' · ') || 'as 89 seções alinhadas');
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(200);

console.log('\n== 18. certificado, plano e conta ==');
await p.goto(BASE + PAGINA + '#/certificados');
await p.waitForSelector('.cert');
/* A regressão que este teste guarda: o certificado NÃO é uma janela de
   terminal. Ele nasceu reaproveitando o `.term-bar` da vitrine, e é o único
   artefato do portal que sai daqui — precisa parecer documento. */
ok('certificado não é janela de terminal', (await p.locator('.cert .term-bar').count()) === 0);
ok('tem a forma de documento',
  (await p.locator('.cert-folha').count()) > 0 && (await p.locator('.cert-aluno').count()) > 0);
ok('o nome do aluno é o maior elemento', await p.evaluate(() => {
  const px = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
  return px('.cert-aluno') > px('.cert-curso');
}));

/* O código de validação de um exemplo não pode parecer um código real. */
ok('o exemplo não inventa código', !/CS-/.test(await p.locator('.cert-exemplo .cert-codigo').first().innerText()));

/* O certificado abre em grande, com o fundo congelado — o mesmo modal da
   vitrine. Congelar é `overflow:hidden` no documento: prender só a roda
   deixava passar a barra de rolagem e as setas do teclado. */
await p.locator('.cert').first().click();
await p.waitForSelector('.modal-cert');
ok('o certificado abre em modal', await p.locator('.modal-cert .cert-folha').isVisible());
ok('e cresce na tela', await p.evaluate(() => {
  const dentro = document.querySelector('.modal-cert .cert-aluno').getBoundingClientRect().height;
  const fora = document.querySelector('.tela-certificados .cert-aluno').getBoundingClientRect().height;
  return dentro > fora;
}));
ok('o fundo congela', await p.evaluate(() =>
  getComputedStyle(document.documentElement).overflow === 'hidden'));

/* O botão do LinkedIn existe ao lado do fechar NOS DOIS CASOS — esconder faria
   parecer que a função não existe. No exemplo ele vem desabilitado e sem
   `href`: visível, e incapaz de publicar uma credencial que ninguém tirou. */
ok('o exemplo mostra o botão do LinkedIn', (await p.locator('.modal-acoes .cert-in').count()) === 1);
ok('mas ele não leva a lugar nenhum', await p.evaluate(() => {
  const b = document.querySelector('.modal-acoes .cert-in');
  return b.tagName !== 'A' && b.getAttribute('aria-disabled') === 'true';
}));
ok('o botão fica à esquerda do fechar', await p.evaluate(() => {
  const b = document.querySelector('.modal-acoes .cert-in').getBoundingClientRect();
  return b.right <= document.querySelector('.modal-fechar').getBoundingClientRect().left + 1;
}));
/* Só o ícone: o rótulo saiu da tela e ficou no `aria-label`, que é o que o
   leitor de tela anuncia. Botão de ícone sem nome acessível é um botão mudo. */
ok('o botão é só o ícone, com nome acessível', await p.evaluate(() => {
  const b = document.querySelector('.modal-acoes .cert-in');
  return b.textContent.trim() === '' && (b.getAttribute('aria-label') || '').length > 5;
}));
await p.keyboard.press('Escape');
await p.waitForTimeout(200);
ok('Esc fecha o certificado', (await p.locator('.modal-cert').count()) === 0);
ok('e o fundo volta a rolar', await p.evaluate(() =>
  getComputedStyle(document.documentElement).overflow !== 'hidden'));

/* No celular o certificado extrapolava nos DOIS eixos. A culpa não era dele: o
   `.modal` é grade com faixa `auto`, e ali `width:min(1040px,100%)` resolve
   contra o `max-content` do próprio filho — a conta se morde e não limita nada.
   A faixa virou `minmax(0,1fr)`; o teste mede a folha, não a regra. */
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(120);
await p.locator('.cert').first().click();
await p.waitForSelector('.modal-cert');
const certCel = await p.evaluate(() => {
  const f = document.querySelector('.modal-cert .cert-folha').getBoundingClientRect();
  return {
    larg: Math.round(f.width), esq: Math.round(f.left),
    passa: Math.round(f.right - window.innerWidth),
    embaixo: Math.round(f.bottom - document.documentElement.clientHeight),
    rolaH: document.documentElement.scrollWidth - window.innerWidth,
  };
});
ok('a 390px o certificado cabe na largura', certCel.passa <= 0 && certCel.esq >= 0,
  certCel.larg + 'px começando em ' + certCel.esq);
ok('e cabe na altura', certCel.embaixo <= 0, certCel.embaixo + 'px de sobra por baixo');
ok('e a página não rola na horizontal', certCel.rolaH <= 1, certCel.rolaH + 'px');
await p.keyboard.press('Escape');
await p.waitForTimeout(160);
await p.setViewportSize({ width: 1440, height: 900 });
await p.waitForTimeout(120);

/* Agora um certificado DE VERDADE: curso concluído e prova aprovada. É a
   única forma de ver os botões do LinkedIn, e é a que importa conferir —
   uma URL de compartilhamento malformada só aparece no site do LinkedIn. */
await p.evaluate(() => {
  const e = JSON.parse(localStorage.getItem('codeschool-portal'));
  e.provas = { ...(e.provas || {}), 'curso:git': { tentativas: 1, melhor: 90, aprovado: true } };
  e.progresso = e.progresso || {};
  e.progresso.git = { aulas: {} };
  // marca todas as seções contáveis de git como feitas
  CURSOS.find((c) => c.id === 'git').topicos.forEach((_, ix) => {
    e.progresso.git.aulas[ix] = { secoes: { conteudo: true, avaliacao: true }, exercicios: {} };
  });
  localStorage.setItem('codeschool-portal', JSON.stringify(e));
});
/* `reload`, e não só navegar: `estado.js` lê o localStorage UMA vez, no carregamento
   do módulo. Escrever por fora e trocar de rota não faria o portal reler nada. */
await p.goto(BASE + PAGINA + '#/certificados', { waitUntil: 'networkidle' });
await p.reload({ waitUntil: 'networkidle' });
await p.waitForSelector('.cert:not(.cert-exemplo)');
ok('certificado emitido com curso concluído e prova aprovada', true);

await p.locator('.cert:not(.cert-exemplo)').first().click();
await p.waitForSelector('.modal-cert');
const perfil = await p.locator('.modal-acoes .cert-in').first().getAttribute('href');
ok('há botão de adicionar ao perfil do LinkedIn',
  perfil.startsWith('https://www.linkedin.com/profile/add?'));
/* Os campos que o LinkedIn exige para preencher o formulário sozinho. Faltar
   um deles não dá erro: abre o formulário em branco, e ninguém preenche. */
const campos = ['startTask=CERTIFICATION_NAME', 'name=', 'organizationName=', 'issueYear=', 'issueMonth=', 'certId=', 'certUrl='];
ok('a URL leva todos os campos do certificado', campos.every((c) => perfil.includes(c)),
  campos.filter((c) => !perfil.includes(c)).join(', ') || 'todos');
ok('o código na URL é o mesmo que está impresso', await p.evaluate(() => {
  const cod = document.querySelector('.modal-cert .cert-codigo').textContent.trim();
  const href = document.querySelector('.modal-acoes .cert-in').href;
  return href.includes(encodeURIComponent(cod));
}));
await p.keyboard.press('Escape');
await p.waitForTimeout(150);

await p.goto(BASE + PAGINA + '#/plano');
await p.waitForSelector('.pl-tabela');
const linhas = await p.locator('.pl-tabela tbody tr').count();
ok('a tabela compara todos os recursos', linhas >= 10, linhas + ' linhas');
ok('a coluna do plano assinado é destacada', (await p.locator('.pl-tabela th.on').count()) === 1);
const antes = await p.locator('.pl-atual-topo h2').innerText();
await p.locator('.pl-trocar').first().click();
await p.waitForTimeout(300);
const depois = await p.locator('.pl-atual-topo h2').innerText();
ok('o upgrade troca o plano', depois !== antes, antes + ' → ' + depois);
ok('o plano sobrevive ao reload', await p.evaluate(() =>
  Boolean(JSON.parse(localStorage.getItem('codeschool-portal')).conta?.planoId)));

await p.goto(BASE + PAGINA + '#/conta');
await p.waitForSelector('#f-email');
await p.fill('#c-email', 'nao-e-email');
await p.click('#f-email button[type=submit]');
await p.waitForTimeout(150);
ok('e-mail implausível é recusado', (await p.locator('#a-email').getAttribute('class')).includes('ruim'));
await p.fill('#c-email', 'aluno@codeschool.ing');
await p.click('#f-email button[type=submit]');
await p.waitForTimeout(150);
ok('e-mail plausível é aceito', (await p.locator('#a-email').getAttribute('class')).includes('bom'));

/* A senha nova NÃO pode ser guardada em lugar nenhum: não há autenticação, e
   gravá-la daria a impressão contrária. O teste procura a string no
   armazenamento inteiro. */
await p.fill('#c-senha-atual', 'antiga123');
await p.fill('#c-senha-nova', 'correta-cavalo-bateria-grampo');
await p.fill('#c-senha-rep', 'outra-coisa');
await p.click('#f-senha button[type=submit]');
await p.waitForTimeout(150);
ok('senhas que não conferem são recusadas', (await p.locator('#a-senha').getAttribute('class')).includes('ruim'));
await p.fill('#c-senha-rep', 'correta-cavalo-bateria-grampo');
await p.click('#f-senha button[type=submit]');
await p.waitForTimeout(150);
ok('senha trocada', (await p.locator('#a-senha').getAttribute('class')).includes('bom'));
ok('a senha não foi guardada em lugar nenhum',
  !(await p.evaluate(() => JSON.stringify(localStorage).includes('correta-cavalo'))));

console.log('\n== 19. o catálogo cabe na tela ==');
await p.goto(BASE + PAGINA + '#/catalogo');
await p.waitForSelector('.chips');
/* São nove categorias e elas não cabem numa linha. Sem as setas, as últimas
   ficavam cortadas na borda sem nada dizendo que havia mais. */
const chips = await p.evaluate(() => {
  const c = document.querySelector('.chips');
  return { sobra: c.scrollWidth - c.clientWidth, setas: document.querySelectorAll('.abas-seta').length };
});
ok('há setas para rolar as categorias', chips.setas === 2, chips.setas + ' setas');
ok('a fileira realmente transborda', chips.sobra > 0, chips.sobra + 'px escondidos');
ok('a de voltar começa desabilitada', await p.locator('[data-rolar="-1"]').isDisabled());
ok('a de avançar começa ativa', !(await p.locator('[data-rolar="1"]').isDisabled()));
ok('o esmaecido avisa que há mais à direita',
  (await p.locator('.chips').getAttribute('class')).includes('fade-dir'));

await p.click('[data-rolar="1"]');
await p.waitForTimeout(600);
ok('a seta rola a fileira', await p.evaluate(() => document.querySelector('.chips').scrollLeft > 40));
ok('e a de voltar habilita', !(await p.locator('[data-rolar="-1"]').isDisabled()));
/* A página inteira nunca rola na horizontal — quem rola é a fileira. */
ok('a página não ganhou rolagem horizontal', await p.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1));

console.log('\n== 20. a aula cabe entre as setas ==');
/* A aula alarga para o código não virar barra de rolagem, e as setas de
   navegação moram no vão que sobra. Os dois disputam o mesmo espaço: o teto da
   aula é `100vw - trilho - 152`, que é exatamente o que deixa 16px entre a seta
   de 44px e o conteúdo. A varredura confere a conta em oito larguras, incluindo
   as duas bordas do corte (1466) e a largura em que a aula para de crescer. */
for (const larg of [1280, 1440, 1466, 1500, 1606, 1700, 1920, 2400]) {
  await p.setViewportSize({ width: larg, height: 950 });
  await p.goto(BASE + PAGINA + '#/curso/javascript/aula/0/arrow', { waitUntil: 'networkidle' });
  await p.waitForSelector('.exemplo');
  const m = await p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e && e.getBoundingClientRect(); };
    const ex = r('.exemplo'); const esq = r('.lado-esq'); const dir = r('.lado-dir');
    const cod = document.querySelector('.exemplo-cod');
    /* abaixo de 1400px as setas voltam para o rodapé: elas continuam no DOM,
       mas não disputam mais o vão, e medir distância até elas não diz nada */
    const noVao = !!esq && getComputedStyle(document.querySelector('.lado-esq')).position === 'fixed';
    return {
      larg: Math.round(ex.width),
      noVao,
      folga: noVao ? Math.min(ex.left - esq.right, dir.left - ex.right) : null,
      rola: cod.scrollWidth > cod.clientWidth + 1,
      pagina: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  if (m.noVao) {
    ok('a ' + larg + 'px o exemplo não encosta na seta', m.folga >= 8,
      m.larg + 'px de largura, ' + Math.round(m.folga) + 'px de folga');
  } else {
    ok('a ' + larg + 'px as setas estão no rodapé, sem disputar o vão', true,
      m.larg + 'px de largura');
  }
  ok('a ' + larg + 'px o código não vira barra de rolagem', !m.rola);
  ok('a ' + larg + 'px a página não rola na horizontal', m.pagina <= 1, m.pagina + 'px');
}
await p.setViewportSize({ width: 1440, height: 900 });

console.log('\n== 21. o menu da conta leva ao plano ==');
await p.goto(BASE + PAGINA + '#/painel');
await p.waitForSelector('.retomar');
await p.click('.conta-btn');
await p.waitForTimeout(120);
ok('há um item "Meu plano"', (await p.locator('.conta-op[href="#/plano"]').count()) === 1);

console.log('\n== 22. o navegador sabe que a página é escura ==');
/* O portal é escuro porque o CSS pinta tudo de escuro — e nada disso conta
   para o navegador, que desenha o que é DELE com o tema do sistema. Foi assim
   que uma barra de rolagem cinza-claro apareceu no meio da tela escura, no
   Chromium, sem aparecer no Firefox. `color-scheme` é a declaração que
   faltava; `scrollbar-color` é o remendo por contêiner que a vitrine já usava
   e que o trilho tinha ficado sem. */
await p.goto(BASE + PAGINA + '#/curso/web-fundamentos');
await p.waitForSelector('.trilho-aula');
const esquema = await p.evaluate(() => {
  const cor = (s) => getComputedStyle(document.querySelector(s)).scrollbarColor;
  return {
    raiz: getComputedStyle(document.documentElement).colorScheme,
    trilho: cor('#trilho'),
    rola: (() => { const t = document.querySelector('#trilho'); return t.scrollHeight > t.clientHeight; })(),
  };
});
ok('a raiz declara o esquema escuro', esquema.raiz === 'dark', esquema.raiz);
ok('o trilho realmente rola', esquema.rola);
ok('e a barra dele tem cor declarada', esquema.trilho !== 'auto', esquema.trilho);

/* Nenhum contêiner rolável pode ficar com a cor do sistema. O teste varre
   todos, em vez de conferir uma lista escrita à mão que envelhece. */
const semCor = await p.evaluate(() => {
  const fora = [];
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    const rolaY = el.scrollHeight > el.clientHeight && /auto|scroll/.test(cs.overflowY);
    const rolaX = el.scrollWidth > el.clientWidth && /auto|scroll/.test(cs.overflowX);
    if (!rolaY && !rolaX) return;
    if (cs.scrollbarWidth === 'none') return;          // barra escondida de propósito
    if (cs.scrollbarColor === 'auto') fora.push(el.className || el.tagName);
  });
  return fora;
});
ok('nenhum rolável usa a cor do sistema', semCor.length === 0, semCor.join(', ') || 'nenhum');

/* E no tema claro o esquema acompanha: declarar `dark` fixo deixaria os
   controles do navegador escuros numa página branca — o mesmo defeito, do
   outro lado. */
await p.click('#tema-btn');
await p.waitForTimeout(250);
ok('no tema claro o esquema vira claro',
  (await p.evaluate(() => getComputedStyle(document.documentElement).colorScheme)) === 'light');
await p.click('#tema-btn');
await p.waitForTimeout(250);

console.log('\n== 23. tema claro e estreito ==');
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
console.log('\n== 24. nada revelado antes de responder ==');
ok('refazer escondido', (await p2.locator('.ex-refazer:visible').count()) === 0);
ok('justificativas escondidas', (await p2.locator('.alt-porque:visible').count()) === 0);
ok('vereditos vazios', (await p2.locator('.ex-veredito:visible').count()) === 0);
await b2.close();

console.log(falhas ? `\n${falhas} FALHA(S)` : '\ntudo passou');
process.exit(falhas ? 1 : 0);
