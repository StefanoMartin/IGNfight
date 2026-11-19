'use strict';
/* =========================================================
   menoDZero — Heavy Counter / Stance
   Fights with his hands in his pockets.
   Skill: Parry Stance (catch an attack, counter-slash)
   Super: Dramatic Exit — walks away "forever"; hit him and he teleports back
   ========================================================= */

/** Called by combat.js before any hit lands on Meno. Returns true if he absorbs it. */
function menoIntercept(m, a) {
  if (m.state === 'skill' && m.data.parry) { menoCounter(m, a, false); return true; }
  if (m.state === 'super' && m.data.exiting) { menoCounter(m, a, true); return true; }
  return false;
}

function menoCounter(m, a, isSuper) {
  m.data = {}; m.state = 'mcounter'; m.t = 0; m.inv = 45; m.vx = 0; m.cd = { sup: isSuper, slash: true };
  if (isSuper) { // "Sono tornato!" — teleport behind the attacker
    chunks(m.x, m.y - 90, 20, '#ff2a3a');
    let nx = a.x - a.face * 70; if (nx < LW || nx > RW) nx = a.x + a.face * 70;
    m.x = clamp(nx, LW, RW);
    chunks(m.x, m.y - 90, 20, '#ff2a3a');
    game.redFlash = 14; m.say = { s: 'SONO TORNATO!', t: 0, life: 80 }; say('Sono tornato!', 'it-IT', 1, 1.15);
  } else {
    popText(m.x, m.y - 175, 'PARRY!', '#fff', 28);
    if (Math.abs(a.x - m.x) < 230) m.x = clamp(a.x - sgn(a.x - m.x) * 62, LW, RW);
    else m.cd.slash = false; // parried a projectile from far away
  }
  m.face = sgn(a.x - m.x) || m.face;
  if (['attack', 'skill', 'super'].includes(a.state)) { a.state = 'hit'; a.t = 0; a.hs = 24; a.atk = null; a.data = {}; a.vx = 0; a.armor = 0; }
  hitstop(10); SFX.special();
}

function menoSlash(x, y, face) {
  fx.push({
    x, y, face, t: 0, life: 14,
    draw(e) {
      const p = e.t / e.life;
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1); ctx.globalAlpha = 1 - p; ctx.lineCap = 'round';
      ctx.shadowColor = '#f00'; ctx.shadowBlur = 20; ctx.lineWidth = 16 * (1 - p) + 2; ctx.strokeStyle = '#ff2a3a';
      ctx.beginPath(); ctx.arc(-20, 0, 85, -1.4 + p * .5, 1.2 + p * .5); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
    }
  });
}

registerFighter({
  id: 'meno', name: 'menoDZero', spoken: 'Meno D Zero', tag: 'The Drama King', style: 'Heavy Counter / Stance',
  hp: 1100, spd: 3.5, jump: 14, kbm: .8, pow: 1.3,
  color: '#2a2f5c', accent: '#d1222f', uiColor: '#ff4a55',
  rig: { ul: 38, ll: 38, tl: 56, au: 30, al: 28, hr: 15 },
  frameData: { spd: 1.2, dmg: 1.3 },
  skill: 'PARRY STANCE', skillDesc: 'Catches an incoming attack and answers with a counter-slash.', skillCooldown: 35,
  super: 'DRAMATIC EXIT', superSay: '', superDesc: '"I\'m leaving forever!" Attack him while he walks away... if you dare.',
  win: ['Prevedibile.', 'Me ne vado. ...Domani torno.', 'You fought well. For a commoner.'],
  ai: { range: 130, aggr: .35, parry: true, passiveSkill: true, superOK: d => d < 350 },
  winArm: [2.3, 3.5], winKeepsPocket: true,
  invulnStates: ['mcounter'],
  intercept: menoIntercept,

  skillMove(f, o, t, d) { d.parry = t >= 2 && t <= 32; if (t >= 46) toIdle(f); },

  superMove(f, o, t, d) {
    if (t === 1) {
      d.exiting = true; d.bait = true; // bait: the CPU knows this might be a trap
      f.say = { s: 'Lascio il forum. PER SEMPRE.', t: 0, life: 130 }; say('Lascio il forum. Per sempre.', 'it-IT', .9, 1);
    }
    if (d.exiting) {
      f.face = -sgn(o.x - f.x); f.vx = f.face * 2.3; // turns his back and walks off
      if (t >= 180) { // nobody took the bait
        d.exiting = false; f.vx = 0; f.meter = 40;
        f.say = { s: '...vabbè, sono tornato.', t: 0, life: 100 };
        toIdle(f); f.face = sgn(o.x - f.x);
      }
    }
  },

  states: {
    mcounter(m, o) {
      const t = ++m.t; m.inv = Math.max(m.inv, 2);
      if (t === 9 && m.cd && m.cd.slash) {
        menoSlash(m.x + m.face * 40, m.y - 90, m.face);
        if (hittable(o) && Math.abs(o.x - m.x) < 170)
          hitRes(m, o, { dmg: m.cd.sup ? 280 : 110, grab: true, kd: true, kb: 9, hs: 30, noScale: true, super: m.cd.sup, snd: 'heavy' }, null, m.face);
      }
      if (t >= 30) { m.inv = 6; m.cd = null; toIdle(m); }
    }
  },

  basePose(P) { pocket(P); },
  pose(f, P) {
    if (f.state === 'mcounter') {
      P.lean = .3; P.fa = f.t < 8 ? [2.8, 3.1] : [1.0, .7]; P.pb = true; P.ba = [-.05, .3]; P.fl = [.75, .2]; P.bl = [-.65, -.35];
      return;
    }
    pocket(P);
    if (f.state === 'skill') { P.pf = false; P.fa = [1.3, 2.2]; }
    else walkP(P, f.anim, .14);
  },

  face: { skin: '#f0c4a4', hair: '#141418', hairLight: '#3a4060', style: 'slick', eyes: '#5a3a2a', acc: ['shades'], shadesTint: '#ff3a4a', expr: 'smirk', attackExpr: 'smirk' },
  bust: { base: '#2a2f5c', collar: 'blazer', scarf: '#d1222f' },
  look: {
    tw: [14, 18], // torso half-widths at hip / shoulders (for the cel shading pass)
    lw: 11, aw: 11, legC: '#181a2b', legD: '#10121e', armC: '#2a2f5c', armD: '#1d2045',
    glow: f => f.state === 'mcounter' || !!f.data.exiting,
    behind(f, P, J) { // dramatic red scarf
      const s = J.sh, w = Math.sin(f.anim * .18);
      ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x - 2, s.y + 2);
      ctx.bezierCurveTo(s.x - 25, s.y + 5 + w * 6, s.x - 40, s.y - 8 - w * 8, s.x - 62, s.y + 4 + w * 10);
      ctx.lineWidth = 14; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = '#d1222f'; ctx.stroke();
    },
    torso(f, P, J) { // tailored blazer
      quad(J.hip, J.sh, 14, 18, '#2a2f5c');
      const a = lerp(J.hip, J.sh, .55);
      ctx.beginPath(); ctx.moveTo(J.sh.x + 2, J.sh.y); ctx.lineTo(J.sh.x + 12, J.sh.y + 2); ctx.lineTo(a.x + 6, a.y); ctx.closePath();
      ctx.fillStyle = '#eee'; ctx.fill();
      line({ x: J.sh.x + 12, y: J.sh.y + 3 }, { x: a.x + 5, y: a.y + 2 }, 2, '#0d0f19');
      circ(a.x + 6, a.y + 10, 1.8, '#d4af37', 0); circ(a.x + 7, a.y + 20, 1.8, '#d4af37', 0);
      rr(J.sh.x - 11, J.sh.y - 6, 24, 9, 4, '#d1222f');
    },
    hand(e, h) { circ(h.x, h.y, 5.5, '#ecbd9d'); },
    foot(k, ft) { // polished pointed shoes
      ctx.beginPath(); ctx.moveTo(ft.x - 6, ft.y - 9); ctx.lineTo(ft.x + 12, ft.y - 6); ctx.lineTo(ft.x + 20, ft.y); ctx.lineTo(ft.x - 6, ft.y); ctx.closePath();
      ctx.fillStyle = '#050505'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      line({ x: ft.x + 2, y: ft.y - 5 }, { x: ft.x + 10, y: ft.y - 4 }, 1.5, 'rgba(255,255,255,.55)');
    }
  }
});
