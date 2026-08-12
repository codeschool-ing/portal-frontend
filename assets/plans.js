/* ==========================================================================
   Plans.

   THE MODEL, IN ONE LINE: the first course of every track is free, and
   everything else is one product sold at two commitments.

   WHY THERE IS NO TIER LADDER. The obvious shape is three columns with more
   features in each, and it was tried here — the third carried group mentoring
   and an instructor-answered forum. Neither can exist: the school is
   self-service and has nobody to hold a session or answer a thread. Once the
   promises of staff are removed, what is left is a single product. So the
   monthly and the annual plan include exactly the same keys, and the table's
   two paid columns are deliberately identical: what differs is how long you
   commit, not what you get.

   The other tempting axis — one track versus all of them — does not survive a
   school with no staff. Whoever buys one track will want to switch; letting
   them switch freely makes it the whole catalogue with extra steps, and
   refusing needs somebody to appeal to.

   WHY FREE IS AN ENTRY COURSE AND NOT A TRIAL WEEK. A track's median is twelve
   courses and around 720 hours — over a year of study. Seven days measures
   nothing against that. One finished course does: the student sees the method,
   and sees the map with the rest of the track ahead of them, which is the
   moment this product has to convert.

   DELIBERATE FICTION, WITH THE RIGHT SHAPE. There is no billing in this
   repository: price, cycle, coupon and invoice belong to a payment service, and
   the portal only needs to know what the student subscribed to and what that
   entitles them to. What is here is the SHAPE of that record.

   THE PORTAL LOCKS NOTHING BY PLAN, TODAY — but that is now a decision rather
   than an impossibility. While the state lived in localStorage any lock was
   theatre, since you only had to edit a key. There is a server now, so the
   entry-course rule is enforceable; until it is enforced there, nothing on this
   side should pretend it already is.

   `includes` is a list of KEYS, not of sentences: they are what the server will
   authorise by, and the sentence the student reads comes from `FEATURES`. Two
   lists of text diverge the day one of them changes.

   THE IDS ARE STORED DATA. `subscriptions.plan_id` in portal-backend holds these
   strings, and `student` is that service's default for an account with no
   subscription of its own. Renaming one orphans every row carrying it — which is
   why the free plan is still `student` and the monthly one still `pro`, whatever
   they are called on screen.
   ========================================================================== */

window.FEATURES = {
  entry: 'The first course of every track, in full',
  catalog: 'All 86 courses and 16 tracks',
  track: 'A guided track with a progress map',
  exercises: 'Exercises that mark themselves, in every lesson',
  exams: 'Final course and track exams',
  certificate: 'Course and track certificates, with a validation code',
  material: 'Supporting material to download',
  offline: 'Lessons to watch offline',
};

window.PLANS = [
  {
    id: 'student',
    name: 'Free',
    summary: 'The first course of every track, to see how the school works.',
    price: 0,
    cycle: 'forever',
    includes: ['entry', 'track', 'exercises'],
  },
  {
    id: 'pro',
    name: 'Monthly',
    summary: 'The whole school, month by month.',
    price: 49,
    cycle: 'per month',
    featured: true,
    includes: ['entry', 'catalog', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline'],
  },
  {
    id: 'annual',
    name: 'Annual',
    summary: 'The same, paid once a year — two months cheaper.',
    price: 490,
    cycle: 'per year',
    includes: ['entry', 'catalog', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline'],
  },
];
