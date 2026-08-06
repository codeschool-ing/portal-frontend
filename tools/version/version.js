#!/usr/bin/env node
/* ==========================================================================
   codeschool.ing — read or set the released version.

   THE VERSION IS IN THE REPOSITORY, NOT STAMPED AT BUILD. `bundle.py` produces
   a file to open off a disk, and a version that only existed inside the bundle
   would be missing from the portal served from source — two answers to one
   question, which is worse than none.

   So the file is authoritative and the release is checked against it —
   .github/workflows/release.yml refuses a tag that disagrees. Which leaves one
   manual step per release, and this exists so that step cannot be a typo:

       node tools/version/version.js            # print the current version
       node tools/version/version.js 1.2.0      # set it, everywhere it appears

   Then commit, tag `v1.2.0`, and publish the release. The workflow compares
   the two and fails loudly if they ever drift.

   `dev` is the state of every build that is not a release: the account screen
   shows nothing rather than link to a tag nobody created.

   The same tool, file for file, lives in codeschool-ing.github.io. Both
   repositories version themselves the same way on purpose — the answer to
   "what is deployed?" should not depend on which one is being asked about.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

/* Every place the version is written. One entry today; the list exists because
   a second one is how this drifts, and adding it here is then the whole job. */
const FILES = [
  {
    file: 'index.html',
    // The `content` of <meta name="version">, and nothing else on the line.
    find: /(<meta\s+name="version"\s+content=")([^"]*)(")/,
  },
];

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][\w.]+)?$/;

function read() {
  const found = new Map();
  for (const { file, find } of FILES) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const m = find.exec(src);
    if (!m) fail(`${file}: no version found — the pattern in this tool no longer matches`);
    found.set(file, m[2]);
  }
  /* Disagreement between two places that both claim to hold the version is
     worse than either value, because nothing says which one shipped. */
  const values = [...new Set(found.values())];
  if (values.length > 1) {
    fail('the files disagree about the version:\n  ' +
      [...found].map(([f, v]) => `${f}: ${v}`).join('\n  '));
  }
  return values[0];
}

function write(version) {
  if (version !== 'dev' && !SEMVER.test(version)) {
    fail(`"${version}" is not a semantic version. Expected MAJOR.MINOR.PATCH, or "dev".`);
  }
  for (const { file, find } of FILES) {
    const full = path.join(ROOT, file);
    const src = fs.readFileSync(full, 'utf8');
    fs.writeFileSync(full, src.replace(find, (_, a, __, c) => a + version + c));
    console.error(`  ${file}`);
  }
  console.error(`version set to ${version}`);
}

function fail(message) {
  console.error('version: ' + message);
  process.exit(1);
}

const arg = process.argv[2];
if (arg === undefined) {
  process.stdout.write(read() + '\n');
} else if (arg === '--check') {
  // What the workflow calls: prints the version and exits non-zero if the
  // files ever stop agreeing with each other.
  process.stdout.write(read() + '\n');
} else {
  write(arg.replace(/^v/, ''));
}
