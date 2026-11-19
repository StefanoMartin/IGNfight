'use strict';
/* =========================================================
   Pat_00 — Momentum / Hype Rushdown
   Passive: HYPE (0-100) builds while he stays on the offensive
            (landing hits, walking forward) and is lost when he gets hit.
            Each hype level (T-2, T-1, LIVE!) makes his moves recover
            faster and his walk speed higher.
   Skill: Hype Leap (leaping mic slam)
   Super: World Premiere Drop
   ========================================================= */

const patLevel = f => Math.min(3, Math.floor((f.hype || 0) / 34));

function patAddHype(f, n) {
  const before = patLevel(f);
  f.hype = Math.min(100, (f.hype || 0) + n);
  const after = patLevel(f);
  if (after > before) {
    popText(f.x, f.y - 215, after === 3 ? 'LIVE!!' : 'T-' + (3 - after) + ':00', after === 3 ? '#ff4a5a' : '#5ff3ff', 22);
    if (after === 3) SFX.special();
  }
}

/** Giant theater screen that drops behind the arena */
function patTheaterScreen() {
  fx.push({
    t: 0, life: 150,
    draw(e) {
      const drop = Math.min(1, e.t / 25), out = Math.min(1, (e.life - e.t) / 20);
      const w = 600, h = 260, x = 480 - w / 2, y = -h + drop * (h + 40);
      ctx.save(); ctx.globalAlpha = out;
      ctx.fillStyle = '#111'; ctx.fillRect(476, -10, 8, y + 10); // cables
      rr(x - 14, y - 14, w + 28, h + 28, 6, '#1a1020', 3);
      for (let i = 0; i < 30; i++) { // marquee bulbs
        const on = ((i + (frame >> 2)) % 3) === 0, bx = x - 7 + (i % 15) * (w + 14) / 14, by = i < 15 ? y - 7 : y + h + 7;
        ctx.fillStyle = on ? '#ffe68a' : '#6a5520'; ctx.beginPath(); ctx.arc(bx, by, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      const flash = (frame >> 3) & 1;
      g.addColorStop(0, flash ? '#1f6fff' : '#7a2cff'); g.addColorStop(1, flash ? '#ff2a8a' : '#19d3ff');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = out * .25; ctx.fillStyle = halftone(); ctx.fillRect(x, y, w, h); ctx.globalAlpha = out;
      focusLines(480, y + h / 2, 80, 'rgba(255,255,255,.12)', 30);
      bigText('WORLD', 480, y + h * .36, 64, -.15, '#fff', '#fff6a0', '#ffb31e');
      bigText('PREMIERE', 480, y + h * .68, 64, -.15, '#fff', '#fff6a0', '#ffb31e');
      ctx.restore();
    }
  });
}

function patDrawTrophy(w, h, gold) {
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, gold ? '#b8860b' : '#9aa3ad'); g.addColorStop(.35, gold ? '#fff2a0' : '#ffffff'); g.addColorStop(1, gold ? '#c99a1a' : '#b8c2cc');
  ctx.lineWidth = 3; ctx.strokeStyle = OL;
  ctx.beginPath(); ctx.arc(-w * .42, -h * .28, w * .18, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); // handles
  ctx.beginPath(); ctx.arc(w * .42, -h * .28, w * .18, -Math.PI * .5, Math.PI * .5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w * .4, -h * .48); ctx.lineTo(w * .4, -h * .48); ctx.quadraticCurveTo(w * .38, h * .02, 0, h * .08); ctx.quadraticCurveTo(-w * .38, h * .02, -w * .4, -h * .48);
  ctx.fillStyle = g; ctx.fill(); ctx.stroke(); // cup
  ctx.fillStyle = g; ctx.fillRect(-w * .07, h * .06, w * .14, h * .2); ctx.strokeRect(-w * .07, h * .06, w * .14, h * .2); // stem
  rr(-w * .3, h * .26, w * .6, h * .22, 4, '#3a2416'); // base
  txt('★', 0, -h * .24, w * .3, '#fff', 'center', 'sans-serif');
}

function patSpawnTrophy(f) {
  const tg = other(f);
  addProj({
    owner: f, x: tg.x, y: -200, vx: 0, vy: 2, w: 110, h: 150,
    m: { dmg: 180, kd: true, launch: 14, kb: 5, hs: 30, bs: 20, super: true, noScale: true, snd: 'heavy' },
    upd(p) {
      const tg = other(p.owner);
      if (p.y < 40) p.x += (tg.x - p.x) * .12;
      p.vy += .9; p.y += p.vy;
      if (p.y + p.h / 2 >= GY) { // hits the floor: explosion around the impact point
        p.alive = false; patExplode(p);
        if (hittable(tg) && Math.abs(tg.x - p.x) < 120 && !tg.air)
          hitRes(p.owner, tg, { dmg: 90, kd: true, kb: 6, hs: 26, bs: 16, super: true, noScale: true, snd: 'heavy' }, null, sgn(tg.x - p.x));
      }
    },
    draw(p) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(p.x, GY + 3, 70, 10, 0, 0, Math.PI * 2); ctx.fill(); // warning shadow
      ctx.translate(p.x, p.y); ctx.shadowColor = '#ffd23a'; ctx.shadowBlur = 25; patDrawTrophy(p.w, p.h, true); ctx.restore();
    },
    onDie(p) { patExplode(p); }
  });
}
function patExplode(p) {
  fx.push({ x: p.x, y: Math.min(p.y, GY - 60), t: 0, life: 22, top: true, draw(e) {
    const k = e.t / e.life; ctx.save(); ctx.globalAlpha = 1 - k;
    starburst(e.x, e.y, 160 * (.4 + k), 60, 14, e.t * .05, '#ffd23a', OL, 4); starburst(e.x, e.y, 100 * (.4 + k), 40, 14, .2, '#fff');
    ctx.restore();
  } });
  chunks(p.x, p.y, 30, '#ffd23a'); chunks(p.x, p.y, 14, '#fff'); game.shake = 14; SFX.ko(); sfxWord(p.x, p.y - 80, true);
}

registerFighter({
  id: 'pat', name: 'Pat_00', spoken: 'Pat zero zero', tag: 'The Event Host', style: 'Momentum / Hype Rushdown',
  hp: 950, spd: 4.8, jump: 15.5, kbm: 1.1, pow: 1,
  color: '#1d5fe0', accent: '#5ff3ff', uiColor: '#5fb0ff',
  frameData: { spd: .9, dmg: .95 },
  skill: 'HYPE LEAP', skillDesc: 'Leaping mic slam. Attacking builds HYPE (faster moves); getting hit resets it.', skillCooldown: 50,
  super: 'WORLD PREMIERE DROP', superSay: 'World premiere!', superDesc: 'Leaps off-screen, a giant theater screen drops, then an exploding trophy lands on the foe.',
  win: ['And the winner is... me!', 'Stay tuned, there\'s one more thing!', 'Thread aperto, avversario chiuso.'],
  ai: { range: 75, aggr: .9, cancel: true, superOK: () => true, skillOK: d => d > 110 && d < 300 },

  onReset(f) { f.hype = 0; },
  tick(f, o) {
    if (f.state === 'walk' && sgn(f.vx) === f.face) patAddHype(f, .2);          // pressing forward
    else if (['idle', 'crouch', 'block'].includes(f.state)) f.hype = Math.max(0, f.hype - .03); // cooling down
  },
  onHitLanded(a) { patAddHype(a, 12); },
  onGotHit(d) { if (patLevel(d) > 0) popText(d.x, d.y - 205, 'HYPE LOST', '#aaa', 18); d.hype = 0; },
  haste: f => patLevel(f),
  speedMul: f => 1 + .1 * patLevel(f),

  skillMove(f, o, t, d) {
    if (t === 4) { f.vy = -10; f.vx = f.face * 7.5; f.y = GY - 1; SFX.jump(); }
    if (t > 4 && f.vy > 0 && !d.hit) { // hits on the way down
      const r = tryHit(f, o, [-5, -120, 60, 120], { dmg: 65, kb: 6, hs: 22, bs: 14, snd: 'heavy' });
      if (f.state !== 'skill') return;
      if (r !== 'miss') d.hit = true;
    }
    if (t > 6 && !f.air) { if (!d.landT) { d.landT = t; dust(f.x, GY, 10); game.shake = Math.max(game.shake, 3); } f.vx = 0; if (t - d.landT > 10) toIdle(f); }
    if (t > 60) toIdle(f);
  },

  superMove(f, o, t, d) {
    if (t === 1) { d.noPhys = true; d.sx = f.x; }
    if (t <= 18) { f.y -= 26; f.inv = 2; }           // leaps off the top of the screen
    if (t === 18) d.hidden = true;
    if (t === 12) { patTheaterScreen(); SFX.special(); }
    if (d.hidden) f.inv = 2;
    if (t === 60) patSpawnTrophy(f);
    if (t === 125) { d.hidden = false; f.x = d.sx; f.y = -120; d.vy = 0; }
    if (t > 125 && !d.landed) {                      // drops back in
      f.inv = 2; d.vy += 1.2; f.y += d.vy;
      if (f.y >= GY) { f.y = GY; d.landed = t; dust(f.x, GY, 12); }
    }
    if ((d.landed && t - d.landed > 12) || t > 220) { f.y = GY; toIdle(f); }
  },

  pose(f, P) {
    if (f.state === 'skill') { P.lean = .2; P.fa = f.vy > 0 ? [2.6, 1.2] : [2.9, 3.1]; P.fl = [1.1, -.2]; P.bl = [.3, -.8]; }
    else { P.fa = [2.9, 3.1]; P.ba = [2.7, 3.0]; P.fl = [1.2, -.2]; P.bl = [.4, -.9]; }
  },

  drawUI(f) { // glowing countdown timer = hype level
    if (['ko', 'knockdown'].includes(f.state)) return;
    const L = patLevel(f), x = clamp(f.x - f.face * 48, 60, W - 60), y = f.y - 205 + Math.sin(f.anim * .08) * 4;
    const live = L === 3, col = live ? '#ff4a5a' : '#5ff3ff';
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = live ? 16 + 6 * Math.sin(frame * .4) : 10;
    rr(x - 40, y - 15, 80, 30, 6, 'rgba(6,10,24,.9)', 0); ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; rrp(x - 40, y - 15, 80, 30, 6); ctx.stroke();
    txt('HYPE', x, y - 7, 9, '#cfe', 'center', 'sans-serif', 0, OL, 'bold');
    txt(live ? 'LIVE!' : 'T-0' + (3 - L) + ':00', x, y + 6, 14, col, 'center', 'monospace', 0, OL, 'bold');
    ctx.fillStyle = col; ctx.fillRect(x - 36, y + 13, 72 * ((f.hype || 0) % 34) / 34 * (live ? 0 : 1) + (live ? 72 : 0), 2);
  },

  face: { skin: '#eebb96', hair: '#7a4a22', hairLight: '#c88a44', style: 'quiff', eyes: '#2a6ff0', acc: ['headset'], expr: 'grin' },
  bust: { base: '#1d5fe0', trim: '#f2f2f6', collar: 'varsity', emblem: '00' },
  look: {
    tw: [15, 18],
    lw: 13, aw: 12, legC: '#2a3550', legD: '#1e2740', armC: '#f2f2f6', armD: '#cfd3de',
    torso(f, P, J) { // bright blue varsity jacket
      quad(J.hip, J.sh, 15, 18, '#1d5fe0');
      quad(J.hip, lerp(J.hip, J.sh, .12), 15, 15.4, '#f2f2f6', 0); // ribbed hem
      line(lerp(J.hip, J.sh, .05), lerp(J.hip, J.sh, .95), 1.5, '#0d2a6e');
      const c = lerp(J.hip, J.sh, .62);
      ctx.save(); ctx.translate(c.x + 7, c.y); ctx.rotate(P.lean); ctx.scale(f.face || 1, 1);
      rr(-9, -8, 18, 16, 3, '#f2f2f6', 1.5); txt('00', 0, 1, 11, '#1d5fe0'); ctx.restore();
      rr(J.sh.x - 10, J.sh.y - 5, 20, 8, 4, '#f2f2f6', 2);
    },
    hand(e, h, front) {
      circ(h.x, h.y, 6, '#e8b48c');
      if (!front) { rr(h.x - 9, h.y - 7, 18, 11, 2, '#111', 1.5); ctx.fillStyle = '#ff4a5a'; ctx.fillRect(h.x - 6, h.y - 5, 12, 6); } // handheld countdown
    },
    foot(k, ft) { rr(ft.x - 8, ft.y - 11, 26, 12, 5, '#f5f5f5'); ctx.fillStyle = '#1d5fe0'; ctx.fillRect(ft.x - 6, ft.y - 7, 20, 3); }
  }
});
