function lerp(a, b, t) { return a + (b - a) * Math.min(Math.max(t, 0), 1); }
function lerpC(a, b, t) { return Math.round(lerp(a, b, t)); }

// ─── CANVAS ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const LANES = [150, 300, 450];
const SHIP_W = 70, SHIP_H = 90;
const OBJ_W = 62, OBJ_H = 62;
const MAX_HEALTH = 4;
const OBSTACLES_TO_PHASE2 = 20;
const LIGHTHOUSES_NEEDED = 5;

// ─── ASSETS (paths relative to chapter1/) ──────────────────────────────────
const IMG = {};
const ASSET_MAP = {
  ship:       'obstacles/ship-removebg-preview.png',
  obs1:       'obstacles/obstacle1-removebg-preview.png',
  obs2:       'obstacles/obstacle2-removebg-preview.png',
  obs3:       'obstacles/obstacle3-removebg-preview.png',
  lighthouse: 'obstacles/lighthouse-removebg-preview.png',
  person1:    'persons/person1.png',
  person2:    'persons/person2.png',
};
function loadAssets(cb) {
  let done = 0, total = Object.keys(ASSET_MAP).length;
  for (const [k, src] of Object.entries(ASSET_MAP)) {
    const img = new Image();
    img.onload = img.onerror = () => { if (++done >= total) cb(); };
    img.src = src;
    IMG[k] = img;
  }
}
function hasImg(key) { return IMG[key] && IMG[key].complete && IMG[key].naturalWidth > 0; }

// Remove white/light backgrounds from JFIF images (no alpha channel)
function makeTransparent(img, threshold) {
  const oc = document.createElement('canvas');
  oc.width  = img.naturalWidth || 100;
  oc.height = img.naturalHeight || 100;
  const octx = oc.getContext('2d');
  octx.drawImage(img, 0, 0);
  try {
    const id = octx.getImageData(0, 0, oc.width, oc.height);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > threshold && d[i+1] > threshold && d[i+2] > threshold) {
        d[i+3] = 0;
      }
    }
    octx.putImageData(id, 0, 0);
  } catch (e) { /* CORS/security — fall back to original */ }
  return oc;
}

// ─── STATE ─────────────────────────────────────────────────────────────────
let gamePhase, ship, health, obstaclesDodged, lighthouseCaught;
let objects, spawnTimer, speed, frameCount;
let shake = { timer: 0, intensity: 0 };
let hudShake = { timer: 0 };

function resetGame() {
  gamePhase = 'phase1';
  ship = { lane: 1, x: LANES[1], y: H - 130 };
  health = MAX_HEALTH;
  obstaclesDodged = 0;
  lighthouseCaught = 0;
  objects = [];
  spawnTimer = 0;
  speed = 3;
  frameCount = 0;
  shake = { timer: 0, intensity: 0 };
  hudShake = { timer: 0 };
  dlgEl.style.display = 'none';
}

// ─── SKIP ──────────────────────────────────────────────────────────────────
function skipChapter() { window.location.href = '../chapter2/index.html'; }

// ─── WATER WAVES ───────────────────────────────────────────────────────────
const waves = Array.from({ length: 20 }, (_, i) => ({
  y: (H / 20) * i,
  speed: 0.7 + Math.random() * 0.8,
  opacity: 0.04 + Math.random() * 0.09,
  amp: 5 + Math.random() * 9,
  freq: 0.010 + Math.random() * 0.012,
  phase: Math.random() * Math.PI * 2,
}));

function drawWaves(color) {
  waves.forEach(w => {
    w.y += w.speed;
    if (w.y > H + 10) w.y = -10;
    ctx.strokeStyle = color.replace('$a', w.opacity.toFixed(2));
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 7) {
      const y = w.y + Math.sin(x * w.freq + frameCount * 0.035 + w.phase) * w.amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

// ─── BACKGROUNDS ───────────────────────────────────────────────────────────
function drawSunsetBg() {
  ctx.fillStyle = '#080e1e';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.setLineDash([8, 18]);
  for (const lx of [225, 375]) { ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx,H); ctx.stroke(); }
  ctx.setLineDash([]);
  drawWaves(`rgba(100,150,220,$a)`);
}

function drawNightBg() {
  ctx.fillStyle = '#040910';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.setLineDash([8, 18]);
  for (const lx of [225, 375]) { ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx,H); ctx.stroke(); }
  ctx.setLineDash([]);
  drawWaves(`rgba(80,110,160,$a)`);
}

// ─── DIALOGUE ──────────────────────────────────────────────────────────────
let dlgQueue = [], dlgCallback = null, dlgMode = 'single';
const dlgEl = document.getElementById('dialogue');
function isDialogueOpen() { return dlgEl.style.display === 'flex'; }

function showDialogue(lines, mode, cb) {
  dlgQueue = [...lines]; dlgMode = mode || 'single'; dlgCallback = cb;
  renderLine();
}
function renderLine() {
  if (!dlgQueue.length) {
    dlgEl.style.display = 'none';
    if (dlgCallback) dlgCallback();
    return;
  }
  const line = dlgQueue.shift();
  dlgEl.style.display = 'flex';
  if (dlgMode === 'dual') {
    const p1 = line.speaker === 1;
    document.getElementById('dlgP1Wrap').style.opacity = p1 ? '1' : '0.32';
    document.getElementById('dlgP2Wrap').style.opacity = p1 ? '0.32' : '1';
    if (hasImg('person1')) document.getElementById('dlgP1Img').src = IMG.person1.src;
    if (hasImg('person2')) document.getElementById('dlgP2Img').src = IMG.person2.src;
    document.getElementById('dlgDualText').textContent = line.text;
    document.getElementById('dlgSingle').style.display = 'none';
    document.getElementById('dlgDual').style.display = 'flex';
  } else {
    document.getElementById('dlgSpeaker').textContent = line.speaker;
    document.getElementById('dlgSingleText').textContent = line.text;
    document.getElementById('dlgSingle').style.display = 'block';
    document.getElementById('dlgDual').style.display = 'none';
  }
}
document.addEventListener('keydown', e => {
  if (isDialogueOpen() && e.code === 'Space') { e.preventDefault(); renderLine(); }
});

// ─── INPUT ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (gamePhase !== 'phase1' && gamePhase !== 'phase2') return;
  if (isDialogueOpen()) return;
  if ((e.code === 'ArrowLeft'  || e.code === 'KeyA') && ship.lane > 0) ship.lane--;
  if ((e.code === 'ArrowRight' || e.code === 'KeyD') && ship.lane < 2) ship.lane++;
});
document.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && gamePhase === 'lose') resetGame();
});

// ─── SPAWN ─────────────────────────────────────────────────────────────────
const OBS_KEYS = ['obs1', 'obs2', 'obs3'];
function spawnObject() {
  const lane = Math.floor(Math.random() * 3);
  const isLighthouse = gamePhase === 'phase2' && Math.random() < 0.28;
  objects.push({
    lane, x: LANES[lane], y: -OBJ_H,
    type: isLighthouse ? 'lighthouse' : OBS_KEYS[Math.floor(Math.random() * 3)],
    isLighthouse,
  });
}

// ─── COLLISION ─────────────────────────────────────────────────────────────
function overlaps(a, b) {
  return Math.abs(a.x - b.x) < (SHIP_W + OBJ_W) / 2 - 14 &&
         Math.abs(a.y - b.y) < (SHIP_H + OBJ_H) / 2 - 14;
}

// ─── UPDATE ────────────────────────────────────────────────────────────────
function update() {
  if (gamePhase !== 'phase1' && gamePhase !== 'phase2') return;
  if (isDialogueOpen()) return;
  frameCount++;
  ship.x += (LANES[ship.lane] - ship.x) * 0.18;
  if (shake.timer > 0) shake.timer--;
  if (hudShake.timer > 0) hudShake.timer--;
  if (frameCount % 500 === 0) speed = Math.min(speed + 0.4, 8);
  spawnTimer++;
  const interval = Math.max(40, 80 - frameCount / 80);
  if (spawnTimer >= interval) { spawnTimer = 0; spawnObject(); }

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    obj.y += speed;
    if (overlaps(ship, obj)) {
      objects.splice(i, 1);
      if (obj.isLighthouse) {
        lighthouseCaught++;
        if (lighthouseCaught >= LIGHTHOUSES_NEEDED) {
          gamePhase = 'win_dialogue';
          showDialogue([
            { speaker: 'Major General Gordon Granger', text: 'Land ahead! We have made it through the darkness.' },
            { speaker: 'Captain', text: 'Galveston is in sight, General. Today every soul on this island learns they are free.' },
          ], 'single', () => { gamePhase = 'win'; });
        }
      } else {
        health--;
        shake.timer = 28; shake.intensity = 9;
        hudShake.timer = 22;
        if (health <= 0) gamePhase = 'lose';
      }
      continue;
    }
    if (obj.y > H + OBJ_H) {
      objects.splice(i, 1);
      if (!obj.isLighthouse) {
        obstaclesDodged++;
        if (gamePhase === 'phase1' && obstaclesDodged >= OBSTACLES_TO_PHASE2) {
          gamePhase = 'mid_dialogue';
          objects = [];
          showDialogue([
            { speaker: 1, text: 'I think we have lost the way...' },
            { speaker: 2, text: "It's getting darker. We have to reach Galveston fast." },
            { speaker: 1, text: 'We need to follow the lighthouse beams — they will guide us in.' },
          ], 'dual', () => { gamePhase = 'phase2'; });
        }
      }
    }
  }
}

// ─── DRAW ──────────────────────────────────────────────────────────────────
function drawImg(key, x, y, w, h) {
  const src = IMG[key + '_t'] || (hasImg(key) ? IMG[key] : null);
  if (src) {
    ctx.drawImage(src, x - w/2, y - h/2, w, h);
  } else {
    ctx.fillStyle = key === 'lighthouse' ? '#f0c060' : key === 'ship' ? '#4488cc' : '#c84040';
    ctx.fillRect(x - w/2, y - h/2, w, h);
    ctx.fillStyle = '#fff'; ctx.font = '10px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(key, x, y + 4);
  }
}
function drawLighthouseWithGlow(obj) {
  const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.08);
  const glow = ctx.createRadialGradient(obj.x, obj.y, 5, obj.x, obj.y, 55 + pulse * 20);
  glow.addColorStop(0,   `rgba(255,220,80,${(0.35 + pulse * 0.2).toFixed(2)})`);
  glow.addColorStop(0.5, `rgba(255,160,20,${(0.15 + pulse * 0.1).toFixed(2)})`);
  glow.addColorStop(1,   'rgba(255,100,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(obj.x, obj.y, 75, 0, Math.PI * 2); ctx.fill();
  drawImg('lighthouse', obj.x, obj.y, OBJ_W, OBJ_H);
}
function drawHUD() {
  const hx = hudShake.timer > 0 ? (Math.random()-0.5)*5 : 0;
  const hy = hudShake.timer > 0 ? (Math.random()-0.5)*3 : 0;
  ctx.save(); ctx.translate(hx, hy);
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(10,10,164,28);
  ctx.fillStyle = '#c8860a'; ctx.font = '13px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('Hull:', 16, 28);
  for (let i = 0; i < MAX_HEALTH; i++) {
    ctx.fillStyle = i < health ? '#e04040' : '#222';
    ctx.fillRect(60 + i*26, 14, 20, 16);
  }
  if (gamePhase === 'phase2') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(10,46,220,28);
    ctx.fillStyle = '#f0c060'; ctx.font = '13px Georgia';
    ctx.fillText(`Lighthouses: ${lighthouseCaught} / ${LIGHTHOUSES_NEEDED}`, 16, 64);
  } else if (gamePhase === 'phase1') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(10,46,228,28);
    ctx.fillStyle = '#aac8ff'; ctx.font = '12px Georgia';
    ctx.fillText(`Obstacles dodged: ${obstaclesDodged} / ${OBSTACLES_TO_PHASE2}`, 16, 64);
  }
  ctx.restore();
}
function drawShip() {
  const sx = shake.timer > 0 ? ship.x + (Math.random()-0.5)*shake.intensity : ship.x;
  const sy = shake.timer > 0 ? ship.y + (Math.random()-0.5)*(shake.intensity*0.4) : ship.y;
  drawImg('ship', sx, sy, SHIP_W, SHIP_H);
}
function drawOverlay(title, sub, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = color; ctx.font = 'bold 28px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(title, W/2, H/2 - 30);
  ctx.fillStyle = '#ddd'; ctx.font = '15px Georgia';
  ctx.fillText(sub, W/2, H/2 + 8);
  if (gamePhase === 'win') {
    ctx.fillStyle = '#f0c060'; ctx.font = '13px Georgia';
    ctx.fillText('▶  Click to continue to Chapter 2', W/2, H/2 + 46);
  }
}
canvas.addEventListener('click', () => {
  if (gamePhase === 'win') window.location.href = '../chapter2/index.html';
});

function draw() {
  ctx.clearRect(0,0,W,H);
  if (gamePhase === 'phase1' || gamePhase === 'mid_dialogue' || gamePhase === 'intro') drawSunsetBg();
  else drawNightBg();
  if (gamePhase !== 'intro') {
    for (const obj of objects) {
      if (obj.isLighthouse) drawLighthouseWithGlow(obj);
      else drawImg(obj.type, obj.x, obj.y, OBJ_W, OBJ_H);
    }
    drawShip(); drawHUD();
  }
  if (gamePhase === 'win')  drawOverlay('We Have Arrived!', 'Galveston, Texas — June 19, 1865', '#f0c060');
  if (gamePhase === 'lose') drawOverlay('The ship has been lost...', 'Press R to try again', '#e05050');
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

// ─── AUTO-START ─────────────────────────────────────────────────────────────
loadAssets(() => {
  gamePhase = 'intro';
  ship = { lane: 1, x: LANES[1], y: H - 130 };
  loop();
  showDialogue([
    { speaker: 1, text: "Captain — President Lincoln signed the proclamation over two years ago, yet not one word has reached the people of Texas. They still live as though they are enslaved." },
    { speaker: 2, text: "General Granger, sir. We are ready. But the channel into Galveston Bay is filled with Confederate wreckage — navigating through will be dangerous." },
    { speaker: 1, text: "Our lighthouse keepers have lit beacons along the route. Collect every light you can — they will guide the ship through the dark and the debris." },
    { speaker: 2, text: "And when we reach the island, sir? What do we say to them?" },
    { speaker: 1, text: "You will stand on the soil of Texas and read General Order Number Three. All enslaved persons are free. The war is over. They must hear it from us — today." },
    { speaker: 2, text: "Understood, General. The tide is with us. We sail now." },
  ], 'dual', resetGame);
});
