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
   ========================================================================== */

import { trackPath, courseById } from '../catalog.js';
import { courseDone, activeOption, examPassed, examResult, now } from '../state.js';
import { studentTrack } from './common.js';
import { openModal } from '../modal.js';
import { esc } from '../text.js';

const DATE = (d) => new Intl.DateTimeFormat(document.documentElement.lang || 'pt-BR', {
  day: '2-digit', month: 'long', year: 'numeric',
}).format(d);

/* A code that looks like a code. Deterministic, so it does not change between
   visits — a validation number that changes on its own is worse than none.
   FUTURE: the server issues it, and then it becomes genuinely verifiable. */
function code(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  const block = (n) => (n >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
  return 'CS-' + block(h) + '-' + block(h >>> 7) + '-' + block(h >>> 13);
}

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
   goes to check the number all get the same information. */
function card({ label, name, meta, who, when, key, sample, grade }) {
  /* The whole certificate is a button. There is no "view larger" beside it: the
     target the person wants to click is the document, and a smaller control next
     to it would be a worse target for the same intention. */
  return '<article class="cert' + (sample ? ' cert-sample' : '') + '" ' +
      'tabindex="0" role="button" data-cert="' + esc(key) + '" ' +
      'aria-label="' + txt('View the certificate at full size') + '">' +
    '<div class="cert-sheet">' +
      '<header class="cert-top">' +
        '<span class="cert-brand"><span class="cert-led" aria-hidden="true"></span>codeschool<b>.ing</b></span>' +
        (sample
          ? '<span class="cert-seal">' + txt('sample') + '</span>'
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
          (sample ? txt('sample — no code has been issued') : code(key + who)) +
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

   The `certUrl` points at a validation page that DOES NOT EXIST YET — it is born
   with the server, in Stage 2. The URL is built in its final format on purpose:
   it is the shape that has to be right now, because the day the server exists
   cannot be the day we find out the format was something else. And the button
   says so, instead of pretending. */
const LINKEDIN = 'https://www.linkedin.com';
const validationUrl = (c) => 'https://codeschool.ing/certificate/' + encodeURIComponent(c);

function linkedInButtons({ name, code: certCode, when }) {
  const d = new Date(when);
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

  /* Icon only. The LinkedIn mark is recognised without a caption, and the label
     took up half the action bar to say what the drawing already says. The text
     did not disappear — it lives in the `aria-label` and the `title`, which is
     what a screen reader announces and what the cursor shows. */
  return '<a class="cert-in" href="' + esc(profile) + '" target="_blank" rel="noopener" ' +
      'title="' + txt('Add to LinkedIn profile') + '" ' +
      'aria-label="' + txt('Add to LinkedIn profile') + '">' + ICON_LINKEDIN + '</a>' +
    '<a class="btn btn-ghost cert-share" href="' + esc(post) + '" target="_blank" rel="noopener">' +
      txt('Share') + '</a>';
}

const ICON_LINKEDIN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.07-1.9-3.07-1.9 0-2.2 1.46-2.2 2.97V21H9z"/></svg>';

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

  const issued =
    (trackReady
      ? card({
        label: 'track completed',
        name: t.name,
        meta: onPath.length + ' ' + txt('courses') + ' · ' +
          onPath.reduce((s, id) => s + (courseById(id)?.hours || 0), 0) + 'h',
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

  /* The examples: one of each kind the student does not have yet. Someone who
     already has the course certificate does not need to see what one would look
     like.

     The data comes from the CATALOGUE — the first course of their track, their
     track — and not from invented names. That way the example is already in the
     right language (the catalogue is translated at runtime) and shows the
     certificate they will actually earn, not a generic one. */
  const model = courseById(onPath[0]) || COURSES[0];
  const examples =
    (done.length ? '' : card({
      label: 'course completed',
      name: model.name,
      meta: model.hours + 'h · ' + txt(model.level) + (t ? ' · ' + t.name : ''),
      who: who,
      when: today,
      key: 'example.course',
      sample: true,
      grade: txt('final exam:') + ' 90%',
    })) +
    (trackReady ? '' : card({
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
    const key = art.dataset.cert;
    const certName = art.querySelector('.cert-course')?.textContent || '';
    /* The LinkedIn button exists in BOTH cases, next to the close button. On an
       example it comes disabled, and the reason is in the `title`: hiding the
       button would make people think the feature does not exist, and showing it
       working would publish a credential nobody earned. Disabled with a reason is
       the only one of the three that does not lie. */
    openModal(art.outerHTML, {
      className: 'modal-cert',
      label: txt('Certificate') + ' — ' + certName,
      actions: isExample
        ? '<span class="cert-in cert-in-off" aria-disabled="true" ' +
            'title="' + txt('sample — there is no certificate to add') + '" ' +
            'aria-label="' + txt('sample — there is no certificate to add') + '">' +
            ICON_LINKEDIN + '</span>'
        : linkedInButtons({ name: certName, code: code(key + who), when: new Date().toISOString() }),
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
