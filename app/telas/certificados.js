/* ==========================================================================
   Certificados.

   DUAS UNIDADES AGORA, E NÃO UMA. Antes só existia certificado de CURSO,
   porque curso era a única unidade que o portal media. Com a prova da trilha
   existe a segunda: quem termina os cursos do caminho e passa na prova final
   da trilha leva um certificado da trilha inteira.

   Isso responde em parte — e só em parte — a pergunta que o README da vitrine
   deixou em aberto sobre a "unidade intermediária". A trilha é a unidade
   GRANDE; a pergunta de verdade é se existe algo entre um curso de 40h e uma
   trilha de 400h. Continua em aberto, e continua barata enquanto nenhum
   certificado tiver sido emitido para aluno real.

   O CERTIFICADO PASSOU A EXIGIR A PROVA. Concluir todas as seções diz que a
   pessoa PERCORREU o material — e como avançar é concluir, percorrer é quase
   automático. Um certificado que sai de percorrer não afirma nada sobre quem
   o recebe. A prova é o que faz o documento significar alguma coisa; sem ela
   não valia a pena emitir.

   OS EXEMPLOS EXISTEM PARA MOSTRAR O QUE VEM. Eles são marcados como exemplo
   na marcação, no texto e na aparência — um certificado falso parecido com um
   verdadeiro é um problema, não uma prévia. Somem assim que o aluno tem o
   certificado de verdade daquele tipo.
   ========================================================================== */

import {
  trackPath as caminhoDaTrilha,
  courseById as cursoPorId,
} from '../catalog.js';
import { courseDone as cursoConcluido, activeOption as opcaoAtiva, examPassed as provaAprovada, examResult as resultadoProva, now as agora } from '../state.js';
import { studentTrack as trilhaDoAluno } from '../screens/common.js';
import { openModal as abrirModal } from '../modal.js';
import { esc } from '../text.js';

const DATA = (d) => new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(d);

/* Um código com cara de código. Determinístico, para não mudar a cada visita —
   um número de validação que muda sozinho é pior que nenhum. FUTURO: quem
   emite é o servidor, e aí ele passa a ser verificável de verdade. */
function codigo(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i += 1) h = (h * 33 + semente.charCodeAt(i)) >>> 0;
  const bloco = (n) => (n >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
  return 'CS-' + bloco(h) + '-' + bloco(h >>> 7) + '-' + bloco(h >>> 13);
}

/* O CERTIFICADO NÃO É MAIS UMA JANELA DE TERMINAL.

   Ele nasceu reaproveitando o `.term-bar` da vitrine — os três pontinhos e o
   nome do arquivo —, que é a moldura certa para painel de código e a errada
   para isto. Um certificado é o único artefato do portal que sai daqui: vai
   para um perfil, um anexo de e-mail, uma vaga. Ele precisa parecer um
   documento, e nenhum documento tem barra de janela em cima.

   A forma agora é a de um diploma: o emissor no alto, "certifica que", o nome
   de quem recebe em corpo grande, o que foi concluído, e um rodapé com data e
   código. A identidade continua sendo a da escola — a mesma tipografia, o
   mesmo fósforo, o LED da marca —, mas aplicada a um documento em vez de a uma
   janela.

   `exemplo` muda três coisas ao mesmo tempo — a moldura, o selo e o texto do
   código —, e é de propósito: quem olha rápido, quem lê o rótulo e quem for
   conferir o número recebem a mesma informação. */
function cartao({ rotulo, nome, meta, quem, quando, chave, exemplo, nota }) {
  /* O certificado inteiro é um botão. Não há um "ver maior" ao lado: o alvo
     que a pessoa quer clicar é o documento, e um controle menor ao lado dele
     seria um alvo pior para a mesma intenção. */
  return '<article class="cert' + (exemplo ? ' cert-exemplo' : '') + '" ' +
      'tabindex="0" role="button" data-cert="' + esc(chave) + '" ' +
      'aria-label="' + txt('Ver o certificado em tamanho grande') + '">' +
    '<div class="cert-folha">' +
      '<header class="cert-topo">' +
        '<span class="cert-marca"><span class="cert-led" aria-hidden="true"></span>codeschool<b>.ing</b></span>' +
        (exemplo
          ? '<span class="cert-selo">' + txt('exemplo') + '</span>'
          : '<span class="cert-tipo">' + txt(rotulo) + '</span>') +
      '</header>' +

      '<div class="cert-miolo">' +
        '<span class="cert-frase">' + txt('certifica que') + '</span>' +
        '<p class="cert-aluno">' + esc(quem) + '</p>' +
        '<span class="cert-frase">' +
          txt(rotulo === 'trilha concluída' ? 'concluiu a trilha' : 'concluiu o curso') + '</span>' +
        '<h2 class="cert-curso">' + esc(nome) + '</h2>' +
        '<p class="cert-meta">' + esc(meta) + (nota ? ' · ' + esc(nota) : '') + '</p>' +
      '</div>' +

      '<footer class="cert-pe">' +
        '<span>' + esc(quando) + '</span>' +
        '<span class="cert-codigo">' +
          (exemplo ? txt('exemplo — nenhum código foi emitido') : codigo(chave + quem)) +
        '</span>' +
      '</footer>' +
    '</div>' +
  '</article>';
}

/* ---------- compartilhar no LinkedIn ----------

   Dois endpoints, e eles fazem coisas diferentes:

     share-offsite  publica um POST com o link do certificado
     profile/add    abre o formulário de "licenças e certificados" do perfil
                    JÁ PREENCHIDO — nome, instituição, data e código

   O segundo é o que a pessoa realmente quer: certificado no perfil é uma
   credencial, não um post que some do feed em dois dias.

   O `certUrl` aponta para uma página de validação que AINDA NÃO EXISTE — ela
   nasce com o servidor, na Etapa 2. A URL é montada no formato definitivo de
   propósito: é a forma que precisa estar certa agora, porque o dia em que o
   servidor existir não pode ser o dia de descobrir que o formato era outro. E
   o botão diz isso, em vez de fingir. */
const LINKEDIN = 'https://www.linkedin.com';
const urlDeValidacao = (cod) => 'https://codeschool.ing/certificado/' + encodeURIComponent(cod);

function botoesLinkedIn({ nome, cod, quando }) {
  const d = new Date(quando);
  const q = (o) => Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');

  const perfil = LINKEDIN + '/profile/add?' + q({
    startTask: 'CERTIFICATION_NAME',
    name: nome,
    organizationName: 'codeschool.ing',
    issueYear: d.getFullYear(),
    issueMonth: d.getMonth() + 1,
    certId: cod,
    certUrl: urlDeValidacao(cod),
  });
  const post = LINKEDIN + '/sharing/share-offsite/?' + q({ url: urlDeValidacao(cod) });

  /* Só o ícone. A marca do LinkedIn é reconhecida sem legenda, e o rótulo
     ocupava metade da faixa de ações para dizer o que o desenho já diz. O
     texto continua existindo para quem não vê o ícone — no `aria-label` e no
     `title`, que é o que o leitor de tela anuncia e o que o cursor mostra. */
  return '<a class="cert-in" href="' + esc(perfil) + '" target="_blank" rel="noopener" ' +
      'title="' + txt('Adicionar ao perfil do LinkedIn') + '" ' +
      'aria-label="' + txt('Adicionar ao perfil do LinkedIn') + '">' + ICO_LINKEDIN + '</a>' +
    '<a class="btn btn-ghost cert-share" href="' + esc(post) + '" target="_blank" rel="noopener">' +
      txt('Compartilhar') + '</a>';
}

const ICO_LINKEDIN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21H9z"/></svg>';

export default async function certificados() {
  const el = document.createElement('div');
  el.className = 'tela tela-certificados';

  const quem = agora().sessao?.nome || 'Aluno';
  const hoje = DATA(new Date());
  const t = trilhaDoAluno();
  const doCaminho = t ? caminhoDaTrilha(t, opcaoAtiva) : [];

  /* Curso concluído E prova passada. As duas condições, e nesta ordem, porque
     é assim que a tela explica o que falta quando falta. */
  const feitos = CURSOS.filter((c) => cursoConcluido(c.id) && provaAprovada('curso:' + c.id));
  const quaseFeitos = CURSOS.filter((c) => cursoConcluido(c.id) && !provaAprovada('curso:' + c.id));

  const trilhaPronta = Boolean(t)
    && doCaminho.length > 0
    && doCaminho.every((id) => cursoConcluido(id))
    && provaAprovada('trilha:' + t.id);

  const emitidos =
    (trilhaPronta
      ? cartao({
        rotulo: 'trilha concluída',
        nome: t.nome,
        meta: doCaminho.length + ' ' + txt('cursos') + ' · ' +
          doCaminho.reduce((s, id) => s + (cursoPorId(id)?.horas || 0), 0) + 'h',
        quem,
        quando: hoje,
        chave: 'trilha.' + t.id,
        nota: txt('prova da trilha:') + ' ' + resultadoProva('trilha:' + t.id).melhor + '%',
      })
      : '') +
    feitos.map((c) => cartao({
      rotulo: 'curso concluído',
      nome: c.nome,
      meta: c.horas + 'h · ' + txt(c.nivel) + (doCaminho.includes(c.id) && t ? ' · ' + t.nome : ''),
      quem,
      quando: hoje,
      chave: c.id,
      nota: txt('prova final:') + ' ' + resultadoProva('curso:' + c.id).melhor + '%',
    })).join('');

  /* Os exemplos: um de cada tipo que o aluno ainda não tem. Quem já tem o
     certificado de curso não precisa ver como seria um.

     Os dados saem do CATÁLOGO — o primeiro curso da trilha da pessoa, a trilha
     dela —, e não de nomes inventados. Assim o exemplo já está no idioma certo
     (o catálogo é traduzido em runtime) e mostra o certificado que ela vai
     tirar de fato, não um genérico. */
  const modelo = cursoPorId(doCaminho[0]) || CURSOS[0];
  const exemplos =
    (feitos.length ? '' : cartao({
      rotulo: 'curso concluído',
      nome: modelo.nome,
      meta: modelo.horas + 'h · ' + txt(modelo.nivel) + (t ? ' · ' + t.nome : ''),
      quem,
      quando: hoje,
      chave: 'exemplo.curso',
      exemplo: true,
      nota: txt('prova final:') + ' 90%',
    })) +
    (trilhaPronta ? '' : cartao({
      rotulo: 'trilha concluída',
      nome: t ? t.nome : TRILHAS[0].nome,
      meta: (doCaminho.length || 10) + ' ' + txt('cursos') + ' · ' +
        (doCaminho.reduce((s, id) => s + (cursoPorId(id)?.horas || 0), 0) || 380) + 'h',
      quem,
      quando: hoje,
      chave: 'exemplo.trilha',
      exemplo: true,
      nota: txt('prova da trilha:') + ' 84%',
    }));

  el.innerHTML =
    '<header class="tela-head">' +
      '<h1>' + txt('Seus certificados') + '</h1>' +
      '<p>' + txt('Um por curso concluído com prova aprovada, e um por trilha inteira.') + '</p>' +
    '</header>' +

    (emitidos ? '<div class="certs">' + emitidos + '</div>' : '') +

    (quaseFeitos.length
      ? '<section class="bloco">' +
          '<div class="bloco-topo"><h2>' + txt('Falta só a prova') + '</h2></div>' +
          '<ul class="cert-falta">' +
            quaseFeitos.map((c) => '<li>' +
              '<span>' + esc(c.nome) + ' — ' + txt('conteúdo concluído') + '</span>' +
              '<a class="btn btn-primary" href="#/curso/' + esc(c.id) + '/prova">' +
                txt('Fazer a prova') + ' →</a>' +
            '</li>').join('') +
          '</ul>' +
        '</section>'
      : '') +

    (exemplos
      ? '<section class="cert-previa">' +
          '<div class="bloco-topo">' +
            '<h2>' + txt('Como será o seu') + '</h2>' +
            '<span class="mono dim">' + txt('exemplos — não valem como certificado') + '</span>' +
          '</div>' +
          '<div class="certs">' + exemplos + '</div>' +
        '</section>'
      : '');

  /* Um ouvinte na tela inteira, e não um por cartão: os cartões são refeitos
     a cada render, e ouvinte por cartão vaza a cada remontagem. */
  const abrir = (art) => {
    const exemplo = art.classList.contains('cert-exemplo');
    const chave = art.dataset.cert;
    const nomeCert = art.querySelector('.cert-curso')?.textContent || '';
    /* O botão do LinkedIn existe NOS DOIS CASOS, ao lado do fechar. No exemplo
       ele vem desabilitado, e o motivo está no `title`: esconder o botão faria
       a pessoa achar que a função não existe, e mostrá-lo funcionando
       publicaria uma credencial que ninguém tirou. Desabilitado com motivo é o
       único dos três que não mente. */
    abrirModal(art.outerHTML, {
      classe: 'modal-cert',
      rotulo: txt('Certificado') + ' — ' + nomeCert,
      acoes: exemplo
        ? '<span class="cert-in cert-in-off" aria-disabled="true" ' +
            'title="' + txt('exemplo — não há certificado para adicionar') + '" ' +
            'aria-label="' + txt('exemplo — não há certificado para adicionar') + '">' +
            ICO_LINKEDIN + '</span>'
        : botoesLinkedIn({ nome: nomeCert, cod: codigo(chave + quem), quando: new Date().toISOString() }),
    });
  };

  el.addEventListener('click', (e) => {
    const art = e.target.closest('.cert');
    if (art) abrir(art);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const art = e.target.closest('.cert');
    if (!art) return;
    e.preventDefault();
    abrir(art);
  });

  return { titulo: txt('Certificados'), el };
}
