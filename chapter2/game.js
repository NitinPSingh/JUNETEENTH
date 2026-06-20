// ─── SCENE MANAGER ─────────────────────────────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('s-' + id);
  if (el) el.classList.add('active');
}

// ─── CURTAIN DRAG ───────────────────────────────────────────────────────────
const stage        = document.getElementById('stage');
const curtainCloth = document.getElementById('curtain-cloth');
const curtainWave  = document.getElementById('curtain-wave');
const ropeHandle   = document.getElementById('rope-handle');

const STAGE_H      = 460;
const HANDLE_MIN   = 10;
const HANDLE_MAX   = STAGE_H - 42;

let handleY        = HANDLE_MIN;
let curtainDone    = false;
let dragging       = false;
let dragStartY     = 0;
let dragStartHandleY = 0;

function setCurtain(handleYPx) {
  handleY = Math.min(HANDLE_MAX, Math.max(HANDLE_MIN, handleYPx));
  ropeHandle.style.top = handleY + 'px';

  // As handle moves from MIN→MAX, curtain moves from 0→ -STAGE_H (rises)
  const progress = (handleY - HANDLE_MIN) / (HANDLE_MAX - HANDLE_MIN);
  const raiseBy  = Math.round(progress * STAGE_H);
  curtainCloth.style.transform = `translateY(-${raiseBy}px)`;
  curtainWave.style.transform  = `translateY(-${raiseBy}px)`;

  if (!curtainDone && progress >= 1) {
    curtainDone = true;
    setTimeout(startDialogue, 600);
  }
}

ropeHandle.addEventListener('mousedown', e => {
  dragging = true;
  dragStartY = e.clientY;
  dragStartHandleY = handleY;
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!dragging) return;
  const dy = e.clientY - dragStartY;
  setCurtain(dragStartHandleY + dy);
});
document.addEventListener('mouseup', () => { dragging = false; });

// Touch
ropeHandle.addEventListener('touchstart', e => {
  dragging = true;
  dragStartY = e.touches[0].clientY;
  dragStartHandleY = handleY;
  e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', e => {
  if (!dragging) return;
  const dy = e.touches[0].clientY - dragStartY;
  setCurtain(dragStartHandleY + dy);
}, { passive: true });
document.addEventListener('touchend', () => { dragging = false; });

// Init handle position
ropeHandle.style.position = 'absolute';
ropeHandle.style.top = HANDLE_MIN + 'px';

// ─── DIALOGUE ───────────────────────────────────────────────────────────────
const dlgEl      = document.getElementById('dialogue');
const dlgSingle  = document.getElementById('dlg-single');
const dlgDual    = document.getElementById('dlg-dual');
let dlgQueue     = [];
let dlgMode      = 'single';
let dlgCallback  = null;

function showDialogue(lines, mode, cb) {
  dlgQueue = [...lines];
  dlgMode = mode || 'single';
  dlgCallback = cb;
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
    const isP1 = line.speaker === 1;
    document.getElementById('dlg-c1').style.opacity = isP1 ? '1' : '0.3';
    document.getElementById('dlg-c2').style.opacity = isP1 ? '0.3' : '1';
    document.getElementById('dlg-dual-txt').textContent = line.text;
    dlgSingle.style.display = 'none';
    dlgDual.style.display = 'flex';
  } else {
    document.getElementById('dlg-spk').textContent = line.speaker;
    document.getElementById('dlg-txt').textContent = line.text;
    dlgSingle.style.display = 'block';
    dlgDual.style.display = 'none';
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && dlgEl.style.display === 'flex') {
    e.preventDefault();
    renderLine();
  }
});
dlgEl.addEventListener('click', () => renderLine());

// ─── START DIALOGUE (after curtain reveal) ──────────────────────────────────
function startDialogue() {
  showDialogue([
    { speaker: 1, text: 'Clara — the proclamation has arrived. Every soul in Galveston is free. But do they all know it?' },
    { speaker: 2, text: 'Not yet, Reverend. There are eight districts across this city. The freedom bells must ring in each one.' },
    { speaker: 1, text: 'We must be strategic. No two bells on the same street, nor the same lane — sound must spread, not overlap.' },
    { speaker: 2, text: 'And they cannot stand too close to each other — the echoes would muddle the message entirely.' },
    { speaker: 1, text: 'If we cover six of the eight districts, the word will reach every corner of Galveston. Will you help us place the bells?' },
  ], 'dual', () => {
    goTo('puzzle');
    buildGrid();
  });
}

// ─── BELL PUZZLE ─────────────────────────────────────────────────────────────

// 8 colored district regions on the 8×8 grid (1-indexed)
const REGION_MAP = [
  [1,1,1,1,2,2,3,3],
  [1,1,4,2,2,2,3,3],
  [4,4,4,4,2,5,3,3],
  [4,4,6,4,5,5,5,3],
  [6,6,6,5,5,7,5,8],
  [6,6,6,7,7,7,8,8],
  [6,6,7,7,8,8,8,8],
  [6,7,7,7,8,8,8,8],
];

// Each region has a district name and natural earth-tone color
const DISTRICTS = {
  1: { name:'Liberty',  color:'#C8A050' }, // warm sand
  2: { name:'Justice',  color:'#8B4513' }, // saddle brown
  3: { name:'Equality', color:'#D4BE60' }, // golden straw
  4: { name:'Unity',    color:'#6B9E3A' }, // meadow green
  5: { name:'Hope',     color:'#2E6335' }, // forest green
  6: { name:'Freedom',  color:'#5C3A1E' }, // dark earth
  7: { name:'Truth',    color:'#9B5030' }, // burnt clay
  8: { name:'Joy',      color:'#8B7035' }, // harvest gold
};

let bells = Array(8).fill(null).map(() => Array(8).fill(false));

function regionsWithBell() {
  const s = new Set();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (bells[r][c]) s.add(REGION_MAP[r][c]);
  return s;
}

function isValidPlacement(row, col) {
  for (let c = 0; c < 8; c++)
    if (c !== col && bells[row][c]) return false;
  for (let r = 0; r < 8; r++)
    if (r !== row && bells[r][col]) return false;
  if (regionsWithBell().has(REGION_MAP[row][col])) return false;
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = row+dr, nc = col+dc;
      if (nr>=0 && nr<8 && nc>=0 && nc<8 && bells[nr][nc]) return false;
    }
  return true;
}

// Disable non-bell cells in occupied regions; re-enable cells in free regions
function syncRegionDisabled() {
  const occupied = regionsWithBell();
  document.querySelectorAll('.cell').forEach(cell => {
    const r = +cell.dataset.r, c = +cell.dataset.c;
    const reg = REGION_MAP[r][c];
    const inOccupied = occupied.has(reg);
    const hasBell = bells[r][c];
    // Disable if region is occupied AND this cell doesn't hold the bell
    if (inOccupied && !hasBell) {
      cell.classList.add('region-disabled');
    } else {
      cell.classList.remove('region-disabled');
    }
  });
}

function showCrossedBell(row, col) {
  const cell = document.querySelector(`[data-r="${row}"][data-c="${col}"]`);
  if (!cell) return;
  cell.textContent = '🔕';
  cell.classList.add('cross-bell');
  setTimeout(() => {
    cell.textContent = '';
    cell.classList.remove('cross-bell');
  }, 700);
}

function handleCellClick(row, col) {
  const cell = document.querySelector(`[data-r="${row}"][data-c="${col}"]`);
  if (cell && cell.classList.contains('region-disabled')) return;

  if (bells[row][col]) {
    bells[row][col] = false;
    renderGrid();
    syncRegionDisabled();
    updateProgress();
    return;
  }

  if (!isValidPlacement(row, col)) {
    showCrossedBell(row, col);
    return;
  }

  bells[row][col] = true;
  renderGrid();
  syncRegionDisabled();
  updateProgress();
}

function updateProgress() {
  const covered = regionsWithBell().size;
  const pct     = ((covered / 8) * 100).toFixed(1);
  const barEl   = document.getElementById('progress-bar');
  const txtEl   = document.getElementById('progress-text');
  const btnCont = document.getElementById('btn-continue');

  barEl.style.width = pct + '%';

  if (covered >= 6) {
    barEl.style.background = '#4caf50';
    txtEl.className = 'win';
    txtEl.textContent = `🎉 ${covered}/8 districts covered (${pct}%) — target reached! Keep going or continue.`;
    btnCont.style.display = 'inline-block';
  } else if (covered === 0) {
    barEl.style.background = '#c8860a';
    txtEl.className = '';
    txtEl.textContent = 'Place freedom bells to begin...';
    btnCont.style.display = 'none';
  } else {
    barEl.style.background = '#c8860a';
    txtEl.className = '';
    txtEl.textContent = `Keep going! ${covered}/8 districts covered (${pct}%). Target: 75%`;
    btnCont.style.display = 'none';
  }
}

function buildGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      const reg = REGION_MAP[r][c];
      cell.style.background = DISTRICTS[reg].color;
      cell.title = DISTRICTS[reg].name;
      cell.addEventListener('click', () => handleCellClick(r, c));
      grid.appendChild(cell);
    }
  }
}

function renderGrid() {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cell) {
        cell.textContent = bells[r][c] ? '🔔' : '';
        cell.classList.toggle('has-bell', bells[r][c]);
      }
    }
  }
}

function resetPuzzle() {
  bells = Array(8).fill(null).map(() => Array(8).fill(false));
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('region-disabled', 'cross-bell'));
  document.getElementById('btn-continue').style.display = 'none';
  renderGrid();
  updateProgress();
}
