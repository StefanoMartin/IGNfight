'use strict';
/* =========================================================
   Anime face & bust renderer
   One shared 3/4-view head model (facing +x), configured per fighter
   through `face` (hair, eyes, accessories, expression) and `bust`
   (clothing for portraits). Used for in-game heads, HUD portraits,
   the title screen and the big character-select art.

   Head space: centre (0,0), skull radius 19 → scaled to radius R.
   ========================================================= */

const HEAD_U = 19; // skull radius in head units

/* ---------- helpers ---------- */
function _polyPath(pts, move = true) {
  // adds a closed polygon to the current path, forced to clockwise winding
  let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], n = pts[(i + 1) % pts.length]; a += p[0] * n[1] - n[0] * p[1]; }
  const q = a < 0 ? pts.slice().reverse() : pts;
  if (move) ctx.moveTo(q[0][0], q[0][1]); else ctx.lineTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
  ctx.closePath();
}
/** Ink + fill a path built by `build()` (outline drawn as a thick stroke under the fill) */
function _inkFill(build, fill, lw, ink = OL) {
  ctx.beginPath(); build(); ctx.lineJoin = 'round'; ctx.lineWidth = lw * 2; ctx.strokeStyle = ink; ctx.stroke();
  ctx.beginPath(); build(); ctx.fillStyle = fill; ctx.fill();
}
function _gradV(y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }

/* ---------- head shape ---------- */
function _headPath(cfg) {
  ctx.arc(0, -3, HEAD_U, 0, Math.PI * 2);
  if (cfg.jaw === 'square') { ctx.moveTo(-10, -8); ctx.lineTo(19.5, -8); ctx.lineTo(20, 4); ctx.quadraticCurveTo(19.5, 15, 13, 19.5); ctx.lineTo(4, 21); ctx.quadraticCurveTo(-9, 17, -13.5, 3); ctx.closePath(); }
  else { ctx.moveTo(-10, -8); ctx.lineTo(10, -8); ctx.lineTo(19.5, 1); ctx.quadraticCurveTo(19.5, 10, 15, 15.5); ctx.quadraticCurveTo(10, 21, 4, 20.8); ctx.quadraticCurveTo(-9, 15, -13.5, 3); ctx.closePath(); }
}

/* ---------- hair ---------- */
/** Spikes rooted on the skull: [angleDeg, length, halfWidthDeg, bendDeg] (0° = forward, -90° = up) */
function _spikes(list, r = HEAD_U + .5, cx = 0, cy = -3) {
  for (const [a, len, w, bend] of list) {
    const A = a * Math.PI / 180, Wd = w * Math.PI / 180, B = (bend || 0) * Math.PI / 180;
    _polyPath([
      [cx + Math.cos(A - Wd) * r, cy + Math.sin(A - Wd) * r],
      [cx + Math.cos(A + B) * (r + len), cy + Math.sin(A + B) * (r + len)],
      [cx + Math.cos(A + Wd) * r, cy + Math.sin(A + Wd) * r],
      [cx + Math.cos(A) * (r - 6), cy + Math.sin(A) * (r - 6)]
    ]);
  }
}
/** Hair cap over the top/back of the skull down to a hairline */
function _capPath(front = [17, -7], back = [-16, 9], top = 22) {
  ctx.moveTo(back[0], back[1]);
  ctx.quadraticCurveTo(-25, -10, -12, -21);
  ctx.quadraticCurveTo(2, -top - 7, 14, -19);
  ctx.quadraticCurveTo(21, -13, front[0] + 3, front[1]);
  ctx.quadraticCurveTo(9, -10, 3, -9);           // hairline over the forehead
  ctx.quadraticCurveTo(-5, -6, -7, 0);           // temple / sideburn
  ctx.quadraticCurveTo(-9, 6, back[0] + 2, back[1] + 2);
  ctx.closePath();
}
/** Fringe locks hanging over the forehead: [x, y, length, width, lean] */
function _fringe(list) {
  for (const [x, y, len, w, lean] of list) _polyPath([[x - w, y], [x + w, y], [x + (lean || 2) + w * .2, y + len]]);
}

const HAIR = {
  spiky: { // Gaara80
    back: () => { _spikes([[-170, 9, 14, 12], [-150, 13, 13, 10], [-128, 15, 12, 8], [-105, 16, 11, 4], [-82, 14, 11, 0], [-60, 11, 10, -6], [160, 8, 14, 10]]); _capPath(); },
    front: () => { _fringe([[16, -9, 7, 3.2, 3], [11, -10, 8, 3.2, 2], [6, -10, 6, 2.6, 1]]); }
  },
  wild: { // Mao-gp
    back: () => { _spikes([[-175, 12, 13, 20], [-150, 16, 12, 18], [-120, 14, 12, 12], [-95, 18, 10, 6], [-70, 12, 10, -10], [-45, 9, 10, -25], [165, 10, 14, 20]]); _capPath(); },
    front: () => { _fringe([[17, -8, 7, 3.2, 5], [12, -10, 9, 3.5, 2], [5, -10, 6, 2.8, -1]]); }
  },
  quiff: { // Pat_00
    back: () => { _capPath([17, -7], [-15, 8], 24); },
    front: () => { ctx.moveTo(-6, -18); ctx.quadraticCurveTo(6, -38, 26, -27); ctx.quadraticCurveTo(25, -18, 18, -9); ctx.quadraticCurveTo(10, -16, 2, -12); ctx.quadraticCurveTo(-4, -12, -6, -18); ctx.closePath(); }
  },
  slick: { // menoDZero
    back: () => { _capPath([16, -8], [-15, 9], 22); _polyPath([[-20, 2], [-24, 10], [-15, 9]]); },
    front: () => { ctx.moveTo(3, -9); ctx.quadraticCurveTo(12, -16, 18, -7); ctx.quadraticCurveTo(12, -11, 3, -9); ctx.closePath(); }
  },
  neat: { // master94ga
    back: () => { _capPath([17, -6], [-15, 8], 22); },
    front: () => { _fringe([[17, -8, 6, 3, 2], [12, -10, 7, 3.3, 1.5], [7, -11, 6, 3, 1]]); }
  },
  short: { // Kyle_SR84 (under a headband)
    back: () => { _spikes([[-160, 6, 14, 6], [-135, 7, 13, 4], [-110, 7, 12, 2], [-85, 6, 12, 0], [-60, 5, 12, -4]]); _capPath([17, -7], [-15, 8], 21); },
    front: () => { _fringe([[15, -9, 6, 3, 2], [9, -10, 7, 3, 1]]); }
  },
  cap: { // Nkc90 (hair peeking out of a backwards cap)
    back: () => { _spikes([[160, 8, 12, 14], [140, 7, 11, 10], [180, 7, 10, 12]]); },
    front: () => { _fringe([[17, -7, 9, 3, 3], [12, -8, 10, 3.5, 2]]); }
  },
  hood: { // the.dark.player (short fringe under the hood)
    back: () => {},
    front: () => { _fringe([[16, -8, 9, 3.5, 2], [11, -9, 10, 3.5, 1], [6, -9, 8, 3, 0]]); }
  }
};

function _drawHair(cfg, layer, lw) {
  const st = HAIR[cfg.style]; if (!st) return;
  const build = st[layer]; if (!build) return;
  const g = _gradV(-30, 12, cfg.hairLight || lightCol(cfg.hair, .3), cfg.hair);
  _inkFill(build, g, lw);
  // cel shadow + "angel ring" highlight + strands
  ctx.save(); ctx.beginPath(); build(); ctx.clip();
  ctx.fillStyle = 'rgba(30,10,60,.32)'; ctx.beginPath(); ctx.ellipse(-14, 4, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
  if (layer === 'back') {
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(1, -4, 15, -2.6, -1.25); ctx.stroke();
    ctx.strokeStyle = shadeCol(cfg.hair, .3); ctx.lineWidth = .9;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 6, -20 + Math.abs(i - 2) * 2); ctx.quadraticCurveTo(-10 + i * 6, -10, -12 + i * 5, 2); ctx.stroke(); }
  }
  ctx.restore();
}

/* ---------- eyes ---------- */
function _eye(x, y, w, h, cfg, expr, far, lw) {
  const iris = cfg.eyes || '#3a6ad0';
  if (expr === 'pain') { // > <
    ctx.lineWidth = lw * 1.2; ctx.strokeStyle = OL; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h / 2); ctx.lineTo(x + w / 3, y); ctx.lineTo(x - w / 2, y + h / 2); ctx.stroke(); return;
  }
  if (expr === 'ko') {
    ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 3, y - h / 3); ctx.lineTo(x + w / 3, y + h / 3); ctx.moveTo(x + w / 3, y - h / 3); ctx.lineTo(x - w / 3, y + h / 3); ctx.stroke(); return;
  }
  const sclera = () => { ctx.moveTo(x - w / 2, y + h * .05); ctx.quadraticCurveTo(x - w * .1, y - h * .85, x + w / 2, y - h * .25); ctx.quadraticCurveTo(x + w * .2, y + h * .7, x - w / 2, y + h * .05); ctx.closePath(); };
  ctx.beginPath(); sclera(); ctx.fillStyle = '#fbfbff'; ctx.fill();
  ctx.save(); ctx.beginPath(); sclera(); ctx.clip();
  const ix = x + w * (far ? .12 : .08), iy = y + h * .02, rx = w * (far ? .3 : .27), ry = h * .5;
  const g = ctx.createLinearGradient(0, iy - ry, 0, iy + ry); g.addColorStop(0, shadeCol(iris, .55)); g.addColorStop(.55, iris); g.addColorStop(1, lightCol(iris, .45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0c0a14'; ctx.beginPath(); ctx.ellipse(ix + rx * .1, iy, rx * .45, ry * .55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(40,20,80,.35)'; ctx.fillRect(x - w, y - h, w * 2, h * .55);                 // lid shadow
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ix - rx * .25, iy - ry * .35, rx * .38, 0, Math.PI * 2); ctx.fill(); // shine
  ctx.beginPath(); ctx.arc(ix + rx * .35, iy + ry * .45, rx * .18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // lashes
  ctx.lineCap = 'round'; ctx.strokeStyle = OL;
  ctx.lineWidth = lw * 1.35; ctx.beginPath(); ctx.moveTo(x - w / 2 - .5, y + h * .1); ctx.quadraticCurveTo(x - w * .1, y - h * .9, x + w / 2 + .6, y - h * .3); ctx.stroke();
  if (!far) { ctx.beginPath(); ctx.moveTo(x + w / 2, y - h * .3); ctx.lineTo(x + w / 2 + 2, y - h * .55); ctx.stroke(); }
  ctx.lineWidth = lw * .6; ctx.beginPath(); ctx.moveTo(x - w * .3, y + h * .45); ctx.quadraticCurveTo(x + w * .1, y + h * .62, x + w * .4, y + h * .3); ctx.stroke();
  if (expr === 'smirk' || expr === 'cool') { // half-closed lid
    ctx.fillStyle = cfg.skin; ctx.beginPath(); ctx.moveTo(x - w / 2 - 1, y - h); ctx.lineTo(x + w / 2 + 1, y - h); ctx.lineTo(x + w / 2 + 1, y - h * .3); ctx.lineTo(x - w / 2 - 1, y - h * .05); ctx.closePath(); ctx.fill();
    ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * .05); ctx.lineTo(x + w / 2, y - h * .3); ctx.stroke();
  }
}

function _brows(cfg, expr, lw) {
  ctx.strokeStyle = cfg.brow || shadeCol(cfg.hair || '#222', .2); ctx.lineCap = 'round'; ctx.lineWidth = lw * 1.5;
  const angry = expr === 'determined' || expr === 'shout' || expr === 'pain';
  ctx.beginPath(); ctx.moveTo(.5, angry ? -6.5 : -5.5); ctx.quadraticCurveTo(5, angry ? -6.5 : -8.5, 10, angry ? -3.8 : -6); ctx.stroke();
  ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.moveTo(13.5, angry ? -4 : -6); ctx.quadraticCurveTo(16.5, angry ? -6 : -7, 18.6, angry ? -6.5 : -5.5); ctx.stroke();
}

function _mouth(cfg, expr, lw) {
  ctx.strokeStyle = OL; ctx.lineCap = 'round'; ctx.lineWidth = lw * .9;
  if (expr === 'shout' || expr === 'pain' || expr === 'ko') {
    ctx.beginPath(); ctx.moveTo(10, 12.5); ctx.quadraticCurveTo(13, 11, 17, 12); ctx.quadraticCurveTo(16, 18, 12, 17.5); ctx.closePath();
    ctx.fillStyle = '#4a0f16'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8606a'; ctx.beginPath(); ctx.ellipse(13.5, 16.3, 2.4, 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(11, 12.4, 5.5, 1.3);
  } else if (expr === 'grin') {
    ctx.beginPath(); ctx.moveTo(9.5, 13); ctx.quadraticCurveTo(13.5, 14, 17.5, 11.8); ctx.quadraticCurveTo(15, 17.5, 11, 15.5); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  } else if (expr === 'smirk' || expr === 'cool') {
    ctx.beginPath(); ctx.moveTo(10, 14.5); ctx.quadraticCurveTo(14, 15, 17, 12); ctx.stroke();
  } else if (expr === 'determined') {
    ctx.beginPath(); ctx.moveTo(10.5, 14.5); ctx.lineTo(16.5, 14); ctx.stroke();
  } else { ctx.beginPath(); ctx.moveTo(10.5, 14); ctx.quadraticCurveTo(13.5, 15.2, 16.5, 13.5); ctx.stroke(); }
}

/* ---------- accessories ---------- */
function _shades(cfg, lw) {
  ctx.lineCap = 'round'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = lw * 1.3;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(1, 1); ctx.stroke();                         // temple arm
  const lens = () => { ctx.moveTo(.5, -1.5); ctx.lineTo(11, -2.5); ctx.quadraticCurveTo(11.5, 6, 6, 7); ctx.quadraticCurveTo(1, 6.5, .5, -1.5); ctx.closePath();
    ctx.moveTo(13, -2.6); ctx.lineTo(20.2, -2); ctx.quadraticCurveTo(20, 5, 16.5, 6.2); ctx.quadraticCurveTo(13, 5.5, 13, -2.6); ctx.closePath(); };
  const g = ctx.createLinearGradient(0, -3, 0, 7); g.addColorStop(0, '#2a2a34'); g.addColorStop(1, '#050507');
  _inkFill(lens, g, lw * .6);
  ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(11, -1.5); ctx.lineTo(13, -1.5); ctx.stroke(); // bridge
  ctx.save(); ctx.beginPath(); lens(); ctx.clip();
  ctx.strokeStyle = cfg.shadesTint || '#9ef'; ctx.globalAlpha = .75; ctx.lineWidth = lw * 1.1;
  ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(7, -3); ctx.moveTo(14, 4); ctx.lineTo(18, -2); ctx.stroke();
  ctx.restore();
}
function _glasses(cfg, lw) {
  ctx.strokeStyle = '#08080a'; ctx.lineWidth = lw * 1.4; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(59,255,127,.22)';
  ctx.beginPath(); ctx.rect(.2, -2.5, 10.6, 9); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.rect(13.2, -2.8, 6.6, 8.8); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10.8, 0); ctx.lineTo(13.2, 0); ctx.moveTo(.2, 0); ctx.lineTo(-5, 1); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,255,220,.7)'; ctx.lineWidth = lw * .7; ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(6, -1); ctx.stroke();
}
function _headset(lw) {
  ctx.strokeStyle = '#15171c'; ctx.lineWidth = lw * 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-1, -3, 21, Math.PI * 1.08, Math.PI * 1.62); ctx.stroke();
  _inkFill(() => ctx.ellipse(-7, 4, 4.5, 6, 0, 0, Math.PI * 2), '#22252c', lw * .6);
  ctx.strokeStyle = '#15171c'; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.moveTo(-4, 8); ctx.quadraticCurveTo(5, 18, 12, 17); ctx.stroke();
  ctx.fillStyle = '#ff4a5a'; ctx.beginPath(); ctx.arc(12.5, 17, 1.8, 0, Math.PI * 2); ctx.fill();
}
function _neckset(lw) {
  ctx.strokeStyle = '#15171c'; ctx.lineWidth = lw * 2.2; ctx.beginPath(); ctx.ellipse(-1, 23, 13, 5, 0, .1, Math.PI - .1); ctx.stroke();
  _inkFill(() => ctx.ellipse(-12, 22, 4.5, 5.5, 0, 0, Math.PI * 2), '#22252c', lw * .6);
  _inkFill(() => ctx.ellipse(10, 24, 4.5, 5.5, 0, 0, Math.PI * 2), '#22252c', lw * .6);
  ctx.strokeStyle = '#44aadd'; ctx.lineWidth = lw * .7; ctx.beginPath(); ctx.arc(10, 24, 2.6, 0, Math.PI * 2); ctx.stroke();
}
function _headband(cfg, lw) {
  const band = () => { ctx.moveTo(-20, -3); ctx.quadraticCurveTo(0, -14, 20.5, -7.5); ctx.lineTo(20.5, -2.5); ctx.quadraticCurveTo(0, -9, -20, 2); ctx.closePath(); };
  _inkFill(band, cfg.band || '#d82222', lw * .7);
  ctx.save(); ctx.beginPath(); band(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-22, -14, 44, 3.5); ctx.restore();
}
function _capTop(cfg, lw) {
  const dome = () => { ctx.moveTo(19, -6); ctx.quadraticCurveTo(20, -26, 0, -26); ctx.quadraticCurveTo(-21, -25, -20, -4); ctx.quadraticCurveTo(0, -11, 19, -6); ctx.closePath(); };
  _inkFill(dome, _gradV(-27, -4, lightCol(cfg.cap, .25), cfg.cap), lw);
  _inkFill(() => _polyPath([[-19, -9], [-33, -6], [-31, -1], [-19, -3]]), shadeCol(cfg.cap, .25), lw); // brim worn backwards
  ctx.save(); ctx.beginPath(); dome(); ctx.clip();
  ctx.fillStyle = 'rgba(30,10,60,.3)'; ctx.beginPath(); ctx.ellipse(-12, -6, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(2, -8, 14, -2.4, -1.4); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = shadeCol(cfg.cap, .3); ctx.beginPath(); ctx.arc(0, -25.5, 2, 0, Math.PI * 2); ctx.fill();
}
const _hoodRing = cfg => () => { ctx.ellipse(-3, -1, 26, 27.5, 0, 0, Math.PI * 2); ctx.moveTo(23.5, 4); ctx.ellipse(8, 4, 15.5, 20.5, 0, 0, Math.PI * 2, true); };

/* ---------- mole (Talpaman) ---------- */
function _moleHead(cfg, expr, lw) {
  const fur = cfg.fur, furL = cfg.furLight;
  _inkFill(() => { ctx.ellipse(-12, -15, 5, 6, -.4, 0, Math.PI * 2); }, fur, lw);                          // ear
  const head = () => { ctx.ellipse(-1, -1, 21, 18.5, 0, 0, Math.PI * 2); };
  _inkFill(head, _gradV(-20, 18, furL, fur), lw);
  const snout = () => { ctx.moveTo(8, -6); ctx.quadraticCurveTo(30, -8, 36, 2); ctx.quadraticCurveTo(34, 10, 14, 12); ctx.quadraticCurveTo(6, 8, 8, -6); ctx.closePath(); };
  _inkFill(snout, _gradV(-8, 12, lightCol(furL, .25), furL), lw);
  ctx.save(); ctx.beginPath(); head(); ctx.clip();
  ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); ctx.ellipse(-14, 8, 20, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shadeCol(fur, .35); ctx.lineWidth = .9;                                                   // fur strokes
  for (let i = 0; i < 9; i++) { const a = -2.6 + i * .3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14 - 1, Math.sin(a) * 12 - 1); ctx.lineTo(Math.cos(a) * 19 - 1, Math.sin(a) * 17 - 1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(-1, -3, 14, -2.5, -1.3); ctx.stroke();
  ctx.restore();
  _inkFill(() => ctx.ellipse(36.5, 1.5, 4.5, 3.8, 0, 0, Math.PI * 2), _gradV(-2, 5, '#ffc4cc', '#e8808e'), lw * .7); // nose
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(35.5, .2, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(240,230,220,.85)'; ctx.lineWidth = lw * .45;                                        // whiskers
  for (const k of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(28, 6); ctx.quadraticCurveTo(36, 7 + k, 44, 7 + k * 2); ctx.stroke(); }
  ctx.strokeStyle = OL; ctx.lineWidth = lw * .9; ctx.lineCap = 'round';                                       // mouth
  ctx.beginPath(); ctx.moveTo(22, 11); ctx.quadraticCurveTo(26, 12.5, 30, 10); ctx.stroke();
  ctx.save(); ctx.translate(1, -4); ctx.scale(1.05, 1); _shades(cfg, lw); ctx.restore();
}

/* ---------- main entry: head at c with radius R ---------- */
function faceExpr(f, cfg) {
  switch (f.state) {
    case 'attack': case 'skill': case 'super': case 'mcounter': return cfg.attackExpr || 'shout';
    case 'hit': case 'grabbed': case 'locked': case 'stun': case 'knockdown': return 'pain';
    case 'ko': return 'ko';
    case 'win': return cfg.winExpr || 'grin';
    default: return cfg.expr || 'neutral';
  }
}

function drawAnimeHead(f, c, cfg, R, exprOverride, opts = {}) {
  const s = R / HEAD_U, lw = Math.max(1.3, R * .085) / s; // keep ink width readable at any size
  const expr = exprOverride || faceExpr(f, cfg);
  ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, s);
  if (cfg.species === 'mole') { _moleHead(cfg, expr, lw); ctx.restore(); return; }

  if (cfg.style === 'hood') _inkFill(() => ctx.ellipse(-3, -1, 26, 27.5, 0, 0, Math.PI * 2), cfg.hood, lw); // hood back
  // neck + head
  if (!opts.noNeck) _inkFill(() => { ctx.moveTo(-8, 8); ctx.lineTo(7, 10); ctx.lineTo(8, 30); ctx.lineTo(-9, 30); ctx.closePath(); }, shadeCol(cfg.skin, .2), lw);
  _inkFill(() => _headPath(cfg), _gradV(-22, 22, lightCol(cfg.skin, .12), cfg.skin), lw);
  // face shading: cheek shadow, jaw shadow, rim light, blush
  ctx.save(); ctx.beginPath(); _headPath(cfg); ctx.clip();
  ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); ctx.ellipse(-15, 6, 17, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(42,20,88,.18)'; ctx.beginPath(); ctx.ellipse(6, 26, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = RIM; ctx.globalAlpha = .55; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, -3, HEAD_U - 1.3, Math.PI * .6, Math.PI * 1.15); ctx.stroke();
  ctx.globalAlpha = .22; ctx.fillStyle = '#ff6a7a'; ctx.beginPath(); ctx.ellipse(13, 10, 3.5, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if ((cfg.acc || []).includes('stubble')) { ctx.fillStyle = 'rgba(60,35,20,.45)'; for (let i = 0; i < 16; i++) ctx.fillRect(2 + (i % 8) * 2, 15 + (i >> 3) * 2.5 + (i % 2), 1, 1); }
  // features
  const shades = (cfg.acc || []).includes('shades');
  if (!shades) { _eye(5.5, 3.2, 9, 8, cfg, expr, false, lw); _eye(15.8, 3, 5, 7.5, cfg, expr, true, lw); }
  _brows(cfg, expr, lw);
  ctx.strokeStyle = shadeCol(cfg.skin, .45); ctx.lineWidth = lw * .8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(19.6, 6.5); ctx.lineTo(20.8, 9.8); ctx.lineTo(19.4, 10.3); ctx.stroke(); // nose
  _mouth(cfg, expr, lw);
  // hair (cap + spikes on top of the skull), ear, fringe, accessories
  for (const a of cfg.acc || []) { if (a === 'headband') _headband(cfg, lw); }
  if (cfg.style !== 'hood') {
    _inkFill(() => ctx.ellipse(-6.5, 5, 3.2, 4.6, -.15, 0, Math.PI * 2), cfg.skin, lw * .8);
    ctx.fillStyle = 'rgba(80,30,20,.25)'; ctx.beginPath(); ctx.ellipse(-6.1, 5.4, 1.4, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  }
  _drawHair(cfg, 'back', lw);
  if ((cfg.acc || []).includes('headband')) _headband(cfg, lw);
  _drawHair(cfg, 'front', lw);
  if (cfg.style === 'cap') _capTop(cfg, lw);
  if (cfg.style === 'hood') { _inkFill(_hoodRing(cfg), cfg.hood, lw); ctx.save(); ctx.beginPath(); ctx.ellipse(8, 4, 15.5, 20.5, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = 'rgba(10,6,20,.35)'; ctx.fillRect(-10, -20, 40, 9); ctx.restore(); }
  for (const a of cfg.acc || []) {
    if (a === 'shades') _shades(cfg, lw);
    else if (a === 'glasses') _glasses(cfg, lw);
    else if (a === 'headset') _headset(lw);
    else if (a === 'neckset') _neckset(lw);
  }
  ctx.restore();
}

/* ---------- busts (portraits / character select) ---------- */
/** Shoulders + clothing in bust units (head radius 19, head centre at 0,0) */
function _bustBody(ch, lw) {
  const b = ch.bust || {}, base = b.base || ch.color;
  const torso = () => { ctx.moveTo(-52, 92); ctx.lineTo(-48, 48); ctx.quadraticCurveTo(-43, 29, -19, 24); ctx.lineTo(19, 25); ctx.quadraticCurveTo(44, 30, 49, 48); ctx.lineTo(54, 92); ctx.closePath(); };
  _inkFill(torso, _gradV(20, 92, lightCol(base, .18), shadeCol(base, .15)), lw);
  ctx.save(); ctx.beginPath(); torso(); ctx.clip();
  const sh = () => { ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); ctx.moveTo(-70, 20); ctx.lineTo(-18, 20); ctx.lineTo(-30, 95); ctx.lineTo(-70, 95); ctx.closePath(); ctx.fill(); };
  const c = b.collar;
  if (c === 'zip' || c === 'varsity' || c === 'track' || c === 'racing' || c === 'bomber') {
    if (b.inner) { ctx.fillStyle = b.inner; ctx.beginPath(); ctx.moveTo(-10, 24); ctx.lineTo(10, 24); ctx.lineTo(6, 95); ctx.lineTo(-6, 95); ctx.closePath(); ctx.fill(); }
    if (b.trim && c !== 'track') { ctx.fillStyle = b.trim; ctx.fillRect(-70, 50, 140, 12); if (c === 'racing') { ctx.fillStyle = '#111'; ctx.fillRect(-70, 54, 140, 4); } }
    if (c === 'track') { ctx.strokeStyle = b.trim; ctx.lineWidth = 4; for (const x of [-32, 32]) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x * 1.1, 95); ctx.stroke(); } }
    if (c === 'varsity') { ctx.fillStyle = b.trim; for (const x of [-54, 38]) ctx.fillRect(x, 30, 16, 70); }
    ctx.strokeStyle = shadeCol(base, .5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(1, 26); ctx.lineTo(1, 95); ctx.stroke(); // zipper
    sh();
    _inkFill(() => { ctx.moveTo(-20, 22); ctx.lineTo(-4, 36); ctx.lineTo(-1, 25); ctx.closePath(); ctx.moveTo(20, 23); ctx.lineTo(4, 36); ctx.lineTo(2, 25); ctx.closePath(); }, b.trim || lightCol(base, .2), lw * .7);
  } else if (c === 'blazer') {
    ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(-14, 24); ctx.lineTo(14, 24); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
    sh();
    ctx.fillStyle = shadeCol(base, .25); ctx.strokeStyle = OL; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(-15, 24); ctx.lineTo(-24, 40); ctx.lineTo(-12, 44); ctx.lineTo(0, 72); ctx.lineTo(-6, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 24); ctx.lineTo(24, 40); ctx.lineTo(12, 44); ctx.lineTo(0, 72); ctx.lineTo(6, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(2, 82, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (c === 'hoodie') {
    sh();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, 28); ctx.lineTo(-8, 56); ctx.moveTo(8, 28); ctx.lineTo(9, 54); ctx.stroke();
    ctx.save(); ctx.shadowColor = '#3bff7f'; ctx.shadowBlur = 10; ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#3bff7f'; ctx.textAlign = 'center'; ctx.fillText('>_', 22, 72); ctx.restore();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = '#3bff7f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-46, 52); ctx.lineTo(-50, 92); ctx.moveTo(46, 54); ctx.lineTo(51, 92); ctx.stroke(); ctx.setLineDash([]);
  } else if (c === 'vest') {
    ctx.fillStyle = b.inner || '#ece6da'; ctx.beginPath(); ctx.moveTo(-22, 24); ctx.lineTo(22, 24); ctx.lineTo(16, 95); ctx.lineTo(-16, 95); ctx.closePath(); ctx.fill();
    sh();
    ctx.strokeStyle = OL; ctx.lineWidth = lw * .8; ctx.beginPath(); ctx.moveTo(-22, 24); ctx.lineTo(-16, 95); ctx.moveTo(22, 24); ctx.lineTo(16, 95); ctx.stroke();
    [['#e33', -32, 52], ['#fc2', 31, 64], ['#3c6', -30, 76], ['#f80', 34, 42]].forEach(([col, x, y], i) => { ctx.fillStyle = col; ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); if (i % 2) ctx.rect(x - 5, y - 5, 10, 10); else ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  } else if (c === 'fur') {
    sh();
    ctx.fillStyle = 'rgba(255,240,220,.25)'; ctx.beginPath(); ctx.ellipse(10, 60, 22, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b3f1e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(34, 32); ctx.lineTo(-26, 95); ctx.stroke();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(30, 58, 22, 11); ctx.fillStyle = '#111'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MOD', 41, 66);
  } else sh();
  if (b.emblem) { ctx.font = '16px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.strokeText(b.emblem, -24, 78); ctx.fillStyle = b.emblemColor || '#fff'; ctx.fillText(b.emblem, -24, 78); }
  if (b.medals) [[-28, '#d22'], [-19, '#2a6fd6'], [-10, '#1e8a3a']].forEach(([x, rib]) => { ctx.fillStyle = rib; ctx.fillRect(x - 2, 40, 4, 10); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, 54, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
  ctx.strokeStyle = RIM; ctx.globalAlpha = .55; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-49, 92); ctx.lineTo(-45, 48); ctx.quadraticCurveTo(-40, 32, -21, 27); ctx.stroke();
  ctx.restore();
  if (b.scarf) { // scarf around the neck
    _inkFill(() => { ctx.moveTo(-16, 18); ctx.quadraticCurveTo(0, 30, 18, 20); ctx.lineTo(20, 28); ctx.quadraticCurveTo(0, 40, -18, 27); ctx.closePath(); }, b.scarf, lw);
    _inkFill(() => { ctx.moveTo(8, 30); ctx.lineTo(16, 30); ctx.lineTo(20, 64); ctx.lineTo(10, 62); ctx.closePath(); }, shadeCol(b.scarf, .15), lw);
  }
}

/** Head-and-shoulders portrait centred on (x, y) = head centre, head radius R */
function drawBust(ch, x, y, R, flip, opts = {}) {
  const s = R / HEAD_U, lw = Math.max(1.3, R * .085) / s;
  const fake = { anim: frame, state: opts.state || 'idle', ch, data: {}, face: 1 };
  ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -1 : 1, 1);
  ctx.save(); ctx.scale(s, s); _bustBody(ch, lw); ctx.restore();
  drawAnimeHead(fake, { x: 0, y: 0 }, ch.face, R, opts.expr);
  ctx.restore();
}
