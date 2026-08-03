/* ==========================================================================
   Conteúdo das aulas — as seções de cada tópico.

   POR QUE ESTE ARQUIVO EXISTE, E NÃO UM CAMPO EM dados.js
   Um tópico do catálogo não é um assunto: é um punhado deles. Metade dos 1.503
   tópicos enumera três ou mais assuntos no próprio título ("Hospedagem:
   compartilhada, VPS, nuvem e CDN"), e a carga média por tópico é de 4 horas —
   que não é uma página. O autor já dividiu a aula, em prosa; o portal precisava
   parar de ignorar isso.

   `dados.js` é cópia do catálogo da vitrine, e o modal de lá renderiza
   `topicos` como lista plana. Mudar a forma daquele campo quebraria o contrato
   entre os dois repositórios pelo único motivo que não vale — conveniência.
   Então as seções moram aqui, com a MESMA chave de junção dos exercícios:
   curso + o texto do tópico EM PORTUGUÊS. (O título exibido é traduzido em
   runtime e não serve de chave — ver `aulasDoCurso` em app/catalogo.js.)

   AS SEÇÕES SÃO ESCRITAS, NUNCA DERIVADAS
   Dava para quebrar o título no `:` e nas vírgulas e ganhar 734 divisões de
   graça. Não se faz. É heurística léxica sobre prosa autoral, e o projeto já
   pagou para aprender que isso não funciona: em REGRAS.md, a conferência de
   "exige tópico posterior" foi tentada assim, acusou 5 dos 48 exercícios bons e
   foi descartada com a conclusão de que "a resposta está na autoria, não na
   detecção". Aqui falharia igual — "Cliente, servidor e host: quem pede e quem
   responde" viraria uma seção chamada "quem pede e quem responde".
   A enumeração no título é evidência de que as seções são necessárias; não é
   fonte para lê-las.

   FORMA
     window.AULAS[cursoId][tópico em pt] = [ seção, ... ]

   Há um arquivo por curso, como o pipeline faz com os exercícios, e cada um
   MESCLA no objeto em vez de atribuí-lo: nenhum pode depender de ser o
   primeiro a carregar.
     seção = { id, titulo, corpo, video? }
       `id`    chave curta e estável — é ela que entra na URL e no progresso
       `corpo` lista de parágrafos; um item que é lista vira <ul>
       `video` opcional: id do YouTube. Ausente = sem quadro de vídeo. Não se
               reserva espaço vazio em toda seção, que seriam milhares.

     Marcação no texto: `crase` vira código, **asteriscos** viram negrito.
     Nada além disso — é o subconjunto que o conteúdo usa.

   Aula sem entrada aqui cai numa seção única com o conteúdo que houver, então
   o portal funciona igual para os 85 cursos que ainda não foram escritos. A
   seção de avaliação é acrescentada pelo código quando o tópico tem
   exercícios — não se escreve aqui, e tópico sem exercício não ganha uma
   página vazia.

   ESTADO: conteúdo de exemplo. Foi escrito para avaliar a estrutura e é
   tecnicamente correto, mas não passou por revisão pedagógica. A escola
   reescreve.
   ========================================================================== */

window.AULAS = Object.assign(window.AULAS || {}, {

  'web-fundamentos': {

    /* --------------------------------------------------------------- 01 */
    'Cliente, servidor e host: quem pede e quem responde': [
      {
        id: 'papeis',
        titulo: 'Os dois papéis',
        corpo: [
          'Quase tudo o que acontece na internet é uma conversa entre duas partes com papéis fixos. O **cliente** pede; o **servidor** responde. Seu navegador é um cliente. O computador que guarda o site é um servidor.',
          'Os papéis são do momento, não da máquina. Um servidor web que precisa consultar um banco de dados vira cliente do banco naquele instante. O mesmo computador pode ser cliente numa conversa e servidor noutra, ao mesmo tempo.',
          'A consequência prática é que **o cliente sempre inicia**. Um servidor não manda página para o seu navegador por conta própria: ele espera ser perguntado. Quando uma página parece receber dados sozinha — uma notificação, um chat —, há uma conexão que o cliente abriu antes e deixou aberta.',
        ],
      },
      {
        id: 'host',
        titulo: 'O que é um host',
        corpo: [
          '**Host** é qualquer máquina com endereço na rede. É o termo neutro, usado quando não importa se aquela máquina está pedindo ou respondendo — o notebook, o celular, o servidor e a impressora de rede são todos hosts.',
          'A distinção importa porque cliente e servidor são papéis, e host é identidade. Uma frase como "o host não responde" fala da máquina; "o servidor não responde" fala do programa que deveria estar atendendo naquela máquina. Confundir os dois manda diagnóstico para o lado errado: cabo e energia de um lado, processo derrubado do outro.',
        ],
      },
      {
        id: 'ida-e-volta',
        titulo: 'A viagem de ida e volta',
        corpo: [
          'Digitar um endereço e ver a página aparecer esconde uma sequência que vale conhecer inteira, porque é ela que o resto do curso destrincha:',
          [
            'o navegador descobre o **endereço** do servidor a partir do nome (é o DNS, aula 08);',
            'abre uma **conexão** até ele (aula 02);',
            'manda um **pedido** dizendo o que quer (aula 06);',
            'recebe uma **resposta** com o conteúdo e um código de status;',
            'monta a página com o que veio, pedindo o resto conforme descobre que precisa (aula 10).',
          ],
          'Cada etapa pode falhar de um jeito diferente, e cada uma tem uma ferramenta própria de diagnóstico. É por isso que "o site não abre" nunca é um problema só.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Pacote, quadro (frame) e socket': [
      {
        id: 'pacote',
        titulo: 'Pacote: por que os dados vão picados',
        corpo: [
          'Nada atravessa a rede inteiro. Um vídeo de 2 GB é cortado em milhares de **pacotes**, cada um com um pedaço do conteúdo e um cabeçalho dizendo de onde veio e para onde vai.',
          'A razão é de convivência: se um arquivo grande viajasse em bloco, ele ocuparia o caminho até terminar e todo o resto esperaria. Picado, os pacotes de várias conversas se intercalam, e uma transferência longa não impede uma curta de passar.',
          'A outra razão é a falha. Um pacote perdido custa reenviar alguns kilobytes; um arquivo perdido custa reenviar o arquivo. E como cada pacote sabe seu destino, cada um pode tomar um caminho diferente — se um trecho da rede cai no meio da transmissão, os seguintes desviam sem que a conversa recomece.',
        ],
      },
      {
        id: 'quadro',
        titulo: 'Quadro: o pacote dentro do cabo',
        corpo: [
          'O **quadro** (ou *frame*) é o envelope do enlace local — o que trafega de fato no cabo Ethernet ou no ar do Wi-Fi. Dentro dele vai o pacote.',
          'A diferença entre os dois é o alcance do endereço. O pacote carrega o endereço IP do destino **final**, que pode estar do outro lado do planeta e não muda no caminho. O quadro carrega o endereço MAC do **próximo salto**, que quase sempre é o seu roteador, e é reescrito a cada trecho da viagem.',
          'É a diferença entre o endereço no envelope e a placa do caminhão que o transporta agora. O envelope atravessa a viagem toda; o caminhão muda em cada centro de distribuição.',
        ],
      },
      {
        id: 'socket',
        titulo: 'Socket: o endereço de um programa',
        corpo: [
          'O IP encontra a máquina, mas uma máquina roda dezenas de programas em rede ao mesmo tempo. Quem separa é a **porta**, um número que identifica qual programa deve receber aquele dado.',
          'A dupla `IP:porta` é o **socket** — `192.168.0.10:443`, por exemplo. Uma conexão é identificada por quatro coisas: IP e porta de origem, IP e porta de destino. Como a porta de origem muda a cada conexão nova, você pode abrir dez abas do mesmo site sem que as respostas se misturem.',
          'Portas comuns valem decorar: `80` para HTTP, `443` para HTTPS, `22` para SSH, `5432` para PostgreSQL. Quando um serviço "não responde" e a máquina está no ar, quase sempre a pergunta certa é se alguém está escutando naquela porta.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Largura de banda, latência e vazão (throughput)': [
      {
        id: 'banda',
        titulo: 'Largura de banda é o cano, não a velocidade',
        corpo: [
          '**Largura de banda** é quanto cabe por segundo no caminho — o diâmetro do cano. Mede-se em bits por segundo: 300 Mbps são 300 milhões de bits, ou uns 37 MB, por segundo.',
          'Repare na unidade, porque é onde quase todo mundo se confunde: o provedor anuncia em **bits** (Mbps) e o navegador mostra o download em **bytes** (MB/s). São oito para um. Uma conexão de 300 Mbps baixando a 37 MB/s está no máximo, não a um oitavo dele.',
        ],
      },
      {
        id: 'latencia',
        titulo: 'Latência é o tempo da viagem',
        corpo: [
          '**Latência** é quanto demora para um dado sair daqui e chegar lá — e o número que se costuma medir, o *ping*, é a ida e volta. Ela depende sobretudo da distância física e do número de equipamentos no caminho, e por isso **banda não a conserta**.',
          'Um cano mais grosso não encurta a estrada. Contratar 1 Gbps não aproxima um servidor que está na Europa: a luz leva o tempo que leva, e 150 ms continuam sendo 150 ms.',
          'É por isso que latência dói mais em coisas conversadas — jogo, chamada de vídeo, um site que faz vinte pedidos em sequência — e quase não aparece num download grande, que enche o cano uma vez e segue.',
        ],
      },
      {
        id: 'vazao',
        titulo: 'Vazão é o que você realmente conseguiu',
        corpo: [
          '**Vazão** (*throughput*) é a taxa observada de verdade, e ela costuma ficar abaixo da largura de banda. A diferença é onde mora o problema real: congestionamento no caminho, perda de pacotes forçando reenvio, um servidor lento do outro lado, ou o próprio protocolo esperando confirmação.',
          'Uma analogia que se paga: a **banda** é quantas faixas tem a estrada, a **latência** é o tempo de percorrê-la, e a **vazão** é quantos carros efetivamente chegaram. Estrada larga com engarrafamento entrega pouco.',
          'Diagnóstico prático: se a vazão está baixa **e** a latência normal, suspeite do outro lado ou de perda. Se a latência está alta, nenhuma contratação de banda vai resolver — o problema é distância ou fila.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'Endereço IP, endereço MAC e ARP': [
      {
        id: 'ip',
        titulo: 'IP: o endereço que muda de lugar',
        corpo: [
          'O **endereço IP** diz onde a máquina está na rede — e, como um endereço postal, ele descreve uma posição, não um objeto. Levar o notebook para outra rede troca o IP dele.',
          'O IPv4 tem quatro números de 0 a 255 (`192.168.0.10`) e são só 4,3 bilhões de combinações, que acabaram. O IPv6 resolve com 128 bits (`2001:db8::1`) — espaço que não acaba em nenhum cenário previsível.',
          'Enquanto isso, faixas **privadas** (`10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`) são reutilizadas dentro de cada rede local e não existem na internet. O roteador faz a tradução (NAT) — é por isso que sua máquina se enxerga como `192.168.0.10` e um site vê o IP público do seu provedor.',
        ],
      },
      {
        id: 'mac',
        titulo: 'MAC: a identidade da placa',
        corpo: [
          'O **endereço MAC** (`a4:83:e7:1c:0b:22`) vem gravado na placa de rede e, ao contrário do IP, acompanha o equipamento para onde ele for. É identidade, não posição.',
          'Ele só tem significado dentro do enlace local: nenhum roteador encaminha por MAC entre redes. Por isso o servidor de um site jamais vê o MAC do seu notebook — a rede dele vê o MAC do último roteador do caminho.',
          'É a mesma distinção do quadro e do pacote, uma aula atrás, vista do lado do endereço: IP é para onde a coisa vai, MAC é quem a entrega no trecho atual.',
        ],
      },
      {
        id: 'arp',
        titulo: 'ARP: a ponte entre os dois',
        corpo: [
          'Para entregar um quadro na rede local a máquina precisa do MAC de quem tem aquele IP — e é isso que o **ARP** descobre. Ele grita na rede "quem tem `192.168.0.1`?", e a dona responde com o próprio MAC.',
          'A resposta fica num cache por alguns minutos, senão cada pacote custaria uma pergunta. Dá para ver o seu com `arp -a`.',
          'Vale saber que o ARP não confere nada: quem responder primeiro é acreditado. É a base do ataque de *ARP spoofing*, em que uma máquina responde no lugar do roteador e passa a receber o tráfego da rede — o motivo pelo qual usar HTTPS em rede pública deixa de ser recomendação e vira necessidade.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 05 */
    'Redes em camadas: do cabo até o navegador': [
      {
        id: 'porque-camadas',
        titulo: 'Por que dividir em camadas',
        corpo: [
          'A rede é organizada em camadas onde cada uma resolve um problema e usa a de baixo sem saber como ela funciona. É a razão de você poder trocar Wi-Fi por cabo sem reescrever o navegador: o que mudou foi a camada de baixo, e as de cima nem ficaram sabendo.',
          'Também é o que permite a internet ter sido inventada antes da fibra óptica e do 5G. As camadas de cima continuaram valendo quando as de baixo foram trocadas por completo.',
        ],
      },
      {
        id: 'as-camadas',
        titulo: 'As quatro que importam na prática',
        corpo: [
          'O modelo OSI tem sete camadas e é bom para estudar. No dia a dia, quatro explicam quase tudo:',
          [
            '**Enlace** — o quadro no cabo ou no ar. Endereço MAC, Ethernet, Wi-Fi.',
            '**Rede** — o pacote atravessando redes diferentes. Endereço IP, roteamento.',
            '**Transporte** — a conversa entre dois programas. Portas, TCP e UDP.',
            '**Aplicação** — o que os programas falam entre si. HTTP, DNS, SMTP.',
          ],
          'Cada camada envelopa a de cima: o quadro contém o pacote, que contém o segmento, que contém o pedido HTTP. É literalmente uma boneca russa, e é assim que o Wireshark mostra qualquer captura.',
        ],
      },
      {
        id: 'tcp-udp',
        titulo: 'TCP e UDP: garantir ou não esperar',
        corpo: [
          'A camada de transporte tem duas escolhas, e a diferença é o que cada uma promete.',
          '**TCP** garante entrega, ordem e integridade: confirma cada pedaço, reenvia o que se perdeu e remonta na sequência certa. Custa uma conexão para estabelecer e espera pelo que faltou. É o que HTTP usa — uma página com metade do HTML não serve para nada.',
          '**UDP** não promete nada: manda e segue. Custa quase nada e não espera ninguém. É o que chamada de vídeo e jogo usam, porque num vídeo ao vivo o quadro atrasado já não tem serventia — melhor perder do que travar a imagem esperando por ele.',
          'A regra de bolso: se o dado incompleto é inútil, TCP. Se o dado atrasado é inútil, UDP.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 06 */
    'HTTP e HTTPS: métodos, cabeçalhos e códigos de status': [
      {
        id: 'metodos',
        titulo: 'Métodos: o verbo do pedido',
        corpo: [
          'Todo pedido HTTP começa por um verbo que diz a intenção. Os que aparecem sempre:',
          [
            '`GET` — me dê. Não deve alterar nada no servidor.',
            '`POST` — tome isto, e crie ou processe algo.',
            '`PUT` — substitua o recurso por isto.',
            '`PATCH` — altere só estes campos.',
            '`DELETE` — remova.',
          ],
          'A promessa de que `GET` não altera nada não é formalidade. Navegadores, proxies e buscadores repetem `GET` à vontade — pré-carregam links, revalidam cache, rastreiam páginas. Uma aplicação que apagasse um registro via `GET` seria esvaziada pelo próprio rastreador do Google, e já aconteceu com gente grande.',
        ],
      },
      {
        id: 'cabecalhos',
        titulo: 'Cabeçalhos: os metadados da conversa',
        corpo: [
          'Pedido e resposta carregam **cabeçalhos** — pares de nome e valor que descrevem o conteúdo e as condições, sem fazer parte dele.',
          'No pedido, os que mais aparecem são `Host` (qual site, já que um servidor hospeda vários), `Accept` (que formatos servem), `Authorization` (a credencial) e `Cookie`. Na resposta, `Content-Type` (o que é isto), `Cache-Control` (por quanto tempo guardar) e `Set-Cookie`.',
          '`Content-Type` errado é uma das causas mais comuns de "funciona no meu servidor e não no outro": o mesmo arquivo servido como `text/plain` em vez de `text/css` faz o navegador recusar a folha de estilo, e a página aparece sem estilo nenhum, sem erro visível.',
        ],
      },
      {
        id: 'status',
        titulo: 'Códigos de status: as cinco famílias',
        corpo: [
          'A resposta começa com um número de três dígitos, e o primeiro dígito já classifica:',
          [
            '**1xx** — informativo, raro no dia a dia.',
            '**2xx** — deu certo. `200 OK`, `201 Created`, `204 No Content`.',
            '**3xx** — está em outro lugar. `301` permanente, `302` temporário, `304` não mudou desde a última vez.',
            '**4xx** — o pedido está errado. `400` malformado, `401` não autenticado, `403` autenticado mas sem permissão, `404` não existe, `429` pedindo demais.',
            '**5xx** — o servidor falhou. `500` erro interno, `502` o servidor de trás respondeu mal, `503` fora do ar, `504` o servidor de trás não respondeu a tempo.',
          ],
          'A fronteira que mais se erra é 4xx contra 5xx: **4xx é culpa de quem pediu, 5xx é culpa de quem responde**. E `401` contra `403`: o primeiro diz "não sei quem você é", o segundo diz "sei quem você é, e você não pode".',
        ],
      },
      {
        id: 'https',
        titulo: 'HTTPS: o mesmo HTTP, dentro de um túnel',
        corpo: [
          '**HTTPS é HTTP passando por TLS.** Os métodos, cabeçalhos e códigos são idênticos; o que muda é que tudo isso viaja cifrado.',
          'O TLS entrega três coisas ao mesmo tempo, e vale saber quais: **confidencialidade** (ninguém no caminho lê), **integridade** (ninguém altera sem se denunciar) e **autenticidade** (o certificado prova que aquele servidor é mesmo o dono do domínio). É a terceira que o cadeado representa — e é por isso que cadeado não significa "site confiável", significa "é mesmo o site cujo nome está na barra".',
          'O que o TLS **não** esconde: o nome do domínio que você acessou e o volume de dados trafegado ficam visíveis para a rede. O caminho, os parâmetros e o conteúdo, não.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 07 */
    'Cookies, sessões e cache do navegador': [
      {
        id: 'cookies',
        titulo: 'Cookies: a memória que o HTTP não tem',
        corpo: [
          'HTTP não lembra de nada: cada pedido chega como se fosse o primeiro. O **cookie** é a gambiarra que virou fundação — o servidor manda um `Set-Cookie` e o navegador devolve aquele valor em todo pedido seguinte para aquele domínio.',
          'Os atributos são o que separa cookie seguro de problema de segurança. `HttpOnly` impede o JavaScript da página de ler o valor, o que limita o estrago de um XSS. `Secure` impede o envio fora do HTTPS. `SameSite` controla se o cookie viaja em pedidos que partem de outro site, que é a defesa contra CSRF.',
        ],
      },
      {
        id: 'sessoes',
        titulo: 'Sessão: o cookie que não carrega o segredo',
        corpo: [
          'Guardar dados de verdade no cookie é má ideia — o usuário edita o que quiser. O padrão é o cookie carregar só um **identificador de sessão** aleatório, e o servidor guardar os dados associados a ele.',
          'Daí a consequência que aparece no primeiro deploy sério: se a aplicação roda em dois servidores e a sessão está na memória de um deles, metade dos pedidos não encontra a sessão e o usuário "cai" aleatoriamente. Por isso sessão em produção mora em lugar compartilhado — Redis, banco — ou não existe, e o estado vai num token assinado.',
          'Sair de verdade é invalidar a sessão **no servidor**. Apagar o cookie só some com a chave; se alguém tiver copiado o identificador antes, ele continua valendo.',
        ],
      },
      {
        id: 'cache',
        titulo: 'Cache: não pedir de novo o que não mudou',
        corpo: [
          'O jeito mais rápido de carregar um arquivo é não carregá-lo. O **cache** guarda a resposta e a reutiliza enquanto ela valer, e quem manda nisso é o servidor, pelo `Cache-Control`.',
          '`max-age=3600` diz "vale por uma hora, nem pergunte". `no-cache` diz "pode guardar, mas confirme antes de usar" — o navegador manda um pedido condicional e recebe `304 Not Modified` se nada mudou, o que economiza o corpo inteiro. `no-store` diz "não guarde", e é o certo para página de extrato bancário.',
          'A tensão prática é entre cachear muito (rápido, mas o usuário vê a versão velha) e pouco (sempre atual, mas lento). A saída padrão é o **nome com impressão digital**: `app.9f2c1a.css` pode ser cacheado por um ano, porque qualquer alteração muda o nome do arquivo e o HTML passa a apontar para outro.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 08 */
    'Domínios: registro, DNS, propagação e subdomínios': [
      {
        id: 'registro',
        titulo: 'Registro: você aluga, não compra',
        corpo: [
          'Um domínio é **alugado**, por um a dez anos, junto a um registrador credenciado. No `.br` quem controla é o Registro.br; nos genéricos (`.com`, `.org`) são registradores comerciais.',
          'Não renovar é a forma mais comum e mais cara de perder um domínio: o nome volta ao mercado, e com ele os e-mails e os links de anos. Renovação automática e o e-mail de contato do registro atualizado valem mais do que parecem.',
          'O nome se lê da direita para a esquerda: em `portal.codeschool.ing`, `.ing` é o topo, `codeschool` é o que se registra, e `portal` é um subdomínio que você cria à vontade, sem pagar nada a mais.',
        ],
      },
      {
        id: 'dns',
        titulo: 'DNS: a tradução de nome para endereço',
        corpo: [
          'O **DNS** é o serviço que responde "qual o IP de `codeschool.ing`?". Ele é hierárquico: a pergunta sobe até quem sabe, e a resposta desce sendo guardada em cache no caminho.',
          'Os tipos de registro que se usa toda semana:',
          [
            '`A` — aponta o nome para um IPv4. `AAAA` faz o mesmo para IPv6.',
            '`CNAME` — diz "este nome é apelido daquele". Não pode existir na raiz do domínio.',
            '`MX` — para onde vai o e-mail deste domínio.',
            '`TXT` — texto livre; é onde vivem as provas de posse e as regras antifraude de e-mail (SPF, DKIM).',
          ],
          'A restrição do `CNAME` na raiz é a que mais aparece na prática: para apontar `codeschool.ing` (sem `www`) a um serviço hospedado, ou se usa `A` com IPs fixos, ou o provedor oferece um `ALIAS`/`ANAME`, que é uma extensão fora do padrão.',
        ],
      },
      {
        id: 'propagacao',
        titulo: 'Propagação: por que a mudança demora',
        corpo: [
          'Alterou o DNS e o site velho continua aparecendo? Isso é o cache fazendo o trabalho dele. Cada registro tem um **TTL** — o tempo que os servidores do mundo podem guardar a resposta antes de perguntar de novo.',
          'Nada "se espalha": o registro novo já está no ar desde o primeiro segundo. O que demora é os caches antigos expirarem, e o teto disso é o TTL que estava valendo **antes** da mudança.',
          'Daí a manobra padrão de quem vai migrar: baixar o TTL para uns cinco minutos **um dia antes**, fazer a troca, conferir e só então voltar o TTL para horas. Baixar o TTL depois de mudar não adianta nada — os caches já pegaram o valor antigo.',
        ],
      },
      {
        id: 'subdominios',
        titulo: 'Subdomínios: quando separar',
        corpo: [
          'Subdomínio é de graça e ilimitado, então a pergunta nunca é "posso?", é "devo?". `app.exemplo.com` e `exemplo.com/app` resolvem a mesma necessidade de formas diferentes.',
          'Subdomínio separa de verdade: cada um pode apontar para um servidor diferente, ter certificado próprio e, para muitos efeitos de segurança, é tratado como outro site — cookie de um não é enviado ao outro por padrão. É o que se quer para o painel administrativo, para a API e para o ambiente de teste.',
          'Caminho na mesma origem compartilha tudo — sessão, cookie, certificado — e evita a configuração extra. É o que se quer quando as partes são o mesmo produto e conversam o tempo todo.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 09 */
    'Hospedagem: compartilhada, VPS, nuvem e CDN': [
      {
        id: 'compartilhada',
        titulo: 'Hospedagem compartilhada',
        corpo: [
          'Um servidor, dezenas ou centenas de sites, todos dividindo o mesmo sistema operacional e os mesmos recursos. Você recebe um painel, uma pasta e um banco de dados; o provedor cuida do resto.',
          'É a opção mais barata e a que exige menos conhecimento — e o preço disso é o controle. Não se instala o que se quer, a versão de linguagem é a que estiver lá, e o **vizinho barulhento** é real: um site vizinho recebendo um pico de acesso derruba o desempenho do seu, sem que você tenha feito nada.',
          'Continua sendo a escolha certa para site institucional, blog e loja pequena. Deixa de ser quando você precisa de um processo rodando o tempo todo, de uma dependência específica ou de garantir desempenho.',
        ],
      },
      {
        id: 'vps',
        titulo: 'VPS: a máquina que é sua',
        corpo: [
          'Um **VPS** é uma fatia virtualizada de um servidor físico, com sistema operacional próprio e recursos reservados. Você entra por SSH e é administrador — instala o que quiser, escolhe as versões, abre as portas que precisar.',
          'O que muda de verdade não é a potência: é **de quem é a responsabilidade**. Atualização de segurança, firewall, backup, certificado, monitoramento — tudo isso passa a ser seu. Um VPS esquecido por seis meses é uma máquina invadida esperando acontecer.',
          'A conta que vale fazer antes de migrar: o VPS costuma custar pouco mais que a hospedagem compartilhada em dinheiro, e muito mais em horas. Se ninguém no time vai cuidar dele, o compartilhado ou uma plataforma gerenciada entregam mais.',
        ],
      },
      {
        id: 'nuvem',
        titulo: 'Nuvem: pagar pelo que se usa',
        corpo: [
          'A nuvem — AWS, Azure, Google Cloud e afins — vende **recursos sob demanda**: você cria dez servidores em um minuto e os destrói em outro, pagando pelo tempo em que existiram. É a mesma ideia do VPS levada ao extremo da elasticidade, com um catálogo de serviços prontos em volta (banco gerenciado, fila, armazenamento, autenticação).',
          'A vantagem real é acompanhar demanda que varia: uma loja que triplica o tráfego na Black Friday sobe capacidade naquele dia e devolve na semana seguinte. Uma loja de tráfego constante não ganha nada com isso — e provavelmente paga mais caro que num VPS.',
          'Os dois custos que surpreendem quem chega: **transferência de dados para fora** costuma ser cobrada e some da estimativa inicial, e a complexidade sobe rápido. Uma arquitetura de nuvem mal dimensionada é mais cara e mais frágil que uma máquina só bem cuidada.',
        ],
      },
      {
        id: 'cdn',
        titulo: 'CDN: aproximar o conteúdo de quem pede',
        corpo: [
          'Uma **CDN** é uma rede de servidores espalhados pelo mundo que guardam cópias do seu conteúdo. Quem acessa de Lisboa recebe do nó de Lisboa, não do seu servidor em São Paulo.',
          'Ela ataca exatamente o problema que largura de banda não resolve, três aulas atrás: **latência é distância**, e a única forma de reduzi-la é encurtar o caminho. Para arquivos estáticos — imagem, CSS, JavaScript, vídeo — o ganho é grande e a configuração é pequena.',
          'A CDN não substitui a hospedagem: ela fica na frente dela. O seu servidor continua existindo e respondendo pelo que é dinâmico e pelo que a CDN ainda não tem em cache — é o que se chama de **origem**.',
          'O efeito colateral que morde: como a CDN guarda cópias, publicar uma versão nova nem sempre aparece na hora. Ou se invalida o cache no deploy, ou se usa nome com impressão digital no arquivo — a mesma solução da aula de cache, agora em escala mundial.',
        ],
      },
      {
        id: 'escolher',
        titulo: 'Como escolher',
        corpo: [
          'As quatro opções não formam uma escada em que a última é a melhor: elas respondem a perguntas diferentes.',
          [
            '**Quanto controle você precisa?** Instalar coisas e rodar processos próprios já exclui o compartilhado.',
            '**Quem vai administrar?** Sem alguém responsável por atualização e backup, gerenciado ganha de VPS.',
            '**A demanda varia muito?** Se sim, a elasticidade da nuvem se paga. Se não, ela é custo sem contrapartida.',
            '**Seu público está longe?** Então CDN, independentemente de qual das três estiver atrás.',
          ],
          'E vale dizer o que este curso mesmo faz: a vitrine da escola é um site estático publicado no GitHub Pages, que é hospedagem gerenciada com CDN embutida, de graça. Para HTML, CSS e JavaScript sem servidor, é difícil justificar mais que isso.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 10 */
    'Como o navegador monta a página: DOM, CSSOM e renderização': [
      {
        id: 'dom',
        titulo: 'DOM: o HTML virando árvore',
        corpo: [
          'O navegador lê o HTML e constrói o **DOM** — uma árvore de objetos em que cada elemento é um nó com pai, filhos e propriedades. O HTML é o texto; o DOM é o que existe na memória depois de interpretá-lo.',
          'A distinção importa porque o DOM não é obrigado a se parecer com o arquivo. Ele é corrigido na montagem (uma tag mal fechada é remendada) e alterado depois, pelo JavaScript. Por isso "ver o código-fonte" e "inspecionar o elemento" podem mostrar coisas diferentes — o primeiro é o texto que veio, o segundo é a árvore como está agora.',
        ],
      },
      {
        id: 'cssom',
        titulo: 'CSSOM e o cálculo de estilo',
        corpo: [
          'O CSS passa pelo mesmo processo e vira o **CSSOM**. Aí o navegador combina as duas árvores para decidir o estilo final de cada nó, resolvendo herança, especificidade e ordem.',
          'É neste ponto que se decide uma disputa como a que este portal enfrentou: uma regra do navegador para `[hidden]` tem especificidade zero e perde para qualquer classe que declare `display`. Nada disso é visível no arquivo CSS — só no estilo computado.',
          'CSS **bloqueia a renderização** de propósito: mostrar a página sem estilo e reestilizá-la depois piscaria a tela inteira. Por isso folha de estilo grande atrasa a primeira pintura, e por isso `<link>` de CSS fica no `<head>`.',
        ],
      },
      {
        id: 'renderizacao',
        titulo: 'Layout, pintura e composição',
        corpo: [
          'Com estilo resolvido, faltam três passos: **layout** calcula a posição e o tamanho de cada caixa, **pintura** desenha os pixels, e **composição** junta as camadas na tela.',
          'O custo de cada um é bem diferente, e é isso que separa animação suave de animação travada. Mudar `width` ou `top` refaz o layout de tudo o que estiver em volta. Mudar `background-color` só repinta. Mudar `transform` ou `opacity` mexe só na composição, que a placa de vídeo faz sozinha.',
          'Daí a regra prática mais rentável do front-end: **anime `transform` e `opacity`**, não `left`, `top` ou `width`.',
        ],
      },
      {
        id: 'scripts',
        titulo: 'Onde o JavaScript entra',
        corpo: [
          'Um `<script>` comum **para a montagem do DOM** enquanto baixa e executa, porque ele pode alterar a árvore que está sendo construída. Script no topo do `<head>` é a receita clássica de página em branco.',
          'Dois atributos resolvem: `defer` baixa em paralelo e executa depois do HTML montado, preservando a ordem entre scripts; `async` baixa em paralelo e executa assim que chegar, sem garantir ordem nenhuma.',
          '`defer` é o padrão certo para o código da própria página, e é também o comportamento de um `<script type="module">` — o que explica por que este portal pode chamar `document.querySelector` no topo do módulo sem esperar por evento nenhum.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 11 */
    'Ferramentas do desenvolvedor: rede, console e elementos': [
      {
        id: 'elementos',
        titulo: 'Elementos: o DOM ao vivo',
        corpo: [
          'A aba **Elementos** mostra o DOM como ele está agora, não como o arquivo veio — e deixa editar tudo ali mesmo, o que é a forma mais rápida de testar uma ideia de layout sem tocar no código.',
          'O painel de estilos ao lado é onde se resolve "por que esta regra não pega": ele lista todas as declarações que atingem o elemento, rasura as que perderam e mostra de qual arquivo e linha cada uma veio. A aba de estilo **computado** dá a palavra final, com o valor que realmente valeu.',
          'O modelo de caixa desenhado embaixo — conteúdo, padding, borda, margem — responde quase toda pergunta de espaçamento em dois segundos.',
        ],
      },
      {
        id: 'console',
        titulo: 'Console: erros e experimentos',
        corpo: [
          'O **Console** é o primeiro lugar a olhar quando algo não funciona, e o mais ignorado por quem está começando. Erro de JavaScript, arquivo que não carregou, recurso bloqueado — tudo aparece ali, e quase sempre com a linha exata.',
          'Ele também é um ambiente de execução: dá para inspecionar variáveis, chamar funções da página e testar um seletor antes de escrevê-lo no código. `$0` refere-se ao elemento selecionado na aba Elementos.',
          'Um aviso que vale: nunca cole código que um desconhecido mandou colar no console. Ele roda com todos os privilégios da página aberta, inclusive os seus cookies de sessão — é um golpe comum o bastante para alguns sites imprimirem um aviso ali.',
        ],
      },
      {
        id: 'rede',
        titulo: 'Rede: o que foi pedido e o que voltou',
        corpo: [
          'A aba **Rede** lista cada pedido que a página fez, com método, status, tamanho e tempo. É onde se confirma, em vez de supor, quase tudo o que este curso apresentou.',
          'O que olhar primeiro: o **status** (4xx é seu, 5xx é do servidor), o **tempo** dividido entre espera e transferência — que separa servidor lento de conexão lenta —, e a coluna de **tamanho**, onde uma resposta servida do cache aparece como tal em vez de trafegar de novo.',
          'Duas opções mudam o diagnóstico: *Disable cache* força tudo a ser buscado, mostrando como é a primeira visita de um usuário novo; e a limitação de velocidade simula uma conexão ruim, que é a única forma honesta de saber como o site se comporta fora do seu Wi-Fi.',
        ],
      },
    ],
  },
});
