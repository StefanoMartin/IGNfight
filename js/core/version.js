'use strict';
/* =========================================================
   Game version (semantic versioning: MAJOR.MINOR.PATCH)
     MAJOR  big milestones / breaking changes (1.0.0 = first "complete" release)
     MINOR  new features: fighters, modes, music, visuals
     PATCH  bug fixes and balance tweaks
   Remember to add an entry to CHANGELOG.md when you change it.
   ========================================================= */

const GAME_VERSION = '0.4.0';

/** Small version label in the bottom-right corner (drawn on every screen) */
function drawVersion() {
  txt('v' + GAME_VERSION, W - 8, H - 10, 11, 'rgba(255,255,255,.55)', 'right', 'sans-serif', 3, 'rgba(0,0,0,.6)', 'bold');
}
