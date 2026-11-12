// node web/test_planner.js
const P = require('./planner.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('FAIL', m); } };

function replay(w, plan) {
  let p = w.start, g = false, a = true, wa = true, goldOn = true;
  for (const act of plan) {
    if (act.type === 'move') {
      if (!w.adj[p].includes(act.to) || w.pit[act.to] || act.from !== p) return false;
      if (w.blocks && wa && act.to === w.wumpus) return false;
      p = act.to;
    } else if (act.type === 'take') {
      if (!(goldOn && p === w.gold)) return false; g = true; goldOn = false;
    } else if (act.type === 'shoot') {
      if (!(a && wa && w.adj[p].includes(w.wumpus))) return false; a = false; wa = false;
    } else return false;
  }
  return g && p === w.start;
}

const aw = P.assignmentWorld(true);
for (const algo of ['bfs', 'astar', 'greedy']) {
  const r = P.search(aw, algo);
  ok(r.found && replay(aw, r.plan), 'assignment world ' + algo);
}
console.log('assignment world plan:', P.search(aw, 'astar').plan.map(a => P.pddlAction(aw, a)).join(' '));

let shots = 0, total = 0;
for (const n of [4, 5, 6]) for (const blocks of [true, false]) for (let seed = 1; seed <= 150; seed++) {
  const w = P.genWorld(n, seed * 7919, blocks);
  const r = { bfs: P.search(w, 'bfs'), astar: P.search(w, 'astar'), greedy: P.search(w, 'greedy') };
  total++;
  for (const k in r) ok(r[k].found && replay(w, r[k].plan), `${k} valid n=${n} seed=${seed} blocks=${blocks}`);
  ok(r.astar.plan.length === r.bfs.plan.length, `astar optimal n=${n} seed=${seed}`);
  ok(r.greedy.plan.length >= r.bfs.plan.length, 'greedy >= optimal');
  ok(r.astar.expanded <= r.bfs.expanded, `astar expands <= bfs n=${n} seed=${seed}`);
  if (r.astar.plan.some(a => a.type === 'shoot')) shots++;
}
console.log(`worlds tested: ${total}, plans that shoot the wumpus: ${shots}`);
console.log(fails ? fails + ' FAILURES' : 'ALL TESTS PASSED');
process.exit(fails ? 1 : 0);
