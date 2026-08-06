/* ==========================================================================
   `web-fundamentals` exercises — one file per course, as the pipeline does.

   The pipeline emits `exercises-<course>.json`. Here the extension is `.js`
   because the portal has no server yet to fetch JSON from (and a `fetch` from
   `file://` is blocked, which would break the single-file bundle), but the
   content of each object is exactly what the tool produces.

   SIX OF THE SEVEN TYPES, AND THAT IS NOT AN OVERSIGHT
   `code` does not appear here, and the reason is a rule of the generator: an
   exercise from topic N may only require what topics 1..N taught.
   `web-fundamentals` teaches no language — it is the school's first course, with
   no prerequisite — so asking for a program to be written would require what the
   course did not give. It is the same finding `RULES.md` recorded in
   `architect-communication`: in a course with no code, three of the seven types
   are inapplicable. Here only one is, because the last lesson covers the console.

   `expression-answer` genuinely fits in lesson 03: bandwidth, latency and
   throughput are an algebraic relation, and the CAS checks the equivalence
   without demanding a particular form.

   The Portuguese is in assets/exercises-pt.js; what decides an answer is not
   translated.

   STATUS: sample content, technically correct and with no pedagogical review. It
   did not go through the funnel — all of them are marked
   `_verification: 'structure'`, which is the weakest mark and is the truth about
   them.
   ========================================================================== */

window.SAMPLE_EXERCISES = (window.SAMPLE_EXERCISES || []).concat([

  /* ============================================================== lesson 01 */
  {
    id: 'wf-01-quiz',
    course: 'web-fundamentals',
    topic: 'Client, server and host: who asks and who answers',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'A web server needs to query a database in order to build its response. At that instant, what is it?',
    socraticHint: 'The roles describe the moment of the conversation, not the equipment. Who starts the conversation with the database?',
    choices: [
      {
        text: 'The database\'s client, because it is the one starting that request — and it is still a server in the conversation with the browser.',
        correct: true,
        why: 'The roles belong to the moment: the same machine can be a server in one conversation and a client in another, at the same time.',
      },
      {
        text: 'It stays purely a server, because a machine configured as a server cannot take on another role.',
        correct: false,
        why: 'The configuration decides which programs it runs, not which role it holds in each conversation.',
      },
      {
        text: 'It becomes an intermediate host, a category distinct from client and server.',
        correct: false,
        why: '`Host` is the neutral term for any machine with an address, not a third role in the conversation.',
      },
      {
        text: 'Neither, because the query happens inside the same local network and the roles do not apply.',
        correct: false,
        why: 'Distance changes nothing: whoever asks is the client, whether the other side is in the next rack or on another continent.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-01-assoc',
    course: 'web-fundamentals',
    topic: 'Client, server and host: who asks and who answers',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each term to what it describes. There are options left over in the right-hand column.',
    socraticHint: 'Two of these terms describe a role in a conversation; one describes the machine, regardless of what it is doing.',
    pairs: [
      { left: 'client', right: 'The one who starts the conversation and makes the request' },
      { left: 'server', right: 'The one who waits to be asked and returns the answer' },
      { left: 'host', right: 'Any machine with an address on the network' },
      { left: 'port', right: 'The number saying which program the data is meant for' },
    ],
    rightDistractors: [
      'The physical cable joining two neighbouring machines',
      'The program that translates domain names into addresses',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 02 */
  {
    id: 'wf-02-quiz',
    course: 'web-fundamentals',
    topic: 'Packet, frame and socket',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'During a transfer, the frame\'s destination MAC address changes several times, while the packet\'s destination IP address stays the same. Why?',
    socraticHint: 'One of the two addresses points at the end of the journey; the other points at its next leg.',
    choices: [
      {
        text: 'The MAC addresses the next hop and is rewritten at every leg; the IP addresses the final destination and crosses the whole journey.',
        correct: true,
        why: 'It is the difference between the address on the envelope and the plate of the truck carrying it right now.',
      },
      {
        text: 'The MAC changes because it is drawn at random for each transmission, to make tracking on the local network harder.',
        correct: false,
        why: 'The MAC is burned into the card. Some systems change it for privacy, but that is optional and does not happen per frame.',
      },
      {
        text: 'The IP stays because it is encrypted by TLS and cannot be rewritten by the routers.',
        correct: false,
        why: 'TLS encrypts the content, not the IP header — which has to stay readable precisely so the packet can be routed.',
      },
      {
        text: 'Both are rewritten, but the IP goes back to its original value before reaching the destination.',
        correct: false,
        why: 'The destination IP is not rewritten on the ordinary path; what does something similar is NAT, and only with the source address.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-02-assoc',
    course: 'web-fundamentals',
    topic: 'Packet, frame and socket',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each port to the service that usually listens on it. There are options left over in the right-hand column.',
    socraticHint: 'Two of them differ by one letter in the protocol name and by a layer of encryption.',
    pairs: [
      { left: '`80`', right: 'HTTP' },
      { left: '`443`', right: 'HTTPS' },
      { left: '`22`', right: 'SSH' },
      { left: '`5432`', right: 'PostgreSQL' },
    ],
    rightDistractors: ['DNS', 'SMTP'],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 03 */
  {
    id: 'wf-03-quiz',
    course: 'web-fundamentals',
    topic: 'Bandwidth, latency and throughput',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'A team complains that the video call with an office in Europe stutters. The provider offers to double the bandwidth. What should they expect?',
    socraticHint: 'Which of the three measures best explains a call that stutters? And which of them does a thicker pipe actually change?',
    choices: [
      {
        text: 'Little or no improvement, because the likely problem is latency — and that depends on distance, not on the bandwidth bought.',
        correct: true,
        why: 'A thicker pipe does not shorten the road: 150 ms stays 150 ms on any plan.',
      },
      {
        text: 'A proportional improvement: twice the bandwidth halves the travel time.',
        correct: false,
        why: 'Bandwidth and travel time are independent quantities; doubling one does not change the other.',
      },
      {
        text: 'A guaranteed improvement, because throughput always reaches the bandwidth that was bought.',
        correct: false,
        why: 'Throughput usually sits below the bandwidth — it is precisely the gap between the two that reveals the problem.',
      },
      {
        text: 'It will get worse, because more bandwidth increases congestion along the path.',
        correct: false,
        why: 'More capacity does not create congestion; it simply does not solve what is not a capacity problem.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-03-expr',
    course: 'web-fundamentals',
    topic: 'Bandwidth, latency and throughput',
    type: 'expression-answer',
    difficulty: 'medium',
    prompt: 'A file of `T` bits is transferred over a path with throughput `v` bits per second, and the connection takes `L` seconds to establish before the first bit leaves. Write the expression for the total time, in seconds.',
    socraticHint: 'There are two terms that add up: one does not depend on the size of the file and the other does. Which is which?',
    referenceExpression: 'L + T/v',
    variables: ['T:positive', 'v:positive', 'L:positive'],
    checkOrigin: 'L + T/v',
    checkOperation: 'simplify',
    checkVariable: 'T',
    _verification: 'structure',
  },

  /* ============================================================== lesson 04 */
  {
    id: 'wf-04-mult',
    course: 'web-fundamentals',
    topic: 'IP address, MAC address and ARP',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'Tick every true statement about IP and MAC addresses.',
    socraticHint: 'One of the two describes where the machine is; the other, which machine it is. Take the laptop to another network and see which of the two changes.',
    choices: [
      { text: 'The IP changes when the machine connects to another network.', correct: true, why: 'The IP describes a position, like a postal address.' },
      { text: 'The MAC travels with the equipment wherever it goes.', correct: true, why: 'The MAC is the card\'s identity, burned into it.' },
      { text: 'Ranges like `192.168.x.x` are reused inside every local network and do not exist on the internet.', correct: true, why: 'They are private ranges; the router translates to the public IP through NAT.' },
      { text: 'A website\'s server sees the MAC address of the laptop that visited it.', correct: false, why: 'A MAC only means anything on the local link: the server sees the MAC of the last router on its own path.' },
      { text: 'IPv6 exists to give more speed than IPv4.', correct: false, why: 'It exists because IPv4\'s 4.3 billion addresses ran out — it is a question of space, not of speed.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-04-quiz',
    course: 'web-fundamentals',
    topic: 'IP address, MAC address and ARP',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'On a public network, a machine answers ARP questions posing as the router and starts receiving its neighbours\' traffic. What makes this attack possible?',
    socraticHint: 'What does the protocol do when two machines answer the same question? Does it check anything before believing?',
    choices: [
      {
        text: 'ARP does not authenticate the answers: whoever answers is believed, and the answer sits in a cache for a few minutes.',
        correct: true,
        why: 'It is why HTTPS on a public network stops being a recommendation and becomes a necessity.',
      },
      {
        text: 'ARP transmits the answers unencrypted, so they can be read and altered in transit.',
        correct: false,
        why: 'Reading is not the problem here: the attack works because the forged answer is accepted, not because the true one was read.',
      },
      {
        text: 'The ARP cache never expires, so a forged answer is good for ever.',
        correct: false,
        why: 'The cache expires within minutes — the attacker has to repeat the answer, and that does not prevent the attack.',
      },
      {
        text: 'ARP uses IP addresses instead of MAC ones, and so cannot tell machines on the same network apart.',
        correct: false,
        why: 'ARP does exactly the bridging between the two: it asks by IP and receives a MAC.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 05 */
  {
    id: 'wf-05-ord',
    course: 'web-fundamentals',
    topic: 'Layered networks: from the cable to the browser',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the layers in the order the data crosses them on the way **out** of your browser towards the network, from the highest to the lowest.',
    socraticHint: 'Each layer wraps the one above. Which of them produces the content all the others are going to wrap?',
    items: [
      'Application: the browser builds the HTTP request',
      'Transport: the request is cut into segments and gets the ports',
      'Network: each segment becomes a packet and gets the IP addresses',
      'Link: each packet becomes a frame and gets the next hop\'s MAC',
    ],
    trap: 'The transport–network pair. Anyone who memorised "IP is the main one" tends to put the network layer before transport, as if the address came before the cutting into segments. It does not: transport is what decides the size of each piece and which program it belongs to, and only then does each piece get a destination address. Swapping the two would have the packet addressed before it exists.',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-05-quiz',
    course: 'web-fundamentals',
    topic: 'Layered networks: from the cable to the browser',
    type: 'quiz',
    difficulty: 'easy',
    prompt: 'A live video call uses UDP instead of TCP. What is the reasoning?',
    socraticHint: 'Ask what happens to a video frame that arrives half a second late. Is it still good for anything?',
    choices: [
      {
        text: 'In a live video, late data is already useless, and waiting for the resend would freeze the picture — better to lose the piece.',
        correct: true,
        why: 'The rule of thumb: if incomplete data is useless, TCP; if late data is useless, UDP.',
      },
      {
        text: 'UDP encrypts the content by default, and video calls require confidentiality.',
        correct: false,
        why: 'UDP encrypts nothing; a call\'s encryption comes from another layer.',
      },
      {
        text: 'TCP does not work with continuous data, only with files of known size.',
        correct: false,
        why: 'TCP carries a continuous stream without difficulty — it is what HTTP itself does.',
      },
      {
        text: 'UDP guarantees faster delivery because it acknowledges each packet with fewer bytes.',
        correct: false,
        why: 'UDP acknowledges nothing: it is the absence of acknowledgement that makes it cheap.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 06 */
  {
    id: 'wf-06-quiz',
    course: 'web-fundamentals',
    topic: 'HTTP and HTTPS: methods, headers and status codes',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'An application deleted records through `GET /delete?id=7` links. After the site was indexed, several records vanished with nobody having clicked anything. What explains it?',
    socraticHint: 'Who besides a person follows the links on a page? And what promise does the `GET` method make to whoever follows them?',
    choices: [
      {
        text: '`GET` promises to change nothing, so crawlers and prefetchers repeat it freely — and every visit carried out the deletion.',
        correct: true,
        why: 'The promise is not a formality: browsers, proxies and search engines rely on it.',
      },
      {
        text: 'The search engine sent `DELETE` to the addresses it found, following the REST convention.',
        correct: false,
        why: 'Crawlers only issue `GET`; none of them sends `DELETE` on its own initiative.',
      },
      {
        text: 'Indexing exposed the addresses, and people visited them manually.',
        correct: false,
        why: 'That may have happened too, but the cause that explains deletions with no click is the automatic repetition of the `GET`.',
      },
      {
        text: 'The `200` returned by the deletion made the search engine repeat the request to confirm.',
        correct: false,
        why: 'A `200` does not ask for a repeat; the crawler repeats because `GET` is declared safe, whatever the status.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-06-assoc',
    course: 'web-fundamentals',
    topic: 'HTTP and HTTPS: methods, headers and status codes',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each status code to what it communicates. There are options left over in the right-hand column.',
    socraticHint: 'Two of them talk about identity and permission, and the difference between them is whether the server already knows who you are.',
    pairs: [
      { left: '`301`', right: 'It has moved address for good' },
      { left: '`401`', right: 'I do not know who you are' },
      { left: '`403`', right: 'I know who you are, and you cannot' },
      { left: '`502`', right: 'The server behind answered badly' },
      { left: '`429`', right: 'You are asking too often' },
    ],
    rightDistractors: [
      'The content has not changed since last time',
      'The request is malformed and could not be interpreted',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-06-mult',
    course: 'web-fundamentals',
    topic: 'HTTP and HTTPS: methods, headers and status codes',
    type: 'multiple-choice',
    difficulty: 'hard',
    prompt: 'Tick everything TLS delivers on an HTTPS connection.',
    socraticHint: 'There are three guarantees, and one of them is what the padlock in the bar really stands for. Think too about what the network can still observe.',
    choices: [
      { text: 'Confidentiality: nobody along the path reads the content.', correct: true, why: 'It is the most remembered guarantee, and only one of the three.' },
      { text: 'Integrity: altering the content in transit gives itself away.', correct: true, why: 'Without it, encrypting would not be enough — you could corrupt without reading.' },
      { text: 'Authenticity: the certificate proves that server owns the domain.', correct: true, why: 'It is what the padlock stands for — "this really is the site whose name is in the bar", not "trustworthy site".' },
      { text: 'Anonymity: the network cannot discover which domain was visited.', correct: false, why: 'The domain name and the volume of data stay visible to the network.' },
      { text: 'Trustworthiness: the site was verified as reputable by an authority.', correct: false, why: 'The authority certifies ownership of the domain, not the honesty of whoever operates it.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 07 */
  {
    id: 'wf-07-quiz',
    course: 'web-fundamentals',
    topic: 'Cookies, sessions and browser cache',
    type: 'quiz',
    difficulty: 'hard',
    prompt: 'An application started running on two servers behind a load balancer. Users began getting "logged out" with no apparent pattern. What is the most likely cause?',
    socraticHint: 'The cookie carries only an identifier. Where is the data it identifies kept, and do both servers see the same place?',
    choices: [
      {
        text: 'The session is in each server\'s memory, so half the requests reach the one that does not have it.',
        correct: true,
        why: 'That is why a session in production lives somewhere shared — Redis, a database — or does not exist at all, and the state travels in a signed token.',
      },
      {
        text: 'The cookie expires faster when more than one server is answering.',
        correct: false,
        why: 'The cookie\'s lifetime is declared in the `Set-Cookie` and does not depend on how many servers exist.',
      },
      {
        text: 'The `SameSite` attribute blocks the cookie when the balancer switches servers.',
        correct: false,
        why: '`SameSite` deals with requests coming from another site; the domain here is still the same.',
      },
      {
        text: '`HttpOnly` stops the second server from reading the cookie.',
        correct: false,
        why: '`HttpOnly` stops the page\'s JavaScript from reading it; the server receives the cookie as normal.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-07-assoc',
    course: 'web-fundamentals',
    topic: 'Cookies, sessions and browser cache',
    type: 'matching',
    difficulty: 'medium',
    prompt: 'Match each directive or attribute to its effect. There are options left over in the right-hand column.',
    socraticHint: 'Three of them concern the cookie and one the cache. Two look like opposites and are not: one forbids keeping it, the other allows keeping it but demands confirmation.',
    pairs: [
      { left: '`HttpOnly`', right: 'The page\'s JavaScript cannot read the value' },
      { left: '`Secure`', right: 'The value is not sent outside HTTPS' },
      { left: '`no-cache`', right: 'You may keep it, but confirm before reusing it' },
      { left: '`no-store`', right: 'Do not keep it anywhere' },
    ],
    rightDistractors: [
      'Reuse it without asking for the stated period',
      'Encrypts the cookie value before writing it to disk',
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 08 */
  {
    id: 'wf-08-ord',
    course: 'web-fundamentals',
    topic: 'Domains: registration, DNS, propagation and subdomains',
    type: 'ordering',
    difficulty: 'hard',
    prompt: 'Put the steps of a server migration in order, so that no visitor lands on a dead address.',
    socraticHint: 'One of the steps has to happen well before the others for the rest to take effect quickly. Which of them depends on what the caches have already kept?',
    items: [
      'Lower the record\'s TTL to a few minutes, a day before the switch',
      'Bring the application up on the new server and confirm it answers on its IP',
      'Change the record to point at the new address',
      'Confirm that the traffic is reaching the new server',
      'Put the TTL back up to hours',
    ],
    trap: 'The lower-the-TTL–change-the-record pair. It is tempting to lower the TTL along with the change, or after it, to "speed up propagation". It does not work: the ceiling on the wait is the TTL that was already in force when the caches kept the old answer. Lowering it afterwards only affects the following queries, and the switch still takes the whole old TTL.',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-08-quiz',
    course: 'web-fundamentals',
    topic: 'Domains: registration, DNS, propagation and subdomains',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'You need to point `example.com`, without `www`, at a hosted service that only gives you a name (`app.provider.net`) and no IP. Why does a `CNAME` not solve it?',
    socraticHint: '`CNAME` has a restriction on its position in the domain. Where exactly can it not exist, and which records already occupy that place?',
    choices: [
      {
        text: 'A `CNAME` cannot exist at the domain root, which has to coexist with other records such as the `MX`.',
        correct: true,
        why: 'The way out is `A` with fixed IPs, or an `ALIAS`/`ANAME`, a non-standard extension some providers offer.',
      },
      {
        text: 'A `CNAME` only works for third-level subdomains or deeper.',
        correct: false,
        why: 'It works on any name that is not the root — `www.example.com` is second level and is accepted.',
      },
      {
        text: 'A `CNAME` requires the target to be in the same domain as the name pointing at it.',
        correct: false,
        why: 'The target can be any name, including one belonging to another organisation.',
      },
      {
        text: '`CNAME` was deprecated in favour of `ALIAS` and is no longer honoured by resolvers.',
        correct: false,
        why: 'It is still in full use; it is `ALIAS` that is the non-standard extension.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 09 */
  {
    id: 'wf-09-mult',
    course: 'web-fundamentals',
    topic: 'Hosting: shared, VPS, cloud and CDN',
    type: 'multiple-choice',
    difficulty: 'medium',
    prompt: 'A shop with steady traffic all year round is migrating away from shared hosting. Tick the statements that hold up.',
    socraticHint: 'Two of the options sell elasticity to someone with no variation to stretch. And remember that the cost of a VPS is not only the invoice.',
    choices: [
      { text: 'A VPS transfers responsibility for updates, backups and the firewall to the shop.', correct: true, why: 'That is what really changes in the migration — not the power, but whose responsibility it is.' },
      { text: 'The cloud\'s elasticity pays off little here, because there is no varying demand to follow.', correct: true, why: 'Elasticity pays off when demand varies; with steady traffic it usually costs more than a VPS.' },
      { text: 'A CDN helps even without changing hosting, because it sits in front of it.', correct: true, why: 'The CDN does not replace the origin: it precedes it, and takes care of what is static.' },
      { text: 'The cloud eliminates the noisy neighbour because resources are no longer shared.', correct: false, why: 'Shared instances still exist in the cloud; what changes is the isolation you pay for, not the absence of neighbours.' },
      { text: 'Migrating to a VPS lowers the total cost, since the monthly invoice tends to be similar.', correct: false, why: 'The invoice is similar; the total cost rises in administration hours, which is where the sum really changes.' },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-09-quiz',
    course: 'web-fundamentals',
    topic: 'Hosting: shared, VPS, cloud and CDN',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'After publishing a CSS fix, some visitors go on seeing the old version for hours. The site is behind a CDN. What is the structural solution?',
    socraticHint: 'There is the usual way out — asking the CDN to forget what it kept. And there is another, which makes the problem stop happening. What stops two different versions from competing for the same name?',
    choices: [
      {
        text: 'Give the file a name fingerprinted from its content, so that any change changes the name and the HTML points at a different address.',
        correct: true,
        why: 'It is the same solution as the cache lesson, now at world scale: different names never compete for the same cache.',
      },
      {
        text: 'Reduce `max-age` to a few seconds on every static file.',
        correct: false,
        why: 'It works, but throws away the CDN\'s benefit — the file gets fetched again all the time.',
      },
      {
        text: 'Turn the CDN off for the stylesheets and always serve them from the origin.',
        correct: false,
        why: 'It cures the symptom by giving up exactly the content that benefits most from the CDN.',
      },
      {
        text: 'Send `no-store` on the HTML, which makes the CDN re-evaluate the files it references too.',
        correct: false,
        why: 'The directive applies to the document itself; it does not reach the files referenced by it.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 10 */
  {
    id: 'wf-10-ord',
    course: 'web-fundamentals',
    topic: 'How the browser builds the page: DOM, CSSOM and rendering',
    type: 'ordering',
    difficulty: 'medium',
    prompt: 'Put the stages that lead from the HTML received to the pixels on screen in order.',
    socraticHint: 'Two trees are built before any position is computed. And position comes before colour.',
    items: [
      'The HTML is interpreted and becomes the DOM tree of objects',
      'The CSS is interpreted and becomes the CSSOM',
      'The final style of each node is computed, resolving inheritance and specificity',
      'Layout computes the position and size of each box',
      'Paint draws the pixels of each box',
      'Composition puts the layers together on screen',
    ],
    trap: 'The layout–paint pair. Anyone thinking of "drawing the page" tends to merge the two into one step, or to swap them, imagining that the browser draws and then arranges. The separation is exactly what distinguishes a smooth animation from a stuttering one: changing `width` redoes the layout of everything around it, changing `background-color` only repaints, and changing `transform` touches only composition.',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-10-quiz',
    course: 'web-fundamentals',
    topic: 'How the browser builds the page: DOM, CSSOM and rendering',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'A sliding menu animation stutters on phones. It changes `left` on every frame. Which swap tends to fix it?',
    socraticHint: 'Each property triggers a different stage of rendering. Which of them does not force the browser to recompute where everything is?',
    choices: [
      {
        text: 'Animating `transform: translateX(...)`, which touches only composition and is handled by the graphics card.',
        correct: true,
        why: '`transform` and `opacity` are the two properties that skip layout and paint.',
      },
      {
        text: 'Animating `margin-left`, which is computed once and reused on the following frames.',
        correct: false,
        why: '`margin-left` affects layout just as much as `left`, and is recomputed on every frame.',
      },
      {
        text: 'Shortening the animation, since fewer frames mean less recomputation.',
        correct: false,
        why: 'Shortening it hides the symptom; the cost per frame stays the same.',
      },
      {
        text: 'Moving the stylesheet to the end of the `<body>`, releasing rendering earlier.',
        correct: false,
        why: 'That changes when the page first appears, not the cost of each frame of the animation.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },

  /* ============================================================== lesson 11 */
  {
    id: 'wf-11-output',
    course: 'web-fundamentals',
    topic: 'Developer tools: network, console and elements',
    type: 'expected-output',
    difficulty: 'easy',
    language: 'javascript',
    prompt: 'In the console of a page containing exactly three links (`<a>`), you type the two lines below. What appears?',
    socraticHint: 'The first line returns a collection of elements, and what is asked of it is a count. The second asks the type of the value.',
    givenCode: 'const links = document.querySelectorAll("a");\nconsole.log(links.length);\nconsole.log(typeof links.length);\n',
    answer: '3\nnumber\n',
    checkOperation: 'none',
    _verification: 'structure',
  },
  {
    id: 'wf-11-quiz',
    course: 'web-fundamentals',
    topic: 'Developer tools: network, console and elements',
    type: 'quiz',
    difficulty: 'medium',
    prompt: 'In the Network tab, a request shows a high total time almost entirely spent waiting, with a fast transfer and a small size. What does that indicate?',
    socraticHint: 'The time splits between waiting for the response to start and receiving it. Which of the two speaks about the server and which about the path?',
    choices: [
      {
        text: 'The server took a long time to start answering — the bottleneck is the processing on the other side, not the connection.',
        correct: true,
        why: 'A fast transfer with a long wait isolates the problem in whoever answers.',
      },
      {
        text: 'The user\'s connection is slow, which is why the total went up.',
        correct: false,
        why: 'A slow connection would show in the transfer, which here was fast.',
      },
      {
        text: 'The response came from the cache, which explains the small size.',
        correct: false,
        why: 'A cached response is marked as such and does not sit waiting; the total time would be minimal.',
      },
      {
        text: 'The file was compressed, and decompression consumed the waiting time.',
        correct: false,
        why: 'Decompression is local and fast; it does not show up as waiting for the server.',
      },
    ],
    checkOperation: 'none',
    _verification: 'structure',
  },
]);
