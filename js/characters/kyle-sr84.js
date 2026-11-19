'use strict';
/* =========================================================
   Kyle_SR84 — Slow & Heavy Grappler
   Passive: super armor during standing punch/kick startup
   Skill: Arcade Slam (unblockable command grab)
   Super: Backlog Avalanche (rift above the foe drops game boxes)
   ========================================================= */

const KYLE_BOX_TITLES = ['UNPLAYED', 'SEALED', 'BACKLOG', 'DAY ONE', 'STEELBOOK', 'GOTY ED.', 'DLC PACK', '-90% SALE', 'REMASTER', 'NG+', 'PLATINUM?', 'DELUXE'];

/** Purple rift that hovers over the opponent; lives in the fx list */
function kyleOpenRift(owner, x) {
  const r = {
    owner, x, y: 115, t: 0, life: 125,
    upd(e) { if (e.owner.state === 'super') e.x += (other(e.owner).x - e.x) * .035; },
    draw(e) {
      const s = Math.min(1, e.t / 15) * Math.min(1, (e.life - e.t) / 15);
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(s, s); ctx.shadowColor = '#b04aff'; ctx.shadowBlur = 30;
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 110);
      g.addColorStop(0, '#fff'); g.addColorStop(.25, '#c86bff'); g.addColorStop(1, 'rgba(40,0,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 110, 36, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,255,.7)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 90 - i * 18, 28 - i * 5, 0, frame * .1 + i, frame * .1 + i + 2.2); ctx.stroke(); }
      ctx.restore();
    }
  };
  fx.push(r);
  return r;
}

function kyleSpawnBox(f, rift, big) {
  addProj({
    owner: f, x: rift.x + (big ? 0 : rand(-70, 70)), y: rift.y + 10, vx: rand(-.6, .6), vy: rand(1, 3),
    w: big ? 92 : ri(30, 40), h: big ? 116 : ri(42, 52),
    col: pick(['#1d4fa8', '#1e8a3a', '#c0262d', '#6b2fa0', '#d87b16', '#23272f', '#0f7c86']), title: pick(KYLE_BOX_TITLES), big,
    rot: rand(-.5, .5), vr: rand(-.12, .12),
    m: big ? { dmg: 90, kd: true, kb: 4, hs: 30, bs: 18, super: true, noScale: true, snd: 'heavy' }
           : { dmg: 16, kb: 1, hs: 16, bs: 7, super: true, noScale: true, snd: 'light' },
    upd(p) {
      if (!p.inert) {
        p.vy += .42; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y + p.h / 2 >= GY) { // lands and stays on the floor for a moment
          p.y = GY - p.h / 2; p.inert = true; p.rot = 0; p.lt = p.t; dust(p.x, GY, p.big ? 16 : 2);
          if (p.big) { game.shake = 10; SFX.thud(); }
        }
      } else if (p.t - p.lt > 45) p.alive = false;
    },
    draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.inert) ctx.globalAlpha = clamp(1 - (p.t - p.lt - 25) / 20, 0, 1);
      const w = p.w, h = p.h;
      rr(-w / 2, -h / 2, w, h, 3, p.col, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, p.big ? 18 : 9);
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 14, w - 8, h * .45);
      if (p.big) { txt("COLLECTOR'S", 0, -h / 2 + 11, 12, '#111'); txt('EDITION', 0, h / 2 - 16, 16, '#ffd23a', 'center', FONT, 3); }
      else txt(p.title, 0, -h / 2 + 7, 6, '#111', 'center', 'sans-serif', 0, OL, 'bold');
      ctx.restore();
    },
    onDie(p) { chunks(p.x, p.y, p.big ? 16 : 5, p.col); }
  });
}

registerFighter({
  id: 'kyle', name: 'Kyle_SR84', spoken: 'Kyle S R eighty four', tag: 'The Arcade Veteran', style: 'Slow & Heavy Grappler',
  hp: 1250, spd: 3, jump: 13, kbm: .6, scale: 1.06, pow: 1.4,
  color: '#2f6fd6', accent: '#d82222', uiColor: '#ff4a4a',
  rig: { ul: 38, ll: 37, tl: 60, au: 32, al: 30, hr: 17 },
  frameData: { spd: 1.25, dmg: 1.4 },
  armor: true, bodyWidth: 30,
  skill: 'ARCADE SLAM', skillDesc: 'Unblockable command grab. Super armor on standing punches and kicks.', skillCooldown: 70,
  super: 'BACKLOG AVALANCHE', superSay: 'Backlog avalanche!', superDesc: 'A rift drops his entire unplayed library on your head.',
  win: ['Back on the shelf with the rest of my backlog.', 'Insert coin to continue.', 'Old school never dies.'],
  ai: { range: 60, aggr: .6, cancel: true, superOK: () => true, skillOK: d => d < 95 },

  skillMove(f, o, t, d) {
    if (!d.grab) { // reaching
      if (t >= 6 && t <= 10 && Math.abs(o.x - f.x) < 100 && Math.abs(o.y - f.y) < 30 && hittable(o) && game.phase === 'fight') {
        if (intercept(o, f)) return;
        d.grab = true; d.holding = true; d.gt = 0;
        o.state = 'grabbed'; o.t = 0; o.atk = null; o.data = {}; o.vx = o.vy = 0; o.armor = 0;
        SFX.heavy(); popText(f.x, f.y - 190, 'ARCADE SLAM!', '#ffb347', 24);
      } else if (t >= 34) toIdle(f);
      return;
    }
    // over-the-head slam
    d.gt++;
    const p = Math.min(1, d.gt / 26);
    if (d.gt <= 26) { o.x = f.x + f.face * 48 * Math.cos(p * Math.PI); o.y = GY - 115 * Math.sin(p * Math.PI); o.rot = p * Math.PI; }
    if (d.gt === 26) {
      o.y = GY; o.rot = 0; d.holding = false;
      hitRes(f, o, { dmg: 150, grab: true, kd: true, kb: 4, hs: 30, noScale: true, snd: 'heavy' }, null, sgn(o.x - f.x));
      game.shake = 12; SFX.thud(); dust(o.x, GY, 20);
    }
    if (d.gt >= 44) toIdle(f);
  },

  superMove(f, o, t, d) {
    if (t === 10) { d.rift = kyleOpenRift(f, o.x); SFX.special(); popText(f.x, f.y - 200, 'BACKLOG AVALANCHE!', '#c9f', 26); }
    if (d.rift && t >= 22 && t <= 100 && t % 3 === 0) kyleSpawnBox(f, d.rift, false);
    if (d.rift && t === 104) kyleSpawnBox(f, d.rift, true);
    if (t >= 122) toIdle(f);
  },

  pose(f, P) {
    if (f.state === 'skill') {
      if (f.data.grab) { P.fa = [2.9, 3.1]; P.ba = [2.8, 3.0]; P.lean = -.1; }
      else { P.lean = .25; P.fa = [1.5, 1.6]; P.ba = [1.4, 1.5]; }
    } else { P.fa = [2.7, 3.0]; P.ba = [2.6, 2.9]; P.lean = -.15; P.dy = Math.sin(f.t * .4) * 2; }
  },

  look: {
    tw: [19, 25], // torso half-widths at hip / shoulders (for the cel shading pass)
    lw: 17, aw: 15, legC: '#2c4f8c', legD: '#223c6c', armC: '#cf9466', armD: '#b07a50',
    behind(f, P, J) { // headband tails
      const c = J.hc, w = Math.sin(f.anim * .2);
      ctx.lineCap = 'round';
      for (const k of [0, 1]) {
        ctx.beginPath(); ctx.moveTo(c.x - 14, c.y - 8); ctx.quadraticCurveTo(c.x - 28, c.y - 4 + w * 4 + k * 6, c.x - 40, c.y + 2 + w * 7 + k * 9);
        ctx.lineWidth = 8; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 4.5; ctx.strokeStyle = '#d82222'; ctx.stroke();
      }
    },
    torso(f, P, J) { // denim vest with retro patches over a white tee
      quad(J.hip, J.sh, 19, 25, '#2f6fd6'); quad(J.hip, J.sh, 6, 10, '#ece6da', 0);
      const patch = (t, dx, col, round) => { const c = lerp(J.hip, J.sh, t); if (round) circ(c.x + dx, c.y, 4.5, col, 1.5); else rr(c.x + dx - 4.5, c.y - 4, 9, 8, 1, col, 1.5); };
      patch(.7, 14, '#e33', 1); patch(.45, 15, '#fc2', 0); patch(.25, -15, '#3c6', 0); patch(.75, -16, '#f80', 1);
    },
    head(f, P, J) {
      const c = J.hc;
      rr(c.x - 15, c.y - 17, 32, 35, 9, '#cf9466'); rr(c.x - 16, c.y - 20, 30, 10, 6, '#5a3a22'); rr(c.x - 16, c.y - 12, 33, 7, 2, '#d82222');
      ell(c.x + 9, c.y - 1, 3.5, 3.5, 0, '#fff', 1.2); circ(c.x + 10, c.y - 1, 1.8, '#111', 0); circ(c.x + 10.6, c.y - 1.8, .7, '#fff', 0);
      line({ x: c.x + 3, y: c.y - 6 }, { x: c.x + 15, y: c.y - 5 }, 3, '#3a2414');
      ctx.fillStyle = 'rgba(60,35,20,.45)'; for (let i = 0; i < 9; i++) ctx.fillRect(c.x - 2 + i * 2, c.y + 9 + (i % 2) * 2, 1.5, 1.5); // stubble
      line({ x: c.x + 7, y: c.y + 12 }, { x: c.x + 15, y: c.y + 12 }, 2, '#5a2a1a');
    },
    hand(e, h) { circ(h.x, h.y, 8, '#1b1b1b'); ctx.fillStyle = '#cf9466'; ctx.fillRect(h.x + 2, h.y - 5, 3, 10); }, // fingerless gloves
    foot(k, ft) { rr(ft.x - 8, ft.y - 13, 26, 14, 4, '#5b3a22'); },
    armDeco(f, s, e) { limb([s, lerp(s, e, .4)], 18, '#ece6da'); } // tee sleeves
  }
});
