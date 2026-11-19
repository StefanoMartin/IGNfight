'use strict';
/* =========================================================
   GAARA80 — Rushdown / Glass Cannon
   Skill: Instant Reply (dash punch)
   Super: 100,000 Post Barrage (50 hits + TOP POSTER uppercut)
   Passive: floating post counter, +1 for every hit landed
   ========================================================= */

function gaaraBadge(x, y) {
  fx.push({
    x, y, t: 0, life: 75,
    draw(e) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (e.life - e.t) / 15); ctx.translate(e.x, e.y - e.t * .7);
      const s = 1 + Math.max(0, .5 - e.t * .05); ctx.scale(s, s);
      ctx.shadowColor = '#ffd23a'; ctx.shadowBlur = 20; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rad = i % 2 ? 34 : 46; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
      ctx.closePath(); ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke(); ctx.shadowBlur = 0;
      txt('TOP', 0, -8, 16, '#3a2600'); txt('POSTER', 0, 9, 15, '#3a2600');
      ctx.restore();
    }
  });
}

registerFighter({
  id: 'gaara', name: 'GAARA80', spoken: 'Gaara eighty', tag: 'The Top Poster', style: 'Rushdown / Glass Cannon',
  hp: 850, spd: 5.6, jump: 16, kbm: 1.4, pow: .85,
  color: '#7cc6ee', accent: '#f4f7fb', uiColor: '#7cc6ee',
  frameData: { spd: .72, dmg: .85 },
  skill: 'INSTANT REPLY', skillDesc: 'A lightning-fast dash punch.', skillCooldown: 45,
  super: '100,000 POST BARRAGE', superSay: 'One hundred thousand post barrage!', superDesc: 'A 50-hit keyboard flurry, finished by a TOP POSTER uppercut.',
  win: ['Already replied 400 times while you loaded.', 'First! ...wait, I won?', 'Daje! Post count +1.'],
  ai: { range: 70, aggr: .85, cancel: true, superOK: d => d < 240, skillOK: d => d < 200 && d > 50 },

  onHitLanded(a) { a.posts++; },

  skillMove(f, o, t, d) {
    if (t === 4) { f.vx = f.face * 15; SFX.whoosh(); }
    if (t >= 4 && t <= 15 && !d.hit) {
      const r = tryHit(f, o, [0, -128, 54, 52], { dmg: 55, kb: 6, hs: 18, bs: 12, snd: 'light' });
      if (f.state !== 'skill') return; // got countered
      if (r !== 'miss') { d.hit = true; f.vx *= .2; }
    }
    if (t > 15) f.vx *= .75;
    if (t >= 28) toIdle(f);
  },

  superMove(f, o, t, d) {
    if (!d.ph) { // phase 1: dash in
      if (t >= 8 && t <= 34) {
        f.vx = f.face * 13; if (t % 3 === 0) dust(f.x, GY, 2);
        const r = tryHit(f, o, [0, -150, 60, 150], { dmg: 30, kb: 1, hs: 40, bs: 16, super: true, noScale: true, snd: 'heavy' });
        if (f.state !== 'super') return;
        if (r === 'hit') { d.ph = 'bar'; d.n = 0; d.holding = true; f.vx = 0; o.state = 'locked'; o.t = 0; }
        else if (r !== 'miss') { d.ph = 'rec'; d.rt = 0; f.vx = -f.face * 3; }
      } else if (t > 34) { f.vx *= .7; if (t > 54) toIdle(f); }
    }
    else if (d.ph === 'bar') { // phase 2: 50-hit barrage, opponent held in place
      f.vx = 0; o.state = 'locked'; o.t = 0; o.vx = 0; o.face = -f.face;
      let tx = f.x + f.face * 56;
      if (tx < LW || tx > RW) { tx = clamp(tx, LW, RW); f.x = tx - f.face * 56; }
      o.x = tx; if (o.y < GY) o.y = Math.min(GY, o.y + 5);
      if (t % 2 === 0) {
        d.n++; f.posts++; f.combo++;
        o.hp = Math.max(1, o.hp - 5); o.flash = 2;
        spark(o.x - f.face * 14, o.y - rand(70, 130), '#fff', 3); letters(o.x - f.face * 10, o.y - 110, 1, '#7cf');
        if (d.n % 3 === 0) SFX.light(); else SFX.type();
        game.shake = Math.max(game.shake, 2); game.combo[f.idx] = { n: f.combo, t: 70 };
      }
      if (d.n >= 50) { d.ph = 'up'; d.ut = 0; d.holding = false; }
    }
    else if (d.ph === 'up') { // phase 3: TOP POSTER uppercut
      d.ut++;
      if (d.ut === 5) {
        f.vy = -11; f.y = GY - 1;
        hitRes(f, o, { dmg: 120, grab: true, launch: 17, kb: 4, hs: 40, noScale: true, super: true, snd: 'heavy' }, null, f.face);
        gaaraBadge(f.x + f.face * 20, f.y - 170); SFX.special(); say('Top poster!', 'en-US', .7, 1.1);
      }
      if ((d.ut >= 10 && !f.air) || d.ut > 80) toIdle(f);
    }
    else if (d.ph === 'rec') { f.vx *= .8; if (++d.rt > 22) toIdle(f); } // blocked / whiffed
  },

  pose(f, P) {
    const d = f.data, t = f.t;
    if (f.state === 'skill' || !d.ph || d.ph === 'rec') { P.lean = .35; P.fa = [1.57, 1.57]; P.fl = [.95, .3]; P.bl = [-.8, -.4]; }
    else if (d.ph === 'bar') {
      const k = (t >> 1) & 1; P.lean = .2;
      P.fa = k ? [1.57, 1.57] : [.6, 2.2]; P.ba = k ? [.4, 2.4] : [1.5, 1.6]; P.fl = [.5, .1]; P.bl = [-.5, -.2];
    }
    else { P.lean = .1; P.fa = [2.85, 3.05]; P.fl = [.3, .1]; P.bl = [-.5, -.2]; }
  },

  drawUI(f) { // floating post counter
    if (['ko', 'knockdown'].includes(f.state)) return;
    const x = clamp(f.x - f.face * 46, 60, W - 60), y = f.y - 205 + Math.sin(f.anim * .07) * 4;
    ctx.save(); ctx.shadowColor = '#3bff7f'; ctx.shadowBlur = 10; rr(x - 40, y - 15, 80, 30, 6, 'rgba(8,20,14,.88)', 0); ctx.restore();
    ctx.strokeStyle = '#3bff7f'; ctx.lineWidth = 1.5; rrp(x - 40, y - 15, 80, 30, 6); ctx.stroke();
    txt('POSTS', x, y - 7, 9, '#9fe', 'center', 'sans-serif', 0, OL, 'bold');
    txt(f.posts.toLocaleString('it-IT'), x, y + 6, 14, '#3bff7f', 'center', 'monospace', 0, OL, 'bold');
  },

  face: { skin: '#eab48c', hair: '#3a2418', hairLight: '#7a4a2a', style: 'spiky', eyes: '#2f9a5a', acc: ['neckset'], expr: 'grin' },
  bust: { base: '#7cc6ee', trim: '#f4f7fb', collar: 'zip', emblem: '80', emblemColor: '#123a5c' },
  look: {
    tw: [15, 18], // torso half-widths at hip / shoulders (for the cel shading pass)
    lw: 13, aw: 12, legC: '#30343c', legD: '#23262d', armC: '#7cc6ee', armD: '#5c9fc7',
    torso(f, P, J) { // retro 80s windbreaker
      quad(J.hip, J.sh, 15, 18, '#7cc6ee');
      quad(lerp(J.hip, J.sh, .45), lerp(J.hip, J.sh, .68), 15.5, 16.8, '#f4f7fb', 0);
      line(lerp(J.hip, J.sh, .05), lerp(J.hip, J.sh, .95), 1.5, '#2d5d82');
      const c = lerp(J.hip, J.sh, .25);
      ctx.save(); ctx.translate(c.x + 6, c.y); ctx.rotate(P.lean); ctx.scale(f.face || 1, 1); txt('80', 0, 0, 13, '#123a5c'); ctx.restore();
      rr(J.sh.x - 9, J.sh.y - 4, 18, 7, 3, '#f4f7fb', 2);
    },
    hand(e, h) { line(lerp(e, h, .72), lerp(e, h, .9), 14, '#f4f7fb'); circ(h.x, h.y, 6, '#e2ad84'); },
    foot(k, ft) { rr(ft.x - 8, ft.y - 11, 27, 12, 5, '#f5f5f5'); ctx.fillStyle = '#d22'; ctx.fillRect(ft.x - 7, ft.y - 2, 25, 3); }
  }
});
