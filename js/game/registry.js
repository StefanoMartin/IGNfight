'use strict';
/* =========================================================
   Fighter registry
   Every file in js/characters/ calls registerFighter({...}).
   The roster order on screen = the order of the <script> tags.

   A fighter definition contains:
     id, name, spoken, tag, style, hp, spd, jump, kbm, scale, pow, color, accent, uiColor
     frameData   {spd, dmg, reach}  multipliers for the normal moves
     rig         optional body proportions (see RIG)
     skill, skillDesc, skillCooldown, skillMove(f,o,t,d)
     super, superDesc, superSay, superMove(f,o,t,d)
     face        anime head config: skin, hair, hairLight, style, eyes, acc[], expr ... (see anime-face.js)
     bust        portrait clothing: base, trim, inner, collar, scarf, emblem, medals
     look        drawing functions: torso, hand, foot, behind?, armDeco?, front?, glow? (head comes from face)
     pose(f,P)   pose for skill / super / custom states
     basePose(P) optional default pose tweak (e.g. hands in pockets)
     ai          {range, aggr, cancel, parry, passiveSkill, superOK(dist,f,o), skillOK(dist,f,o)}
     optional hooks: intercept(d,a), onHitLanded(a), onGotHit(d), onReset(f), tick(f,o),
                     onAttackActive(f,name), movesFor(f), haste(f) 0-3, speedMul(f),
                     drawUI(f), states{name(f,o)}, invulnStates[], armor, bodyWidth,
                     lowDuringSkill, winArm, winKeepsPocket, punishBonus,
                     doubleJump, airSkill, grav (gravity multiplier)
     f.data flags the engine understands: under, hidden, noPhys, sink, holding, bait
   ========================================================= */

const CHARS = [];
const RIG = { ul: 36, ll: 36, tl: 56, au: 30, al: 28, hr: 16 }; // upper/lower leg, torso, upper/lower arm, head radius

/** Normal moves, scaled by a fighter's speed / damage / reach multipliers */
function mkMoves(o) {
  const f = n => Math.max(1, Math.round(n * o.spd)), d = n => Math.round(n * o.dmg), r = o.reach || 0;
  // su = startup frames, ac = active, re = recovery, hb = hitbox [x, y, w, h] relative to the feet
  return {
    punch:  { su: f(5),  ac: 3, re: f(9),  dmg: d(40), hb: [18, -120, 48 + r, 22], kb: 3, hs: 15, bs: 10, snd: 'light', pose: 'punch' },
    kick:   { su: f(9),  ac: 4, re: f(15), dmg: d(70), hb: [15, -84, 68 + r, 26],  kb: 7, hs: 19, bs: 12, snd: 'heavy', pose: 'kick' },
    cpunch: { su: f(5),  ac: 3, re: f(9),  dmg: d(35), hb: [18, -74, 48 + r, 20],  kb: 2, hs: 14, bs: 9,  snd: 'light', pose: 'cpunch' },
    sweep:  { su: f(10), ac: 4, re: f(20), dmg: d(65), hb: [10, -24, 80 + r, 22],  kb: 3, hs: 20, bs: 12, kd: true, snd: 'heavy', pose: 'sweep' },
    jpunch: { su: f(4),  ac: 6, re: f(6),  dmg: d(45), hb: [12, -104, 50 + r, 30], kb: 3, hs: 15, bs: 10, snd: 'light', pose: 'jpunch', air: true },
    jkick:  { su: f(6),  ac: 8, re: f(8),  dmg: d(65), hb: [10, -64, 60 + r, 34],  kb: 5, hs: 18, bs: 11, snd: 'heavy', pose: 'jkick', air: true }
  };
}

function registerFighter(def) {
  def.rig = def.rig || RIG;
  def.scale = def.scale || 1;
  if (def.face && def.look && !def.look.head) // shared anime head (js/render/anime-face.js)
    def.look.head = (f, P, J) => drawAnimeHead(f, J.hc, def.face, def.headR || 14.5);
  def.moves = mkMoves(def.frameData || { spd: 1, dmg: 1 });
  def.ai = Object.assign({
    range: 100, aggr: .5, cancel: false, parry: false, passiveSkill: false,
    superOK: () => true, skillOK: () => false
  }, def.ai);
  CHARS.push(def);
}
