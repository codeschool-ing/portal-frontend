/* ==========================================================================
   `web-fundamentos` exercises — one file per course, as the pipeline does.

   The pipeline emits `exercicios-<course>.json`. Here the extension is `.js`
   because the portal has no server yet to fetch JSON from (and a `fetch` from
   `file://` is blocked, which would break the single-file bundle), but the
   content of each object is exactly what the tool produces.

   SIX OF THE SEVEN TYPES, AND THAT IS NOT AN OVERSIGHT
   `codigo` does not appear here, and the reason is a rule of the generator: an
   exercise from topic N may only require what topics 1..N taught.
   `web-fundamentos` teaches no language — it is the school's first course, with
   no prerequisite — so asking for a program to be written would require what the
   course did not give. It is the same finding `RULES.md` recorded in
   `arquiteto-comunicacao`: in a course with no code, three of the seven types
   are inapplicable. Here only one is, because the last lesson covers the console.

   `resposta-expressao` genuinely fits in lesson 03: bandwidth, latency and
   throughput are an algebraic relation, and the CAS checks the equivalence
   without demanding a particular form.

   STATUS: sample content, technically correct and with no pedagogical review. It
   did not go through the funnel — all of them are marked
   `_verificacao: 'estrutura'`, which is the weakest mark and is the truth about
   them.
   ========================================================================== */

window.EXERCICIOS_EXEMPLO = (window.EXERCICIOS_EXEMPLO || []).concat([

  /* ============================================================== lesson 01 */
  {
    id: 'wf-01-quiz',
    curso: 'web-fundamentos',
    topico: 'Cliente, servidor e host: quem pede e quem responde',
    tipo: 'quiz',
    dificuldade: 'facil',
    enunciado: 'Um servidor web precisa consultar um banco de dados para montar a resposta. Nesse instante, o que ele é?',
    dica_socratica: 'Os papéis descrevem o momento da conversa, não o equipamento. Quem inicia a conversa com o banco?',
    alternativas: [
      {
        texto: 'Cliente do banco de dados, porque é ele quem inicia aquele pedido — e continua sendo servidor na conversa com o navegador.',
        correta: true,
        porque: 'Os papéis são do momento: a mesma máquina pode ser servidora numa conversa e cliente noutra, ao mesmo tempo.',
      },
      {
        texto: 'Continua sendo apenas servidor, porque uma máquina configurada como servidor não pode assumir outro papel.',
        correta: false,
        porque: 'A configuração define que programas ela roda, não que papel ela ocupa em cada conversa.',
      },
      {
        texto: 'Passa a ser um host intermediário, categoria distinta de cliente e de servidor.',
        correta: false,
        porque: '`Host` é o termo neutro para qualquer máquina com endereço, não um terceiro papel na conversa.',
      },
      {
        texto: 'Nenhum dos dois, porque a consulta acontece dentro da mesma rede local e dispensa os papéis.',
        correta: false,
        porque: 'A distância não muda nada: quem pede é cliente, esteja o outro lado no rack ao lado ou noutro continente.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-01-assoc',
    curso: 'web-fundamentos',
    topico: 'Cliente, servidor e host: quem pede e quem responde',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada termo ao que ele descreve. Sobram opções na coluna da direita.',
    dica_socratica: 'Dois destes termos descrevem um papel numa conversa; um descreve a máquina, independentemente do que ela esteja fazendo.',
    pares: [
      { esquerda: 'cliente', direita: 'Quem inicia a conversa e faz o pedido' },
      { esquerda: 'servidor', direita: 'Quem espera ser perguntado e devolve a resposta' },
      { esquerda: 'host', direita: 'Qualquer máquina com endereço na rede' },
      { esquerda: 'porta', direita: 'O número que diz a qual programa o dado se destina' },
    ],
    distratores_direita: [
      'O cabo físico que liga duas máquinas vizinhas',
      'O programa que traduz nomes de domínio em endereços',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 02 */
  {
    id: 'wf-02-quiz',
    curso: 'web-fundamentos',
    topico: 'Pacote, quadro (frame) e socket',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Durante uma transferência, o endereço MAC de destino do quadro muda várias vezes, enquanto o endereço IP de destino do pacote permanece o mesmo. Por quê?',
    dica_socratica: 'Um dos dois endereços aponta para o fim da viagem; o outro aponta para o próximo trecho dela.',
    alternativas: [
      {
        texto: 'O MAC endereça o próximo salto e é reescrito a cada trecho; o IP endereça o destino final e atravessa a viagem inteira.',
        correta: true,
        porque: 'É a diferença entre o endereço no envelope e a placa do caminhão que o transporta agora.',
      },
      {
        texto: 'O MAC muda porque é sorteado a cada transmissão, para dificultar rastreamento na rede local.',
        correta: false,
        porque: 'O MAC vem gravado na placa. Alguns sistemas o alteram por privacidade, mas isso é opcional e não acontece a cada quadro.',
      },
      {
        texto: 'O IP permanece porque é criptografado pelo TLS e não pode ser reescrito pelos roteadores.',
        correta: false,
        porque: 'O TLS cifra o conteúdo, não o cabeçalho IP — que precisa ficar legível justamente para o pacote ser roteado.',
      },
      {
        texto: 'São os dois reescritos, mas o IP volta ao valor original antes de chegar ao destino.',
        correta: false,
        porque: 'O IP de destino não é reescrito no caminho comum; quem faz algo parecido é o NAT, e só com o endereço de origem.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-02-assoc',
    curso: 'web-fundamentos',
    topico: 'Pacote, quadro (frame) e socket',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada porta ao serviço que costuma escutá-la. Sobram opções na coluna da direita.',
    dica_socratica: 'Duas delas diferem por uma letra no nome do protocolo e por uma camada de cifra.',
    pares: [
      { esquerda: '`80`', direita: 'HTTP' },
      { esquerda: '`443`', direita: 'HTTPS' },
      { esquerda: '`22`', direita: 'SSH' },
      { esquerda: '`5432`', direita: 'PostgreSQL' },
    ],
    distratores_direita: ['DNS', 'SMTP'],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 03 */
  {
    id: 'wf-03-quiz',
    curso: 'web-fundamentos',
    topico: 'Largura de banda, latência e vazão (throughput)',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Uma equipe reclama que a chamada de vídeo com um escritório na Europa trava. O provedor oferece dobrar a largura de banda. O que esperar?',
    dica_socratica: 'Qual das três medidas explica melhor uma chamada que trava? E qual delas um cano mais grosso realmente altera?',
    alternativas: [
      {
        texto: 'Pouca ou nenhuma melhora, porque o problema provável é a latência — e ela depende da distância, não da banda contratada.',
        correta: true,
        porque: 'Um cano mais grosso não encurta a estrada: 150 ms continuam sendo 150 ms com qualquer plano.',
      },
      {
        texto: 'Melhora proporcional: o dobro de banda reduz o tempo de viagem à metade.',
        correta: false,
        porque: 'Banda e tempo de viagem são grandezas independentes; dobrar uma não altera a outra.',
      },
      {
        texto: 'Melhora garantida, porque a vazão sempre alcança a largura de banda contratada.',
        correta: false,
        porque: 'A vazão costuma ficar abaixo da banda — é justamente a diferença entre as duas que revela o problema.',
      },
      {
        texto: 'Piora, porque mais banda aumenta o congestionamento no caminho.',
        correta: false,
        porque: 'Mais capacidade não gera congestionamento; ela apenas não resolve o que não é problema de capacidade.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-03-expr',
    curso: 'web-fundamentos',
    topico: 'Largura de banda, latência e vazão (throughput)',
    tipo: 'resposta-expressao',
    dificuldade: 'media',
    enunciado: 'Um arquivo de `T` bits é transferido por um caminho de vazão `v` bits por segundo, e a conexão leva `L` segundos para ser estabelecida antes de o primeiro bit sair. Escreva a expressão do tempo total, em segundos.',
    dica_socratica: 'São duas parcelas que se somam: uma não depende do tamanho do arquivo e a outra depende. Qual é qual?',
    expressao_gabarito: 'L + T/v',
    variaveis: ['T:positive', 'v:positive', 'L:positive'],
    verificacao_origem: 'L + T/v',
    verificacao_operacao: 'simplify',
    verificacao_variavel: 'T',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 04 */
  {
    id: 'wf-04-mult',
    curso: 'web-fundamentos',
    topico: 'Endereço IP, endereço MAC e ARP',
    tipo: 'multipla-escolha',
    dificuldade: 'media',
    enunciado: 'Marque todas as afirmações verdadeiras sobre endereços IP e MAC.',
    dica_socratica: 'Um dos dois descreve onde a máquina está; o outro, qual máquina ela é. Leve o notebook para outra rede e veja qual dos dois muda.',
    alternativas: [
      { texto: 'O IP muda quando a máquina se conecta a outra rede.', correta: true, porque: 'O IP descreve posição, como um endereço postal.' },
      { texto: 'O MAC acompanha o equipamento para onde ele for.', correta: true, porque: 'O MAC é identidade da placa, gravado nela.' },
      { texto: 'Faixas como `192.168.x.x` são reutilizadas dentro de cada rede local e não existem na internet.', correta: true, porque: 'São faixas privadas; o roteador traduz para o IP público pelo NAT.' },
      { texto: 'O servidor de um site vê o endereço MAC do notebook que o acessou.', correta: false, porque: 'MAC só tem significado no enlace local: o servidor vê o MAC do último roteador do caminho dele.' },
      { texto: 'O IPv6 existe para dar mais velocidade que o IPv4.', correta: false, porque: 'Ele existe porque os 4,3 bilhões de endereços do IPv4 acabaram — é questão de espaço, não de velocidade.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-04-quiz',
    curso: 'web-fundamentos',
    topico: 'Endereço IP, endereço MAC e ARP',
    tipo: 'quiz',
    dificuldade: 'dificil',
    enunciado: 'Numa rede pública, uma máquina responde às perguntas do ARP se passando pelo roteador e passa a receber o tráfego dos vizinhos. O que torna esse ataque possível?',
    dica_socratica: 'O que o protocolo faz quando duas máquinas respondem à mesma pergunta? Ele confere alguma coisa antes de acreditar?',
    alternativas: [
      {
        texto: 'O ARP não autentica as respostas: quem responder é acreditado, e a resposta fica em cache por alguns minutos.',
        correta: true,
        porque: 'É a razão pela qual HTTPS em rede pública deixa de ser recomendação e vira necessidade.',
      },
      {
        texto: 'O ARP transmite as respostas sem cifra, e por isso podem ser lidas e alteradas em trânsito.',
        correta: false,
        porque: 'A leitura não é o problema aqui: o ataque funciona porque a resposta forjada é aceita, não porque a verdadeira foi lida.',
      },
      {
        texto: 'O cache de ARP nunca expira, então uma resposta forjada vale para sempre.',
        correta: false,
        porque: 'O cache expira em minutos — o atacante precisa repetir a resposta, e isso não impede o ataque.',
      },
      {
        texto: 'O ARP usa endereços IP em vez de MAC, e por isso não distingue máquinas da mesma rede.',
        correta: false,
        porque: 'O ARP faz exatamente a ponte entre os dois: pergunta por IP e recebe um MAC.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 05 */
  {
    id: 'wf-05-ord',
    curso: 'web-fundamentos',
    topico: 'Redes em camadas: do cabo até o navegador',
    tipo: 'ordenacao',
    dificuldade: 'media',
    enunciado: 'Ponha as camadas na ordem em que os dados as atravessam ao **sair** do seu navegador rumo à rede, da mais alta para a mais baixa.',
    dica_socratica: 'Cada camada envelopa a de cima. Qual delas produz o conteúdo que todas as outras vão embrulhar?',
    itens: [
      'Aplicação: o navegador monta o pedido HTTP',
      'Transporte: o pedido é cortado em segmentos e recebe as portas',
      'Rede: cada segmento vira pacote e recebe os endereços IP',
      'Enlace: cada pacote vira quadro e recebe o MAC do próximo salto',
    ],
    armadilha: 'O par transporte–rede. Quem memorizou "IP é o principal" tende a pôr a camada de rede antes da de transporte, como se o endereço viesse antes do corte em segmentos. Não vem: é o transporte que decide o tamanho de cada pedaço e a qual programa ele pertence, e só então cada pedaço ganha endereço de destino. Inverter os dois faria o pacote ser endereçado antes de existir.',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-05-quiz',
    curso: 'web-fundamentos',
    topico: 'Redes em camadas: do cabo até o navegador',
    tipo: 'quiz',
    dificuldade: 'facil',
    enunciado: 'Uma chamada de vídeo ao vivo usa UDP em vez de TCP. Qual é o raciocínio?',
    dica_socratica: 'Pergunte o que acontece com um quadro de vídeo que chega meio segundo atrasado. Ele ainda serve para alguma coisa?',
    alternativas: [
      {
        texto: 'Num vídeo ao vivo o dado atrasado já não tem serventia, e esperar pelo reenvio travaria a imagem — é melhor perder o pedaço.',
        correta: true,
        porque: 'A regra de bolso: se o dado incompleto é inútil, TCP; se o dado atrasado é inútil, UDP.',
      },
      {
        texto: 'O UDP cifra o conteúdo por padrão, e chamadas de vídeo exigem confidencialidade.',
        correta: false,
        porque: 'O UDP não cifra nada; a cifra de uma chamada vem de outra camada.',
      },
      {
        texto: 'O TCP não funciona com dados contínuos, apenas com arquivos de tamanho conhecido.',
        correta: false,
        porque: 'O TCP transporta fluxo contínuo sem dificuldade — é o que o próprio HTTP faz.',
      },
      {
        texto: 'O UDP garante entrega mais rápida porque confirma cada pacote com menos bytes.',
        correta: false,
        porque: 'O UDP não confirma nada: é a ausência de confirmação que o torna barato.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 06 */
  {
    id: 'wf-06-quiz',
    curso: 'web-fundamentos',
    topico: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Uma aplicação apagava registros por links `GET /apagar?id=7`. Depois de o site ser indexado, vários registros sumiram sem ninguém ter clicado em nada. O que explica?',
    dica_socratica: 'Quem mais, além de uma pessoa, segue links de uma página? E que promessa o método `GET` faz a quem os segue?',
    alternativas: [
      {
        texto: '`GET` promete não alterar nada, então rastreadores e pré-carregamentos o repetem à vontade — e cada visita executou a exclusão.',
        correta: true,
        porque: 'A promessa não é formalidade: navegadores, proxies e buscadores contam com ela.',
      },
      {
        texto: 'O buscador enviou `DELETE` para os endereços que encontrou, seguindo o padrão REST.',
        correta: false,
        porque: 'Rastreadores só fazem `GET`; nenhum deles envia `DELETE` por conta própria.',
      },
      {
        texto: 'A indexação expôs os endereços, e pessoas os acessaram manualmente.',
        correta: false,
        porque: 'Pode ter havido isso também, mas a causa que explica exclusões sem clique é a repetição automática do `GET`.',
      },
      {
        texto: 'O código `200` devolvido pela exclusão fez o buscador repetir o pedido para confirmar.',
        correta: false,
        porque: 'O `200` não pede repetição; o rastreador repete porque `GET` é declarado seguro, independentemente do status.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-06-assoc',
    curso: 'web-fundamentos',
    topico: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada código de status ao que ele comunica. Sobram opções na coluna da direita.',
    dica_socratica: 'Dois deles falam de identidade e permissão, e a diferença entre os dois é se o servidor já sabe quem você é.',
    pares: [
      { esquerda: '`301`', direita: 'Mudou de endereço em definitivo' },
      { esquerda: '`401`', direita: 'Não sei quem você é' },
      { esquerda: '`403`', direita: 'Sei quem você é, e você não pode' },
      { esquerda: '`502`', direita: 'O servidor de trás respondeu mal' },
      { esquerda: '`429`', direita: 'Você está pedindo com frequência demais' },
    ],
    distratores_direita: [
      'O conteúdo não mudou desde a última vez',
      'O pedido está malformado e não pôde ser interpretado',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-06-mult',
    curso: 'web-fundamentos',
    topico: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    tipo: 'multipla-escolha',
    dificuldade: 'dificil',
    enunciado: 'Marque tudo o que o TLS entrega numa conexão HTTPS.',
    dica_socratica: 'São três garantias, e uma delas é o que o cadeado da barra realmente representa. Pense também no que a rede continua conseguindo observar.',
    alternativas: [
      { texto: 'Confidencialidade: ninguém no caminho lê o conteúdo.', correta: true, porque: 'É a garantia mais lembrada, e apenas uma das três.' },
      { texto: 'Integridade: alterar o conteúdo em trânsito se denuncia.', correta: true, porque: 'Sem ela, cifrar não bastaria — dava para corromper sem ler.' },
      { texto: 'Autenticidade: o certificado prova que aquele servidor é o dono do domínio.', correta: true, porque: 'É o que o cadeado representa — "é mesmo o site cujo nome está na barra", não "site confiável".' },
      { texto: 'Anonimato: a rede não descobre qual domínio foi acessado.', correta: false, porque: 'O nome do domínio e o volume de dados continuam visíveis para a rede.' },
      { texto: 'Idoneidade: o site foi verificado como confiável por uma autoridade.', correta: false, porque: 'A autoridade certifica posse do domínio, não a honestidade de quem o opera.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 07 */
  {
    id: 'wf-07-quiz',
    curso: 'web-fundamentos',
    topico: 'Cookies, sessões e cache do navegador',
    tipo: 'quiz',
    dificuldade: 'dificil',
    enunciado: 'Uma aplicação passou a rodar em dois servidores atrás de um balanceador. Os usuários começaram a "cair" da sessão sem padrão aparente. Qual é a causa mais provável?',
    dica_socratica: 'O cookie carrega só um identificador. Onde estão guardados os dados que ele identifica, e os dois servidores enxergam o mesmo lugar?',
    alternativas: [
      {
        texto: 'A sessão está na memória de cada servidor, então metade dos pedidos chega a quem não a tem.',
        correta: true,
        porque: 'Por isso sessão em produção mora em lugar compartilhado — Redis, banco — ou não existe, e o estado vai num token assinado.',
      },
      {
        texto: 'O cookie expira mais rápido quando há mais de um servidor respondendo.',
        correta: false,
        porque: 'A validade do cookie é declarada no `Set-Cookie` e não depende de quantos servidores existem.',
      },
      {
        texto: 'O atributo `SameSite` bloqueia o cookie quando o balanceador troca de servidor.',
        correta: false,
        porque: '`SameSite` trata de pedidos vindos de outro site; o domínio aqui continua o mesmo.',
      },
      {
        texto: 'O `HttpOnly` impede que o segundo servidor leia o cookie.',
        correta: false,
        porque: '`HttpOnly` impede o JavaScript da página de ler; o servidor recebe o cookie normalmente.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-07-assoc',
    curso: 'web-fundamentos',
    topico: 'Cookies, sessões e cache do navegador',
    tipo: 'associacao',
    dificuldade: 'media',
    enunciado: 'Associe cada diretiva ou atributo ao efeito dela. Sobram opções na coluna da direita.',
    dica_socratica: 'Três delas dizem respeito ao cookie e uma ao cache. Duas parecem opostas e não são: uma proíbe guardar, a outra permite guardar mas exige confirmar.',
    pares: [
      { esquerda: '`HttpOnly`', direita: 'O JavaScript da página não consegue ler o valor' },
      { esquerda: '`Secure`', direita: 'O valor não é enviado fora do HTTPS' },
      { esquerda: '`no-cache`', direita: 'Pode guardar, mas confirme antes de reutilizar' },
      { esquerda: '`no-store`', direita: 'Não guarde em lugar nenhum' },
    ],
    distratores_direita: [
      'Reutilize sem perguntar durante o prazo indicado',
      'Cifra o valor do cookie antes de gravá-lo em disco',
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 08 */
  {
    id: 'wf-08-ord',
    curso: 'web-fundamentos',
    topico: 'Domínios: registro, DNS, propagação e subdomínios',
    tipo: 'ordenacao',
    dificuldade: 'dificil',
    enunciado: 'Ponha em ordem os passos de uma migração de servidor sem que os visitantes caiam num endereço morto.',
    dica_socratica: 'Um dos passos precisa acontecer bem antes dos outros para que os demais façam efeito rápido. Qual deles depende do tempo que os caches já guardaram?',
    itens: [
      'Baixar o TTL do registro para poucos minutos, um dia antes da troca',
      'Subir a aplicação no servidor novo e conferir que ela responde pelo IP dele',
      'Alterar o registro para apontar ao endereço novo',
      'Confirmar que os acessos estão chegando ao servidor novo',
      'Devolver o TTL para horas',
    ],
    armadilha: 'O par baixar-o-TTL–alterar-o-registro. É tentador baixar o TTL junto com a mudança, ou depois dela, para "acelerar a propagação". Não funciona: o teto do tempo de espera é o TTL que já estava valendo quando os caches guardaram a resposta antiga. Baixá-lo depois só afeta as consultas seguintes, e a troca continua demorando o TTL velho inteiro.',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-08-quiz',
    curso: 'web-fundamentos',
    topico: 'Domínios: registro, DNS, propagação e subdomínios',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Você precisa apontar `exemplo.com`, sem `www`, para um serviço hospedado que só informa um nome (`app.provedor.net`) e nenhum IP. Por que um `CNAME` não resolve?',
    dica_socratica: 'O `CNAME` tem uma restrição de posição no domínio. Onde exatamente ele não pode existir, e que registros já ocupam esse lugar?',
    alternativas: [
      {
        texto: '`CNAME` não pode existir na raiz do domínio, que precisa conviver com outros registros como o `MX`.',
        correta: true,
        porque: 'A saída é `A` com IPs fixos, ou um `ALIAS`/`ANAME`, que é extensão fora do padrão oferecida por alguns provedores.',
      },
      {
        texto: '`CNAME` só funciona para subdomínios de terceiro nível ou mais profundos.',
        correta: false,
        porque: 'Ele funciona em qualquer nome que não seja a raiz — `www.exemplo.com` é de segundo nível e aceita.',
      },
      {
        texto: '`CNAME` exige que o destino esteja no mesmo domínio de quem aponta.',
        correta: false,
        porque: 'O destino pode ser qualquer nome, inclusive de outra organização.',
      },
      {
        texto: '`CNAME` foi descontinuado em favor do `ALIAS` e não é mais respeitado pelos resolvedores.',
        correta: false,
        porque: 'Continua em pleno uso; o `ALIAS` é que é a extensão não padronizada.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 09 */
  {
    id: 'wf-09-mult',
    curso: 'web-fundamentos',
    topico: 'Hospedagem: compartilhada, VPS, nuvem e CDN',
    tipo: 'multipla-escolha',
    dificuldade: 'media',
    enunciado: 'Uma loja com tráfego constante o ano inteiro está migrando de hospedagem compartilhada. Marque as afirmações que se sustentam.',
    dica_socratica: 'Duas das opções vendem elasticidade a quem não tem variação para elastecer. E lembre que o custo de um VPS não é só o da fatura.',
    alternativas: [
      { texto: 'Um VPS transfere para a loja a responsabilidade por atualização, backup e firewall.', correta: true, porque: 'É o que muda de verdade na migração — não a potência, e sim de quem é a responsabilidade.' },
      { texto: 'A elasticidade da nuvem rende pouco aqui, porque não há variação de demanda para acompanhar.', correta: true, porque: 'Elasticidade se paga quando a demanda varia; com tráfego constante ela costuma custar mais que um VPS.' },
      { texto: 'Uma CDN ajuda mesmo sem trocar de hospedagem, porque fica na frente dela.', correta: true, porque: 'A CDN não substitui a origem: ela a antecede, e cuida do que é estático.' },
      { texto: 'A nuvem elimina o vizinho barulhento porque não há mais compartilhamento de recursos.', correta: false, porque: 'Instâncias compartilhadas continuam existindo na nuvem; o que muda é o isolamento contratado, não a ausência de vizinhos.' },
      { texto: 'Migrar para VPS reduz o custo total, já que a fatura mensal costuma ser parecida.', correta: false, porque: 'A fatura é parecida; o custo total sobe em horas de administração, que é onde a conta realmente muda.' },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-09-quiz',
    curso: 'web-fundamentos',
    topico: 'Hospedagem: compartilhada, VPS, nuvem e CDN',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Depois de publicar uma correção de CSS, parte dos visitantes continua vendo a versão antiga por horas. O site está atrás de uma CDN. Qual é a solução estrutural?',
    dica_socratica: 'Existe a saída de sempre — pedir à CDN que esqueça o que guardou. E existe outra, que faz o problema deixar de ocorrer. O que impede duas versões diferentes de disputarem o mesmo nome?',
    alternativas: [
      {
        texto: 'Dar ao arquivo um nome com impressão digital do conteúdo, para que qualquer alteração mude o nome e o HTML aponte para outro endereço.',
        correta: true,
        porque: 'É a mesma solução da aula de cache, agora em escala mundial: nomes diferentes nunca disputam o mesmo cache.',
      },
      {
        texto: 'Reduzir o `max-age` para poucos segundos em todos os arquivos estáticos.',
        correta: false,
        porque: 'Funciona, mas joga fora o ganho da CDN — o arquivo passa a ser rebuscado o tempo todo.',
      },
      {
        texto: 'Desligar a CDN para os arquivos de estilo e servi-los sempre da origem.',
        correta: false,
        porque: 'Resolve o sintoma abrindo mão exatamente do conteúdo que mais se beneficia da CDN.',
      },
      {
        texto: 'Enviar `no-store` no HTML, o que faz a CDN reavaliar também os arquivos que ele referencia.',
        correta: false,
        porque: 'A diretiva vale para o próprio documento; ela não alcança os arquivos referenciados por ele.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 10 */
  {
    id: 'wf-10-ord',
    curso: 'web-fundamentos',
    topico: 'Como o navegador monta a página: DOM, CSSOM e renderização',
    tipo: 'ordenacao',
    dificuldade: 'media',
    enunciado: 'Ponha em ordem as etapas que levam do HTML recebido aos pixels na tela.',
    dica_socratica: 'Duas árvores são construídas antes de qualquer posição ser calculada. E posição vem antes de cor.',
    itens: [
      'O HTML é interpretado e vira a árvore de objetos do DOM',
      'O CSS é interpretado e vira o CSSOM',
      'O estilo final de cada nó é calculado, resolvendo herança e especificidade',
      'O layout calcula a posição e o tamanho de cada caixa',
      'A pintura desenha os pixels de cada caixa',
      'A composição junta as camadas na tela',
    ],
    armadilha: 'O par layout–pintura. Quem pensa em "desenhar a página" tende a juntar os dois num passo só, ou a inverter, imaginando que o navegador desenha e depois acomoda. A separação é justamente o que distingue animação suave de animação travada: mudar `width` refaz o layout de tudo em volta, mudar `background-color` só repinta, e mudar `transform` mexe apenas na composição.',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-10-quiz',
    curso: 'web-fundamentos',
    topico: 'Como o navegador monta a página: DOM, CSSOM e renderização',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Uma animação de menu deslizante está travada em celulares. Ela altera `left` a cada quadro. Qual troca tende a resolver?',
    dica_socratica: 'Cada propriedade dispara uma etapa diferente da renderização. Qual delas não obriga o navegador a recalcular onde tudo está?',
    alternativas: [
      {
        texto: 'Animar `transform: translateX(...)`, que mexe só na composição e é resolvida pela placa de vídeo.',
        correta: true,
        porque: '`transform` e `opacity` são as duas propriedades que pulam layout e pintura.',
      },
      {
        texto: 'Animar `margin-left`, que é calculada uma vez e reaproveitada nos quadros seguintes.',
        correta: false,
        porque: '`margin-left` afeta o layout tanto quanto `left`, e é recalculada a cada quadro.',
      },
      {
        texto: 'Reduzir a duração da animação, já que menos quadros significam menos recálculo.',
        correta: false,
        porque: 'Encurtar esconde o sintoma; o custo por quadro continua o mesmo.',
      },
      {
        texto: 'Mover a folha de estilo para o fim do `<body>`, liberando a renderização mais cedo.',
        correta: false,
        porque: 'Isso muda quando a página aparece pela primeira vez, e não o custo de cada quadro da animação.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },

  /* ============================================================== lesson 11 */
  {
    id: 'wf-11-saida',
    curso: 'web-fundamentos',
    topico: 'Ferramentas do desenvolvedor: rede, console e elementos',
    tipo: 'saida-esperada',
    dificuldade: 'facil',
    linguagem: 'javascript',
    enunciado: 'No console de uma página que contém exatamente três links (`<a>`), você digita as duas linhas abaixo. O que aparece?',
    dica_socratica: 'A primeira linha devolve uma coleção de elementos, e o que se pede dela é uma contagem. A segunda pergunta o tipo do valor.',
    codigo_dado: 'const links = document.querySelectorAll("a");\nconsole.log(links.length);\nconsole.log(typeof links.length);\n',
    resposta: '3\nnumber\n',
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
  {
    id: 'wf-11-quiz',
    curso: 'web-fundamentos',
    topico: 'Ferramentas do desenvolvedor: rede, console e elementos',
    tipo: 'quiz',
    dificuldade: 'media',
    enunciado: 'Na aba Rede, um pedido mostra tempo total alto quase inteiro em espera, com transferência rápida e tamanho pequeno. O que isso indica?',
    dica_socratica: 'O tempo se divide entre esperar a resposta começar e recebê-la. Qual das duas partes fala do servidor e qual fala do caminho?',
    alternativas: [
      {
        texto: 'O servidor demorou a começar a responder — o gargalo está no processamento do outro lado, não na conexão.',
        correta: true,
        porque: 'Transferência rápida com espera longa isola o problema em quem responde.',
      },
      {
        texto: 'A conexão do usuário está lenta, e por isso o total subiu.',
        correta: false,
        porque: 'Conexão lenta apareceria na transferência, que aqui foi rápida.',
      },
      {
        texto: 'A resposta veio do cache, o que explica o tamanho pequeno.',
        correta: false,
        porque: 'Resposta de cache aparece marcada como tal e não fica esperando; o tempo total seria mínimo.',
      },
      {
        texto: 'O arquivo foi comprimido, e a descompressão consumiu o tempo de espera.',
        correta: false,
        porque: 'A descompressão é local e rápida; ela não aparece como espera pelo servidor.',
      },
    ],
    verificacao_operacao: 'nenhuma',
    _verificacao: 'estrutura',
  },
]);
