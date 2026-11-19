'use strict';
/* =========================================================
   Fight scene: match / round flow, per-frame update and drawing
   ========================================================= */

function startMatch() {
  const [a, b] = game.picks;
  game.F = [new Fighter(CHARS[a], 0, false), new Fighter(CHARS[b], 1, game.mode === 0)];
  if (a === b) game.F[1].alt = true;
  game.round = 1; game.scene = 'fight';
  startRound();
}

function startRound() {
  const [A, B] = game.F;
  A.reset(300); B.reset(660);
  projs = []; parts = []; texts = []; fx = [];
  Object.assign(game, { timer: 99, tick: 0, phase: 'intro', pt: 0, combo: [null, null], koText: '', winner: null, stop: 0, freeze: 0, paused: false, redFlash: 0 });
}

function timeOver() {
  game.phase = 'ko'; game.pt = 70; game.koText = 'TIME OVER'; say('Time over', 'en-US', .5, .9);
  const [A, B] = game.F, ra = A.hp / A.ch.hp, rb = B.hp / B.ch.hp;
  game.winner = ra > rb ? A : rb > ra ? B : null;
}

/** Builds this frame's input for a fighter (keyboard/pad or CPU) */
function readFighterInput(f) {
  let I;
  if (f.cpu) I = aiInput(f, other(f));
  else {
    I = Object.assign({}, IN[f.idx]);
    if (game.mode === 0) for (const k in IN[1]) I[k] = I[k] || IN[1][k]; // 1P can use either key set
  }
  if (game.phase !== 'fight') for (const k in I) I[k] = false;
  f.tap = {};
  for (const b of ['p', 'k', 's', 'x', 'u']) f.tap[b] = !!I[b] && !f.prev[b];
  f.prev = I; f.inp = I;
}

function fightStep() {
  if (tap(0, 'pause') || tap(1, 'pause')) { game.paused = !game.paused; SFX.select(); }
  if (game.paused) { if (tap(0, 'quit')) { game.paused = false; initSelect(); } return; }

  updParticles();
  if (game.redFlash > 0) game.redFlash--;
  game.shake *= .86; if (game.shake < .4) game.shake = 0;
  if (game.freeze > 0) { game.freeze--; if (game.freezeF) game.freezeF.anim++; return; } // super cut-in
  if (game.stop > 0) { game.stop--; return; }                                           // hitstop

  game.pt++;
  if (game.phase === 'ko' && game.pt < 70 && game.pt % 3) return; // K.O. slow motion

  const [A, B] = game.F;
  for (const f of game.F) readFighterInput(f);
  updFighter(A, B); updFighter(B, A); pushApart(A, B);
  updProjs(); updFx();

  for (const f of game.F) {
    if (!['hit', 'locked', 'stun'].includes(f.state)) f.redHp += (f.hp - f.redHp) * .06;
    if (f.redHp < f.hp) f.redHp = f.hp;
  }
  for (const c of [0, 1]) if (game.combo[c] && --game.combo[c].t <= 0) game.combo[c] = null;

  if (game.phase === 'intro') {
    const fin = A.wins === 1 && B.wins === 1;
    if (game.pt === 8) { say(fin ? 'Final round' : 'Round ' + game.round, 'en-US', .45, .85); SFX.confirm(); }
    if (game.pt === 80) { say('Fight!', 'en-US', .45, 1); SFX.special(); }
    if (game.pt >= 95) game.phase = 'fight';
  } else if (game.phase === 'fight') {
    if (++game.tick % 60 === 0 && game.timer > 0) { game.timer--; if (game.timer === 0) timeOver(); }
  } else if (game.phase === 'ko') {
    if (game.pt === 120) endRound();
    if (game.pt === 260) nextRoundOrResult();
  }
}

function endRound() {
  const [A, B] = game.F, w = game.winner;
  if (w) {
    w.wins++;
    if (w.state !== 'ko') { w.state = 'win'; w.t = 0; w.data = {}; w.atk = null; w.vx = 0; w.say = { s: pick(w.ch.win), t: 0, life: 120 }; }
    say(w.ch.spoken + ' wins', 'en-US', .5, .95);
  } else { A.wins++; B.wins++; say('Draw'); }
}

function nextRoundOrResult() {
  const [A, B] = game.F;
  if (A.wins >= 2 || B.wins >= 2) {
    const w = A.wins > B.wins ? A : B.wins > A.wins ? B : null;
    game.result = { w, quote: w ? pick(w.ch.win) : '' };
    if (w) { w.state = 'win'; w.x = 330; w.y = GY; w.face = 1; }
    game.scene = 'result'; SFX.confirm();
  } else { game.round++; startRound(); }
}

function drawFight() {
  const [A, B] = game.F;
  ctx.save();
  if (game.shake > 0) ctx.translate(rand(-1, 1) * game.shake, rand(-1, 1) * game.shake);
  ctx.drawImage(BG, 0, 0);
  drawFx();
  for (const p of projs) if (p.inert) p.draw(p);

  // the fighter who is attacking is drawn in front
  const busy = f => ['attack', 'skill', 'super'].includes(f.state) || !!(f.ch.states && f.ch.states[f.state]);
  if (game.freeze > 0 && game.freezeF) { const c = game.freezeF; drawFighter(other(c)); dim(.6); drawFighter(c); }
  else (busy(A) && !busy(B) ? [B, A] : [A, B]).forEach(drawFighter);

  for (const p of projs) if (!p.inert) p.draw(p);
  drawParticles();
  for (const f of game.F) drawWorldUI(f);
  ctx.restore();

  if (game.redFlash > 0) { ctx.fillStyle = 'rgba(255,30,40,' + (game.redFlash / 14 * .5) + ')'; ctx.fillRect(0, 0, W, H); }
  drawHUD(); drawBanners();
  if (game.paused) drawPause();
}

function drawPause() {
  dim(.75); bigText('PAUSED', 480, 150, 70);
  txt('P / ESC  resume      Q  quit to character select      M  music on/off', 480, 230, 16, '#fff', 'center', 'sans-serif');
  txt('P1: WASD · F punch · G kick · H skill · J super', 480, 290, 15, '#ffd23a', 'center', 'sans-serif');
  txt('P2: arrows · , punch · . kick · / skill · Right Shift super', 480, 316, 15, '#4aa8ff', 'center', 'sans-serif');
  txt('Block by holding away from your opponent', 480, 350, 14, '#ccc', 'center', 'sans-serif');
}
