'use strict';
/* =========================================================
   In-fight HUD: portraits, health, super meter, timer, combos, banners
   ========================================================= */

function drawHUD() {
  for (const f of game.F) {
    const L = f.idx === 0, bx = L ? 92 : 528, bw = 340;

    drawPortrait(f.ch, L ? 12 : 878, 10, 70, !L, f.alt);
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 3; ctx.strokeRect(L ? 12 : 878, 10, 70, 70);
    txt(f.ch.name, L ? bx + 2 : bx + bw - 2, 17, 19, '#fff', L ? 'left' : 'right', FONT, 4);

    // health bar (red part = recent damage draining away), slanted for a dynamic look
    ctx.save(); ctx.translate(bx + bw / 2, 41); ctx.transform(1, 0, L ? -.35 : .35, 1, 0, 0); ctx.translate(-(bx + bw / 2), -41);
    rr(bx - 3, 27, bw + 6, 28, 3, '#2a0a0a', 3);
    const hw = bw * f.hp / f.ch.hp, rw = bw * f.redHp / f.ch.hp;
    ctx.fillStyle = '#d01818'; ctx.fillRect(L ? bx : bx + bw - rw, 30, rw, 22);
    const low = f.hp / f.ch.hp < .25 && (frame >> 3) & 1;
    const g = ctx.createLinearGradient(0, 30, 0, 52);
    g.addColorStop(0, low ? '#ffb0a0' : '#fff27a'); g.addColorStop(1, low ? '#ff5030' : '#f5a300');
    ctx.fillStyle = g; ctx.fillRect(L ? bx : bx + bw - hw, 30, hw, 22);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(L ? bx : bx + bw - hw, 31, hw, 5);        // gloss
    ctx.globalAlpha = .18; ctx.fillStyle = halftone(); ctx.fillRect(L ? bx : bx + bw - hw, 40, hw, 12); ctx.globalAlpha = 1;
    ctx.restore();

    // super meter + skill cooldown
    const mx = L ? 92 : 648, mw = 220, full = f.meter >= 100, align = L ? 'left' : 'right', lx = L ? mx + mw + 8 : mx - 8;
    bar(mx, 60, mw, 9, f.meter / 100, full ? ((frame >> 2) & 1 ? '#fff' : f.ch.accent) : '#3ab0ff');
    txt(full ? 'SUPER READY!' : 'SUPER', lx, 65, 11, full ? '#ffd23a' : '#9ab', align, FONT, 3);
    txt('SKILL', lx, 79, 10, f.cool <= 0 ? '#3bff7f' : '#555', align, FONT, 3);

    // round wins
    for (let k = 0; k < 2; k++) { const cx = L ? 412 - k * 18 : 548 + k * 18; circ(cx, 79, 6, f.wins > k ? '#ffd23a' : '#2a1840', 2); }
  }

  // timer
  rr(435, 14, 90, 62, 8, 'rgba(10,6,22,.8)', 3);
  txt(String(game.timer).padStart(2, '0'), 480, 47, 52, game.timer <= 10 && (frame >> 4) & 1 ? '#ff4a3a' : '#ffd23a', 'center', FONT, 6);

  // combo counters
  for (const c of [0, 1]) {
    const k = game.combo[c];
    if (!k || k.n < 2) continue;
    const x = c ? W - 130 : 130;
    ctx.globalAlpha = Math.min(1, k.t / 20);
    txt(k.n + ' HITS', x, 170, 40, '#ffd23a', 'center', FONT, 6); txt('COMBO!', x, 204, 20, '#fff', 'center', FONT, 4);
    ctx.globalAlpha = 1;
  }
}

/** ROUND / FIGHT! / K.O. / WINS banners and the super cut-in */
function drawBanners() {
  const pt = game.pt, [A, B] = game.F;
  if (game.phase === 'intro' || (game.phase === 'fight' && pt < 120)) {
    if (pt < 78) {
      const fin = A.wins === 1 && B.wins === 1, s = Math.min(1, pt / 10);
      ctx.save(); ctx.translate(480, 250); ctx.scale(s, s);
      bigText(fin ? 'FINAL ROUND' : 'ROUND ' + game.round, 0, 0, 64, -.15, '#fff', '#c9e4ff', '#4aa8ff'); ctx.restore();
    } else if (pt < 125) {
      const k = pt - 78, s = k < 8 ? 2.2 - k * .15 : 1;
      ctx.save(); ctx.translate(480, 250); ctx.scale(s, s); bigText('FIGHT!', 0, 0, 110); ctx.restore();
    }
    if (game.round === 1 && game.phase === 'intro')
      txt('P1: WASD · F punch · G kick · H skill · J super     P2: arrows · , . / · Right Shift     P / ESC pause', 480, 520, 13, '#fff', 'center', 'sans-serif', 3);
  }
  if (game.phase === 'ko') {
    if (pt < 130) {
      const s = pt < 10 ? 2.5 - pt * .15 : 1;
      ctx.save(); ctx.translate(480, 240); ctx.scale(s, s);
      bigText(game.koText, 0, 0, game.koText === 'K.O.' ? 130 : 80, -.15, '#ffe0e0', '#ff3a3a', '#8a0000'); ctx.restore();
    } else {
      const w = game.winner; bigText(w ? w.ch.name + ' WINS' : 'DRAW', 480, 240, 60);
    }
  }
  if (game.freeze > 0) { // super cut-in stripe
    const p = 1 - game.freeze / 42, x = -200 + Math.min(1, p * 3) * 680;
    ctx.save(); ctx.translate(x, 140); ctx.transform(1, 0, -.3, 1, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(-20, -30, 700, 60);
    ctx.fillStyle = game.freezeF.ch.accent; ctx.fillRect(-20, 26, 700, 4); ctx.restore();
    txt(game.superName, x + 300, 140, 36, '#fff', 'center', FONT, 5);
  }
}
