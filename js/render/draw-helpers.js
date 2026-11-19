'use strict';
/* =========================================================
   Canvas drawing primitives — manga / anime cel-shaded style
   - ink outlines
   - tapered, rounded limbs
   - two-tone cel shadows (cool purple), highlights and a cyan rim light
   Shading on round shapes is only applied while CEL = true
   (set by the fighter renderer), so UI boxes stay flat.
   ========================================================= */

const OL = '#0a0812';                  // ink colour
const SHADOW_TINT = '#2a1458';         // cel shadows lean towards purple
const LIGHT_TINT = '#fff6e0';          // warm key light
const SHADOW_FILL = 'rgba(42,20,88,.38)';
let RIM = '#5ff3ff';                   // cyan rim light from behind
let CEL = false;

/* ---------- colour utilities ---------- */
const _colCache = new Map();
function parseCol(c) {
  if (typeof c !== 'string' || c[0] !== '#') return null;
  let h = c.slice(1);
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function mixCol(c, t, target) {
  const key = c + '|' + t + '|' + target;
  let r = _colCache.get(key);
  if (r) return r;
  const a = parseCol(c), b = parseCol(target);
  if (!a || !b) return c;
  r = 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  _colCache.set(key, r);
  return r;
}
const shadeCol = (c, t = .4) => mixCol(c, t, SHADOW_TINT);
const lightCol = (c, t = .35) => mixCol(c, t, LIGHT_TINT);

/* ---------- basic shapes ---------- */
function rrp(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

function rr(x, y, w, h, r, col, ol = 2.5) {
  rrp(x, y, w, h, r); ctx.fillStyle = col; ctx.fill();
  if (CEL && ol && w >= 24 && h >= 24) { // cel shading on big rounded blocks (e.g. Kyle's head)
    ctx.save(); ctx.clip();
    ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); ctx.moveTo(x - 2, y + h * .45); ctx.lineTo(x + w * .35, y + h + 2); ctx.lineTo(x - 2, y + h + 2); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - 2, y + h * .78, w + 4, h);
    ctx.globalAlpha = .55; ctx.strokeStyle = RIM; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 1.5, y + h * .2); ctx.lineTo(x + 1.5, y + h - 4); ctx.stroke();
    ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + w * .72, y + h * .2, w * .14, h * .07, -.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); rrp(x, y, w, h, r);
  }
  if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); }
}

/** Crescent cel shadow, shine and rim light inside an ellipse (heads, fists) */
function celRound(x, y, rx, ry) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); ctx.ellipse(x - rx * .6, y + ry * .55, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = .55; ctx.strokeStyle = RIM; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(x, y, rx - 1.2, ry - 1.2, 0, Math.PI * .55, Math.PI * 1.25); ctx.stroke();
  ctx.globalAlpha = .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + rx * .35, y - ry * .5, rx * .26, ry * .14, -.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function circ(x, y, r, col, ol = 2.5) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  if (CEL && ol && r >= 9) { celRound(x, y, r, r); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); }
}

function ell(x, y, rx, ry, rot, col, ol = 2.5) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  if (CEL && ol && Math.min(rx, ry) >= 9) { celRound(x, y, rx, ry); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
  if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); }
}

function line(a, b, w, col, cap = 'round') { ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }

/* ---------- tapered limbs ---------- */
/** Adds a capsule (two circles + connecting quad, same winding) to the current path */
function capsulePath(a, b, ra, rb) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || .001, nx = -dy / L, ny = dx / L;
  let q = [[a.x + nx * ra, a.y + ny * ra], [b.x + nx * rb, b.y + ny * rb], [b.x - nx * rb, b.y - ny * rb], [a.x - nx * ra, a.y - ny * ra]];
  let area = 0; for (let i = 0; i < 4; i++) { const p = q[i], n = q[(i + 1) % 4]; area += p[0] * n[1] - n[0] * p[1]; }
  if (area < 0) q = q.reverse(); // keep the same winding as arc() so the union fills solid
  ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath();
  ctx.moveTo(a.x + ra, a.y); ctx.arc(a.x, a.y, ra, 0, Math.PI * 2);
  ctx.moveTo(b.x + rb, b.y); ctx.arc(b.x, b.y, rb, 0, Math.PI * 2);
}

/** Thick limb through pts, tapering from root to tip, with ink outline and cel shading */
function limb(pts0, w, col) {
  // taper from root to tip, with a fuller "muscle" point a third of the way down each segment
  const pts = [], rs = [], n0 = pts0.length - 1;
  for (let i = 0; i <= n0; i++) {
    const r = w / 2 * (1.12 - .32 * i / n0);
    pts.push(pts0[i]); rs.push(r);
    if (i < n0) { pts.push(lerp(pts0[i], pts0[i + 1], .35)); rs.push(r * (i === 0 ? 1.08 : 1.12)); }
  }
  const n = pts.length - 1;
  const segs = (grow, off) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[i + 1];
      if (off) {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || .001;
        let sx = -dy / L, sy = dx / L;
        if (sy - sx * .6 < 0) { sx = -sx; sy = -sy; } // shadow side = down / back
        capsulePath({ x: a.x + sx * rs[i] * off, y: a.y + sy * rs[i] * off }, { x: b.x + sx * rs[i + 1] * off, y: b.y + sy * rs[i + 1] * off }, rs[i], rs[i + 1]);
      } else capsulePath(a, b, rs[i] + grow, rs[i + 1] + grow);
    }
  };
  segs(2.6); ctx.fillStyle = OL; ctx.fill();   // ink
  segs(0); ctx.fillStyle = col; ctx.fill();    // base colour
  if (w < 9) return;
  ctx.save(); ctx.clip();
  segs(0, .62); ctx.fillStyle = shadeCol(col, .45); ctx.fill(); // cel shadow band
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { // highlight + rim light
    const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || .001;
    let sx = -dy / L, sy = dx / L; if (sy - sx * .6 < 0) { sx = -sx; sy = -sy; }
    ctx.globalAlpha = .55; ctx.strokeStyle = lightCol(col, .45); ctx.lineWidth = Math.max(1.5, w * .14);
    ctx.beginPath(); ctx.moveTo(a.x - sx * rs[i] * .45, a.y - sy * rs[i] * .45); ctx.lineTo(b.x - sx * rs[i + 1] * .45, b.y - sy * rs[i + 1] * .45); ctx.stroke();
    ctx.globalAlpha = .5; ctx.strokeStyle = RIM; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x + sx * rs[i] * .88, a.y + sy * rs[i] * .88); ctx.lineTo(b.x + sx * rs[i + 1] * .88, b.y + sy * rs[i + 1] * .88); ctx.stroke();
  }
  ctx.restore();
}

/* ---------- torsos ---------- */
/** Curved torso outline from hip (half-width hw) to shoulders (half-width sw) */
function torsoPath(h, s, hw, sw) {
  const dx = s.x - h.x, dy = s.y - h.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  let nx = -uy, ny = ux; if (nx < 0) { nx = -nx; ny = -ny; } // n = front side
  const m = lerp(h, s, .5), mw = (hw + sw) / 2;
  ctx.beginPath();
  ctx.moveTo(h.x + nx * hw, h.y + ny * hw);
  ctx.quadraticCurveTo(m.x + nx * mw * 1.18, m.y + ny * mw * 1.18, s.x + nx * sw, s.y + ny * sw);       // chest
  ctx.quadraticCurveTo(s.x + ux * sw * .45, s.y + uy * sw * .45, s.x - nx * sw, s.y - ny * sw);          // shoulders
  ctx.quadraticCurveTo(m.x - nx * mw * 1.12, m.y - ny * mw * 1.12, h.x - nx * hw, h.y - ny * hw);       // back
  ctx.quadraticCurveTo(h.x - ux * hw * .2, h.y - uy * hw * .2, h.x + nx * hw, h.y + ny * hw);           // waist
  ctx.closePath();
  return { nx, ny, ux, uy };
}

/** Torso fill. With ol=0 it draws a flat straight band (clothing details on top of a torso). */
function quad(h, s, hw, sw, col, ol = 3) {
  if (!ol) {
    const dx = s.x - h.x, dy = s.y - h.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.beginPath();
    ctx.moveTo(h.x + nx * hw, h.y + ny * hw); ctx.lineTo(s.x + nx * sw, s.y + ny * sw);
    ctx.lineTo(s.x - nx * sw, s.y - ny * sw); ctx.lineTo(h.x - nx * hw, h.y - ny * hw);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    return;
  }
  torsoPath(h, s, hw, sw);
  const g = ctx.createLinearGradient(s.x, s.y, h.x, h.y); // slightly lighter chest
  g.addColorStop(0, lightCol(col, .12)); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineWidth = ol + .5; ctx.strokeStyle = OL; ctx.stroke();
}

/** Cel shadow + rim light over a finished torso (drawn after its clothing details) */
function celTorso(h, s, hw, sw) {
  ctx.save();
  const d = torsoPath(h, s, hw, sw); ctx.clip();
  const { nx, ny, ux, uy } = d;
  ctx.fillStyle = SHADOW_FILL; ctx.beginPath(); // back half in shadow
  ctx.moveTo(h.x + nx * hw * .1, h.y + ny * hw * .1); ctx.lineTo(s.x - nx * sw * .05, s.y - ny * sw * .05);
  ctx.lineTo(s.x - nx * sw * 2.5, s.y - ny * sw * 2.5); ctx.lineTo(h.x - nx * hw * 2.5, h.y - ny * hw * 2.5); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(h.x, h.y, h.x + ux * 30, h.y + uy * 30); // waist shadow
  g.addColorStop(0, 'rgba(42,20,88,.35)'); g.addColorStop(1, 'rgba(42,20,88,0)');
  ctx.fillStyle = g; ctx.fillRect(Math.min(h.x, s.x) - 60, Math.min(h.y, s.y) - 60, 120 + Math.abs(s.x - h.x), 120 + Math.abs(s.y - h.y));
  ctx.lineCap = 'round';
  ctx.globalAlpha = .6; ctx.strokeStyle = RIM; ctx.lineWidth = 3; // rim light along the back
  ctx.beginPath(); ctx.moveTo(h.x - nx * hw * .9, h.y - ny * hw * .9); ctx.lineTo(s.x - nx * sw * .9, s.y - ny * sw * .9); ctx.stroke();
  ctx.globalAlpha = .35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;    // key light along the chest
  ctx.beginPath(); ctx.moveTo(h.x + nx * hw * .75 + ux * 20, h.y + ny * hw * .75 + uy * 20); ctx.lineTo(s.x + nx * sw * .8 - ux * 6, s.y + ny * sw * .8 - uy * 6); ctx.stroke();
  ctx.restore();
}

/** Point at angle a (0 = straight down, +PI/2 = forward) and length l from o */
function seg(o, a, l) { return { x: o.x + Math.sin(a) * l, y: o.y + Math.cos(a) * l }; }

/* ---------- text ---------- */
function txt(s, x, y, size, col, align = 'center', family = FONT, ol = 0, olc = OL, weight = '') {
  ctx.font = (weight ? weight + ' ' : '') + size + 'px ' + family;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = olc; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

/** Big slanted arcade title text with gradient fill */
function bigText(s, x, y, size, skew = -.18, g1 = '#fff35a', g2 = '#ff8a1e', g3 = '#e01e1e', ol = 9) {
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.font = size + 'px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = ol + 6; ctx.strokeStyle = '#000'; ctx.strokeText(s, 0, 0);
  ctx.lineWidth = ol; ctx.strokeStyle = '#5a0d0d'; ctx.strokeText(s, 0, 0);
  const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  g.addColorStop(0, g1); g.addColorStop(.5, g2); g.addColorStop(1, g3);
  ctx.fillStyle = g; ctx.fillText(s, 0, 0); ctx.restore();
}

/** Word-wrapped left-aligned text; returns the y below the last line */
function wrap(s, x, y, maxW, lh, size, col, family = 'sans-serif', weight = '') {
  ctx.font = (weight ? weight + ' ' : '') + size + 'px ' + family;
  const words = s.split(' ');
  let ln = '', yy = y;
  for (const w of words) {
    const t = ln ? ln + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && ln) { txt(ln, x, yy, size, col, 'left', family, 0, OL, weight); ln = w; yy += lh; }
    else ln = t;
  }
  if (ln) txt(ln, x, yy, size, col, 'left', family, 0, OL, weight);
  return yy + lh;
}

function dim(a) { ctx.fillStyle = 'rgba(6,2,14,' + a + ')'; ctx.fillRect(0, 0, W, H); }

function bar(x, y, w, h, v, col) {
  ctx.fillStyle = '#1a1028'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(v, 0, 1), h);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
}

/* ---------- manga effects ---------- */
/** Concentrated "focus lines" pointing at (cx, cy), re-randomised every frame */
function focusLines(cx, cy, inner, col = 'rgba(255,255,255,.8)', n = 90) {
  ctx.save(); ctx.fillStyle = col;
  const R = 1100;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, w = rand(.004, .02), r0 = inner * rand(.85, 1.5);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R);
    ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** Screen-tone dot pattern (cached) */
let _halftone = null;
function halftone() {
  if (_halftone) return _halftone;
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const g = c.getContext('2d'); g.fillStyle = '#000';
  g.beginPath(); g.arc(2, 2, 1.5, 0, Math.PI * 2); g.arc(6, 6, 1.5, 0, Math.PI * 2); g.fill();
  _halftone = ctx.createPattern(c, 'repeat') || 'rgba(0,0,0,.2)';
  return _halftone;
}

/** Jagged starburst polygon (impact flashes) */
function starburst(x, y, r1, r2, spikes, rot, fill, stroke, lw = 3) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + i * Math.PI / spikes, r = i % 2 ? r2 : r1 * (.8 + ((i * 37) % 10) / 25);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineJoin = 'miter'; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
