'use strict';
/* =========================================================
   CPU opponent. Produces the same input object a human would.
   Per-fighter tuning lives in each character's `ai` block.
   ========================================================= */

function aiInput(f, o) {
  const I = {}, A = f.ai, D = DIFF[game.diff], C = f.ch.ai;
  const dx = o.x - f.x, dist = Math.abs(dx), tw = dx > 0 ? 'r' : 'l', aw = dx > 0 ? 'l' : 'r';
  if (game.phase !== 'fight') return I;

  // cancel a landed normal into the skill
  if (f.state === 'attack' && f.atk && f.atk.hit && f.cool <= 0 && C.cancel && Math.random() < D.spec * .3) { I.s = 1; return I; }

  // the opponent is baiting (Meno's Dramatic Exit): harder CPUs don't fall for it
  if (o.data.bait) {
    if (A.mb == null) A.mb = Math.random() < [.85, .45, .12][game.diff];
    if (!A.mb) return I;
  } else A.mb = null;

  // defend against incoming attacks / projectiles
  const oAtk = (o.state === 'attack' && dist < 230)
    || (o.state === 'skill' && !o.ch.ai.passiveSkill && dist < 300)
    || (o.state === 'super' && !o.data.bait)
    || (o.state === 'skill' && o.data.under);
  const incoming = projs.some(p => p.owner === o && !p.inert && Math.abs(p.x - f.x) < 240 && (p.vx === 0 || sgn(p.vx) === sgn(f.x - p.x)));
  if (oAtk || incoming) {
    if (!A.threat) { A.threat = true; A.blk = Math.random() < D.block; A.parry = C.parry && f.cool <= 0 && Math.random() < D.block * .6; }
    if (A.parry && ['idle', 'walk', 'crouch'].includes(f.state)) { A.parry = false; I.s = 1; return I; }
    if (A.blk && ['idle', 'walk', 'crouch', 'block'].includes(f.state)) {
      I[aw] = 1;
      if (o.atk && (o.atk.name === 'sweep' || o.atk.name === 'cpunch')) I.d = 1;
      return I;
    }
  } else A.threat = false;

  if (!['idle', 'walk', 'crouch', 'jump'].includes(f.state)) return I;

  // pick a new plan every few frames
  if (--A.t <= 0) {
    A.t = D.react + ri(0, 10);
    const rng = C.range;
    let act = 'wait';
    if (f.meter >= 100 && Math.random() < D.spec && C.superOK(dist, f, o)) act = 'x';
    else if (f.cool <= 0 && Math.random() < D.spec && C.skillOK(dist, f, o)) act = 's';
    else if (dist < (rng > 150 ? 150 : 100) && Math.random() < C.aggr * D.aggr) act = pick(['p', 'k', 'dp', 'dk', 'p', 'k']);
    else if (dist > rng + 35) act = Math.random() < .08 ? 'jumpin' : 'fwd';
    else if (dist < rng - 35 && rng > 150) act = 'back';
    else act = Math.random() < .1 ? 'jumpin' : Math.random() < .5 ? 'fwd' : 'wait';
    A.act = act; A.f = 0; A.kicked = false;
  }
  A.f++;

  // execute the plan
  switch (A.act) {
    case 'fwd': I[tw] = 1; break;
    case 'back': I[aw] = 1; break;
    case 'jumpin':
      if (!f.air && A.f < 3) { I.u = 1; I[tw] = 1; }
      else if (f.air && dist < 140 && !A.kicked) { I.k = 1; A.kicked = true; }
      break;
    case 'p': if (A.f === 1) I.p = 1; break;
    case 'k': if (A.f === 1) I.k = 1; break;
    case 'dp': I.d = 1; if (A.f === 2) I.p = 1; break;
    case 'dk': I.d = 1; if (A.f === 2) I.k = 1; break;
    case 's': if (A.f === 1) I.s = 1; break;
    case 'x': if (A.f === 1) I.x = 1; break;
  }
  return I;
}
