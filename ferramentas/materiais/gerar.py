#!/usr/bin/env python3
"""Gera os PDFs de exemplo do material complementar.

POR QUE UM GERADOR, E NÃO PDFs COMMITADOS

O portal tem de funcionar aberto do disco, como arquivo único: `bundle.py`
achata tudo num `.html`, e um link para `assets/material.pdf` morre ali. Um
`data:` URI atravessa — é o mesmo motivo pelo qual a vitrine embute as fontes.

E PDF binário no git é o tipo de arquivo que ninguém revisa e que ninguém sabe
regerar seis meses depois. Aqui o CONTEÚDO é texto neste arquivo, versionado e
legível no diff; o binário é saída.

O PDF é escrito à mão, sem dependência, porque o portal inteiro não tem
nenhuma. São ~1 KB cada: uma página, Helvetica, texto corrido. Não é para ser
bonito — é para ser um PDF de verdade, que abre no leitor do sistema e mostra
que o caminho do download funciona de ponta a ponta.

    python3 ferramentas/materiais/gerar.py     # reescreve assets/materiais.js
"""

import base64
import json
import pathlib
import textwrap

RAIZ = pathlib.Path(__file__).resolve().parents[2]

# ---------------------------------------------------------------- conteúdo

MATERIAIS = {
    'wf-dns-resumo': {
        'titulo': 'DNS e propagação — folha de consulta',
        'linhas': [
            ('t', 'DNS e propagacao'),
            ('s', 'codeschool.ing - Fundamentos da Web e Internet'),
            ('', ''),
            ('h', 'Os registros que se usa toda semana'),
            ('p', 'A     nome -> endereco IPv4'),
            ('p', 'AAAA  nome -> endereco IPv6'),
            ('p', 'CNAME nome -> outro nome (nunca na raiz do dominio)'),
            ('p', 'MX    para onde vai o e-mail do dominio'),
            ('p', 'TXT   texto livre; e onde moram SPF, DKIM e verificacoes'),
            ('p', 'NS    quais servidores respondem por esta zona'),
            ('', ''),
            ('h', 'Por que a mudanca demora'),
            ('p', 'Ninguem "espalha" a mudanca. Cada resolvedor guardou a resposta'),
            ('p', 'antiga pelo tempo que o TTL mandou, e so volta a perguntar quando'),
            ('p', 'esse tempo acaba. A espera e o TTL que estava valendo ANTES da'),
            ('p', 'troca - nao o novo.'),
            ('', ''),
            ('h', 'A receita para mudar sem susto'),
            ('p', '1. Baixe o TTL para 300s e espere o TTL ANTIGO passar.'),
            ('p', '2. Troque o registro.'),
            ('p', '3. Confira em mais de um resolvedor.'),
            ('p', '4. Devolva o TTL para 3600s ou mais.'),
            ('', ''),
            ('h', 'Conferindo'),
            ('p', 'dig +short exemplo.com A'),
            ('p', 'dig @1.1.1.1 exemplo.com A     (num resolvedor especifico)'),
            ('p', 'dig +trace exemplo.com         (o caminho inteiro)'),
        ],
    },
    'wf-http-codigos': {
        'titulo': 'Códigos de status HTTP — os que importam',
        'linhas': [
            ('t', 'Codigos de status HTTP'),
            ('s', 'codeschool.ing - Fundamentos da Web e Internet'),
            ('', ''),
            ('h', 'A familia diz o essencial'),
            ('p', '2xx  deu certo'),
            ('p', '3xx  procure em outro lugar'),
            ('p', '4xx  o pedido esta errado - o erro e de quem pediu'),
            ('p', '5xx  o pedido estava certo - o erro e de quem respondeu'),
            ('', ''),
            ('h', 'Os que voce vai encontrar'),
            ('p', '200 OK                    301 movido para sempre'),
            ('p', '201 criado                302 movido por ora'),
            ('p', '204 sem conteudo          304 nao mudou (use o seu cache)'),
            ('p', '400 pedido malformado     500 erro no servidor'),
            ('p', '401 nao autenticado       502 gateway ruim'),
            ('p', '403 autenticado, sem acesso  503 fora do ar / sobrecarga'),
            ('p', '404 nao existe            504 o de tras demorou demais'),
            ('p', '429 pedidos demais'),
            ('', ''),
            ('h', 'A confusao que mais custa caro'),
            ('p', '401 e "eu nao sei quem voce e". 403 e "eu sei, e voce nao pode".'),
            ('p', 'Trocar os dois manda o cliente tentar logar de novo quando o'),
            ('p', 'problema era permissao - ou esconde que faltou permissao.'),
            ('', ''),
            ('p', '301 e CACHEADO PELO NAVEGADOR, e por muito tempo. Errar um 301'),
            ('p', 'em producao e dificil de desfazer: use 302 ate ter certeza.'),
        ],
    },
    'js-coercao-tabela': {
        'titulo': 'Coerção e valores falsos — tabela de bolso',
        'linhas': [
            ('t', 'Coercao e valores falsos'),
            ('s', 'codeschool.ing - JavaScript'),
            ('', ''),
            ('h', 'Os oito valores falsos'),
            ('p', 'false   0   -0   0n   ""   null   undefined   NaN'),
            ('p', 'Todo o resto e verdadeiro - inclusive [], {} e "0".'),
            ('', ''),
            ('h', 'O que surpreende'),
            ('p', '1 + "1"        ->  "11"     (+ concatena com string)'),
            ('p', '1 - "1"        ->  0        (- so existe para numero)'),
            ('p', '[] + {}        ->  "[object Object]"'),
            ('p', '0.1 + 0.2      ->  0.30000000000000004'),
            ('p', 'Number("12px") ->  NaN'),
            ('p', 'parseInt("12px", 10) -> 12'),
            ('', ''),
            ('h', 'Igualdade'),
            ('p', '0 == ""        ->  true'),
            ('p', '0 == "0"       ->  true'),
            ('p', '"" == "0"      ->  false      <- == nao e transitivo'),
            ('p', 'NaN === NaN    ->  false      <- use Number.isNaN'),
            ('p', 'null == undefined -> true     <- a unica excecao util'),
            ('', ''),
            ('h', 'O padrao certo'),
            ('p', 'x || padrao   atropela 0 e "" (testa "e falso?")'),
            ('p', 'x ?? padrao   so entra em null/undefined (testa "existe?")'),
            ('', ''),
            ('p', 'Regra: === sempre. == so em "x == null".'),
        ],
    },
    'js-this-mapa': {
        'titulo': 'O valor de this — mapa de decisão',
        'linhas': [
            ('t', 'O valor de this'),
            ('s', 'codeschool.ing - JavaScript'),
            ('', ''),
            ('h', 'A pergunta e sempre: COMO foi chamada?'),
            ('p', 'obj.f()            this = obj      (o que esta antes do ponto)'),
            ('p', 'f()                this = undefined em modulo/strict'),
            ('p', 'new F()            this = a instancia nova'),
            ('p', 'f.call(x) / apply  this = x'),
            ('p', 'f.bind(x)          this = x, para sempre'),
            ('p', '() => ...          this = o de onde a seta foi ESCRITA'),
            ('', ''),
            ('h', 'O bug classico'),
            ('p', 'const solta = obj.metodo;   // separou a funcao do dono'),
            ('p', 'solta();                    // TypeError: undefined'),
            ('p', ''),
            ('p', 'Acontece toda vez que se passa obj.metodo como callback:'),
            ('p', 'botao.addEventListener("click", obj.metodo)   <- quebra'),
            ('p', 'botao.addEventListener("click", () => obj.metodo())  <- ok'),
            ('', ''),
            ('h', 'Seta: quando usar e quando nao'),
            ('p', 'USE     em callback, para carregar o this de fora junto'),
            ('p', 'NAO USE como metodo de objeto - ela nao enxerga o objeto'),
            ('p', 'NAO USE como construtor - seta nao aceita new'),
        ],
    },
    'hc-flex-mapa': {
        'titulo': 'Flexbox — mapa das propriedades',
        'linhas': [
            ('t', 'Flexbox: mapa das propriedades'),
            ('s', 'codeschool.ing - HTML e CSS'),
            ('', ''),
            ('h', 'No container'),
            ('p', 'display: flex           liga o contexto flex'),
            ('p', 'flex-direction          row | column (define o eixo principal)'),
            ('p', 'justify-content         distribui no eixo PRINCIPAL'),
            ('p', 'align-items             alinha no eixo CRUZADO'),
            ('p', 'flex-wrap               deixa quebrar linha'),
            ('p', 'gap                     espaco entre os itens'),
            ('', ''),
            ('h', 'Nos itens'),
            ('p', 'flex-grow               reparte o espaco que SOBRA'),
            ('p', 'flex-shrink             reparte o que FALTA'),
            ('p', 'flex-basis              tamanho de partida, antes de repartir'),
            ('p', 'flex: 1                 atalho de 1 1 0'),
            ('p', 'align-self              excecao ao align-items do container'),
            ('', ''),
            ('h', 'A regra que resolve 90% da confusao'),
            ('p', 'justify-content age no eixo PRINCIPAL; align-items, no CRUZADO.'),
            ('p', 'Trocar flex-direction para column TROCA os dois de lugar - e e'),
            ('p', 'por isso que a propriedade que funcionava "parou de funcionar".'),
            ('', ''),
            ('h', 'Quando NAO usar flex'),
            ('p', 'Layout em duas dimensoes ao mesmo tempo (linhas E colunas que'),
            ('p', 'precisam se alinhar entre si) e trabalho do Grid.'),
        ],
    },
}

# ------------------------------------------------------------------- PDF

ESTILO = {
    't': ('Helvetica-Bold', 17, 26),
    's': ('Helvetica', 9.5, 22),
    'h': ('Helvetica-Bold', 11, 20),
    'p': ('Helvetica', 9.5, 13.5),
    '': ('Helvetica', 9.5, 9),
}


def escapar(s):
    return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


def pdf(linhas):
    """Um PDF de uma página, sem compressão, escrito na mão."""
    largura, altura, margem = 595, 842, 64
    y = altura - margem
    fluxo = []
    for tipo, texto in linhas:
        fonte, corpo, salto = ESTILO[tipo]
        y -= salto
        if texto:
            cor = '0.25 0.25 0.25' if tipo == 's' else '0 0 0'
            fluxo.append(
                f'BT /{fonte.replace("-", "")} {corpo} Tf {cor} rg '
                f'1 0 0 1 {margem} {y:.1f} Tm ({escapar(texto)}) Tj ET'
            )
    conteudo = '\n'.join(fluxo).encode('latin-1', 'replace')

    objetos = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        (
            f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {largura} {altura}] '
            '/Resources << /Font << /Helvetica 5 0 R /HelveticaBold 6 0 R >> >> '
            '/Contents 4 0 R >>'
        ).encode(),
        b'<< /Length ' + str(len(conteudo)).encode() + b' >>\nstream\n' + conteudo + b'\nendstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ]

    fora = bytearray(b'%PDF-1.4\n')
    posicoes = []
    for i, obj in enumerate(objetos, start=1):
        posicoes.append(len(fora))
        fora += f'{i} 0 obj\n'.encode() + obj + b'\nendobj\n'

    xref = len(fora)
    fora += f'xref\n0 {len(objetos) + 1}\n'.encode()
    fora += b'0000000000 65535 f \n'
    for p in posicoes:
        fora += f'{p:010d} 00000 n \n'.encode()
    fora += (
        f'trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref}\n%%EOF\n'
    ).encode()
    return bytes(fora)


def main():
    saida = {}
    for chave, m in MATERIAIS.items():
        binario = pdf(m['linhas'])
        saida[chave] = {
            'titulo': m['titulo'],
            'tipo': 'pdf',
            'bytes': len(binario),
            'arquivo': chave + '.pdf',
            'dados': 'data:application/pdf;base64,' + base64.b64encode(binario).decode(),
        }
        print(f'  {chave:20s} {len(binario):6d} bytes')

    destino = RAIZ / 'assets' / 'materiais.js'
    cabeca = textwrap.dedent('''\
        /* ==========================================================================
           Material complementar — GERADO. Não edite à mão.

           Fonte: ferramentas/materiais/gerar.py
           Regerar: python3 ferramentas/materiais/gerar.py

           Os PDFs vêm como `data:` URI porque o portal tem de funcionar aberto do
           disco, como arquivo único — um link para `assets/algo.pdf` morre depois do
           bundle. Na Etapa 2 isto vira URL assinada de um bucket, e o formato do
           registro não muda: só o campo `dados` deixa de ser embutido.
           ========================================================================== */

        window.MATERIAIS = ''')
    destino.write_text(cabeca + json.dumps(saida, ensure_ascii=False, indent=2) + ';\n')
    print(f'{destino}  —  {len(saida)} materiais, {destino.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
