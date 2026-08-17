# portal-frontend

The Student Portal at app.codeschool.ing. No build step and no dependencies: plain HTML, CSS
and ES modules, served from source by GitHub Pages.

**Three files are SHARED with `codeschool-ing/console-frontend`** — `assets/base.css`,
`app/routes.js` and `assets/favicon.svg`. That repository carries its own copies and fails
its CI on drift; `tools/check-shared/check.sh` there is the check, and it reads this
checkout. Editing any of the three here changes two sites.

`assets/base.css` has a third copy in the showcase, `codeschool-ing/codeschool-ing.github.io`,
where it is called `assets/style.css`. Nothing checks that one.

## Before pushing

Every step CI runs, in order, and none of them is optional:

```sh
node tools/i18n/check.mjs                 # no screen stuck in English
node tools/snapshot/snapshot.js > /dev/null
node tools/version/version.js --check
python3 tools/bundle/bundle.py && node tools/bundle/boot.mjs
node tools/examples/check.mjs
node tools/smoke/smoke.mjs                # needs a server on 8899; ~4 minutes
node tools/migration/check.mjs
node tools/session/check.mjs
```

**The interface is translated into FOUR languages, in TWO files.** `assets/i18n.js` holds
es, fr and it; `assets/i18n-pt.js` is the Portuguese overlay, and only its `ui` object is
the interface — `plans` and `features` are the pricing page. A string added to the wrong
object is a string the check reports as missing in every language, which is what it is for.

**`txt()` takes ONE string literal.** `tools/i18n/check.mjs` reads the source rather than
running it, so two joined fragments are a call it cannot follow — and a call it cannot
follow is a string nobody can prove is translated. Staying under 100 columns is worth less
than that. Do not put an example of the broken form in a comment either: the check scans
the file as text and reads it as a real call.

## The lesson content is not served

`assets/lessons-*.js` is where the lessons are AUTHORED, and `index.html` does not load
them. GitHub Pages was handing every word of every course to anybody who opened the file,
while the server refused to record progress on those same courses — and the pricing page
sells "lessons to watch offline" as part of the subscription.

The prose comes from `GET /api/lessons/{courseId}`, which the plan gates; the shape of every
course comes from `GET /api/lessons`, which it does not, because a progress percentage has a
denominator and the track map draws one per course.

`tools/snapshot/snapshot.js` reads those files to carry the content to the backend, and
`tools/bundle/bundle.py` inlines them directly rather than through `index.html`. That makes
**`portal-student.html` a subscriber's download and not something to publish** — it carries
content the served site withholds.

`tools/bundle/boot.mjs` opens the bundle from `file://` and is not optional. CI built that
file for weeks without ever loading it, and it threw before its first paint the whole time.

## Finishing a piece of work

**Open the pull request. Always, without being asked.** The reason is time zones and
distance rather than ceremony: CI takes minutes, and a branch pushed without a PR is a
branch whose checks have not started — so the answer waits for somebody to arrive at a
computer instead of being ready when they do.

One branch per subject, not one per session. A bug found on the way to something else gets
its own branch and its own PR, so a fix nobody is arguing with does not wait behind a change
somebody is.

Work that still needs a decision is opened as a **draft**, with the question in the body.
The checks run either way, and an open draft is visible where an unpushed branch is not.
