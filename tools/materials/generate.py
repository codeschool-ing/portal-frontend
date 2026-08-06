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
    'wf-dns-cheatsheet': {
        'title': 'DNS and propagation — cheat sheet',
        'lines': [
            ('t', 'DNS and propagation'),
            ('s', 'codeschool.ing - Web and Internet Fundamentals'),
            ('', ''),
            ('h', 'The records you use every week'),
            ('p', 'A     name -> IPv4 address'),
            ('p', 'AAAA  name -> IPv6 address'),
            ('p', 'CNAME name -> another name (never at the domain root)'),
            ('p', 'MX    where the domain\'s e-mail goes'),
            ('p', 'TXT   free text; and where SPF, DKIM and verifications live'),
            ('p', 'NS    which servers answer for this zone'),
            ('', ''),
            ('h', 'Why the change takes so long'),
            ('p', 'Nobody "pushes" the change out. Every resolver kept the old answer'),
            ('p', 'for as long as the TTL told it to, and only asks again when that'),
            ('p', 'time runs out. The wait is the TTL that was in force BEFORE the'),
            ('p', 'change - not the new one.'),
            ('', ''),
            ('h', 'The recipe for changing without a fright'),
            ('p', '1. Lower the TTL to 300s and wait for the OLD TTL to expire.'),
            ('p', '2. Change the record.'),
            ('p', '3. Check on more than one resolver.'),
            ('p', '4. Put the TTL back to 3600s or more.'),
            ('', ''),
            ('h', 'Checking'),
            ('p', 'dig +short example.com A'),
            ('p', 'dig @1.1.1.1 example.com A     (on one specific resolver)'),
            ('p', 'dig +trace example.com         (the whole path)'),
        ],
    },
    'wf-http-codes': {
        'title': 'HTTP status codes — the ones that matter',
        'lines': [
            ('t', 'HTTP status codes'),
            ('s', 'codeschool.ing - Web and Internet Fundamentals'),
            ('', ''),
            ('h', 'The family says the essential part'),
            ('p', '2xx  it worked'),
            ('p', '3xx  look somewhere else'),
            ('p', '4xx  the request is wrong - the fault is the caller\'s'),
            ('p', '5xx  the request was right - the fault is the responder\'s'),
            ('', ''),
            ('h', 'The ones you will meet'),
            ('p', '200 OK                     301 moved permanently'),
            ('p', '201 created                302 moved for now'),
            ('p', '204 no content             304 not modified (use your cache)'),
            ('p', '400 malformed request      500 server error'),
            ('p', '401 not authenticated      502 bad gateway'),
            ('p', '403 authenticated, no access  503 down / overloaded'),
            ('p', '404 does not exist         504 the one behind took too long'),
            ('p', '429 too many requests'),
            ('', ''),
            ('h', 'The mix-up that costs the most'),
            ('p', '401 is "I do not know who you are". 403 is "I know, and you cannot".'),
            ('p', 'Swapping the two tells the client to log in again when the'),
            ('p', 'problem was permission - or hides that permission was missing.'),
            ('', ''),
            ('p', '301 is CACHED BY THE BROWSER, and for a long time. Getting a 301'),
            ('p', 'wrong in production is hard to undo: use 302 until you are sure.'),
        ],
    },
    'js-coercion-table': {
        'title': 'Coercion and falsy values — pocket table',
        'lines': [
            ('t', 'Coercion and falsy values'),
            ('s', 'codeschool.ing - JavaScript'),
            ('', ''),
            ('h', 'The eight falsy values'),
            ('p', 'false   0   -0   0n   ""   null   undefined   NaN'),
            ('p', 'Everything else is truthy - including [], {} and "0".'),
            ('', ''),
            ('h', 'What surprises people'),
            ('p', '1 + "1"        ->  "11"     (+ concatenates with a string)'),
            ('p', '1 - "1"        ->  0        (- only exists for numbers)'),
            ('p', '[] + {}        ->  "[object Object]"'),
            ('p', '0.1 + 0.2      ->  0.30000000000000004'),
            ('p', 'Number("12px") ->  NaN'),
            ('p', 'parseInt("12px", 10) -> 12'),
            ('', ''),
            ('h', 'Equality'),
            ('p', '0 == ""        ->  true'),
            ('p', '0 == "0"       ->  true'),
            ('p', '"" == "0"      ->  false      <- == is not transitive'),
            ('p', 'NaN === NaN    ->  false      <- use Number.isNaN'),
            ('p', 'null == undefined -> true     <- the one useful exception'),
            ('', ''),
            ('h', 'The right default'),
            ('p', 'x || fallback   runs over 0 and "" (asks "is it falsy?")'),
            ('p', 'x ?? fallback   only fires on null/undefined (asks "does it exist?")'),
            ('', ''),
            ('p', 'Rule: === always. == only in "x == null".'),
        ],
    },
    'js-this-map': {
        'title': 'The value of this — decision map',
        'lines': [
            ('t', 'The value of this'),
            ('s', 'codeschool.ing - JavaScript'),
            ('', ''),
            ('h', 'The question is always: HOW was it called?'),
            ('p', 'obj.f()            this = obj      (whatever is before the dot)'),
            ('p', 'f()                this = undefined in a module/strict'),
            ('p', 'new F()            this = the new instance'),
            ('p', 'f.call(x) / apply  this = x'),
            ('p', 'f.bind(x)          this = x, for ever'),
            ('p', '() => ...          this = wherever the arrow was WRITTEN'),
            ('', ''),
            ('h', 'The classic bug'),
            ('p', 'const loose = obj.method;   // split the function from its owner'),
            ('p', 'loose();                    // TypeError: undefined'),
            ('p', ''),
            ('p', 'It happens every time obj.method is passed as a callback:'),
            ('p', 'button.addEventListener("click", obj.method)   <- breaks'),
            ('p', 'button.addEventListener("click", () => obj.method())  <- ok'),
            ('', ''),
            ('h', 'Arrows: when to use one and when not to'),
            ('p', 'DO      in a callback, to carry the outer this along'),
            ('p', 'DO NOT  as an object method - it cannot see the object'),
            ('p', 'DO NOT  as a constructor - an arrow does not accept new'),
        ],
    },
    'hc-flex-map': {
        'title': 'Flexbox — map of the properties',
        'lines': [
            ('t', 'Flexbox: map of the properties'),
            ('s', 'codeschool.ing - HTML and CSS'),
            ('', ''),
            ('h', 'On the container'),
            ('p', 'display: flex           turns the flex context on'),
            ('p', 'flex-direction          row | column (sets the main axis)'),
            ('p', 'justify-content         distributes along the MAIN axis'),
            ('p', 'align-items             aligns along the CROSS axis'),
            ('p', 'flex-wrap               lets the line break'),
            ('p', 'gap                     space between the items'),
            ('', ''),
            ('h', 'On the items'),
            ('p', 'flex-grow               shares out the space LEFT OVER'),
            ('p', 'flex-shrink             shares out what is MISSING'),
            ('p', 'flex-basis              starting size, before sharing out'),
            ('p', 'flex: 1                 shorthand for 1 1 0'),
            ('p', 'align-self              an exception to the container align-items'),
            ('', ''),
            ('h', 'The rule that settles 90% of the confusion'),
            ('p', 'justify-content acts on the MAIN axis; align-items, on the CROSS one.'),
            ('p', 'Switching flex-direction to column SWAPS the two around - and that'),
            ('p', 'is why the property that used to work "stopped working".'),
            ('', ''),
            ('h', 'When NOT to use flex'),
            ('p', 'A layout in two dimensions at once (rows AND columns that need to'),
            ('p', 'line up with each other) is the Grid\'s job.'),
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
