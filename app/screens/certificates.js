/* ==========================================================================
   Certificates.

   TWO UNITS NOW, NOT ONE. There used to be only a COURSE certificate, because a
   course was the only unit the portal measured. With the track exam there is a
   second: whoever finishes the courses on the path and passes the track's final
   exam takes home a certificate for the whole track.

   That partly answers — and only partly — the question the vitrine's README left
   open about the "intermediate unit". The track is the BIG unit; the real
   question is whether something exists between a 40-hour course and a 400-hour
   track. It stays open, and it stays cheap while no certificate has been issued
   to a real student.

   THE CERTIFICATE NOW REQUIRES THE EXAM. Completing every section says the
   person WENT THROUGH the material — and since moving on is completing, going
   through is nearly automatic. A certificate that comes from going through
   asserts nothing about whoever receives it. The exam is what makes the document
   mean something; without it, it was not worth issuing.

   THE EXAMPLES EXIST TO SHOW WHAT IS COMING. They are marked as examples in the
   markup, in the text and in the appearance — a fake certificate that looks like
   a real one is a problem, not a preview. They disappear as soon as the student
   has the real certificate of that kind.

   THE CODE IS THE SERVER'S, AND THIS SCREEN NO LONGER INVENTS ONE. There used
   to be a `code(seed)` here that hashed the course id and the student's name
   into something shaped like `CS-XXXX-XXXX-XXXX`. It was the right placeholder
   while nothing issued one — deterministic, so it did not change between visits
   — and it became the wrong thing to keep the moment `GET /api/certificates`
   started answering: two codes for one document, and the one the student can
   see and copy is the one that resolves to "no certificate under this code".

   So a certificate is issued or it is not, and the screen says which:

     with a backend  the document is the server's row, whole — code, holder,
                     title and date. It is a SNAPSHOT of the moment the exam was
                     passed, so a course that gets retitled does not silently
                     rewrite a document already on a profile, and this screen
                     renders the snapshot rather than the catalogue for exactly
                     that reason.
     without one     nothing has been issued, by anybody. What was earned in
                     this browser is still shown — it is true, and it is what
                     the bundle off a disk has to show — but with no number on
                     it and with no way to publish it as a credential.
   ========================================================================== */

import { trackPath, courseById, hoursOf } from '../catalog.js';
import { courseDone, activeOption, examPassed, examResult, now } from '../state.js';
import { studentTrack } from './common.js';
import { openModal } from '../modal.js';
import { downloadCertificatePNG } from '../certificate-png.js';
import { esc } from '../text.js';
import * as api from '../api.js';

const DATE = (d) => new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(d);

/* THE CERTIFICATE IS NO LONGER A TERMINAL WINDOW.

   It was born reusing the vitrine's `.term-bar` — the three dots and the file
   name — which is the right frame for a code panel and the wrong one for this. A
   certificate is the only artefact of the portal that leaves here: it goes to a
   profile, an e-mail attachment, a job application. It has to look like a
   document, and no document has a window bar on top.

   The shape now is a diploma's: the issuer at the top, "certifies that", the
   recipient's name in large type, what was completed, and a footer with the date
   and the code. The identity is still the school's — the same typography, the
   same phosphor, the brand's LED — but applied to a document instead of to a
   window.

   `example` changes three things at once — the frame, the seal and the code text
   — and that is deliberate: whoever glances, whoever reads the label and whoever
   goes to check the number all get the same information.

   THE FOOTER HAS THREE STATES AND NOT TWO, because "issued" is now a fact about
   the server rather than about this browser:

     a code            the server issued this document, and typing that number
                       into the public page finds it
     "no code has      nothing was issued — no backend is configured, so there
      been issued"     is no school to issue it. Said plainly rather than
                       filled with a plausible-looking number, because a number
                       that resolves to nothing is worse than a blank: it is
                       the one a student would put on a CV.
     "sample — no      the same sentence with the label in front, which is what
      code…"           it already said

   `revoked` marks a document the server withdrew. It is shown rather than
   hidden: the URL is already on somebody's profile answering "revoked", and a
   portal that quietly dropped the card would leave the holder the last to
   know. */
function card({ label, name, meta, who, when, key, sample, grade, code, revoked, issuedISO }) {
  /* The whole certificate is a button. There is no "view larger" beside it: the
     target the person wants to click is the document, and a smaller control next
     to it would be a worse target for the same intention. */
  return '<article class="cert' + (sample ? ' cert-sample' : '') +
      (revoked ? ' cert-void' : '') + '" ' +
      'tabindex="0" role="button" data-cert="' + esc(key) + '" ' +
      (code ? 'data-code="' + esc(code) + '" ' : '') +
      (issuedISO ? 'data-issued="' + esc(issuedISO) + '" ' : '') +
      (revoked ? 'data-revoked="true" ' : '') +
      'aria-label="' + txt('View the certificate at full size') + '">' +
    '<div class="cert-sheet">' +
      '<header class="cert-top">' +
        '<span class="cert-brand"><span class="cert-led" aria-hidden="true"></span>codeschool<b>.ing</b></span>' +
        (sample
          ? '<span class="cert-seal">' + txt('sample') + '</span>'
          : revoked
            ? '<span class="cert-seal cert-seal-void">' + txt('revoked') + '</span>'
            : '<span class="cert-type">' + txt(label) + '</span>') +
      '</header>' +

      '<div class="cert-body">' +
        '<span class="cert-line">' + txt('certifies that') + '</span>' +
        '<p class="cert-student">' + esc(who) + '</p>' +
        '<span class="cert-line">' +
          txt(label === 'track completed' ? 'completed the track' : 'completed the course') + '</span>' +
        '<h2 class="cert-course">' + esc(name) + '</h2>' +
        '<p class="cert-meta">' + esc(meta) + (grade ? ' · ' + esc(grade) : '') + '</p>' +
      '</div>' +

      '<footer class="cert-foot">' +
        '<span>' + esc(when) + '</span>' +
        '<span class="cert-code">' +
          (sample
            ? txt('sample — no code has been issued')
            : code ? esc(code) : txt('no code has been issued')) +
        '</span>' +
      '</footer>' +
    '</div>' +
  '</article>';
}

/* ---------- sharing on LinkedIn ----------

   Two endpoints, and they do different things:

     share-offsite  publishes a POST with the certificate's link
     profile/add    opens the profile's "licences and certifications" form
                    ALREADY FILLED IN — name, institution, date and code

   The second is what people actually want: a certificate on a profile is a
   credential, not a post that vanishes from the feed in two days.

   The `certUrl` used to point at a validation page that did not exist yet, in
   the format it would have. It exists now, and the format was right — what was
   wrong was the HOST. It was hard-coded to `codeschool.ing`, and the page is
   served by the API, which may be `api.codeschool.ing`: the same site, and a
   different origin. So the URL is built from where the backend is, and with no
   backend it is the empty string — which is the same fact these buttons already
   knew how to say, since with no backend nothing has been issued to link to. */
const LINKEDIN = 'https://www.linkedin.com';
const validationUrl = (c) => api.certificateUrl(c);

/* Icon only, like the LinkedIn one beside it: the arrow says "save this", and
   a caption would say it again in the width of the whole bar. */
const pngButton = () =>
  '<button type="button" class="cert-in cert-png" ' +
    'title="' + txt('Download as PNG') + '" ' +
    'aria-label="' + txt('Download as PNG') + '">' + ICON_PNG + '</button>';

function linkedInButtons({ name, code: certCode, when }) {
  const d = new Date(when || Date.now());
  const q = (o) => Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');

  const profile = LINKEDIN + '/profile/add?' + q({
    startTask: 'CERTIFICATION_NAME',
    name,
    organizationName: 'codeschool.ing',
    issueYear: d.getFullYear(),
    issueMonth: d.getMonth() + 1,
    certId: certCode,
    certUrl: validationUrl(certCode),
  });
  const post = LINKEDIN + '/sharing/share-offsite/?' + q({ url: validationUrl(certCode) });

  /* Both buttons open LinkedIn, and that is exactly why the credential one
     carries its label. As a bare icon beside "Share" it read as a second way to
     share — the two were told apart only by a `title` nobody hovers on a phone.
     They do different things: this one adds the certificate to the profile as a
     licence, the other posts a link to the feed. The mark keeps the brand blue
     so it still reads as LinkedIn at a glance; the words carry the difference. */
  return '<a class="btn btn-ghost cert-add" href="' + esc(profile) + '" target="_blank" rel="noopener" ' +
      'title="' + txt('Add to LinkedIn profile') + '">' + ICON_LINKEDIN + txt('Add to LinkedIn profile') + '</a>' +
    '<a class="btn btn-ghost cert-share" href="' + esc(post) + '" target="_blank" rel="noopener">' +
      txt('Share') + '</a>';
}

/* An arrow into a tray: the same drawing the material list uses for a
   download, so the two mean the same thing in two places. */
const ICON_PNG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3v11m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>';

const ICON_LINKEDIN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21H9z"/></svg>';

/* One issued document, drawn from the SERVER's row.

   Everything the document asserts comes from the row and not from the
   catalogue: the holder's name, the title and the workload are a snapshot taken
   when the exam was passed, and reading them off the catalogue instead would
   undo the only thing a snapshot is for.

   That includes the language. The title is English here even when the interface
   is not, because the public validation page is English and the number in the
   footer is an invitation to go and compare the two. A document whose title
   disagrees with its own validation page is the failure this screen was fixed
   to stop making.

   What the catalogue is still allowed to supply is what the certificate does
   not carry and does not assert: the course's level, which track it sat in, and
   the mark — decoration around the claim rather than the claim. */
function fromServer(cert, { track, onPath }) {
  const isTrack = cert.scope === 'track';
  const course = isTrack ? null : courseById(cert.scopeId);
  const result = examResult(cert.scope + ':' + cert.scopeId);

  /* The server leaves a track's hours out on purpose: the workload depends on
     the path taken through the forks, and it does not read the path. This
     browser does — it is the student's own enrolment — so filling it in here is
     reading a fact rather than guessing at one, and it stays blank for a track
     that is not the one they are on. */
  const mine = isTrack && track && track.id === cert.scopeId;
  const meta = isTrack
    ? (mine ? onPath.length + ' ' + txt('courses') + ' · ' + hoursOf(onPath) + 'h' : '')
    : [
      cert.hours != null ? cert.hours + 'h' : '',
      course ? txt(course.level) : '',
      course && onPath.includes(cert.scopeId) && track ? track.name : '',
    ].filter(Boolean).join(' · ');

  return card({
    label: isTrack ? 'track completed' : 'course completed',
    name: cert.title,
    meta: meta,
    who: cert.holderName,
    when: DATE(new Date(cert.issuedAt)),
    key: cert.scope + '.' + cert.scopeId,
    code: cert.code,
    issuedISO: cert.issuedAt,
    revoked: Boolean(cert.revokedAt),
    grade: result
      ? txt(isTrack ? 'track exam:' : 'final exam:') + ' ' + result.best + '%'
      : '',
  });
}

export default async function certificates() {
  const el = document.createElement('div');
  el.className = 'view screen-certificates';

  const who = now().session?.name || 'Student';
  const today = DATE(new Date());
  const t = studentTrack();
  const onPath = t ? trackPath(t, activeOption) : [];

  /* Course completed AND exam passed. Both conditions, and in this order,
     because that is how the screen explains what is missing when something is. */
  const done = COURSES.filter((c) => courseDone(c.id) && examPassed('course:' + c.id));
  const almostDone = COURSES.filter((c) => courseDone(c.id) && !examPassed('course:' + c.id));

  const trackReady = Boolean(t)
    && onPath.length > 0
    && onPath.every((id) => courseDone(id))
    && examPassed('track:' + t.id);

  /* THE LIST IS THE SERVER'S WHEN THERE IS ONE, and it is not the same list
     this browser would compute. `GET /api/certificates` mints whatever a passed
     exam owes and has not been asked for yet, so asking is what issues them —
     and asking twice is a read, because issuing conflicts on the holder and the
     scope and does nothing.

     A failure is reported rather than fallen back from. Falling back to the
     local derivation would draw the certificates the student has, minus the
     codes, minus any revocation — a screen that looks right and is quietly a
     version behind. */
  const fromServerList = api.certificatesOnServer();
  let rows = [];
  let unreachable = false;
  if (fromServerList) {
    try {
      rows = await api.certificates();
    } catch {
      unreachable = true;
    }
  }

  /* Tracks first and then most recent, in both modes. The server orders by date
     alone, which is a fine rule and a different one — and two modes that order
     the same screen differently is a difference nobody asked for. */
  rows.sort((a, b) => (a.scope === b.scope
    ? new Date(b.issuedAt) - new Date(a.issuedAt)
    : (a.scope === 'track' ? -1 : 1)));

  const hasCourseCert = fromServerList ? rows.some((c) => c.scope === 'course') : done.length > 0;
  const hasTrackCert = fromServerList ? rows.some((c) => c.scope === 'track') : trackReady;

  /* With no backend nothing has been issued, and the cards say so by carrying no
     code. They are still drawn: the student did complete the course and did pass
     the exam in this browser, and the single-file bundle off a disk has nothing
     else to show. What they cannot do is claim a number. */
  const earnedHere =
    (trackReady
      ? card({
        label: 'track completed',
        name: t.name,
        meta: onPath.length + ' ' + txt('courses') + ' · ' + hoursOf(onPath) + 'h',
        who: who,
        when: today,
        key: 'track.' + t.id,
        grade: txt('track exam:') + ' ' + examResult('track:' + t.id).best + '%',
      })
      : '') +
    done.map((c) => card({
      label: 'course completed',
      name: c.name,
      meta: c.hours + 'h · ' + txt(c.level) + (onPath.includes(c.id) && t ? ' · ' + t.name : ''),
      who: who,
      when: today,
      key: c.id,
      grade: txt('final exam:') + ' ' + examResult('course:' + c.id).best + '%',
    })).join('');

  const issued = fromServerList
    ? rows.map((c) => fromServer(c, { track: t, onPath: onPath })).join('')
    : earnedHere;

  /* The examples: one of each kind the student does not have yet. Someone who
     already has the course certificate does not need to see what one would look
     like.

     The data comes from the CATALOGUE — the first course of their track, their
     track — and not from invented names. That way the example is already in the
     right language (the catalogue is translated at runtime) and shows the
     certificate they will actually earn, not a generic one. */
  const model = courseById(onPath[0]) || COURSES[0];
  const examples =
    (hasCourseCert ? '' : card({
      label: 'course completed',
      name: model.name,
      meta: model.hours + 'h · ' + txt(model.level) + (t ? ' · ' + t.name : ''),
      who: who,
      when: today,
      key: 'example.course',
      sample: true,
      grade: txt('final exam:') + ' 90%',
    })) +
    (hasTrackCert ? '' : card({
      label: 'track completed',
      name: t ? t.name : TRACKS[0].name,
      meta: (onPath.length || 10) + ' ' + txt('courses') + ' · ' +
        (onPath.reduce((s, id) => s + (courseById(id)?.hours || 0), 0) || 380) + 'h',
      who: who,
      when: today,
      key: 'example.track',
      sample: true,
      grade: txt('track exam:') + ' 84%',
    }));

  el.innerHTML =
    '<header class="view-head">' +
      '<h1>' + txt('Your certificates') + '</h1>' +
      '<p>' + txt('One per course completed with a passed exam, and one per whole track.') + '</p>' +
    '</header>' +

    /* Said out loud rather than swallowed. The certificates are the server's
       now, so a request that did not arrive is a screen that knows nothing —
       and an empty screen with no explanation reads as "you have none". */
    (unreachable
      ? '<p class="cert-offline">' +
          txt('Your certificates could not be loaded — the server did not answer.') +
        '</p>'
      : '') +

    (issued ? '<div class="certs">' + issued + '</div>' : '') +

    (almostDone.length
      ? '<section class="block">' +
          '<div class="block-top"><h2>' + txt('Only the exam is left') + '</h2></div>' +
          '<ul class="cert-missing">' +
            almostDone.map((c) => '<li>' +
              '<span>' + esc(c.name) + ' — ' + txt('content completed') + '</span>' +
              '<a class="btn btn-primary" href="#/course/' + esc(c.id) + '/exam">' +
                txt('Take the exam') + ' →</a>' +
            '</li>').join('') +
          '</ul>' +
        '</section>'
      : '') +

    (examples
      ? '<section class="cert-preview">' +
          '<div class="block-top">' +
            '<h2>' + txt('What yours will look like') + '</h2>' +
            '<span class="mono dim">' + txt('samples — they do not count as a certificate') + '</span>' +
          '</div>' +
          '<div class="certs">' + examples + '</div>' +
        '</section>'
      : '');

  /* One listener on the whole screen, and not one per card: the cards are rebuilt
     on every render, and a listener per card leaks on every rebuild. */
  const open = (art) => {
    const isExample = art.classList.contains('cert-sample');
    const certCode = art.dataset.code || '';
    const revoked = art.dataset.revoked === 'true';
    const certName = art.querySelector('.cert-course')?.textContent || '';

    /* THE TWO BUTTONS ARE GOVERNED BY DIFFERENT FACTS, and that is new.

       They used to move together, because there was only one question — is this
       an example? Now there are three states and the buttons disagree about the
       middle one:

         a sample            neither. It is a certificate nobody earned.
         earned, no code     the picture, yes; the credential, no. With no
                             backend nothing was ISSUED, and `profile/add` posts
                             a credential naming an issuer — there is no issuer.
                             The PNG carries "no code has been issued" in its own
                             footer, so the file says what it is wherever it
                             goes, which is the thing a sample's PNG could not do.
         earned and issued   both.
         revoked             neither. The public page already answers "revoked";
                             a picture of it and a profile entry pointing at it
                             would both be claims the school has withdrawn.

       Disabled with a reason, never hidden: hiding a control makes people think
       the feature does not exist, and the reason is the only version of the
       three that does not lie. */
    const canDownload = !isExample && !revoked;
    const canPublish = Boolean(certCode) && !isExample && !revoked;

    const off = (icon, why, extra) =>
      '<span class="cert-in ' + (extra || '') + ' cert-in-off" aria-disabled="true" ' +
        'title="' + why + '" aria-label="' + why + '">' + icon + '</span>';

    const noDownload = revoked
      ? txt('this certificate was revoked')
      : txt('sample — there is nothing to download');
    const noPublish = revoked
      ? txt('this certificate was revoked')
      : isExample
        ? txt('sample — there is no certificate to add')
        : txt('no code has been issued, so there is nothing to check');

    openModal(art.outerHTML, {
      className: 'modal-cert',
      label: txt('Certificate') + ' — ' + certName,
      actions:
        (canDownload ? pngButton() : off(ICON_PNG, noDownload, 'cert-png')) +
        (canPublish
          ? linkedInButtons({ name: certName, code: certCode, when: art.dataset.issued })
          : off(ICON_LINKEDIN, noPublish)),
    });

    if (!canDownload) return;
    const modal = document.querySelector('.modal-cert');
    modal?.querySelector('.cert-png')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      // The card inside the modal, not the one in the grid: it is the same
      // markup, and reading the visible one keeps the file and the preview
      // from ever disagreeing.
      const ok = await downloadCertificatePNG(modal.querySelector('.cert'));
      btn.disabled = false;
      if (!ok) {
        btn.title = txt('this browser cannot generate the image');
        btn.setAttribute('aria-label', txt('this browser cannot generate the image'));
      }
    });
  };

  el.addEventListener('click', (e) => {
    const art = e.target.closest('.cert');
    if (art) open(art);
  });
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const art = e.target.closest('.cert');
    if (!art) return;
    e.preventDefault();
    open(art);
  });

  return { title: txt('Certificates'), el };
}
