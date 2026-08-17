/* ==========================================================================
   Plans.

   THE MODEL, IN ONE LINE: the first course of every track is free, and
   everything else is one yearly subscription.

   WHY THERE IS NO TIER LADDER, AND NO MONTHLY. The obvious shape is three
   columns with more features in each, and it was tried here — the third carried
   group mentoring and an instructor-answered forum. Neither can exist: the
   school is self-service and has nobody to hold a session or answer a thread.
   Once the promises of staff are removed, what is left is one product.

   The monthly option went for a different reason. A track's median is twelve
   courses and around 720 hours — over a year of study — so billing it monthly
   creates fourteen separate opportunities to cancel something the student has
   not finished. One yearly commitment matches the length of the thing being
   bought. It is sold in instalments so the ticket is not a barrier: the student
   pays month by month, the school is committed to for a year.

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

   THE IDS ARE STORED DATA, AND THEY MATCH THE NAMES ON PURPOSE. `guest` is the
   free plan and `student` the paid one, exactly as they read on screen. That
   cost a rename in two places — migration 0013 in portal-backend and the
   PLANS_MOVED map in app/state.js — and it was worth paying: `student` used to
   be the id of the FREE plan, so once the paid plan took that NAME, any id that
   disagreed would have meant the opposite of what a reader expects, forever.
   ========================================================================== */

window.FEATURES = {
  entry: 'The first course of every track, in full',
  catalog: 'All {courses} courses and {tracks} tracks',
  track: 'A guided track with a progress map',
  exercises: 'Exercises that mark themselves, in every lesson',
  exams: 'Final course and track exams',
  certificate: 'Course and track certificates, with a validation code',
  material: 'Supporting material to download',
  offline: 'Lessons to watch offline',
};

window.PLANS = [
  {
    id: 'guest',
    name: 'Guest',
    summary: 'The first course of every track, to see how the school works.',
    price: 0,
    cycle: 'forever',
    includes: ['entry', 'track', 'exercises'],
  },
  {
    id: 'student',
    name: 'Student',
    summary: 'The whole school, for a year.',
    price: 490,
    cycle: 'per year',
    featured: true,
    includes: ['entry', 'catalog', 'track', 'exercises', 'exams', 'certificate', 'material', 'offline'],
  },
];
