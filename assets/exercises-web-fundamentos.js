/* ==========================================================================
   `web-fundamentos` exercises — one file per course, as the pipeline does.

   The pipeline emits `exercises-<course>.json`. Here the extension is `.js`
   because the portal has no server yet to fetch JSON from (and a `fetch` from
   `file://` is blocked, which would break the single-file bundle), but the
   content of each object is exactly what the tool produces.

   SIX OF THE SEVEN TYPES, AND THAT IS NOT AN OVERSIGHT
   `code` does not appear here, and the reason is a rule of the generator: an
   exercise from topic N may only require what topics 1..N taught.
   `web-fundamentos` teaches no language — it is the school's first course, with
   no prerequisite — so asking for a program to be written would require what the
   course did not give. It is the same finding `RULES.md` recorded in
   `arquiteto-comunicacao`: in a course with no code, three of the seven types
   are inapplicable. Here only one is, because the last lesson covers the console.

   `expression-answer` genuinely fits in lesson 03: bandwidth, latency and
   throughput are an algebraic relation, and the CAS checks the equivalence
   without demanding a particular form.

   STATUS: sample content, technically correct and with no pedagogical review. It
   did not go through the funnel — all of them are marked
   `_verification: 'structure'`, which is the weakest mark and is the truth about
   them.
   ========================================================================== */

window.SAMPLE_EXERCISES = (window.SAMPLE_EXERCISES || []).concat([

  /* ============================================================== lesson 01 */
  {
    id: 'wf-01-quiz',
    course: 'web-fundamentos',
    topic: 'Cliente, servidor e host: quem pede e quem responde',
    type: 'quiz',
    difficulty: 'easy',
    statement: 'Um servidor web precisa consultar um banco de dados para montar a resposta. Nesse instante, o que ele é?',
    socratic_hint: 'Os papéis descrevem o momento da conversa, não o equipamento. Quem inicia a conversa com o banco?',
    options: [
      {
        text: 'Cliente do banco de dados, porque é ele quem inicia aquele pedido — e continua sendo servidor na conversa com o navegador.',
        correct: true,
        why: 'Os papéis são do momento: a mesma máquina pode ser servidora numa conversa e cliente noutra, ao mesmo tempo.',
      },
      {
        text: 'Continua sendo apenas servidor, porque uma máquina configurada como servidor não pode assumir outro papel.',
        correct: false,
        why: 'A configuração define que programas ela roda, não que papel ela ocupa em cada conversa.',
      },
      {
        text: 'Passa a ser um host intermediário, categoria distinta de cliente e de servidor.',
        correct: false,
        why: '`Host` é o termo neutro para qualquer máquina com endereço, não um terceiro papel na conversa.',
      },
      {
        text: 'Nenhum dos dois, porque a consulta acontece dentro da mesma rede local e dispensa os papéis.',
        correct: false,
        why: 'A distância não muda nada: quem pede é cliente, esteja o outro lado no rack ao lado ou noutro continente.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-01-assoc',
    course: 'web-fundamentos',
    topic: 'Cliente, servidor e host: quem pede e quem responde',
    type: 'matching',
    difficulty: 'medium',
    statement: 'Associe cada termo ao que ele descreve. Sobram opções na coluna da direita.',
    socratic_hint: 'Dois destes termos descrevem um papel numa conversa; um descreve a máquina, independentemente do que ela esteja fazendo.',
    pairs: [
      { left: 'cliente', right: 'Quem inicia a conversa e faz o pedido' },
      { left: 'servidor', right: 'Quem espera ser perguntado e devolve a resposta' },
      { left: 'host', right: 'Qualquer máquina com endereço na rede' },
      { left: 'porta', right: 'O número que diz a qual programa o dado se destina' },
    ],
    right_distractors: [
      'O cabo físico que liga duas máquinas vizinhas',
      'O programa que traduz nomes de domínio em endereços',
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 02 */
  {
    id: 'wf-02-quiz',
    course: 'web-fundamentos',
    topic: 'Pacote, quadro (frame) e socket',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Durante uma transferência, o endereço MAC de destino do quadro muda várias vezes, enquanto o endereço IP de destino do pacote permanece o mesmo. Por quê?',
    socratic_hint: 'Um dos dois endereços aponta para o fim da viagem; o outro aponta para o próximo trecho dela.',
    options: [
      {
        text: 'O MAC endereça o próximo salto e é reescrito a cada trecho; o IP endereça o destino final e atravessa a viagem inteira.',
        correct: true,
        why: 'É a diferença entre o endereço no envelope e a placa do caminhão que o transporta agora.',
      },
      {
        text: 'O MAC muda porque é sorteado a cada transmissão, para dificultar rastreamento na rede local.',
        correct: false,
        why: 'O MAC vem gravado na placa. Alguns sistemas o alteram por privacidade, mas isso é opcional e não acontece a cada quadro.',
      },
      {
        text: 'O IP permanece porque é criptografado pelo TLS e não pode ser reescrito pelos roteadores.',
        correct: false,
        why: 'O TLS cifra o conteúdo, não o cabeçalho IP — que precisa ficar legível justamente para o pacote ser roteado.',
      },
      {
        text: 'São os dois reescritos, mas o IP volta ao valor original antes de chegar ao destino.',
        correct: false,
        why: 'O IP de destino não é reescrito no caminho comum; quem faz algo parecido é o NAT, e só com o endereço de origem.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-02-assoc',
    course: 'web-fundamentos',
    topic: 'Pacote, quadro (frame) e socket',
    type: 'matching',
    difficulty: 'medium',
    statement: 'Associe cada porta ao serviço que costuma escutá-la. Sobram opções na coluna da direita.',
    socratic_hint: 'Duas delas diferem por uma letra no nome do protocolo e por uma camada de cifra.',
    pairs: [
      { left: '`80`', right: 'HTTP' },
      { left: '`443`', right: 'HTTPS' },
      { left: '`22`', right: 'SSH' },
      { left: '`5432`', right: 'PostgreSQL' },
    ],
    right_distractors: ['DNS', 'SMTP'],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 03 */
  {
    id: 'wf-03-quiz',
    course: 'web-fundamentos',
    topic: 'Largura de banda, latência e vazão (throughput)',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Uma equipe reclama que a chamada de vídeo com um escritório na Europa trava. O provedor oferece dobrar a largura de banda. O que esperar?',
    socratic_hint: 'Qual das três medidas explica melhor uma chamada que trava? E qual delas um cano mais grosso realmente altera?',
    options: [
      {
        text: 'Pouca ou nenhuma melhora, porque o problema provável é a latência — e ela depende da distância, não da banda contratada.',
        correct: true,
        why: 'Um cano mais grosso não encurta a estrada: 150 ms continuam sendo 150 ms com qualquer plano.',
      },
      {
        text: 'Melhora proporcional: o dobro de banda reduz o tempo de viagem à metade.',
        correct: false,
        why: 'Banda e tempo de viagem são grandezas independentes; dobrar uma não altera a outra.',
      },
      {
        text: 'Melhora garantida, porque a vazão sempre alcança a largura de banda contratada.',
        correct: false,
        why: 'A vazão costuma ficar abaixo da banda — é justamente a diferença entre as duas que revela o problema.',
      },
      {
        text: 'Piora, porque mais banda aumenta o congestionamento no caminho.',
        correct: false,
        why: 'Mais capacidade não gera congestionamento; ela apenas não resolve o que não é problema de capacidade.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-03-expr',
    course: 'web-fundamentos',
    topic: 'Largura de banda, latência e vazão (throughput)',
    type: 'expression-answer',
    difficulty: 'medium',
    statement: 'Um arquivo de `T` bits é transferido por um caminho de vazão `v` bits por segundo, e a conexão leva `L` segundos para ser estabelecida antes de o primeiro bit sair. Escreva a expressão do tempo total, em segundos.',
    socratic_hint: 'São duas parcelas que se somam: uma não depende do tamanho do arquivo e a outra depende. Qual é qual?',
    answer_expression: 'L + T/v',
    variables: ['T:positive', 'v:positive', 'L:positive'],
    check_source: 'L + T/v',
    check_operation: 'simplify',
    check_variable: 'T',
    _verification: 'structure',
  },

  /* ============================================================== lesson 04 */
  {
    id: 'wf-04-mult',
    course: 'web-fundamentos',
    topic: 'Endereço IP, endereço MAC e ARP',
    type: 'multiple-choice',
    difficulty: 'medium',
    statement: 'Marque todas as afirmações verdadeiras sobre endereços IP e MAC.',
    socratic_hint: 'Um dos dois descreve onde a máquina está; o outro, qual máquina ela é. Leve o notebook para outra rede e veja qual dos dois muda.',
    options: [
      { text: 'O IP muda quando a máquina se conecta a outra rede.', correct: true, why: 'O IP descreve posição, como um endereço postal.' },
      { text: 'O MAC acompanha o equipamento para onde ele for.', correct: true, why: 'O MAC é identidade da placa, gravado nela.' },
      { text: 'Faixas como `192.168.x.x` são reutilizadas dentro de cada rede local e não existem na internet.', correct: true, why: 'São faixas privadas; o roteador traduz para o IP público pelo NAT.' },
      { text: 'O servidor de um site vê o endereço MAC do notebook que o acessou.', correct: false, why: 'MAC só tem significado no enlace local: o servidor vê o MAC do último roteador do caminho dele.' },
      { text: 'O IPv6 existe para dar mais velocidade que o IPv4.', correct: false, why: 'Ele existe porque os 4,3 bilhões de endereços do IPv4 acabaram — é questão de espaço, não de velocidade.' },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-04-quiz',
    course: 'web-fundamentos',
    topic: 'Endereço IP, endereço MAC e ARP',
    type: 'quiz',
    difficulty: 'hard',
    statement: 'Numa rede pública, uma máquina responde às perguntas do ARP se passando pelo roteador e passa a receber o tráfego dos vizinhos. O que torna esse ataque possível?',
    socratic_hint: 'O que o protocolo faz quando duas máquinas respondem à mesma pergunta? Ele confere alguma coisa antes de acreditar?',
    options: [
      {
        text: 'O ARP não autentica as respostas: quem responder é acreditado, e a resposta fica em cache por alguns minutos.',
        correct: true,
        why: 'É a razão pela qual HTTPS em rede pública deixa de ser recomendação e vira necessidade.',
      },
      {
        text: 'O ARP transmite as respostas sem cifra, e por isso podem ser lidas e alteradas em trânsito.',
        correct: false,
        why: 'A leitura não é o problema aqui: o ataque funciona porque a resposta forjada é aceita, não porque a verdadeira foi lida.',
      },
      {
        text: 'O cache de ARP nunca expira, então uma resposta forjada vale para sempre.',
        correct: false,
        why: 'O cache expira em minutos — o atacante precisa repetir a resposta, e isso não impede o ataque.',
      },
      {
        text: 'O ARP usa endereços IP em vez de MAC, e por isso não distingue máquinas da mesma rede.',
        correct: false,
        why: 'O ARP faz exatamente a ponte entre os dois: pergunta por IP e recebe um MAC.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 05 */
  {
    id: 'wf-05-ord',
    course: 'web-fundamentos',
    topic: 'Redes em camadas: do cabo até o navegador',
    type: 'ordering',
    difficulty: 'medium',
    statement: 'Ponha as camadas na ordem em que os dados as atravessam ao **sair** do seu navegador rumo à rede, da mais alta para a mais baixa.',
    socratic_hint: 'Cada camada envelopa a de cima. Qual delas produz o conteúdo que todas as outras vão embrulhar?',
    items: [
      'Aplicação: o navegador monta o pedido HTTP',
      'Transporte: o pedido é cortado em segmentos e recebe as portas',
      'Rede: cada segmento vira pacote e recebe os endereços IP',
      'Enlace: cada pacote vira quadro e recebe o MAC do próximo salto',
    ],
    trap: 'O par transporte–rede. Quem memorizou "IP é o principal" tende a pôr a camada de rede antes da de transporte, como se o endereço viesse antes do corte em segmentos. Não vem: é o transporte que decide o tamanho de cada pedaço e a qual programa ele pertence, e só então cada pedaço ganha endereço de destino. Inverter os dois faria o pacote ser endereçado antes de existir.',
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-05-quiz',
    course: 'web-fundamentos',
    topic: 'Redes em camadas: do cabo até o navegador',
    type: 'quiz',
    difficulty: 'easy',
    statement: 'Uma chamada de vídeo ao vivo usa UDP em vez de TCP. Qual é o raciocínio?',
    socratic_hint: 'Pergunte o que acontece com um quadro de vídeo que chega meio segundo atrasado. Ele ainda serve para alguma coisa?',
    options: [
      {
        text: 'Num vídeo ao vivo o dado atrasado já não tem serventia, e esperar pelo reenvio travaria a imagem — é melhor perder o pedaço.',
        correct: true,
        why: 'A regra de bolso: se o dado incompleto é inútil, TCP; se o dado atrasado é inútil, UDP.',
      },
      {
        text: 'O UDP cifra o conteúdo por padrão, e chamadas de vídeo exigem confidencialidade.',
        correct: false,
        why: 'O UDP não cifra nada; a cifra de uma chamada vem de outra camada.',
      },
      {
        text: 'O TCP não funciona com dados contínuos, apenas com arquivos de tamanho conhecido.',
        correct: false,
        why: 'O TCP transporta fluxo contínuo sem dificuldade — é o que o próprio HTTP faz.',
      },
      {
        text: 'O UDP garante entrega mais rápida porque confirma cada pacote com menos bytes.',
        correct: false,
        why: 'O UDP não confirma nada: é a ausência de confirmação que o torna barato.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 06 */
  {
    id: 'wf-06-quiz',
    course: 'web-fundamentos',
    topic: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Uma aplicação apagava registros por links `GET /apagar?id=7`. Depois de o site ser indexado, vários registros sumiram sem ninguém ter clicado em nada. O que explica?',
    socratic_hint: 'Quem mais, além de uma pessoa, segue links de uma página? E que promessa o método `GET` faz a quem os segue?',
    options: [
      {
        text: '`GET` promete não alterar nada, então rastreadores e pré-carregamentos o repetem à vontade — e cada visita executou a exclusão.',
        correct: true,
        why: 'A promessa não é formalidade: navegadores, proxies e buscadores contam com ela.',
      },
      {
        text: 'O buscador enviou `DELETE` para os endereços que encontrou, seguindo o padrão REST.',
        correct: false,
        why: 'Rastreadores só fazem `GET`; nenhum deles envia `DELETE` por conta própria.',
      },
      {
        text: 'A indexação expôs os endereços, e pessoas os acessaram manualmente.',
        correct: false,
        why: 'Pode ter havido isso também, mas a causa que explica exclusões sem clique é a repetição automática do `GET`.',
      },
      {
        text: 'O código `200` devolvido pela exclusão fez o buscador repetir o pedido para confirmar.',
        correct: false,
        why: 'O `200` não pede repetição; o rastreador repete porque `GET` é declarado seguro, independentemente do status.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-06-assoc',
    course: 'web-fundamentos',
    topic: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    type: 'matching',
    difficulty: 'medium',
    statement: 'Associe cada código de status ao que ele comunica. Sobram opções na coluna da direita.',
    socratic_hint: 'Dois deles falam de identidade e permissão, e a diferença entre os dois é se o servidor já sabe quem você é.',
    pairs: [
      { left: '`301`', right: 'Mudou de endereço em definitivo' },
      { left: '`401`', right: 'Não sei quem você é' },
      { left: '`403`', right: 'Sei quem você é, e você não pode' },
      { left: '`502`', right: 'O servidor de trás respondeu mal' },
      { left: '`429`', right: 'Você está pedindo com frequência demais' },
    ],
    right_distractors: [
      'O conteúdo não mudou desde a última vez',
      'O pedido está malformado e não pôde ser interpretado',
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-06-mult',
    course: 'web-fundamentos',
    topic: 'HTTP e HTTPS: métodos, cabeçalhos e códigos de status',
    type: 'multiple-choice',
    difficulty: 'hard',
    statement: 'Marque tudo o que o TLS entrega numa conexão HTTPS.',
    socratic_hint: 'São três garantias, e uma delas é o que o cadeado da barra realmente representa. Pense também no que a rede continua conseguindo observar.',
    options: [
      { text: 'Confidencialidade: ninguém no caminho lê o conteúdo.', correct: true, why: 'É a garantia mais lembrada, e apenas uma das três.' },
      { text: 'Integridade: alterar o conteúdo em trânsito se denuncia.', correct: true, why: 'Sem ela, cifrar não bastaria — dava para corromper sem ler.' },
      { text: 'Autenticidade: o certificado prova que aquele servidor é o dono do domínio.', correct: true, why: 'É o que o cadeado representa — "é mesmo o site cujo nome está na barra", não "site confiável".' },
      { text: 'Anonimato: a rede não descobre qual domínio foi acessado.', correct: false, why: 'O nome do domínio e o volume de dados continuam visíveis para a rede.' },
      { text: 'Idoneidade: o site foi verificado como confiável por uma autoridade.', correct: false, why: 'A autoridade certifica posse do domínio, não a honestidade de quem o opera.' },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 07 */
  {
    id: 'wf-07-quiz',
    course: 'web-fundamentos',
    topic: 'Cookies, sessões e cache do navegador',
    type: 'quiz',
    difficulty: 'hard',
    statement: 'Uma aplicação passou a rodar em dois servidores atrás de um balanceador. Os usuários começaram a "cair" da sessão sem padrão aparente. Qual é a causa mais provável?',
    socratic_hint: 'O cookie carrega só um identificador. Onde estão guardados os dados que ele identifica, e os dois servidores enxergam o mesmo lugar?',
    options: [
      {
        text: 'A sessão está na memória de cada servidor, então metade dos pedidos chega a quem não a tem.',
        correct: true,
        why: 'Por isso sessão em produção mora em lugar compartilhado — Redis, banco — ou não existe, e o estado vai num token assinado.',
      },
      {
        text: 'O cookie expira mais rápido quando há mais de um servidor respondendo.',
        correct: false,
        why: 'A validade do cookie é declarada no `Set-Cookie` e não depende de quantos servidores existem.',
      },
      {
        text: 'O atributo `SameSite` bloqueia o cookie quando o balanceador troca de servidor.',
        correct: false,
        why: '`SameSite` trata de pedidos vindos de outro site; o domínio aqui continua o mesmo.',
      },
      {
        text: 'O `HttpOnly` impede que o segundo servidor leia o cookie.',
        correct: false,
        why: '`HttpOnly` impede o JavaScript da página de ler; o servidor recebe o cookie normalmente.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-07-assoc',
    course: 'web-fundamentos',
    topic: 'Cookies, sessões e cache do navegador',
    type: 'matching',
    difficulty: 'medium',
    statement: 'Associe cada diretiva ou atributo ao efeito dela. Sobram opções na coluna da direita.',
    socratic_hint: 'Três delas dizem respeito ao cookie e uma ao cache. Duas parecem opostas e não são: uma proíbe guardar, a outra permite guardar mas exige confirmar.',
    pairs: [
      { left: '`HttpOnly`', right: 'O JavaScript da página não consegue ler o valor' },
      { left: '`Secure`', right: 'O valor não é enviado fora do HTTPS' },
      { left: '`no-cache`', right: 'Pode guardar, mas confirme antes de reutilizar' },
      { left: '`no-store`', right: 'Não guarde em lugar nenhum' },
    ],
    right_distractors: [
      'Reutilize sem perguntar durante o prazo indicado',
      'Cifra o valor do cookie antes de gravá-lo em disco',
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 08 */
  {
    id: 'wf-08-ord',
    course: 'web-fundamentos',
    topic: 'Domínios: registro, DNS, propagação e subdomínios',
    type: 'ordering',
    difficulty: 'hard',
    statement: 'Ponha em ordem os passos de uma migração de servidor sem que os visitantes caiam num endereço morto.',
    socratic_hint: 'Um dos passos precisa acontecer bem antes dos outros para que os demais façam efeito rápido. Qual deles depende do tempo que os caches já guardaram?',
    items: [
      'Baixar o TTL do registro para poucos minutos, um dia antes da troca',
      'Subir a aplicação no servidor novo e conferir que ela responde pelo IP dele',
      'Alterar o registro para apontar ao endereço novo',
      'Confirmar que os acessos estão chegando ao servidor novo',
      'Devolver o TTL para horas',
    ],
    trap: 'O par baixar-o-TTL–alterar-o-registro. É tentador baixar o TTL junto com a mudança, ou depois dela, para "acelerar a propagação". Não funciona: o teto do tempo de espera é o TTL que já estava valendo quando os caches guardaram a resposta antiga. Baixá-lo depois só afeta as consultas seguintes, e a troca continua demorando o TTL velho inteiro.',
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-08-quiz',
    course: 'web-fundamentos',
    topic: 'Domínios: registro, DNS, propagação e subdomínios',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Você precisa apontar `exemplo.com`, sem `www`, para um serviço hospedado que só informa um nome (`app.provedor.net`) e nenhum IP. Por que um `CNAME` não resolve?',
    socratic_hint: 'O `CNAME` tem uma restrição de posição no domínio. Onde exatamente ele não pode existir, e que registros já ocupam esse lugar?',
    options: [
      {
        text: '`CNAME` não pode existir na raiz do domínio, que precisa conviver com outros registros como o `MX`.',
        correct: true,
        why: 'A saída é `A` com IPs fixos, ou um `ALIAS`/`ANAME`, que é extensão fora do padrão oferecida por alguns provedores.',
      },
      {
        text: '`CNAME` só funciona para subdomínios de terceiro nível ou mais profundos.',
        correct: false,
        why: 'Ele funciona em qualquer nome que não seja a raiz — `www.exemplo.com` é de segundo nível e aceita.',
      },
      {
        text: '`CNAME` exige que o destino esteja no mesmo domínio de quem aponta.',
        correct: false,
        why: 'O destino pode ser qualquer nome, inclusive de outra organização.',
      },
      {
        text: '`CNAME` foi descontinuado em favor do `ALIAS` e não é mais respeitado pelos resolvedores.',
        correct: false,
        why: 'Continua em pleno uso; o `ALIAS` é que é a extensão não padronizada.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 09 */
  {
    id: 'wf-09-mult',
    course: 'web-fundamentos',
    topic: 'Hospedagem: compartilhada, VPS, nuvem e CDN',
    type: 'multiple-choice',
    difficulty: 'medium',
    statement: 'Uma loja com tráfego constante o ano inteiro está migrando de hospedagem compartilhada. Marque as afirmações que se sustentam.',
    socratic_hint: 'Duas das opções vendem elasticidade a quem não tem variação para elastecer. E lembre que o custo de um VPS não é só o da fatura.',
    options: [
      { text: 'Um VPS transfere para a loja a responsabilidade por atualização, backup e firewall.', correct: true, why: 'É o que muda de verdade na migração — não a potência, e sim de quem é a responsabilidade.' },
      { text: 'A elasticidade da nuvem rende pouco aqui, porque não há variação de demanda para acompanhar.', correct: true, why: 'Elasticidade se paga quando a demanda varia; com tráfego constante ela costuma custar mais que um VPS.' },
      { text: 'Uma CDN ajuda mesmo sem trocar de hospedagem, porque fica na frente dela.', correct: true, why: 'A CDN não substitui a origem: ela a antecede, e cuida do que é estático.' },
      { text: 'A nuvem elimina o vizinho barulhento porque não há mais compartilhamento de recursos.', correct: false, why: 'Instâncias compartilhadas continuam existindo na nuvem; o que muda é o isolamento contratado, não a ausência de vizinhos.' },
      { text: 'Migrar para VPS reduz o custo total, já que a fatura mensal costuma ser parecida.', correct: false, why: 'A fatura é parecida; o custo total sobe em horas de administração, que é onde a conta realmente muda.' },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-09-quiz',
    course: 'web-fundamentos',
    topic: 'Hospedagem: compartilhada, VPS, nuvem e CDN',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Depois de publicar uma correção de CSS, parte dos visitantes continua vendo a versão antiga por horas. O site está atrás de uma CDN. Qual é a solução estrutural?',
    socratic_hint: 'Existe a saída de sempre — pedir à CDN que esqueça o que guardou. E existe outra, que faz o problema deixar de ocorrer. O que impede duas versões diferentes de disputarem o mesmo nome?',
    options: [
      {
        text: 'Dar ao arquivo um nome com impressão digital do conteúdo, para que qualquer alteração mude o nome e o HTML aponte para outro endereço.',
        correct: true,
        why: 'É a mesma solução da aula de cache, agora em escala mundial: nomes diferentes nunca disputam o mesmo cache.',
      },
      {
        text: 'Reduzir o `max-age` para poucos segundos em todos os arquivos estáticos.',
        correct: false,
        why: 'Funciona, mas joga fora o ganho da CDN — o arquivo passa a ser rebuscado o tempo todo.',
      },
      {
        text: 'Desligar a CDN para os arquivos de estilo e servi-los sempre da origem.',
        correct: false,
        why: 'Resolve o sintoma abrindo mão exatamente do conteúdo que mais se beneficia da CDN.',
      },
      {
        text: 'Enviar `no-store` no HTML, o que faz a CDN reavaliar também os arquivos que ele referencia.',
        correct: false,
        why: 'A diretiva vale para o próprio documento; ela não alcança os arquivos referenciados por ele.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 10 */
  {
    id: 'wf-10-ord',
    course: 'web-fundamentos',
    topic: 'Como o navegador monta a página: DOM, CSSOM e renderização',
    type: 'ordering',
    difficulty: 'medium',
    statement: 'Ponha em ordem as etapas que levam do HTML recebido aos pixels na tela.',
    socratic_hint: 'Duas árvores são construídas antes de qualquer posição ser calculada. E posição vem antes de cor.',
    items: [
      'O HTML é interpretado e vira a árvore de objetos do DOM',
      'O CSS é interpretado e vira o CSSOM',
      'O estilo final de cada nó é calculado, resolvendo herança e especificidade',
      'O layout calcula a posição e o tamanho de cada caixa',
      'A pintura desenha os pixels de cada caixa',
      'A composição junta as camadas na tela',
    ],
    trap: 'O par layout–pintura. Quem pensa em "desenhar a página" tende a juntar os dois num passo só, ou a inverter, imaginando que o navegador desenha e depois acomoda. A separação é justamente o que distingue animação suave de animação travada: mudar `width` refaz o layout de tudo em volta, mudar `background-color` só repinta, e mudar `transform` mexe apenas na composição.',
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-10-quiz',
    course: 'web-fundamentos',
    topic: 'Como o navegador monta a página: DOM, CSSOM e renderização',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Uma animação de menu deslizante está travada em celulares. Ela altera `left` a cada quadro. Qual troca tende a resolver?',
    socratic_hint: 'Cada propriedade dispara uma etapa diferente da renderização. Qual delas não obriga o navegador a recalcular onde tudo está?',
    options: [
      {
        text: 'Animar `transform: translateX(...)`, que mexe só na composição e é resolvida pela placa de vídeo.',
        correct: true,
        why: '`transform` e `opacity` são as duas propriedades que pulam layout e pintura.',
      },
      {
        text: 'Animar `margin-left`, que é calculada uma vez e reaproveitada nos quadros seguintes.',
        correct: false,
        why: '`margin-left` afeta o layout tanto quanto `left`, e é recalculada a cada quadro.',
      },
      {
        text: 'Reduzir a duração da animação, já que menos quadros significam menos recálculo.',
        correct: false,
        why: 'Encurtar esconde o sintoma; o custo por quadro continua o mesmo.',
      },
      {
        text: 'Mover a folha de estilo para o fim do `<body>`, liberando a renderização mais cedo.',
        correct: false,
        why: 'Isso muda quando a página aparece pela primeira vez, e não o custo de cada quadro da animação.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 11 */
  {
    id: 'wf-11-saida',
    course: 'web-fundamentos',
    topic: 'Ferramentas do desenvolvedor: rede, console e elementos',
    type: 'expected-output',
    difficulty: 'easy',
    language: 'javascript',
    statement: 'No console de uma página que contém exatamente três links (`<a>`), você digita as duas linhas abaixo. O que aparece?',
    socratic_hint: 'A primeira linha devolve uma coleção de elementos, e o que se pede dela é uma contagem. A segunda pergunta o tipo do valor.',
    given_code: 'const links = document.querySelectorAll("a");\nconsole.log(links.length);\nconsole.log(typeof links.length);\n',
    answer: '3\nnumber\n',
    check_operation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-11-quiz',
    course: 'web-fundamentos',
    topic: 'Ferramentas do desenvolvedor: rede, console e elementos',
    type: 'quiz',
    difficulty: 'medium',
    statement: 'Na aba Rede, um pedido mostra tempo total alto quase inteiro em espera, com transferência rápida e tamanho pequeno. O que isso indica?',
    socratic_hint: 'O tempo se divide entre esperar a resposta começar e recebê-la. Qual das duas partes fala do servidor e qual fala do caminho?',
    options: [
      {
        text: 'O servidor demorou a começar a responder — o gargalo está no processamento do outro lado, não na conexão.',
        correct: true,
        why: 'Transferência rápida com espera longa isola o problema em quem responde.',
      },
      {
        text: 'A conexão do usuário está lenta, e por isso o total subiu.',
        correct: false,
        why: 'Conexão lenta apareceria na transferência, que aqui foi rápida.',
      },
      {
        text: 'A resposta veio do cache, o que explica o tamanho pequeno.',
        correct: false,
        why: 'Resposta de cache aparece marcada como tal e não fica esperando; o tempo total seria mínimo.',
      },
      {
        text: 'O arquivo foi comprimido, e a descompressão consumiu o tempo de espera.',
        correct: false,
        why: 'A descompressão é local e rápida; ela não aparece como espera pelo servidor.',
      },
    ],
    check_operation: 'none',
    _verification: 'structure',
  },
]);
