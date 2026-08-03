/* ==========================================================================
   Portal do Aluno — arranque.

   ORDEM DE CARGA, e ela importa: `dados.js`, os dicionários e
   `i18n-runtime.js` são scripts CLÁSSICOS, carregados antes deste módulo pelo
   index.html. Funções declaradas lá (`txt`, `aplicarIdioma`, `guardarBase`…)
   ficam no escopo global e são visíveis aqui; o caminho inverso não é
   automático, então o que o runtime precisa de nós é publicado à mão logo
   abaixo. É o preço de reaproveitar o i18n da vitrine sem tocar nele — e é
   barato perto de reescrever cinco idiomas.
   ========================================================================== */

import { rota, quandoTrocar, iniciar, caminhoAtual, despachar, irPara } from './rotas.js';
import { ehEscolha } from './catalogo.js';
import { assinar, agora } from './estado.js';
import { montarTrilho, alternarAula } from './trilho.js';
import { trilhaDoAluno, progressoDaTrilha, TRILHAS_POR_FAMILIA } from './telas/comum.js';
import * as api from './api.js';
import { esc } from './texto.js';

import entrar from './telas/entrar.js';
import painel from './telas/painel.js';
import telaTrilha from './telas/trilha.js';
import curso from './telas/curso.js';
import aula from './telas/aula.js';
import catalogo from './telas/catalogo.js';
import certificados from './telas/certificados.js';
import conta from './telas/conta.js';
import planoTela from './telas/plano.js';
import desempenho from './telas/desempenho.js';
import refazer from './telas/refazer.js';
import notas from './telas/notas.js';
import { provaCurso, provaTrilha } from './telas/prova.js';
import { abrirBusca, fechar as fecharBusca, buscaAberta } from './painel-busca.js';

/* ---------- o que o i18n-runtime precisa de nós ---------- */
globalThis.ehEscolha = ehEscolha;                 // usado por aplicarConteudo()
/* Troca de idioma remonta a tela. O guarda existe porque `aplicarIdioma()` é
   chamado uma vez no arranque, ANTES de o roteador começar: sem ele, a tela
   inicial seria montada duas vezes — uma pelo idioma, outra pelo `iniciar()`. */
let comecou = false;
globalThis.redesenharTudo = () => (comecou ? despachar() : null);

/* ---------- rotas ---------- */
rota('/entrar', entrar);
rota('/painel', painel);
rota('/trilha', telaTrilha);
rota('/curso/:id', curso);
/* Duas rotas para a mesma tela: sem a seção, cai na primeira. É o que faz um
   link antigo (ou o botão do curso) continuar funcionando depois de a aula ter
   virado várias seções. */
rota('/curso/:id/prova', provaCurso);
rota('/trilha/prova', provaTrilha);
rota('/curso/:id/aula/:ix', aula);
rota('/curso/:id/aula/:ix/:sec', aula);
rota('/catalogo', catalogo);
rota('/certificados', certificados);
rota('/conta', conta);
rota('/plano', planoTela);
rota('/desempenho', desempenho);
rota('/refazer', refazer);
rota('/notas', notas);

const $ = (s) => document.querySelector(s);
const conteudo = $('#conteudo');
const trilho = $('#trilho');

let saindo = null;

quandoTrocar(async (caminho, achado) => {
  // sem sessão, só a tela de entrar existe — o resto do portal pressupõe aluno
  if (!agora().sessao && caminho !== '/entrar') return irPara('/entrar');
  if (agora().sessao && caminho === '/entrar') return irPara('/painel');

  if (saindo) { saindo(); saindo = null; }

  if (!achado) {
    conteudo.innerHTML = '<div class="tela"><p class="vazio">' + txt('página não encontrada') + '</p></div>';
    return;
  }

  const { titulo, el, depois, aoSair } = await achado.r.carregar(achado.params);
  conteudo.textContent = '';
  conteudo.appendChild(el);
  conteudo.scrollTop = 0;
  document.title = titulo + ' · codeschool.ing';
  if (depois) depois();
  saindo = aoSair || null;

  const logado = Boolean(agora().sessao);
  document.body.classList.toggle('sem-trilho', !logado);
  if (logado) montarTrilho(trilho, caminho, achado.params);
  else trilho.innerHTML = '';
  fecharTrilho();
  pintarContexto();
});

/* ---------- contexto na barra ----------
   Mostra a trilha e o quanto dela já foi feito. Lê do mesmo cálculo que o
   painel usa, porque duas contas do mesmo número divergem no dia em que uma
   delas muda. */
function pintarContexto() {
  const cx = $('#nav-contexto');
  const t = agora().sessao ? trilhaDoAluno() : null;
  if (!t) { cx.innerHTML = ''; return; }
  const p = progressoDaTrilha(t);

  /* A trilha na barra é um SELETOR, não um rótulo. Trocar de trilha era sair e
     entrar de novo — o que é absurdo para uma escolha que o aluno pode querer
     rever a qualquer momento, e que não custa nada, porque o progresso é por
     curso e curso compartilhado continua contando. */
  cx.innerHTML =
    '<div class="ctx-caixa">' +
      '<button type="button" class="ctx" aria-haspopup="true" aria-expanded="false">' +
        '<span class="ctx-nome">' + esc(t.nome) + '</span>' +
        '<span class="ctx-barra"><span style="width:' + p.pct + '%"></span></span>' +
        '<span class="ctx-pct">' + p.pct + '%</span>' +
        '<span class="ctx-seta" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="ctx-menu" role="menu">' +
        '<a class="ctx-op ctx-mapa" href="#/trilha">' + txt('ver o mapa da trilha') + ' →</a>' +
        TRILHAS_POR_FAMILIA().map(([familia, lista]) =>
          '<span class="ctx-grupo">' + txt('trilhas por ' + familia) + '</span>' +
          lista.map((x) => '<button type="button" class="ctx-op' + (x.id === t.id ? ' on' : '') + '" ' +
            'data-trilha="' + esc(x.id) + '">' + esc(x.nome) + '</button>').join('')).join('') +
      '</div>' +
    '</div>';
}

$('#nav-contexto').addEventListener('click', async (e) => {
  const caixa = $('#nav-contexto .ctx-caixa');
  if (e.target.closest('.ctx')) {
    const abriu = caixa.classList.toggle('aberto');
    caixa.querySelector('.ctx').setAttribute('aria-expanded', String(abriu));
    return;
  }
  const op = e.target.closest('.ctx-op[data-trilha]');
  if (!op) return;
  caixa.classList.remove('aberto');
  await api.matricular(op.dataset.trilha);
  irPara('/trilha');
});

/* ---------- menu da conta ---------- */
function pintarConta() {
  const s = agora().sessao;
  $('#conta-avatar').textContent = (s?.nome || '·').trim().charAt(0).toUpperCase() || '·';
  $('#conta-menu').innerHTML = s
    ? '<a class="conta-op" href="#/conta">' + txt('Minha conta') + '</a>' +
      '<a class="conta-op" href="#/plano">' + txt('Meu plano') + '</a>' +
      '<a class="conta-op" href="#/certificados">' + txt('Certificados') + '</a>' +
      '<a class="conta-op" href="https://codeschool.ing">' + txt('Ir para o site') + ' ↗</a>'
    : '<a class="conta-op" href="#/entrar">' + txt('Entrar') + '</a>';
}

$('#conta').addEventListener('click', (e) => {
  if (e.target.closest('.conta-btn')) {
    const c = $('#conta');
    const abriu = c.classList.toggle('aberto');
    c.querySelector('.conta-btn').setAttribute('aria-expanded', String(abriu));
  } else if (e.target.closest('.conta-op')) {
    $('#conta').classList.remove('aberto');
  }
});

/* ---------- idioma: o seletor da vitrine, sem alteração ---------- */
$('#idioma').addEventListener('click', (e) => {
  if (!e.target.closest('.idioma-btn')) return;
  const c = $('#idioma');
  const abriu = c.classList.toggle('aberto');
  c.querySelector('.idioma-btn').setAttribute('aria-expanded', String(abriu));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#idioma')) $('#idioma').classList.remove('aberto');
  if (!e.target.closest('#conta')) $('#conta').classList.remove('aberto');
  if (!e.target.closest('#nav-contexto')) $('#nav-contexto .ctx-caixa')?.classList.remove('aberto');
});

/* ---------- tema: mesma chave de localStorage da vitrine, de propósito ----
   quem ajusta o tema no site encontra o portal já no tema escolhido */
const CHAVE_TEMA = 'codeschool-tema';
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema === 'claro' ? 'claro' : '';
  try { localStorage.setItem(CHAVE_TEMA, tema); } catch (e) { /* modo privado */ }
  $('#tema-btn').setAttribute('aria-label', tema === 'claro' ? 'Mudar para tema escuro' : 'Mudar para tema claro');
}
$('#tema-btn').addEventListener('click', () => {
  aplicarTema(document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro');
});

/* ---------- trilho como gaveta, em tela estreita ---------- */
const fecharTrilho = () => {
  document.body.classList.remove('trilho-aberto');
  $('#trilho-btn').setAttribute('aria-expanded', 'false');
  $('#trilho-veu').hidden = true;
};
$('#trilho-btn').addEventListener('click', () => {
  const abriu = document.body.classList.toggle('trilho-aberto');
  $('#trilho-btn').setAttribute('aria-expanded', String(abriu));
  $('#trilho-veu').hidden = !abriu;
});
$('#trilho-veu').addEventListener('click', fecharTrilho);
$('#trilho').addEventListener('click', (e) => {
  const abrir = e.target.closest('.ta-abrir');
  if (abrir) {
    // é um <button>, não navega: só mostra ou esconde as seções daquela aula
    alternarAula(paramsDaRota()?.id, Number(abrir.dataset.aula));
    montarTrilho(trilho, caminhoAtual(), paramsDaRota());
    return;
  }
  if (e.target.closest('a')) fecharTrilho();
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (buscaAberta()) fecharBusca();
  else fecharTrilho();
});

/* A busca. O botão e o ⌘K existiam desde o primeiro dia e os dois só levavam
   ao catálogo — um atalho que prometia busca e entregava navegação. */
$('#busca-btn').addEventListener('click', abrirBusca);
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirBusca(); }
  // a barra também abre, como em quase todo lugar que tem busca — menos quando
  // se está digitando num campo, onde "/" é só uma barra
  else if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) {
    e.preventDefault(); abrirBusca();
  }
});

/* ---------- o estado mudou: a moldura acompanha ----------
   Trilho e barra leem progresso, então marcar uma aula tem de repintá-los —
   senão a barra do topo discorda da tela, que é o tipo de divergência que
   corrói a confiança no número. */
assinar(() => {
  const achado = { params: null };
  void achado;
  if (agora().sessao) montarTrilho(trilho, caminhoAtual(), paramsDaRota());
  pintarContexto();
  pintarConta();
});

function paramsDaRota() {
  const m = caminhoAtual().match(/^\/curso\/([^/]+)/);
  return m ? { id: decodeURIComponent(m[1]) } : null;
}

/* ---------- i18n: a sequência da vitrine, na mesma ordem ---------- */
guardarBase();      // guarda o português de CURSOS/TRILHAS/DEPOIMENTOS
mapearTextos();     // passeia pelos nós de texto do esqueleto estático
aplicarIdioma();    // aplica conteúdo + textos + seletor, e remonta a tela

pintarConta();
comecou = true;
iniciar();
