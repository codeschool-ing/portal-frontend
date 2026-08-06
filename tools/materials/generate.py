#!/usr/bin/env python3
"""Generates the sample PDFs for the supplementary material.

WHY A GENERATOR, AND NOT COMMITTED PDFs

The portal has to work opened off disk, as a single file: `bundle.py` flattens
everything into one `.html`, and a link to `assets/material.pdf` dies there. A
`data:` URI survives — the same reason the vitrine inlines its fonts.

And a binary PDF in git is the kind of file nobody reviews and nobody knows how
to regenerate six months later. Here the CONTENT is text in this file, versioned
and readable in a diff; the binary is output.

The PDF is written by hand, with no dependency, because the whole portal has
none. They are ~1 KB each: one page, Helvetica, running text. It is not meant to
be pretty — it is meant to be a real PDF, one that opens in the system reader and
shows that the download path works end to end.

    python3 tools/materials/generate.py     # rewrites assets/materials.js
"""

import base64
import json
import pathlib
import textwrap

ROOT = pathlib.Path(__file__).resolve().parents[2]

# ----------------------------------------------------------------- content

MATERIALS = {
    'wf-dns-resumo': {
        'title': 'DNS e propagação — folha de consulta',
        'lines': [
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
        'title': 'Códigos de status HTTP — os que importam',
        'lines': [
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
        'title': 'Coerção e valores falsos — tabela de bolso',
        'lines': [
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
        'title': 'O valor de this — mapa de decisão',
        'lines': [
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
        'title': 'Flexbox — mapa das propriedades',
        'lines': [
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

STYLE = {
    't': ('Helvetica-Bold', 17, 26),
    's': ('Helvetica', 9.5, 22),
    'h': ('Helvetica-Bold', 11, 20),
    'p': ('Helvetica', 9.5, 13.5),
    '': ('Helvetica', 9.5, 9),
}


def escape(s):
    return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


def pdf(lines):
    """A one-page PDF, uncompressed, written by hand."""
    width, height, margin = 595, 842, 64
    y = height - margin
    stream = []
    for kind, text in lines:
        font, size, skip = STYLE[kind]
        y -= skip
        if text:
            colour = '0.25 0.25 0.25' if kind == 's' else '0 0 0'
            stream.append(
                f'BT /{font.replace("-", "")} {size} Tf {colour} rg '
                f'1 0 0 1 {margin} {y:.1f} Tm ({escape(text)}) Tj ET'
            )
    content = '\n'.join(stream).encode('latin-1', 'replace')

    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        (
            f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] '
            '/Resources << /Font << /Helvetica 5 0 R /HelveticaBold 6 0 R >> >> '
            '/Contents 4 0 R >>'
        ).encode(),
        b'<< /Length ' + str(len(content)).encode() + b' >>\nstream\n' + content + b'\nendstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ]

    out = bytearray(b'%PDF-1.4\n')
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f'{i} 0 obj\n'.encode() + obj + b'\nendobj\n'

    xref = len(out)
    out += f'xref\n0 {len(objects) + 1}\n'.encode()
    out += b'0000000000 65535 f \n'
    for p in offsets:
        out += f'{p:010d} 00000 n \n'.encode()
    out += (
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
        f'startxref\n{xref}\n%%EOF\n'
    ).encode()
    return bytes(out)


def main():
    out = {}
    for key, m in MATERIALS.items():
        binary = pdf(m['lines'])
        out[key] = {
            'title': m['title'],
            'kind': 'pdf',
            'bytes': len(binary),
            'file': key + '.pdf',
            'data': 'data:application/pdf;base64,' + base64.b64encode(binary).decode(),
        }
        print(f'  {key:20s} {len(binary):6d} bytes')

    target = ROOT / 'assets' / 'materials.js'
    header = textwrap.dedent('''\
        /* ==========================================================================
           Supplementary material — GENERATED. Do not edit by hand.

           Source: tools/materials/generate.py
           Regenerate: python3 tools/materials/generate.py

           The PDFs come as `data:` URIs because the portal has to work opened off
           disk, as a single file — a link to `assets/something.pdf` dies after the
           bundle. In Stage 2 this becomes a signed URL from a bucket, and the shape
           of the record does not change: only the `data` field stops being
           inlined.
           ========================================================================== */

        window.MATERIALS = ''')
    target.write_text(header + json.dumps(out, ensure_ascii=False, indent=2) + ';\n')
    print(f'{target}  —  {len(out)} materials, {target.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
