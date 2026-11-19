'use strict';
/* =========================================================
   Per-frame fighter update: state machine + physics
   ========================================================= */

function land(f) {
  if (f.state === 'jump') { f.state = 'idle'; f.vx = 0; dust(f.x, GY, 3); }
  else if (f.state === 'attack' && f.atk && f.atk.m.air) { f.atk = null; f.state = 'idle'; f.vx = 0; }
  else if (f.state === 'hit' && f.launched) { f.state = 'knockdown'; f.t = 0; f.launched = false; dust(f.x, GY, 10); SFX.thud(); game.shake = Math.max(game.shake, 4); }
  else if (f.state === 'ko' && f.vy > 5) { f.vy = -f.vy * .35; f.y = GY - 1; dust(f.x, GY, 12); SFX.thud(); return true; } // bounce
  return false;
}

function updFighter(f, o) {
  const I = f.inp, T = f.tap, fight = game.phase === 'fight';
  f.anim++;
  if (f.cool > 0) f.cool--;
  if (f.inv > 0) f.inv--;
  if (f.flash > 0) f.flash--;
  if (f.say) { f.say.t++; if (f.say.t > f.say.life) f.say = null; }
  f.meter = Math.min(100, f.meter);

  let phys = true;
  switch (f.state) {
    case 'idle': case 'walk': case 'crouch': {
      f.t++;
      if (!fight) { f.state = 'idle'; f.vx = 0; break; }
      if (o.x !== f.x) f.face = sgn(o.x - f.x);
      if (T.x && f.meter >= 100) { startSuper(f); break; }
      if (T.s && f.cool <= 0) { startSkill(f); break; }
      if (I.u) { f.state = 'jump'; f.vy = -f.ch.jump; f.vx = ((I.r ? 1 : 0) - (I.l ? 1 : 0)) * f.ch.spd * 1.15; f.y -= 1; SFX.jump(); break; }
      if (I.d) { f.state = 'crouch'; f.vx = 0; if (T.p) startAtk(f, 'cpunch'); else if (T.k) startAtk(f, 'sweep'); break; }
      if (T.p) { startAtk(f, 'punch'); break; }
      if (T.k) { startAtk(f, 'kick'); break; }
      const dir = (I.r ? 1 : 0) - (I.l ? 1 : 0);
      f.vx = dir * f.ch.spd * (dir === f.face ? 1 : .75); // walking backwards is slower
      f.state = dir ? 'walk' : 'idle';
      break;
    }
    case 'jump': if (fight) { if (T.p) startAtk(f, 'jpunch'); else if (T.k) startAtk(f, 'jkick'); } break;
    case 'attack': runAtk(f, o); break;
    case 'hit':
      f.t++; f.vx *= .9;
      if (!f.air && !f.launched && f.t >= f.hs) { toIdle(f); o.combo = 0; }
      else if (f.launched && !f.air && f.vy === 0 && f.t > 2) { f.state = 'knockdown'; f.t = 0; f.launched = false; }
      break;
    case 'block': f.t++; f.vx *= .85; if (f.t >= f.bs) toIdle(f); break;
    case 'stun': f.t++; f.vx *= .8; if (f.t >= f.stunT) { toIdle(f); o.combo = 0; } break;
    case 'knockdown': f.t++; f.vx *= .85; f.inv = 2; if (f.t >= 48) { f.state = 'getup'; f.t = 0; } break;
    case 'getup': f.t++; f.inv = 2; if (f.t >= 14) { toIdle(f); o.combo = 0; f.inv = 8; } break;
    case 'skill': f.ch.skillMove(f, o, ++f.t, f.data); break;
    case 'super': f.ch.superMove(f, o, ++f.t, f.data); break;
    // held by the opponent (command grab, barrage): released if they stop holding
    case 'grabbed': case 'locked':
      phys = false; f.t++;
      if (!o.data.holding) { f.state = 'hit'; f.t = 0; f.hs = 10; f.rot = 0; f.launched = f.air; phys = true; }
      break;
    case 'ko': f.vx *= .96; break;
    case 'win': f.t++; f.vx = 0; break;
    default: // character-specific states (e.g. Meno's counter)
      if (f.ch.states && f.ch.states[f.state]) f.ch.states[f.state](f, o);
  }

  if (phys && !f.data.under) {
    if (f.air || f.vy < 0) { f.vy += GRAV; f.y += f.vy; }
    f.x += f.vx;
    if (f.y >= GY) { f.y = GY; const bounced = f.vy > 0 && land(f); if (!bounced) f.vy = 0; }
  }
  f.x = clamp(f.x, LW, RW);
  f.trail.unshift({ x: f.x, y: f.y }); if (f.trail.length > 8) f.trail.pop(); // for afterimages
}

/** Fighters can't overlap on the ground */
function pushApart(a, b) {
  const skip = f => ['grabbed', 'locked', 'ko', 'knockdown'].includes(f.state) || f.data.under;
  if (skip(a) || skip(b) || Math.abs(a.y - b.y) > 70) return;
  const dx = b.x - a.x, min = 48 * (a.ch.scale + b.ch.scale) / 2;
  if (Math.abs(dx) >= min) return;
  const s = dx === 0 ? (a.face > 0 ? 1 : -1) : sgn(dx), push = (min - Math.abs(dx)) / 2;
  a.x = clamp(a.x - s * push, LW, RW); b.x = clamp(b.x + s * push, LW, RW);
  if (Math.abs(b.x - a.x) < min - 1) { // one of them is against a wall
    if (a.x <= LW || a.x >= RW) b.x = clamp(a.x + s * min, LW, RW);
    else a.x = clamp(b.x - s * min, LW, RW);
  }
}
