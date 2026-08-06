/* ==========================================================================
   codeschool.ing — the exercises in Portuguese.

   Same arrangement as assets/lessons-pt.js, keyed by exercise id. Only the
   fields a student READS are here: the prompt, the socratic hint, the option
   texts and their justifications, the pairs, the distractors, the ordering
   items and the test descriptions.

   What is deliberately absent: `correct`, the expected outputs, the answer
   expressions and everything else the grading reads. Translating a verdict
   is how a translation starts marking right answers wrong.
   ========================================================================== */

window.I18N = window.I18N || {};
window.I18N.pt = window.I18N.pt || {};
window.I18N.pt.exercises = {
  "js-coercion-quiz-1": {
    "prompt": "Em `0 == \"0\"` o resultado é `true`, mas em `0 === \"0\"` é `false`. O que explica a diferença?",
    "socraticHint": "Um dos dois operadores tem uma etapa a mais antes de comparar. Qual etapa seria essa, e o que ela faz com a string?",
    "choices": [
      {
        "text": "`==` converte os operandos para um tipo comum antes de comparar; `===` compara tipo e valor sem converter nada.",
        "why": "É a diferença entre igualdade abstrata e estrita: a primeira aplica coerção, a segunda falha de imediato quando os tipos diferem."
      },
      {
        "text": "`==` compara apenas o conteúdo textual dos valores, ignorando se são número ou string.",
        "why": "Não há comparação textual: `0 == \"0\"` é verdadeiro porque a string vira o número 0, e não porque `0` e `\"0\"` se pareçam escritos."
      },
      {
        "text": "`===` só funciona entre valores primitivos, então com uma string ele devolve `false` por não conseguir comparar.",
        "why": "`===` funciona com qualquer valor, inclusive strings; ele devolve `false` aqui porque os tipos são diferentes."
      },
      {
        "text": "`==` arredonda números antes de comparar, e o arredondamento faz `0` coincidir com a string.",
        "why": "Não há arredondamento envolvido: a conversão é de string para número, e `\"0\"` já é exatamente 0."
      }
    ]
  },
  "js-coercion-multiple-1": {
    "prompt": "Marque todos os valores que são **falsy** em JavaScript — isto é, que se comportam como `false` dentro de um `if`.",
    "socraticHint": "A lista de valores falsy é fechada e curta. Um objeto vazio continua sendo um objeto; uma string vazia não é a mesma coisa que uma string com um caractere dentro.",
    "choices": [
      {
        "text": "`0`",
        "why": "O zero é um dos valores falsy da lista fechada."
      },
      {
        "text": "`\"\"` (string vazia)",
        "why": "String vazia é falsy; qualquer string com pelo menos um caractere é truthy."
      },
      {
        "text": "`NaN`",
        "why": "`NaN` é falsy, apesar de `typeof NaN` ser `\"number\"`."
      },
      {
        "text": "`[]` (array vazio)",
        "why": "Todo objeto é truthy, e array é objeto — mesmo vazio. É a pegadinha clássica: `[] == false` é `true`, mas `if ([])` entra."
      },
      {
        "text": "`\"0\"` (string com zero)",
        "why": "É uma string de um caractere, portanto truthy. Só a string vazia é falsy."
      }
    ]
  },
  "js-coercion-ordering-1": {
    "prompt": "Ponha na ordem os passos que o interpretador executa ao avaliar `\"10\" > 9`.",
    "socraticHint": "Antes de decidir como comparar, algo precisa ser constatado sobre os operandos. Comparar é a última coisa que acontece, não a primeira.",
    "items": [
      "Constata que os operandos têm tipos diferentes: string e número",
      "Converte a string `\"10\"` para o número 10, com ToNumber",
      "Compara 10 com 9 numericamente",
      "Devolve `true`"
    ]
  },
  "js-coercion-matching-1": {
    "prompt": "Associe cada expressão ao que ela devolve. Sobram opções na coluna da direita.",
    "socraticHint": "Um destes resultados é um defeito histórico da linguagem, preservado por compatibilidade. Outro surpreende quem espera que o nome do valor descreva o tipo dele.",
    "pairs": [
      {
        "left": "`typeof null`",
        "right": "`\"object\"`"
      },
      {
        "left": "`typeof NaN`",
        "right": "`\"number\"`"
      },
      {
        "left": "`typeof undefined`",
        "right": "`\"undefined\"`"
      },
      {
        "left": "`typeof (() => {})`",
        "right": "`\"function\"`"
      },
      {
        "left": "`typeof Symbol()`",
        "right": "`\"symbol\"`"
      }
    ],
    "rightDistractors": [
      "`\"null\"`",
      "`\"array\"`"
    ]
  },
  "js-coercion-output-1": {
    "prompt": "O que este trecho imprime, linha a linha?",
    "socraticHint": "Duas das três linhas contrariam a intuição. Uma envolve como frações binárias representam décimos; a outra envolve o que acontece com um array antes de ele ser comparado com um booleano."
  },
  "js-coercion-code-1": {
    "prompt": "Cada linha da entrada traz um valor em JSON. Para cada uma, imprima `true` se o valor for falsy e `false` caso contrário.",
    "socraticHint": "Você não precisa listar os valores falsy um a um: a própria linguagem já sabe classificá-los. O que o operador `!` faz com um valor qualquer?",
    "tests": [
      {
        "description": "zero e string com zero"
      },
      {
        "description": "string vazia e array vazio"
      },
      {
        "description": "nulo e objeto vazio"
      },
      {
        "description": "borda: zero negativo"
      }
    ]
  },
  "js-demo-expression-1": {
    "prompt": "Escreva a derivada de `x**3` em relação a `x`.",
    "socraticHint": "A regra da potência baixa o expoente para multiplicar e subtrai um dele.",
    "referenceExpression": "3*x**2"
  },
  "js-syntax-quiz-1": {
    "prompt": "Uma variável declarada com `const` recebe um array. O que é impedido a partir daí?",
    "socraticHint": "A restrição do `const` recai sobre a ligação entre o nome e o valor. O conteúdo apontado por esse valor está sujeito à mesma regra?",
    "choices": [
      {
        "text": "Reatribuir a variável a outro valor — mas o conteúdo do array continua podendo ser alterado.",
        "why": "`const` congela a ligação nome↔valor, não o objeto apontado. `push` continua funcionando; `=` não."
      },
      {
        "text": "Qualquer alteração no array, incluindo `push` e `pop`, porque `const` torna o valor imutável.",
        "why": "Imutabilidade de conteúdo exigiria `Object.freeze`; `const` não faz isso."
      },
      {
        "text": "Usar a variável antes da linha em que ela foi declarada, o que com `var` seria permitido.",
        "why": "Isso é verdade sobre a zona morta temporal, e vale igualmente para `let` — não é o que distingue `const`."
      },
      {
        "text": "Passar a variável como argumento de uma função que altere o array recebido.",
        "why": "Nada impede a passagem, e a função pode alterar o conteúdo normalmente."
      }
    ]
  },
  "js-objects-matching-1": {
    "prompt": "Associe cada sintaxe ao efeito que ela produz. Sobram opções na coluna da direita.",
    "socraticHint": "Três reticências fazem coisas opostas conforme o lado em que aparecem: recebendo ou entregando.",
    "pairs": [
      {
        "left": "`const { a } = obj`",
        "right": "Cria uma variável com o valor de uma propriedade"
      },
      {
        "left": "`const [x, y] = lista`",
        "right": "Cria variáveis a partir das posições de um array"
      },
      {
        "left": "`{ ...obj, a: 1 }`",
        "right": "Copia as propriedades e sobrescreve uma delas"
      },
      {
        "left": "`f(...lista)`",
        "right": "Passa cada item do array como um argumento separado"
      }
    ],
    "rightDistractors": [
      "Congela o objeto, impedindo alterações posteriores",
      "Percorre o array executando uma função para cada item"
    ]
  },
  "stats-derivative-1": {
    "prompt": "Escreva a expressão da variância de uma amostra `x` de `n` observações, em torno da média `m`, usando o denominador `n - 1`.",
    "socraticHint": "O numerador soma os quadrados dos desvios. O denominador não é `n` — pergunte-se por que a correção existe.",
    "referenceExpression": "Sum((x - m)**2, (i, 1, n))/(n - 1)"
  },
  "wf-01-quiz": {
    "prompt": "Um servidor web precisa consultar um banco de dados para montar a resposta. Nesse instante, o que ele é?",
    "socraticHint": "Os papéis descrevem o momento da conversa, não o equipamento. Quem inicia a conversa com o banco?",
    "choices": [
      {
        "text": "Cliente do banco de dados, porque é ele quem inicia aquele pedido — e continua sendo servidor na conversa com o navegador.",
        "why": "Os papéis são do momento: a mesma máquina pode ser servidora numa conversa e cliente noutra, ao mesmo tempo."
      },
      {
        "text": "Continua sendo apenas servidor, porque uma máquina configurada como servidor não pode assumir outro papel.",
        "why": "A configuração define que programas ela roda, não que papel ela ocupa em cada conversa."
      },
      {
        "text": "Passa a ser um host intermediário, categoria distinta de cliente e de servidor.",
        "why": "`Host` é o termo neutro para qualquer máquina com endereço, não um terceiro papel na conversa."
      },
      {
        "text": "Nenhum dos dois, porque a consulta acontece dentro da mesma rede local e dispensa os papéis.",
        "why": "A distância não muda nada: quem pede é cliente, esteja o outro lado no rack ao lado ou noutro continente."
      }
    ]
  },
  "wf-01-assoc": {
    "prompt": "Associe cada termo ao que ele descreve. Sobram opções na coluna da direita.",
    "socraticHint": "Dois destes termos descrevem um papel numa conversa; um descreve a máquina, independentemente do que ela esteja fazendo.",
    "pairs": [
      {
        "left": "cliente",
        "right": "Quem inicia a conversa e faz o pedido"
      },
      {
        "left": "servidor",
        "right": "Quem espera ser perguntado e devolve a resposta"
      },
      {
        "left": "host",
        "right": "Qualquer máquina com endereço na rede"
      },
      {
        "left": "porta",
        "right": "O número que diz a qual programa o dado se destina"
      }
    ],
    "rightDistractors": [
      "O cabo físico que liga duas máquinas vizinhas",
      "O programa que traduz nomes de domínio em endereços"
    ]
  },
  "wf-02-quiz": {
    "prompt": "Durante uma transferência, o endereço MAC de destino do quadro muda várias vezes, enquanto o endereço IP de destino do pacote permanece o mesmo. Por quê?",
    "socraticHint": "Um dos dois endereços aponta para o fim da viagem; o outro aponta para o próximo trecho dela.",
    "choices": [
      {
        "text": "O MAC endereça o próximo salto e é reescrito a cada trecho; o IP endereça o destino final e atravessa a viagem inteira.",
        "why": "É a diferença entre o endereço no envelope e a placa do caminhão que o transporta agora."
      },
      {
        "text": "O MAC muda porque é sorteado a cada transmissão, para dificultar rastreamento na rede local.",
        "why": "O MAC vem gravado na placa. Alguns sistemas o alteram por privacidade, mas isso é opcional e não acontece a cada quadro."
      },
      {
        "text": "O IP permanece porque é criptografado pelo TLS e não pode ser reescrito pelos roteadores.",
        "why": "O TLS cifra o conteúdo, não o cabeçalho IP — que precisa ficar legível justamente para o pacote ser roteado."
      },
      {
        "text": "São os dois reescritos, mas o IP volta ao valor original antes de chegar ao destino.",
        "why": "O IP de destino não é reescrito no caminho comum; quem faz algo parecido é o NAT, e só com o endereço de origem."
      }
    ]
  },
  "wf-02-assoc": {
    "prompt": "Associe cada porta ao serviço que costuma escutá-la. Sobram opções na coluna da direita.",
    "socraticHint": "Duas delas diferem por uma letra no nome do protocolo e por uma camada de cifra.",
    "pairs": [
      {
        "left": "`80`",
        "right": "HTTP"
      },
      {
        "left": "`443`",
        "right": "HTTPS"
      },
      {
        "left": "`22`",
        "right": "SSH"
      },
      {
        "left": "`5432`",
        "right": "PostgreSQL"
      }
    ],
    "rightDistractors": [
      "DNS",
      "SMTP"
    ]
  },
  "wf-03-quiz": {
    "prompt": "Uma equipe reclama que a chamada de vídeo com um escritório na Europa trava. O provedor oferece dobrar a largura de banda. O que esperar?",
    "socraticHint": "Qual das três medidas explica melhor uma chamada que trava? E qual delas um cano mais grosso realmente altera?",
    "choices": [
      {
        "text": "Pouca ou nenhuma melhora, porque o problema provável é a latência — e ela depende da distância, não da banda contratada.",
        "why": "Um cano mais grosso não encurta a estrada: 150 ms continuam sendo 150 ms com qualquer plano."
      },
      {
        "text": "Melhora proporcional: o dobro de banda reduz o tempo de viagem à metade.",
        "why": "Banda e tempo de viagem são grandezas independentes; dobrar uma não altera a outra."
      },
      {
        "text": "Melhora garantida, porque a vazão sempre alcança a largura de banda contratada.",
        "why": "A vazão costuma ficar abaixo da banda — é justamente a diferença entre as duas que revela o problema."
      },
      {
        "text": "Piora, porque mais banda aumenta o congestionamento no caminho.",
        "why": "Mais capacidade não gera congestionamento; ela apenas não resolve o que não é problema de capacidade."
      }
    ]
  },
  "wf-03-expr": {
    "prompt": "Um arquivo de `T` bits é transferido por um caminho de vazão `v` bits por segundo, e a conexão leva `L` segundos para ser estabelecida antes de o primeiro bit sair. Escreva a expressão do tempo total, em segundos.",
    "socraticHint": "São duas parcelas que se somam: uma não depende do tamanho do arquivo e a outra depende. Qual é qual?",
    "referenceExpression": "L + T/v"
  },
  "wf-04-mult": {
    "prompt": "Marque todas as afirmações verdadeiras sobre endereços IP e MAC.",
    "socraticHint": "Um dos dois descreve onde a máquina está; o outro, qual máquina ela é. Leve o notebook para outra rede e veja qual dos dois muda.",
    "choices": [
      {
        "text": "O IP muda quando a máquina se conecta a outra rede.",
        "why": "O IP descreve posição, como um endereço postal."
      },
      {
        "text": "O MAC acompanha o equipamento para onde ele for.",
        "why": "O MAC é identidade da placa, gravado nela."
      },
      {
        "text": "Faixas como `192.168.x.x` são reutilizadas dentro de cada rede local e não existem na internet.",
        "why": "São faixas privadas; o roteador traduz para o IP público pelo NAT."
      },
      {
        "text": "O servidor de um site vê o endereço MAC do notebook que o acessou.",
        "why": "MAC só tem significado no enlace local: o servidor vê o MAC do último roteador do caminho dele."
      },
      {
        "text": "O IPv6 existe para dar mais velocidade que o IPv4.",
        "why": "Ele existe porque os 4,3 bilhões de endereços do IPv4 acabaram — é questão de espaço, não de velocidade."
      }
    ]
  },
  "wf-04-quiz": {
    "prompt": "Numa rede pública, uma máquina responde às perguntas do ARP se passando pelo roteador e passa a receber o tráfego dos vizinhos. O que torna esse ataque possível?",
    "socraticHint": "O que o protocolo faz quando duas máquinas respondem à mesma pergunta? Ele confere alguma coisa antes de acreditar?",
    "choices": [
      {
        "text": "O ARP não autentica as respostas: quem responder é acreditado, e a resposta fica em cache por alguns minutos.",
        "why": "É a razão pela qual HTTPS em rede pública deixa de ser recomendação e vira necessidade."
      },
      {
        "text": "O ARP transmite as respostas sem cifra, e por isso podem ser lidas e alteradas em trânsito.",
        "why": "A leitura não é o problema aqui: o ataque funciona porque a resposta forjada é aceita, não porque a verdadeira foi lida."
      },
      {
        "text": "O cache de ARP nunca expira, então uma resposta forjada vale para sempre.",
        "why": "O cache expira em minutos — o atacante precisa repetir a resposta, e isso não impede o ataque."
      },
      {
        "text": "O ARP usa endereços IP em vez de MAC, e por isso não distingue máquinas da mesma rede.",
        "why": "O ARP faz exatamente a ponte entre os dois: pergunta por IP e recebe um MAC."
      }
    ]
  },
  "wf-05-ord": {
    "prompt": "Ponha as camadas na ordem em que os dados as atravessam ao **sair** do seu navegador rumo à rede, da mais alta para a mais baixa.",
    "socraticHint": "Cada camada envelopa a de cima. Qual delas produz o conteúdo que todas as outras vão embrulhar?",
    "items": [
      "Aplicação: o navegador monta o pedido HTTP",
      "Transporte: o pedido é cortado em segmentos e recebe as portas",
      "Rede: cada segmento vira pacote e recebe os endereços IP",
      "Enlace: cada pacote vira quadro e recebe o MAC do próximo salto"
    ]
  },
  "wf-05-quiz": {
    "prompt": "Uma chamada de vídeo ao vivo usa UDP em vez de TCP. Qual é o raciocínio?",
    "socraticHint": "Pergunte o que acontece com um quadro de vídeo que chega meio segundo atrasado. Ele ainda serve para alguma coisa?",
    "choices": [
      {
        "text": "Num vídeo ao vivo o dado atrasado já não tem serventia, e esperar pelo reenvio travaria a imagem — é melhor perder o pedaço.",
        "why": "A regra de bolso: se o dado incompleto é inútil, TCP; se o dado atrasado é inútil, UDP."
      },
      {
        "text": "O UDP cifra o conteúdo por padrão, e chamadas de vídeo exigem confidencialidade.",
        "why": "O UDP não cifra nada; a cifra de uma chamada vem de outra camada."
      },
      {
        "text": "O TCP não funciona com dados contínuos, apenas com arquivos de tamanho conhecido.",
        "why": "O TCP transporta fluxo contínuo sem dificuldade — é o que o próprio HTTP faz."
      },
      {
        "text": "O UDP garante entrega mais rápida porque confirma cada pacote com menos bytes.",
        "why": "O UDP não confirma nada: é a ausência de confirmação que o torna barato."
      }
    ]
  },
  "wf-06-quiz": {
    "prompt": "Uma aplicação apagava registros por links `GET /apagar?id=7`. Depois de o site ser indexado, vários registros sumiram sem ninguém ter clicado em nada. O que explica?",
    "socraticHint": "Quem mais, além de uma pessoa, segue links de uma página? E que promessa o método `GET` faz a quem os segue?",
    "choices": [
      {
        "text": "`GET` promete não alterar nada, então rastreadores e pré-carregamentos o repetem à vontade — e cada visita executou a exclusão.",
        "why": "A promessa não é formalidade: navegadores, proxies e buscadores contam com ela."
      },
      {
        "text": "O buscador enviou `DELETE` para os endereços que encontrou, seguindo o padrão REST.",
        "why": "Rastreadores só fazem `GET`; nenhum deles envia `DELETE` por conta própria."
      },
      {
        "text": "A indexação expôs os endereços, e pessoas os acessaram manualmente.",
        "why": "Pode ter havido isso também, mas a causa que explica exclusões sem clique é a repetição automática do `GET`."
      },
      {
        "text": "O código `200` devolvido pela exclusão fez o buscador repetir o pedido para confirmar.",
        "why": "O `200` não pede repetição; o rastreador repete porque `GET` é declarado seguro, independentemente do status."
      }
    ]
  },
  "wf-06-assoc": {
    "prompt": "Associe cada código de status ao que ele comunica. Sobram opções na coluna da direita.",
    "socraticHint": "Dois deles falam de identidade e permissão, e a diferença entre os dois é se o servidor já sabe quem você é.",
    "pairs": [
      {
        "left": "`301`",
        "right": "Mudou de endereço em definitivo"
      },
      {
        "left": "`401`",
        "right": "Não sei quem você é"
      },
      {
        "left": "`403`",
        "right": "Sei quem você é, e você não pode"
      },
      {
        "left": "`502`",
        "right": "O servidor de trás respondeu mal"
      },
      {
        "left": "`429`",
        "right": "Você está pedindo com frequência demais"
      }
    ],
    "rightDistractors": [
      "O conteúdo não mudou desde a última vez",
      "O pedido está malformado e não pôde ser interpretado"
    ]
  },
  "wf-06-mult": {
    "prompt": "Marque tudo o que o TLS entrega numa conexão HTTPS.",
    "socraticHint": "São três garantias, e uma delas é o que o cadeado da barra realmente representa. Pense também no que a rede continua conseguindo observar.",
    "choices": [
      {
        "text": "Confidencialidade: ninguém no caminho lê o conteúdo.",
        "why": "É a garantia mais lembrada, e apenas uma das três."
      },
      {
        "text": "Integridade: alterar o conteúdo em trânsito se denuncia.",
        "why": "Sem ela, cifrar não bastaria — dava para corromper sem ler."
      },
      {
        "text": "Autenticidade: o certificado prova que aquele servidor é o dono do domínio.",
        "why": "É o que o cadeado representa — \"é mesmo o site cujo nome está na barra\", não \"site confiável\"."
      },
      {
        "text": "Anonimato: a rede não descobre qual domínio foi acessado.",
        "why": "O nome do domínio e o volume de dados continuam visíveis para a rede."
      },
      {
        "text": "Idoneidade: o site foi verificado como confiável por uma autoridade.",
        "why": "A autoridade certifica posse do domínio, não a honestidade de quem o opera."
      }
    ]
  },
  "wf-07-quiz": {
    "prompt": "Uma aplicação passou a rodar em dois servidores atrás de um balanceador. Os usuários começaram a \"cair\" da sessão sem padrão aparente. Qual é a causa mais provável?",
    "socraticHint": "O cookie carrega só um identificador. Onde estão guardados os dados que ele identifica, e os dois servidores enxergam o mesmo lugar?",
    "choices": [
      {
        "text": "A sessão está na memória de cada servidor, então metade dos pedidos chega a quem não a tem.",
        "why": "Por isso sessão em produção mora em lugar compartilhado — Redis, banco — ou não existe, e o estado vai num token assinado."
      },
      {
        "text": "O cookie expira mais rápido quando há mais de um servidor respondendo.",
        "why": "A validade do cookie é declarada no `Set-Cookie` e não depende de quantos servidores existem."
      },
      {
        "text": "O atributo `SameSite` bloqueia o cookie quando o balanceador troca de servidor.",
        "why": "`SameSite` trata de pedidos vindos de outro site; o domínio aqui continua o mesmo."
      },
      {
        "text": "O `HttpOnly` impede que o segundo servidor leia o cookie.",
        "why": "`HttpOnly` impede o JavaScript da página de ler; o servidor recebe o cookie normalmente."
      }
    ]
  },
  "wf-07-assoc": {
    "prompt": "Associe cada diretiva ou atributo ao efeito dela. Sobram opções na coluna da direita.",
    "socraticHint": "Três delas dizem respeito ao cookie e uma ao cache. Duas parecem opostas e não são: uma proíbe guardar, a outra permite guardar mas exige confirmar.",
    "pairs": [
      {
        "left": "`HttpOnly`",
        "right": "O JavaScript da página não consegue ler o valor"
      },
      {
        "left": "`Secure`",
        "right": "O valor não é enviado fora do HTTPS"
      },
      {
        "left": "`no-cache`",
        "right": "Pode guardar, mas confirme antes de reutilizar"
      },
      {
        "left": "`no-store`",
        "right": "Não guarde em lugar nenhum"
      }
    ],
    "rightDistractors": [
      "Reutilize sem perguntar durante o prazo indicado",
      "Cifra o valor do cookie antes de gravá-lo em disco"
    ]
  },
  "wf-08-ord": {
    "prompt": "Ponha em ordem os passos de uma migração de servidor sem que os visitantes caiam num endereço morto.",
    "socraticHint": "Um dos passos precisa acontecer bem antes dos outros para que os demais façam efeito rápido. Qual deles depende do tempo que os caches já guardaram?",
    "items": [
      "Baixar o TTL do registro para poucos minutos, um dia antes da troca",
      "Subir a aplicação no servidor novo e conferir que ela responde pelo IP dele",
      "Alterar o registro para apontar ao endereço novo",
      "Confirmar que os acessos estão chegando ao servidor novo",
      "Devolver o TTL para horas"
    ]
  },
  "wf-08-quiz": {
    "prompt": "Você precisa apontar `exemplo.com`, sem `www`, para um serviço hospedado que só informa um nome (`app.provedor.net`) e nenhum IP. Por que um `CNAME` não resolve?",
    "socraticHint": "O `CNAME` tem uma restrição de posição no domínio. Onde exatamente ele não pode existir, e que registros já ocupam esse lugar?",
    "choices": [
      {
        "text": "`CNAME` não pode existir na raiz do domínio, que precisa conviver com outros registros como o `MX`.",
        "why": "A saída é `A` com IPs fixos, ou um `ALIAS`/`ANAME`, que é extensão fora do padrão oferecida por alguns provedores."
      },
      {
        "text": "`CNAME` só funciona para subdomínios de terceiro nível ou mais profundos.",
        "why": "Ele funciona em qualquer nome que não seja a raiz — `www.exemplo.com` é de segundo nível e aceita."
      },
      {
        "text": "`CNAME` exige que o destino esteja no mesmo domínio de quem aponta.",
        "why": "O destino pode ser qualquer nome, inclusive de outra organização."
      },
      {
        "text": "`CNAME` foi descontinuado em favor do `ALIAS` e não é mais respeitado pelos resolvedores.",
        "why": "Continua em pleno uso; o `ALIAS` é que é a extensão não padronizada."
      }
    ]
  },
  "wf-09-mult": {
    "prompt": "Uma loja com tráfego constante o ano inteiro está migrando de hospedagem compartilhada. Marque as afirmações que se sustentam.",
    "socraticHint": "Duas das opções vendem elasticidade a quem não tem variação para elastecer. E lembre que o custo de um VPS não é só o da fatura.",
    "choices": [
      {
        "text": "Um VPS transfere para a loja a responsabilidade por atualização, backup e firewall.",
        "why": "É o que muda de verdade na migração — não a potência, e sim de quem é a responsabilidade."
      },
      {
        "text": "A elasticidade da nuvem rende pouco aqui, porque não há variação de demanda para acompanhar.",
        "why": "Elasticidade se paga quando a demanda varia; com tráfego constante ela costuma custar mais que um VPS."
      },
      {
        "text": "Uma CDN ajuda mesmo sem trocar de hospedagem, porque fica na frente dela.",
        "why": "A CDN não substitui a origem: ela a antecede, e cuida do que é estático."
      },
      {
        "text": "A nuvem elimina o vizinho barulhento porque não há mais compartilhamento de recursos.",
        "why": "Instâncias compartilhadas continuam existindo na nuvem; o que muda é o isolamento contratado, não a ausência de vizinhos."
      },
      {
        "text": "Migrar para VPS reduz o custo total, já que a fatura mensal costuma ser parecida.",
        "why": "A fatura é parecida; o custo total sobe em horas de administração, que é onde a conta realmente muda."
      }
    ]
  },
  "wf-09-quiz": {
    "prompt": "Depois de publicar uma correção de CSS, parte dos visitantes continua vendo a versão antiga por horas. O site está atrás de uma CDN. Qual é a solução estrutural?",
    "socraticHint": "Existe a saída de sempre — pedir à CDN que esqueça o que guardou. E existe outra, que faz o problema deixar de ocorrer. O que impede duas versões diferentes de disputarem o mesmo nome?",
    "choices": [
      {
        "text": "Dar ao arquivo um nome com impressão digital do conteúdo, para que qualquer alteração mude o nome e o HTML aponte para outro endereço.",
        "why": "É a mesma solução da aula de cache, agora em escala mundial: nomes diferentes nunca disputam o mesmo cache."
      },
      {
        "text": "Reduzir o `max-age` para poucos segundos em todos os arquivos estáticos.",
        "why": "Funciona, mas joga fora o ganho da CDN — o arquivo passa a ser rebuscado o tempo todo."
      },
      {
        "text": "Desligar a CDN para os arquivos de estilo e servi-los sempre da origem.",
        "why": "Resolve o sintoma abrindo mão exatamente do conteúdo que mais se beneficia da CDN."
      },
      {
        "text": "Enviar `no-store` no HTML, o que faz a CDN reavaliar também os arquivos que ele referencia.",
        "why": "A diretiva vale para o próprio documento; ela não alcança os arquivos referenciados por ele."
      }
    ]
  },
  "wf-10-ord": {
    "prompt": "Ponha em ordem as etapas que levam do HTML recebido aos pixels na tela.",
    "socraticHint": "Duas árvores são construídas antes de qualquer posição ser calculada. E posição vem antes de cor.",
    "items": [
      "O HTML é interpretado e vira a árvore de objetos do DOM",
      "O CSS é interpretado e vira o CSSOM",
      "O estilo final de cada nó é calculado, resolvendo herança e especificidade",
      "O layout calcula a posição e o tamanho de cada caixa",
      "A pintura desenha os pixels de cada caixa",
      "A composição junta as camadas na tela"
    ]
  },
  "wf-10-quiz": {
    "prompt": "Uma animação de menu deslizante está travada em celulares. Ela altera `left` a cada quadro. Qual troca tende a resolver?",
    "socraticHint": "Cada propriedade dispara uma etapa diferente da renderização. Qual delas não obriga o navegador a recalcular onde tudo está?",
    "choices": [
      {
        "text": "Animar `transform: translateX(...)`, que mexe só na composição e é resolvida pela placa de vídeo.",
        "why": "`transform` e `opacity` são as duas propriedades que pulam layout e pintura."
      },
      {
        "text": "Animar `margin-left`, que é calculada uma vez e reaproveitada nos quadros seguintes.",
        "why": "`margin-left` afeta o layout tanto quanto `left`, e é recalculada a cada quadro."
      },
      {
        "text": "Reduzir a duração da animação, já que menos quadros significam menos recálculo.",
        "why": "Encurtar esconde o sintoma; o custo por quadro continua o mesmo."
      },
      {
        "text": "Mover a folha de estilo para o fim do `<body>`, liberando a renderização mais cedo.",
        "why": "Isso muda quando a página aparece pela primeira vez, e não o custo de cada quadro da animação."
      }
    ]
  },
  "wf-11-output": {
    "prompt": "No console de uma página que contém exatamente três links (`<a>`), você digita as duas linhas abaixo. O que aparece?",
    "socraticHint": "A primeira linha devolve uma coleção de elementos, e o que se pede dela é uma contagem. A segunda pergunta o tipo do valor."
  },
  "wf-11-quiz": {
    "prompt": "Na aba Rede, um pedido mostra tempo total alto quase inteiro em espera, com transferência rápida e tamanho pequeno. O que isso indica?",
    "socraticHint": "O tempo se divide entre esperar a resposta começar e recebê-la. Qual das duas partes fala do servidor e qual fala do caminho?",
    "choices": [
      {
        "text": "O servidor demorou a começar a responder — o gargalo está no processamento do outro lado, não na conexão.",
        "why": "Transferência rápida com espera longa isola o problema em quem responde."
      },
      {
        "text": "A conexão do usuário está lenta, e por isso o total subiu.",
        "why": "Conexão lenta apareceria na transferência, que aqui foi rápida."
      },
      {
        "text": "A resposta veio do cache, o que explica o tamanho pequeno.",
        "why": "Resposta de cache aparece marcada como tal e não fica esperando; o tempo total seria mínimo."
      },
      {
        "text": "O arquivo foi comprimido, e a descompressão consumiu o tempo de espera.",
        "why": "A descompressão é local e rápida; ela não aparece como espera pelo servidor."
      }
    ]
  },
  "hc-04-quiz": {
    "prompt": "Duas regras atingem o mesmo elemento: `#painel p { color: red }` e `.aviso.destaque p { color: blue }`. Qual cor vence, e por quê?",
    "socraticHint": "A especificidade é um trio comparado da esquerda para a direita. Quantas classes seriam necessárias para superar um id?",
    "choices": [
      {
        "text": "Vermelha: o id vale no primeiro número do trio, e ele é comparado antes das classes — nenhuma quantidade de classes o alcança.",
        "why": "(1,0,1) contra (0,2,1): o primeiro número decide e os demais nem são consultados."
      },
      {
        "text": "Azul: duas classes somam mais peso que um id, porque a conta é uma soma ponderada.",
        "why": "A conta não é soma: é comparação posição a posição, e a primeira diferença encerra o desempate."
      },
      {
        "text": "Azul: entre regras que atingem o mesmo elemento, vence sempre a escrita por último.",
        "why": "A ordem só desempata quando a especificidade empata, o que não é o caso aqui."
      },
      {
        "text": "Vermelha: `color` é herdada, e propriedades herdadas ignoram a especificidade.",
        "why": "Herança explica como um filho recebe valor sem regra própria; aqui há duas regras diretas, e quem decide é a cascata."
      }
    ]
  },
  "hc-04-assoc": {
    "prompt": "Associe cada seletor ao que ele atinge. Sobram opções na coluna da direita.",
    "socraticHint": "Dois deles diferem por um único caractere entre os nomes, e essa diferença é a distância na árvore.",
    "pairs": [
      {
        "left": "`nav a`",
        "right": "Todo link em qualquer profundidade dentro de nav"
      },
      {
        "left": "`nav > a`",
        "right": "Só os links que são filhos diretos de nav"
      },
      {
        "left": "`li + li`",
        "right": "Cada item que vem logo depois de outro item"
      },
      {
        "left": "`a[href^=\"http\"]`",
        "right": "Links cujo endereço começa com http"
      }
    ],
    "rightDistractors": [
      "O primeiro item de cada lista da página",
      "Links que estão dentro de um elemento com a classe http"
    ]
  },
  "hc-05-quiz": {
    "prompt": "Um elemento tem `width: 200px`, `padding: 20px` e `border: 2px`. Quanto ele ocupa na horizontal, no comportamento padrão do CSS?",
    "socraticHint": "No padrão, `width` mede apenas uma das quatro camadas da caixa. Qual delas — e as outras entram para dentro ou para fora?",
    "choices": [
      {
        "text": "244px, porque no padrão `width` mede só o conteúdo e padding e borda somam para fora.",
        "why": "200 + 20 + 20 + 2 + 2 = 244. É o que `box-sizing: border-box` corrige."
      },
      {
        "text": "200px, porque `width` sempre define a largura final do elemento na tela.",
        "why": "Isso passa a valer com `border-box`, que não é o padrão."
      },
      {
        "text": "240px, porque a borda é desenhada por cima do padding e não acrescenta largura.",
        "why": "A borda ocupa espaço próprio, entre padding e margem."
      },
      {
        "text": "204px, porque o padding é interno ao conteúdo e não soma.",
        "why": "Padding é interno à caixa, mas externo ao conteúdo — e soma no padrão."
      }
    ]
  },
  "hc-05-mult": {
    "prompt": "Marque as afirmações verdadeiras sobre unidades.",
    "socraticHint": "Uma delas é a razão de tamanho de texto em pixel ser um problema de acessibilidade. Outra trata de uma unidade que acumula quando os elementos se aninham.",
    "choices": [
      {
        "text": "`rem` respeita quem aumentou a fonte padrão no navegador; `px` ignora essa preferência.",
        "why": "É por isso que tipografia se mede em `rem`."
      },
      {
        "text": "`em` acumula em elementos aninhados, porque é relativo à fonte do próprio elemento.",
        "why": "Dois níveis com `1.2em` dão 1,44 vezes o tamanho, não 1,2."
      },
      {
        "text": "No celular, `svh` e `dvh` lidam melhor que `vh` com a barra do navegador que aparece e some.",
        "why": "`vh` fixa a altura na janela maior e deixa conteúdo escondido atrás da barra."
      },
      {
        "text": "`%` é sempre relativo ao tamanho da janela.",
        "why": "`%` é relativo ao contêiner; quem se refere à janela é `vw`/`vh`."
      },
      {
        "text": "`box-sizing: border-box` altera o significado de `margin` além do de `width`.",
        "why": "Margem é externa à caixa e não é afetada; muda o que `width` e `height` medem."
      }
    ]
  },
  "hc-07-quiz": {
    "prompt": "Num contêiner com `display: flex` e `flex-direction: column`, o que `justify-content: center` faz?",
    "socraticHint": "As duas propriedades de alinhamento não são \"horizontal\" e \"vertical\": elas são \"principal\" e \"cruzado\". O que `flex-direction` acabou de mudar?",
    "choices": [
      {
        "text": "Centraliza na vertical, porque com `column` o eixo principal passou a ser o vertical.",
        "why": "`justify-content` age sempre no eixo principal, e é `flex-direction` que decide qual é ele."
      },
      {
        "text": "Centraliza na horizontal, porque `justify-content` sempre trata do eixo horizontal.",
        "why": "Ele parece horizontal só porque `row` é o padrão; com `column`, quem trata da horizontal é `align-items`."
      },
      {
        "text": "Não faz nada, porque em coluna só `align-items` tem efeito.",
        "why": "As duas continuam funcionando; o que trocou foi o eixo de cada uma."
      },
      {
        "text": "Centraliza nos dois sentidos, porque `column` funde os eixos.",
        "why": "Os eixos continuam sendo dois e distintos; eles apenas trocaram de orientação."
      }
    ]
  },
  "hc-07-assoc": {
    "prompt": "Associe cada declaração ao comportamento do item. Sobram opções na coluna da direita.",
    "socraticHint": "Duas delas diferem só na base — `0` ou `auto` —, e é a base que decide se o conteúdo do item influencia a largura final.",
    "pairs": [
      {
        "left": "`flex: 0 0 240px`",
        "right": "Fica com 240px fixos, sem crescer nem encolher"
      },
      {
        "left": "`flex: 1`",
        "right": "Divide o espaço igualmente, ignorando o conteúdo"
      },
      {
        "left": "`flex: 1 1 auto`",
        "right": "Ocupa o que sobrar, partindo do tamanho do conteúdo"
      },
      {
        "left": "`min-width: 0`",
        "right": "Permite encolher abaixo do conteúdo, evitando o estouro"
      }
    ],
    "rightDistractors": [
      "Alinha o item sozinho no eixo cruzado, ignorando os irmãos",
      "Muda a ordem visual do item sem alterar o HTML"
    ]
  },
  "hc-10-ord": {
    "prompt": "Ponha em ordem os passos de escrever um componente responsivo em mobile first.",
    "socraticHint": "Um dos passos não tem media query nenhuma, e é justamente por isso que ele vem primeiro. Medir vem antes de escolher onde quebrar?",
    "items": [
      "Escrever o layout de uma coluna, sem nenhuma media query",
      "Aumentar a janela até o layout de uma coluna ficar ruim de ler",
      "Anotar essa largura como o ponto de quebra do componente",
      "Acrescentar uma media query `min-width` que introduz a segunda coluna"
    ]
  },
  "hc-10-quiz": {
    "prompt": "Um cartão reutilizável aparece ora numa barra estreita, ora ocupando a tela inteira. Com media query, ele fica errado num dos dois. Por quê?",
    "socraticHint": "A media query pergunta o tamanho de quê? E é essa a medida que determina o espaço que o cartão realmente recebeu?",
    "choices": [
      {
        "text": "A media query mede a janela, não o espaço dado ao cartão — e os dois casos acontecem na mesma janela.",
        "why": "É o que as container queries resolvem: `@container` mede o contêiner, então o componente se adapta ao espaço que ele recebeu."
      },
      {
        "text": "A media query só é reavaliada no carregamento, e não quando o cartão muda de lugar.",
        "why": "Media queries são reavaliadas continuamente; o problema é o que elas medem, não quando."
      },
      {
        "text": "Falta declarar `container-type` no cartão para a media query passar a considerá-lo.",
        "why": "`container-type` habilita `@container`, e não altera o comportamento de `@media`."
      },
      {
        "text": "A especificidade da regra dentro da media query é menor que a da regra base.",
        "why": "Media query não altera especificidade; a regra de dentro tem o peso do próprio seletor."
      }
    ]
  }
};
