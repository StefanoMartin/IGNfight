'use strict';
/* =========================================================
   the.dark.player — Zoner / Technical
   Mechanical-keyboard greatsword gives every normal move extra reach.
   Skill: Code Throw (projectile)
   Super: Wall of Text (sliding wall that pins and crushes in the corner)
   ========================================================= */

const DARK_CODES = ['if(post.isWrong)', 'sudo ban --user', 'git blame you', 'while(1) reply();', 'RTFM', '404: logic not found', '[citation needed]', 'rm -rf hype/'];
const DARK_WORDS = ['infatti', 'comunque', 'fonte?', 'premesso che', 'EDIT:', 'TL;DR', 'come dicevo', 'ma anche no', 'framerate', '30fps', 'cit.', 'in realtà',
  'nel 2007', 'avevo ragione', 'vedi sopra', 'quoto', 'benchmark', 'downgrade', 'sul serio?', 'ripeto:', 'scusate il papiro'];

function darkDrawKeyboard(h, ang) {
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(Math.atan2(Math.cos(ang), Math.sin(ang)));
  rr(-10, -9, 114, 18, 4, '#2a2e38');
  for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) {
    ctx.fillStyle = (i + j * 3 + ((frame / 5) | 0)) % 7 === 0 ? '#3bff7f' : '#4a5060';
    ctx.fillRect(-4 + i * 8.6, -6 + j * 7, 6.6, 5.5);
  }
  ctx.fillStyle = '#3bff7f'; ctx.fillRect(-9, 7, 112, 2); ctx.restore();
}

/* ---------- code line projectile ---------- */
function darkSpawnCode(f) {
  const s = pick(DARK_CODES);
  addProj({
    owner: f, x: f.x + f.face * 70, y: f.y - 105, vx: f.face * 9, vy: 0, w: s.length * 8 + 14, h: 22, s,
    m: { dmg: 45, kb: 5, hs: 18, bs: 10, snd: 'light' },
    draw(p) {
      ctx.save();
      ctx.globalAlpha = .25; ctx.fillStyle = '#3bff7f'; ctx.fillRect(p.x - p.w / 2 - sgn(p.vx) * 18, p.y - 4, p.w, 8); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(5,20,10,.8)'; rrp(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, 4); ctx.fill();
      ctx.strokeStyle = '#3bff7f'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowColor = '#3bff7f'; ctx.shadowBlur = 10; txt(p.s, p.x, p.y + 1, 14, '#3bff7f', 'center', 'monospace', 0, OL, 'bold');
      ctx.restore();
    },
    onDie(p) { letters(p.x, p.y, 6, '#3bff7f'); }
  });
}

/* ---------- Wall of Text ---------- */
function darkWallImage() { // pre-rendered brick wall made of tiny forum paragraphs
  const c = document.createElement('canvas'); c.width = 110; c.height = 300;
  const g = c.getContext('2d');
  for (let r = 0; r < 12; r++) {
    const off = (r % 2) * 27;
    for (let b = -1; b < 3; b++) {
      const x = b * 55 + off, y = r * 25;
      g.fillStyle = ['#e8dcc0', '#ddd0b0', '#f0e6cf'][(r + b + 3) % 3]; g.fillRect(x + 1, y + 1, 53, 23);
      g.fillStyle = '#4a3f30'; g.font = '6px sans-serif';
      for (let l = 0; l < 3; l++) { let s = ''; while (s.length < 16) s += pick(DARK_WORDS) + ' '; g.fillText(s.slice(0, 16), x + 4, y + 8 + l * 6.5); }
    }
  }
  g.strokeStyle = '#2a2218'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 107, 297);
  return c;
}
function darkShatter(p) { letters(p.x, p.y, 24, '#e8dcc0'); chunks(p.x, p.y, 20, '#ddd0b0'); SFX.heavy(); }

function darkSpawnWall(f) {
  addProj({
    owner: f, x: f.x + f.face * 80, y: GY - 150, vx: f.face * 6.5, dir: f.face, w: 110, h: 300, img: darkWallImage(), m: {},
    // first contact: hit or block pins the target against the wall
    onHit(p, tg) {
      if (p.pin || p.done) return;
      const r = hitRes(p.owner, tg, { dmg: 30, kb: 0, hs: 30, bs: 30, super: true, noScale: true, snd: 'heavy' }, projBox(p), p.dir);
      if (r === 'hit') p.pin = true;
      else if (r === 'block') { p.pin = true; p.blk = true; }
      else if (r !== 'none') p.done = true; // parried
    },
    upd(p) {
      p.x += p.vx;
      const tg = other(p.owner);
      if (p.pin) {
        if (!['hit', 'block'].includes(tg.state)) { p.pin = false; p.done = true; }
        else {
          const front = p.x + p.dir * p.w / 2;
          tg.x = clamp(front + p.dir * 28, LW, RW); tg.t = 0; tg.vx = 0;
          if (p.t % 6 === 0) { // grinding damage while pushed
            hurtHP(tg, p.blk ? 2 : 10); if (tg.hp < 1) tg.hp = 1;
            if (!p.blk) { p.owner.combo++; game.combo[p.owner.idx] = { n: p.owner.combo, t: 70 }; }
            tg.flash = 3; spark(tg.x - p.dir * 20, tg.y - rand(40, 130), '#fff', 5); SFX.light(); game.shake = Math.max(game.shake, 3);
          }
          if ((p.dir > 0 && tg.x >= RW - 1) || (p.dir < 0 && tg.x <= LW + 1)) { // crushed into the corner
            p.alive = false; darkShatter(p);
            hitRes(p.owner, tg, { dmg: p.blk ? 30 : 110, grab: true, kd: true, kb: -3, hs: 30, noScale: true, super: true, snd: 'heavy' }, null, p.dir);
            game.shake = 12; return;
          }
        }
      }
      const front = p.x + p.dir * p.w / 2;
      if ((p.dir > 0 && front > RW + 40) || (p.dir < 0 && front < LW - 40)) { p.alive = false; darkShatter(p); }
    },
    draw(p) {
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(p.x - p.w / 2 + 8, p.y - p.h / 2 + 8, p.w, p.h);
      ctx.drawImage(p.img, p.x - p.w / 2, p.y - p.h / 2);
      txt('WALL OF TEXT', p.x, p.y - p.h / 2 - 14, 18, '#3bff7f', 'center', FONT, 4); ctx.restore();
    }
  });
}

registerFighter({
  id: 'dark', name: 'the.dark.player', spoken: 'The dark player', tag: 'The Fact-Checker', style: 'Zoner / Technical',
  hp: 950, spd: 4, jump: 14.5, kbm: 1, pow: .95,
  color: '#232a3d', accent: '#3bff7f', uiColor: '#3bff7f',
  frameData: { spd: 1.08, dmg: .95, reach: 38 },
  skill: 'CODE THROW', skillDesc: 'Hurls a line of raw code across the screen.', skillCooldown: 55,
  super: 'WALL OF TEXT', superSay: 'Wall of text!', superDesc: 'A towering wall of paragraphs slides across and crushes the foe into the corner.',
  win: ['Fact-checked. Source: me.', 'TL;DR: you lost.', 'Should have read the whole thread.'],
  ai: { range: 300, aggr: .45, cancel: true, superOK: d => d > 120, skillOK: (d, f) => d > 170 && !projs.some(p => p.owner === f) },

  skillMove(f, o, t) {
    if (t % 3 === 0) SFX.type();
    if (t === 10) darkSpawnCode(f);
    if (t >= 24) toIdle(f);
  },

  superMove(f, o, t) {
    if (t < 30 && t % 2 === 0) SFX.type();
    if (t === 30) { darkSpawnWall(f); SFX.heavy(); }
    if (t >= 58) toIdle(f);
  },

  pose(f, P) { // furious typing
    const t = f.t;
    P.lean = .12; P.fa = [.55, 1.45 + Math.sin(t * .9) * .15]; P.ba = [.4, 1.35 + Math.cos(t * .9) * .15];
    if (f.state === 'super' && t >= 30) { P.fa = [1.57, 1.6]; P.lean = .25; }
  },

  look: {
    tw: [15, 18], // torso half-widths at hip / shoulders (for the cel shading pass)
    lw: 12, aw: 12, legC: '#121419', legD: '#0c0d11', armC: '#232a3d', armD: '#191d2b',
    torso(f, P, J) { // dark hoodie
      quad(J.hip, J.sh, 15, 18, '#232a3d');
      quad(lerp(J.hip, J.sh, .1), lerp(J.hip, J.sh, .35), 13, 13, '#191d2b', 1.5);
      line({ x: J.sh.x + 5, y: J.sh.y + 2 }, { x: J.sh.x + 7, y: J.sh.y + 22 }, 1.5, '#ddd');
      line({ x: J.sh.x - 2, y: J.sh.y + 2 }, { x: J.sh.x, y: J.sh.y + 20 }, 1.5, '#ddd');
      const c = lerp(J.hip, J.sh, .62);
      ctx.save(); ctx.shadowColor = '#3bff7f'; ctx.shadowBlur = 8; ctx.translate(c.x + 4, c.y); ctx.scale(f.face || 1, 1);
      txt('>_', 0, 0, 12, '#3bff7f', 'center', 'monospace', 0, OL, 'bold'); ctx.restore();
    },
    head(f, P, J) {
      const c = J.hc;
      ell(c.x - 4, c.y - 1, 19, 21, 0, '#232a3d'); ell(c.x + 6, c.y + 2, 11, 14, 0, '#c99a7c', 2); // hood + face
      ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 12); ctx.quadraticCurveTo(c.x + 8, c.y - 16, c.x + 16, c.y - 8); ctx.lineTo(c.x + 4, c.y - 6); ctx.closePath();
      ctx.fillStyle = '#14161a'; ctx.fill();
      ctx.fillStyle = 'rgba(59,255,127,.35)'; ctx.fillRect(c.x + 5, c.y - 5, 11, 8); // thick-rimmed glasses
      ctx.lineWidth = 3; ctx.strokeStyle = '#050505'; ctx.strokeRect(c.x + 5, c.y - 5, 11, 8);
      ctx.fillStyle = '#bfffd6'; ctx.fillRect(c.x + 12, c.y - 4, 2, 3);
      line({ x: c.x + 8, y: c.y + 10 }, { x: c.x + 14, y: c.y + 10 }, 1.8, '#5a3a2c');
    },
    hand(e, h) { circ(h.x, h.y, 5.5, '#c99a7c'); },
    foot(k, ft) { rr(ft.x - 7, ft.y - 10, 24, 11, 4, '#2a2d33'); ctx.fillStyle = '#3bff7f'; ctx.fillRect(ft.x - 6, ft.y - 2, 22, 2); },
    armDeco(f, s, e, h) { // glowing terminal code down the sleeves
      ctx.save(); ctx.setLineDash([3, 4]); ctx.lineDashOffset = -f.anim * .6;
      ctx.shadowColor = '#3bff7f'; ctx.shadowBlur = 6; ctx.lineWidth = 2; ctx.strokeStyle = '#3bff7f';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.restore();
    },
    front(f, P, J) { darkDrawKeyboard(J.fh, P.fa[1]); }
  }
});
