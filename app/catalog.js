/* ==========================================================================
   Catalogue — reading COURSES / TRACKS and the dependency graph.

   PROVENANCE: `trackGraph` came from the vitrine's `assets/script.js`
   (codeschool-ing.github.io), all but verbatim. Only one thing changed: there
   the algorithm read the fork choice from a global `escolhas` object fed by
   clicks on the tabs; here it is injected by the caller, because in the portal
   the choice is the student's enrolment and comes from storage.

   This module does not touch the DOM. It is the "pure logic" — the graph is the
   most valuable piece in the vitrine's repository and must never be rewritten
   again.

   The catalogue's own field names (`cursos`, `topicos`, `depende`, `opcoes`,
   `ligacoes`, `horas`) stay in Portuguese: `dados.js` is a verbatim copy shared
   with the vitrine, and renaming half of a shared contract only makes the two
   repositories drift.

   The shape `trackGraph` returns is English (`nodes`, `columns`, `level`) — it
   is internal to this module and `graph.js`, and the two were renamed together.
   A node's `kind` is still `curso` / `garfo` / `saida`, because those are the
   values, not the field name, and they name things the catalogue declares.
   ========================================================================== */

export const courseById = (id) => COURSES.find((c) => c.id === id);
export const trackById = (id) => TRACKS.find((t) => t.id === id);

/* ---------- tracks with a fork ----------
   An item of `cursos` is either a course id (a string) or a choice step (an
   object with `opcoes`). Hence three different readings of the same track: all
   the possible courses, the chosen path, and the hours of that path. */
export const isChoice = (item) => typeof item === 'object' && Array.isArray(item.options);

// every course the track can contain, adding up all the options
export const allCourses = (t) =>
  t.courses.flatMap((i) => (isChoice(i) ? i.options.flatMap((o) => o.courses) : [i]));

// the first option is the one suggested by default, as on the vitrine
export const DEFAULT_OPTION = () => 0;

// the path this student picked
export const trackPath = (t, activeOption = DEFAULT_OPTION) =>
  t.courses.flatMap((i, idx) => (isChoice(i) ? i.options[activeOption(t.id, idx)].courses : [i]));

export const hoursOf = (ids) => ids.reduce((s, id) => s + (courseById(id)?.hours || 0), 0);

// how many tracks a course appears in (the same course can serve several)
export const tracksWithCourse = (id) => TRACKS.filter((t) => allCourses(t).includes(id));
// the inverse of `depende`: which courses this one unlocks
export const unlockedBy = (id) => COURSES.filter((c) => (c.requires || []).includes(id));

// workload range: the shortest and the longest possible path
export function hoursRange(t) {
  let min = 0, max = 0;
  t.courses.forEach((i) => {
    if (!isChoice(i)) { const h = courseById(i)?.hours || 0; min += h; max += h; return; }
    const hs = i.options.map((o) => hoursOf(o.courses));
    min += Math.min(...hs);
    max += Math.max(...hs);
  });
  return { min, max };
}

/* ---------- lesson = topic ----------
   The catalogue has no concept of a lesson: the finest grain is `topicos`. The
   portal adopts the topic as the lesson, and does not invent a third key — the
   pipeline's exercises are already indexed by `topico`.

   BUT THE DISPLAYED TITLE CANNOT BE THE KEY. `applyContent()` rewrites
   `c.topicos` in place on every language switch, so in English the title becomes
   "Types, coercion, strict equality and falsy values" and no exercise matches.
   The defect shows up without anyone touching anything: the browser only has to
   be set to another language, which is the case for most people outside Brazil.

   The key is the PORTUGUESE text, stored by `saveBase()` at load time. It is
   the same decision as the vitrine's i18n — the translation key is the
   Portuguese text itself — applied to the join with the content. Hence each
   lesson carrying both: `title` to show, `key` to match on. */
export function courseLessons(id) {
  const c = courseById(id);
  if (!c) return [];
  const authored = (typeof BASE !== 'undefined' && BASE.courses?.[id]?.topics) || c.topics || [];
  return (c.topics || []).map((title, ix) => ({
    courseId: id,
    ix,
    title,
    key: authored[ix] ?? title,
  }));
}

/* ---------- a track's graph ----------
   Every course on the path becomes a node; a choice step becomes a single node
   (the block), because it is a decision, not a course. The edges come from each
   course's `depende` field, clipped to what exists in this track. A node's level
   is 1 + the highest level among its prerequisites, which puts side by side
   everything that can be done at the same time. */
export function trackGraph(t, activeOption = DEFAULT_OPTION) {
  const nodes = [];
  const ofCourse = {};      // course id -> id of the node containing it
  const forkMembers = {};   // course id (from any option) -> fork node id

  t.courses.forEach((item, idx) => {
    if (!isChoice(item)) {
      nodes.push({ id: item, kind: 'course', courses: [item] });
      ofCourse[item] = item;
      return;
    }
    const nodeId = 'garfo:' + idx;
    nodes.push({ id: nodeId, kind: 'garfo', step: item, idx: idx, courses: item.options[activeOption(t.id, idx)].courses });
    item.options.forEach((o) => o.courses.forEach((c) => { forkMembers[c] = nodeId; }));
    item.options[activeOption(t.id, idx)].courses.forEach((c) => { ofCourse[c] = nodeId; });
  });

  // edges: prerequisite -> course, resolving inner courses to their block
  const itemId = (v) => (typeof v === 'number' ? nodes[v] && nodes[v].id : ofCourse[v] || forkMembers[v]);
  nodes.forEach((node, i) => {
    const deps = new Set();
    node.courses.forEach((id) => {
      (courseById(id)?.requires || []).forEach((d) => {
        const target = ofCourse[d] || forkMembers[d];
        if (target && target !== node.id) deps.add(target);
      });
      // links that only exist in this track (curriculum order, not content order)
      ((t.links || {})[id] || []).forEach((v) => {
        const target = itemId(v);
        if (target && target !== node.id) deps.add(target);
      });
    });
    // no prerequisite at all inside this track: the curriculum order applies,
    // or courses like `nuvem` and `testes-cicd` would all land on level one
    if (!deps.size && i > 0) deps.add(nodes[i - 1].id);
    node.deps = [...deps];
  });

  // the arrival node: everything that is nobody's prerequisite flows into it, so
  // the graph does not end in loose courses with no outgoing arrow
  const hasSuccessor = {};
  nodes.forEach((n) => n.deps.forEach((d) => { hasSuccessor[d] = true; }));
  nodes.push({ id: '@outcome', kind: 'outcome', courses: [], deps: nodes.filter((n) => !hasSuccessor[n.id]).map((n) => n.id) });

  const successors = {};
  nodes.forEach((n) => n.deps.forEach((d) => { (successors[d] = successors[d] || []).push(n.id); }));

  /* Levels by iterative topological sort (Kahn). The recursive version had a
     depth ceiling that blew up on the long tracks. */
  const level = {};
  const remaining = {};
  nodes.forEach((n) => { remaining[n.id] = n.deps.length; });
  const queue = nodes.filter((n) => !n.deps.length).map((n) => n.id);
  queue.forEach((id) => { level[id] = 0; });
  for (let i = 0; i < queue.length; i += 1) {
    const id = queue[i];
    (successors[id] || []).forEach((s) => {
      level[s] = Math.max(level[s] === undefined ? 0 : level[s], level[id] + 1);
      remaining[s] -= 1;
      if (remaining[s] <= 0) queue.push(s);
    });
  }
  /* Safety net: if the data forms a cycle, Kahn's queue runs dry before the end.
     Instead of leaving those nodes without a level — which made the whole track
     disappear — they go in after the highest prerequisite already resolved. */
  const stuck = nodes.filter((n) => level[n.id] === undefined);
  stuck.forEach((n) => {
    const resolved = n.deps.map((d) => level[d]).filter((v) => v !== undefined);
    level[n.id] = resolved.length ? Math.max(...resolved) + 1 : 0;
    queue.push(n.id);
  });
  if (stuck.length && window.console) {
    console.warn('trilha "' + t.name + '": dependência circular em ' + stuck.map((n) => n.id).join(', '));
  }

  // group by level, leaving no gap in the sequence of columns
  const byLevel = {};
  nodes.forEach((n) => { (byLevel[level[n.id]] = byLevel[level[n.id]] || []).push(n); });
  const columns = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b)
    .map((v) => byLevel[v]);
  columns.forEach((col, i) => col.forEach((n) => { level[n.id] = i; }));

  /* ---------- ordering within each level ----------
     NOTHING is pinned per track: the algorithm measures the drawing that would
     come out and picks the order that produces the fewest line crossings. Three
     pieces of Sugiyama — barycentre, transposition (accepting ties, which is
     what unsticks the two-column cases) and multiple restarts with a fixed seed,
     so the graph does not change shape between visits. Result across the 16
     tracks: 5 crossings → 0. */
  const position = {};
  const index = () => columns.forEach((col) => col.forEach((n, i) => {
    position[n.id] = col.length > 1 ? i / (col.length - 1) : 0.5;
  }));

  const edges = [];
  nodes.forEach((n) => n.deps.forEach((d) => {
    if (level[d] < level[n.id]) edges.push({ from: d, to: n.id, span: level[n.id] - level[d] });
  }));

  /* A cost with THREE criteria compared lexicographically, not summed — that way
     no lesser criterion can buy one more crossing:
       1) crossings;
       2) upward bias (on a tie, the detour goes up: it keeps the body of the
          track contiguous instead of split by lines on both sides);
       3) curriculum order (between equally clean drawings, the one that keeps
          the declared sequence wins). */
  const curriculumOrder = {};
  nodes.forEach((n, i) => { curriculumOrder[n.id] = i; });
  const gaps = [];
  const cost = () => {
    for (let g = 0; g < columns.length - 1; g += 1) gaps[g] = [];
    edges.forEach((e) => {
      if (e.span === 1) gaps[level[e.from]].push({ a: position[e.from], b: position[e.to] });
    });
    let crossings = 0;
    gaps.forEach((list) => {
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          if ((list[i].a - list[j].a) * (list[i].b - list[j].b) < 0) crossings += 1;
        }
      }
    });
    let bias = 0;
    edges.forEach((e) => {
      if (e.span === 1) return;
      const pu = position[e.from], pv = position[e.to];
      const out = gaps[level[e.from]], into = gaps[level[e.to] - 1];
      let up = 0, down = 0;
      out.forEach((s) => { if (s.a < pu) up += 1; else if (s.a > pu) down += 1; });
      into.forEach((s) => { if (s.b < pv) up += 1; else if (s.b > pv) down += 1; });
      crossings += Math.min(up, down);
      bias += pu + pv;
    });
    let outOfOrder = 0;
    columns.forEach((col) => {
      for (let i = 0; i < col.length; i += 1) {
        for (let j = i + 1; j < col.length; j += 1) {
          if (curriculumOrder[col[i].id] > curriculumOrder[col[j].id]) outOfOrder += 1;
        }
      }
    });
    return [crossings, bias, outOfOrder];
  };
  /* compares two costs criterion by criterion (lexicographic order) */
  const worse = (a, b) => {
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] > b[i];
    }
    return false;
  };
  const same = (a, b) => a.every((v, i) => v === b[i]);

  const MEAN = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const MEDIAN = (v) => {
    const s = v.slice().sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const sortColumn = (col, neighbours, aggregate) => {
    const key = col.map((n, i) => {
      const v = neighbours(n).map((id) => position[id]).filter((x) => x !== undefined);
      return { n: n, b: v.length ? aggregate(v) : null, i: i };
    });
    key.sort((a, b) => (a.b === null || b.b === null ? a.i - b.i : (a.b - b.b) || (a.i - b.i)));
    return key.map((x) => x.n);
  };

  /* swaps neighbouring pairs while it pays off; `acceptTies` lets the algorithm
     walk sideways to get out of a local optimum */
  const transpose = (acceptTies) => {
    let improved = true;
    let rounds = 0;
    while (improved && rounds < 8) {
      improved = false;
      rounds += 1;
      columns.forEach((col) => {
        for (let i = 0; i + 1 < col.length; i += 1) {
          const before = cost();
          const tmp = col[i]; col[i] = col[i + 1]; col[i + 1] = tmp;
          index();
          const after = cost();
          if (worse(before, after) || (acceptTies && same(before, after))) {
            if (worse(before, after)) improved = true;
          } else {
            const v = col[i]; col[i] = col[i + 1]; col[i + 1] = v;
            index();
          }
        }
      });
    }
  };

  index();
  let best = columns.map((col) => col.slice());
  let bestCost = cost();
  const keep = () => {
    const c = cost();
    if (worse(bestCost, c)) { bestCost = c; best = columns.map((col) => col.slice()); }
  };

  const initial = columns.map((col) => col.slice());
  let seed = 1;   // linear congruential generator: it shuffles the same way every time
  const draw = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const RESTARTS = ['curriculo', 'invertida', 'sorteio', 'sorteio', 'sorteio', 'sorteio'];

  RESTARTS.forEach((restart) => {
    columns.length = 0;
    initial.forEach((col) => {
      if (restart === 'curriculo') return columns.push(col.slice());
      if (restart === 'invertida') return columns.push(col.slice().reverse());
      const a = col.slice();
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(draw() * (i + 1));
        const t2 = a[i]; a[i] = a[j]; a[j] = t2;
      }
      return columns.push(a);
    });
    index();
    /* on a shuffled restart, climb the hill BEFORE the barycentre: if the
       barycentre runs first it reorders everything by neighbours and erases the
       shuffle, and the restart stops being a different restart */
    if (restart === 'sorteio') { transpose(true); keep(); }
    for (let pass = 0; pass < 2; pass += 1) {
      const aggregate = pass % 2 ? MEDIAN : MEAN;
      for (let v = 1; v < columns.length; v += 1) {
        columns[v] = sortColumn(columns[v], (n) => n.deps, aggregate);
        index();
      }
      for (let v = columns.length - 2; v >= 0; v -= 1) {
        columns[v] = sortColumn(columns[v], (n) => successors[n.id] || [], aggregate);
        index();
      }
      keep();
      transpose(pass % 2 === 1);
      keep();
    }
  });

  columns.length = 0;
  best.forEach((col) => columns.push(col));
  columns.forEach((col, i) => col.forEach((n) => { level[n.id] = i; }));

  return { nodes, columns, level, realLevels: columns.length - 1 };
}
