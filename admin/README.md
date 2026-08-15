# The console

The staff side of codeschool.ing. Today it is a shell: seven routes, a rail, and
one screen apiece that says what that screen is for and where each piece of it
stands. Nothing here calls the API.

## Why it lives in this repository

`assets/base.css` already exists twice, byte for byte — here and in the
vitrine — and the root `CLAUDE.md` treats that as a debt under watch. A console
in a third place would be a third copy. Under `admin/` it reuses the stylesheet,
the router (`app/routes.js`), `esc`, the CI job and the Pages deploy without
duplicating any of them.

It is a folder, deliberately. Publishing it to `admin.codeschool.ing` later, or
lifting it into a repository of its own, moves this directory and rewrites two
relative paths.

## What it does not share

**The i18n runtime.** The console is staff-only and English-only. Translating an
internal tool for a team of three buys nothing, and English is this project's
source language anyway. The saving that matters is not the translating — it is
that `tools/i18n/check.mjs` has no dictionaries here to keep in step.

## There is no access control, and the console says so

The backend has no staff role. `accounts` carries no such column and no table
does, so `app/session.js` cannot check one and does not pretend to: `state.staff`
is `null`, meaning *the concept does not exist yet* — not `false`, which would
mean somebody was asked and refused.

A banner says this on every screen, and the smoke suite asserts the banner is
there. That is safe **only because the console does nothing**. The rule that
follows from it:

> A screen that reads or writes real data cannot ship before the role check
> does.

When the role lands, `state.staff` stops being `null`, the banner disappears on
its own, and the block in `tools/admin-smoke/check.mjs` that asserts it is
present becomes the block that asserts an unauthorised caller is refused — the
same test, the opposite expectation.

## The plan lives in the code

`app/sections.js` holds one entry per section and, inside it, the capabilities
that section has to carry with the status each is in today. It is what the rail
is built from, what the placeholder screens render, and the acceptance list a
real screen is measured against. It comes from the capability map, and it is
kept here so the plan cannot drift away from the screens.

The statuses are the map's: `ready` (exercised end to end today), `partial` (the
hard half exists — the note says what is missing), `none`.

## Adding a real screen

1. Write `app/screens/<id>.js` exporting
   `async (section) => ({ title, el, after?, onLeave? })` — the portal's own
   screen contract, since it is the portal's router.
2. Register it in `SCREENS` in `app/sections.js`. The route and the rail follow;
   the `plan` tag disappears from that rail entry on its own.
3. Leave the section's `plan` entries in place and update their statuses. They
   are the acceptance list, not scaffolding.
4. Add its checks to `tools/admin-smoke/check.mjs`.

## Running it

```sh
python3 -m http.server 8899          # at the repository root
# then open http://127.0.0.1:8899/admin/
node tools/admin-smoke/check.mjs     # needs playwright + chromium
```

`<meta name="backend">` ships empty, exactly as the portal's does: empty means
"no server", which is what a local run and the browser suite both need. The Pages
workflow fills in both files on the way out.
