'use strict';
/* =========================================================
   Keyboard + gamepad input
   IN[i] = buttons held this frame for player i, INP[i] = last frame
   ========================================================= */

const keys = {};
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Slash', 'Quote', 'Comma', 'Period', 'Backspace', 'Tab']);

addEventListener('keydown', e => { keys[e.code] = true; if (PREVENT.has(e.code)) e.preventDefault(); initAudio(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
cv.addEventListener('pointerdown', () => { try { cv.focus(); } catch (e) {} initAudio(); });

// Physical key codes (layout independent)
const KMAP = [
  { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], d: ['KeyS'], p: ['KeyF'], k: ['KeyG'], s: ['KeyH'], x: ['KeyJ'],
    ok: ['Enter', 'Space'], back: ['Escape'], pause: ['KeyP', 'Escape'], mute: ['KeyM'], quit: ['KeyQ'] },
  { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], d: ['ArrowDown'], p: ['Comma', 'Numpad1'], k: ['Period', 'Numpad2'], s: ['Slash', 'Numpad3'], x: ['ShiftRight', 'Numpad0'],
    ok: ['NumpadEnter'], back: ['Backspace'], pause: [], mute: [], quit: [] }
];
const BTN = Object.keys(KMAP[0]);
const IN = [{}, {}], INP = [{}, {}];

function pollInput() {
  let pads = [];
  try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) {}
  for (let i = 0; i < 2; i++) {
    const c = {}, m = KMAP[i];
    for (const b of BTN) c[b] = m[b].some(k => keys[k]);
    const g = pads && pads[i];
    if (g && g.connected) {
      const ax = g.axes || [], bt = j => !!(g.buttons[j] && g.buttons[j].pressed);
      c.l = c.l || ax[0] < -.45 || bt(14); c.r = c.r || ax[0] > .45 || bt(15);
      c.u = c.u || ax[1] < -.6 || bt(12);  c.d = c.d || ax[1] > .6 || bt(13);
      c.p = c.p || bt(2); c.k = c.k || bt(0); c.s = c.s || bt(1); c.x = c.x || bt(3) || bt(5) || bt(7);
      c.pause = c.pause || bt(9); c.ok = c.ok || bt(9); c.back = c.back || bt(8);
    }
    INP[i] = IN[i]; IN[i] = c;
  }
}

// "Pressed this frame" helpers for menus
const tap = (i, b) => !!IN[i][b] && !INP[i][b];
const tapAny = b => tap(0, b) || tap(1, b);
const okTap = i => tap(i, 'ok') || tap(i, 'p') || tap(i, 'k');
const backTap = i => tap(i, 'back') || tap(i, 's');
