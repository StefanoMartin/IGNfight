'use strict';
/* =========================================================
   Mao-gp — Mix-up / Bait-and-Punish
   Passive: hitting an opponent stuck in a missed attack deals x1.5 (PUNISH!)
   Skill: Feint Dash — invulnerable dash; forward ends in a GPU-shield bash,
          holding back makes it a retreating feint
   Super: 3,000-Post Flame War
   ========================================================= */

const MAO_REPLIES = ['+99', '!!', '@Mao', 'RE:', '???', 'FONTE?', '🔥', '+1'];

function maoSpawnSpark(f) {
  const tg = other(f), tx = clamp(tg.x + tg.vx * 18, LW + 40, RW - 40), T = 30;
  addProj({
    owner: f, x: f.x + f.face * 30, y: f.y - 110, vx: (tx - f.x - f.face * 30) / T, vy: -8, w: 18, h: 18,
    m: { dmg: 0 }, // the spark itself does no damage: it erupts
    upd(p) {
      p.x += p.vx; p.vy += .55; p.y += p.vy;
      if (p.t % 2 === 0) parts.push({ x: p.x, y: p.y, vx: rand(-1, 1), vy: rand(-1, 0), life: 14, t: 0, col: '#ffb31e', sz: 3, g: 0, k: 'c' });
      if (p.y >= GY - 6) { p.alive = false; maoFlamePillar(p.owner, p.x); }
    },
    onHit(p) { p.alive = false; maoFlamePillar(p.owner, p.x); },
    draw(p) { ctx.save(); ctx.shadowColor = '#ff8a1e'; ctx.shadowBlur = 16; starburst(p.x, p.y, 11, 4, 6, p.t * .4, '#fff2a0', '#ff6a1e', 1.5); ctx.restore(); }
  });
}

/** Towering pillar of forum fire: traps whoever is inside and grinds them */
function maoFlamePillar(owner, x) {
  game.shake = Math.max(game.shake, 10); SFX.heavy(); dust(x, GY, 16); popText(x, GY - 330, 'FLAME WAR!', '#ff6a1e', 34);
  addProj({
    owner, x, y: GY - 200, vx: 0, w: 110, h: 400, posts: 0, m: {},
    onHit(p, tg) {
      if (p.trap || p.done) return;
      const r = hitRes(p.owner, tg, { dmg: 20, kb: 0, hs: 30, bs: 20, super: true, noScale: true, snd: 'heavy' }, projBox(p), sgn(tg.x - p.owner.x));
      if (r === 'hit') p.trap = true; else if (r !== 'none') p.done = true;
    },
    upd(p) {
      const tg = other(p.owner);
      p.posts = Math.min(3000, p.posts + 37);
      if (p.t % 3 === 0) maoReply(p);
      if (p.trap) {
        if (tg.state !== 'hit') p.trap = false;
        else {
          tg.x += (p.x - tg.x) * .2; tg.t = 0; tg.vx = 0;
          if (p.t % 6 === 0) {
            hurtHP(tg, 12); if (tg.hp < 1) tg.hp = 1; tg.flash = 3; p.owner.combo++;
            game.combo[p.owner.idx] = { n: p.owner.combo, t: 70 }; spark(tg.x, tg.y - rand(40, 140), '#ffb31e', 5); SFX.light();
          }
        }
      }
      if (p.t >= 80) {
        p.alive = false; chunks(p.x, GY - 150, 24, '#ff8a1e');
        if (p.trap) hitRes(p.owner, tg, { dmg: 60, grab: true, launch: 15, kd: true, kb: 4, hs: 30, noScale: true, super: true, snd: 'heavy' }, null, sgn(tg.x - p.x) || 1);
      }
    },
    draw(p) {
      const grow = Math.min(1, p.t / 8), fade = Math.min(1, (80 - p.t) / 10), h = p.h * grow, top = GY - h;
      ctx.save(); ctx.globalAlpha = fade; ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { // layered flickering flames
        const w = p.w * (1 - k * .28), g = ctx.createLinearGradient(0, GY, 0, top);
        g.addColorStop(0, ['#ff3a1e', '#ff9a1e', '#fff2a0'][k]); g.addColorStop(.7, ['rgba(255,60,30,.6)', 'rgba(255,170,30,.5)', 'rgba(255,255,200,.5)'][k]); g.addColorStop(1, 'rgba(255,80,30,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x - w / 2, GY);
        for (let y = GY; y >= top; y -= 20) ctx.lineTo(p.x - w / 2 + Math.sin(y * .05 + frame * .5 + k) * 10, y);
        for (let y = top; y <= GY; y += 20) ctx.lineTo(p.x + w / 2 + Math.sin(y * .06 - frame * .5 + k) * 10, y);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha = fade; txt(p.posts.toLocaleString('it-IT') + ' POSTS', p.x, top - 14, 16, '#ffe14a', 'center', FONT, 4); ctx.restore();
    }
  });
}

/** Angry reply notification raining down inside the pillar (visual) */
function maoReply(p) {
  fx.push({
    x: p.x + rand(-50, 50), y: GY - 420, vy: rand(4, 7), s: pick(MAO_REPLIES), t: 0, life: 60, top: true,
    upd(e) { e.y += e.vy; if (e.y > GY - 10) e.t = e.life; },
    draw(e) {
      ctx.save(); ctx.translate(e.x, e.y);
      rr(-17, -10, 34, 20, 9, '#e8242e', 2); txt(e.s, 0, 1, 11, '#fff', 'center', 'sans-serif', 0, OL, 'bold');
      ctx.restore();
    }
  });
}

function maoDrawGPU(h, f) { // high-end graphics card held like a riot shield
  ctx.save(); ctx.translate(h.x + 14, h.y - 4);
  rr(-14, -42, 28, 84, 4, '#22252e', 2.5);
  rr(-14, -42, 6, 84, 2, '#b8bec8', 1.5);                            // bracket
  for (const fy of [-20, 18]) {                                       // spinning fans
    circ(2, fy, 11, '#111', 2);
    ctx.save(); ctx.translate(2, fy); ctx.rotate(frame * .5);
    ctx.fillStyle = '#4a4f5c'; for (let i = 0; i < 5; i++) { ctx.rotate(Math.PI * 2 / 5); ctx.fillRect(0, -1.5, 9, 3); }
    ctx.restore();
  }
  const hue = (frame * 4) % 360;                                      // RGB strip
  ctx.fillStyle = 'hsl(' + hue + ',100%,60%)'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10; ctx.fillRect(10, -38, 3, 76);
  ctx.restore();
}

registerFighter({
  id: 'mao', name: 'Mao-gp', spoken: 'Mao G P', tag: 'Il Polemista', style: 'Mix-up / Bait-and-Punish',
  hp: 1000, spd: 4.6, jump: 15, kbm: 1, pow: 1.1,
  color: '#d01f2e', accent: '#ff8a1e', uiColor: '#ff6a3a',
  frameData: { spd: .82, dmg: 1.12 },
  punishBonus: 1.5,
  skill: 'FEINT DASH', skillDesc: 'Invulnerable dash into a GPU bash (hold back to feint). Whiff punishes deal x1.5.', skillCooldown: 42,
  super: '3,000-POST FLAME WAR', superSay: 'Flame war!', superDesc: 'A single spark erupts into a pillar of forum fire that traps the foe under a rain of angry replies.',
  win: ['Fonte? Io.', 'Thread chiuso per eccesso di ragione.', 'Prezzi folli, vittoria facile.'],
  ai: { range: 90, aggr: .8, cancel: true, superOK: d => d < 600, skillOK: d => d > 130 && d < 330 },

  skillMove(f, o, t, d) {
    if (t === 1) { d.back = !!(f.face > 0 ? f.inp.l : f.inp.r); SFX.whoosh(); }
    if (t <= 12) { f.inv = 2; f.vx = (d.back ? -1 : 1) * f.face * 13; if (t % 2 === 0) dust(f.x, GY, 1); }
    if (t === 13) {
      f.vx = 0;
      if (d.back) { if (o.state === 'attack' && o.atk && !o.atk.hit) popText(f.x, f.y - 185, 'BAITED!', '#ff4a3a', 24); }
      else d.bash = true;
    }
    if (d.bash && t >= 13 && t <= 17 && !d.hit) {
      const r = tryHit(f, o, [0, -130, 62, 90], { dmg: 70, kb: 8, hs: 20, bs: 14, snd: 'heavy' });
      if (f.state !== 'skill') return;
      if (r !== 'miss') d.hit = true;
    }
    if (t > 13) f.vx *= .7;
    if (t >= (d.back ? 20 : 30)) toIdle(f);
  },

  superMove(f, o, t) {
    if (t === 12) { maoSpawnSpark(f); SFX.whoosh(); }
    if (t >= 30) toIdle(f);
  },

  pose(f, P) {
    const d = f.data, t = f.t;
    if (f.state === 'skill') { P.lean = d.back ? -.2 : .35; P.fl = [.95, .3]; P.bl = [-.8, -.4]; P.ba = d.bash ? [1.5, 1.6] : [1.1, 2.6]; P.fa = [.6, 2.0]; }
    else { P.fa = t < 12 ? [2.6, 3.2] : [1.4, 1.2]; P.lean = t < 12 ? -.1 : .15; }
  },

  face: { skin: '#e4ad86', hair: '#2a1a12', hairLight: '#6a4228', style: 'wild', eyes: '#c0392b', expr: 'smirk' },
  bust: { base: '#d01f2e', trim: '#f4f4f4', collar: 'racing', emblem: 'GP', emblemColor: '#ffe14a' },
  look: {
    tw: [15, 18],
    lw: 13, aw: 12, legC: '#22242c', legD: '#17181e', armC: '#d01f2e', armD: '#a5141f',
    torso(f, P, J) { // retro racing jacket
      quad(J.hip, J.sh, 15, 18, '#d01f2e');
      quad(lerp(J.hip, J.sh, .2), lerp(J.hip, J.sh, .9), 6, 9, '#f4f4f4', 0);
      quad(lerp(J.hip, J.sh, .2), lerp(J.hip, J.sh, .9), 2, 3, '#111', 0);
      const c = lerp(J.hip, J.sh, .4);
      ctx.save(); ctx.translate(c.x + 9, c.y); ctx.rotate(P.lean); ctx.scale(f.face || 1, 1); txt('GP', 0, 0, 12, '#ffe14a', 'center', FONT, 3); ctx.restore();
      circ(J.sh.x + 2, J.sh.y + 5, 7, '#f4f4f4', 2); // shoulder armour
    },
    hand(e, h) { circ(h.x, h.y, 6.5, '#151515'); ctx.fillStyle = '#d01f2e'; ctx.fillRect(h.x - 1, h.y - 5, 4, 10); }, // racing gloves
    foot(k, ft) { rr(ft.x - 8, ft.y - 12, 26, 13, 4, '#151515'); ctx.fillStyle = '#d01f2e'; ctx.fillRect(ft.x - 6, ft.y - 8, 20, 2.5); },
    front(f, P, J) { maoDrawGPU(J.bh, f); }
  }
});
