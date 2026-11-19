'use strict';
/* =========================================================
   Fighter rendering: pose -> skeleton (rig) -> drawn body.
   Angles are measured from "pointing straight down";
   +PI/2 points forward (towards where the fighter faces).
   P.fa / P.ba = front / back arm [upper, lower]
   P.fl / P.bl = front / back leg [thigh, shin]
   ========================================================= */

function P0() { return { lean: .08, fa: [.75, 2.45], ba: [.45, 2.6], fl: [.38, .12], bl: [-.38, -.2], head: 0, pf: false, pb: false, hipY: null, rot: 0, dy: 0 }; }
function walkP(P, t, s) {
  const p = t * s;
  P.fl = [.05 + .42 * Math.sin(p), -.1 + .42 * Math.sin(p) - .4 * Math.max(0, Math.cos(p))];
  P.bl = [.05 - .42 * Math.sin(p), -.1 - .42 * Math.sin(p) - .4 * Math.max(0, -Math.cos(p))];
}
function crouchP(P) { P.fl = [1.2, -.3]; P.bl = [-1.15, .3]; P.lean = .35; }
function pocket(P) { P.pf = P.pb = true; P.fa = [.15, .4]; P.ba = [-.05, .3]; P.lean = -.04; } // hands in pockets

function getPose(f) {
  const P = P0(), t = f.anim, ch = f.ch;
  if (ch.basePose) ch.basePose(P);
  switch (f.state) {
    case 'idle': P.dy = Math.sin(t * .12) * 1.5; break;
    case 'walk': walkP(P, t, .22 * sgn(f.vx * f.face)); break;
    case 'crouch': case 'getup': crouchP(P); break;
    case 'jump': P.fl = [1.2, -.15]; P.bl = [.45, -.9]; break;
    case 'block': P.pf = P.pb = false; P.lean = -.12; P.fa = [1.05, 3.0]; P.ba = [.85, 2.9]; break;
    case 'hit': case 'grabbed': case 'locked':
      P.pf = P.pb = false; P.lean = -.35; P.fa = [-.6, .1]; P.ba = [-.9, -.3]; P.head = -.3;
      if (f.air) { P.fl = [.7, .2]; P.bl = [-.1, -.5]; }
      break;
    case 'stun': P.pf = P.pb = false; P.lean = -.05 + Math.sin(t * .3) * .1; P.fa = [.1, 0]; P.ba = [-.1, 0]; P.head = Math.sin(t * .25) * .35; break;
    case 'knockdown': case 'ko': P.rot = -Math.PI / 2; P.lean = 0; P.fl = [.15, .05]; P.bl = [-.05, 0]; P.fa = [.4, 1.5]; P.ba = [-.3, -1.2]; P.pf = P.pb = false; break;
    case 'win': P.pf = false; P.fa = ch.winArm || [2.95, 3.1]; if (!ch.winKeepsPocket) P.pb = false; break;
    case 'attack': atkPose(f, P); break;
    default: // skill, super and any custom state belong to the character file
      P.pf = P.pb = false;
      if (ch.pose) ch.pose(f, P);
  }
  return P;
}

function atkPose(f, P) {
  const a = f.atk; if (!a) return;
  const m = a.m, fr = a.fr, wind = fr <= m.su, ext = !wind && fr <= m.su + m.ac + Math.ceil(m.re * .45);
  switch (m.pose) {
    case 'punch': P.pf = false; if (wind) P.fa = [.3, 2.7]; else if (ext) { P.fa = [1.57, 1.57]; P.lean = .22; if (!P.pb) P.ba = [.15, 2.1]; } break;
    case 'kick': P.lean = -.25; if (wind) P.fl = [1.0, -.3]; else if (ext) { P.fl = [1.55, 1.6]; P.bl = [-.12, -.05]; } break;
    case 'cpunch': crouchP(P); P.pf = false; if (ext) P.fa = [1.57, 1.57]; break;
    case 'sweep': crouchP(P); if (ext) { P.fl = [1.45, 1.62]; P.bl = [-1.5, .9]; P.hipY = -26; P.lean = .55; } break;
    case 'jpunch': P.fl = [1.2, -.15]; P.bl = [.45, -.9]; P.pf = false; if (ext) P.fa = [1.2, 1.25]; break;
    case 'jkick': P.bl = [.3, -.9]; if (ext) { P.fl = [1.0, 1.1]; P.lean = -.15; } else P.fl = [1.2, -.15]; break;
    case 'upper': P.pf = P.pb = false; P.lean = .1; P.fa = ext ? [2.85, 3.05] : [.4, 2.5]; P.fl = [.3, .1]; P.bl = [-.5, -.2]; break;
  }
}

/** Turns a pose into joint positions (local space, feet at 0,0, facing +x) */
function rig(f, P) {
  const R = f.ch.rig;
  const fy = Math.cos(P.fl[0]) * R.ul + Math.cos(P.fl[1]) * R.ll, by = Math.cos(P.bl[0]) * R.ul + Math.cos(P.bl[1]) * R.ll;
  const hip = { x: 0, y: (P.hipY != null ? P.hipY : -Math.max(fy, by, 20)) + (P.dy || 0) }; // lowest foot touches the ground
  const fk = seg(hip, P.fl[0], R.ul), ff = seg(fk, P.fl[1], R.ll), bk = seg(hip, P.bl[0], R.ul), bf = seg(bk, P.bl[1], R.ll);
  const sh = { x: hip.x + Math.sin(P.lean) * R.tl, y: hip.y - Math.cos(P.lean) * R.tl };
  const fs = { x: sh.x + 3, y: sh.y + 4 }, bs = { x: sh.x - 5, y: sh.y + 3 };
  const fe = seg(fs, P.fa[0], R.au), fh = seg(fe, P.fa[1], R.al), be = seg(bs, P.ba[0], R.au), bh = seg(be, P.ba[1], R.al);
  const hc = { x: sh.x + Math.sin(P.lean + P.head) * R.hr * 1.25, y: sh.y - Math.cos(P.lean + P.head) * R.hr * 1.25 };
  return { hip, fk, ff, bk, bf, sh, fs, bs, fe, fh, be, bh, hc };
}

const LIMB_BULK = 1.25;  // thicker, rounder limbs
const HEAD_SCALE = 1.15; // slightly bigger anime-style heads

/** Back limbs -> torso -> front leg -> head -> front arm (cel shading on) */
function drawBody(f, P, J) {
  const S = f.ch.look, tw = S.tw || [15, 18];
  const lw = S.lw * LIMB_BULK, aw = S.aw * LIMB_BULK;
  CEL = true;
  if (S.behind) S.behind(f, P, J);
  limb([J.hip, J.bk, J.bf], lw, S.legD); S.foot(J.bk, J.bf, false);
  limb([J.bs, J.be, J.bh], aw, S.armD); if (S.armDeco) S.armDeco(f, J.bs, J.be, J.bh, false); if (!P.pb) S.hand(J.be, J.bh, false);
  S.torso(f, P, J); celTorso(J.hip, J.sh, tw[0], tw[1]);
  limb([J.hip, J.fk, J.ff], lw, S.legC); S.foot(J.fk, J.ff, true);
  ctx.save(); ctx.translate(J.hc.x, J.hc.y); ctx.scale(HEAD_SCALE, HEAD_SCALE); ctx.translate(-J.hc.x, -J.hc.y - 2);
  S.head(f, P, J);
  ctx.restore();
  limb([J.fs, J.fe, J.fh], aw, S.armC); if (S.armDeco) S.armDeco(f, J.fs, J.fe, J.fh, true);
  if (S.front) S.front(f, P, J);
  if (!P.pf) S.hand(J.fe, J.fh, true);
  CEL = false;
}

/** Draws the body at (x, y) with an optional extra CSS filter and opacity (used for afterimages) */
function drawFighterAt(f, P, J, x, y, extraFilter, alpha) {
  ctx.save();
  if (f.data.sink) { ctx.beginPath(); ctx.rect(0, 0, W, GY + 2); ctx.clip(); } // sinking into the floor
  ctx.translate(x, y + (f.data.sink || 0)); ctx.scale(f.face * f.ch.scale, f.ch.scale);
  if (P.rot) { ctx.translate(0, -16); ctx.rotate(P.rot); }               // lying on the floor
  if (f.rot) { ctx.translate(0, -75); ctx.rotate(f.rot); ctx.translate(0, 75); } // spun by a throw
  let fl = extraFilter || '';
  if (f.alt) fl += 'hue-rotate(160deg) ';                                  // mirror match palette
  if (!extraFilter && f.flash > 0 && (f.flash & 2)) fl = 'brightness(0) invert(1) '; // manga white hit flash
  if (!extraFilter && f.ch.look.glow && f.ch.look.glow(f)) fl += 'drop-shadow(0 0 7px #ff2a3a) ';
  if (f.meter >= 100 && game.scene === 'fight' && !extraFilter) fl += 'drop-shadow(0 0 5px ' + f.ch.accent + ') ';
  if (fl) ctx.filter = fl;
  if (alpha != null) ctx.globalAlpha = alpha;
  drawBody(f, P, J);
  ctx.restore();
}

function drawFighter(f) {
  if (f.data.hidden) return; // e.g. Pat_00 off-screen during his super
  if (f.data.under) { drawMound(f); return; }
  // ground shadow (+ glow when the super meter is full)
  const k = Math.max(.3, 1 - (GY - f.y) / 300);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(f.x, GY + 3, 38 * k * f.ch.scale, 8 * k, 0, 0, Math.PI * 2); ctx.fill();
  if (game.scene === 'fight' && f.meter >= 100 && !['ko', 'knockdown'].includes(f.state)) {
    ctx.save(); ctx.globalAlpha = .35 + .2 * Math.sin(frame * .2); ctx.fillStyle = f.ch.accent;
    ctx.beginPath(); ctx.ellipse(f.x, GY + 3, 52, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  const P = getPose(f), J = rig(f, P);
  // afterimages when moving fast
  const tr = f.trail || [];
  if (game.scene === 'fight' && (Math.abs(f.vx) > 7 || f.state === 'mcounter') && tr.length > 6) {
    [[6, .14], [4, .2], [2, .28]].forEach(([i, a]) => drawFighterAt(f, P, J, tr[i].x, tr[i].y, 'brightness(1.3) saturate(2.5) hue-rotate(' + (i * 40) + 'deg) ', a));
  }
  drawFighterAt(f, P, J, f.x, f.y);
}

/** Dirt mound shown while a fighter is underground (Talpaman's Burrow) */
function drawMound(f) {
  const x = f.x;
  ell(x, GY - 2, 32, 13, 0, '#5a3a22'); ell(x - 10, GY - 8, 7, 4, 0, '#6e4a2c', 0); ell(x + 9, GY - 10, 5, 3, 0, '#7b5636', 0);
  rr(x - 6, GY - 15, 18, 6, 2, '#0b0b0b', 0); ctx.fillStyle = '#9ef'; ctx.fillRect(x + 5, GY - 14, 4, 2);
}

/** Square head-and-shoulders portrait (HUD, select screen, title) */
function drawPortrait(ch, x, y, s, flip, alt) {
  ctx.save(); rr(x, y, s, s, 6, '#1c1030', 0); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + s); g.addColorStop(0, ch.accent); g.addColorStop(1, '#1c1030');
  ctx.globalAlpha = .55; ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
  ctx.globalAlpha = .18; ctx.fillStyle = halftone(); ctx.fillRect(x, y + s * .45, s, s);      // screen tone
  ctx.globalAlpha = .14; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;                          // speed lines
  for (let i = 0; i < 7; i++) { const o = (i * 23 + 7) % s; ctx.beginPath(); ctx.moveTo(x + o - s * .3, y + s); ctx.lineTo(x + o + s * .3, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.translate(x + s / 2, y + s * .6); const k = s / 50; ctx.scale((flip ? -1 : 1) * k, k);
  if (alt) ctx.filter = 'hue-rotate(160deg)';
  const fake = { anim: frame, state: 'idle', ch, data: {}, face: 1 }, P = P0(), J = { hc: { x: -5, y: -6 }, sh: { x: -5, y: 16 }, hip: { x: -5, y: 80 } };
  CEL = true; quad(J.hip, J.sh, 18, 21, ch.color); celTorso(J.hip, J.sh, 18, 21); ch.look.head(fake, P, J); CEL = false;
  ctx.restore();
}
