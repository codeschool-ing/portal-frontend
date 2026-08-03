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
node ferramentas/fumaca/fumaca.mjs      # o portal inteiro, num navegador
node ferramentas/exemplos/conferir.mjs  # os exemplos de código realmente rodam
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

As seções moram em `assets/aulas-*.js`, e não em `dados.js`, porque aquele é cópia
do catálogo da vitrine e o modal de lá renderiza `topicos` como lista plana.
Ficam três arquivos com três donos e a mesma chave de junção:

| arquivo | o quê | de quem |
| --- | --- | --- |
| `dados.js` | catálogo: cursos, trilhas, tópicos | compartilhado com a vitrine |
| `aulas-*.js` | as seções e o texto delas | do portal |
| exercícios | a avaliação | do pipeline |

**Avançar é concluir.** Não há botão de "marcar como concluída": ele e a seta
de avançar faziam a mesma coisa, e juntá-los num "Concluir e continuar" só
adiava a pergunta. Passar para a próxima seção marca a atual como feita — que é
o que o aluno já queria dizer ao clicar em avançar. O custo é real e fica
registrado: não há como desmarcar, e quem passar batido acumula progresso sem
ter lido. É a troca aceita em favor de um gesto só, e combina com o resto do
portal, que mostra e não tranca.

A forma de uma aula é fixa: **N seções de conteúdo, e avaliação no fim.**

### A seção declara o que ela é

Nem toda seção é da mesma natureza, e o layout segue a natureza:

| a seção diz | o que aparece |
| --- | --- |
| `video: 'ID'` | o player, tocando ali |
| `video: true` | o quadro reservado — "vai ter, ainda não tem" |
| (sem `video`) | nada. Nem quadro cinza, nem promessa |
| `video` **e sem `corpo`** | seção **só de vídeo**: a abertura de aula |

O quadro já esteve em **toda** seção de conteúdo, reservado, com o argumento de
que publicar os vídeos um a um não reorganizaria a tela de ninguém. O argumento
continua bom para a seção que *vai* ter vídeo — e é péssimo para a que nunca
vai: uma seção de texto com um retângulo cinza em cima promete algo que não
vem, e a promessa não expira. A reserva não se perdeu; ela deixou de ser
automática e passou a ser **dita**.

**O título fica acima do player**, como nas seções de texto — "onde estou" vem
antes de "o que eu assisto", e a resposta tem de ser a mesma nas duas formas.
(O player já esteve acima do título, para não empurrar o play para baixo da
dobra; o preço era cair numa seção sem saber de que aula ela era.)

### As três larguras, e nada fora delas

| | |
| --- | --- |
| `--trilho` | a coluna do menu |
| `--leitura` | **todo** o conteúdo de uma seção: prosa, vídeo, figura, material, anotação |
| `--amplo` | a exceção, e é uma só: o bloco de código anotado |

`--leitura` são 820px porque prosa acima de ~68 caracteres por linha cansa. O
vídeo entra nela junto com o resto: ele já foi de ponta a ponta da área
inteira, e o efeito colateral era a aula ter **três alinhamentos diferentes
conforme a seção** — o olho procurando a margem esquerda a cada troca. Sobrou
um ganho que não estava previsto: as setas de navegação moram no vão e pararam
de passar por cima da imagem.

`--amplo` existe porque o exemplo anotado não é prosa: são duas colunas, e uma
delas é código, que não se quebra por conforto. O teto dele sai da posição da
seta, como descrito adiante.

**Nada passa de `--amplo`.** O teste percorre as 89 seções escritas dos três
cursos, uma a uma, e mede cada filho da tela de aula — é caro, uma navegação
por seção, e é o único jeito de a regra valer para o conteúdo que existe e não
para a seção que alguém lembrou de abrir.

**Vídeo não é sinônimo de abertura de aula.** Das 26 seções com vídeo, 5 são a
primeira da aula, 15 a segunda, 5 a terceira e 1 a quarta. Se todas fossem a
primeira, a forma teria virado convenção sem ninguém decidir isso — e há um
teste que reprova se as posições voltarem a se concentrar.

No trilho, o ícone diz a natureza junto com o estado: **play** para vídeo,
**linhas** para leitura, **estrela** para a avaliação, **check** para o que já
foi feito. Antes tudo era play, o que prometia vídeo em toda seção.

### As outras regras da forma

- **A avaliação nunca tem vídeo** — ali o aluno responde, não assiste.
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

### Os três cursos escritos

Há um arquivo por curso, como o pipeline faz — `aulas-<curso>.js` e
`exercicios-<curso>.js` —, e cada um **mescla** no objeto global em vez de
atribuí-lo: nenhum pode depender de ser o primeiro a carregar.

| curso | aulas escritas | seções | avaliações | o que ele exercita |
| --- | --- | --- | --- | --- |
| `web-fundamentos` | 11 de 11 | 39 | 11 de 11, 23 exercícios | prosa, diagrama inline, material, seção só de vídeo |
| `html-css` | 13 de 13 | 39 | 4 de 13, 8 exercícios | bloco de código, figura de arquivo |
| `javascript` | 4 de 12 | 11 | 3 de 12, 9 exercícios | `exemplo` anotado, os 7 tipos, seção só de vídeo |

Os dois **pela metade** são de propósito: `html-css` tem as avaliações
incompletas e `javascript` tem as aulas incompletas. É assim que um curso fica
enquanto está sendo produzido, e é o que exercita os dois estados de lacuna —
a avaliação pendente (presente na estrutura, marcada, fora do denominador) e a
aula ainda sem texto (que cai no invólucro de uma seção só).

**Nenhum dos dois primeiros tem `codigo`, e a ausência é informação.** Em
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
assets/aulas-*.js              as seções de cada tópico e o texto delas
assets/exercicios-*.js         um arquivo por curso, como o pipeline faz
app/catalogo.js                leitura do catálogo e o grafo — não toca no DOM
app/aulas.js                   do que uma aula é feita: seções + avaliação
app/grafo.js                   o grafo como mapa de progresso
app/estado.js                  progresso do aluno (localStorage → servidor)
app/api.js                     camada de mentira, assinaturas do backend real
app/rotas.js                   roteador por hash
app/trilho.js                  o trilho lateral
app/busca.js                   o índice da busca global — não toca no DOM
app/painel-busca.js            o painel do ⌘K
app/modal.js                   o modal da vitrine, reaproveitado
app/provas.js                  monta a prova do curso e a da trilha
app/materiais.js               a lista de material para baixar
assets/planos.js               os planos e o que cada um inclui
assets/materiais.js            GERADO — os PDFs, como data: URI
ferramentas/materiais/         gera assets/materiais.js
ferramentas/exemplos/          roda os blocos `exemplo` e confere a saída
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

## Busca, desempenho e notas

Três telas que não inventam dado nenhum: elas mostram o que o portal já tinha e
não exibia.

### A busca (`⌘K`, `/`, ou a lupa)

A lupa e o `⌘K` existiam desde o primeiro dia e os dois levavam ao catálogo — um
atalho que prometia busca e entregava navegação. **Ela importa mais aqui do que
num site comum:** são 86 cursos e 1.503 aulas, e quem lembra "aquela parte sobre
o TTL do DNS" não tinha caminho nenhum até lá — nem pelo menu, nem pelo grafo,
nem pelo trilho.

Indexa cinco grupos, em ordem de utilidade decrescente: **seções** (o grão que
se procura de verdade), **aulas**, **cursos**, **exercícios** e **as notas do
próprio aluno**.

Duas decisões vêm de defeitos já pagos neste projeto:

1. **Casa contra o texto exibido e contra o português ao mesmo tempo.** O
   catálogo é traduzido em runtime; num navegador em inglês o título da aula é
   "Hosting: shared, VPS, cloud and CDN", mas as seções, as notas e os
   exercícios estão em português. Indexar só um dos dois faria metade do
   conteúdo sumir conforme o idioma — que é exatamente o defeito que já mordeu a
   junção dos exercícios.
2. **Ignora acento**, dos dois lados da comparação. Quem digita no celular quase
   nunca acentua.

O trecho ao lado de cada resultado sai do **corpo**, nunca do título: repetir
embaixo o título que está em cima não informa nada. E ele é texto puro — a
marcação mínima do corpo (crase e `**`) é retirada antes de indexar, senão
aparecia crua na tela. Os dois casos estão no teste de fumaça.

Seções só entram onde o conteúdo foi escrito. Nos 84 cursos sem texto a "seção"
é um invólucro com o nome da própria aula, e listá-la devolveria cada resultado
duas vezes.

### Desempenho, e por que ele tem três estados

Cada resposta já gravava tentativas, acerto e se chegou a ser conferida. Isso
morria ali: o aluno respondia, via o veredito e nunca mais reencontrava aquilo.

**"Errou" e "ninguém conferiu" não viram a mesma barra.** Os tipos que precisam
de servidor (`codigo`, `saida-esperada`, `resposta-expressao`) respondem
`acertou: null` enquanto não houver execução, e contá-los como erro inventaria
uma reprovação que não aconteceu. É a régua do funil do outro lado: lá, não
julgado nunca vira aprovado; aqui, não julgado nunca vira reprovado. Eles
aparecem como "aguardando o servidor" e ficam fora da taxa.

**Refazer os errados** monta o mesmo wizard da avaliação com o que o aluno errou
em qualquer curso — é a única tela que reúne conteúdo de aulas diferentes, e
faz sentido porque o critério aqui não é o currículo, é o erro. Cada exercício
volta com **o curso e a aula de onde veio**: o wizard grava em
`progresso[curso].aulas[ix]`, e um contexto único registraria o acerto na aula
errada, fazendo o desempenho mentir sobre onde a pessoa melhorou.

### Notas

Um campo recolhido no fim de cada seção, com salvamento automático. É a única
coisa do portal que não veio do catálogo nem do pipeline: é do aluno. Por isso
tem tela própria, agrupada por curso — na hora de revisar ninguém lembra em qual
seção anotou o quê — e entra na busca junto com o resto.

## Prova de curso e prova de trilha

A avaliação da aula e a prova não são a mesma coisa, e a diferença não é o
tamanho:

| | avaliação da aula | prova |
|---|---|---|
| para quê | praticar | medir |
| feedback | imediato, questão a questão | só no fim |
| dica socrática | aparece | não aparece |
| refazer | à vontade, na hora | só refazendo a prova inteira |
| resultado | não é registrado | vale nota, e a melhor fica |

**Feedback imediato numa prova é o que permite tentar até acertar** — e aí ela
para de medir. Por isso o wizard ganhou `modo: 'prova'`: as mesmas telas, com o
veredito represado. Enquanto a prova está aberta, responder devolve só "resposta
registrada", e o marcador no topo diz *se* você respondeu, nunca *se acertou*.
Ao entregar, tudo abre de uma vez e responder para de ser possível — é a linha
entre medir e ensinar.

**As questões saem do mesmo banco das aulas, sorteadas.** Não há um banco
separado de "questões de prova" e não deve haver enquanto o pipeline emitir um
arquivo por tópico: manter dois bancos alinhados é trabalho recorrente, e o que
se ganharia — questões inéditas — o sorteio já dá, porque ninguém faz os 1.503
exercícios de uma trilha antes da prova.

**O sorteio é semeado pela tentativa.** Sair da tela e voltar devolve a *mesma*
prova; senão, fechar a aba sem querer viraria uma prova nova — a punição errada
para o erro errado. Reprovar e tentar de novo devolve uma prova *diferente*:
decorar a lista de dez não pode ser a estratégia.

**A prova prefere os tipos que o portal sabe corrigir.** `codigo`,
`saida-esperada` e `resposta-expressao` precisam de servidor e hoje voltam "não
conferido" — uma prova cheia deles não teria nota. Eles entram só quando não há
corrigíveis suficientes, e ficam fora do denominador, pela régua de sempre: não
julgado não vira aprovado nem reprovado. Ficar em branco, ao contrário, conta
como erro — deixar em branco é uma resposta.

**Ela não tranca.** Dá para abrir a prova sem ter feito uma aula. O portal
inteiro mostra e não tranca, e uma prova que travasse seria a única exceção. O
que ela faz é avisar quanto do conteúdo você concluiu. Entregar com questões em
branco pede um segundo clique, e o próprio botão diz quantas são.

Mínimo para passar: **70%**. Vale sempre o melhor resultado — reprovar depois de
já ter passado não pode tirar um certificado emitido.

### O certificado passou a exigir a prova

Concluir todas as seções diz que a pessoa **percorreu** o material — e como
avançar é concluir, percorrer é quase automático. Um certificado que sai de
percorrer não afirma nada sobre quem o recebe. A prova é o que faz o documento
significar alguma coisa.

Com a prova da trilha nasceu a **segunda unidade de certificação**: quem termina
os cursos do caminho e passa na prova final da trilha leva um certificado da
trilha inteira. Isso responde *em parte* a pergunta que o README da vitrine
deixou aberta: a trilha é a unidade grande, e a dúvida de verdade — se existe
algo entre um curso de 40h e uma trilha de 400h — continua aberta, e continua
barata enquanto nenhum certificado tiver sido emitido para aluno real.

A tela de certificados mostra **exemplos** de cada tipo que o aluno ainda não
tem, montados com os dados reais do catálogo dele. Eles se declaram exemplo em
três lugares ao mesmo tempo — moldura tracejada, selo na barra e, no lugar do
código de validação, a frase "nenhum código foi emitido". Um certificado falso
parecido com um verdadeiro é um problema, não uma prévia.

## Conteúdo: imagem, diagrama e código anotado

`prosa()` passou de três formas de bloco para seis. As três novas:

```js
{ imagem: url, legenda, alt }   // um arquivo — foto, captura, diagrama exportado
{ svg: '<svg…>', legenda }      // um desenho, que entra no documento
{ exemplo: { linguagem, arquivo, partes: [{ codigo, nota }], saida } }
```

**Por que imagem e svg são coisas separadas.** Um diagrama exportado como PNG
nasce com um fundo, e esse fundo está errado em metade das visitas: o portal tem
tema claro e escuro, e o aluno alterna. Diagrama de conceito — que é linha e
rótulo — fica inline e herda a cor do tema. Foto e captura de tela continuam
sendo arquivo. (O `svg` não é escapado: é marcação nossa, escrita no arquivo de
conteúdo. É o campo que vai precisar de sanitização no dia em que o conteúdo
vier de fora, e o comentário no código existe para essa pergunta não passar
batida.)

**O `exemplo` é a forma do [Go By Example](https://gobyexample.com):** a
explicação de um lado, o programa do outro, cada nota na altura do trecho que
ela comenta. Ela vale um bloco próprio porque **um parágrafo entre dois trechos
quebra o programa** — quem lê perde o fio de que aquilo é um arquivo só.

A primeira versão daqui errava em duas coisas, e as duas foram corrigidas:

1. **A nota vai à esquerda, o código à direita.** Lê-se a explicação e então se
   olha para o lado, que é a ordem em que a pessoa aprende. Com o código
   primeiro, ela lê algo que ainda não sabe o que é.
2. **Não há linha entre os trechos.** As bordas transformavam o programa numa
   tabela de pedaços — exatamente o que este bloco existe para evitar. A coluna
   da direita tem de parecer um arquivo, e continuidade é o argumento inteiro.
   Há um teste que mede se os trechos se emendam sem folga.

Abaixo de 900px as duas colunas viram uma, com a nota *antes* do trecho.

**O bloco escapa da coluna de leitura.** Ela tem 820px porque prosa acima de 68
caracteres por linha cansa; o exemplo não é prosa — são duas colunas, e uma
delas é código, que não se quebra por conforto. Dentro de 820px sobravam ~440px
para o programa, e qualquer linha real virava barra de rolagem.

Quanto ele pode crescer não é um número escolhido: sai da **posição da seta de
navegação**, que mora no vão ao lado. Com a seta de 44px e 16px de folga, a
maior largura em que os dois não brigam pelo mesmo pixel tem forma fechada —
`((100vw - trilho) + leitura) / 2 - 76`. A 1920px dá 1104px; a 1400px, 844 —
ainda mais que a coluna de leitura, então escapar dela nunca deixa o exemplo
mais estreito do que estava. O teste mede a folga em três larguras.

**O realce de sintaxe tem três cores, e são as da marca:** vermelho para a
estrutura da linguagem, azul para os literais, branco para o resto —
comentário no cinza apagado. Não há uma quarta: paleta de editor com dez tons
dentro de uma página de curso compete com o conteúdo em vez de ajudar a lê-lo.

Ele **não é um parser**, e o código diz isso: é uma varredura por expressão
regular com as alternativas em ordem de precedência — comentário antes de
string, string antes de tudo —, para que nada seja realçado dentro de um
literal. Erra nos casos que um parser acertaria, e erra devolvendo texto sem
cor, nunca texto errado. Mora em `texto.js` e não num módulo próprio por uma
razão mecânica: precisa de `esc`, e separá-los criaria um ciclo de imports que
o `bundle.py` recusa.

### Onde ele mais rende: o curso de JavaScript

Em `web-fundamentos` o assunto é conceito e prosa dá conta. Em `html-css` o
código aparece em pedaços curtos. Em `javascript` o assunto é uma **linguagem**,
e linguagem se aprende lendo programa — as quatro primeiras aulas foram escritas
quase inteiras em `exemplo`.

**Todo exemplo tem de rodar**, e há uma ferramenta para garantir isso:

```sh
node ferramentas/exemplos/conferir.mjs
```

Ela concatena os `partes[].codigo` de cada bloco, executa num Node de verdade e
compara com a `saida` escrita no conteúdo. Na primeira execução pegou dois
defeitos reais, nenhum dos quais apareceria lendo o texto: o exemplo das arrow
functions **estourava no meio** (`this.n` com `this` indefinido em módulo ES) e
listava a saída de dois `console.log` que nem estavam no programa; e o exemplo
de `this` abortava no `TypeError` antes de chegar à linha que era a lição.

Exemplo com saída inventada é pior que exemplo nenhum: ensina errado com a
autoridade de quem mostrou o resultado, e o aluno só descobre no console dele.

## Material complementar

A seção referencia o material por chave (`materiais: ['wf-dns-resumo']`); o
registro com título, tipo e tamanho mora em `window.MATERIAIS`. A indireção
existe para um dia só: quando o arquivo sair do `data:` URI e virar URL assinada
de um bucket, muda o registro — nenhuma linha de conteúdo precisa ser reescrita.

Os PDFs de exemplo são **gerados**, não commitados
(`ferramentas/materiais/gerar.py`). O texto deles é versionado e legível no
diff; o binário é saída. E eles vêm embutidos como `data:` URI porque o portal
tem de funcionar aberto do disco — um link para `assets/algo.pdf` morre depois
do bundle. São PDFs escritos à mão, sem dependência, ~3 KB cada.

O link usa `download`, e não `target`: abrir o PDF no visualizador embutido tira
o aluno da aula.

## O conteúdo não fica dentro de um cartão

A prosa da seção era um `.bloco`: fundo, borda, canto arredondado. Isso desenha
uma fronteira entre "a área do conteúdo" e "o resto" — e o resto não é nada, é
a margem que sobra de centralizar. Separar texto de vazio não é uma distinção
que valha uma linha na tela.

Cartão é para o que se **compara lado a lado**: cursos, materiais, os blocos da
página do curso. Texto corrido para ler durante meia hora quer o contrário —
nada em volta. As figuras, o código e o vídeo mantiveram a moldura, e agora ela
quer dizer alguma coisa ("isto aqui não é prosa"), o que não conseguia dizer
quando estava dentro de outra moldura.

O trilho também respirou: os itens tinham 2px de folga entre linhas de 8px, e
uma lista de treze aulas com as seções abertas virava um paredão que se lê linha
a linha. O ar entre os itens é o que faz um menu ser **consultado** em vez de
lido.

## O certificado é um documento, não uma janela

Ele nasceu reaproveitando o `.term-bar` da vitrine — os três pontinhos e o nome
do arquivo. É a moldura certa para painel de código e a errada para isto: o
certificado é o **único artefato do portal que sai daqui**, e vai para um perfil,
um anexo de e-mail, uma vaga. Nenhum documento tem barra de janela em cima.

A forma agora é a de um diploma — emissor no alto, "certifica que", o nome de
quem recebe em corpo grande, o que foi concluído, e um rodapé com data e código.
A identidade continua sendo a da escola (mesma tipografia, mesmo fósforo, o LED
da marca), aplicada a um documento em vez de a uma janela. O teste de fumaça
guarda a regressão: `.cert .term-bar` tem de continuar valendo zero.

## Conta: e-mail, senha e plano

**E-mail e senha são dois formulários, não campos de um "salvar".** As duas
operações têm consequências diferentes, confirmações diferentes e, no servidor,
endpoints diferentes; juntá-las faria a pessoa alterar uma sem querer.

Duas decisões que o código registra e a tela repete ao aluno:

- **A senha não é guardada em lugar nenhum.** Não há hash no cliente que valha
  alguma coisa, e gravá-la em `localStorage` seria pior que não ter tela: daria
  a impressão de que existe autenticação. O que fica é a data da troca. O teste
  procura a senha digitada dentro do armazenamento inteiro e falha se achar.
- **A validação de e-mail é frouxa de propósito** — "tem arroba, tem ponto
  depois dele, sem espaço". Regra estrita rejeita endereço válido (`+`, domínio
  novo, acento) e não impede nada: quem confirma que o endereço existe é a
  mensagem enviada para ele.

**Meu Plano compara por recurso, não por cartão de preço.** Três cartões lado a
lado com listas independentes é o formato de página de *venda*, para quem ainda
não escolheu. Quem já assinou tem outra pergunta — "o que eu **não** tenho?" — e
a tabela responde essa, porque alinha a mesma linha nos três planos.

Os planos em `assets/planos.js` são ficção deliberada com a forma certa: preço,
ciclo e cobrança são domínio de um serviço de pagamento. E **nada é bloqueado
por plano hoje**: travar exige servidor, e com o estado no navegador qualquer
trava seria teatro — bastaria editar uma chave. A tela diz isso.

## Espaço: o grafo, as setas e a coluna de leitura

Três ajustes que são a mesma ideia — **deixar o vazio trabalhar**:

**O grafo respira.** A vitrine usa 48px entre os níveis, e lá basta: o grafo é
uma das sete telas e some depois de uma rolada. Aqui é a tela onde o aluno
volta para se situar, e com 48px as arestas passam raspando nos cartões. Não
colidem — o detector de colisão do teste continua acusando zero —, mas o olho
não separa uma coluna da seguinte. Foram para 88px, e a troca é rolagem
horizontal, que o grafo já tinha resolvida (setas e esmaecido nas bordas).

**As setas de navegação foram para a sobra da tela.** A coluna de leitura tem
820px e é centrada na área que sobra do trilho; o que resta dos dois lados é
espaço que nenhum conteúdo usa. É exatamente onde um controle de navegação deve
morar: perto o bastante para ser alcançado, longe o bastante para não disputar
a linha com a palavra que está sendo lida.

```
vão de cada lado = (100vw - trilho - coluna) / 2
seta esquerda → centrada no vão entre o trilho e a coluna
seta direita  → centrada no vão entre a coluna e a borda da tela
```

O trilho e a coluna viraram **variáveis CSS** (`--trilho`, `--leitura`) porque
a posição da seta deriva das duas — e número repetido em dois lugares diverge.
Já divergiu uma vez, no recuo do conteúdo, e custou 2px de rolagem horizontal
no celular.

## O certificado abre em grande

Clicar num certificado o amplia sobre o resto da tela, com o fundo esmaecido e
**congelado** — o mesmo modal da vitrine, reaproveitado inteiro. O
congelamento é `overflow:hidden` no documento e não JavaScript, pelo motivo que
o `base.css` já registrava: prender só a roda e o toque deixava passar a barra
de rolagem, a inércia do trackpad e as setas dentro de um campo.

Acima da caixa, à direita, ficam as ações. São duas, e fazem coisas diferentes:

| botão | o que faz |
| --- | --- |
| o ícone do LinkedIn | abre o formulário de *licenças e certificados* já preenchido — nome, instituição, mês, ano e código |
| **Compartilhar** | publica um post com o link de validação |

O primeiro é **só o ícone**: a marca do LinkedIn é reconhecida sem legenda, e o
rótulo ocupava metade da faixa para dizer o que o desenho já diz. O texto não
sumiu — foi para o `aria-label` e o `title`, que é o que o leitor de tela
anuncia e o que o cursor mostra. Um teste reprova se o botão ficar mudo.

A cor é a da marca deles, `#0A66C2`, no tema claro. No escuro ela dá 2,5:1 de
contraste contra o painel — abaixo dos 3:1 que um ícone precisa —, então o tema
escuro clareia. Clarear a cor de uma marca não é liberdade: é o que a torna
visível, e invisível ela não representa marca nenhuma.

O primeiro é o que a pessoa realmente quer: certificado no perfil é uma
credencial; post some do feed em dois dias.

O `certUrl` aponta para uma página de validação que **ainda não existe** — ela
nasce com o servidor. A URL é montada no formato definitivo de propósito: o dia
em que o servidor existir não pode ser o dia de descobrir que o formato era
outro. Um teste confere que os sete campos que o LinkedIn espera estão lá e que
o código na URL é o mesmo impresso no documento — uma URL malformada só daria
sinal no site do LinkedIn.

Certificado de **exemplo não compartilha**: no lugar dos botões, a frase que
explica por quê.

## Duas fileiras que rolam, e uma cor que separa

**As categorias do catálogo ganharam setas.** São nove, e nem com o trilho
fechado cabem numa linha: as últimas ficavam cortadas na borda sem nada dizendo
que havia mais. A estrutura é a da vitrine — `.chips-caixa` com uma seta de cada
lado e o esmaecido nas pontas —, e o `base.css` já trazia o estilo dos três
pedaços. Reimplementar seria manter dois de tudo. Quando tudo cabe, as setas
somem: seta desabilitada que nunca faz nada é ruído.

**O rótulo de grupo da busca virou vermelho.** No azul ele se confundia com o
contexto de cada resultado, que também é azul e também é monoespaçado, e a
lista virava uma coluna só. Ele é a única linha ali que não é resultado — é a
divisória entre eles, e merece a outra cor da marca.

## Quatro armadilhas que só apareceram na tela

Ficam registradas porque nenhuma aparece lendo o código:

1. **`base.css` estiliza o elemento `nav`**, não uma classe — a vitrine tem
   exatamente um. O portal tem três (barra, trilho, migalhas), e os dois de
   dentro herdaram `position:fixed` e viraram uma segunda barra por cima do
   conteúdo. Neutralizado em `portal.css`, e não em `base.css`, que precisa
   continuar sincronizável com a vitrine.
2. **`[hidden]` perde para `.btn{display:inline-flex}`** — a regra do navegador
   tem especificidade zero. O botão "Tentar de novo" aparecia antes de existir o
   que refazer.
3. **O navegador não sabe que a página é escura.** O portal é escuro porque o
   CSS pinta tudo de escuro — e nada disso conta para o navegador, que continua
   desenhando o que é *dele* com o tema do sistema: a barra de rolagem, o
   `<select>`, o botão de limpar do campo de busca. Faltava `color-scheme`.

   O sintoma não é igual em todo lugar, e foi assim que ele passou: no Firefox
   a barra fina é discreta o bastante para ninguém reparar; no Chromium — logo
   no Brave, no Chrome e no Edge — ela é uma faixa cinza-clara no meio da tela
   escura. Um mesmo defeito, visível em metade dos navegadores.

   A vitrine já sabia metade disso: onde ela deixa uma barra à mostra
   (`.cursos-rol`), declara `scrollbar-width` **e** `scrollbar-color` juntos. O
   trilho do portal tinha copiado só a primeira. Agora há `color-scheme` na
   raiz seguindo o tema, a cor declarada em cada contêiner rolável, e um teste
   que **varre a página inteira** procurando qualquer elemento que role com a
   cor do sistema — em vez de uma lista escrita à mão que envelhece.

4. **`base.css` nunca reseta o elemento `button`** — cada componente da vitrine
   declara o próprio fundo (`.tema`, `.burger`, `.nav-cta`). Todo botão novo
   precisa declarar o dele, senão herda o cinza claro do navegador. Foi o que
   deixou a lupa, o avatar e as setas da ordenação brancos sobre o tema escuro:
   um sintoma só, três lugares, uma causa.

## O que vem depois

- **Servidor**: autenticação, progresso por aluno, execução de código em
  contêiner descartável e o CAS para `resposta-expressao`.
- **Conteúdo real**: religar `ferramentas/exercicios` do repo da vitrine e
  ingerir os JSON aprovados, começando pelos `_verificacao: criticado`.
- **Os vídeos.** O quadro já está reservado nas seções que declararam `video`,
  com a duração e o layout de ponta a ponta prontos. Falta o id.
- **A unidade INTERMEDIÁRIA de certificação.** Já existem duas: curso e trilha.
  Falta saber se existe algo entre um curso de 40h e uma trilha de 400h. O
  README da vitrine deixa quatro perguntas em aberto sobre isso — o eixo, o
  nome, a âncora e o custo de tradução — e registra a armadilha: cortar por
  nível repetiria o erro do caso Go. O custo só salta no primeiro certificado
  emitido para aluno real.
- **Banco de questões de prova separado**, se e quando o sorteio do banco das
  aulas deixar de bastar. Hoje ele basta e não custa manutenção nenhuma.
