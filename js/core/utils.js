'use strict';
/* =========================================================
   Shared constants, canvas handle and small math helpers
   ========================================================= */

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

// Logical screen size and stage limits
const W = 960, H = 540;
const GY = 470;          // ground line (fighters' feet)
const LW = 40, RW = 920; // left / right walls
const GRAV = .8;

const FONT = "Impact,Haettenschweiler,'Arial Narrow Bold','Arial Black',sans-serif";

let frame = 0; // global frame counter, advanced by main.js

const rand = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sgn = v => v < 0 ? -1 : 1;
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
