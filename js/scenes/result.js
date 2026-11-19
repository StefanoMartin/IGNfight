'use strict';
/* =========================================================
   Match result screen
   ========================================================= */

function resultStep() {
  const r = game.result;
  if (r.w) r.w.anim++;
  if (okTap(0) || okTap(1)) { SFX.confirm(); startMatch(); }
  else if (backTap(0) || backTap(1)) { SFX.select(); initSelect(); }
}

function drawResult() {
  const r = game.result;
  ctx.drawImage(BG, 0, 0); dim(.55);
  if (r.w) {
    ctx.save(); ctx.translate(250, 470); ctx.scale(1.7, 1.7); ctx.translate(-r.w.x, -GY); drawFighter(r.w); ctx.restore();
    bigText(r.w.ch.name, 640, 120, 58); bigText('WINS!', 640, 185, 58, -.15, '#fff', '#ffe27a', '#f5a300');
    rr(440, 240, 420, 70, 12, '#fff', 3);
    ctx.beginPath(); ctx.moveTo(445, 280); ctx.lineTo(400, 300); ctx.lineTo(445, 295); ctx.fillStyle = '#fff'; ctx.fill();
    wrap('“' + r.quote + '”', 460, 262, 380, 22, 18, '#111', 'sans-serif', 'bold');
    txt(game.F[0].wins + '  –  ' + game.F[1].wins, 640, 350, 40, '#ffd23a', 'center', FONT, 5);
  } else bigText('DRAW GAME', 480, 200, 70);
  txt('ENTER / F  rematch       ESC  character select', 640, 430, 18, '#fff', 'center', FONT, 4);
}
