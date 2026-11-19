'use strict';
/* =========================================================
   Character select
   1P mode: player 1 picks their fighter, then the CPU's.
   2P mode: both players pick at the same time.
   ========================================================= */

function initSelect() {
  game.scene = 'select';
  const n = CHARS.length;
  game.sel = { c: [game.picks[0] % n, game.picks[1] % n], lock: [false, false], t: 0, prev: [null, null] };
  refreshPreview(0); refreshPreview(1);
}

function refreshPreview(i) {
  const s = game.sel;
  s.prev[i] = new Fighter(CHARS[s.c[i]], i, false);
  if (s.prev[1]) s.prev[1].alt = s.c[0] === s.c[1]; // mirror match colours
}

function selectStep() {
  const s = game.sel, n = CHARS.length;
  const move = (i, ctrl) => {
    if (tap(ctrl, 'l')) { s.c[i] = (s.c[i] + n - 1) % n; SFX.select(); refreshPreview(i); }
    if (tap(ctrl, 'r')) { s.c[i] = (s.c[i] + 1) % n; SFX.select(); refreshPreview(i); }
  };
  const lock = i => { s.lock[i] = true; SFX.confirm(); say(CHARS[s.c[i]].spoken, 'en-US', .5, .95); s.prev[i].state = 'win'; };
  const unlock = i => { s.lock[i] = false; s.prev[i].state = 'idle'; s.t = 0; SFX.select(); };
  const anyOk = () => okTap(0) || okTap(1), anyBack = () => backTap(0) || backTap(1);

  if (game.mode === 0) {
    if (!s.lock[0]) { move(0, 0); move(0, 1); if (anyOk()) lock(0); else if (anyBack()) { game.scene = 'title'; SFX.select(); } }
    else if (!s.lock[1]) { move(1, 0); move(1, 1); if (anyOk()) lock(1); else if (anyBack()) unlock(0); }
    else { s.t++; if (anyBack()) unlock(1); }
  } else {
    for (const i of [0, 1]) {
      if (!s.lock[i]) {
        move(i, i);
        if (okTap(i)) lock(i);
        else if (i === 0 && backTap(0) && !s.lock[1]) { game.scene = 'title'; SFX.select(); return; }
      } else if (backTap(i)) unlock(i);
    }
    if (s.lock[0] && s.lock[1]) s.t++;
  }
  for (const f of s.prev) if (f) { f.anim++; f.t++; }
  if (s.t >= 50) { game.picks = [s.c[0], s.c[1]]; startMatch(); }
}

function drawSelect() {
  const s = game.sel;
  ctx.drawImage(BG, 0, 0); dim(.6);
  bigText('SELECT YOUR FIGHTER', 480, 42, 40);
  txt(game.mode ? '2 PLAYERS VERSUS' : '1 PLAYER vs CPU · ' + DIFF[game.diff].name, 480, 80, 15, '#c9b8ff', 'center', FONT, 3);

  for (const i of [0, 1]) {
    const f = s.prev[i]; if (!f) continue;
    f.face = i ? -1 : 1; if (!s.lock[i]) f.state = 'idle';
    drawSelectArt(i, f.ch, s.lock[i], f.alt);
    // info card
    const ch = f.ch, x = i ? 495 : 265, y = 100, col = i ? '#4aa8ff' : '#ff4a5a';
    rr(x, y, 200, 262, 8, 'rgba(10,6,22,.85)', 0); ctx.strokeStyle = col; ctx.lineWidth = 2; rrp(x, y, 200, 262, 8); ctx.stroke();
    txt(i ? (game.mode ? 'PLAYER 2' : 'CPU') : 'PLAYER 1', x + 10, y + 14, 13, col, 'left', FONT);
    txt(ch.name, x + 10, y + 38, 24, '#fff', 'left', FONT, 4);
    txt(ch.tag, x + 10, y + 60, 12, '#c9b8ff', 'left', 'sans-serif', 0, OL, 'italic');
    txt(ch.style, x + 10, y + 76, 12, ch.uiColor, 'left', 'sans-serif', 0, OL, 'bold');
    [['HEALTH', ch.hp / 1250], ['SPEED', ch.spd / 5.6], ['POWER', ch.pow / 1.4]].forEach(([n, v], k) => {
      txt(n, x + 10, y + 96 + k * 15, 10, '#aaa', 'left', 'sans-serif', 0, OL, 'bold'); bar(x + 64, y + 91 + k * 15, 124, 9, v, '#ffd23a');
    });
    let yy = y + 150;
    txt('SKILL · ' + ch.skill, x + 10, yy, 13, '#3bff7f', 'left', FONT);
    yy = wrap(ch.skillDesc, x + 10, yy + 16, 180, 13, 11, '#ddd');
    txt('SUPER · ' + ch.super, x + 10, yy + 4, 13, '#ffb347', 'left', FONT);
    wrap(ch.superDesc, x + 10, yy + 20, 180, 13, 11, '#ddd');
  }

  // portrait grid (adapts to roster size)
  const n = CHARS.length, size = Math.min(110, 900 / n - 12), gap = size + 12, x0 = 480 - (n * gap - 12) / 2;
  for (let k = 0; k < n; k++) {
    const x = x0 + k * gap, y = 378;
    drawPortrait(CHARS[k], x, y, size, false, false);
    for (const i of [0, 1]) if (s.c[i] === k) {
      const col = i ? '#4aa8ff' : '#ff4a5a', pul = s.lock[i] ? 4 : 2 + Math.sin(frame * .25) * 1.5;
      ctx.strokeStyle = col; ctx.lineWidth = pul + 1; ctx.strokeRect(x - i * 4 + 2, y - i * 4 + 2, size + i * 8 - 4, size + i * 8 - 4);
      txt(i ? (game.mode ? 'P2' : 'CPU') : 'P1', x + (i ? size - 14 : 14), y + 12, 15, col, 'center', FONT, 3);
    }
    txt(CHARS[k].name, x + size / 2, y + size - 8, Math.min(12, size / 6), '#fff', 'center', FONT, 3);
  }

  if (s.lock[0] && s.lock[1]) { if ((frame >> 3) & 1) bigText('GET READY!', 480, 250, 46); }
  else txt(game.mode === 0 && s.lock[0] ? 'Now choose your CPU opponent' : '◀ ▶ choose · F / ENTER confirm · ESC back', 480, 520, 14, '#c9b8ff', 'center', 'sans-serif');
}

/** Big character art panel: coloured backdrop, focus lines, screen tone and a large bust */
function drawSelectArt(i, ch, locked, alt) {
  const x0 = i ? 705 : 0, w = 255, y0 = 92, h = 280;
  ctx.save();
  ctx.beginPath(); // slanted panel
  if (i) { ctx.moveTo(x0 + 22, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w, y0 + h); ctx.lineTo(x0, y0 + h); }
  else { ctx.moveTo(x0, y0); ctx.lineTo(x0 + w - 22, y0); ctx.lineTo(x0 + w, y0 + h); ctx.lineTo(x0, y0 + h); }
  ctx.closePath(); ctx.clip();
  const g = ctx.createLinearGradient(x0, y0, x0 + w * .3, y0 + h);
  g.addColorStop(0, lightCol(ch.accent === '#f4f7fb' ? ch.color : ch.accent, .1)); g.addColorStop(.55, shadeCol(ch.color, .35)); g.addColorStop(1, '#0c0618');
  ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
  ctx.globalAlpha = .22; ctx.fillStyle = halftone(); ctx.fillRect(x0, y0 + h * .4, w, h);
  ctx.globalAlpha = 1;
  focusLines(x0 + w / 2, y0 + 90, 70, 'rgba(255,255,255,' + (locked ? .35 : .14) + ')', 50);
  // giant faded name behind the character
  ctx.save(); ctx.globalAlpha = .13; ctx.translate(x0 + w / 2, y0 + 210); ctx.rotate(-.12);
  ctx.font = '64px ' + FONT; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(ch.name.toUpperCase(), 0, 0); ctx.restore();
  const R = ch.face && ch.face.species === 'mole' ? 42 : 47, bob = Math.sin(frame * .05 + i) * 2;
  if (locked) { ctx.shadowColor = ch.accent; ctx.shadowBlur = 25; }
  if (alt) ctx.filter = 'hue-rotate(160deg)';
  drawBust(ch, x0 + w / 2 + (i ? 10 : -10), y0 + 92 + bob, R, !!i, { expr: locked ? (ch.face.winExpr || 'grin') : undefined });
  ctx.restore();
  ctx.strokeStyle = i ? '#4aa8ff' : '#ff4a5a'; ctx.lineWidth = 3; ctx.beginPath();
  if (i) { ctx.moveTo(x0 + 22, y0); ctx.lineTo(x0, y0 + h); } else { ctx.moveTo(x0 + w - 22, y0); ctx.lineTo(x0 + w, y0 + h); }
  ctx.stroke();
}
