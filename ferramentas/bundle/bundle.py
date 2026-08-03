#!/usr/bin/env python3
"""Gera um HTML único, sem dependências externas, para enviar ou abrir direto
do disco (file://). Embute o CSS, os scripts clássicos, o favicon — e resolve
o grafo de módulos ES, que é o passo que a ferramenta da vitrine não precisava.

    python3 ferramentas/bundle/bundle.py   -> portal-aluno.html (na raiz)
    python3 bundle.py saida.html

O portal continua sendo servido a partir de index.html + assets/ + app/. Este
arquivo é só para entregar uma cópia que se abre com dois cliques.

POR QUE UM PASSO A MAIS QUE NA VITRINE
--------------------------------------
A vitrine tem seis scripts clássicos: embutir é concatenar. O portal tem
módulos ES, e eles não sobrevivem ao `file://` de duas formas diferentes:

1. `<script type="module" src="app/main.js">` dispara um fetch, e fetch de
   `file://` é bloqueado por CORS em todo navegador. O arquivo abriria em
   branco, sem erro visível além do console.
2. Mesmo embutido, um `import './rotas.js'` dentro do script continuaria
   sendo um fetch.

Então os módulos são achatados: cada um vira uma IIFE que devolve o que
exportava, e os `import` viram leitura de um registro. É o que um empacotador
faz, no mínimo necessário para este projeto — não é um empacotador de uso
geral, e não tenta ser.

A saída continua sendo `<script type="module">`, e isso é de propósito: módulo
embutido não faz fetch, mas mantém a execução ADIADA (depois do HTML), que é
exatamente a ordem que o `index.html` tem quando servido. Trocar por um
`<script>` clássico mudaria o momento em que tudo roda, e o pacote deixaria de
testar o mesmo que o site testa.

O QUE ESTE ACHATAMENTO PRESSUPÕE
--------------------------------
O código deste repositório, e só ele: `import`/`export` nas formas que os
arquivos usam, sem reexportação, sem ciclo entre módulos e sem `await` no topo
de um módulo. Se alguma dessas coisas entrar, o script avisa em vez de gerar
um pacote quebrado em silêncio.
"""
import base64
import pathlib
import re
import sys

AQUI = pathlib.Path(__file__).parent
RAIZ = AQUI.parent.parent           # o portal fica na raiz; a ferramenta mora em ferramentas/bundle/
SAIDA = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'portal-aluno.html'

ENTRADA_MODULO = 'app/main.js'


def ler(rel):
    return (RAIZ / rel).read_text(encoding='utf-8')


def morrer(msg):
    print('ERRO: ' + msg, file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------- módulos ES

# `import ... from '...'` nas três formas que o repositório usa. A cláusula
# nomeada pode ocupar várias linhas, daí o DOTALL limitado ao que vem antes
# de `from`.
RE_IMPORT = re.compile(
    r"^import\s+(?P<clausula>\*\s+as\s+[\w$]+|\{[^}]*\}|[\w$]+)\s+from\s+"
    r"['\"](?P<caminho>[^'\"]+)['\"];?[ \t]*$",
    re.MULTILINE | re.DOTALL,
)
RE_IMPORT_SOLTO = re.compile(r"^import\s+['\"][^'\"]+['\"];?\s*$", re.MULTILINE)
RE_REEXPORT = re.compile(r"^export\s+(\*|\{)", re.MULTILINE)
RE_AWAIT_TOPO = re.compile(r"^await\s", re.MULTILINE)


def resolver(base_rel, caminho):
    """'app/telas/aula.js' + '../api.js' -> 'app/api.js'"""
    if not caminho.startswith('.'):
        morrer('import de pacote externo em ' + base_rel + ': ' + caminho)
    destino = (pathlib.PurePosixPath(base_rel).parent / caminho)
    partes = []
    for p in destino.parts:
        if p == '.':
            continue
        if p == '..':
            if partes:
                partes.pop()
            continue
        partes.append(p)
    return '/'.join(partes)


def dependencias(rel, src):
    return [resolver(rel, m.group('caminho')) for m in RE_IMPORT.finditer(src)]


def transformar(rel, src):
    """Devolve (corpo_sem_import_export, lista_de_exportados, nome_do_default)."""
    if RE_REEXPORT.search(src):
        morrer('reexportação (`export *` / `export {}`) em ' + rel + ': não suportada')
    if RE_IMPORT_SOLTO.search(src):
        morrer('import sem cláusula em ' + rel + ': não suportado')
    if RE_AWAIT_TOPO.search(src):
        morrer('`await` no topo de ' + rel + ': o achatamento tira o contexto de módulo')

    def troca_import(m):
        alvo = resolver(rel, m.group('caminho'))
        clausula = ' '.join(m.group('clausula').split())
        if clausula.startswith('*'):
            nome = clausula.split(' as ')[1].strip()
            return "const %s = __M['%s'];" % (nome, alvo)
        if clausula.startswith('{'):
            # `a as b` na importação vira `a: b` na desestruturação
            interno = re.sub(r'([\w$]+)\s+as\s+([\w$]+)', r'\1: \2', clausula)
            return "const %s = __M['%s'];" % (interno, alvo)
        return "const %s = __M['%s'].default;" % (clausula, alvo)

    src = RE_IMPORT.sub(troca_import, src)

    exportados = []

    def troca_const(m):
        exportados.append(m.group(2))
        return '%s %s' % (m.group(1), m.group(2))

    src = re.sub(r'^export\s+(const|let|var)\s+([\w$]+)', troca_const, src, flags=re.MULTILINE)

    def troca_func(m):
        exportados.append(m.group(2))
        return '%sfunction %s' % (m.group(1) or '', m.group(2))

    src = re.sub(r'^export\s+(async\s+)?function\s+([\w$]+)', troca_func, src, flags=re.MULTILINE)

    padrao = None
    achado = re.search(r'^export\s+default\s+(async\s+)?function\s+([\w$]+)', src, flags=re.MULTILINE)
    if achado:
        padrao = achado.group(2)
        src = re.sub(r'^export\s+default\s+', '', src, count=1, flags=re.MULTILINE)
    elif re.search(r'^export\s+default\s', src, flags=re.MULTILINE):
        padrao = '__padrao'
        src = re.sub(r'^export\s+default\s+', 'const __padrao = ', src, count=1, flags=re.MULTILINE)

    if re.search(r'^export\s', src, flags=re.MULTILINE):
        sobra = re.search(r'^export\s.*$', src, flags=re.MULTILINE).group(0)
        morrer('forma de export não reconhecida em ' + rel + ': ' + sobra.strip())

    return src, exportados, padrao


def juntar_modulos(entrada):
    """Percorre o grafo em pós-ordem: uma dependência é sempre definida antes
    de quem a usa. Ciclo vira erro — o registro é avaliado com ansiedade, e um
    ciclo devolveria `undefined` no meio, que é pior que não gerar."""
    ordem, visitados, na_pilha = [], set(), set()

    def visitar(rel, veio_de):
        if rel in na_pilha:
            morrer('ciclo de imports envolvendo ' + rel + ' (a partir de ' + veio_de + ')')
        if rel in visitados:
            return
        caminho = RAIZ / rel
        if not caminho.exists():
            morrer('módulo não encontrado: ' + rel + ' (importado por ' + veio_de + ')')
        src = ler(rel)
        na_pilha.add(rel)
        for dep in dependencias(rel, src):
            visitar(dep, rel)
        na_pilha.discard(rel)
        visitados.add(rel)
        ordem.append((rel, src))

    visitar(entrada, '(entrada)')

    partes = ["/* módulos ES achatados por ferramentas/bundle/bundle.py */",
              "const __M = {};"]
    for rel, src in ordem:
        corpo, exportados, padrao = transformar(rel, src)
        campos = ['%s: %s' % (n, n) for n in exportados]
        if padrao:
            campos.append('default: %s' % padrao)
        partes.append(
            "__M['%s'] = (function () {\n'use strict';\n%s\nreturn {%s};\n})();"
            % (rel, corpo.strip(), ', '.join(campos))
        )
    return '\n\n'.join(partes), len(ordem)


# ------------------------------------------------------------------- montagem

html = ler('index.html')

favicon = base64.b64encode((RAIZ / 'assets/favicon.svg').read_bytes()).decode()
html = html.replace(
    'href="assets/favicon.svg"',
    'href="data:image/svg+xml;base64,' + favicon + '"',
)

for folha in re.findall(r'<link rel="stylesheet" href="(assets/[^"]+)" />', html):
    html = html.replace(
        '<link rel="stylesheet" href="' + folha + '" />',
        '<style>\n' + ler(folha) + '\n</style>',
    )

# scripts clássicos, na mesma ordem em que o index.html os carrega
for tag in re.findall(r'<script src="(assets/[^"]+)"></script>', html):
    corpo = ler(tag).replace('</script>', '<\\/script>')   # quebraria o bloco embutido
    html = html.replace(
        '<script src="' + tag + '"></script>',
        '<script>\n' + corpo + '\n</script>',
    )

bundle, quantos = juntar_modulos(ENTRADA_MODULO)
alvo = '<script type="module" src="' + ENTRADA_MODULO + '"></script>'
if alvo not in html:
    morrer('não achei ' + alvo + ' no index.html')
html = html.replace(
    alvo,
    '<script type="module">\n' + bundle.replace('</script>', '<\\/script>') + '\n</script>',
)

restantes = re.findall(r'(?:src|href)="((?:assets|app)/[^"]+)"', html)
if restantes:
    print('AVISO: referências externas que sobraram: ' + ', '.join(restantes))

SAIDA.write_text(html, encoding='utf-8')
print('%s  —  %d módulos, %.0f KB' % (SAIDA, quantos, len(html.encode('utf-8')) / 1024))
