/* Wumpus Planner core: pure logic, no DOM.
   The action model mirrors move / take / shoot from
   "wumpus_domain_a corrected (No const).pddl".
   One toggleable addition: a living Wumpus blocks its own square (classic rules). */
(function (root) {
  'use strict';
  var now = function () { return typeof performance !== 'undefined' ? performance.now() : Date.now(); };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var sq = function (n, p) { return 'sq-' + ((p % n) + 1) + '-' + (Math.floor(p / n) + 1); };
  var px = function (n, p) { return p % n; };
  var py = function (n, p) { return Math.floor(p / n); };
  var manhattan = function (n, a, b) { return Math.abs(px(n, a) - px(n, b)) + Math.abs(py(n, a) - py(n, b)); };

  function neighbours(n, p) {
    var x = px(n, p), y = py(n, p), r = [];
    if (x > 0) r.push(p - 1);
    if (x < n - 1) r.push(p + 1);
    if (y > 0) r.push(p - n);
    if (y < n - 1) r.push(p + n);
    return r;
  }

  function makeWorld(n, o) {
    var N = n * n, adj = [], pit = [], breeze = [], stench = [], p;
    for (p = 0; p < N; p++) { adj.push(neighbours(n, p)); pit.push(false); }
    o.pits.forEach(function (q) { pit[q] = true; });
    for (p = 0; p < N; p++) {
      breeze.push(adj[p].some(function (q) { return pit[q]; }));
      stench.push(adj[p].indexOf(o.wumpus) >= 0);
    }
    return { n: n, N: N, adj: adj, pit: pit, start: o.start, gold: o.gold, wumpus: o.wumpus,
             pits: o.pits.slice(), blocks: o.blocks !== false, breeze: breeze, stench: stench };
  }

  // Layout from wumpus.pddl: gold sq-2-3, wumpus sq-1-3, pits sq-3-1 and sq-4-4, agent sq-1-1.
  function assignmentWorld(blocks) {
    return makeWorld(4, { start: 0, gold: 9, wumpus: 8, pits: [2, 15], blocks: blocks });
  }

  function successors(w, s) {
    var out = [];
    w.adj[s.p].forEach(function (q) {
      if (w.pit[q]) return;
      if (w.blocks && s.w && q === w.wumpus) return;
      out.push({ a: { type: 'move', from: s.p, to: q }, s: { p: q, g: s.g, a: s.a, w: s.w } });
    });
    if (!s.g && s.p === w.gold) out.push({ a: { type: 'take', at: s.p }, s: { p: s.p, g: 1, a: s.a, w: s.w } });
    if (s.a && s.w && w.adj[s.p].indexOf(w.wumpus) >= 0)
      out.push({ a: { type: 'shoot', from: s.p, victim: w.wumpus }, s: { p: s.p, g: s.g, a: 0, w: 0 } });
    return out;
  }

  function pddlAction(w, a) {
    var n = w.n;
    if (a.type === 'move') return '(move agent ' + sq(n, a.from) + ' ' + sq(n, a.to) + ')';
    if (a.type === 'take') return '(take agent the-gold ' + sq(n, a.at) + ')';
    return '(shoot agent ' + sq(n, a.from) + ' the-arrow wumpus ' + sq(n, a.victim) + ')';
  }

  function toPddlProblem(w) {
    var n = w.n, i, p, q, L = [];
    var names = []; for (p = 0; p < w.N; p++) names.push(sq(n, p));
    L.push('(define (problem wumpus-gen)', '  (:domain wumpus_domain_a)', '  (:objects ' + names.join(' ') + ' the-gold the-arrow agent wumpus)', '  (:init');
    for (p = 0; p < w.N; p++) w.adj[p].forEach(function (q) { L.push('    (adj ' + sq(n, p) + ' ' + sq(n, q) + ')'); });
    L.push('    (at the-gold ' + sq(n, w.gold) + ')');
    w.pits.forEach(function (q) { L.push('    (pit ' + sq(n, q) + ')'); });
    L.push('    (at agent ' + sq(n, w.start) + ')', '    (have agent the-arrow)', '    (at wumpus ' + sq(n, w.wumpus) + '))');
    L.push('  (:goal (and (have agent the-gold) (at agent ' + sq(n, w.start) + '))))');
    return L.join('\n');
  }

  function search(w, algo, opts) {
    opts = opts || {};
    var res = run(w, algo);
    var reps = opts.reps || 1;
    if (reps > 1) {
      var t0 = now();
      for (var i = 0; i < reps; i++) run(w, algo);
      res.ms = (now() - t0) / reps;
    }
    return res;
  }

  function run(w, algo) {
    var t0 = now(), n = w.n;
    var key = function (s) { return ((s.p * 2 + s.g) * 2 + s.a) * 2 + s.w; };
    var h = function (s) {
      return s.g ? manhattan(n, s.p, w.start)
                 : manhattan(n, s.p, w.gold) + 1 + manhattan(n, w.gold, w.start);
    };
    var heap = [], counter = 0;
    var less = function (a, b) { return a.k0 !== b.k0 ? a.k0 < b.k0 : a.k1 !== b.k1 ? a.k1 < b.k1 : a.c < b.c; };
    var push = function (node) {
      var hv = h(node.s), k0, k1 = 0;
      if (algo === 'bfs') k0 = node.g; else if (algo === 'astar') { k0 = node.g + hv; k1 = hv; } else k0 = hv;
      var it = { k0: k0, k1: k1, c: counter++, node: node };
      heap.push(it);
      var i = heap.length - 1;
      while (i > 0) {
        var par = (i - 1) >> 1;
        if (less(heap[i], heap[par])) { var t = heap[i]; heap[i] = heap[par]; heap[par] = t; i = par; } else break;
      }
    };
    var pop = function () {
      var top = heap[0], last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        var i = 0;
        for (;;) {
          var l = 2 * i + 1, r = l + 1, m = i;
          if (l < heap.length && less(heap[l], heap[m])) m = l;
          if (r < heap.length && less(heap[r], heap[m])) m = r;
          if (m === i) break;
          var t = heap[i]; heap[i] = heap[m]; heap[m] = t; i = m;
        }
      }
      return top;
    };
    var best = new Map(), closed = new Set();
    var s0 = { p: w.start, g: 0, a: 1, w: 1 };
    var n0 = { s: s0, g: 0, parent: null, act: null };
    best.set(key(s0), 0); push(n0);
    var generated = 1, expanded = 0, order = [], goal = null;
    while (heap.length) {
      var node = pop().node, k = key(node.s);
      if (closed.has(k)) continue;
      closed.add(k);
      expanded++; order.push(node.s.p);
      if (node.s.g && node.s.p === w.start) { goal = node; break; }
      var succ = successors(w, node.s);
      for (var j = 0; j < succ.length; j++) {
        var k2 = key(succ[j].s), g2 = node.g + 1;
        if (closed.has(k2)) continue;
        if (algo === 'astar') { if (best.has(k2) && best.get(k2) <= g2) continue; }
        else if (best.has(k2)) continue;
        best.set(k2, g2); generated++;
        push({ s: succ[j].s, g: g2, parent: node, act: succ[j].a });
      }
    }
    var plan = [];
    for (var c = goal; c && c.parent; c = c.parent) plan.push(c.act);
    plan.reverse();
    return { algo: algo, found: !!goal, plan: plan, expanded: expanded, generated: generated,
             ms: now() - t0, order: order };
  }

  function genWorld(n, seed, blocks) {
    var rnd = mulberry32(seed), N = n * n;
    var nPits = n === 4 ? (rnd() < 0.4 ? 3 : 2) : n === 5 ? 4 : 6;
    for (var tries = 0; tries < 800; tries++) {
      var cells = [], i;
      for (i = 1; i < N; i++) cells.push(i);
      for (i = cells.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
      var far = cells.filter(function (c) { return manhattan(n, 0, c) >= n - 1; });
      var gold = far[0];
      if (gold === undefined) continue;
      var rest = cells.filter(function (c) { return c !== gold; });
      var wumpus;
      var nb = neighbours(n, gold).filter(function (c) { return c !== 0; });
      if (rnd() < 0.6 && nb.length) wumpus = nb[Math.floor(rnd() * nb.length)];
      else wumpus = rest[0];
      var pits = rest.filter(function (c) { return c !== wumpus; }).slice(0, nPits);
      var w = makeWorld(n, { start: 0, gold: gold, wumpus: wumpus, pits: pits, blocks: blocks });
      if (run(w, 'bfs').found) return w;
    }
    return makeWorld(n, { start: 0, gold: N - 1, wumpus: N - 2, pits: [], blocks: blocks });
  }

  var api = { mulberry32: mulberry32, sq: sq, px: px, py: py, manhattan: manhattan, neighbours: neighbours,
              makeWorld: makeWorld, assignmentWorld: assignmentWorld, successors: successors,
              pddlAction: pddlAction, toPddlProblem: toPddlProblem, search: search, genWorld: genWorld };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Planner = api;
})(typeof window !== 'undefined' ? window : this);
