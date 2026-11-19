'use strict';
/* =========================================================
   Particles, floating texts, generic fx and per-fighter overlays
   fx entries: {t, life, draw(e), upd?(e)} — created by character files
   ========================================================= */

function updParticles() {
  for (const p of parts) { p.t++; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .96; }
  parts = parts.filter(p => p.t < p.life);
  for (const t of texts) { t.t++; t.y -= .6; }
  texts = texts.filter(t => t.t < t.life);
}

function updFx() {
  for (const e of fx) { e.t++; if (e.upd) e.upd(e); }
  fx = fx.filter(e => e.t < e.life);
}

function drawFx(top) { for (const e of fx) if (!!e.top === !!top) e.draw(e); }

/* ---------- manga hit effects ---------- */
const SFX_BIG = ['DOKAN!!', 'BAKI!', 'ZUDOM!', 'ドン!!', 'バキッ!', 'ゴッ!!'];
const SFX_LIGHT = ['BAM!', 'POW!', 'PAF!', 'ドッ', 'ビシッ!'];
const SFX_COLORS = ['#ffe14a', '#ff4fd8', '#5ff3ff', '#ff6a3a', '#b6ff4a'];

/** Starburst flash at the point of impact (drawn on top of the fighters) */
function impactFx(x, y, big, col, blocked) {
  const e = {
    x, y, t: 0, life: big ? 12 : 8, size: big ? 62 : 38, col, rot: rand(0, 6.28), blocked, top: true,
    draw(e) {
      const p = e.t / e.life, s = e.size * (.6 + p * .7);
      ctx.save(); ctx.globalAlpha = 1 - p;
      if (e.blocked) { // shield ring
        ctx.lineWidth = 6 * (1 - p) + 1; ctx.strokeStyle = e.col; ctx.beginPath(); ctx.arc(e.x, e.y, s * .8, 0, Math.PI * 2); ctx.stroke();
      } else {
        starburst(e.x, e.y, s, s * .38, 9, e.rot, e.col, OL, 3);
        starburst(e.x, e.y, s * .62, s * .25, 9, e.rot + .2, '#fff');
      }
      ctx.restore();
    }
  };
  fx.push(e);
}

/** Manga sound-effect word */
function sfxWord(x, y, big) {
  texts.push({ x, y, s: pick(big ? SFX_BIG : SFX_LIGHT), col: pick(SFX_COLORS), size: big ? 46 : 30, life: big ? 34 : 24, t: 0, sfx: true, rot: rand(-.35, .35) });
}

function drawParticles() {
  for (const p of parts) {
    ctx.globalAlpha = 1 - p.t / p.life;
    if (p.k === 'l') { ctx.strokeStyle = p.col; ctx.lineWidth = p.sz; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); ctx.stroke(); }
    else if (p.k === 'c') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (1 + p.t / p.life), 0, Math.PI * 2); ctx.fill(); }
    else if (p.k === 't') txt(p.ch, p.x, p.y, p.sz, p.col, 'center', 'monospace', 0, OL, 'bold');
    else { ctx.fillStyle = p.col; ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz); }
  }
  ctx.globalAlpha = 1;
  for (const t of texts) {
    if (t.sfx) { drawSfxWord(t); continue; }
    const s = t.t < 6 ? 1 + (6 - t.t) * .08 : 1;
    ctx.globalAlpha = Math.min(1, (t.life - t.t) / 15);
    txt(t.s, clamp(t.x, 130, W - 130), t.y, Math.round(t.size * s), t.col, 'center', FONT, 5);
  }
  ctx.globalAlpha = 1;
}

/** Things drawn above a fighter: character UI, stun icon, speech bubble */
function drawWorldUI(f) {
  if (f.ch.drawUI && !f.data.under) f.ch.drawUI(f);

  if (f.state === 'stun') {
    if (f.stunIcon) { ctx.save(); ctx.translate(f.x, f.y - 180); ctx.rotate(Math.sin(f.anim * .3) * .3); ctx.scale(.6, .6); f.stunIcon(); ctx.restore(); }
    for (let i = 0; i < 3; i++) { const a = f.anim * .12 + i * 2.1; txt('★', f.x + Math.cos(a) * 30, f.y - 160 + Math.sin(a) * 8, 14, '#ffd23a'); }
  }

  if (f.say) {
    const s = f.say.s;
    ctx.font = 'bold 15px sans-serif';
    const w = ctx.measureText(s).width + 22, x = clamp(f.x, w / 2 + 10, W - w / 2 - 10), y = f.y - 228;
    rr(x - w / 2, y - 16, w, 32, 10, '#fff', 2.5);
    ctx.beginPath(); ctx.moveTo(f.x - 7, y + 14); ctx.lineTo(f.x + 2, y + 30); ctx.lineTo(f.x + 9, y + 14); ctx.fillStyle = '#fff'; ctx.fill();
    txt(s, x, y + 1, 15, s.includes('TORNATO') ? '#d1222f' : '#111', 'center', 'sans-serif', 0, OL, 'bold');
  }
}

const JP_FONT = "'Yu Gothic','Meiryo','Hiragino Sans','Noto Sans JP',sans-serif";
function drawSfxWord(t) {
  const pop = t.t < 5 ? 1.6 - t.t * .12 : 1, jp = /[\u3040-\u30ff]/.test(t.s);
  ctx.save(); ctx.globalAlpha = Math.min(1, (t.life - t.t) / 10);
  ctx.translate(clamp(t.x, 90, W - 90), t.y); ctx.rotate(t.rot); ctx.scale(pop, pop); ctx.transform(1, 0, -.2, 1, 0, 0);
  ctx.font = (jp ? '900 ' : '') + t.size + 'px ' + (jp ? JP_FONT : FONT);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 12; ctx.strokeStyle = OL; ctx.strokeText(t.s, 3, 3);      // drop shadow
  ctx.lineWidth = 9; ctx.strokeStyle = '#fff'; ctx.strokeText(t.s, 0, 0);    // white border
  ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.strokeText(t.s, 0, 0);
  ctx.fillStyle = t.col; ctx.fillText(t.s, 0, 0);
  ctx.restore();
}
