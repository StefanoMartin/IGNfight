'use strict';
/* =========================================================
   Combat: hitboxes, hit resolution, blocking, KO, normal attacks
   ========================================================= */

function hittable(o) {
  return o.inv <= 0
    && !['knockdown', 'getup', 'ko', 'win'].includes(o.state)
    && !(o.ch.invulnStates || []).includes(o.state)
    && !o.data.under;
}

/** Hitbox [x, y, w, h] (relative to the feet, facing right) -> world rectangle */
function wbox(f, hb) { return { x: f.face > 0 ? f.x + hb[0] : f.x - hb[0] - hb[2], y: f.y + hb[1], w: hb[2], h: hb[3] }; }

function hurt(f) {
  const s = f.ch.scale, w = (f.ch.bodyWidth || 24) * s;
  const low = f.state === 'crouch' || f.state === 'getup'
    || (f.atk && (f.atk.name === 'cpunch' || f.atk.name === 'sweep'))
    || (f.state === 'skill' && f.ch.lowDuringSkill);
  const h = (low ? 110 : 150) * s;
  return { x: f.x - w, y: f.y - h, w: w * 2, h };
}

function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function hurtHP(d, n) { d.hp = Math.max(0, d.hp - n); }

/** Character hook: lets the defender absorb a hit (e.g. Meno's parry). */
function intercept(d, a) { return !!(d.ch.intercept && d.ch.intercept(d, a)); }

/** Melee check: returns 'miss' or the hitRes result */
function tryHit(f, o, hb, m) {
  const b = wbox(f, hb);
  if (!hittable(o) || !overlap(b, hurt(o))) return 'miss';
  return hitRes(f, o, m, b, f.face);
}

/**
 * Applies move m from attacker a to defender d.
 * dir = direction the hit travels (+1 right, -1 left).
 * Returns 'none' | 'parry' | 'armor' | 'block' | 'hit'.
 * Move flags: grab (unblockable), super, noScale (no combo damage scaling),
 *             launch, kd (knockdown), stun (frames), stunIcon (drawn over the head)
 */
function hitRes(a, d, m, box, dir) {
  if (game.phase !== 'fight') return 'none';
  if (intercept(d, a)) return 'parry';

  const hb = hurt(d);
  const sx = box ? clamp(box.x + box.w / 2, hb.x, hb.x + hb.w) : d.x - dir * 15;
  const sy = box ? clamp(box.y + box.h / 2, hb.y + 10, hb.y + hb.h - 10) : d.y - 100;

  // super armor: take half damage, keep going
  if (d.armor > 0 && !m.grab && !m.super) {
    d.armor = 0; hurtHP(d, m.dmg * .5); d.flash = 8;
    popText(d.x, d.y - 175, 'ARMOR!', '#ffb347', 22); SFX.heavy(); hitstop(5); spark(sx, sy, '#fff', 10);
    checkKO(d, a); return 'armor';
  }

  // block: holding away from the attack
  const canBlock = !m.grab && !d.air && ['idle', 'walk', 'crouch', 'block'].includes(d.state) && (dir > 0 ? d.inp.r : d.inp.l);
  if (canBlock) {
    d.state = 'block'; d.t = 0; d.bs = m.bs || 10; d.vx = dir * (m.kb || 3) * .8; d.atk = null;
    hurtHP(d, m.dmg * (m.super ? .2 : .06)); // chip damage
    a.meter += 4; d.meter += 6;
    SFX.block(); spark(sx, sy, '#8fd3ff', 8); hitstop(4);
    checkKO(d, a); return 'block';
  }

  // clean hit
  let dm = m.dmg;
  if (!m.noScale) dm *= Math.max(.35, 1 - .12 * a.combo);
  a.combo++; hurtHP(d, dm);
  a.meter += dm * .2; d.meter += dm * .14;
  if (a.ch.onHitLanded) a.ch.onHitLanded(a);

  d.atk = null; d.data = {}; d.armor = 0; d.rot = 0; d.cd = null;
  if (m.stun) { d.state = 'stun'; d.t = 0; d.stunT = m.stun; d.stunIcon = m.stunIcon || null; d.vx = 0; }
  else {
    d.state = 'hit'; d.t = 0; d.hs = m.hs || 16; d.vx = dir * (m.kb || 3) * d.ch.kbm; d.face = -dir;
    if (m.launch || d.air) { d.vy = -(m.launch || 6); d.launched = true; if (d.y >= GY) d.y = GY - 1; }
    if (m.kd) { d.vy = Math.min(d.vy, -5); d.launched = true; if (d.y >= GY) d.y = GY - 1; }
  }

  d.flash = 6;
  const big = dm >= 60;
  hitstop(big ? 9 : 6); game.shake = Math.max(game.shake, big ? 7 : 3);
  spark(sx, sy, big ? '#ffd23a' : '#fff', big ? 16 : 9);
  (SFX[m.snd] || SFX.light)();
  if (a.combo >= 2) game.combo[a.idx] = { n: a.combo, t: 70 };
  checkKO(d, a);
  return 'hit';
}

function checkKO(d, a) {
  if (d.hp > 0 || d.state === 'ko') return;
  d.hp = 0; d.state = 'ko'; d.vy = -9; d.vx = sgn(d.x - a.x) * 5; d.y = Math.min(d.y, GY - 1);
  d.launched = false; d.data = {}; d.atk = null; d.rot = 0;
  onKO(d, a);
}

function onKO(d, a) {
  if (game.phase !== 'fight') return;
  game.phase = 'ko'; game.pt = 0; game.koText = 'K.O.'; game.winner = a.hp > 0 ? a : null;
  SFX.ko(); say('K.O.', 'en-US', .4, .8); hitstop(18); game.shake = 12;
}

/* ---------- normal attacks ---------- */
function startAtk(f, name, m) {
  m = m || f.ch.moves[name];
  f.atk = { name, m, fr: 0, hit: false, id: ++game.aid };
  f.state = 'attack'; f.t = 0;
  if (f.ch.armor && (name === 'kick' || name === 'punch')) f.armor = 1;
  if (!m.air) f.vx *= .3;
}

function runAtk(f, o) {
  const a = f.atk; if (!a) { toIdle(f); return; }
  const m = a.m;
  a.fr++;
  if (!m.air && !f.air) f.vx *= .8;
  if (a.fr > m.su) f.armor = 0;
  if (a.fr === m.su + 1) SFX.whoosh();
  if (!a.hit && a.fr > m.su && a.fr <= m.su + m.ac) {
    const r = tryHit(f, o, m.hb, m);
    if (f.atk !== a) return; // interrupted (e.g. parried)
    if (r !== 'miss') a.hit = true;
  }
  // a landed ground attack can be cancelled into skill / super
  if (a.hit && !m.air && a.fr >= m.su + m.ac) {
    if (f.tap.x && f.meter >= 100) { startSuper(f, o); return; }
    if (f.tap.s && f.cool <= 0) { startSkill(f); return; }
  }
  if (a.fr >= m.su + m.ac + m.re) toIdle(f);
}

function toIdle(f) {
  f.state = f.air ? 'jump' : 'idle'; f.t = 0; f.data = {}; f.atk = null; f.armor = 0; f.rot = 0;
  if (!f.air) f.vx = 0;
}

/* ---------- skill / super entry points (the moves live in the character files) ---------- */
function startSkill(f) {
  f.state = 'skill'; f.t = 0; f.data = {}; f.atk = null; f.vx = 0;
  f.cool = f.ch.skillCooldown || 60;
  SFX.whoosh();
}

function startSuper(f) {
  f.meter = 0; f.state = 'super'; f.t = 0; f.data = {}; f.atk = null; f.vx = 0;
  game.freeze = 42; game.freezeF = f; game.superName = f.ch.super; // cinematic pause + banner
  SFX.superfl();
  if (f.ch.superSay) say(f.ch.superSay, 'en-US', .6, 1.05);
}
