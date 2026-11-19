'use strict';
/* =========================================================
   Nkc90 — Agile Aerial Fighter
   Passive: double jump, floaty jumps, skill usable in mid-air
   Skill: Blade Beam (energy crescent; angled down when thrown in the air)
   Super: Direct Shadow-Drop (a giant red banner slams down on the foe)
   ========================================================= */

function nkcSpawnBeam(f) {
  const air = f.air;
  addProj({
    owner: f, x: f.x + f.face * 60, y: f.y - (air ? 70 : 95), vx: f.face * 10, vy: air ? 4.5 : 0, w: 44, h: 40,
    m: { dmg: 40, kb: 5, hs: 17, bs: 9, snd: 'light' },
    upd(p) { p.x += p.vx; p.y += p.vy; if (p.y > GY - 20) { p.alive = false; spark(p.x, GY - 10, '#5ff3ff', 8); } },
    draw(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sgn(p.vx), 1); ctx.rotate(Math.atan2(p.vy, Math.abs(p.vx)));
      ctx.shadowColor = '#5ff3ff'; ctx.shadowBlur = 18; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(95,243,255,.5)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(-14, 0, 22, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    },
    onDie(p) { spark(p.x, p.y, '#5ff3ff', 10); }
  });
}

function nkcSpawnBanner(f) {
  addProj({
    owner: f, x: other(f).x, y: -90, vx: 0, vy: 0, w: 300, h: 110, delay: 26,
    m: { dmg: 190, kd: true, kb: 4, hs: 32, bs: 22, super: true, noScale: true, snd: 'heavy' },
    upd(p) {
      const tg = other(p.owner);
      if (p.t < p.delay) { p.x += (tg.x - p.x) * .15; p.y = -90 + Math.min(1, p.t / 10) * 40; return; } // peeks in, aims
      if (!p.landed) {
        p.vy += 4; p.y += p.vy;
        if (p.y + p.h / 2 >= GY) { p.y = GY - p.h / 2; p.landed = p.t; p.inert = true; game.shake = 14; SFX.thud(); dust(p.x - 120, GY, 10); dust(p.x + 120, GY, 10); }
      } else if (p.t - p.landed > 30) { p.alive = false; letters(p.x, p.y, 20, '#fff'); chunks(p.x, p.y, 16, '#e60012'); }
    },
    draw(p) {
      ctx.save();
      if (!p.landed) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x, GY + 3, 150, 12, 0, 0, Math.PI * 2); ctx.fill(); }
      if (p.landed) ctx.globalAlpha = clamp(1 - (p.t - p.landed - 20) / 10, 0, 1);
      const x = p.x - p.w / 2, y = p.y - p.h / 2;
      rr(x, y, p.w, p.h, 14, '#e60012', 4);
      rr(x + 8, y + 8, p.w - 16, p.h - 16, 10, '#e60012', 0); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; rrp(x + 8, y + 8, p.w - 16, p.h - 16, 10); ctx.stroke();
      txt('DIRECT', p.x + 16, p.y - 8, 54, '#fff', 'center', FONT);
      txt('SHADOW-DROP', p.x + 16, p.y + 32, 16, '#ffd0d4', 'center', FONT);
      ctx.beginPath(); ctx.moveTo(x + 26, p.y - 24); ctx.lineTo(x + 56, p.y - 6); ctx.lineTo(x + 26, p.y + 12); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); // ▶
      if ((frame >> 3) & 1) circ(x + p.w - 22, y + 20, 6, '#fff', 0);
      ctx.restore();
    }
  });
}

registerFighter({
  id: 'nkc', name: 'Nkc90', spoken: 'N K C ninety', tag: 'Direct Prophet', style: 'Agile Aerial Fighter',
  hp: 900, spd: 4.8, jump: 16.5, grav: .82, kbm: 1.15, pow: .9,
  color: '#2fa84f', accent: '#e60012', uiColor: '#4ad46a',
  frameData: { spd: .85, dmg: .9, reach: 22 },
  doubleJump: true, airSkill: true,
  skill: 'BLADE BEAM', skillDesc: 'Swings the controller blade to throw an energy crescent; works in mid-air. Has a double jump.', skillCooldown: 40,
  super: 'DIRECT SHADOW-DROP', superSay: 'Shadow drop!', superDesc: 'A snap of the fingers and a giant red DIRECT banner slams down out of nowhere.',
  win: ['Nessun leak, solo skill.', 'Announced and released the same day.', 'Ci vediamo al prossimo Direct!'],
  ai: { range: 170, aggr: .6, jumpRate: .35, superOK: () => true, skillOK: d => d > 150 },

  skillMove(f, o, t) {
    if (f.air && t < 14) f.vy = Math.min(f.vy, 1); // hangs in the air while slashing
    if (t === 7) { nkcSpawnBeam(f); SFX.whoosh(); }
    if (t >= 18) toIdle(f);
  },

  superMove(f, o, t) {
    if (t === 12) { popText(f.x, f.y - 200, '*SNAP*', '#fff', 26); SFX.block(); nkcSpawnBanner(f); }
    if (t >= 40) toIdle(f);
  },

  pose(f, P) {
    if (f.state === 'skill') { const k = f.t < 7; P.fa = k ? [2.8, 3.2] : [1.3, 1.1]; P.lean = k ? -.1 : .25; if (f.air) { P.fl = [1.2, -.15]; P.bl = [.45, -.9]; } }
    else { P.fa = [2.6, 3.4]; P.lean = -.05; } // finger snap
  },

  face: { skin: '#eebe98', hair: '#4a2a16', hairLight: '#8a5a30', style: 'cap', cap: '#e60012', eyes: '#1e9a4a', expr: 'grin' },
  bust: { base: '#2fa84f', inner: '#e60012', collar: 'bomber', scarf: '#2a7fd4' },
  look: {
    tw: [15, 17],
    lw: 12, aw: 11, legC: '#2a2d3a', legD: '#1d2029', armC: '#2fa84f', armD: '#23843d',
    behind(f, P, J) { // long blue adventurer's scarf
      const s = J.sh, w = Math.sin(f.anim * .2 + 1);
      ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x - 3, s.y + 2);
      ctx.bezierCurveTo(s.x - 22, s.y - 2 + w * 7, s.x - 38, s.y + 10 - w * 9, s.x - 56, s.y + w * 12);
      ctx.lineWidth = 13; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = 8; ctx.strokeStyle = '#2a7fd4'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = '#ffd23a'; ctx.stroke();
    },
    torso(f, P, J) { // green jacket over a red hoodie
      quad(J.hip, J.sh, 15, 17, '#2fa84f');
      quad(lerp(J.hip, J.sh, .15), lerp(J.hip, J.sh, .95), 4, 6, '#e60012', 0);
      rr(J.sh.x - 12, J.sh.y - 6, 22, 9, 4, '#2a7fd4', 2); // scarf wrap
    },
    hand(e, h) { circ(h.x, h.y, 5.5, '#ecbb95'); },
    foot(k, ft) { rr(ft.x - 7, ft.y - 11, 25, 12, 5, '#e60012'); ctx.fillStyle = '#fff'; ctx.fillRect(ft.x - 6, ft.y - 2, 23, 2.5); },
    front(f, P, J) { // controller grip with an energy blade
      const a = P.fa[1], h = J.fh;
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(Math.atan2(Math.cos(a), Math.sin(a)));
      ctx.shadowColor = '#5ff3ff'; ctx.shadowBlur = 14;
      const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, 'rgba(95,243,255,.6)'); g.addColorStop(.5, '#fff'); g.addColorStop(1, 'rgba(95,243,255,.6)');
      ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(74, -2.5); ctx.lineTo(82, 0); ctx.lineTo(74, 2.5); ctx.lineTo(8, 4); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.shadowBlur = 0;
      rr(-8, -6, 9, 12, 3, '#e60012', 2); rr(0, -6, 9, 12, 3, '#00a0e9', 2);
      ctx.restore();
    }
  }
});
