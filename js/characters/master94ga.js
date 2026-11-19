'use strict';
/* =========================================================
   master94ga — Stance / Weapon Master
   Three stances, each with its own weapon and move set:
     ACTION  greatsword  slow, long reach, heavy damage
     RPG     magic staff mid reach; his kick also casts a magic orb
     INDIE   dual daggers very fast, short reach, light damage
   Skill: Stance Switch (cycles ACTION -> RPG -> INDIE)
   Super: 100% Platinum Completion
   ========================================================= */

const MASTER_STANCES = [
  { name: 'ACTION', weapon: 'sword',   col: '#ff6a3a', moves: mkMoves({ spd: 1.1,  dmg: 1.35, reach: 48 }) },
  { name: 'RPG',    weapon: 'staff',   col: '#8a7cff', moves: mkMoves({ spd: 1,    dmg: 1,   reach: 30 }) },
  { name: 'INDIE',  weapon: 'daggers', col: '#3bff7f', moves: mkMoves({ spd: .66,  dmg: .85, reach: 12 }) }
];
const masterStance = f => MASTER_STANCES[f.stance || 0];

function masterSpawnOrb(f) {
  addProj({
    owner: f, x: f.x + f.face * 70, y: f.y - 80, vx: f.face * 6, vy: 0, w: 30, h: 30, life: 0,
    m: { dmg: 35, kb: 4, hs: 16, bs: 9, snd: 'light' },
    upd(p) { p.x += p.vx; p.y += Math.sin(p.t * .25) * 1.2; if (p.t > 70) p.alive = false; },
    draw(p) {
      ctx.save(); ctx.shadowColor = '#8a7cff'; ctx.shadowBlur = 18;
      const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 16); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#b0a4ff'); g.addColorStop(1, 'rgba(120,90,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    },
    onDie(p) { spark(p.x, p.y, '#b0a4ff', 10); }
  });
}

/** Trophies that spiral in around the opponent */
function masterSpawnTrophyRing(f) {
  for (let i = 0; i < 12; i++) {
    addProj({
      owner: f, x: 0, y: 0, vx: 0, w: 30, h: 36, a0: i * Math.PI / 6, r: 190, plat: i % 2 === 0,
      m: { dmg: 14, kb: 1, hs: 18, bs: 6, launch: 4, super: true, noScale: true, snd: 'light' },
      upd(p) {
        const tg = other(p.owner), cx = tg.x, cy = tg.y - 80;
        p.a0 += .17; p.r -= 2.4;
        p.x = cx + Math.cos(p.a0) * p.r; p.y = cy + Math.sin(p.a0) * p.r * .6;
        if (p.r < 18) { p.alive = false; spark(p.x, p.y, '#ffd23a', 6); }
      },
      draw(p) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a0 * 2); ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 12; masterTrophy(p.w, p.h, p.plat); ctx.restore(); },
      onDie(p) { spark(p.x, p.y, p.plat ? '#dfe6ee' : '#ffd23a', 8); }
    });
  }
}
function masterTrophy(w, h, plat) {
  const c1 = plat ? '#eef3f8' : '#ffe27a', c2 = plat ? '#9aa6b4' : '#c99a1a';
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, c2); g.addColorStop(.4, c1); g.addColorStop(1, c2);
  ctx.lineWidth = 2; ctx.strokeStyle = OL;
  ctx.beginPath(); ctx.moveTo(-w * .4, -h * .45); ctx.lineTo(w * .4, -h * .45); ctx.quadraticCurveTo(w * .38, h * .05, 0, h * .1); ctx.quadraticCurveTo(-w * .38, h * .05, -w * .4, -h * .45);
  ctx.fillStyle = g; ctx.fill(); ctx.stroke();
  ctx.fillRect(-w * .07, h * .08, w * .14, h * .18); rr(-w * .28, h * .26, w * .56, h * .18, 2, c2, 2);
}

function masterSpawnFinalTrophy(f) {
  const tg = other(f);
  addProj({
    owner: f, x: tg.x, y: GY + 40, vx: 0, vy: -14, w: 60, h: 84,
    m: { dmg: 90, launch: 18, kb: 3, hs: 34, bs: 18, super: true, noScale: true, snd: 'heavy' },
    upd(p) { p.y += p.vy; p.vy *= .97; if (p.t > 40) p.alive = false; },
    draw(p) { ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = '#fff'; ctx.shadowBlur = 25; masterTrophy(p.w, p.h, true); ctx.restore(); },
    onDie(p) { chunks(p.x, p.y, 20, '#eef3f8'); popText(p.x, p.y - 60, 'PLATINUM!', '#eef3f8', 30); }
  });
}

function masterDrawWeapon(f, h, ang, which) {
  const st = masterStance(f);
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(Math.atan2(Math.cos(ang), Math.sin(ang)));
  if (st.weapon === 'sword' && which === 'front') {
    rr(-14, -3, 14, 6, 2, '#5a3a22', 2);                                     // grip
    rr(-2, -10, 6, 20, 2, '#ffd23a', 2);                                     // guard
    const g = ctx.createLinearGradient(0, -7, 0, 7); g.addColorStop(0, '#ffffff'); g.addColorStop(.5, '#c8d0dc'); g.addColorStop(1, '#7a8696');
    ctx.beginPath(); ctx.moveTo(4, -7); ctx.lineTo(112, -5); ctx.lineTo(124, 0); ctx.lineTo(112, 5); ctx.lineTo(4, 7); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.stroke();
    ctx.globalAlpha = .6; line({ x: 10, y: 0 }, { x: 108, y: 0 }, 1.5, st.col);
  } else if (st.weapon === 'staff' && which === 'front') {
    rr(-40, -3.5, 120, 7, 3, '#7a4a24', 2);
    ctx.shadowColor = st.col; ctx.shadowBlur = 16; circ(84, 0, 9, '#c8bfff', 2); circ(84, 0, 4, '#fff', 0);
  } else if (st.weapon === 'daggers') {
    rr(-8, -3, 10, 6, 2, '#333', 1.5);
    ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(38, 0); ctx.lineTo(2, 5); ctx.closePath();
    ctx.fillStyle = '#e8eef6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
    ctx.globalAlpha = .7; line({ x: 4, y: 0 }, { x: 30, y: 0 }, 1.2, st.col);
  } else if (which === 'back') { // completion ledger / clipboard
    ctx.rotate(-Math.atan2(Math.cos(ang), Math.sin(ang)));
    const glow = f.state === 'super';
    if (glow) { ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 20; }
    rr(-12, -18, 24, 32, 2, '#8a5a32', 2); rr(-9, -14, 18, 25, 1, glow ? '#fffbe0' : '#f4f1e6', 0);
    ctx.shadowBlur = 0; ctx.fillStyle = '#4a4a4a';
    for (let i = 0; i < 4; i++) { ctx.fillRect(-6, -10 + i * 6, 3, 3); ctx.fillRect(-1, -9 + i * 6, 8, 1.2); }
    if (glow) txt('✔', -4, 9, 10, '#1e8a3a');
  }
  ctx.restore();
}

registerFighter({
  id: 'master', name: 'master94ga', spoken: 'Master ninety-four G A', tag: 'Videogiocatore dell\'anno', style: 'Stance / Weapon Master',
  hp: 1100, spd: 4.2, jump: 14.5, kbm: .9, pow: 1.1,
  color: '#1b1d2e', accent: '#ffd23a', uiColor: '#ffd23a',
  frameData: { spd: 1, dmg: 1, reach: 30 },
  skill: 'STANCE SWITCH', skillDesc: 'Cycles ACTION (greatsword) → RPG (magic staff, kick casts an orb) → INDIE (fast dual daggers).', skillCooldown: 24,
  super: '100% PLATINUM COMPLETION', superSay: 'One hundred percent!', superDesc: 'Checks the last box on his ledger: a spiral of gold and platinum trophies surrounds and launches the foe.',
  win: ['Gioco completato. Aggiunto alla lista.', 'Another platinum for the collection.', 'See you in next year\'s thread.'],
  ai: { range: 120, aggr: .75, superOK: d => d < 520, skillOK: () => Math.random() < .1 },

  onReset(f) { f.stance = f.stance || 0; },
  movesFor: f => masterStance(f).moves,
  onAttackActive(f, name) { if (masterStance(f).weapon === 'staff' && name === 'kick') masterSpawnOrb(f); },

  skillMove(f, o, t) {
    if (t === 1) {
      f.stance = ((f.stance || 0) + 1) % 3;
      const st = masterStance(f);
      popText(f.x, f.y - 190, st.name + ' STANCE', st.col, 24); spark(f.x, f.y - 90, st.col, 14); SFX.confirm();
    }
    if (t >= 16) toIdle(f);
  },

  superMove(f, o, t) {
    if (t <= 16) f.inv = 2; // can't be hit while ticking the box
    if (t === 10) { popText(f.x, f.y - 200, '✔ 100%', '#ffe27a', 34); SFX.special(); }
    if (t === 16) masterSpawnTrophyRing(f);
    if (t === 80) masterSpawnFinalTrophy(f);
    if (t >= 88) toIdle(f);
  },

  pose(f, P) {
    if (f.state === 'skill') { const s = f.t / 16; P.fa = [1.2 + s * 1.8, 2.4 + s]; P.lean = .05; P.dy = -Math.sin(s * Math.PI) * 6; }
    else if (f.t < 16) { P.ba = [2.2, 3.4]; P.fa = [1.6, 2.6]; P.lean = -.05; } // reading the ledger
    else { P.fa = [2.8, 3.0]; P.ba = [2.6, 3.2]; P.lean = -.1; }
  },

  drawUI(f) { // stance badge
    if (['ko', 'knockdown'].includes(f.state)) return;
    const st = masterStance(f), x = clamp(f.x - f.face * 46, 60, W - 60), y = f.y - 200;
    rr(x - 30, y - 10, 60, 20, 10, 'rgba(10,8,20,.85)', 0); ctx.strokeStyle = st.col; ctx.lineWidth = 1.5; rrp(x - 30, y - 10, 60, 20, 10); ctx.stroke();
    txt(st.name, x, y + 1, 12, st.col, 'center', FONT);
  },

  look: {
    tw: [15, 18],
    lw: 13, aw: 12, legC: '#1b1d2e', legD: '#121322', armC: '#1b1d2e', armD: '#121322',
    torso(f, P, J) { // track jacket with gold stripes, medals and a trophy belt
      quad(J.hip, J.sh, 15, 18, '#1b1d2e');
      line(lerp(J.hip, J.sh, .05), lerp(J.hip, J.sh, .95), 2, '#e8e8f0');
      const s1 = lerp(J.hip, J.sh, .1), s2 = lerp(J.hip, J.sh, .9);
      line({ x: s1.x + 9, y: s1.y }, { x: s2.x + 11, y: s2.y }, 2.5, '#ffd23a'); line({ x: s1.x - 9, y: s1.y }, { x: s2.x - 11, y: s2.y }, 2.5, '#ffd23a');
      const m = lerp(J.hip, J.sh, .62);
      [[2, '#d22'], [8, '#2a6fd6'], [14, '#1e8a3a']].forEach(([dx, rib], i) => {
        line({ x: m.x + dx, y: m.y - 9 }, { x: m.x + dx, y: m.y - 2 }, 3, rib, 'butt'); circ(m.x + dx, m.y + 2 + (i % 2), 3.6, '#ffd23a', 1.5);
      });
      rr(J.hip.x - 17, J.hip.y - 6, 34, 7, 2, '#2a2a34', 1.5); // platinum trophy belt
      for (const dx of [-12, -2, 8]) { ctx.save(); ctx.translate(J.hip.x + dx + 2, J.hip.y - 9); masterTrophy(8, 10, true); ctx.restore(); }
    },
    head(f, P, J) {
      const c = J.hc;
      circ(c.x, c.y, 15, '#e6b08a');
      ctx.beginPath(); ctx.moveTo(c.x + 13, c.y - 8); ctx.quadraticCurveTo(c.x + 6, c.y - 21, c.x - 10, c.y - 17); ctx.quadraticCurveTo(c.x - 18, c.y - 10, c.x - 15, c.y + 3);
      ctx.lineTo(c.x - 9, c.y - 5); ctx.lineTo(c.x + 2, c.y - 10); ctx.closePath();
      ctx.fillStyle = '#16120e'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = OL; ctx.stroke();
      line({ x: c.x - 6, y: c.y - 15 }, { x: c.x + 5, y: c.y - 15 }, 2, 'rgba(150,170,255,.5)');
      ell(c.x + 8, c.y - 2, 3.6, 3.6, 0, '#fff', 1.3); circ(c.x + 9, c.y - 2, 1.9, '#3a2410', 0); circ(c.x + 9.6, c.y - 2.8, .7, '#fff', 0);
      line({ x: c.x + 3, y: c.y - 8 }, { x: c.x + 14, y: c.y - 6 }, 2.4, '#16120e'); // focused brow
      line({ x: c.x + 7, y: c.y + 9 }, { x: c.x + 13, y: c.y + 9 }, 1.8, '#6a3a26');
    },
    hand(e, h) { circ(h.x, h.y, 5.8, '#e6b08a'); },
    foot(k, ft) { rr(ft.x - 7, ft.y - 10, 24, 11, 4, '#f2f2f2'); ctx.fillStyle = '#ffd23a'; ctx.fillRect(ft.x - 5, ft.y - 6, 18, 2); },
    armDeco(f, s, e, h, front) { if (!front) masterDrawWeapon(f, h, Math.atan2(h.x - e.x, h.y - e.y), 'back'); },
    front(f, P, J) { masterDrawWeapon(f, J.fh, P.fa[1], 'front'); }
  }
});
