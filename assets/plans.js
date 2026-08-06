/* ==========================================================================
   Plans.

   DELIBERATE FICTION, WITH THE RIGHT SHAPE. There is no billing in this
   repository and there will not be: price, cycle, coupon and invoice belong to a
   payment service, and the portal only needs to know what the student subscribed
   to and what that entitles them to. What is here is the SHAPE of that record —
   it is what Stage 2 will fill in with real data.

   THE PORTAL LOCKS NOTHING BY PLAN, TODAY. The plan screen shows what each one
   includes, but no course, exam or certificate is blocked. Blocking is a business
   decision and requires a server: with the state in localStorage, any lock would
   be theatre — you would only have to edit a key. Better not to pretend.

   `includes` is a list of KEYS, not of sentences: they are what the server will
   authorise by, and the sentence the student reads comes from `FEATURES`. Two
   lists of text diverge the day one of them changes.
   ========================================================================== */

window.FEATURES = {
  catalog: 'The whole catalog: 86 courses and 16 tracks',
  track: 'A guided track with a progress map',
  exercises: 'Exercises and assessments for every lesson',
  exams: 'Final course and track exams',
  certificate: 'Course and track certificates',
  material: 'Supporting material to download',
  offline: 'Lessons to watch offline',
  mentoring: 'Group mentoring, every week',
  forum: 'A forum answered by instructors',
  reports: 'Class reports and export',
  invoicing: 'Invoicing and billing by company registration',
};

window.PLANS = [
  {
    id: 'student',
    name: 'Student',
    summary: 'To try the whole school before deciding.',
    price: 0,
    cycle: 'forever',
    includes: ['catalog', 'track', 'exercises'],
  },
  {
    id: 'pro',
    name: 'Pro',
    summary: 'The plan for someone studying to work with this.',
    price: 49,
    cycle: 'per month',
    featured: true,
    includes: ['catalog', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline', 'forum'],
  },
  {
    id: 'team',
    name: 'Team',
    summary: 'For teams and schools, with class tracking.',
    price: 39,
    cycle: 'per student/month',
    includes: ['catalog', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline',
      'forum', 'mentoring', 'reports', 'invoicing'],
  },
];
