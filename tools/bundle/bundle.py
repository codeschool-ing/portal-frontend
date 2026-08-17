#!/usr/bin/env python3
"""Builds a single HTML file, with no external dependencies, to send around or
open straight off disk (file://). It inlines the CSS, the classic scripts and the
favicon — and resolves the ES module graph, which is the step the vitrine's tool
did not need.

    python3 tools/bundle/bundle.py   -> portal-student.html (at the root)
    python3 bundle.py output.html

The portal is still served from index.html + assets/ + app/. This file only
exists to hand over a copy that opens with two clicks.

WHY ONE STEP MORE THAN THE VITRINE
----------------------------------
The vitrine has six classic scripts: inlining is concatenation. The portal has ES
modules, and they do not survive `file://` in two different ways:

1. `<script type="module" src="app/main.js">` fires a fetch, and a fetch from
   `file://` is blocked by CORS in every browser. The file would open blank, with
   no visible error beyond the console.
2. Even inlined, an `import './routes.js'` inside the script would still be a
   fetch.

So the modules are flattened: each becomes an IIFE returning what it exported,
and the `import`s become reads from a registry. It is what a bundler does, in the
minimum this project needs — it is not a general-purpose bundler, and it does not
try to be.

The output is still a `<script type="module">`, and that is deliberate: an
inlined module makes no fetch, but keeps execution DEFERRED (after the HTML),
which is exactly the order `index.html` has when served. Swapping it for a classic
`<script>` would change when everything runs, and the bundle would stop testing
what the site tests.

WHAT THIS FLATTENING ASSUMES
----------------------------
This repository's code, and only it: `import`/`export` in the forms the files
use, with no re-export, no cycle between modules and no top-level `await`. If any
of those appears, the script says so instead of silently generating a broken
bundle.
"""
import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent           # the portal lives at the root; the tool in tools/bundle/
OUTPUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'portal-student.html'

MODULE_ENTRY = 'app/main.js'


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def die(msg):
    print('ERROR: ' + msg, file=sys.stderr)
    sys.exit(1)


# ------------------------------------------------------------- ES modules

# `import ... from '...'` in the three forms the repository uses. The named
# clause can span several lines, hence the DOTALL limited to what comes before
# `from`.
RE_IMPORT = re.compile(
    r"^import\s+(?P<clause>\*\s+as\s+[\w$]+|\{[^}]*\}|[\w$]+)\s+from\s+"
    r"['\"](?P<path>[^'\"]+)['\"];?[ \t]*$",
    re.MULTILINE | re.DOTALL,
)
RE_BARE_IMPORT = re.compile(r"^import\s+['\"][^'\"]+['\"];?\s*$", re.MULTILINE)
RE_REEXPORT = re.compile(r"^export\s+(\*|\{)", re.MULTILINE)
RE_TOP_AWAIT = re.compile(r"^await\s", re.MULTILINE)


def resolve(base_rel, path):
    """'app/screens/lesson.js' + '../api.js' -> 'app/api.js'"""
    if not path.startswith('.'):
        die('import of an external package in ' + base_rel + ': ' + path)
    target = (pathlib.PurePosixPath(base_rel).parent / path)
    parts = []
    for p in target.parts:
        if p == '.':
            continue
        if p == '..':
            if parts:
                parts.pop()
            continue
        parts.append(p)
    return '/'.join(parts)


def dependencies(rel, src):
    return [resolve(rel, m.group('path')) for m in RE_IMPORT.finditer(src)]


def transform(rel, src):
    """Returns (body_without_import_export, exported_names, default_name)."""
    if RE_REEXPORT.search(src):
        die('re-export (`export *` / `export {}`) in ' + rel + ': not supported')
    if RE_BARE_IMPORT.search(src):
        die('import with no clause in ' + rel + ': not supported')
    if RE_TOP_AWAIT.search(src):
        die('top-level `await` in ' + rel + ': flattening removes the module context')

    def swap_import(m):
        target = resolve(rel, m.group('path'))
        clause = ' '.join(m.group('clause').split())
        if clause.startswith('*'):
            name = clause.split(' as ')[1].strip()
            return "const %s = __M['%s'];" % (name, target)
        if clause.startswith('{'):
            # `a as b` in the import becomes `a: b` in the destructuring
            inner = re.sub(r'([\w$]+)\s+as\s+([\w$]+)', r'\1: \2', clause)
            return "const %s = __M['%s'];" % (inner, target)
        return "const %s = __M['%s'].default;" % (clause, target)

    src = RE_IMPORT.sub(swap_import, src)

    exported = []

    def swap_const(m):
        exported.append(m.group(2))
        return '%s %s' % (m.group(1), m.group(2))

    src = re.sub(r'^export\s+(const|let|var)\s+([\w$]+)', swap_const, src, flags=re.MULTILINE)

    def swap_func(m):
        exported.append(m.group(2))
        return '%sfunction %s' % (m.group(1) or '', m.group(2))

    src = re.sub(r'^export\s+(async\s+)?function\s+([\w$]+)', swap_func, src, flags=re.MULTILINE)

    default = None
    found = re.search(r'^export\s+default\s+(async\s+)?function\s+([\w$]+)', src, flags=re.MULTILINE)
    if found:
        default = found.group(2)
        src = re.sub(r'^export\s+default\s+', '', src, count=1, flags=re.MULTILINE)
    elif re.search(r'^export\s+default\s', src, flags=re.MULTILINE):
        default = '__default'
        src = re.sub(r'^export\s+default\s+', 'const __default = ', src, count=1, flags=re.MULTILINE)

    if re.search(r'^export\s', src, flags=re.MULTILINE):
        leftover = re.search(r'^export\s.*$', src, flags=re.MULTILINE).group(0)
        die('unrecognised export form in ' + rel + ': ' + leftover.strip())

    return src, exported, default


def join_modules(entry):
    """Walks the graph in post-order: a dependency is always defined before
    whoever uses it. A cycle becomes an error — the registry is evaluated
    eagerly, and a cycle would hand back `undefined` halfway through, which is
    worse than not building at all."""
    order, visited, on_stack = [], set(), set()

    def visit(rel, came_from):
        if rel in on_stack:
            die('import cycle involving ' + rel + ' (from ' + came_from + ')')
        if rel in visited:
            return
        path = ROOT / rel
        if not path.exists():
            die('module not found: ' + rel + ' (imported by ' + came_from + ')')
        src = read(rel)
        on_stack.add(rel)
        for dep in dependencies(rel, src):
            visit(dep, rel)
        on_stack.discard(rel)
        visited.add(rel)
        order.append((rel, src))

    visit(entry, '(entry)')

    parts = ["/* ES modules flattened by tools/bundle/bundle.py */",
             "const __M = {};"]
    for rel, src in order:
        body, exported, default = transform(rel, src)
        fields = ['%s: %s' % (n, n) for n in exported]
        if default:
            fields.append('default: %s' % default)
        parts.append(
            "__M['%s'] = (function () {\n'use strict';\n%s\nreturn {%s};\n})();"
            % (rel, body.strip(), ', '.join(fields))
        )
    return '\n\n'.join(parts), len(order)


# ---------------------------------------------------------------- assembly

html = read('index.html')

favicon = base64.b64encode((ROOT / 'assets/favicon.svg').read_bytes()).decode()
html = html.replace(
    'href="assets/favicon.svg"',
    'href="data:image/svg+xml;base64,' + favicon + '"',
)

for sheet in re.findall(r'<link rel="stylesheet" href="(assets/[^"]+)" />', html):
    html = html.replace(
        '<link rel="stylesheet" href="' + sheet + '" />',
        '<style>\n' + read(sheet) + '\n</style>',
    )

# THE LESSON CONTENT, which index.html no longer loads.
#
# It used to arrive with everything else, because the served page carried it and
# this tool inlines what the page references. The page does not any more: GitHub
# Pages was handing every word of every course to anybody who asked, and the
# prose now comes from `GET /api/lessons/{courseId}`, which the plan gates.
#
# THIS FILE IS THE EXCEPTION, on purpose. The pricing page sells "lessons to
# watch offline" under the subscription, and an offline copy with no lessons in
# it is not the thing being sold — it is the shell of it. So the bundle reaches
# past index.html and inlines the content directly.
#
# WHAT THAT MAKES THIS OUTPUT. `portal-student.html` is a subscriber's download
# now, not something to publish: it carries content the served site withholds.
# It must not be committed to a Pages branch or linked publicly, and the route
# that hands it to a paying student is the piece still to build.
#
# Injected BEFORE the loop below, so the content is inlined in the same pass and
# in the order the page would have loaded it: the Portuguese dictionary first,
# then the English source it falls back to.
lesson_assets = ['assets/lessons-pt.js'] + sorted(
    'assets/' + p.name for p in (ROOT / 'assets').glob('lessons-*.js')
    if p.name != 'lessons-pt.js'
)
missing = [a for a in lesson_assets if not (ROOT / a).exists()]
if missing:
    die('lesson content missing: ' + ', '.join(missing))
anchor = '<script src="assets/exercises-sample.js"></script>'
if anchor not in html:
    die('could not find ' + anchor + ' in index.html to inject the lessons before')
html = html.replace(
    anchor,
    ''.join('<script src="' + a + '"></script>\n' for a in lesson_assets) + anchor,
)

# classic scripts, in the same order index.html loads them
for tag in re.findall(r'<script src="(assets/[^"]+)"></script>', html):
    body = read(tag).replace('</script>', '<\\/script>')   # would break the inlined block
    html = html.replace(
        '<script src="' + tag + '"></script>',
        '<script>\n' + body + '\n</script>',
    )

bundle, count = join_modules(MODULE_ENTRY)
target = '<script type="module" src="' + MODULE_ENTRY + '"></script>'
if target not in html:
    die('could not find ' + target + ' in index.html')
html = html.replace(
    target,
    '<script type="module">\n' + bundle.replace('</script>', '<\\/script>') + '\n</script>',
)

leftovers = re.findall(r'(?:src|href)="((?:assets|app)/[^"]+)"', html)
if leftovers:
    print('WARNING: external references left behind: ' + ', '.join(leftovers))

OUTPUT.write_text(html, encoding='utf-8')
print('%s  —  %d modules, %.0f KB' % (OUTPUT, count, len(html.encode('utf-8')) / 1024))
