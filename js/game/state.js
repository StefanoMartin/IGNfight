'use strict';
/* =========================================================
   Global game state, Fighter class, particle spawners
   ========================================================= */

const DIFF = [
  { react: 24, block: .2, aggr: .55, spec: .25, name: 'EASY' },
  { react: 13, block: .5, aggr: .85, spec: .45, name: 'NORMAL' },
  { react: 6,  block: .8, aggr: 1.1, spec: .7,  name: 'HARD' }
];

const game = {
  scene: 'title',          // title | select | fight | result
  mode: 0,                 // 0 = 1P vs CPU, 1 = 2P
  diff: 1, menu: 0, help: false,
  F: [],                   // the two fighters
  round: 1, timer: 99, tick: 0,
  phase: 'intro',          // intro | fight | ko
  pt: 0,                   // frames since the phase started
  stop: 0,                 // hitstop frames
  shake: 0, freeze: 0, freezeF: null, superName: '',
  paused: false, aid: 0, combo: [null, null], koText: '', winner: null, redFlash: 0,
  sel: null, result: null, picks: [0, 4]
};

let projs = [], parts = [], texts = [], fx = [];

class Fighter {
  constructor(ch, idx, cpu) {
    this.ch = ch; this.idx = idx; this.cpu = cpu;
    this.wins = 0; this.alt = false; this.meter = 0; this.posts = 0;
    this.reset(idx ? 660 : 300);
  }
  reset(x) {
    Object.assign(this, {
      x, y: GY, vx: 0, vy: 0, face: this.idx ? -1 : 1,
      hp: this.ch.hp, redHp: this.ch.hp,
      state: 'idle', t: 0, atk: null, cool: 0, inv: 0, combo: 0, armor: 0, data: {}, flash: 0,
      anim: Math.random() * 100 | 0, launched: false, rot: 0, say: null,
      inp: {}, prev: {}, tap: {},
      ai: { t: 0, act: 'wait', f: 0, threat: false, blk: false, parry: false, mb: null, kicked: false },
      hs: 0, bs: 0, stunT: 0, stunIcon: null, cd: null
    });
  }
  get air() { return this.y < GY - .5; }
}

const other = f => game.F[1 - f.idx];
function hitstop(n) { game.stop = Math.max(game.stop, n); }

/* ---------- particles & floating text ---------- */
function spark(x, y, col, n) {
  for (let i = 0; i < n; i++) { const a = rand(0, 6.28), s = rand(2, 8); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: ri(10, 20), t: 0, col, sz: rand(2, 4.5), g: .25, k: 'l' }); }
}
function dust(x, y, n) {
  for (let i = 0; i < n; i++) parts.push({ x: x + rand(-20, 20), y: y - rand(0, 6), vx: rand(-2.5, 2.5), vy: rand(-3, -.5), life: ri(18, 32), t: 0, col: 'rgba(150,120,100,.7)', sz: rand(3, 7), g: .05, k: 'c' });
}
function letters(x, y, n, col = '#fff') {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: rand(-5, 5), vy: rand(-7, -1), life: ri(20, 35), t: 0, col, sz: ri(10, 16), g: .3, k: 't', ch: pick('QWERTYASDFGHJKLZXCVBNM!?#@'.split('')) });
}
function chunks(x, y, n, col) {
  for (let i = 0; i < n; i++) parts.push({ x: x + rand(-20, 20), y: y + rand(-20, 20), vx: rand(-6, 6), vy: rand(-9, -2), life: ri(25, 40), t: 0, col, sz: rand(4, 9), g: .4, k: 's' });
}
function popText(x, y, s, col = '#fff', size = 24, life = 55) { texts.push({ x, y, s, col, size, life, t: 0 }); }
