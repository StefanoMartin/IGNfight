'use strict';
/* =========================================================
   Title screen + How to play overlay
   ========================================================= */

const TITLE_MENU = 4; // 1P, 2P, CPU level, How to play

function titleStep() {
  if (game.help) {
    if (okTap(0) || backTap(0) || okTap(1) || backTap(1)) { game.help = false; SFX.select(); }
    return;
  }
  if (tapAny('u')) { game.menu = (game.menu + TITLE_MENU - 1) % TITLE_MENU; SFX.select(); }
  if (tapAny('d')) { game.menu = (game.menu + 1) % TITLE_MENU; SFX.select(); }
  if (game.menu === 2 && (tapAny('l') || tapAny('r'))) { game.diff = (game.diff + (tapAny('r') ? 1 : 2)) % 3; SFX.select(); }
  if (okTap(0) || okTap(1)) {
    SFX.confirm();
    if (game.menu === 0) { game.mode = 0; initSelect(); }
    else if (game.menu === 1) { game.mode = 1; initSelect(); }
    else if (game.menu === 2) game.diff = (game.diff + 1) % 3;
    else game.help = true;
  }
}

function drawTitle() {
  ctx.drawImage(BG, 0, 0); dim(.55);
  const n = CHARS.length, gap = Math.min(150, 760 / n), x0 = 480 - (n - 1) * gap / 2;
  CHARS.forEach((c, i) => {
    drawPortrait(c, x0 + i * gap - 48, 392, 96, false, false);
    txt(c.name, x0 + i * gap, 500, 15, '#fff', 'center', FONT, 4);
  });
  const b = Math.sin(frame * .05) * 3;
  bigText('FORUM', 480, 78 + b, 84, -.18); bigText('FIGHTERS', 480, 150 + b, 84, -.18);
  txt('IGN ITALIA COMMUNITY EDITION', 480, 204, 18, '#c9b8ff', 'center', FONT, 4);
  const items = ['1 PLAYER  vs  CPU', '2 PLAYERS  VERSUS', 'CPU LEVEL:  ◀ ' + DIFF[game.diff].name + ' ▶', 'HOW TO PLAY'];
  items.forEach((s, i) => {
    const sel = game.menu === i, y = 246 + i * 34;
    if (sel) { ctx.fillStyle = 'rgba(255,210,58,.16)'; ctx.fillRect(330, y - 15, 300, 30); txt('▶', 345, y, 18, '#ffd23a'); }
    txt(s, 480, y, sel ? 24 : 20, sel ? '#ffd23a' : '#e8e0ff', 'center', FONT, 4);
  });
  txt('W/S or ↑/↓ to choose · ENTER / F to confirm · M music · click the game first if keys do nothing', 480, 526, 12, '#a99bd0', 'center', 'sans-serif');
  if (game.help) drawHelp();
}

function drawHelp() {
  dim(.85); bigText('HOW TO PLAY', 480, 44, 40);
  const rows = [
    ['PLAYER 1', 'W A S D move/jump/crouch · F punch · G kick · H skill · J super'],
    ['PLAYER 2', 'Arrows move · , punch · . kick · / skill · Right Shift super (or Numpad 1 2 3 0)'],
    ['GAMEPAD', 'Stick/D-pad · X punch · A kick · B skill · Y or RB super · Start pause'],
    ['BLOCK', 'Hold away from your opponent. Hold down-back against low attacks.'],
    ['SUPER', 'The meter under your health fills as you hit and get hit. At 100% press Super.'],
    ['COMBOS', 'A punch or kick that lands can be cancelled into Skill or Super.'],
    ['CROUCH', 'Down + Punch = low jab · Down + Kick = sweep (knockdown)']
  ];
  rows.forEach(([a, b], i) => { txt(a, 90, 96 + i * 30, 17, '#ffd23a', 'left', FONT); txt(b, 210, 96 + i * 30, 15, '#fff', 'left', 'sans-serif'); });
  const step = Math.min(38, 190 / CHARS.length);
  CHARS.forEach((c, i) => {
    const y = 318 + i * step;
    drawPortrait(c, 60, y - 16, 32, false, false);
    txt(c.name, 104, y - 7, 16, c.uiColor, 'left', FONT); txt(c.style, 104, y + 10, 11, '#bbb', 'left', 'sans-serif');
    txt('SKILL ' + c.skill + ': ' + c.skillDesc, 300, y - 7, 12, '#ddd', 'left', 'sans-serif');
    txt('SUPER ' + c.super + ': ' + c.superDesc, 300, y + 10, 12, '#ddd', 'left', 'sans-serif');
  });
  txt('ENTER / ESC to close', 480, 526, 13, '#a99bd0', 'center', 'sans-serif');
}
