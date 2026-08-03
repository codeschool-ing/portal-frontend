/* ==========================================================================
   Catálogo — leitura de CURSOS / TRILHAS e o grafo de dependências.

   PROVENIÊNCIA: `grafoDaTrilha` veio de `assets/script.js` da vitrine
   (codeschool-ing.github.io), praticamente verbatim. Só uma coisa mudou: lá o
   algoritmo lia a escolha da bifurcação de um objeto global `escolhas`,
   alimentado por cliques nas abas; aqui ela é injetada por quem chama, porque
   no portal a escolha é a matrícula do aluno e vem persistida.

   Este módulo não toca no DOM. É a "lógica pura" — o grafo é a peça de maior
   valor do repositório da vitrine e não deve ser reescrita nunca mais.
   ========================================================================== */

export const cursoPorId = (id) => CURSOS.find((c) => c.id === id);
export const trilhaPorId = (id) => TRILHAS.find((t) => t.id === id);

/* ---------- trilhas com bifurcação ----------
   Um item de `cursos` é o id de um curso (string) ou uma etapa de escolha
   (objeto com `opcoes`). Daí três leituras diferentes da mesma trilha:
   todos os cursos possíveis, o caminho escolhido e as horas do caminho. */
export const ehEscolha = (item) => typeof item === 'object' && Array.isArray(item.opcoes);

// todos os cursos que a trilha pode conter, somando todas as opções
export const todosOsCursos = (t) =>
  t.cursos.flatMap((i) => (ehEscolha(i) ? i.opcoes.flatMap((o) => o.cursos) : [i]));

// a primeira opção é a sugerida por padrão, como na vitrine
export const OPCAO_PADRAO = () => 0;

// o caminho que este aluno escolheu
export const caminhoDaTrilha = (t, opcaoAtiva = OPCAO_PADRAO) =>
  t.cursos.flatMap((i, idx) => (ehEscolha(i) ? i.opcoes[opcaoAtiva(t.id, idx)].cursos : [i]));

export const horasDe = (ids) => ids.reduce((s, id) => s + (cursoPorId(id)?.horas || 0), 0);

// em quantas trilhas um curso aparece (o mesmo curso pode servir a várias)
export const trilhasDoCurso = (id) => TRILHAS.filter((t) => todosOsCursos(t).includes(id));
// o inverso de `depende`: que cursos este destrava
export const depoisDe = (id) => CURSOS.filter((c) => (c.depende || []).includes(id));

// faixa de carga horária: menor e maior caminho possível
export function faixaDeHoras(t) {
  let min = 0, max = 0;
  t.cursos.forEach((i) => {
    if (!ehEscolha(i)) { const h = cursoPorId(i)?.horas || 0; min += h; max += h; return; }
    const hs = i.opcoes.map((o) => horasDe(o.cursos));
    min += Math.min(...hs);
    max += Math.max(...hs);
  });
  return { min, max };
}

/* ---------- aula = tópico ----------
   O catálogo não tem conceito de aula: o grão mais fino é `topicos`. O portal
   adota tópico como aula, e não inventa uma terceira chave — os exercícios do
   pipeline já são indexados por `topico`.

   MAS O TÍTULO EXIBIDO NÃO SERVE DE CHAVE. `aplicarConteudo()` reescreve
   `c.topicos` no lugar a cada troca de idioma, então em inglês o título vira
   "Types, coercion, strict equality and falsy values" e nenhum exercício casa.
   O defeito aparece sem ninguém tocar em nada: basta o navegador estar
   configurado noutro idioma, que é o caso da maioria fora do Brasil.

   A chave é o texto em PORTUGUÊS, guardado por `guardarBase()` no
   carregamento. É a mesma decisão do i18n da vitrine — a chave de tradução é
   o próprio texto em português — aplicada à junção com o conteúdo. Daí cada
   aula carregar as duas coisas: `titulo` para mostrar, `chave` para casar. */
export function aulasDoCurso(id) {
  const c = cursoPorId(id);
  if (!c) return [];
  const emPt = (typeof BASE_PT !== 'undefined' && BASE_PT.cursos?.[id]?.topicos) || c.topicos || [];
  return (c.topicos || []).map((titulo, ix) => ({
    cursoId: id,
    ix,
    titulo,
    chave: emPt[ix] ?? titulo,
  }));
}

/* ---------- o grafo de uma trilha ----------
   Cada curso do caminho vira um nó; uma etapa de escolha vira um nó único
   (o bloco), porque ela é uma decisão, não um curso. As arestas saem do
   campo `depende` de cada curso, recortado ao que existe nesta trilha.
   O nível de um nó é 1 + o maior nível entre os seus pré-requisitos, o que
   coloca lado a lado tudo o que pode ser feito ao mesmo tempo. */
export function grafoDaTrilha(t, opcaoAtiva = OPCAO_PADRAO) {
  const nos = [];
  const doCurso = {};        // id de curso -> id do nó que o contém
  const membrosDoGarfo = {}; // id de curso (de qualquer opção) -> id do nó garfo

  t.cursos.forEach((item, idx) => {
    if (!ehEscolha(item)) {
      nos.push({ id: item, tipo: 'curso', cursos: [item] });
      doCurso[item] = item;
      return;
    }
    const idNo = 'garfo:' + idx;
    nos.push({ id: idNo, tipo: 'garfo', etapa: item, idx: idx, cursos: item.opcoes[opcaoAtiva(t.id, idx)].cursos });
    item.opcoes.forEach((o) => o.cursos.forEach((c) => { membrosDoGarfo[c] = idNo; }));
    item.opcoes[opcaoAtiva(t.id, idx)].cursos.forEach((c) => { doCurso[c] = idNo; });
  });

  // arestas: pré-requisito -> curso, resolvendo cursos internos para o bloco
  const idDoItem = (v) => (typeof v === 'number' ? nos[v] && nos[v].id : doCurso[v] || membrosDoGarfo[v]);
  nos.forEach((no, i) => {
    const deps = new Set();
    no.cursos.forEach((id) => {
      (cursoPorId(id)?.depende || []).forEach((d) => {
        const alvo = doCurso[d] || membrosDoGarfo[d];
        if (alvo && alvo !== no.id) deps.add(alvo);
      });
      // ligações que só existem nesta trilha (ordem de currículo, não de conteúdo)
      ((t.ligacoes || {})[id] || []).forEach((v) => {
        const alvo = idDoItem(v);
        if (alvo && alvo !== no.id) deps.add(alvo);
      });
    });
    // sem nenhum pré-requisito dentro desta trilha: vale a ordem do currículo,
    // senão cursos como `nuvem` e `testes-cicd` cairiam todos no primeiro nível
    if (!deps.size && i > 0) deps.add(nos[i - 1].id);
    no.deps = [...deps];
  });

  // nó de chegada: tudo o que não é pré-requisito de mais nada desemboca nele,
  // para o grafo não terminar em cursos soltos sem seta de saída
  const temSucessor = {};
  nos.forEach((n) => n.deps.forEach((d) => { temSucessor[d] = true; }));
  nos.push({ id: '@saida', tipo: 'saida', cursos: [], deps: nos.filter((n) => !temSucessor[n.id]).map((n) => n.id) });

  const sucessores = {};
  nos.forEach((n) => n.deps.forEach((d) => { (sucessores[d] = sucessores[d] || []).push(n.id); }));

  /* Níveis por ordenação topológica iterativa (Kahn). A versão recursiva
     tinha um teto de profundidade que estourava nas trilhas longas. */
  const nivel = {};
  const restam = {};
  nos.forEach((n) => { restam[n.id] = n.deps.length; });
  const fila = nos.filter((n) => !n.deps.length).map((n) => n.id);
  fila.forEach((id) => { nivel[id] = 0; });
  for (let i = 0; i < fila.length; i += 1) {
    const id = fila[i];
    (sucessores[id] || []).forEach((s) => {
      nivel[s] = Math.max(nivel[s] === undefined ? 0 : nivel[s], nivel[id] + 1);
      restam[s] -= 1;
      if (restam[s] <= 0) fila.push(s);
    });
  }
  /* Rede de segurança: se um dado formar ciclo, a fila do Kahn esgota antes do
     fim. Em vez de deixar esses nós sem nível — o que fazia a trilha inteira
     desaparecer —, eles entram depois do maior pré-requisito já resolvido. */
  const presos = nos.filter((n) => nivel[n.id] === undefined);
  presos.forEach((n) => {
    const resolvidos = n.deps.map((d) => nivel[d]).filter((v) => v !== undefined);
    nivel[n.id] = resolvidos.length ? Math.max(...resolvidos) + 1 : 0;
    fila.push(n.id);
  });
  if (presos.length && window.console) {
    console.warn('trilha "' + t.nome + '": dependência circular em ' + presos.map((n) => n.id).join(', '));
  }

  // agrupa por nível, sem deixar buraco na sequência de colunas
  const porNivel = {};
  nos.forEach((n) => { (porNivel[nivel[n.id]] = porNivel[nivel[n.id]] || []).push(n); });
  const colunas = Object.keys(porNivel)
    .map(Number)
    .sort((a, b) => a - b)
    .map((v) => porNivel[v]);
  colunas.forEach((col, i) => col.forEach((n) => { nivel[n.id] = i; }));

  /* ---------- ordenação dentro de cada nível ----------
     NADA é fixado por trilha: o algoritmo mede o desenho que vai sair e escolhe
     a ordem que produz menos cruzamento de linhas. Três peças de Sugiyama —
     baricentro, transposição (aceitando empates, que é o que destrava os casos
     de duas colunas) e partidas múltiplas com semente fixa, para o grafo não
     mudar de forma a cada visita. Resultado nas 16 trilhas: 5 cruzamentos → 0. */
  const posicao = {};
  const indexar = () => colunas.forEach((col) => col.forEach((n, i) => {
    posicao[n.id] = col.length > 1 ? i / (col.length - 1) : 0.5;
  }));

  const arestas = [];
  nos.forEach((n) => n.deps.forEach((d) => {
    if (nivel[d] < nivel[n.id]) arestas.push({ de: d, para: n.id, vao: nivel[n.id] - nivel[d] });
  }));

  /* Custo com TRÊS critérios comparados lexicograficamente, não somados — assim
     nenhum critério menor compra um cruzamento a mais:
       1) cruzamentos;
       2) viés para cima (empatados, o desvio sobe: mantém o corpo da trilha
          contíguo em vez de partido por linhas dos dois lados);
       3) ordem do currículo (entre desenhos igualmente limpos, vence o que
          mantém a sequência declarada). */
  const ordemCurriculo = {};
  nos.forEach((n, i) => { ordemCurriculo[n.id] = i; });
  const vaos = [];
  const custo = () => {
    for (let g = 0; g < colunas.length - 1; g += 1) vaos[g] = [];
    arestas.forEach((e) => {
      if (e.vao === 1) vaos[nivel[e.de]].push({ a: posicao[e.de], b: posicao[e.para] });
    });
    let cruz = 0;
    vaos.forEach((lista) => {
      for (let i = 0; i < lista.length; i += 1) {
        for (let j = i + 1; j < lista.length; j += 1) {
          if ((lista[i].a - lista[j].a) * (lista[i].b - lista[j].b) < 0) cruz += 1;
        }
      }
    });
    let vies = 0;
    arestas.forEach((e) => {
      if (e.vao === 1) return;
      const pu = posicao[e.de], pv = posicao[e.para];
      const saida = vaos[nivel[e.de]], chegada = vaos[nivel[e.para] - 1];
      let cima = 0, baixo = 0;
      saida.forEach((s) => { if (s.a < pu) cima += 1; else if (s.a > pu) baixo += 1; });
      chegada.forEach((s) => { if (s.b < pv) cima += 1; else if (s.b > pv) baixo += 1; });
      cruz += Math.min(cima, baixo);
      vies += pu + pv;
    });
    let fora = 0;
    colunas.forEach((col) => {
      for (let i = 0; i < col.length; i += 1) {
        for (let j = i + 1; j < col.length; j += 1) {
          if (ordemCurriculo[col[i].id] > ordemCurriculo[col[j].id]) fora += 1;
        }
      }
    });
    return [cruz, vies, fora];
  };
  /* compara dois custos critério a critério (ordem lexicográfica) */
  const pior = (a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] > b[i];
    }
    return false;
  };
  const igual = (a, b) => a.every((v, i) => v === b[i]);

  const MEDIA = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const MEDIANA = (v) => {
    const s = v.slice().sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const ordenar = (col, vizinhos, agregar) => {
    const chave = col.map((n, i) => {
      const v = vizinhos(n).map((id) => posicao[id]).filter((x) => x !== undefined);
      return { n: n, b: v.length ? agregar(v) : null, i: i };
    });
    chave.sort((a, b) => (a.b === null || b.b === null ? a.i - b.i : (a.b - b.b) || (a.i - b.i)));
    return chave.map((x) => x.n);
  };

  /* troca pares vizinhos enquanto compensar; `aceitarEmpate` deixa o
     algoritmo andar de lado para sair de um ótimo local */
  const transpor = (aceitarEmpate) => {
    let melhorou = true;
    let voltas = 0;
    while (melhorou && voltas < 8) {
      melhorou = false;
      voltas += 1;
      colunas.forEach((col) => {
        for (let i = 0; i + 1 < col.length; i += 1) {
          const antes = custo();
          const tmp = col[i]; col[i] = col[i + 1]; col[i + 1] = tmp;
          indexar();
          const depois = custo();
          if (pior(antes, depois) || (aceitarEmpate && igual(antes, depois))) {
            if (pior(antes, depois)) melhorou = true;
          } else {
            const v = col[i]; col[i] = col[i + 1]; col[i + 1] = v;
            indexar();
          }
        }
      });
    }
  };

  indexar();
  let melhor = colunas.map((col) => col.slice());
  let melhorCusto = custo();
  const guardar = () => {
    const c = custo();
    if (pior(melhorCusto, c)) { melhorCusto = c; melhor = colunas.map((col) => col.slice()); }
  };

  const inicial = colunas.map((col) => col.slice());
  let semente = 1;   // gerador congruente linear: embaralha sempre igual
  const sorteio = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
  const PARTIDAS = ['curriculo', 'invertida', 'sorteio', 'sorteio', 'sorteio', 'sorteio'];

  PARTIDAS.forEach((partida) => {
    colunas.length = 0;
    inicial.forEach((col) => {
      if (partida === 'curriculo') return colunas.push(col.slice());
      if (partida === 'invertida') return colunas.push(col.slice().reverse());
      const a = col.slice();
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(sorteio() * (i + 1));
        const t2 = a[i]; a[i] = a[j]; a[j] = t2;
      }
      return colunas.push(a);
    });
    indexar();
    /* numa partida embaralhada, subir o morro ANTES do baricentro: se o
       baricentro rodar primeiro ele reordena tudo pelos vizinhos e apaga o
       sorteio, e a partida deixa de ser uma partida diferente */
    if (partida === 'sorteio') { transpor(true); guardar(); }
    for (let passo = 0; passo < 2; passo += 1) {
      const agregar = passo % 2 ? MEDIANA : MEDIA;
      for (let v = 1; v < colunas.length; v += 1) {
        colunas[v] = ordenar(colunas[v], (n) => n.deps, agregar);
        indexar();
      }
      for (let v = colunas.length - 2; v >= 0; v -= 1) {
        colunas[v] = ordenar(colunas[v], (n) => sucessores[n.id] || [], agregar);
        indexar();
      }
      guardar();
      transpor(passo % 2 === 1);
      guardar();
    }
  });

  colunas.length = 0;
  melhor.forEach((col) => colunas.push(col));
  colunas.forEach((col, i) => col.forEach((n) => { nivel[n.id] = i; }));

  return { nos: nos, colunas: colunas, nivel: nivel, niveisReais: colunas.length - 1 };
}
