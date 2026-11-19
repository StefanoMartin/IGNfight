'use strict';
/* =========================================================
   Stage: gamer living room, pre-rendered once to an offscreen canvas
   ========================================================= */

const BG = document.createElement('canvas');
BG.width = W; BG.height = H;

function buildStage() {
  const g = BG.getContext('2d'), WALL = 405;
  let gr;

  // wall
  gr = g.createLinearGradient(0, 0, 0, WALL); gr.addColorStop(0, '#140b26'); gr.addColorStop(1, '#2c1a4a');
  g.fillStyle = gr; g.fillRect(0, 0, W, WALL);
  g.fillStyle = 'rgba(255,255,255,.025)'; for (let x = 0; x < W; x += 48) g.fillRect(x, 0, 24, WALL);

  // window with night city
  g.save(); g.translate(770, 70);
  gr = g.createLinearGradient(0, 0, 0, 230); gr.addColorStop(0, '#0b1a4a'); gr.addColorStop(1, '#2a3fa0');
  g.fillStyle = gr; g.fillRect(0, 0, 160, 230);
  g.fillStyle = '#0a0f2a'; for (let i = 0; i < 9; i++) { const bw = 14 + (i * 7) % 18, bh = 60 + (i * 37) % 110; g.fillRect(i * 18, 230 - bh, bw, bh); }
  g.fillStyle = '#ffd86a'; for (let i = 0; i < 40; i++) g.fillRect(((i * 53) % 150) + 4, 130 + ((i * 29) % 95), 3, 3);
  g.strokeStyle = '#1a1028'; g.lineWidth = 8; g.strokeRect(0, 0, 160, 230);
  g.beginPath(); g.moveTo(80, 0); g.lineTo(80, 230); g.moveTo(0, 115); g.lineTo(160, 115); g.stroke();
  g.restore();
  gr = g.createRadialGradient(850, 250, 10, 850, 250, 280); gr.addColorStop(0, 'rgba(70,110,255,.22)'); gr.addColorStop(1, 'rgba(70,110,255,0)');
  g.fillStyle = gr; g.fillRect(560, 0, 400, H);

  // shelf of (generic) game boxes
  g.fillStyle = '#1b1029'; g.fillRect(20, 90, 130, 300);
  const cols = ['#c0262d', '#1d4fa8', '#1e8a3a', '#d87b16', '#6b2fa0', '#ddd'];
  for (let s = 0; s < 4; s++) {
    const y = 150 + s * 70;
    for (let i = 0; i < 9; i++) {
      g.fillStyle = cols[(i * 7 + s * 3) % 6]; const h = 30 + ((i * 13 + s * 7) % 22);
      g.fillRect(26 + i * 13, y - h, 10, h); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(33 + i * 13, y - h, 3, h);
    }
    g.fillStyle = '#3a2416'; g.fillRect(20, y, 130, 7);
  }

  // posters (made-up games)
  const poster = (x, y, title, c1, c2, kind) => {
    g.fillStyle = '#0a0612'; g.fillRect(x - 6, y - 6, 132, 182);
    gr = g.createLinearGradient(0, y, 0, y + 170); gr.addColorStop(0, c1); gr.addColorStop(1, '#0a0612');
    g.fillStyle = gr; g.fillRect(x, y, 120, 170); g.fillStyle = c2;
    if (kind === 0) {
      g.beginPath(); g.arc(x + 60, y + 60, 30, 0, 7); g.fill();
      g.fillStyle = '#0a0612'; g.beginPath(); g.moveTo(x + 20, y + 140); g.lineTo(x + 60, y + 80); g.lineTo(x + 70, y + 95); g.lineTo(x + 100, y + 140); g.fill();
    } else {
      g.beginPath(); g.moveTo(x, y + 130); g.lineTo(x + 35, y + 70); g.lineTo(x + 55, y + 100); g.lineTo(x + 80, y + 55); g.lineTo(x + 120, y + 130); g.fill();
      g.fillStyle = '#fff'; g.fillRect(x + 76, y + 56, 8, 8);
    }
    g.font = 'bold 15px ' + FONT; g.textAlign = 'center'; g.fillStyle = c2; g.fillText(title, x + 60, y + 160);
  };
  poster(200, 95, 'NEON RONIN', '#3a0a4a', '#ff3a7a', 0);
  poster(600, 90, 'PIXEL SAGA III', '#0a2a3a', '#3affd2', 1);

  // neon controller + OFF-TOPIC sign
  g.save(); g.shadowColor = '#6a5cff'; g.shadowBlur = 22; g.strokeStyle = '#b0a4ff'; g.lineWidth = 4;
  g.beginPath(); if (g.roundRect) g.roundRect(400, 122, 120, 56, 28); else g.rect(400, 122, 120, 56); g.stroke();
  g.beginPath(); g.moveTo(425, 150); g.lineTo(445, 150); g.moveTo(435, 140); g.lineTo(435, 160); g.stroke();
  for (const [a, b] of [[488, 142], [500, 150], [488, 158], [476, 150]]) { g.beginPath(); g.arc(a, b, 4, 0, 7); g.stroke(); }
  g.shadowColor = '#ff3ab0'; g.font = '34px ' + FONT; g.textAlign = 'center'; g.fillStyle = '#ffd0f0'; g.fillText('OFF-TOPIC', 460, 240);
  g.restore();

  // lamp
  gr = g.createRadialGradient(240, 300, 5, 240, 300, 140); gr.addColorStop(0, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
  g.fillStyle = gr; g.fillRect(90, 160, 300, 245);
  g.fillStyle = '#2a1a10'; g.fillRect(238, 320, 5, 85); g.fillRect(222, 398, 36, 7);
  g.fillStyle = '#e8b070'; g.beginPath(); g.moveTo(222, 325); g.lineTo(258, 325); g.lineTo(250, 295); g.lineTo(230, 295); g.fill();

  // couch + cushions
  g.fillStyle = '#3b2257'; g.fillRect(330, 320, 300, 55); g.fillStyle = '#4a2c6c'; g.fillRect(322, 360, 316, 40);
  g.fillStyle = '#2e1a45'; g.fillRect(300, 335, 40, 70); g.fillRect(620, 335, 40, 70);
  g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(330, 320, 300, 6);
  g.fillStyle = '#d1222f'; g.fillRect(360, 340, 40, 24); g.fillStyle = '#3a8ad8'; g.fillRect(560, 338, 42, 26);

  // side table + mug
  g.fillStyle = '#2a1810'; g.fillRect(680, 355, 60, 10); g.fillRect(690, 365, 6, 40); g.fillRect(724, 365, 6, 40);
  g.fillStyle = '#c8c8d8'; g.fillRect(700, 340, 14, 15);

  // wooden floor + rug
  gr = g.createLinearGradient(0, WALL, 0, H); gr.addColorStop(0, '#2a1810'); gr.addColorStop(1, '#120a06');
  g.fillStyle = gr; g.fillRect(0, WALL, W, H - WALL);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2;
  for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(480 + i * 60, WALL); g.lineTo(480 + i * 140, H); g.stroke(); }
  for (let k = 1; k < 6; k++) { const y = WALL + Math.pow(k / 6, 1.5) * (H - WALL); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.save(); g.translate(480, 505); g.scale(1, .22);
  g.beginPath(); g.arc(0, 0, 380, 0, 7); g.fillStyle = '#4a1424'; g.fill(); g.lineWidth = 14; g.strokeStyle = '#7a2a3a'; g.stroke();
  g.beginPath(); g.arc(0, 0, 320, 0, 7); g.lineWidth = 5; g.strokeStyle = '#a8784a'; g.stroke();
  g.restore();
  g.fillStyle = '#0e0818'; g.fillRect(0, WALL - 6, W, 8);

  // vignette
  gr = g.createRadialGradient(480, 300, 220, 480, 300, 640); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
buildStage();
