/* ==========================================================================
   Confere os blocos `exemplo` do conteúdo.

   Monta o programa de cada bloco — concatenando os `partes[].codigo` na ordem —,
   executa num Node de verdade e compara com a `saida` escrita no conteúdo.

   POR QUE ISTO EXISTE. O bloco `exemplo` é o formato do Go By Example: um
   programa contínuo com a explicação de cada trecho ao lado. Um programa com
   saída inventada é pior que nenhum exemplo — ele ensina a coisa errada com a
   autoridade de quem mostrou o resultado, e o aluno só descobre quando cola no
   console dele.

   Na primeira execução ele pegou dois defeitos reais no curso de JavaScript,
   nenhum dos quais apareceria lendo o texto:

     · o exemplo das arrow functions ESTOURAVA no meio (`this.n` com `this`
       indefinido em módulo ES), e a saída escrita listava linhas de dois
       `console.log` que nem estavam no programa;
     · o exemplo de `this` abortava no `TypeError` e nunca chegava à terceira
       linha, que era justamente a lição.

   Rodar:
       node ferramentas/exemplos/conferir.mjs                 # todos os cursos
       node ferramentas/exemplos/conferir.mjs assets/aulas-javascript.js

   CUIDADO AO ESTENDER: só conferem os exemplos cuja linguagem o Node executa.
   Um `exemplo` de CSS ou HTML não tem saída de programa e é pulado — não é
   falha, é ausência de pergunta.
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RAIZ = new URL('../../', import.meta.url).pathname;
const EXECUTAVEIS = new Set(['javascript', 'js', 'node']);

const arquivos = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(join(RAIZ, 'assets'))
    .filter((f) => f.startsWith('aulas-') && f.endsWith('.js'))
    .map((f) => join(RAIZ, 'assets', f));

const janela = {};
arquivos.forEach((f) => {
  // os arquivos de conteúdo são scripts clássicos que escrevem em `window`
  new Function('window', readFileSync(f, 'utf8'))(janela);
});

const pasta = mkdtempSync(join(tmpdir(), 'exemplos-'));
let conferidos = 0;
let pulados = 0;
let falhas = 0;

for (const curso of Object.keys(janela.AULAS || {})) {
  for (const topico of Object.keys(janela.AULAS[curso])) {
    for (const secao of janela.AULAS[curso][topico]) {
      (secao.corpo || []).forEach((bloco, i) => {
        const ex = bloco?.exemplo;
        if (!ex) return;
        const onde = `${curso}/${secao.id}[${i}]`;

        if (!EXECUTAVEIS.has(ex.linguagem)) { pulados += 1; return; }
        if (!ex.saida) {
          /* Exemplo executável sem `saida` é uma lacuna, não uma escolha: o
             leitor fica sem saber o que o programa faz, e o conferidor fica
             sem o que comparar. */
          console.log(`  SEM SAÍDA  ${onde}`);
          falhas += 1;
          return;
        }

        const alvo = join(pasta, 'programa.mjs');
        writeFileSync(alvo, ex.partes.map((p) => p.codigo).join('\n'));
        let real;
        try {
          real = execFileSync(process.execPath, [alvo], { encoding: 'utf8', stdio: 'pipe' });
        } catch (e) {
          // programa que estoura ainda é resultado: compara o que saiu até ali
          real = (e.stdout || '') + (e.stderr || '');
        }
        real = real.trim();
        const esperado = String(ex.saida).trim();
        conferidos += 1;

        if (real === esperado) { console.log(`  ok         ${onde}`); return; }
        falhas += 1;
        console.log(`  DIFERE     ${onde}`);
        console.log(`    escrito: ${JSON.stringify(esperado)}`);
        console.log(`    real   : ${JSON.stringify(real)}`);
      });
    }
  }
}

console.log(`\n${conferidos} exemplos executados, ${pulados} pulados (linguagem sem execução)`);
console.log(falhas ? `${falhas} FALHA(S)` : 'todas as saídas conferem');
process.exit(falhas ? 1 : 0);
