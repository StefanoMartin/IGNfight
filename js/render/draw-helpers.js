'use strict';
/* =========================================================
   Canvas drawing primitives (outlined comic style)
   ========================================================= */

const OL = '#0a0812'; // outline colour

function rrp(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function rr(x, y, w, h, r, col, ol = 2.5) { rrp(x, y, w, h, r); ctx.fillStyle = col; ctx.fill(); if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); } }
function circ(x, y, r, col, ol = 2.5) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); } }
function ell(x, y, rx, ry, rot, col, ol = 2.5) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); if (ol) { ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); } }
function line(a, b, w, col, cap = 'round') { ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }

/** Thick outlined polyline (arms, legs) */
function limb(pts, w, col) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.lineWidth = w + 5; ctx.strokeStyle = OL; ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}

/** Trapezoid from hip (half-width hw) to shoulder (half-width sw): torsos */
function quad(h, s, hw, sw, col, ol = 3) {
  const dx = s.x - h.x, dy = s.y - h.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(h.x + nx * hw, h.y + ny * hw); ctx.lineTo(s.x + nx * sw, s.y + ny * sw);
  ctx.lineTo(s.x - nx * sw, s.y - ny * sw); ctx.lineTo(h.x - nx * hw, h.y - ny * hw);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  if (ol) { ctx.lineJoin = 'round'; ctx.lineWidth = ol; ctx.strokeStyle = OL; ctx.stroke(); }
}

/** Point at angle a (0 = straight down, +PI/2 = forward) and length l from o */
function seg(o, a, l) { return { x: o.x + Math.sin(a) * l, y: o.y + Math.cos(a) * l }; }

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
