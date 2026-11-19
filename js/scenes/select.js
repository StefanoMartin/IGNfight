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
    // big preview
    ctx.save(); ctx.translate(i ? 820 : 140, 350); ctx.scale(1.3, 1.3); ctx.translate(-f.x, -GY); drawFighter(f); ctx.restore();
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
  const n = CHARS.length, size = Math.min(110, 720 / n - 14), gap = size + 14, x0 = 480 - (n * gap - 14) / 2;
  for (let k = 0; k < n; k++) {
    const x = x0 + k * gap, y = 378;
    drawPortrait(CHARS[k], x, y, size, false, false);
    for (const i of [0, 1]) if (s.c[i] === k) {
      const col = i ? '#4aa8ff' : '#ff4a5a', pul = s.lock[i] ? 4 : 2 + Math.sin(frame * .25) * 1.5;
      ctx.strokeStyle = col; ctx.lineWidth = pul + 1; ctx.strokeRect(x - i * 4 + 2, y - i * 4 + 2, size + i * 8 - 4, size + i * 8 - 4);
      txt(i ? (game.mode ? 'P2' : 'CPU') : 'P1', x + (i ? size - 14 : 14), y + 12, 15, col, 'center', FONT, 3);
    }
    txt(CHARS[k].name, x + size / 2, y + size - 10, 12, '#fff', 'center', FONT, 3);
  }

  if (s.lock[0] && s.lock[1]) { if ((frame >> 3) & 1) bigText('GET READY!', 480, 250, 46); }
  else txt(game.mode === 0 && s.lock[0] ? 'Now choose your CPU opponent' : '◀ ▶ choose · F / ENTER confirm · ESC back', 480, 520, 14, '#c9b8ff', 'center', 'sans-serif');
}
