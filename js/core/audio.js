'use strict';
/* =========================================================
   Audio: synthesized sound effects, chiptune loop, announcer voice.
   Everything is generated with the Web Audio API (no audio files).
   ========================================================= */

let AC = null, master = null, mus = null, musicOn = true, NB = null, nextNote = 0, mstep = 0;

function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination);
    mus = AC.createGain(); mus.gain.value = .13; mus.connect(master);
    nextNote = AC.currentTime + .1;
  } catch (e) { AC = null; }
}

function tone(f, d, type = 'square', v = .15, f2 = 0, delay = 0, dest) {
  if (!AC) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + d);
  o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + .03);
}

function noise(d, v = .3, fq = 1500, type = 'bandpass', delay = 0, dest) {
  if (!AC) return;
  if (!NB) {
    NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const a = NB.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  const t = AC.currentTime + delay, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NB; fl.type = type; fl.frequency.value = fq;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + d);
  s.connect(fl); fl.connect(g); g.connect(dest || master); s.start(t); s.stop(t + d + .03);
}

const SFX = {
  light()   { noise(.08, .45, 2500); tone(220, .06, 'square', .1, 110); },
  heavy()   { noise(.2, .7, 800); tone(120, .2, 'sawtooth', .2, 45); },
  block()   { noise(.05, .35, 4500, 'highpass'); tone(1000, .04, 'square', .05); },
  whoosh()  { noise(.12, .15, 700, 'lowpass'); },
  jump()    { tone(300, .12, 'square', .05, 620); },
  special() { tone(200, .4, 'sawtooth', .1, 1200); noise(.3, .15, 3000); },
  superfl() { tone(110, .7, 'sawtooth', .14, 880); tone(220, .7, 'square', .07, 1760, .05); },
  ko()      { tone(400, 1.2, 'sawtooth', .2, 40); noise(.9, .45, 400); },
  select()  { tone(660, .05, 'square', .07); },
  confirm() { tone(523, .08, 'square', .09); tone(784, .14, 'square', .09, 0, .08); },
  type()    { tone(rand(1500, 2600), .02, 'square', .035); },
  thud()    { tone(90, .18, 'sine', .5, 38); noise(.12, .35, 300); }
};

// Am - F - G - Em loop, scheduled slightly ahead of time
const CHORDS = [[0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -1, 2, 7]];
function music() {
  if (!AC) return;
  const on = musicOn && !(game.scene === 'fight' && game.paused);
  if (!on) { nextNote = AC.currentTime + .05; return; }
  while (nextNote < AC.currentTime + .15) {
    const s = mstep % 64, bar = s >> 4, st = s & 15, ch = CHORDS[bar], dl = Math.max(0, nextNote - AC.currentTime), root = ch[0];
    const bp = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 10, 0, 7, 12][st];
    tone(55 * Math.pow(2, (root + bp) / 12), .09, 'square', .5, 0, dl, mus);
    if (st % 4 === 0) tone(140, .12, 'sine', 1, 45, dl, mus);
    if (st % 8 === 4) noise(.08, .5, 1800, 'bandpass', dl, mus);
    if (st % 2 === 1) noise(.025, .22, 8000, 'highpass', dl, mus);
    if (game.scene === 'fight' && st % 2 === 0) tone(440 * Math.pow(2, ch[(st / 2) % 4] / 12), .08, 'triangle', .28, 0, dl, mus);
    nextNote += .105; mstep++;
  }
}

// Announcer via the browser's speech synthesis (silently skipped if unavailable)
function say(text, lang = 'en-US', pitch = .55, rate = .95) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.pitch = pitch; u.rate = rate;
    speechSynthesis.speak(u);
  } catch (e) {}
}
