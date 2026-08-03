# portal-frontend — Portal do Aluno da codeschool.ing

**Etapa 2** do projeto: a área do aluno. A Etapa 1 é a vitrine
([`codeschool-ing.github.io`](https://github.com/codeschool-ing/codeschool-ing.github.io)),
que apresenta 86 cursos e 16 trilhas e capta matrícula. Aqui é onde quem se
matriculou estuda.

Sem build e sem dependências, como a vitrine: HTML, CSS e módulos ES puros. Abre
de qualquer servidor estático.

> **Estado: esqueleto.** A estrutura está de pé e é navegável ponta a ponta, mas
> não há autenticação, não há servidor e o conteúdo é de mentira. O que já é
> definitivo é a **forma** — o formato dos exercícios, as assinaturas da API e o
> contrato dos tipos. Ver "O que é esqueleto e o que é definitivo".

## Rodar

```sh
python3 -m http.server 8899
# abrir http://localhost:8899
```

Conferir que continua de pé:

```sh
npm i playwright
node ferramentas/fumaca/fumaca.mjs
```

## Um arquivo só, para abrir do disco

```sh
python3 ferramentas/bundle/bundle.py     # -> portal-aluno.html
```

Embute CSS, scripts, favicon e — o passo que a ferramenta equivalente da
vitrine não precisava ter — **achata os módulos ES**. Eles não sobrevivem ao
`file://`: `<script type="module" src="…">` dispara um fetch, e fetch de
`file://` é bloqueado por CORS em todo navegador. A página abriria em branco,
sem sintoma além do console. Cada módulo vira uma IIFE que devolve o que
exportava, e os `import` viram leitura de um registro.

A saída continua sendo `<script type="module">`, de propósito: módulo embutido
não faz fetch, mas mantém a execução **adiada**, que é a mesma ordem do
`index.html` servido. Um `<script>` clássico rodaria antes da hora e o pacote
deixaria de exercitar o que o site exercita.

O achatamento pressupõe o código deste repositório, e só ele — sem
reexportação, sem ciclo de imports e sem `await` no topo de módulo. Qualquer um
dos três para a geração com erro, em vez de produzir um pacote quebrado em
silêncio.

O mesmo teste de fumaça roda contra o pacote, e é assim que se sabe que ele não
regrediu:

```sh
PORTAL="file://$PWD" PAGINA=/portal-aluno.html node ferramentas/fumaca/fumaca.mjs
```

O portal continua sendo servido de `index.html` + `assets/` + `app/`; o pacote
é para entregar uma cópia que abre com dois cliques.

## O que veio da vitrine, e o que não veio

A identidade é a mesma escola, então quase tudo atravessa:

| o quê | como veio |
| --- | --- |
| `assets/base.css` | cópia de `style.css` da vitrine, **sem alteração** |
| `assets/dados.js` | cópia do catálogo — 86 cursos, 16 trilhas |
| `assets/i18n*.js` | cópia dos cinco idiomas |
| `assets/i18n-runtime.js` | cópia, com **uma** linha divergente (abaixo) |
| o grafo de dependências | extraído para `app/catalogo.js` e `app/grafo.js` |

**O que ficou lá: o fullpage.** Cada seção ocupando a tela e a rolagem saltando
entre elas pressupõe narrativa linear — sete telas, você rola uma vez e chegou
ao fim. Um portal é acesso aleatório, sessão retomada no meio, conteúdo de
altura imprevisível. Sequestrar a roda do mouse num lugar onde a pessoa vai
passar horas lendo é hostil. É a única decisão grande da vitrine que não veio.

No lugar dele, chrome persistente: a mesma barra de 64px, um trilho lateral que
responde "onde estou" e "quanto falta" sem clique, e conteúdo que rola normal.

**A barra do topo é a mesma, com outro trabalho.** Ficaram a marca com o LED, o
tema, o idioma e a moldura `.term-bar` dos painéis. Saíram os links de venda
(Trilhas · Cursos · Planos · FAQ) e entrou o contexto do aluno. Há uma simetria
aqui: o link "Área do aluno" da vitrine é descrito no README de lá como
*marcador de funcionalidade futura*. Este repositório é o destino dele.

O trilho vira gaveta em **1180px** e o grafo vira lista em **861px** — os dois
pontos de corte são os da vitrine, reaproveitados porque foram medidos lá, não
escolhidos.

## O grafo virou mapa de progresso

É o melhor reaproveitamento do projeto, e sai quase de graça: `depende` já é,
literalmente, uma regra de desbloqueio. O algoritmo é o mesmo — níveis por Kahn,
ordenação de Sugiyama com custo lexicográfico de três critérios, roteamento
geométrico das arestas com folga de 16px. O que mudou é o que o cartão diz.

Quatro estados: **concluído · em andamento · disponível · mais adiante**.

**Ele mostra, mas não tranca.** O FAQ da vitrine promete, por escrito: *"Não. A
trilha é uma recomendação de ordem — se você só precisa de um curso dela,
assista só ele."* Um cadeado aqui contradiria uma promessa já publicada. Por
isso o estado mais restritivo se chama `adiante`, continua clicável, e o rodapé
do cartão diz "recomendado depois de X" em vez de "bloqueado".

O teste de fumaça reproduz o detector de colisão da vitrine — 120 pontos por
curva, conferindo se algum cai dentro de um cartão que não seja ponta daquela
aresta. Herdar o roteamento sem herdar a conferência seria ficar com o risco e
sem a rede.

## Aula = tópico, seção = assunto

O catálogo não tem conceito de aula; o grão mais fino é `topicos`, e são 1.503
deles. O portal adota **tópico como aula** em vez de inventar uma terceira
chave: os exercícios que o pipeline emite já trazem `topico` como campo de
primeira classe, então currículo e conteúdo já concordavam entre si.

**Mas um tópico não é um assunto — é um punhado deles.** Os números do catálogo:

| | |
| --- | --- |
| tópicos com dois-pontos (`X: a, b e c`) | **811 (54%)** |
| tópicos que enumeram **3+ assuntos** no título | **734 (49%)** |
| carga média por tópico | **4,0h** |
| pior caso (`react-ts`) | **7,5h por tópico** |

Quatro horas não é uma página, e uma caixinha de "concluída" no fim delas faz a
barra do aluno andar em saltos que não correspondem a nada. Então a aula se
divide em **seções**, e a última é sempre a avaliação.

**As seções são escritas, nunca derivadas.** Dava para quebrar o título no `:` e
nas vírgulas e ganhar 734 divisões de graça, e seria um erro: é heurística
léxica sobre prosa autoral, exatamente o que `REGRAS.md` registra ter tentado e
descartado na conferência de "exige tópico posterior" — *"a resposta está na
autoria, não na detecção"*. Aqui falharia igual: `Cliente, servidor e host: quem
pede e quem responde` viraria uma seção chamada "quem pede e quem responde". A
enumeração no título é **evidência** de que as seções são necessárias; não é
fonte para lê-las.

As seções moram em `assets/aulas.js`, e não em `dados.js`, porque aquele é cópia
do catálogo da vitrine e o modal de lá renderiza `topicos` como lista plana.
Ficam três arquivos com três donos e a mesma chave de junção:

| arquivo | o quê | de quem |
| --- | --- | --- |
| `dados.js` | catálogo: cursos, trilhas, tópicos | compartilhado com a vitrine |
| `aulas.js` | as seções e o texto delas | do portal |
| exercícios | a avaliação | do pipeline |

A forma de uma aula é fixa: **[vídeo + conteúdo] × N, e avaliação no fim.**

- **Toda seção de conteúdo abre com um quadro de vídeo**, reservado enquanto
  não há id. É a decisão da vitrine e o motivo escrito lá: o espaço já fica
  guardado, então publicar os vídeos um a um não reorganiza a tela de ninguém.
  A avaliação não tem vídeo — ali o aluno responde, não assiste.
- **A avaliação é sempre a última seção**, tenha exercícios ou não. A estrutura
  fica previsível e a avaliação vazia diz o que vem, em vez de sumir.
- **A avaliação é por tópico, não por seção.** Descê-la para o nível da seção
  obrigaria a mudar a chave que o pipeline emite — e ela cobra o tópico inteiro
  de qualquer forma.
- **Aula sem seções escritas vira uma seção só**, com o comportamento de antes.
  O conteúdo entra curso a curso, sem um dia de transição em que metade do
  portal fica quebrada.

**A avaliação vazia não conta no progresso.** Se contasse, nenhum curso jamais
chegaria a 100% enquanto os exercícios não existissem, e certificado nenhum
sairia. Ela aparece na tela, marcada como pendente e sem botão de concluir —
marcar como feito o que não foi feito é a forma mais barata de um portal mentir
sobre progresso. O denominador cresce quando os exercícios chegam, o que é
honesto: a aula passou mesmo a ter mais trabalho dentro.

**A unidade de progresso passou a ser a seção.** `aulaConcluida` virou derivado:
a aula está feita quando todas as seções dela estão. Um registro no formato
antigo (uma caixinha por aula) é migrado na primeira escrita, então quem já
tinha progresso não o vê zerar.

### Os dois cursos escritos

Há um arquivo por curso, como o pipeline faz — `aulas-<curso>.js` e
`exercicios-<curso>.js` —, e cada um **mescla** no objeto global em vez de
atribuí-lo: nenhum pode depender de ser o primeiro a carregar.

| curso | aulas | seções | avaliações | tipos |
| --- | --- | --- | --- | --- |
| `web-fundamentos` | 11 | 38 | 11 de 11, 23 exercícios | 6 dos 7 |
| `html-css` | 13 | 39 | 4 de 13, 8 exercícios | 4 dos 7 |

`html-css` está **pela metade de propósito**: é assim que um curso fica
enquanto está sendo produzido, e é o que exercita a avaliação pendente no lugar
dela — presente na estrutura, marcada, sem botão de concluir e fora do
denominador.

**Nenhum dos dois tem `codigo`, e a ausência é informação.** Em
`web-fundamentos`, escrever um programa exigiria o que o curso não dá — ele é o
primeiro da escola, sem pré-requisito de linguagem, e pedi-lo violaria a regra
do gerador de que um exercício do tópico N só pode exigir o que os tópicos 1..N
ensinaram. Em `html-css`, o motivo é outro: o validador do pipeline executa
python, javascript e sql, e HTML/CSS não se verificam contra casos de teste
porque o que se verificaria é o desenho. É o mesmo achado que `REGRAS.md`
registrou em `arquiteto-comunicacao`, onde três dos sete tipos eram
inaplicáveis. Os sete juntos continuam em `javascript`, aula 2.

**`html-css` foi quem fez a prosa crescer.** Em curso conceitual, crase no meio
da frase basta; não há como ensinar um seletor sem mostrá-lo em três linhas com
a indentação preservada. Daí o terceiro tipo de bloco:

```js
corpo: [
  'texto com `código` e **negrito**',
  ['item', 'item'],                      // vira <ul>
  { codigo: 'css', texto: '.a { … }' },  // vira bloco de código
]
```

A forma cresceu porque o conteúdo pediu, e só o que ele pediu. O bloco reusa
`.cod-bloco`, o componente dos exercícios, e é escapado com `esc` e não com
`marcado`: dentro de código, crase é crase e asterisco é asterisco.

**Título de seção é texto simples.** Ele aparece no `h2`, na pastilha do passo
e na linha do trilho, e nos dois últimos é rótulo, não prosa — marcação numa
pastilha de 200px vira ruído.

O conteúdo dos dois é tecnicamente correto e **sem revisão pedagógica**: serve
para avaliar a estrutura, e a escola reescreve.

**E o título exibido não serve de chave.** `aplicarConteudo()` reescreve
`c.topicos` no lugar a cada troca de idioma — em inglês o tópico vira *"Types,
coercion, strict equality and falsy values"* e nenhum exercício casa. O defeito
aparece sem ninguém tocar em nada: basta o navegador estar configurado noutro
idioma, que é o caso da maioria fora do Brasil. Foi assim que ele apareceu, num
Chromium em inglês.

A chave é o **texto em português**, guardado por `guardarBase()` no
carregamento. É a mesma decisão do i18n da vitrine — *a chave de tradução é o
próprio texto em português* — aplicada à junção com o conteúdo. Cada aula
carrega as duas coisas: `titulo` para mostrar, `chave` para casar.

## A tradução tem duas metades, e só uma atravessa intacta

| metade | na vitrine | no portal |
| --- | --- | --- |
| `txt('texto em português')` | exceção | **caminho principal** |
| passeio pelos nós de texto | caminho principal | só o esqueleto estático |
| `aplicarConteudo()`, que reescreve `CURSOS`/`TRILHAS` no lugar | igual | igual |

O passeio (`mapearTextos`) funciona na vitrine porque o HTML é estático e existe
uma lista `DINAMICOS` com onze contêineres a ignorar. Num portal quase todo
texto nasce em JavaScript, e essa lista viraria a página inteira. O mecanismo é
o mesmo; o que muda é o peso de cada metade.

Por isso a **única divergência** entre as duas cópias de `i18n-runtime.js` é a
lista `DINAMICOS`, que saiu do código e virou `window.I18N_DINAMICOS`, definido
no `index.html`. Existe para que não haja outra divergência.

**Interface e conteúdo são coisas diferentes.** A interface traduz nos cinco
idiomas; enunciado de exercício e texto de aula são conteúdo de banco, e na
Etapa 2 vêm traduzidos do servidor ou não vêm. Os exercícios de exemplo estão só
em português de propósito — e como toda chave ausente cai no português sozinha,
navegar em inglês com exercício em português não quebra nada.

## Os sete tipos de exercício

O contrato de um tipo é pequeno: `corpo(ex, uid)`, `montar(raiz)` (opcional),
`colher(raiz)`, `revelar(raiz, ex, veredito)`. O invólucro comum — enunciado,
dica, botão, veredito, selo — mora em `app/exercicios/index.js`.

O que divide os sete não é a UI, é **onde a correção pode acontecer**:

| tipo | corrige onde | hoje |
| --- | --- | --- |
| `quiz` · `multipla-escolha` · `ordenacao` · `associacao` | cliente — é comparação pura | **funciona de verdade** |
| `codigo` · `saida-esperada` | servidor: execução em contêiner | veredito "não conferido" |
| `resposta-expressao` | servidor: equivalência simbólica (sympy) | veredito "não conferido" |

Os dois caminhos passam por `api.avaliar()` com o mesmo formato de veredito,
então o dia em que o servidor existir muda o corpo de um `if`.

**Não conferido nunca vira aprovado.** É regra do pipeline e vale inteira aqui:
enquanto não há execução, o portal diz que não conferiu, em vez de dar um
"certo" que ninguém verificou.

Três regras da escola que a interface respeita desde o primeiro dia, porque são
fáceis de errar e caras de corrigir depois:

- **`porque` é feedback pós-resposta, não pista visível.** Só aparece depois de
  responder.
- **A ordem do JSON é o gabarito** em `ordenacao` (os `itens` estão na ordem
  certa) e em `associacao` (`pares[i].esquerda ↔ pares[i].direita`). As duas são
  embaralhadas com semente, e a coluna da direita da associação sai **ordenada
  alfabeticamente** — a mesma razão pela qual a sonda do pipeline faz isso.
- **`armadilha` não vai para a tela** antes da resposta: ela nomeia exatamente o
  que o exercício mede. Vira feedback depois.

Em `codigo`, os primeiros casos de teste viram exemplo e o resto fica oculto:
mostrar todos convida a construir a solução que passa nos casos sem resolver o
problema — que é o defeito que o gerador do pipeline tem de descartar antes de
fechar um exercício.

## O que é esqueleto e o que é definitivo

**Descartável:** o conteúdo de `assets/exercicios-exemplo.js`, a tela de entrar
(qualquer nome entra), o texto das aulas, o certificado sem código de validação.

**Definitivo:** o formato dos exercícios — os campos são exatamente os que o
pipeline emite (`enunciado`, `dica_socratica`,
`alternativas[].{texto,correta,porque}`, `itens`, `armadilha`, `pares`,
`distratores_direita`, `testes[].{descricao,entrada,saida_esperada}`,
`verificacao_*`). O portal acrescenta dois campos que são dele, não do
exercício: `id` e `curso`.

Ignorar a ferramenta por ora não custa nada; inventar um formato paralelo
custaria uma migração.

Também definitivo: `_verificacao` (`criticado` / `execucao` / `estrutura`)
aparece em cada exercício e já filtra em `api.exerciciosDaAula()`. A doc do
pipeline diz que é esse campo que decide o que o portal publica primeiro —
melhor ele existir vazio que ser retrofitado.

## Estrutura

```
index.html                     o shell: barra, trilho e <main>
assets/base.css                CSS da vitrine, sem alteração
assets/portal.css              só o que a vitrine não tinha
assets/dados.js                catálogo (vira API na Etapa 2)
assets/aulas.js                as seções de cada tópico e o texto delas
assets/exercicios-*.js         um arquivo por curso, como o pipeline faz
app/catalogo.js                leitura do catálogo e o grafo — não toca no DOM
app/aulas.js                   do que uma aula é feita: seções + avaliação
app/grafo.js                   o grafo como mapa de progresso
app/estado.js                  progresso do aluno (localStorage → servidor)
app/api.js                     camada de mentira, assinaturas do backend real
app/rotas.js                   roteador por hash
app/trilho.js                  o trilho lateral
app/telas/*.js                 uma por tela
app/exercicios/*.js            um por tipo, mais o invólucro e a correção
ferramentas/fumaca/            o teste de fumaça
ferramentas/bundle/            gera o HTML único
```

Ninguém fora de `estado.js` lê `localStorage`, e ninguém fora de `api.js` lê
`estado.js` para buscar dado. Trocar a persistência é trocar um arquivo.

Hash e não History API: o portal é servido como arquivo estático, e `pushState`
exigiria o servidor devolver o index em qualquer caminho.

## A avaliação é um wizard

Uma questão por vez, com marcadores no topo. Empilhar sete exercícios numa
página faz rolar para achar onde parou e mostra de uma vez um volume que
intimida.

Os marcadores são **clicáveis** e as telas ficam **guardadas**: voltar à
questão 1 devolve a questão 1 como ela ficou, com veredito e justificativas à
vista. Remontar apagaria isso, e o aluno acharia que perdeu o que fez. Travar o
avanço até acertar também está fora — a trilha inteira é recomendação e não
trava; a avaliação não podia ser mais rígida que ela.

**A associação virou clique-a-clique, no gesto do Duolingo:** toca-se num item
da esquerda, depois no par dele à direita, e o par é conferido na hora. Isso
funciona igual no toque e no mouse, não esconde as opções num menu, e vira
prática em vez de formulário.

Mas quebra a medida, e a correção importa: **com feedback imediato o mapeamento
final está sempre certo** — basta insistir. Se o veredito continuasse comparando
o mapa com o gabarito, todo mundo tiraria 100%. A medida passou a ser o
caminho: **quantos pares foram tentados errado antes de fechar**. Zero é acerto.
É a régua do pipeline — acertar por eliminação não conta como saber — aplicada
ao processo em vez do resultado.

**O selo de `_verificacao` saiu da tela do aluno.** Ele continua no dado e
continua filtrando em `exerciciosDaAula`: é uma decisão de *publicação*, não uma
informação para quem estuda. Dizer "só conferência estrutural" a um aluno é
avisá-lo de que aquele exercício talvez não preste — e se talvez não preste, não
devia estar publicado.

## Três armadilhas que só apareceram na tela

Ficam registradas porque nenhuma aparece lendo o código:

1. **`base.css` estiliza o elemento `nav`**, não uma classe — a vitrine tem
   exatamente um. O portal tem três (barra, trilho, migalhas), e os dois de
   dentro herdaram `position:fixed` e viraram uma segunda barra por cima do
   conteúdo. Neutralizado em `portal.css`, e não em `base.css`, que precisa
   continuar sincronizável com a vitrine.
2. **`[hidden]` perde para `.btn{display:inline-flex}`** — a regra do navegador
   tem especificidade zero. O botão "Tentar de novo" aparecia antes de existir o
   que refazer.
3. **`base.css` nunca reseta o elemento `button`** — cada componente da vitrine
   declara o próprio fundo (`.tema`, `.burger`, `.nav-cta`). Todo botão novo
   precisa declarar o dele, senão herda o cinza claro do navegador. Foi o que
   deixou a lupa, o avatar e as setas da ordenação brancos sobre o tema escuro:
   um sintoma só, três lugares, uma causa.

## O que vem depois

- **Servidor**: autenticação, progresso por aluno, execução de código em
  contêiner descartável e o CAS para `resposta-expressao`.
- **Conteúdo real**: religar `ferramentas/exercicios` do repo da vitrine e
  ingerir os JSON aprovados, começando pelos `_verificacao: criticado`.
- **Texto e vídeo das aulas**, hoje um quadro reservado por aula.
- **A unidade intermediária de certificação.** Hoje o certificado é por curso,
  porque é a única unidade que existe. O README da vitrine deixa quatro
  perguntas em aberto sobre isso — o eixo, o nome, a âncora e o custo de
  tradução — e registra a armadilha: cortar por nível repetiria o erro do caso
  Go. O custo só salta no primeiro certificado emitido para aluno real.
