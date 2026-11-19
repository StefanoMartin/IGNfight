'use strict';
/* =========================================================
   Generic projectile system.
   A projectile: {owner, x, y (centre), w, h, vx, vy, m (move),
                  draw(p), upd?(p), onHit?(p, target), onDie?(p), inert?}
   Specific projectiles are created in the character files.
   ========================================================= */

function addProj(p) { p.t = 0; p.alive = true; projs.push(p); return p; }
function projBox(p) { return { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h }; }

function updProjs() {
  for (const p of projs) {
    p.t++;
    if (p.upd) p.upd(p); else { p.x += p.vx; p.y += p.vy || 0; }
    if (p.x < -250 || p.x > W + 250) p.alive = false;
    if (!p.alive || p.inert) continue;
    const tg = other(p.owner);
    if (!hittable(tg) || !overlap(projBox(p), hurt(tg))) continue;
    if (p.onHit) { p.onHit(p, tg); continue; }
    const r = hitRes(p.owner, tg, p.m, projBox(p), sgn(tg.x - p.owner.x));
    if (r !== 'none') { p.alive = false; if (p.onDie) p.onDie(p); }
  }
  projs = projs.filter(p => p.alive);
}
