'use strict';
/* =========================================================
   TALPAMAN — All-Rounder / Trap Setter
   Skill: Burrow (dig, travel underground, pop-up uppercut behind the foe)
   Super: Thread Lock & Meme Flood
   ========================================================= */

const TALPA_POPUP = { su: 3, ac: 7, re: 22, dmg: 70, hb: [-5, -165, 62, 170], launch: 12, kb: 3, hs: 30, bs: 14, snd: 'heavy', pose: 'upper' };
const TALPA_EMOJI = ['😂', '🤣', '💀', '😎', '🔥', '🙃', '👀', '🤡'];
const TALPA_CAPTIONS = ['LOL', 'XD', 'GG', 'EPIC', '+1', 'OMG'];

/* ---------- padlock (falls on the opponent and stuns) ---------- */
function talpaLockShape() {
  ctx.lineWidth = 9; ctx.strokeStyle = OL; ctx.beginPath(); ctx.arc(0, -8, 15, Math.PI, 0); ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = '#cfd5e0'; ctx.stroke();
  rr(-25, -8, 50, 38, 6, '#e8b830', 3); circ(0, 6, 5, '#3a2a00', 0);
  ctx.fillStyle = '#3a2a00'; ctx.fillRect(-2, 6, 4, 12);
}
function talpaSpawnLock(f) {
  const tg = other(f);
  addProj({
    owner: f, x: tg.x, y: -40, vx: 0, vy: 0, w: 54, h: 62,
    m: { dmg: 60, grab: true, stun: 85, stunIcon: talpaLockShape, super: true, noScale: true, snd: 'heavy' },
    upd(p) {
      const tg = other(p.owner);
      if (!p.landed) {
        if (p.y < 160) p.x += (tg.x - p.x) * .15; // tracks the target while high up
        p.vy += .75; p.y += p.vy;
        if (p.y >= GY - 31) { p.y = GY - 31; p.landed = p.t; game.shake = Math.max(game.shake, 6); SFX.thud(); dust(p.x, GY, 12); }
      } else {
        if (p.t - p.landed > 2) p.inert = true;
        if (p.t - p.landed > 30) p.alive = false;
      }
    },
    draw(p) {
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.landed) ctx.globalAlpha = Math.max(0, 1 - (p.t - p.landed) / 30);
      talpaLockShape(); ctx.restore();
    },
    onDie(p) { popText(p.x, p.y - 120, 'THREAD LOCKED!', '#ffd23a', 26); chunks(p.x, p.y, 10, '#e8b830'); }
  });
}

/* ---------- meme cards ---------- */
function talpaSpawnMeme(f) {
  addProj({
    owner: f, x: f.x + f.face * 50, y: f.y - rand(45, 125), vx: f.face * 12.5, vy: 0, w: 46, h: 44,
    e: pick(TALPA_EMOJI), c: pick(TALPA_CAPTIONS), bg: pick(['#ffd23a', '#7cf', '#f7a', '#9f7', '#c9f']), rot: rand(-.3, .3),
    m: { dmg: 22, kb: 2, hs: 24, bs: 8, launch: 7, noScale: true, super: true, snd: 'light' },
    draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + Math.sin(p.t * .3) * .15);
      rr(-23, -22, 46, 44, 3, '#fff', 2); ctx.fillStyle = p.bg; ctx.fillRect(-19, -18, 38, 28);
      txt(p.e, 0, -4, 20, '#000', 'center', 'sans-serif'); txt(p.c, 0, 16, 10, '#111');
      ctx.restore();
    },
    onDie(p) { spark(p.x, p.y, p.bg, 8); }
  });
}

registerFighter({
  id: 'talpa', name: 'TALPAMAN', spoken: 'Talpaman', tag: 'The Stage Police', style: 'All-Rounder / Trap Setter',
  hp: 1000, spd: 4.3, jump: 15.5, kbm: 1, scale: .95, pow: 1,
  color: '#6a5146', accent: '#f0a3a8', uiColor: '#f0a3a8',
  rig: { ul: 32, ll: 32, tl: 52, au: 27, al: 25, hr: 17 },
  frameData: { spd: 1, dmg: 1 },
  lowDuringSkill: true,
  skill: 'BURROW', skillDesc: 'Dig underground and pop up behind the opponent with an uppercut.', skillCooldown: 140,
  super: 'THREAD LOCK & MEME FLOOD', superSay: 'Thread lock!', superDesc: 'A padlock stuns the foe, then a wave of Immagini Divertenti juggles them.',
  win: ['Thread locked. Next.', 'This fight broke rule 4. Banned.', '*adjusts sunglasses*'],
  ai: { range: 110, aggr: .5, superOK: d => d < 600, skillOK: d => d > 140 && d < 480 },

  skillMove(f, o, t, d) {
    if (t <= 14) { // sinking into the floor
      d.sink = t * 7; f.inv = 2; f.vx = 0;
      if (t % 3 === 0) dust(f.x, GY, 4);
      return;
    }
    // underground: travel to the far side of the opponent
    d.under = true; d.sink = 0; f.inv = 2;
    if (d.side == null) d.side = o.x > f.x ? 1 : -1;
    let tx = o.x + d.side * 80;
    if (tx > RW - 5 || tx < LW + 5) tx = o.x - d.side * 80;
    tx = clamp(tx, LW, RW);
    const dx = tx - f.x;
    f.x += clamp(dx, -11, 11);
    if (t % 3 === 0) dust(f.x, GY, 2);
    if (Math.abs(dx) < 3 || t > 75) { // pop up!
      f.face = sgn(o.x - f.x); dust(f.x, GY, 16); SFX.heavy(); game.shake = Math.max(game.shake, 4);
      f.data = {}; f.y = GY - 1; f.vy = -7;
      startAtk(f, 'popup', TALPA_POPUP);
    }
  },

  superMove(f, o, t) {
    if (t === 8) { talpaSpawnLock(f); popText(f.x, f.y - 190, 'THREAD LOCK!', '#ffd23a', 26); }
    if (t >= 42 && t <= 98 && (t - 42) % 7 === 0) {
      if (t === 42) { popText(f.x, f.y - 205, 'IMMAGINI DIVERTENTI!', '#7cf', 24); say('Immagini divertenti!', 'it-IT', .8, 1.1); }
      talpaSpawnMeme(f); SFX.whoosh();
    }
    if (t >= 112) toIdle(f);
  },

  pose(f, P) {
    const t = f.t;
    if (f.state === 'skill') { crouchP(P); P.fa = [1.3, .6]; P.ba = [1.1, .5]; }
    else if (t < 40) { P.fa = [2.9, 3.1]; P.ba = [.4, 2.5]; }
    else { const k = (t % 7) < 3; P.fa = k ? [1.57, 1.5] : [.5, 2.3]; P.lean = .1; }
  },

  face: { species: 'mole', fur: '#6a5146', furLight: '#9a7a66', shadesTint: '#9ef', expr: 'cool' },
  bust: { base: '#6a5146', collar: 'fur' },
  look: {
    tw: [15, 17], // torso half-widths at hip / shoulders (for the cel shading pass)
    lw: 14, aw: 11, legC: '#6a5146', legD: '#45372f', armC: '#6a5146', armD: '#45372f',
    behind(f, P, J) { // pixel Ban Hammer on the back
      const m = lerp(J.hip, J.sh, .55);
      ctx.save(); ctx.translate(m.x - 13, m.y); ctx.rotate(-.45 + P.lean);
      rr(-3, -62, 7, 96, 3, '#8a5a32'); ctx.translate(0, -72);
      for (let i = -3; i < 3; i++) for (let j = -2; j < 2; j++) { ctx.fillStyle = (i + j) & 1 ? '#c3c8d4' : '#9aa1b3'; ctx.fillRect(i * 7, j * 7, 7, 7); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.strokeRect(-21, -14, 42, 28);
      ctx.scale(f.face || 1, 1); txt('BAN', 0, 1, 11, '#e0262f', 'center', 'monospace', 0, OL, 'bold');
      ctx.restore();
    },
    torso(f, P, J) {
      quad(J.hip, J.sh, 15, 17, '#6a5146');
      const c = lerp(J.hip, J.sh, .45); ell(c.x + 6, c.y, 8, 16, P.lean, '#9a8573', 0);
      line({ x: J.sh.x + 9, y: J.sh.y + 3 }, { x: J.hip.x - 13, y: J.hip.y - 3 }, 4, '#6b3f1e'); // satchel strap
      ctx.save(); ctx.translate(J.hip.x - 17, J.hip.y + 1); // satchel full of printed memes
      rr(-9, -17, 12, 14, 1, '#f4f1e6', 1.5); rr(-2, -19, 12, 14, 1, '#fffbe8', 1.5);
      rr(-15, -8, 25, 19, 4, '#7a4a24'); rr(-15, -8, 25, 7, 3, '#93603a');
      ctx.restore();
    },
    hand(e, h) { circ(h.x, h.y, 6, '#f0a3a8'); },
    foot(k, ft) { ell(ft.x + 6, ft.y - 3, 11, 5, 0, '#e89aa0'); },
    armDeco(f, s, e, h, front) { // moderator armband
      if (!front) return;
      limb([lerp(s, e, .3), lerp(s, e, .72)], 11, '#f2f2f2');
      line(lerp(s, e, .46), lerp(s, e, .56), 11, '#111', 'butt');
    }
  }
});
