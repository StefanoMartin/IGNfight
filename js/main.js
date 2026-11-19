'use strict';
/* =========================================================
   Main loop: fixed 60 updates per second, draw every animation frame
   ========================================================= */

const SCENES = {
  title:  { step: titleStep,  draw: drawTitle },
  select: { step: selectStep, draw: drawSelect },
  fight:  { step: fightStep,  draw: drawFight },
  result: { step: resultStep, draw: drawResult }
};

function step() {
  frame++;
  pollInput();
  if (tap(0, 'mute')) musicOn = !musicOn;
  music();
  SCENES[game.scene].step();
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  SCENES[game.scene].draw();
  drawVersion();
}

let lastTime = 0, acc = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastTime) lastTime = ts;
  acc += Math.min(100, ts - lastTime); lastTime = ts;
  let n = 0;
  while (acc >= 1000 / 60 && n < 4) { step(); acc -= 1000 / 60; n++; }
  draw();
}

requestAnimationFrame(loop);
try { cv.focus(); } catch (e) {}
