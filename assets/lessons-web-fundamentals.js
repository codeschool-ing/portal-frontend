/* ==========================================================================
   Lesson content — each topic's sections.

   WHY THIS FILE EXISTS, INSTEAD OF A FIELD IN THE CATALOGUE
   A catalogue topic is not one subject: it is a handful of them. Half of the
   1,503 topics enumerate three or more subjects in the title itself
   ("Hosting: shared, VPS, cloud and CDN"), and the average load per topic is
   4 hours — which is not one page. The author already divided the lesson, in
   prose; the portal needed to stop ignoring that.

   The vitrine's catalogue file is a sibling of ours, and the modal over there
   renders `topics` as a flat list. Changing the shape of that field would
   break the contract between the two repositories for the one reason that is
   never worth it — convenience. So the sections live here, with the SAME join
   key the exercises use: course + the topic's text in the SOURCE language,
   which is English. (The displayed title is translated at runtime and is not
   usable as a key — see `courseLessons` in app/catalog.js.)

   THE SECTIONS ARE WRITTEN, NEVER DERIVED
   It would have been possible to split the title on the `:` and the commas and
   get 734 divisions for free. One does not. That is lexical heuristics over
   authored prose, and the project has already paid to learn that it does not
   work: in `RULES.md`, the "requires a later topic" check was attempted this
   way, flagged 5 of the 48 good exercises and was discarded with the conclusion
   that "the answer is in the authoring, not in the detection". It would fail the
   same way here — "Client, server and host: who asks and who answers" would
   become a section called "who asks and who answers". The enumeration in the
   title is evidence that the sections are needed; it is not a source for
   reading them.

   SHAPE
     window.LESSONS[courseId][topic in English] = [ section, ... ]

   There is one file per course, as the pipeline does with the exercises, and
   each one MERGES into the object instead of assigning it: none of them may
   depend on being the first to load.
     section = { id, title, body?, video?, duration?, materials? }
       `id`       a short, stable key — it is what enters the URL and the progress
       `body`     list of paragraphs; an item that is itself a list becomes a <ul>
       `video`    the YouTube id, or `true` for "there will be one, not yet"
       `duration` short text ('08 min'), shown on the player and in the rail

     THE SECTION DECLARES WHAT IT IS, and the layout follows:

       with `video`   the player opens edge to edge and the title moves below
                      it. With no `body`, it is a VIDEO-ONLY section — the
                      lesson's opening, where there is no text to read along.
       no `video`     no frame at all. Not grey, not reserved: a text section
                      with a rectangle on top promises something that does not
                      come, and the promise does not expire.

     Markup in the text: `backticks` become code, **asterisks** become bold.
     Nothing beyond that — it is the subset the content uses.

   The Portuguese of every title and body is in assets/lessons-pt.js, read the
   same way the catalogue's translations are.

   A lesson with no entry here falls back to a single section carrying whatever
   content exists, so the portal works the same for the 85 courses that have not
   been written yet. The assessment section is appended by the code when the
   topic has exercises — it is not written here, and a topic with no exercises
   does not get an empty page.

   STATUS: sample content. It was written to evaluate the structure and is
   technically correct, but it has had no pedagogical review. The school
   rewrites it.
   ========================================================================== */

window.LESSONS = Object.assign(window.LESSONS || {}, {

  'web-fundamentals': {

    /* --------------------------------------------------------------- 01 */
    'Client, server and host: who asks and who answers': [
      {
        /* VIDEO-ONLY SECTION: no `body`. It is the lesson-opening shape — the
           instructor says what is coming, and there is no text to read along.
           `video: true` reserves the frame without claiming the video exists. */
        id: 'intro',
        title: 'Introduction',
        video: true,
        duration: '02 min',
      },
      {
        id: 'roles',
        title: 'The two roles',
        body: [
          'Almost everything that happens on the internet is a conversation between two parties with fixed roles. The **client** asks; the **server** answers. Your browser is a client. The computer holding the site is a server.',
          'The roles belong to the moment, not to the machine. A web server that needs to query a database becomes the database\'s client at that instant. The same computer can be a client in one conversation and a server in another, at the same time.',
          'The practical consequence is that **the client always starts**. A server does not push a page to your browser on its own: it waits to be asked. When a page seems to receive data by itself — a notification, a chat — there is a connection the client opened earlier and left open.',
        ],
      },
      {
        id: 'host',
        title: 'What a host is',
        body: [
          '**Host** is any machine with an address on the network. It is the neutral term, used when it does not matter whether that machine is asking or answering — the laptop, the phone, the server and the network printer are all hosts.',
          'The distinction matters because client and server are roles, and host is identity. A sentence like "the host is not responding" is about the machine; "the server is not responding" is about the program that should be listening on that machine. Confusing the two sends the diagnosis the wrong way: cable and power on one side, a crashed process on the other.',
        ],
      },
      {
        id: 'round-trip',
        video: true,
        duration: '09 min',
        title: 'The round trip',
        body: [
          'Typing an address and watching the page appear hides a sequence worth knowing end to end, because it is the one the rest of the course takes apart:',
          [
            'the browser finds the server\'s **address** from the name (that is DNS, lesson 08);',
            'opens a **connection** to it (lesson 02);',
            'sends a **request** saying what it wants (lesson 06);',
            'receives a **response** with the content and a status code;',
            'builds the page from what arrived, asking for the rest as it discovers it needs it (lesson 10).',
          ],
          'Each step can fail in a different way, and each has a diagnostic tool of its own. That is why "the site will not open" is never one problem.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 02 */
    'Packet, frame and socket': [
      {
        id: 'packet',
        title: 'Packet: why data travels in pieces',
        body: [
          'Nothing crosses the network whole. A 2 GB video is cut into thousands of **packets**, each carrying a piece of the content and a header saying where it came from and where it is going.',
          'The first reason is coexistence: if a large file travelled in one block, it would occupy the path until it finished and everything else would wait. Chopped up, the packets of several conversations interleave, and a long transfer does not stop a short one from getting through.',
          'The other reason is failure. A lost packet costs a few kilobytes to resend; a lost file costs the file. And because each packet knows its destination, each can take a different route — if a stretch of the network goes down mid-transmission, the following ones detour without the conversation starting over.',
        ],
      },
      {
        id: 'frame',
        title: 'Frame: the packet inside the cable',
        body: [
          'The **frame** is the envelope of the local link — what actually travels on the Ethernet cable or through the air over Wi-Fi. The packet goes inside it.',
          'The difference between the two is the reach of the address. The packet carries the IP address of the **final** destination, which may be on the other side of the planet and does not change along the way. The frame carries the MAC address of the **next hop**, which is almost always your router, and it is rewritten at every leg of the journey.',
          'It is the difference between the address on the envelope and the plate of the truck carrying it right now. The envelope crosses the whole journey; the truck changes at every sorting centre.',
        ],
      },
      {
        id: 'socket',
        video: true,
        duration: '07 min',
        title: 'Socket: a program\'s address',
        body: [
          'The IP finds the machine, but a machine runs dozens of networked programs at once. What separates them is the **port**, a number identifying which program should receive that data.',
          'The pair `IP:port` is the **socket** — `192.168.0.10:443`, for example. A connection is identified by four things: source IP and port, destination IP and port. Because the source port changes with every new connection, you can open ten tabs of the same site without the responses getting mixed up.',
          'Common ports are worth memorising: `80` for HTTP, `443` for HTTPS, `22` for SSH, `5432` for PostgreSQL. When a service "is not responding" and the machine is up, the right question is almost always whether anything is listening on that port.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 03 */
    'Bandwidth, latency and throughput': [
      {
        id: 'bandwidth',
        title: 'Bandwidth is the pipe, not the speed',
        body: [
          '**Bandwidth** is how much fits through the path per second — the diameter of the pipe. It is measured in bits per second: 300 Mbps is 300 million bits, or about 37 MB, per second.',
          'Watch the unit, because that is where almost everyone gets confused: the provider advertises in **bits** (Mbps) and the browser shows the download in **bytes** (MB/s). It is eight to one. A 300 Mbps connection downloading at 37 MB/s is at its maximum, not at an eighth of it.',
        ],
      },
      {
        id: 'latency',
        title: 'Latency is the travel time',
        body: [
          '**Latency** is how long a piece of data takes to leave here and arrive there — and the number usually measured, the *ping*, is the round trip. It depends above all on physical distance and on the number of devices along the path, which is why **bandwidth does not fix it**.',
          'A thicker pipe does not shorten the road. Buying 1 Gbps does not bring a server in Europe closer: light takes as long as it takes, and 150 ms stays 150 ms.',
          'That is why latency hurts most in chatty things — a game, a video call, a site that makes twenty requests in sequence — and barely shows up in a large download, which fills the pipe once and carries on.',
        ],
      },
      {
        id: 'throughput',
        title: 'Throughput is what you actually got',
        body: [
          '**Throughput** is the rate you really observe, and it usually sits below the bandwidth. The gap is where the real problem lives: congestion along the path, packet loss forcing resends, a slow server on the other end, or the protocol itself waiting for an acknowledgement.',
          'An analogy that pays for itself: **bandwidth** is how many lanes the road has, **latency** is how long it takes to drive it, and **throughput** is how many cars actually arrived. A wide road with a traffic jam delivers little.',
          'A practical diagnosis: if throughput is low **and** latency is normal, suspect the other end or packet loss. If latency is high, no amount of bandwidth will help — the problem is distance or queueing.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 04 */
    'IP address, MAC address and ARP': [
      {
        id: 'ip',
        title: 'IP: the address that moves',
        body: [
          'The **IP address** says where the machine is on the network — and, like a postal address, it describes a position, not an object. Take the laptop to another network and its IP changes.',
          'IPv4 has four numbers from 0 to 255 (`192.168.0.10`) and offers only 4.3 billion combinations, which ran out. IPv6 solves it with 128 bits (`2001:db8::1`) — space that does not run out under any foreseeable scenario.',
          'In the meantime, **private** ranges (`10.x.x.x`, `172.16–31.x.x`, `192.168.x.x`) are reused inside every local network and do not exist on the internet. The router does the translation (NAT) — which is why your machine sees itself as `192.168.0.10` while a website sees your provider\'s public IP.',
        ],
      },
      {
        id: 'mac',
        title: 'MAC: the card\'s identity',
        body: [
          'The **MAC address** (`a4:83:e7:1c:0b:22`) is burned into the network card and, unlike the IP, travels with the equipment wherever it goes. It is identity, not position.',
          'It only means anything within the local link: no router forwards by MAC between networks. That is why a website\'s server never sees your laptop\'s MAC — its network sees the MAC of the last router on the path.',
          'It is the same distinction as frame and packet one lesson back, seen from the address side: IP is where the thing is going, MAC is who delivers it on the current leg.',
        ],
      },
      {
        id: 'arp',
        title: 'ARP: the bridge between the two',
        body: [
          'To deliver a frame on the local network the machine needs the MAC of whoever holds that IP — and that is what **ARP** finds out. It shouts on the network "who has `192.168.0.1`?", and the owner answers with its own MAC.',
          'The answer sits in a cache for a few minutes, otherwise every packet would cost a question. You can see yours with `arp -a`.',
          'It is worth knowing that ARP checks nothing: whoever answers first is believed. That is the basis of the *ARP spoofing* attack, in which a machine answers in the router\'s place and starts receiving the network\'s traffic — the reason using HTTPS on a public network stops being a recommendation and becomes a necessity.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 05 */
    'Layered networks: from the cable to the browser': [
      {
        id: 'why-layers',
        title: 'Why split into layers',
        body: [
          'The network is organised in layers where each one solves a problem and uses the one below without knowing how it works. It is the reason you can swap Wi-Fi for a cable without rewriting the browser: what changed was the layer underneath, and the ones above never found out.',
          'It is also what let the internet be invented before fibre optics and 5G. The upper layers went on working when the lower ones were replaced entirely.',
        ],
      },
      {
        id: 'the-layers',
        video: true,
        duration: '13 min',
        title: 'The four that matter in practice',
        body: [
          'The OSI model has seven layers and is good for studying. Day to day, four explain almost everything:',
          [
            '**Link** — the frame on the cable or in the air. MAC address, Ethernet, Wi-Fi.',
            '**Network** — the packet crossing different networks. IP address, routing.',
            '**Transport** — the conversation between two programs. Ports, TCP and UDP.',
            '**Application** — what the programs say to each other. HTTP, DNS, SMTP.',
          ],
          'Each layer wraps the one above: the frame contains the packet, which contains the segment, which contains the HTTP request. It is literally a set of nesting dolls, and that is how Wireshark shows any capture.',
        ],
      },
      {
        id: 'tcp-udp',
        title: 'TCP and UDP: guarantee, or do not wait',
        body: [
          'The transport layer has two choices, and the difference is what each one promises.',
          '**TCP** guarantees delivery, order and integrity: it acknowledges every piece, resends what was lost and reassembles in the right sequence. It costs a connection to establish and it waits for whatever is missing. It is what HTTP uses — half an HTML document is no use to anyone.',
          '**UDP** promises nothing: it sends and moves on. It costs almost nothing and waits for no one. It is what video calls and games use, because in a live video a late frame is already useless — better to lose it than to freeze the picture waiting for it.',
          'The rule of thumb: if incomplete data is useless, TCP. If late data is useless, UDP.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 06 */
    'HTTP and HTTPS: methods, headers and status codes': [
      {
        id: 'methods',
        video: true,
        duration: '10 min',
        title: 'Methods: the request\'s verb',
        body: [
          'Every HTTP request starts with a verb stating the intent. The ones you always meet:',
          [
            '`GET` — give me. It must not change anything on the server.',
            '`POST` — take this, and create or process something.',
            '`PUT` — replace the resource with this.',
            '`PATCH` — change only these fields.',
            '`DELETE` — remove it.',
          ],
          'The promise that `GET` changes nothing is not a formality. Browsers, proxies and search engines repeat `GET` freely — they prefetch links, revalidate caches, crawl pages. An application that deleted a record via `GET` would be emptied by Google\'s own crawler, and it has happened to serious companies.',
        ],
      },
      {
        id: 'headers',
        title: 'Headers: the conversation\'s metadata',
        body: [
          'Request and response both carry **headers** — name and value pairs describing the content and the conditions, without being part of it.',
          'On the request, the ones that show up most are `Host` (which site, since one server hosts several), `Accept` (which formats will do), `Authorization` (the credential) and `Cookie`. On the response, `Content-Type` (what this is), `Cache-Control` (how long to keep it) and `Set-Cookie`.',
          'A wrong `Content-Type` is one of the most common causes of "it works on my server and not on the other one": the same file served as `text/plain` instead of `text/css` makes the browser refuse the stylesheet, and the page shows up with no styling at all and no visible error.',
        ],
      },
      {
        id: 'status',
        video: true,
        duration: '08 min',
        title: 'Status codes: the five families',
        body: [
          'The response starts with a three-digit number, and the first digit already classifies it:',
          [
            '**1xx** — informational, rare day to day.',
            '**2xx** — it worked. `200 OK`, `201 Created`, `204 No Content`.',
            '**3xx** — it is somewhere else. `301` permanent, `302` temporary, `304` not modified since last time.',
            '**4xx** — the request is wrong. `400` malformed, `401` not authenticated, `403` authenticated but without permission, `404` does not exist, `429` asking too often.',
            '**5xx** — the server failed. `500` internal error, `502` the server behind answered badly, `503` down, `504` the server behind did not answer in time.',
          ],
          'The boundary people get wrong most is 4xx against 5xx: **4xx is the caller\'s fault, 5xx is the responder\'s**. And `401` against `403`: the first says "I do not know who you are", the second says "I know who you are, and you cannot".',
        ],
        materials: ['wf-http-codes'],
      },
      {
        id: 'https',
        title: 'HTTPS: the same HTTP, inside a tunnel',
        body: [
          '**HTTPS is HTTP going through TLS.** The methods, headers and codes are identical; what changes is that all of it travels encrypted.',
          'TLS delivers three things at once, and it is worth knowing which: **confidentiality** (nobody along the path reads it), **integrity** (nobody alters it without giving themselves away) and **authenticity** (the certificate proves that server really does own the domain). The third is what the padlock stands for — and that is why a padlock does not mean "trustworthy site", it means "this really is the site whose name is in the bar".',
          'What TLS does **not** hide: the domain name you visited and the volume of data transferred stay visible to the network. The path, the parameters and the content do not.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 07 */
    'Cookies, sessions and browser cache': [
      {
        id: 'cookies',
        title: 'Cookies: the memory HTTP does not have',
        body: [
          'HTTP remembers nothing: every request arrives as if it were the first. The **cookie** is the workaround that became foundation — the server sends a `Set-Cookie` and the browser hands that value back on every following request to that domain.',
          'The attributes are what separates a safe cookie from a security problem. `HttpOnly` stops the page\'s JavaScript from reading the value, which limits the damage of an XSS. `Secure` stops it being sent outside HTTPS. `SameSite` controls whether the cookie travels on requests originating from another site, which is the defence against CSRF.',
        ],
      },
      {
        id: 'sessions',
        title: 'Session: the cookie that does not carry the secret',
        body: [
          'Keeping real data in the cookie is a bad idea — the user edits whatever they like. The standard is for the cookie to carry only a random **session identifier**, with the server holding the data associated with it.',
          'Hence the consequence that shows up at the first serious deploy: if the application runs on two servers and the session lives in the memory of one of them, half the requests cannot find the session and the user gets "logged out" at random. That is why a session in production lives somewhere shared — Redis, a database — or does not exist at all, and the state travels in a signed token.',
          'Logging out for real means invalidating the session **on the server**. Deleting the cookie only removes the key; if somebody copied the identifier beforehand, it still works.',
        ],
      },
      {
        id: 'cache',
        video: true,
        duration: '06 min',
        title: 'Cache: not asking again for what has not changed',
        body: [
          'The fastest way to load a file is not to load it. The **cache** keeps the response and reuses it while it is still valid, and the server is what decides that, through `Cache-Control`.',
          '`max-age=3600` says "good for an hour, do not even ask". `no-cache` says "you may keep it, but confirm before using it" — the browser sends a conditional request and gets `304 Not Modified` if nothing changed, which saves the whole body. `no-store` says "do not keep it", and it is the right call for a bank statement page.',
          'The practical tension is between caching a lot (fast, but the user sees the stale version) and caching little (always current, but slow). The standard way out is the **fingerprinted name**: `app.9f2c1a.css` can be cached for a year, because any change changes the file name and the HTML starts pointing at a different one.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 08 */
    'Domains: registration, DNS, propagation and subdomains': [
      {
        id: 'registration',
        title: 'Registration: you rent, you do not buy',
        body: [
          'A domain is **rented**, for one to ten years, from an accredited registrar. Under `.br` the controller is Registro.br; under the generic ones (`.com`, `.org`) they are commercial registrars.',
          'Failing to renew is the most common and most expensive way to lose a domain: the name goes back on the market, and with it years of e-mail and links. Automatic renewal and a current contact address on the registration are worth more than they look.',
          'The name reads from right to left: in `portal.codeschool.ing`, `.ing` is the top, `codeschool` is what gets registered, and `portal` is a subdomain you create freely, at no extra cost.',
        ],
      },
      {
        id: 'dns',
        title: 'DNS: translating a name into an address',
        video: true,
        duration: '11 min',
        body: [
          '**DNS** is the service that answers "what is the IP of `codeschool.ing`?". It is hierarchical: the question climbs to whoever knows, and the answer comes back down being cached along the way.',
          'The record types you use every week:',
          [
            '`A` — points the name at an IPv4. `AAAA` does the same for IPv6.',
            '`CNAME` — says "this name is an alias of that one". It cannot exist at the domain root.',
            '`MX` — where this domain\'s e-mail goes.',
            '`TXT` — free text; it is where proofs of ownership and the anti-fraud e-mail rules live (SPF, DKIM).',
          ],
          'The `CNAME`-at-the-root restriction is the one that shows up most in practice: to point `codeschool.ing` (without `www`) at a hosted service, either you use `A` with fixed IPs, or the provider offers an `ALIAS`/`ANAME`, which is a non-standard extension.',
          {
            /* Drawn inline here, and not exported as an image, so it inherits
               the theme's colours: a diagram PNG is born with a background, and
               that background is wrong on half the visits. */
            svg: [
              '<svg viewBox="0 0 720 190" role="img" aria-label="The question climbs from the browser to the resolver, and from the resolver to the root, TLD and authoritative servers; the answer comes back down being cached">',
              '<g fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55">',
              '<rect x="8" y="60" width="118" height="46" rx="4"/>',
              '<rect x="176" y="60" width="128" height="46" rx="4"/>',
              '<rect x="354" y="16" width="120" height="38" rx="4"/>',
              '<rect x="354" y="72" width="120" height="38" rx="4"/>',
              '<rect x="354" y="128" width="120" height="38" rx="4"/>',
              '</g>',
              '<g fill="currentColor" font-family="IBM Plex Mono, monospace" font-size="11">',
              '<text x="67" y="80" text-anchor="middle">browser</text>',
              '<text x="67" y="95" text-anchor="middle" opacity=".6">has a cache</text>',
              '<text x="240" y="80" text-anchor="middle">resolver</text>',
              '<text x="240" y="95" text-anchor="middle" opacity=".6">your provider\'s</text>',
              '<text x="414" y="40" text-anchor="middle">root  .</text>',
              '<text x="414" y="96" text-anchor="middle">TLD  .ing</text>',
              '<text x="414" y="152" text-anchor="middle">authoritative</text>',
              '</g>',
              '<g fill="none" stroke="currentColor" stroke-width="1.4" opacity=".8">',
              '<path d="M126 78h42" marker-end="url(#pt)"/>',
              '<path d="M304 76l44-38" marker-end="url(#pt)"/>',
              '<path d="M304 83h42" marker-end="url(#pt)"/>',
              '<path d="M304 90l44 38" marker-end="url(#pt)"/>',
              '</g>',
              '<defs><marker id="pt" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">',
              '<path d="M0 0l8 4-8 4z" fill="currentColor"/></marker></defs>',
              '<g font-family="IBM Plex Mono, monospace" font-size="10" opacity=".55" fill="currentColor">',
              '<text x="500" y="96">every answer comes back down</text>',
              '<text x="500" y="112">kept for TTL seconds</text>',
              '</g>',
              '</svg>',
            ].join(''),
            caption: 'The question climbs to whoever knows; the answer comes back down being cached along the way. It is that cache along the path that makes propagation take time.',
          },
        ],
      },
      {
        id: 'propagation',
        title: 'Propagation: why the change takes time',
        body: [
          'Changed the DNS and the old site is still showing? That is the cache doing its job. Every record has a **TTL** — how long the world\'s servers may keep the answer before asking again.',
          'Nothing "spreads": the new record has been live since the first second. What takes time is the old caches expiring, and the ceiling on that is the TTL that was in force **before** the change.',
          'Hence the standard manoeuvre for anyone about to migrate: lower the TTL to about five minutes **a day beforehand**, make the change, check, and only then put the TTL back up to hours. Lowering the TTL after changing does nothing at all — the caches already took the old value.',
        ],
        materials: ['wf-dns-cheatsheet'],
      },
      {
        id: 'subdomains',
        title: 'Subdomains: when to separate',
        body: [
          'A subdomain is free and unlimited, so the question is never "can I?", it is "should I?". `app.example.com` and `example.com/app` solve the same need in different ways.',
          'A subdomain really does separate: each can point at a different server, have a certificate of its own and, for many security purposes, is treated as another site — one\'s cookie is not sent to the other by default. That is what you want for the admin panel, for the API and for the test environment.',
          'A path on the same origin shares everything — session, cookie, certificate — and avoids the extra configuration. That is what you want when the parts are the same product and talk to each other constantly.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 09 */
    'Hosting: shared, VPS, cloud and CDN': [
      {
        id: 'shared',
        title: 'Shared hosting',
        video: true,
        duration: '08 min',
        body: [
          'One server, dozens or hundreds of sites, all sharing the same operating system and the same resources. You get a control panel, a folder and a database; the provider handles the rest.',
          'It is the cheapest option and the one demanding the least knowledge — and the price of that is control. You do not install what you want, the language version is whatever is there, and the **noisy neighbour** is real: a neighbouring site taking a traffic spike drags your performance down without you having done anything.',
          'It is still the right choice for a company site, a blog and a small shop. It stops being right when you need a process running all the time, a specific dependency, or guaranteed performance.',
        ],
      },
      {
        id: 'vps',
        title: 'VPS: the machine that is yours',
        body: [
          'A **VPS** is a virtualised slice of a physical server, with an operating system of its own and reserved resources. You log in over SSH and you are the administrator — install what you like, pick the versions, open the ports you need.',
          'What really changes is not the power: it is **whose responsibility it is**. Security updates, firewall, backup, certificate, monitoring — all of that becomes yours. A VPS forgotten for six months is a compromised machine waiting to happen.',
          'The sum worth doing before migrating: a VPS usually costs a little more than shared hosting in money, and a great deal more in hours. If nobody on the team is going to look after it, shared hosting or a managed platform delivers more.',
        ],
      },
      {
        id: 'cloud',
        title: 'Cloud: paying for what you use',
        body: [
          'The cloud — AWS, Azure, Google Cloud and the like — sells **resources on demand**: you create ten servers in a minute and destroy them in another, paying for the time they existed. It is the same idea as a VPS taken to the extreme of elasticity, with a catalogue of ready-made services around it (managed database, queue, storage, authentication).',
          'The real advantage is following demand that varies: a shop that triples its traffic on Black Friday adds capacity that day and gives it back the following week. A shop with steady traffic gains nothing from it — and probably pays more than it would on a VPS.',
          'The two costs that surprise newcomers: **outbound data transfer** is usually billed and vanishes from the initial estimate, and complexity climbs fast. A badly sized cloud architecture is more expensive and more fragile than one well-tended machine.',
        ],
      },
      {
        id: 'cdn',
        title: 'CDN: bringing the content closer to whoever asks',
        body: [
          'A **CDN** is a network of servers spread around the world holding copies of your content. Somebody visiting from Lisbon is served by the Lisbon node, not by your server in São Paulo.',
          'It attacks exactly the problem bandwidth cannot solve, three lessons back: **latency is distance**, and the only way to reduce it is to shorten the path. For static files — images, CSS, JavaScript, video — the gain is large and the configuration is small.',
          'A CDN does not replace hosting: it sits in front of it. Your server still exists and still answers for what is dynamic and for what the CDN does not have cached yet — that is what is called the **origin**.',
          'The side effect that bites: because the CDN holds copies, publishing a new version does not always show up straight away. Either you invalidate the cache on deploy, or you use a fingerprinted file name — the same solution as the cache lesson, now at world scale.',
        ],
      },
      {
        id: 'choosing',
        title: 'How to choose',
        body: [
          'The four options are not a ladder where the last one is best: they answer different questions.',
          [
            '**How much control do you need?** Installing things and running your own processes already rules out shared hosting.',
            '**Who is going to administer it?** With nobody responsible for updates and backups, managed beats a VPS.',
            '**Does demand vary a lot?** If so, the cloud\'s elasticity pays for itself. If not, it is cost with nothing in return.',
            '**Is your audience far away?** Then a CDN, regardless of which of the three is behind it.',
          ],
          'And it is worth saying what this course itself does: the school\'s vitrine is a static site published on GitHub Pages, which is managed hosting with a CDN built in, for free. For HTML, CSS and JavaScript with no server, it is hard to justify more than that.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 10 */
    'How the browser builds the page: DOM, CSSOM and rendering': [
      {
        id: 'dom',
        title: 'DOM: the HTML becoming a tree',
        body: [
          'The browser reads the HTML and builds the **DOM** — a tree of objects in which every element is a node with a parent, children and properties. The HTML is the text; the DOM is what exists in memory after interpreting it.',
          'The distinction matters because the DOM is not obliged to look like the file. It is corrected while being built (a badly closed tag gets patched) and altered afterwards by JavaScript. That is why "view source" and "inspect element" can show different things — the first is the text that arrived, the second is the tree as it is now.',
        ],
      },
      {
        id: 'cssom',
        title: 'CSSOM and style computation',
        body: [
          'The CSS goes through the same process and becomes the **CSSOM**. Then the browser combines the two trees to decide the final style of every node, resolving inheritance, specificity and order.',
          'This is where a dispute like the one this portal ran into gets decided: a browser rule for `[hidden]` has zero specificity and loses to any class declaring `display`. None of that is visible in the CSS file — only in the computed style.',
          'CSS **blocks rendering** on purpose: showing the page unstyled and restyling it afterwards would flash the whole screen. That is why a large stylesheet delays the first paint, and why the CSS `<link>` goes in the `<head>`.',
        ],
      },
      {
        id: 'rendering',
        video: true,
        duration: '11 min',
        title: 'Layout, paint and composition',
        body: [
          'With the style resolved, three steps remain: **layout** computes the position and size of every box, **paint** draws the pixels, and **composition** puts the layers together on screen.',
          'The cost of each is very different, and that is what separates a smooth animation from a stuttering one. Changing `width` or `top` redoes the layout of everything around it. Changing `background-color` only repaints. Changing `transform` or `opacity` touches only composition, which the graphics card does on its own.',
          'Hence the most profitable practical rule in front-end work: **animate `transform` and `opacity`**, not `left`, `top` or `width`.',
        ],
      },
      {
        id: 'scripts',
        title: 'Where JavaScript comes in',
        body: [
          'An ordinary `<script>` **stops the DOM being built** while it downloads and executes, because it may alter the very tree under construction. A script at the top of the `<head>` is the classic recipe for a blank page.',
          'Two attributes solve it: `defer` downloads in parallel and executes after the HTML is built, preserving the order between scripts; `async` downloads in parallel and executes as soon as it arrives, guaranteeing no order at all.',
          '`defer` is the right default for the page\'s own code, and it is also the behaviour of a `<script type="module">` — which explains why this portal can call `document.querySelector` at the top of a module without waiting for any event.',
        ],
      },
    ],

    /* --------------------------------------------------------------- 11 */
    'Developer tools: network, console and elements': [
      {
        id: 'elements',
        title: 'Elements: the DOM live',
        body: [
          'The **Elements** tab shows the DOM as it is now, not as the file arrived — and lets you edit all of it right there, which is the fastest way to test a layout idea without touching the code.',
          'The styles panel beside it is where "why is this rule not applying" gets settled: it lists every declaration reaching the element, strikes through the ones that lost and shows which file and line each came from. The **computed** style tab has the final word, with the value that actually won.',
          'The box model drawn underneath — content, padding, border, margin — answers almost any spacing question in two seconds.',
        ],
      },
      {
        id: 'console',
        video: true,
        duration: '12 min',
        title: 'Console: errors and experiments',
        body: [
          'The **Console** is the first place to look when something does not work, and the most ignored by beginners. A JavaScript error, a file that did not load, a blocked resource — it all shows up there, and almost always with the exact line.',
          'It is also an execution environment: you can inspect variables, call the page\'s functions and test a selector before writing it into the code. `$0` refers to the element selected in the Elements tab.',
          'One warning worth heeding: never paste code a stranger told you to paste into the console. It runs with all the privileges of the open page, including your session cookies — it is a common enough scam that some sites print a warning right there.',
        ],
      },
      {
        id: 'network',
        title: 'Network: what was asked for and what came back',
        body: [
          'The **Network** tab lists every request the page made, with method, status, size and timing. It is where you confirm, instead of assuming, almost everything this course has presented.',
          'What to look at first: the **status** (4xx is yours, 5xx is the server\'s), the **timing** split between waiting and transferring — which separates a slow server from a slow connection — and the **size** column, where a response served from cache shows up as such instead of travelling again.',
          'Two options change the diagnosis: *Disable cache* forces everything to be fetched, showing what a new user\'s first visit looks like; and throttling simulates a bad connection, which is the only honest way to know how the site behaves outside your Wi-Fi.',
        ],
      },
    ],
  },
});
