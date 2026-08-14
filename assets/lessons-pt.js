/* ==========================================================================
   codeschool.ing — the lesson content in Portuguese.

   The lessons were authored in Portuguese and English is the source language
   now, so this file is where that Portuguese went. It is a translation like
   the catalogue's, and it is read the same way: a field that is missing here
   falls back to the English in assets/lessons-*.js.

   Keyed by course id, then by the topic title that joins a lesson to the
   catalogue, then by SECTION ID — the one part of a section that is a stable
   identifier and not prose.

   `body` is replaced whole, not merged: a paragraph list translated halfway
   would read as two languages in one section.
   ========================================================================== */

window.I18N = window.I18N || {};
window.I18N.pt = window.I18N.pt || {};
window.I18N.pt.lessons = {
  "web-fundamentals": {
    "Client, server and host: who asks and who answers": {
      "intro": {
        "title": "Apresentação"
      },
      "roles": {
        "title": "Os dois papéis",
        "body": [
          "Quase tudo o que acontece na internet é uma conversa entre duas partes com papéis fixos. O **cliente** pede; o **servidor** responde. Seu navegador é um cliente. O computador que guarda o site é um servidor.",
          "Os papéis são do momento, não da máquina. Um servidor web que precisa consultar um banco de dados vira cliente do banco naquele instante. O mesmo computador pode ser cliente numa conversa e servidor noutra, ao mesmo tempo.",
          "A consequência prática é que **o cliente sempre inicia**. Um servidor não manda página para o seu navegador por conta própria: ele espera ser perguntado. Quando uma página parece receber dados sozinha — uma notificação, um chat —, há uma conexão que o cliente abriu antes e deixou aberta."
        ]
      },
      "host": {
        "title": "O que é um host",
        "body": [
          "**Host** é qualquer máquina com endereço na rede. É o termo neutro, usado quando não importa se aquela máquina está pedindo ou respondendo — o notebook, o celular, o servidor e a impressora de rede são todos hosts.",
          "A distinção importa porque cliente e servidor são papéis, e host é identidade. Uma frase como \"o host não responde\" fala da máquina; \"o servidor não responde\" fala do programa que deveria estar atendendo naquela máquina. Confundir os dois manda diagnóstico para o lado errado: cabo e energia de um lado, processo derrubado do outro."
        ]
      },
      "round-trip": {
        "title": "A viagem de ida e volta",
        "body": [
          "Digitar um endereço e ver a página aparecer esconde uma sequência que vale conhecer inteira, porque é ela que o resto do curso destrincha:",
          [
            "o navegador descobre o **endereço** do servidor a partir do nome (é o DNS, aula 08);",
            "abre uma **conexão** até ele (aula 02);",
            "manda um **pedido** dizendo o que quer (aula 06);",
            "recebe uma **resposta** com o conteúdo e um código de status;",
            "monta a página com o que veio, pedindo o resto conforme descobre que precisa (aula 10)."
          ],
          "Cada etapa pode falhar de um jeito diferente, e cada uma tem uma ferramenta própria de diagnóstico. É por isso que \"o site não abre\" nunca é um problema só."
        ]
      }
    },
    "Packet, frame and socket": {
      "packet": {
        "title": "Pacote: por que os dados vão picados",
        "body": [
          "Nada atravessa a rede inteiro. Um vídeo de 2 GB é cortado em milhares de **pacotes**, cada um com um pedaço do conteúdo e um cabeçalho dizendo de onde veio e para onde vai.",
          "A razão é de convivência: se um arquivo grande viajasse em bloco, ele ocuparia o caminho até terminar e todo o resto esperaria. Picado, os pacotes de várias conversas se intercalam, e uma transferência longa não impede uma curta de passar.",
          "A outra razão é a falha. Um pacote perdido custa reenviar alguns kilobytes; um arquivo perdido custa reenviar o arquivo. E como cada pacote sabe seu destino, cada um pode tomar um caminho diferente — se um trecho da rede cai no meio da transmissão, os seguintes desviam sem que a conversa recomece."
        ]
      },
      "frame": {
        "title": "Quadro: o pacote dentro do cabo",
        "body": [
          "O **quadro** (ou *frame*) é o envelope do enlace local — o que trafega de fato no cabo Ethernet ou no ar do Wi-Fi. Dentro dele vai o pacote.",
          "A diferença entre os dois é o alcance do endereço. O pacote carrega o endereço IP do destino **final**, que pode estar do outro lado do planeta e não muda no caminho. O quadro carrega o endereço MAC do **próximo salto**, que quase sempre é o seu roteador, e é reescrito a cada trecho da viagem.",
          "É a diferença entre o endereço no envelope e a placa do caminhão que o transporta agora. O envelope atravessa a viagem toda; o caminhão muda em cada centro de distribuição."
        ]
      },
      "socket": {
        "title": "Socket: o endereço de um programa",
        "body": [
          "O IP encontra a máquina, mas uma máquina roda dezenas de programas em rede ao mesmo tempo. Quem separa é a **porta**, um número que identifica qual programa deve receber aquele dado.",
          "A dupla `IP:porta` é o **socket** — `192.168.0.10:443`, por exemplo. Uma conexão é identificada por quatro coisas: IP e porta de origem, IP e porta de destino. Como a porta de origem muda a cada conexão nova, você pode abrir dez abas do mesmo site sem que as respostas se misturem.",
          "Portas comuns valem decorar: `80` para HTTP, `443` para HTTPS, `22` para SSH, `5432` para PostgreSQL. Quando um serviço \"não responde\" e a máquina está no ar, quase sempre a pergunta certa é se alguém está escutando naquela porta."
        ]
      }
    },
    "Bandwidth, latency and throughput": {
      "bandwidth": {
        "title": "Largura de banda é o cano, não a velocidade",
        "body": [
          "**Largura de banda** é quanto cabe por segundo no caminho — o diâmetro do cano. Mede-se em bits por segundo: 300 Mbps são 300 milhões de bits, ou uns 37 MB, por segundo.",
          "Repare na unidade, porque é onde quase todo mundo se confunde: o provedor anuncia em **bits** (Mbps) e o navegador mostra o download em **bytes** (MB/s). São oito para um. Uma conexão de 300 Mbps baixando a 37 MB/s está no máximo, não a um oitavo dele."
        ]
      },
      "latency": {
        "title": "Latência é o tempo da viagem",
        "body": [
          "**Latência** é quanto demora para um dado sair daqui e chegar lá — e o número que se costuma medir, o *ping*, é a ida e volta. Ela depende sobretudo da distância física e do número de equipamentos no caminho, e por isso **banda não a conserta**.",
          "Um cano mais grosso não encurta a estrada. Contratar 1 Gbps não aproxima um servidor que está na Europa: a luz leva o tempo que leva, e 150 ms continuam sendo 150 ms.",
          "É por isso que latência dói mais em coisas conversadas — jogo, chamada de vídeo, um site que faz vinte pedidos em sequência — e quase não aparece num download grande, que enche o cano uma vez e segue."
        ]
      },
      "throughput": {
        "title": "Vazão é o que você realmente conseguiu",
        "body": [
          "**Vazão** (*throughput*) é a taxa observada de verdade, e ela costuma ficar abaixo da largura de banda. A diferença é onde mora o problema real: congestionamento no caminho, perda de pacotes forçando reenvio, um servidor lento do outro lado, ou o próprio protocolo esperando confirmação.",
          "Uma analogia que se paga: a **banda** é quantas faixas tem a estrada, a **latência** é o tempo de percorrê-la, e a **vazão** é quantos carros efetivamente chegaram. Estrada larga com engarrafamento entrega pouco.",
          "Diagnóstico prático: se a vazão está baixa **e** a latência normal, suspeite do outro lado ou de perda. Se a latência está alta, nenhuma contratação de banda vai resolver — o problema é distância ou fila."
        ]
      }
    },
    "IP address, MAC address and ARP": {
      "ip": {
        "title": "IP: o endereço que muda de lugar",
        "body": [
          "O **endereço IP** diz onde a máquina está na rede — e, como um endereço postal, ele descreve uma posição, não um objeto. Levar o notebook para outra rede troca o IP dele.",
          "O IPv4 tem quatro números de 0 a 255 (`192.168.0.10`) e são só 4,3 bilhões de combinações, que acabaram. O IPv6 resolve com 128 bits (`2001:db8::1`) — espaço que não acaba em nenhum cenário previsível.",
          "Enquanto isso, faixas **privadas** (`10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`) são reutilizadas dentro de cada rede local e não existem na internet. O roteador faz a tradução (NAT) — é por isso que sua máquina se enxerga como `192.168.0.10` e um site vê o IP público do seu provedor."
        ]
      },
      "mac": {
        "title": "MAC: a identidade da placa",
        "body": [
          "O **endereço MAC** (`a4:83:e7:1c:0b:22`) vem gravado na placa de rede e, ao contrário do IP, acompanha o equipamento para onde ele for. É identidade, não posição.",
          "Ele só tem significado dentro do enlace local: nenhum roteador encaminha por MAC entre redes. Por isso o servidor de um site jamais vê o MAC do seu notebook — a rede dele vê o MAC do último roteador do caminho.",
          "É a mesma distinção do quadro e do pacote, uma aula atrás, vista do lado do endereço: IP é para onde a coisa vai, MAC é quem a entrega no trecho atual."
        ]
      },
      "arp": {
        "title": "ARP: a ponte entre os dois",
        "body": [
          "Para entregar um quadro na rede local a máquina precisa do MAC de quem tem aquele IP — e é isso que o **ARP** descobre. Ele grita na rede \"quem tem `192.168.0.1`?\", e a dona responde com o próprio MAC.",
          "A resposta fica num cache por alguns minutos, senão cada pacote custaria uma pergunta. Dá para ver o seu com `arp -a`.",
          "Vale saber que o ARP não confere nada: quem responder primeiro é acreditado. É a base do ataque de *ARP spoofing*, em que uma máquina responde no lugar do roteador e passa a receber o tráfego da rede — o motivo pelo qual usar HTTPS em rede pública deixa de ser recomendação e vira necessidade."
        ]
      }
    },
    "Layered networks: from the cable to the browser": {
      "why-layers": {
        "title": "Por que dividir em camadas",
        "body": [
          "A rede é organizada em camadas onde cada uma resolve um problema e usa a de baixo sem saber como ela funciona. É a razão de você poder trocar Wi-Fi por cabo sem reescrever o navegador: o que mudou foi a camada de baixo, e as de cima nem ficaram sabendo.",
          "Também é o que permite a internet ter sido inventada antes da fibra óptica e do 5G. As camadas de cima continuaram valendo quando as de baixo foram trocadas por completo."
        ]
      },
      "the-layers": {
        "title": "As quatro que importam na prática",
        "body": [
          "O modelo OSI tem sete camadas e é bom para estudar. No dia a dia, quatro explicam quase tudo:",
          [
            "**Enlace** — o quadro no cabo ou no ar. Endereço MAC, Ethernet, Wi-Fi.",
            "**Rede** — o pacote atravessando redes diferentes. Endereço IP, roteamento.",
            "**Transporte** — a conversa entre dois programas. Portas, TCP e UDP.",
            "**Aplicação** — o que os programas falam entre si. HTTP, DNS, SMTP."
          ],
          "Cada camada envelopa a de cima: o quadro contém o pacote, que contém o segmento, que contém o pedido HTTP. É literalmente uma boneca russa, e é assim que o Wireshark mostra qualquer captura."
        ]
      },
      "tcp-udp": {
        "title": "TCP e UDP: garantir ou não esperar",
        "body": [
          "A camada de transporte tem duas escolhas, e a diferença é o que cada uma promete.",
          "**TCP** garante entrega, ordem e integridade: confirma cada pedaço, reenvia o que se perdeu e remonta na sequência certa. Custa uma conexão para estabelecer e espera pelo que faltou. É o que HTTP usa — uma página com metade do HTML não serve para nada.",
          "**UDP** não promete nada: manda e segue. Custa quase nada e não espera ninguém. É o que chamada de vídeo e jogo usam, porque num vídeo ao vivo o quadro atrasado já não tem serventia — melhor perder do que travar a imagem esperando por ele.",
          "A regra de bolso: se o dado incompleto é inútil, TCP. Se o dado atrasado é inútil, UDP."
        ]
      }
    },
    "HTTP and HTTPS: methods, headers and status codes": {
      "methods": {
        "title": "Métodos: o verbo do pedido",
        "body": [
          "Todo pedido HTTP começa por um verbo que diz a intenção. Os que aparecem sempre:",
          [
            "`GET` — me dê. Não deve alterar nada no servidor.",
            "`POST` — tome isto, e crie ou processe algo.",
            "`PUT` — substitua o recurso por isto.",
            "`PATCH` — altere só estes campos.",
            "`DELETE` — remova."
          ],
          "A promessa de que `GET` não altera nada não é formalidade. Navegadores, proxies e buscadores repetem `GET` à vontade — pré-carregam links, revalidam cache, rastreiam páginas. Uma aplicação que apagasse um registro via `GET` seria esvaziada pelo próprio rastreador do Google, e já aconteceu com gente grande."
        ]
      },
      "headers": {
        "title": "Cabeçalhos: os metadados da conversa",
        "body": [
          "Pedido e resposta carregam **cabeçalhos** — pares de nome e valor que descrevem o conteúdo e as condições, sem fazer parte dele.",
          "No pedido, os que mais aparecem são `Host` (qual site, já que um servidor hospeda vários), `Accept` (que formatos servem), `Authorization` (a credencial) e `Cookie`. Na resposta, `Content-Type` (o que é isto), `Cache-Control` (por quanto tempo guardar) e `Set-Cookie`.",
          "`Content-Type` errado é uma das causas mais comuns de \"funciona no meu servidor e não no outro\": o mesmo arquivo servido como `text/plain` em vez de `text/css` faz o navegador recusar a folha de estilo, e a página aparece sem estilo nenhum, sem erro visível."
        ]
      },
      "status": {
        "title": "Códigos de status: as cinco famílias",
        "body": [
          "A resposta começa com um número de três dígitos, e o primeiro dígito já classifica:",
          [
            "**1xx** — informativo, raro no dia a dia.",
            "**2xx** — deu certo. `200 OK`, `201 Created`, `204 No Content`.",
            "**3xx** — está em outro lugar. `301` permanente, `302` temporário, `304` não mudou desde a última vez.",
            "**4xx** — o pedido está errado. `400` malformado, `401` não autenticado, `403` autenticado mas sem permissão, `404` não existe, `429` pedindo demais.",
            "**5xx** — o servidor falhou. `500` erro interno, `502` o servidor de trás respondeu mal, `503` fora do ar, `504` o servidor de trás não respondeu a tempo."
          ],
          "A fronteira que mais se erra é 4xx contra 5xx: **4xx é culpa de quem pediu, 5xx é culpa de quem responde**. E `401` contra `403`: o primeiro diz \"não sei quem você é\", o segundo diz \"sei quem você é, e você não pode\"."
        ]
      },
      "https": {
        "title": "HTTPS: o mesmo HTTP, dentro de um túnel",
        "body": [
          "**HTTPS é HTTP passando por TLS.** Os métodos, cabeçalhos e códigos são idênticos; o que muda é que tudo isso viaja cifrado.",
          "O TLS entrega três coisas ao mesmo tempo, e vale saber quais: **confidencialidade** (ninguém no caminho lê), **integridade** (ninguém altera sem se denunciar) e **autenticidade** (o certificado prova que aquele servidor é mesmo o dono do domínio). É a terceira que o cadeado representa — e é por isso que cadeado não significa \"site confiável\", significa \"é mesmo o site cujo nome está na barra\".",
          "O que o TLS **não** esconde: o nome do domínio que você acessou e o volume de dados trafegado ficam visíveis para a rede. O caminho, os parâmetros e o conteúdo, não."
        ]
      }
    },
    "Cookies, sessions and browser cache": {
      "cookies": {
        "title": "Cookies: a memória que o HTTP não tem",
        "body": [
          "HTTP não lembra de nada: cada pedido chega como se fosse o primeiro. O **cookie** é a gambiarra que virou fundação — o servidor manda um `Set-Cookie` e o navegador devolve aquele valor em todo pedido seguinte para aquele domínio.",
          "Os atributos são o que separa cookie seguro de problema de segurança. `HttpOnly` impede o JavaScript da página de ler o valor, o que limita o estrago de um XSS. `Secure` impede o envio fora do HTTPS. `SameSite` controla se o cookie viaja em pedidos que partem de outro site, que é a defesa contra CSRF."
        ]
      },
      "sessions": {
        "title": "Sessão: o cookie que não carrega o segredo",
        "body": [
          "Guardar dados de verdade no cookie é má ideia — o usuário edita o que quiser. O padrão é o cookie carregar só um **identificador de sessão** aleatório, e o servidor guardar os dados associados a ele.",
          "Daí a consequência que aparece no primeiro deploy sério: se a aplicação roda em dois servidores e a sessão está na memória de um deles, metade dos pedidos não encontra a sessão e o usuário \"cai\" aleatoriamente. Por isso sessão em produção mora em lugar compartilhado — Redis, banco — ou não existe, e o estado vai num token assinado.",
          "Sair de verdade é invalidar a sessão **no servidor**. Apagar o cookie só some com a chave; se alguém tiver copiado o identificador antes, ele continua valendo."
        ]
      },
      "cache": {
        "title": "Cache: não pedir de novo o que não mudou",
        "body": [
          "O jeito mais rápido de carregar um arquivo é não carregá-lo. O **cache** guarda a resposta e a reutiliza enquanto ela valer, e quem manda nisso é o servidor, pelo `Cache-Control`.",
          "`max-age=3600` diz \"vale por uma hora, nem pergunte\". `no-cache` diz \"pode guardar, mas confirme antes de usar\" — o navegador manda um pedido condicional e recebe `304 Not Modified` se nada mudou, o que economiza o corpo inteiro. `no-store` diz \"não guarde\", e é o certo para página de extrato bancário.",
          "A tensão prática é entre cachear muito (rápido, mas o usuário vê a versão velha) e pouco (sempre atual, mas lento). A saída padrão é o **nome com impressão digital**: `app.9f2c1a.css` pode ser cacheado por um ano, porque qualquer alteração muda o nome do arquivo e o HTML passa a apontar para outro."
        ]
      }
    },
    "Domains: registration, DNS, propagation and subdomains": {
      "registration": {
        "title": "Registro: você aluga, não compra",
        "body": [
          "Um domínio é **alugado**, por um a dez anos, junto a um registrador credenciado. No `.br` quem controla é o Registro.br; nos genéricos (`.com`, `.org`) são registradores comerciais.",
          "Não renovar é a forma mais comum e mais cara de perder um domínio: o nome volta ao mercado, e com ele os e-mails e os links de anos. Renovação automática e o e-mail de contato do registro atualizado valem mais do que parecem.",
          "O nome se lê da direita para a esquerda: em `portal.codeschool.ing`, `.ing` é o topo, `codeschool` é o que se registra, e `portal` é um subdomínio que você cria à vontade, sem pagar nada a mais."
        ]
      },
      "dns": {
        "title": "DNS: a tradução de nome para endereço",
        "body": [
          "O **DNS** é o serviço que responde \"qual o IP de `codeschool.ing`?\". Ele é hierárquico: a pergunta sobe até quem sabe, e a resposta desce sendo guardada em cache no caminho.",
          "Os tipos de registro que se usa toda semana:",
          [
            "`A` — aponta o nome para um IPv4. `AAAA` faz o mesmo para IPv6.",
            "`CNAME` — diz \"este nome é apelido daquele\". Não pode existir na raiz do domínio.",
            "`MX` — para onde vai o e-mail deste domínio.",
            "`TXT` — texto livre; é onde vivem as provas de posse e as regras antifraude de e-mail (SPF, DKIM)."
          ],
          "A restrição do `CNAME` na raiz é a que mais aparece na prática: para apontar `codeschool.ing` (sem `www`) a um serviço hospedado, ou se usa `A` com IPs fixos, ou o provedor oferece um `ALIAS`/`ANAME`, que é uma extensão fora do padrão.",
          {
            "svg": "<svg viewBox=\"0 0 720 190\" role=\"img\" aria-label=\"A pergunta sobe do navegador ao resolvedor, e do resolvedor aos servidores raiz, de TLD e autoritativo; a resposta desce sendo guardada em cache\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" opacity=\".55\"><rect x=\"8\" y=\"60\" width=\"118\" height=\"46\" rx=\"4\"/><rect x=\"176\" y=\"60\" width=\"128\" height=\"46\" rx=\"4\"/><rect x=\"354\" y=\"16\" width=\"120\" height=\"38\" rx=\"4\"/><rect x=\"354\" y=\"72\" width=\"120\" height=\"38\" rx=\"4\"/><rect x=\"354\" y=\"128\" width=\"120\" height=\"38\" rx=\"4\"/></g><g fill=\"currentColor\" font-family=\"IBM Plex Mono, monospace\" font-size=\"11\"><text x=\"67\" y=\"80\" text-anchor=\"middle\">navegador</text><text x=\"67\" y=\"95\" text-anchor=\"middle\" opacity=\".6\">tem cache</text><text x=\"240\" y=\"80\" text-anchor=\"middle\">resolvedor</text><text x=\"240\" y=\"95\" text-anchor=\"middle\" opacity=\".6\">do provedor</text><text x=\"414\" y=\"40\" text-anchor=\"middle\">raiz  .</text><text x=\"414\" y=\"96\" text-anchor=\"middle\">TLD  .ing</text><text x=\"414\" y=\"152\" text-anchor=\"middle\">autoritativo</text></g><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" opacity=\".8\"><path d=\"M126 78h42\" marker-end=\"url(#pt)\"/><path d=\"M304 76l44-38\" marker-end=\"url(#pt)\"/><path d=\"M304 83h42\" marker-end=\"url(#pt)\"/><path d=\"M304 90l44 38\" marker-end=\"url(#pt)\"/></g><defs><marker id=\"pt\" viewBox=\"0 0 8 8\" refX=\"7\" refY=\"4\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto\"><path d=\"M0 0l8 4-8 4z\" fill=\"currentColor\"/></marker></defs><g font-family=\"IBM Plex Mono, monospace\" font-size=\"10\" opacity=\".55\" fill=\"currentColor\"><text x=\"500\" y=\"96\">cada resposta desce</text><text x=\"500\" y=\"112\">guardada por TTL segundos</text></g></svg>",
            "caption": "A pergunta sobe até quem sabe; a resposta desce sendo guardada em cache no caminho. É o cache do caminho que faz a propagação demorar."
          }
        ]
      },
      "propagation": {
        "title": "Propagação: por que a mudança demora",
        "body": [
          "Alterou o DNS e o site velho continua aparecendo? Isso é o cache fazendo o trabalho dele. Cada registro tem um **TTL** — o tempo que os servidores do mundo podem guardar a resposta antes de perguntar de novo.",
          "Nada \"se espalha\": o registro novo já está no ar desde o primeiro segundo. O que demora é os caches antigos expirarem, e o teto disso é o TTL que estava valendo **antes** da mudança.",
          "Daí a manobra padrão de quem vai migrar: baixar o TTL para uns cinco minutos **um dia antes**, fazer a troca, conferir e só então voltar o TTL para horas. Baixar o TTL depois de mudar não adianta nada — os caches já pegaram o valor antigo."
        ]
      },
      "subdomains": {
        "title": "Subdomínios: quando separar",
        "body": [
          "Subdomínio é de graça e ilimitado, então a pergunta nunca é \"posso?\", é \"devo?\". `app.exemplo.com` e `exemplo.com/app` resolvem a mesma necessidade de formas diferentes.",
          "Subdomínio separa de verdade: cada um pode apontar para um servidor diferente, ter certificado próprio e, para muitos efeitos de segurança, é tratado como outro site — cookie de um não é enviado ao outro por padrão. É o que se quer para o painel administrativo, para a API e para o ambiente de teste.",
          "Caminho na mesma origem compartilha tudo — sessão, cookie, certificado — e evita a configuração extra. É o que se quer quando as partes são o mesmo produto e conversam o tempo todo."
        ]
      }
    },
    "Hosting: shared, VPS, cloud and CDN": {
      "shared": {
        "title": "Hospedagem compartilhada",
        "body": [
          "Um servidor, dezenas ou centenas de sites, todos dividindo o mesmo sistema operacional e os mesmos recursos. Você recebe um painel, uma pasta e um banco de dados; o provedor cuida do resto.",
          "É a opção mais barata e a que exige menos conhecimento — e o preço disso é o controle. Não se instala o que se quer, a versão de linguagem é a que estiver lá, e o **vizinho barulhento** é real: um site vizinho recebendo um pico de acesso derruba o desempenho do seu, sem que você tenha feito nada.",
          "Continua sendo a escolha certa para site institucional, blog e loja pequena. Deixa de ser quando você precisa de um processo rodando o tempo todo, de uma dependência específica ou de garantir desempenho."
        ]
      },
      "vps": {
        "title": "VPS: a máquina que é sua",
        "body": [
          "Um **VPS** é uma fatia virtualizada de um servidor físico, com sistema operacional próprio e recursos reservados. Você entra por SSH e é administrador — instala o que quiser, escolhe as versões, abre as portas que precisar.",
          "O que muda de verdade não é a potência: é **de quem é a responsabilidade**. Atualização de segurança, firewall, backup, certificado, monitoramento — tudo isso passa a ser seu. Um VPS esquecido por seis meses é uma máquina invadida esperando acontecer.",
          "A conta que vale fazer antes de migrar: o VPS costuma custar pouco mais que a hospedagem compartilhada em dinheiro, e muito mais em horas. Se ninguém no time vai cuidar dele, o compartilhado ou uma plataforma gerenciada entregam mais."
        ]
      },
      "cloud": {
        "title": "Nuvem: pagar pelo que se usa",
        "body": [
          "A nuvem — AWS, Azure, Google Cloud e afins — vende **recursos sob demanda**: você cria dez servidores em um minuto e os destrói em outro, pagando pelo tempo em que existiram. É a mesma ideia do VPS levada ao extremo da elasticidade, com um catálogo de serviços prontos em volta (banco gerenciado, fila, armazenamento, autenticação).",
          "A vantagem real é acompanhar demanda que varia: uma loja que triplica o tráfego na Black Friday sobe capacidade naquele dia e devolve na semana seguinte. Uma loja de tráfego constante não ganha nada com isso — e provavelmente paga mais caro que num VPS.",
          "Os dois custos que surpreendem quem chega: **transferência de dados para fora** costuma ser cobrada e some da estimativa inicial, e a complexidade sobe rápido. Uma arquitetura de nuvem mal dimensionada é mais cara e mais frágil que uma máquina só bem cuidada."
        ]
      },
      "cdn": {
        "title": "CDN: aproximar o conteúdo de quem pede",
        "body": [
          "Uma **CDN** é uma rede de servidores espalhados pelo mundo que guardam cópias do seu conteúdo. Quem acessa de Lisboa recebe do nó de Lisboa, não do seu servidor em São Paulo.",
          "Ela ataca exatamente o problema que largura de banda não resolve, três aulas atrás: **latência é distância**, e a única forma de reduzi-la é encurtar o caminho. Para arquivos estáticos — imagem, CSS, JavaScript, vídeo — o ganho é grande e a configuração é pequena.",
          "A CDN não substitui a hospedagem: ela fica na frente dela. O seu servidor continua existindo e respondendo pelo que é dinâmico e pelo que a CDN ainda não tem em cache — é o que se chama de **origem**.",
          "O efeito colateral que morde: como a CDN guarda cópias, publicar uma versão nova nem sempre aparece na hora. Ou se invalida o cache no deploy, ou se usa nome com impressão digital no arquivo — a mesma solução da aula de cache, agora em escala mundial."
        ]
      },
      "choosing": {
        "title": "Como escolher",
        "body": [
          "As quatro opções não formam uma escada em que a última é a melhor: elas respondem a perguntas diferentes.",
          [
            "**Quanto controle você precisa?** Instalar coisas e rodar processos próprios já exclui o compartilhado.",
            "**Quem vai administrar?** Sem alguém responsável por atualização e backup, gerenciado ganha de VPS.",
            "**A demanda varia muito?** Se sim, a elasticidade da nuvem se paga. Se não, ela é custo sem contrapartida.",
            "**Seu público está longe?** Então CDN, independentemente de qual das três estiver atrás."
          ],
          "E vale dizer o que este curso mesmo faz: a vitrine da escola é um site estático publicado no GitHub Pages, que é hospedagem gerenciada com CDN embutida, de graça. Para HTML, CSS e JavaScript sem servidor, é difícil justificar mais que isso."
        ]
      }
    },
    "How the browser builds the page: DOM, CSSOM and rendering": {
      "dom": {
        "title": "DOM: o HTML virando árvore",
        "body": [
          "O navegador lê o HTML e constrói o **DOM** — uma árvore de objetos em que cada elemento é um nó com pai, filhos e propriedades. O HTML é o texto; o DOM é o que existe na memória depois de interpretá-lo.",
          "A distinção importa porque o DOM não é obrigado a se parecer com o arquivo. Ele é corrigido na montagem (uma tag mal fechada é remendada) e alterado depois, pelo JavaScript. Por isso \"ver o código-fonte\" e \"inspecionar o elemento\" podem mostrar coisas diferentes — o primeiro é o texto que veio, o segundo é a árvore como está agora."
        ]
      },
      "cssom": {
        "title": "CSSOM e o cálculo de estilo",
        "body": [
          "O CSS passa pelo mesmo processo e vira o **CSSOM**. Aí o navegador combina as duas árvores para decidir o estilo final de cada nó, resolvendo herança, especificidade e ordem.",
          "É neste ponto que se decide uma disputa como a que este portal enfrentou: uma regra do navegador para `[hidden]` tem especificidade zero e perde para qualquer classe que declare `display`. Nada disso é visível no arquivo CSS — só no estilo computado.",
          "CSS **bloqueia a renderização** de propósito: mostrar a página sem estilo e reestilizá-la depois piscaria a tela inteira. Por isso folha de estilo grande atrasa a primeira pintura, e por isso `<link>` de CSS fica no `<head>`."
        ]
      },
      "rendering": {
        "title": "Layout, pintura e composição",
        "body": [
          "Com estilo resolvido, faltam três passos: **layout** calcula a posição e o tamanho de cada caixa, **pintura** desenha os pixels, e **composição** junta as camadas na tela.",
          "O custo de cada um é bem diferente, e é isso que separa animação suave de animação travada. Mudar `width` ou `top` refaz o layout de tudo o que estiver em volta. Mudar `background-color` só repinta. Mudar `transform` ou `opacity` mexe só na composição, que a placa de vídeo faz sozinha.",
          "Daí a regra prática mais rentável do front-end: **anime `transform` e `opacity`**, não `left`, `top` ou `width`."
        ]
      },
      "scripts": {
        "title": "Onde o JavaScript entra",
        "body": [
          "Um `<script>` comum **para a montagem do DOM** enquanto baixa e executa, porque ele pode alterar a árvore que está sendo construída. Script no topo do `<head>` é a receita clássica de página em branco.",
          "Dois atributos resolvem: `defer` baixa em paralelo e executa depois do HTML montado, preservando a ordem entre scripts; `async` baixa em paralelo e executa assim que chegar, sem garantir ordem nenhuma.",
          "`defer` é o padrão certo para o código da própria página, e é também o comportamento de um `<script type=\"module\">` — o que explica por que este portal pode chamar `document.querySelector` no topo do módulo sem esperar por evento nenhum."
        ]
      }
    },
    "Developer tools: network, console and elements": {
      "elements": {
        "title": "Elementos: o DOM ao vivo",
        "body": [
          "A aba **Elementos** mostra o DOM como ele está agora, não como o arquivo veio — e deixa editar tudo ali mesmo, o que é a forma mais rápida de testar uma ideia de layout sem tocar no código.",
          "O painel de estilos ao lado é onde se resolve \"por que esta regra não pega\": ele lista todas as declarações que atingem o elemento, rasura as que perderam e mostra de qual arquivo e linha cada uma veio. A aba de estilo **computado** dá a palavra final, com o valor que realmente valeu.",
          "O modelo de caixa desenhado embaixo — conteúdo, padding, borda, margem — responde quase toda pergunta de espaçamento em dois segundos."
        ]
      },
      "console": {
        "title": "Console: erros e experimentos",
        "body": [
          "O **Console** é o primeiro lugar a olhar quando algo não funciona, e o mais ignorado por quem está começando. Erro de JavaScript, arquivo que não carregou, recurso bloqueado — tudo aparece ali, e quase sempre com a linha exata.",
          "Ele também é um ambiente de execução: dá para inspecionar variáveis, chamar funções da página e testar um seletor antes de escrevê-lo no código. `$0` refere-se ao elemento selecionado na aba Elementos.",
          "Um aviso que vale: nunca cole código que um desconhecido mandou colar no console. Ele roda com todos os privilégios da página aberta, inclusive os seus cookies de sessão — é um golpe comum o bastante para alguns sites imprimirem um aviso ali."
        ]
      },
      "network": {
        "title": "Rede: o que foi pedido e o que voltou",
        "body": [
          "A aba **Rede** lista cada pedido que a página fez, com método, status, tamanho e tempo. É onde se confirma, em vez de supor, quase tudo o que este curso apresentou.",
          "O que olhar primeiro: o **status** (4xx é seu, 5xx é do servidor), o **tempo** dividido entre espera e transferência — que separa servidor lento de conexão lenta —, e a coluna de **tamanho**, onde uma resposta servida do cache aparece como tal em vez de trafegar de novo.",
          "Duas opções mudam o diagnóstico: *Disable cache* força tudo a ser buscado, mostrando como é a primeira visita de um usuário novo; e a limitação de velocidade simula uma conexão ruim, que é a única forma honesta de saber como o site se comporta fora do seu Wi-Fi."
        ]
      }
    }
  },
  "html-css": {
    "Structure of an HTML document and metadata": {
      "skeleton": {
        "title": "O esqueleto de toda página",
        "body": [
          "Todo documento HTML tem a mesma moldura, e vale digitá-la à mão algumas vezes antes de deixar o editor gerá-la:",
          {
            "code": "html",
            "text": "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>Minha página</title>\n</head>\n<body>\n  <h1>Olá</h1>\n</body>\n</html>"
          },
          "O `<!DOCTYPE html>` não é uma tag: é uma declaração que diz ao navegador para usar o modo padrão. Sem ela, ele entra em *quirks mode* e passa a imitar bugs de navegadores dos anos 90 — o mais famoso deles muda o modelo de caixa inteiro, e o layout desanda sem erro nenhum aparecer.",
          "O `lang` no `<html>` também não é enfeite: é o que faz o leitor de tela escolher a pronúncia certa e o corretor ortográfico escolher o dicionário certo."
        ]
      },
      "metadata": {
        "title": "Metadados que fazem diferença",
        "body": [
          "O `<head>` não aparece na tela e decide muita coisa do que acontece nela.",
          [
            "`<meta charset=\"UTF-8\">` — sem ele, acentos viram símbolos. Vem primeiro, porque o navegador precisa saber a codificação antes de interpretar o resto.",
            "`<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">` — sem ele, o celular finge ter 980px de largura e desenha a página miniaturizada. É a linha que separa \"responsivo\" de \"página de computador espremida\".",
            "`<title>` — vai na aba, no favorito e no resultado do buscador.",
            "`<meta name=\"description\">` — o parágrafo que o buscador mostra abaixo do título."
          ],
          "A do *viewport* é a que mais dói quando falta, porque a página parece funcionar no computador e nasce quebrada no celular — que é onde está a maioria dos visitantes."
        ]
      },
      "where-they-go": {
        "title": "Onde entram o CSS e o JavaScript",
        "body": [
          "A folha de estilo vai no `<head>`, e o script vai no fim do `<body>` ou com `defer`:",
          {
            "code": "html",
            "text": "<head>\n  <link rel=\"stylesheet\" href=\"estilo.css\" />\n  <script src=\"app.js\" defer></script>\n</head>"
          },
          "Os dois lugares vêm do mesmo raciocínio, com resultados opostos. **CSS bloqueia a renderização de propósito** — mostrar a página sem estilo e reestilizá-la depois piscaria a tela inteira —, então quanto antes ele começar a baixar, melhor.",
          "**Script comum bloqueia a montagem do DOM**, porque pode alterar a árvore que está sendo construída. Por isso `<script>` no topo do `<head>` sem `defer` é a receita clássica de página em branco. Com `defer`, ele baixa em paralelo e executa depois do HTML montado, preservando a ordem entre scripts."
        ]
      }
    },
    "Semantic HTML: header, nav, main, section, article and footer": {
      "why-not-div": {
        "title": "Por que não basta div",
        "body": [
          "Do ponto de vista visual, `<div>` e `<main>` são idênticos: nenhum dos dois tem estilo próprio relevante. A diferença é que um deles **significa** alguma coisa.",
          "Quem lê esse significado: leitores de tela, que oferecem pular direto ao conteúdo principal; buscadores, que distinguem artigo de menu; o modo leitura do navegador, que precisa adivinhar onde o texto começa; e a pessoa que abrir seu código daqui a um ano.",
          "O custo de usar o elemento certo é zero — é o mesmo número de caracteres. O custo de não usar aparece depois, e sempre em quem tem menos escolha."
        ]
      },
      "regions": {
        "title": "Os elementos de região",
        "body": [
          "Seis elementos cobrem quase toda página:",
          {
            "code": "html",
            "text": "<body>\n  <header>\n    <nav>… menu …</nav>\n  </header>\n\n  <main>\n    <article>\n      <h1>Título do texto</h1>\n      <section>… um bloco do texto …</section>\n    </article>\n  </main>\n\n  <footer>… contato, direitos …</footer>\n</body>"
          },
          "`<main>` é o único que deve aparecer **uma vez só** por página, e é ele que dá ao leitor de tela o atalho \"pular para o conteúdo\". `<header>` e `<footer>` podem se repetir: um `<article>` pode ter os seus próprios."
        ]
      },
      "section-article": {
        "title": "section, article ou div?",
        "body": [
          "A dúvida mais comum do HTML semântico tem uma régua curta.",
          [
            "**`<article>`** — faz sentido sozinho, fora da página. Um post, uma notícia, um comentário, um cartão de produto. Teste: dá para publicar isto num feed RSS?",
            "**`<section>`** — um bloco temático **dentro** de algo maior, e que tem um título. Se você não consegue dar um título a ele, provavelmente não é uma `section`.",
            "**`<div>`** — não significa nada, e está certo assim. É o elemento para agrupar por motivo puramente visual: um contêiner que existe só para receber um `display: flex`."
          ],
          "`<div>` não é derrota. Usar `<section>` onde só havia necessidade de layout é pior: cria estrutura semântica falsa, e o leitor de tela anuncia uma região que não existe."
        ]
      }
    },
    "Forms, fields, labels and native validation": {
      "labels": {
        "title": "Campo sem rótulo é campo quebrado",
        "body": [
          "Todo campo precisa de um `<label>` ligado a ele. A ligação é pelo `for` que aponta para o `id`:",
          {
            "code": "html",
            "text": "<label for=\"email\">E-mail</label>\n<input type=\"email\" id=\"email\" name=\"email\" required />"
          },
          "A ligação faz três coisas de uma vez: o leitor de tela anuncia o rótulo quando o campo recebe foco, clicar no texto foca o campo, e a área de toque no celular cresce — o que importa mais do que parece em caixas de seleção.",
          "`placeholder` **não** substitui rótulo. Ele some quando a pessoa começa a digitar, e aí ninguém mais sabe o que aquele campo era. É complemento, não substituto."
        ]
      },
      "field-types": {
        "title": "O tipo do campo muda o teclado",
        "body": [
          "No computador, `type=\"email\"` e `type=\"text\"` parecem iguais. No celular, não: o tipo escolhe qual teclado aparece.",
          [
            "`email` — traz o `@` e o ponto na primeira tela.",
            "`tel` — teclado numérico grande, o de discagem.",
            "`number` — numérico, mas cuidado: ele recusa zeros à esquerda e caracteres de formatação, então **não** serve para CEP, CPF nem cartão.",
            "`url`, `date`, `search` — cada um com o seu teclado e o seu seletor nativo."
          ],
          "Para CEP e telefone com máscara, o par que funciona é `type=\"text\"` com `inputmode=\"numeric\"`: teclado numérico, sem as restrições de `number`."
        ]
      },
      "validation": {
        "title": "Validação nativa, e onde ela para",
        "body": [
          "O navegador valida sozinho com atributos, sem uma linha de JavaScript:",
          {
            "code": "html",
            "text": "<input type=\"email\" required />\n<input type=\"text\" minlength=\"3\" maxlength=\"40\" />\n<input type=\"text\" pattern=\"[0-9]{5}-[0-9]{3}\" />"
          },
          "E dá para estilizar o estado com `:valid`, `:invalid` e — o mais útil — `:user-invalid`, que só pinta de vermelho **depois** de a pessoa ter interagido com o campo. Sem ele, um formulário nasce todo vermelho antes de alguém digitar nada.",
          "**Validação no navegador é conveniência, nunca segurança.** Qualquer pessoa remove um `required` pelo inspetor em dois segundos. O servidor valida tudo de novo, sempre — a do cliente existe para evitar a viagem até o servidor, não para proteger dele."
        ]
      }
    },
    "Tables, responsive images and media": {
      "tables": {
        "title": "Tabela é para dado, não para layout",
        "body": [
          "Tabela existe para dado tabular — coisa que tem linha, coluna e sentido em ambas. Uma tabela bem marcada diz ao leitor de tela a que coluna cada célula pertence, e a pessoa consegue navegar entre elas:",
          {
            "code": "html",
            "text": "<table>\n  <caption>Notas do semestre</caption>\n  <thead>\n    <tr><th scope=\"col\">Aluno</th><th scope=\"col\">Nota</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope=\"row\">Ana</th><td>9,0</td></tr>\n  </tbody>\n</table>"
          },
          "O `scope` é o que faz a diferença: sem ele, o leitor de tela lê \"9,0\" sem dizer de quem nem de quê. Com ele, lê \"Ana, Nota, 9,0\".",
          "Usar tabela para posicionar coisas na tela foi normal nos anos 90 e hoje é erro: cria estrutura de dados falsa, e Flexbox e Grid resolvem melhor. Layout é a próxima metade do curso."
        ]
      },
      "images": {
        "title": "Imagens que não desperdiçam banda",
        "body": [
          "Servir a mesma imagem de 2000px para um celular é jogar fora banda e bateria de quem tem menos dos dois. `srcset` deixa o navegador escolher:",
          {
            "code": "html",
            "text": "<img\n  src=\"foto-800.jpg\"\n  srcset=\"foto-400.jpg 400w, foto-800.jpg 800w, foto-1600.jpg 1600w\"\n  sizes=\"(max-width: 700px) 100vw, 700px\"\n  alt=\"Fachada da escola vista da calçada\"\n  width=\"800\" height=\"600\"\n  loading=\"lazy\" />"
          },
          "`width` e `height` não fixam o tamanho quando há CSS — eles informam a **proporção**, e é isso que impede a página de pular quando a imagem termina de carregar. `loading=\"lazy\"` adia o que está fora da tela.",
          {
            "image": "data:image/svg+xml,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20640%20200%22><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221.3%22><rect%20x=%2212%22%20y=%22118%22%20width=%2270%22%20height=%2252%22%20rx=%223%22/><rect%20x=%22106%22%20y=%2284%22%20width=%22120%22%20height=%2286%22%20rx=%223%22/><rect%20x=%22250%22%20y=%2226%22%20width=%22230%22%20height=%22144%22%20rx=%223%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2211%22%20text-anchor=%22middle%22><text%20x=%2247%22%20y=%22148%22>400w</text><text%20x=%22166%22%20y=%22130%22>800w</text><text%20x=%22365%22%20y=%22102%22>1600w</text><text%20x=%2247%22%20y=%22188%22>celular</text><text%20x=%22166%22%20y=%22188%22>tablet</text><text%20x=%22365%22%20y=%22188%22>desktop</text></g><g%20fill=%22none%22%20stroke=%22%238a8f98%22%20stroke-width=%221%22%20stroke-dasharray=%223%203%22%20opacity=%22.7%22><path%20d=%22M520%2026v144%22/></g><g%20fill=%22%238a8f98%22%20font-family=%22monospace%22%20font-size=%2210%22><text%20x=%22534%22%20y=%2290%22>o%20navegador</text><text%20x=%22534%22%20y=%22106%22>escolhe%20uma,</text><text%20x=%22534%22%20y=%22122%22>n%C3%A3o%20as%20tr%C3%AAs</text></g></svg>",
            "alt": "Três retângulos de tamanhos diferentes rotulados 400w, 800w e 1600w, sob os rótulos celular, tablet e desktop",
            "caption": "O `srcset` oferece as três; quem escolhe é o navegador, que sabe a largura da tela e a densidade dela — coisas que o servidor não sabe."
          },
          "O `alt` descreve a imagem para quem não a vê. Imagem puramente decorativa leva `alt=\"\"` — vazio, não ausente: assim o leitor de tela a ignora em vez de anunciar o nome do arquivo."
        ]
      },
      "media": {
        "title": "Vídeo e áudio",
        "body": [
          "Os elementos nativos dispensam biblioteca para o caso comum:",
          {
            "code": "html",
            "text": "<video controls preload=\"metadata\" poster=\"capa.jpg\" width=\"640\">\n  <source src=\"aula.webm\" type=\"video/webm\" />\n  <source src=\"aula.mp4\" type=\"video/mp4\" />\n  <track kind=\"captions\" src=\"aula.vtt\" srclang=\"pt\" label=\"Português\" default />\n</video>"
          },
          "Vários `<source>` deixam o navegador pegar o formato que ele reproduz. `preload=\"metadata\"` baixa só o suficiente para saber a duração — `auto` baixaria o vídeo inteiro de quem talvez não o assista.",
          "A faixa de legenda não é opcional na prática: ela serve a quem não ouve, a quem está em lugar barulhento e a quem prefere ler. E, ao contrário do resto, ela não se acrescenta depois sem voltar a produzir o conteúdo."
        ]
      }
    },
    "Selectors, cascade, inheritance and specificity": {
      "selectors": {
        "title": "O vocabulário dos seletores",
        "body": [
          "Seletor é a pergunta \"quais elementos?\". As formas que resolvem quase tudo:",
          {
            "code": "css",
            "text": ".cartao          { }   /* classe */\n#topo            { }   /* id */\nnav a            { }   /* descendente: todo `a` dentro de nav */\nnav > a          { }   /* filho direto */\nli + li          { }   /* irmão imediatamente seguinte */\na[href^=\"http\"]  { }   /* atributo que começa com */\nli:nth-child(2n) { }   /* pseudo-classe */"
          },
          "Na prática, **classe resolve 90% dos casos**, e é o que se deve preferir. Id é único por página e, como se vê na próxima seção, tem um peso na especificidade que atrapalha mais do que ajuda."
        ]
      },
      "specificity": {
        "title": "Especificidade: a conta que decide quem ganha",
        "body": [
          "Quando duas regras atingem o mesmo elemento e declaram a mesma propriedade, vence a mais específica. A especificidade é um trio de números — **(ids, classes, elementos)** — comparado da esquerda para a direita:",
          {
            "code": "css",
            "text": "p                 /* (0,0,1) */\n.aviso            /* (0,1,0)  vence de p */\nnav a.ativo       /* (0,1,2) */\n#topo             /* (1,0,0)  vence de tudo acima */"
          },
          "O primeiro número esmaga os outros: **um id vence qualquer quantidade de classes**. É por isso que estilizar por id acaba forçando o próximo a usar `!important` — e uma vez que `!important` entra num arquivo, ele se espalha.",
          "Empate de especificidade é desempatado pela ordem: a última regra escrita ganha."
        ]
      },
      "cascade": {
        "title": "Cascata e herança são coisas diferentes",
        "body": [
          "**Cascata** é como o navegador escolhe entre regras que disputam o mesmo elemento: origem, `!important`, especificidade e, por fim, ordem.",
          "**Herança** é outra coisa: algumas propriedades passam de pai para filho sem ninguém pedir. `color`, `font-family` e `line-height` herdam; `border`, `padding` e `background` não.",
          "A distinção importa porque explica um erro comum: definir `font-family` no `body` funciona para a página inteira (herança), mas definir `border` no `body` não desenha borda nenhuma nos filhos. E há o caso híbrido do `<button>`, que **não** herda a fonte por padrão — daí a linha `font: inherit` que aparece em quase todo CSS sério."
        ]
      }
    },
    "Box model, box-sizing and units (px, rem, em, %, vw/vh)": {
      "box": {
        "title": "Toda coisa é uma caixa",
        "body": [
          "Cada elemento é um retângulo com quatro camadas, de dentro para fora: **conteúdo**, **padding**, **borda** e **margem**.",
          "Padding é espaço interno — ele empurra o conteúdo para longe da borda e recebe a cor de fundo. Margem é espaço externo — separa esta caixa das vizinhas e é transparente.",
          "Um detalhe que confunde todo mundo uma vez: **margens verticais adjacentes se fundem**. Dois parágrafos com 20px de margem embaixo e em cima não ficam com 40px de distância; ficam com 20. É o *colapso de margens*, vale só na vertical, e é a razão de muita gente usar `gap` do flex/grid em vez de margem."
        ]
      },
      "box-sizing": {
        "title": "box-sizing, e a primeira linha de todo CSS",
        "body": [
          "Por padrão, `width` mede só o conteúdo. Então uma caixa declarada com 200px e mais padding e borda ocupa **mais** que 200px:",
          {
            "code": "css",
            "text": ".caixa {\n  width: 200px;\n  padding: 20px;\n  border: 2px solid;\n}\n/* largura real: 200 + 20+20 + 2+2 = 244px */"
          },
          "Isso torna qualquer layout uma conta de cabeça. A correção é uma linha, e ela abre praticamente todo CSS moderno:",
          {
            "code": "css",
            "text": "*, *::before, *::after {\n  box-sizing: border-box;\n}"
          },
          "Com `border-box`, `width: 200px` significa 200px na tela, com padding e borda **para dentro**. É o comportamento que todo mundo esperava desde o começo."
        ]
      },
      "units": {
        "title": "Qual unidade para quê",
        "body": [
          "Cada unidade responde a uma pergunta diferente, e escolher errado é a origem de metade dos problemas de acessibilidade em tipografia.",
          [
            "**`px`** — absoluto. Bom para borda e para sombra, onde o valor é físico mesmo.",
            "**`rem`** — múltiplo da fonte-raiz. É o padrão para tipografia e espaçamento, porque **respeita quem aumentou a fonte no navegador**. Tamanho de texto em `px` ignora essa preferência.",
            "**`em`** — múltiplo da fonte do próprio elemento. Útil para espaçamento que deve acompanhar o texto, mas cuidado: ele acumula em elementos aninhados.",
            "**`%`** — relativo ao contêiner. Largura.",
            "**`vw` / `vh`** — relativo à janela. Bom para telas cheias; no celular, prefira `svh`/`dvh`, que lidam com a barra do navegador que aparece e some."
          ],
          "A regra prática que resolve quase tudo: **`rem` para texto e espaço, `%` ou `fr` para largura, `px` só para detalhes finos.**"
        ]
      }
    },
    "Positioning: static, relative, absolute, fixed and sticky": {
      "flow": {
        "title": "O fluxo normal, e sair um pouco dele",
        "body": [
          "Por padrão todo elemento é `position: static`: ele fica onde o fluxo o colocou, e `top`/`left` não fazem nada.",
          "`position: relative` mantém o elemento no fluxo — **o espaço dele continua reservado** — e desloca só o desenho. Por isso ele quase nunca é usado para mover coisas: é usado para virar **âncora** de um filho `absolute`, que é o assunto da próxima seção."
        ]
      },
      "absolute": {
        "title": "absolute e o contexto de posicionamento",
        "body": [
          "`position: absolute` tira o elemento do fluxo: o espaço dele deixa de existir e os vizinhos se fecham como se ele não estivesse ali. Ele passa a se posicionar em relação ao **ancestral posicionado mais próximo** — qualquer um que não seja `static`.",
          {
            "code": "css",
            "text": ".cartao      { position: relative; }\n.cartao .selo {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n}"
          },
          "É o padrão mais usado do CSS inteiro: o pai vira `relative` só para servir de referência, e o filho se pendura no canto dele. **Esquecer o `relative` no pai** é o defeito clássico — o selo sobe até o canto da página, porque na falta de ancestral posicionado a referência vira a janela."
        ]
      },
      "fixed-sticky": {
        "title": "fixed e sticky",
        "body": [
          "`fixed` prende o elemento à janela: ele não sai do lugar quando a página rola. É o que segura a barra do topo deste portal.",
          "`sticky` é o híbrido: o elemento rola normalmente até atingir o limite declarado, e ali gruda.",
          {
            "code": "css",
            "text": ".cabecalho-tabela {\n  position: sticky;\n  top: 0;\n}"
          },
          "Duas pegadinhas do `sticky` explicam quase todo caso de \"não funciona\": ele **exige** um deslocamento declarado (`top`, `bottom`…), sem o qual não faz nada; e ele gruda dentro do **pai**, não da janela — se o pai tem `overflow: hidden` ou acaba logo, o efeito termina junto."
        ]
      }
    },
    "Flexbox: axes, alignment and distribution": {
      "axes": {
        "title": "Tudo depende do eixo principal",
        "body": [
          "Flexbox organiza os filhos ao longo de **um** eixo. `flex-direction` escolhe qual:",
          {
            "code": "css",
            "text": ".barra {\n  display: flex;\n  flex-direction: row;   /* padrão: eixo principal na horizontal */\n}"
          },
          "Entender isso resolve a confusão que mais atrasa quem está aprendendo: `justify-content` age no **eixo principal** e `align-items` no **cruzado**. Como o padrão é `row`, `justify-content` parece \"horizontal\" e `align-items` parece \"vertical\" — até alguém escrever `flex-direction: column`, e os dois trocarem de sentido.",
          "A pergunta certa nunca é \"como centralizo na horizontal?\", e sim \"qual é o meu eixo principal?\".",
          {
            "svg": "<svg viewBox=\"0 0 760 226\" role=\"img\" aria-label=\"Com flex-direction row o eixo principal é horizontal e o cruzado é vertical; com column os dois trocam de lugar\"><g font-family=\"IBM Plex Mono, monospace\" font-size=\"11\" fill=\"currentColor\" opacity=\".65\"><text x=\"30\" y=\"18\">flex-direction: row</text><text x=\"430\" y=\"18\">flex-direction: column</text></g><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" opacity=\".4\"><rect x=\"30\" y=\"30\" width=\"300\" height=\"140\" rx=\"4\"/><rect x=\"430\" y=\"30\" width=\"300\" height=\"140\" rx=\"4\"/></g><g fill=\"currentColor\" opacity=\".2\"><rect x=\"48\" y=\"44\" width=\"62\" height=\"76\" rx=\"3\"/><rect x=\"118\" y=\"44\" width=\"62\" height=\"76\" rx=\"3\"/><rect x=\"188\" y=\"44\" width=\"62\" height=\"76\" rx=\"3\"/><rect x=\"450\" y=\"42\" width=\"180\" height=\"30\" rx=\"3\"/><rect x=\"450\" y=\"78\" width=\"180\" height=\"30\" rx=\"3\"/><rect x=\"450\" y=\"114\" width=\"180\" height=\"30\" rx=\"3\"/></g><g fill=\"none\" stroke-width=\"1.8\" style=\"stroke:var(--phosphor)\"><path d=\"M44 150h268\" marker-end=\"url(#ep)\"/><path d=\"M690 42v112\" marker-end=\"url(#ep)\"/></g><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" opacity=\".45\" stroke-dasharray=\"4 4\"><path d=\"M282 40v82\" marker-end=\"url(#ec)\"/><path d=\"M450 158h190\" marker-end=\"url(#ec)\"/></g><g font-family=\"IBM Plex Mono, monospace\" font-size=\"11\"><path d=\"M30 194h26\" fill=\"none\" stroke-width=\"1.8\" style=\"stroke:var(--phosphor)\"/><text x=\"64\" y=\"198\" style=\"fill:var(--phosphor)\">eixo principal → justify-content</text><path d=\"M30 214h26\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.2\" opacity=\".45\" stroke-dasharray=\"4 4\"/><text x=\"64\" y=\"218\" fill=\"currentColor\" opacity=\".6\">eixo cruzado → align-items</text></g><defs><marker id=\"ep\" viewBox=\"0 0 8 8\" refX=\"7\" refY=\"4\" markerWidth=\"5.5\" markerHeight=\"5.5\" orient=\"auto\"><path d=\"M0 0l8 4-8 4z\" style=\"fill:var(--phosphor)\"/></marker><marker id=\"ec\" viewBox=\"0 0 8 8\" refX=\"7\" refY=\"4\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto\"><path d=\"M0 0l8 4-8 4z\" fill=\"currentColor\" opacity=\".45\"/></marker></defs></svg>",
            "caption": "Trocar `row` por `column` não move só os itens: **troca de lugar** as duas propriedades de alinhamento. É por isso que a que funcionava \"parou de funcionar\"."
          }
        ]
      },
      "alignment": {
        "title": "Alinhar e distribuir",
        "body": [
          "Centralizar nos dois sentidos, que já foi um quebra-cabeça, hoje são três linhas. Em vez de mostrar as três soltas, vale ler uma barra de navegação inteira — que é onde essas propriedades realmente aparecem — com a explicação de cada trecho ao lado dele:",
          {
            "example": {
              "language": "css",
              "file": "barra.css",
              "parts": [
                {
                  "code": ".barra {\n  display: flex;",
                  "note": "A partir daqui os filhos diretos de `.barra` são itens flex. Nada acontece com os netos — flex vale um nível só."
                },
                {
                  "code": "  align-items: center;",
                  "note": "Alinha no eixo **cruzado**. Com `flex-direction: row` (o padrão), o cruzado é a vertical: é isto que deixa a logo e os links na mesma altura mesmo tendo tamanhos diferentes."
                },
                {
                  "code": "  gap: 24px;",
                  "note": "O espaço entre os itens. `gap` não sobra na ponta, não colapsa, e dispensa o `:last-child { margin: 0 }` que todo CSS antigo carrega."
                },
                {
                  "code": "  padding: 0 32px;\n}",
                  "note": "Espaço interno da barra. Repare que ele NÃO é `gap`: um é a moldura, o outro é a distância entre os itens."
                },
                {
                  "code": ".barra .menu {\n  margin-left: auto;\n}",
                  "note": "O truque mais útil do flexbox. `margin: auto` come todo o espaço livre daquele lado, então este item — e tudo depois dele — é empurrado para a direita. Faz o que `justify-content: space-between` faria, mas para UM item, e sem mexer no resto."
                },
                {
                  "code": ".barra .titulo {\n  min-width: 0;\n}",
                  "note": "A linha mais misteriosa e mais útil. Um item flex não encolhe abaixo do próprio conteúdo por padrão, e um título longo estoura a barra em vez de reticenciar. `min-width: 0` devolve a permissão de encolher."
                }
              ],
              "output": "┌──────────────────────────────────────────────┐\n│ ◐ codeschool.ing   Trilhas          Entrar   │\n└──────────────────────────────────────────────┘\n  └ logo e título              └ empurrados pelo margin-left:auto"
            }
          },
          "No eixo principal, os valores que se usam são `flex-start`, `center`, `flex-end`, `space-between` (extremos colados nas pontas, espaço igual entre os itens) e `space-evenly` (espaço igual em toda parte, inclusive nas bordas)."
        ]
      },
      "grow-shrink": {
        "title": "Crescer, encolher e a base",
        "body": [
          "A propriedade `flex` é um atalho para três coisas: quanto o item pode crescer, quanto pode encolher e de que tamanho ele parte.",
          {
            "code": "css",
            "text": ".lado    { flex: 0 0 240px; }  /* não cresce, não encolhe: 240px fixos */\n.miolo   { flex: 1 1 auto; }   /* ocupa o que sobrar */\n.igual   { flex: 1; }          /* atalho de 1 1 0: todos com a mesma largura */"
          },
          "A diferença entre `flex: 1` e `flex: 1 1 auto` derruba muita gente: com base `0`, os itens ficam todos do mesmo tamanho; com base `auto`, o conteúdo de cada um influencia, e um item com texto longo fica maior que os outros.",
          "E um item flex **não encolhe abaixo do conteúdo** por padrão, o que faz texto longo estourar o contêiner. A cura é `min-width: 0` no item — a linha mais misteriosa e mais útil do flexbox."
        ]
      }
    },
    "CSS Grid: rows, columns, areas and the implicit grid": {
      "rows-columns": {
        "title": "Duas dimensões de uma vez",
        "body": [
          "Flexbox organiza ao longo de um eixo; Grid organiza linhas e colunas ao mesmo tempo. A unidade nova é `fr`, uma fração do espaço livre:",
          {
            "code": "css",
            "text": ".pagina {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  gap: 16px;\n}"
          },
          "Isso é uma barra lateral fixa e um conteúdo que ocupa o resto — exatamente o esqueleto deste portal. Em flexbox daria para fazer, mas exigiria declarar o comportamento em cada filho; em grid, o pai declara a forma e os filhos não precisam saber de nada."
        ]
      },
      "areas": {
        "title": "Áreas nomeadas: o layout desenhado",
        "body": [
          "A forma mais legível de grid é dar nome às regiões e desenhá-las:",
          {
            "code": "css",
            "text": ".app {\n  display: grid;\n  grid-template-columns: 240px 1fr;\n  grid-template-areas:\n    \"barra  barra\"\n    \"trilho conteudo\"\n    \"rodape rodape\";\n}\n.barra    { grid-area: barra; }\n.trilho   { grid-area: trilho; }\n.conteudo { grid-area: conteudo; }\n.rodape   { grid-area: rodape; }"
          },
          "O CSS passa a **parecer** o layout, e reorganizar tudo no celular é reescrever as três linhas de aspas dentro de uma media query — sem tocar em nenhum filho."
        ]
      },
      "implicit": {
        "title": "Grid implícito e grades que se ajustam",
        "body": [
          "Se você declara duas colunas e entram seis itens, o grid cria linhas novas sozinho: é o **grid implícito**, controlado por `grid-auto-rows`.",
          "A combinação mais rentável do CSS moderno faz uma grade responsiva **sem nenhuma media query**:",
          {
            "code": "css",
            "text": ".cartoes {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  gap: 12px;\n}"
          },
          "Lê-se: quantas colunas couberem, cada uma com no mínimo 220px e dividindo o resto igualmente. A grade se reorganiza sozinha em qualquer largura.",
          "`auto-fill` mantém as colunas vazias reservadas; `auto-fit` as colapsa, fazendo os itens existentes esticarem para preencher. Com poucos itens numa tela larga, a escolha entre os dois é bem visível."
        ]
      }
    },
    "CSS variables and organising stylesheets": {
      "variables": {
        "title": "Custom properties",
        "body": [
          "Variáveis de CSS são declaradas com dois hífens e lidas com `var()`:",
          {
            "code": "css",
            "text": ":root {\n  --azul: #5b8cff;\n  --espaco: 16px;\n}\n\n.botao {\n  background: var(--azul);\n  padding: var(--espaco);\n}"
          },
          "A diferença para as variáveis de um pré-processador é decisiva: estas **existem no navegador**. Elas herdam, podem ser trocadas dentro de um seletor, respondem a media query e são legíveis e escrevíveis pelo JavaScript em tempo de execução. Uma variável de Sass some na compilação; esta continua lá."
        ]
      },
      "theme": {
        "title": "Tema claro e escuro com uma chave",
        "body": [
          "Como as variáveis herdam, trocar um tema inteiro é redeclará-las num escopo acima:",
          {
            "code": "css",
            "text": ":root {\n  --fundo: #0a0e14;\n  --texto: #e8e6df;\n}\n\nhtml[data-tema=\"claro\"] {\n  --fundo: #f2f4f9;\n  --texto: #1a1f28;\n}\n\nbody { background: var(--fundo); color: var(--texto); }"
          },
          "O resto do CSS nunca menciona cor de tema: ele lê `var(--fundo)` e não sabe que existem dois. Trocar o tema vira acrescentar um atributo no `<html>` — uma linha de JavaScript, sem reescrever regra nenhuma. É exatamente como o portal e a vitrine fazem."
        ]
      },
      "organising": {
        "title": "Organizar sem virar arqueologia",
        "body": [
          "Um CSS que cresce sem ordem vira um arquivo em que ninguém ousa apagar nada. Três hábitos seguram isso:",
          [
            "**Ordem previsível no arquivo**: reset, variáveis, base, componentes, utilitários, media queries. Regra nova tem um lugar óbvio para entrar.",
            "**Especificidade baixa e plana**: classe simples, quase sem aninhar. Seletor com quatro níveis obriga o próximo a ter cinco.",
            "**Nome pelo que a coisa é, não pelo que ela parece**: `.aviso` sobrevive à decisão de deixar o aviso azul; `.texto-vermelho` não."
          ],
          "Se um `!important` apareceu, quase sempre a causa foi um seletor específico demais lá atrás. O conserto é baixar a especificidade daquele, não subir a deste."
        ]
      }
    },
    "Responsiveness: mobile first, media queries and container queries": {
      "mobile-first": {
        "title": "Mobile first é sobre o que é padrão",
        "body": [
          "Mobile first não é \"começar desenhando o celular\": é **escrever o CSS do celular sem media query nenhuma**, e usar as media queries só para acrescentar o que telas maiores permitem.",
          {
            "code": "css",
            "text": "/* padrão: uma coluna, vale para todo mundo */\n.grade { display: grid; gap: 12px; }\n\n/* a partir de 860px, duas colunas */\n@media (min-width: 860px) {\n  .grade { grid-template-columns: 1fr 1fr; }\n}"
          },
          "A ordem importa mais do que parece. Escrito ao contrário — desktop primeiro, com `max-width` — o celular precisa **desfazer** regras, e desfazer custa mais linhas e mais especificidade que acrescentar. Além disso, o aparelho mais fraco passa a baixar e aplicar o CSS que não vai usar."
        ]
      },
      "media": {
        "title": "Media queries além da largura",
        "body": [
          "Largura é a mais usada, e longe de ser a única:",
          {
            "code": "css",
            "text": "@media (max-height: 560px)          { }  /* teclado virtual aberto */\n@media (prefers-color-scheme: dark) { }  /* tema do sistema */\n@media (prefers-reduced-motion: reduce) { }  /* movimento reduzido */\n@media (hover: none)                { }  /* toque, sem cursor */"
          },
          "A de `prefers-reduced-motion` é a que mais gente esquece e a que mais importa para quem precisa dela: há pessoas para quem animação de deslocamento causa enjoo real. Respeitá-la é desligar transições dentro dessa consulta.",
          "`hover: none` resolve o menu que \"não abre no celular\": efeitos pendurados em `:hover` não existem no toque."
        ]
      },
      "container": {
        "title": "Container queries: o componente que se mede",
        "body": [
          "Media query pergunta o tamanho da **janela**. Isso quebra para componentes reutilizáveis: o mesmo cartão pode estar numa barra estreita ou ocupando a tela inteira, e a janela não distingue os dois casos.",
          "Container queries perguntam o tamanho do **contêiner**:",
          {
            "code": "css",
            "text": ".lista { container-type: inline-size; }\n\n@container (min-width: 400px) {\n  .cartao { display: grid; grid-template-columns: 80px 1fr; }\n}"
          },
          "O cartão passa a se adaptar ao espaço que **ele** recebeu, não ao tamanho do monitor. É a resposta certa para biblioteca de componentes, e hoje tem suporte em todos os navegadores atuais."
        ]
      }
    },
    "Transitions, animations and transforms": {
      "transition": {
        "title": "Transição: suavizar uma mudança",
        "body": [
          "`transition` interpola entre dois valores quando a propriedade muda:",
          {
            "code": "css",
            "text": ".botao {\n  background: var(--azul);\n  transition: background .2s ease, transform .2s ease;\n}\n.botao:hover {\n  transform: translateY(-2px);\n}"
          },
          "A transição é declarada no estado **normal**, não no `:hover` — assim ela vale na ida e na volta. Declarada só no `:hover`, o efeito entra suave e sai seco.",
          "Evite `transition: all`. Ele passa a animar propriedades que você nem sabia que mudaram, e é uma fonte silenciosa de travamento."
        ]
      },
      "transform": {
        "title": "Transformações",
        "body": [
          "`transform` move, gira, escala e inclina sem tirar o elemento do fluxo: **o espaço dele continua reservado** onde sempre esteve, e nada em volta se mexe.",
          {
            "code": "css",
            "text": ".selo {\n  transform: translateX(10px) rotate(-3deg) scale(1.05);\n  transform-origin: left center;\n}"
          },
          "A ordem das funções importa: girar e depois deslocar não dá no mesmo que deslocar e depois girar, porque cada uma opera no sistema de coordenadas deixado pela anterior."
        ]
      },
      "keyframes": {
        "title": "Animações, e o custo de cada propriedade",
        "body": [
          "Para algo que acontece sozinho, `@keyframes` descreve o caminho:",
          {
            "code": "css",
            "text": "@keyframes surgir {\n  from { opacity: 0; transform: translateY(8px); }\n  to   { opacity: 1; transform: none; }\n}\n\n.painel { animation: surgir .3s ease both; }"
          },
          "Repare no que está sendo animado, e é a regra mais rentável desta aula inteira: **anime `transform` e `opacity`.** Elas mexem só na composição, que a placa de vídeo faz sozinha. Animar `width`, `top` ou `margin` refaz o layout de tudo em volta a cada quadro, e é isso que trava em celular.",
          "E respeite quem pediu menos movimento:",
          {
            "code": "css",
            "text": "@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}"
          }
        ]
      }
    },
    "Tailwind CSS: utilities, configuration and components": {
      "utilities": {
        "title": "A ideia: uma classe, uma propriedade",
        "body": [
          "Tailwind inverte a organização do CSS. Em vez de nomear componentes e descrevê-los num arquivo à parte, você compõe o estilo no próprio HTML com classes de uma propriedade cada:",
          {
            "code": "html",
            "text": "<button class=\"px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600\">\n  Enviar\n</button>"
          },
          "O ganho real não é digitar menos — é que **o CSS para de crescer**. Não há nome a inventar, não há arquivo a caçar, e apagar o HTML apaga o estilo junto. Some a classe órfã que ninguém tem coragem de remover.",
          "O custo é igualmente real: o HTML fica poluído, e a leitura de um trecho longo piora. É uma troca, não uma vitória."
        ]
      },
      "configuration": {
        "title": "Configuração é onde o design system mora",
        "body": [
          "As classes saem de uma escala configurável. Personalizar a escala é o que impede o Tailwind de ser um monte de valores mágicos:",
          {
            "code": "css",
            "text": "@theme {\n  --color-marca: #5b8cff;\n  --spacing-secao: 4.5rem;\n}\n/* passam a existir bg-marca, text-marca, p-secao… */"
          },
          "Feito isso, `bg-marca` é a cor da marca em todo lugar, e trocá-la é editar uma linha. É o mesmo papel das variáveis CSS da aula 09 — a diferença é que aqui a escala também gera as classes."
        ]
      },
      "when-not": {
        "title": "Quando não usar",
        "body": [
          "Repetir a mesma sequência de dez classes em quinze lugares é sinal de que ali havia um componente. A saída certa é o componente do framework que você já usa — um `<Botao>` em React, um parcial no template —, não uma classe nova que reagrupa utilitários.",
          "E Tailwind **não** dispensa saber CSS. Cada classe é uma propriedade: quem não entende especificidade, modelo de caixa e flexbox não entende `flex-1`, `min-w-0` nem por que a sombra sumiu. As doze aulas anteriores continuam sendo o pré-requisito.",
          "A régua honesta: Tailwind rende em produto com muitos componentes e um time que compartilha a escala. Numa página institucional de cinco telas, o CSS escrito à mão é menor, mais legível e não traz ferramenta nenhuma junto."
        ]
      }
    }
  },
  "javascript": {
    "ES6+ syntax: let/const, arrow functions and template strings": {
      "intro": {
        "title": "Apresentação do curso"
      },
      "let-const": {
        "title": "let e const: o fim do var",
        "body": [
          "`var` tem duas propriedades que ninguém pediu: ela vaza para fora do bloco onde foi declarada e pode ser redeclarada sem reclamação. `let` e `const` não fazem nem uma coisa nem outra, e por isso `var` não aparece mais em código novo.",
          {
            "example": {
              "language": "javascript",
              "file": "escopo.js",
              "parts": [
                {
                  "code": "if (true) {\n  var antiga = \"eu vazo\";\n  let nova = \"eu fico\";\n}",
                  "note": "As duas são declaradas dentro do `if`. Só uma delas continua existindo depois da chave que fecha."
                },
                {
                  "code": "console.log(antiga);",
                  "note": "`var` é de FUNÇÃO, não de bloco: ela foi içada para o topo da função e sobreviveu ao bloco. É daí que vem quase todo bug de variável trocada em laço."
                },
                {
                  "code": "try {\n  console.log(nova);\n} catch (e) {\n  console.log(e.constructor.name);\n}",
                  "note": "`let` morre com o bloco. Fora dele o nome nem existe — e o erro é `ReferenceError`, não `undefined`, o que é uma diferença importante: falhar alto é melhor que seguir com lixo."
                },
                {
                  "code": "const lista = [1, 2];\nlista.push(3);\nconsole.log(lista);",
                  "note": "A confusão mais comum de `const`: ela congela a LIGAÇÃO, não o valor. `lista = []` daria erro; mexer dentro do array, não. Para congelar o conteúdo existe `Object.freeze`."
                }
              ],
              "output": "eu vazo\nReferenceError\n[ 1, 2, 3 ]"
            }
          },
          "A regra prática: **`const` por padrão, `let` quando o valor for mesmo trocar, `var` nunca.** Começar por `const` faz o compilador avisar quando você reatribui sem querer — e a maioria das reatribuições que a gente escreve sem pensar é acidente."
        ]
      },
      "arrow": {
        "title": "Arrow functions, e o que elas não têm",
        "body": [
          "A seta encurta a escrita, mas essa é a parte menos importante. O que muda de verdade é que ela **não tem `this` próprio** — ela usa o `this` de onde foi escrita.",
          {
            "example": {
              "language": "javascript",
              "file": "seta.js",
              "parts": [
                {
                  "code": "const dobro = n => n * 2;\nconsole.log(dobro(4));",
                  "note": "Um parâmetro, um retorno: sem parênteses, sem `return`, sem chaves. É a forma que aparece dentro de `map` e `filter` o tempo todo."
                },
                {
                  "code": "const par = (a, b) => ({ a, b });\nconsole.log(par(1, 2));",
                  "note": "Devolver um objeto exige os parênteses em volta. Sem eles, `{` é lido como início de bloco, e a função devolve `undefined` — em silêncio."
                },
                {
                  "code": "const contador = {\n  n: 7,\n  comum() { return this.n; },\n  seta: () => (typeof this === \"undefined\" ? \"sem this\" : \"this de fora\"),\n};",
                  "note": "A diferença que importa. A função comum recebe `this` de quem a CHAMOU; a seta herdou o `this` do lugar onde foi ESCRITA — e num módulo ES esse lugar não tem `this` nenhum."
                },
                {
                  "code": "console.log(contador.comum());\nconsole.log(contador.seta());",
                  "note": "A seta nem enxerga o objeto de que é propriedade. Por isso ela é ótima para callback — carrega o `this` de fora junto — e péssima para método."
                }
              ],
              "output": "8\n{ a: 1, b: 2 }\n7\nsem this"
            }
          }
        ]
      },
      "template": {
        "title": "Template strings",
        "body": [
          "Crase em vez de aspas, `${}` para interpolar, e a quebra de linha vale literalmente. Some a concatenação com `+`, que é onde nascem os espaços faltando.",
          {
            "code": "javascript",
            "text": "const nome = \"Ana\";\nconst n = 3;\n\nconsole.log(`${nome} concluiu ${n} ${n === 1 ? \"curso\" : \"cursos\"}.`);\n// Ana concluiu 3 cursos."
          },
          "A interpolação aceita **qualquer expressão**, não só variável — chamada de função, ternário, operação. O que ela não deve receber é texto vindo do usuário destinado a virar HTML: aí a interpolação vira o furo, e é por isso que este portal tem um `esc()` em `app/text.js`."
        ]
      }
    },
    "Types, coercion, strict equality and falsy values": {
      "coercion": {
        "title": "Coerção: quando a linguagem adivinha",
        "body": [
          "JavaScript converte tipos sozinho quando um operador recebe o que não esperava. Isso resolve pequenas conveniências e cria as maiores surpresas da linguagem.",
          {
            "example": {
              "language": "javascript",
              "file": "coercao.js",
              "parts": [
                {
                  "code": "console.log(1 + \"1\");\nconsole.log(1 - \"1\");",
                  "note": "`+` é sobrecarregado: com uma string de um lado ele CONCATENA. `-` não tem essa ambiguidade, então converte para número. Mesmo par de valores, dois resultados de naturezas diferentes."
                },
                {
                  "code": "console.log([] + {});\nconsole.log([1, 2] + [3]);",
                  "note": "Objeto virando string passa por `toString()`. O de array junta com vírgula; o de objeto comum devolve `[object Object]`. É por isso que aquela mensagem aparece na tela às vezes."
                },
                {
                  "code": "console.log(0.1 + 0.2);\nconsole.log(0.1 + 0.2 === 0.3);",
                  "note": "Este não é bug de JavaScript: é ponto flutuante IEEE-754, e vale igual em Python, Java e C. Dinheiro se guarda em centavos inteiros, nunca em `float`."
                },
                {
                  "code": "console.log(Number(\"12px\"));\nconsole.log(parseInt(\"12px\", 10));",
                  "note": "`Number` é tudo ou nada; `parseInt` lê enquanto der e para. Ler a largura de um CSS pede o segundo — e o `10` não é opcional por hábito, é o que evita a base errada."
                }
              ],
              "output": "11\n0\n[object Object]\n1,23\n0.30000000000000004\nfalse\nNaN\n12"
            }
          }
        ]
      },
      "equality": {
        "title": "== contra ===",
        "body": [
          "`==` compara depois de converter; `===` compara sem converter. A tabela do `==` tem casos que ninguém memoriza, e a saída disso é simples: **use `===` sempre.**",
          {
            "example": {
              "language": "javascript",
              "file": "igual.js",
              "parts": [
                {
                  "code": "console.log(0 == \"\");\nconsole.log(0 == \"0\");\nconsole.log(\"\" == \"0\");",
                  "note": "Os três com `==`. Repare que os dois primeiros são verdadeiros e o terceiro é falso: `==` **não é transitivo**, o que basta para descartá-lo."
                },
                {
                  "code": "console.log(null == undefined);\nconsole.log(null === undefined);",
                  "note": "A única exceção que vale conhecer: `x == null` é o jeito curto de perguntar \"é `null` ou `undefined`?\". É o único uso defensável de `==`."
                },
                {
                  "code": "console.log(NaN === NaN);\nconsole.log(Number.isNaN(NaN));",
                  "note": "`NaN` é o único valor diferente de si mesmo. Testar com `===` nunca funciona; a pergunta certa é `Number.isNaN`."
                }
              ],
              "output": "true\ntrue\nfalse\ntrue\nfalse\nfalse\ntrue"
            }
          }
        ]
      },
      "falsy": {
        "title": "Os oito valores falsos",
        "body": [
          "Num `if`, qualquer valor vira booleano. São **oito** os que viram `false` — e todo o resto vira `true`, inclusive `[]`, `{}` e `\"0\"`:",
          [
            "`false`, `0`, `-0`, `0n` (BigInt zero)",
            "`\"\"` (string vazia)",
            "`null`, `undefined`, `NaN`"
          ],
          "A armadilha prática está em `0` e `\"\"` serem falsos: `if (quantidade)` ignora a quantidade zero, e `if (nome)` ignora o nome vazio — nos dois casos tratando \"existe e vale zero/vazio\" como \"não existe\".",
          {
            "example": {
              "language": "javascript",
              "file": "falsos.js",
              "parts": [
                {
                  "code": "const config = { retries: 0, titulo: \"\" };",
                  "note": "Dois valores legítimos que por acaso são falsos. Zero tentativas é uma decisão; título vazio também."
                },
                {
                  "code": "console.log(config.retries || 3);\nconsole.log(config.titulo || \"sem título\");",
                  "note": "O `||` clássico atropela os dois: ele testa \"é falso?\", não \"está ausente?\". O zero que o usuário escolheu virou três."
                },
                {
                  "code": "console.log(config.retries ?? 3);\nconsole.log(JSON.stringify(config.titulo ?? \"sem título\"));",
                  "note": "`??` só entra em ação para `null` e `undefined` — o zero e a string vazia passam intactos. É o operador que a maioria dos `||` de valor padrão realmente queria ser. (O `JSON.stringify` está aí só para a string vazia aparecer como `\"\"` em vez de uma linha em branco.)"
                }
              ],
              "output": "3\nsem título\n0\n\"\""
            }
          }
        ]
      }
    },
    "Objects, arrays, spread and destructuring": {
      "destructuring": {
        "title": "Desestruturação",
        "body": [
          "Tirar campos de um objeto ou itens de um array sem repetir o nome da fonte em cada linha. É a sintaxe que mais aparece em código moderno depois da seta.",
          {
            "example": {
              "language": "javascript",
              "file": "destruct.js",
              "parts": [
                {
                  "code": "const curso = { id: \"js\", nome: \"JavaScript\", horas: 80 };",
                  "note": "O objeto de partida."
                },
                {
                  "code": "const { nome, horas } = curso;\nconsole.log(nome, horas);",
                  "note": "Os nomes à esquerda são as CHAVES, não posições. Ordem não importa; grafia importa."
                },
                {
                  "code": "const { nome: titulo, nivel = \"livre\" } = curso;\nconsole.log(titulo, nivel);",
                  "note": "Duas coisas de uma vez: renomear na saída, e um padrão para a chave que não existe. O padrão só entra quando o valor é `undefined` — `null` passa direto."
                },
                {
                  "code": "function resumo({ nome, horas }) {\n  return `${nome}: ${horas}h`;\n}\nconsole.log(resumo(curso));",
                  "note": "Desestruturar no PARÂMETRO é onde ela mais rende: a assinatura passa a documentar o que a função usa, em vez de receber um `opcoes` opaco."
                }
              ],
              "output": "JavaScript 80\nJavaScript livre\nJavaScript: 80h"
            }
          }
        ]
      },
      "spread": {
        "title": "Espalhar e juntar",
        "body": [
          "As mesmas três reticências fazem coisas opostas conforme o lado em que estão: à direita elas **espalham**, à esquerda elas **juntam**.",
          {
            "example": {
              "language": "javascript",
              "file": "spread.js",
              "parts": [
                {
                  "code": "const base = { tema: \"escuro\", idioma: \"pt\" };\nconst novo = { ...base, idioma: \"en\" };\nconsole.log(novo);",
                  "note": "Cópia com alteração, sem mexer no original. A ordem decide quem vence: a última chave repetida sobrescreve — por isso `idioma` sai `en`."
                },
                {
                  "code": "const a = [1, 2];\nconst b = [0, ...a, 3];\nconsole.log(b);",
                  "note": "O mesmo em array, mantendo a ordem. Substitui `concat` e o velho `push.apply`."
                },
                {
                  "code": "function soma(...numeros) {\n  return numeros.reduce((t, n) => t + n, 0);\n}\nconsole.log(soma(1, 2, 3, 4));",
                  "note": "Do outro lado: aqui as reticências JUNTAM os argumentos num array de verdade. É o substituto de `arguments`, que não era array e não existe em arrow function."
                },
                {
                  "code": "const orig = { dono: { nome: \"Ana\" } };\nconst copia = { ...orig };\ncopia.dono.nome = \"Bia\";\nconsole.log(orig.dono.nome);",
                  "note": "A pegadinha: a cópia é RASA. O objeto de dentro continua sendo o mesmo, e alterá-lo altera os dois. Para cópia profunda existe `structuredClone`."
                }
              ],
              "output": "{ tema: 'escuro', idioma: 'en' }\n[ 0, 1, 2, 3 ]\n10\nBia"
            }
          }
        ]
      }
    },
    "Functions, scope, closures and the value of `this`": {
      "closure": {
        "title": "Closure: a função que lembra",
        "body": [
          "Uma função criada dentro de outra continua enxergando as variáveis da de fora, mesmo depois de a de fora ter terminado. Isso não é um recurso avançado: é o que faz callback, `setTimeout` e quase todo padrão de módulo funcionarem.",
          {
            "example": {
              "language": "javascript",
              "file": "closure.js",
              "parts": [
                {
                  "code": "function contador() {\n  let n = 0;",
                  "note": "`n` vive dentro de `contador`. Ninguém de fora consegue tocá-lo — não há `private`, e não precisa."
                },
                {
                  "code": "  return {\n    incrementar: () => ++n,\n    ler: () => n,\n  };\n}",
                  "note": "As duas setas fecham sobre o mesmo `n`. Devolver funções em vez do valor é o que transforma escopo em encapsulamento."
                },
                {
                  "code": "const c = contador();\nc.incrementar();\nc.incrementar();\nconsole.log(c.ler());",
                  "note": "`contador()` já retornou faz tempo, e `n` continua vivo — porque alguém ainda o referencia. É o coletor de lixo que decide, não a pilha de chamadas."
                },
                {
                  "code": "const outro = contador();\nconsole.log(outro.ler());",
                  "note": "Cada chamada cria um escopo NOVO. Dois contadores não compartilham nada, que é o que separa closure de variável global."
                }
              ],
              "output": "2\n0"
            }
          }
        ]
      },
      "this": {
        "title": "O valor de this",
        "body": [
          "`this` não é decidido onde a função é escrita, e sim **onde ela é chamada** — com uma exceção, a arrow function. Quase todo bug de `this` é a mesma função tendo sido separada do objeto dela.",
          {
            "example": {
              "language": "javascript",
              "file": "this.js",
              "parts": [
                {
                  "code": "const aluno = {\n  nome: \"Ana\",\n  ola() { return `oi, ${this.nome}`; },\n};\nconsole.log(aluno.ola());",
                  "note": "Chamada como método: `this` é o que está à esquerda do ponto."
                },
                {
                  "code": "const solta = aluno.ola;\ntry {\n  console.log(solta());\n} catch (e) {\n  console.log(e.constructor.name);\n}",
                  "note": "A MESMA função, chamada sem dono. Em módulo ES o `this` é `undefined`, e ler `.nome` dele explode. É exatamente o que acontece ao passar `obj.metodo` como callback — e o `try` está aqui só para o exemplo continuar rodando."
                },
                {
                  "code": "const presa = aluno.ola.bind(aluno);\nconsole.log(presa());",
                  "note": "`bind` amarra o `this` de uma vez. A alternativa moderna é passar uma seta: `() => aluno.ola()`, que carrega o contexto de fora."
                }
              ],
              "output": "oi, Ana\nTypeError\noi, Ana"
            }
          }
        ]
      }
    }
  }
};
