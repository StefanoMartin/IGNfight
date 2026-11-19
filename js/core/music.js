'use strict';
/* =========================================================
   Soundtrack — a tiny step sequencer with synthesized voices
   (Web Audio only, no audio files).

   Each bar is 16 steps (16th notes). Melodies are written as 16 tokens:
     'E5'  play a note      '_'  hold the previous note      '-'  rest
   Sections are 4 bars; a track plays its sections in order and loops.

   Tracks:  title (heroic, half-time), select (groove), fight (driving).
   The fight track gets faster and busier in "danger" moments:
   a fighter below 25% health, or the final round.
   ========================================================= */

const NOTE_IDX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function noteMidi(n) {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) throw new Error('Bad note: ' + n);
  return 12 * (+m[2] + 1) + NOTE_IDX[m[1]];
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function parseBar(s) {
  const tk = s.trim().split(/\s+/);
  if (tk.length !== 16) throw new Error('A bar needs 16 steps: ' + s);
  const out = Array(16).fill(null);
  let last = -1;
  tk.forEach((t, i) => {
    if (t === '_') { if (last >= 0) out[last].len++; }
    else if (t === '-') last = -1;
    else { out[i] = { m: noteMidi(t), len: 1 }; last = i; }
  });
  return out;
}

// Chords in A minor: bass root + three chord tones for the arpeggios (MIDI numbers)
const CHORD = {
  Am: { root: 45, tones: [57, 60, 64] },
  F:  { root: 41, tones: [53, 57, 60] },
  C:  { root: 48, tones: [60, 64, 67] },
  G:  { root: 43, tones: [55, 59, 62] },
  Dm: { root: 50, tones: [62, 65, 69] },
  E:  { root: 40, tones: [56, 59, 64] }
};

const SECTIONS = {
  // A: main theme
  A: { chords: ['Am', 'F', 'C', 'G'], drums: 'drive', arp: false, lead: [
    'E5 _ _ _ A5 _ G5 _ E5 _ _ _ D5 _ E5 _',
    'C5 _ _ _ F5 _ E5 _ C5 _ A4 _ C5 _ D5 _',
    'E5 _ _ _ G5 _ E5 _ C6 _ _ _ B5 _ G5 _',
    'D5 _ _ _ B4 _ D5 _ G5 _ _ _ F5 _ D5 _'] },
  // B: rising tension
  B: { chords: ['Dm', 'Am', 'E', 'E'], drums: 'four', arp: true, lead: [
    'F5 _ A5 _ D6 _ A5 _ F5 _ A5 _ D6 _ E6 _',
    'C6 _ _ _ B5 _ A5 _ E5 _ _ _ A5 _ C6 _',
    'B5 _ _ _ G#5 _ E5 _ B5 _ _ _ D6 _ B5 _',
    'G#5 _ _ _ _ _ _ _ E5 _ G#5 _ B5 _ D6 _'] },
  // C: chorus
  C: { chords: ['F', 'G', 'Am', 'Am'], drums: 'four', arp: true, crash: true, lead: [
    'C6 _ _ _ A5 _ _ _ C6 _ D6 _ C6 _ A5 _',
    'B5 _ _ _ G5 _ _ _ B5 _ C6 _ D6 _ B5 _',
    'C6 _ _ _ E6 _ _ _ D6 _ C6 _ B5 _ C6 _',
    'A5 _ _ _ _ _ _ _ E5 _ A5 _ C6 _ E6 _'] },
  // I: groove without melody (character select)
  I: { chords: ['Am', 'Am', 'F', 'G'], drums: 'half', arp: true, lead: null },
  // J: groove with a short call-and-response hook
  J: { chords: ['Am', 'Am', 'F', 'G'], drums: 'drive', arp: true, lead: [
    'A5 _ - - C6 _ - - E6 _ D6 _ C6 _ - -',
    '- - - - - - - - E5 _ G5 _ A5 _ - -',
    'C6 _ - - A5 _ - - F5 _ A5 _ C6 _ - -',
    'B5 _ _ _ G5 _ _ _ D6 _ _ _ B5 _ _ _'] }
};
for (const k in SECTIONS) {
  const s = SECTIONS[k];
  s.bars = s.chords.map((c, i) => ({ chord: CHORD[c], lead: s.lead ? parseBar(s.lead[i]) : null }));
}

const TRACKS = {
  title:  { bpm: 126, order: ['C', 'A'], drums: 'half' },
  select: { bpm: 138, order: ['I', 'J'], leadVol: .6 },
  fight:  { bpm: 156, order: ['A', 'A', 'B', 'C'] }
};

let curTrack = null, trackStep = 0;

function musicTrackName() {
  if (game.scene === 'fight') return 'fight';
  if (game.scene === 'select') return 'select';
  return 'title';
}

function musicDanger() {
  if (game.scene !== 'fight' || game.F.length < 2) return false;
  const [A, B] = game.F;
  return A.hp / A.ch.hp < .25 || B.hp / B.ch.hp < .25 || (A.wins === 1 && B.wins === 1);
}

/** Called every frame by main.js: schedules notes slightly ahead of time */
function music() {
  if (!AC) return;
  const on = musicOn && !(game.scene === 'fight' && game.paused);
  if (!on) { nextNote = AC.currentTime + .05; return; }
  const name = musicTrackName();
  if (name !== curTrack) { curTrack = name; trackStep = 0; nextNote = Math.max(nextNote, AC.currentTime + .05); }
  const tr = TRACKS[name], danger = musicDanger();
  const stepDur = 60 / (tr.bpm * (danger ? 1.1 : 1)) / 4;
  while (nextNote < AC.currentTime + .12) {
    playStep(tr, trackStep, nextNote, stepDur, danger);
    nextNote += stepDur; trackStep++;
  }
}

function playStep(tr, n, t, sd, danger) {
  const totalBars = tr.order.length * 4, b = Math.floor(n / 16) % totalBars, st = n % 16;
  const sec = SECTIONS[tr.order[Math.floor(b / 4)]], bar = sec.bars[b % 4], ch = bar.chord;
  const drums = tr.drums || sec.drums;

  // drums
  if (drums === 'drive') { if (st === 0 || st === 8 || st === 10) mKick(t); if (st === 4 || st === 12) mSnare(t); if (st % 2 === 0) mHat(t, st === 14); }
  else if (drums === 'four') { if (st % 4 === 0) mKick(t); if (st === 4 || st === 12) mSnare(t); mHat(t, st % 4 === 2); if (b % 4 === 3 && st >= 12) mSnare(t, .45); } // fill
  else if (drums === 'half') { if (st === 0 || st === 10) mKick(t); if (st === 8) mSnare(t); if (st % 4 === 2) mHat(t, false); }
  if (danger && st % 2 === 1) mHat(t, false, .14);
  if (st === 0 && b % 4 === 0 && (sec.crash || danger)) mCrash(t);

  // bass: pumping 8ths with octave jumps
  if (st % 2 === 0) mBass(mtof(ch.root + ((st === 4 || st === 10 || st === 14) ? 12 : 0)), sd * 1.8, t);

  // arpeggio
  if (sec.arp || drums === 'half') mArp(mtof(ch.tones[st % 3] + (st >= 8 ? 12 : 0)), sd * .9, t);

  // lead melody
  const nt = bar.lead && bar.lead[st];
  if (nt) mLead(mtof(nt.m), nt.len * sd, t, tr.leadVol || 1);
}

/* ---------- synth voices (absolute start time t) ---------- */
function mEnv(g, t, attack, peak, decay, sustain, end) {
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(.0001, sustain), t + attack + decay);
  g.gain.setValueAtTime(Math.max(.0001, sustain), end);
  g.gain.exponentialRampToValueAtTime(.0001, end + .06);
}

/** Lead: square + detuned saw, gentle low-pass, vibrato on long notes */
function mLead(f, dur, t, vol = 1, dest = mus) {
  const g = AC.createGain(), lp = AC.createBiquadFilter(), end = t + Math.max(.06, dur * .95);
  lp.type = 'lowpass'; lp.frequency.value = 4200;
  for (const [type, det] of [['square', 0], ['sawtooth', 9]]) {
    const o = AC.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det;
    if (dur > .25) {
      const lfo = AC.createOscillator(), lg = AC.createGain();
      lfo.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + .22);
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(end + .1);
    }
    o.connect(lp); o.start(t); o.stop(end + .1);
  }
  lp.connect(g); g.connect(dest);
  mEnv(g, t, .008, .15 * vol, .1, .09 * vol, end);
}

/** Bass: resonant saw with a closing filter "pluck" */
function mBass(f, dur, t) {
  const o = AC.createOscillator(), lp = AC.createBiquadFilter(), g = AC.createGain(), end = t + dur;
  o.type = 'sawtooth'; o.frequency.value = f;
  lp.type = 'lowpass'; lp.Q.value = 7; lp.frequency.setValueAtTime(1700, t); lp.frequency.exponentialRampToValueAtTime(240, t + dur);
  o.connect(lp); lp.connect(g); g.connect(mus);
  mEnv(g, t, .005, .4, .08, .22, end);
  o.start(t); o.stop(end + .1);
}

function mArp(f, dur, t) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'square'; o.frequency.value = f; o.connect(g); g.connect(mus);
  mEnv(g, t, .003, .055, .04, .015, t + dur);
  o.start(t); o.stop(t + dur + .1);
}

function mNoise(t, dur, vol, type, fq) {
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuffer(); f.type = type; f.frequency.value = fq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(mus);
  s.start(t, Math.random() * .5); s.stop(t + dur + .02);
}

function mKick(t) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + .12);
  g.gain.setValueAtTime(.95, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
  o.connect(g); g.connect(mus); o.start(t); o.stop(t + .25);
}

function mSnare(t, v = 1) {
  mNoise(t, .14, .5 * v, 'bandpass', 1900);
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(140, t + .08);
  g.gain.setValueAtTime(.35 * v, t); g.gain.exponentialRampToValueAtTime(.001, t + .09);
  o.connect(g); g.connect(mus); o.start(t); o.stop(t + .1);
}

function mHat(t, open, v = .2) { mNoise(t, open ? .14 : .035, v, 'highpass', 7500); }
function mCrash(t) { mNoise(t, 1.1, .26, 'highpass', 4500); }

/** Short fanfare when a round is won */
function musicStinger() {
  if (!AC || !musicOn) return;
  const t = AC.currentTime + .05;
  [69, 73, 76, 81].forEach((m, i) => mLead(mtof(m), i === 3 ? .5 : .1, t + i * .1, 1.3, master));
  mCrash(t + .3);
}
