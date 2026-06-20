// ─── SCREEN MANAGER ─────────────────────────────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('s-' + id);
  if (el) el.classList.add('active');
}

// ─── DIALOGUE SYSTEM ─────────────────────────────────────────────────────────
const dlgEl     = document.getElementById('dialogue');
const dlgSingle = document.getElementById('dlg-single');
const dlgDual   = document.getElementById('dlg-dual');
let dlgQueue    = [];
let dlgMode     = 'single';
let dlgCallback = null;

function setCharacters(c1name, c1img, c2name, c2img) {
  document.getElementById('dlg-img1').src          = c1img || 'persons/june.png';
  document.getElementById('dlg-name1').textContent = c1name;
  document.getElementById('dlg-img2').src          = c2img || '';
  document.getElementById('dlg-name2').textContent = c2name;
}

function showDialogue(lines, mode, cb) {
  dlgQueue    = [...lines];
  dlgMode     = mode || 'single';
  dlgCallback = cb;
  dlgEl.style.display = 'flex';
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
    document.getElementById('dlg-c1').style.opacity     = isP1 ? '1' : '0.3';
    document.getElementById('dlg-c2').style.opacity     = isP1 ? '0.3' : '1';
    document.getElementById('dlg-dual-txt').textContent = line.text;
    dlgSingle.style.display = 'none';
    dlgDual.style.display   = 'flex';
  } else {
    document.getElementById('dlg-spk').textContent = line.speaker;
    document.getElementById('dlg-txt').textContent = line.text;
    dlgSingle.style.display = 'block';
    dlgDual.style.display   = 'none';
  }
}

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && dlgEl.style.display === 'flex') {
    e.preventDefault(); renderLine();
  }
});
dlgEl.addEventListener('click', () => renderLine());

// ─── RANDOM LOCATION (Shifting Dial cipher destination) ──────────────────────
const LOCATIONS = [
  { name: 'THE OLD MILL',    subtitle: 'The main building' },
  { name: 'THE WATER WHEEL', subtitle: 'The big wooden wheel on the side' },
  { name: 'THE MILL STREAM', subtitle: 'The flowing water next to the building' },
];
const selectedLocation = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

function shiftEncode(text) {
  let pos = 0;
  return text.toUpperCase().split('').map(ch => {
    if (ch === ' ') return ' ';
    pos++;
    return String.fromCharCode(((ch.charCodeAt(0) - 65 + pos) % 26) + 65);
  }).join('');
}
const encodedLocation = shiftEncode(selectedLocation.name);

// ─── SCENE 1 — Mayor's Office ────────────────────────────────────────────────
function startScene() {
  setCharacters('JUNE', 'persons/june.png', 'THE MAYOR', 'persons/mayor.png');
  document.getElementById('letter-encoded-text').textContent = encodedLocation;
  showDialogue([
    { speaker: 2, text: "June… your father told me this day might come. I have been holding something for you." },
    { speaker: 1, text: "You knew my father? Where is he? Is he safe?" },
    { speaker: 2, text: "Three years ago he came to me — frightened, but determined. He left a letter with strict instructions: keep it safe until you were ready." },
    { speaker: 1, text: "A letter… he was here. He knew I would come looking." },
    { speaker: 2, text: "He said you were brave enough to follow the trail he left. Everything you need is written inside." },
  ], 'dual', () => goTo('letter'));
}

// ─── LETTER 1 FLIP ───────────────────────────────────────────────────────────
function flipLetter() {
  document.getElementById('letter-inner').classList.toggle('flipped');
}

// ─── CIPHER MODAL (Shifting Dial) ────────────────────────────────────────────
function openCipherModal() {
  document.getElementById('cipher-modal').style.display = 'flex';
  buildCipherModal();
  initModalGemini(1);
}

function buildAlphaGrid() {
  const grid = document.getElementById('cm-alpha-grid');
  if (!grid || grid.childElementCount) return;
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    const cell = document.createElement('div');
    cell.className = 'alpha-cell';
    cell.innerHTML = `<span class="a-letter">${letter}</span><span class="a-num">${i + 1}</span>`;
    grid.appendChild(cell);
  }
}

function buildCipherModal() {
  buildAlphaGrid();
  const tilesEl  = document.getElementById('cm-tiles');
  tilesEl.innerHTML = '';
  const words    = selectedLocation.name.split(' ');
  const encWords = encodedLocation.split(' ');
  let   pos      = 0;
  words.forEach((word, wi) => {
    if (wi > 0) {
      const sp = document.createElement('div');
      sp.style.cssText = 'width:14px;flex-shrink:0';
      tilesEl.appendChild(sp);
    }
    for (let ci = 0; ci < word.length; ci++) {
      const cell = document.createElement('div');
      cell.className = 'enc-cell';
      cell.innerHTML = `
        <span class="enc-shift">+${pos + 1}</span>
        <div class="enc-letter">${encWords[wi][ci]}</div>
        <div class="enc-decoded" id="dec-${pos}">_</div>`;
      tilesEl.appendChild(cell);
      pos++;
    }
  });
  const ans = document.getElementById('cm-answer');
  if (ans) { ans.value = ''; ans.disabled = false; }
  document.getElementById('cm-decode-btn').disabled     = false;
  document.getElementById('cm-msg').textContent         = 'Reverse the shifts to find where father is hiding';
  document.getElementById('cm-msg').style.color         = '';
  document.getElementById('cm-reveal').classList.remove('show');
  document.getElementById('cm-reveal-text').textContent = selectedLocation.name;
  document.getElementById('cm-continue').textContent    = `Head to ${selectedLocation.name} →`;
  document.getElementById('cm-continue').style.display  = 'none';
}

function checkAnswer(submit) {
  const input  = document.getElementById('cm-answer');
  const msg    = document.getElementById('cm-msg');
  const val    = input.value.replace(/\s+/g, '').toUpperCase();
  const target = selectedLocation.name.replace(/\s+/g, '').toUpperCase();
  if (val === target) {
    msg.style.color = '#4caf50';
    msg.textContent = '✓ Correct! The location has been decoded.';
    const decoded = selectedLocation.name.replace(/ /g, '').toUpperCase().split('');
    let i = 0;
    const tick = () => {
      if (i >= decoded.length) {
        document.getElementById('cm-reveal').classList.add('show');
        document.getElementById('cm-continue').style.display = 'inline-block';
        return;
      }
      const el = document.getElementById(`dec-${i}`);
      if (el) { el.textContent = decoded[i]; el.classList.add('solved'); }
      i++;
      setTimeout(tick, 110);
    };
    tick();
    input.disabled = true;
    document.getElementById('cm-decode-btn').disabled = true;
  } else if (submit) {
    msg.style.color = '#e05050';
    msg.textContent = 'Not quite — subtract each position\'s shift from the encoded letter';
    setTimeout(() => {
      msg.style.color = '';
      msg.textContent = 'Reverse the shifts to find where father is hiding';
    }, 2200);
  }
}

function cipherSolved() {
  document.getElementById('cipher-modal').style.display = 'none';
  startScene2();
}

// ─── SCENE 2 — Father's Friend at the location ───────────────────────────────
function startScene2() {
  setCharacters('JUNE', 'persons/june.png', "FATHER'S FRIEND", 'persons/friend.png');
  document.getElementById('scene2-heading').textContent = selectedLocation.name;
  goTo('scene2');
  setTimeout(() => {
    showDialogue([
      { speaker: 2, text: "June! You actually came. Your father always said you would find your way here." },
      { speaker: 1, text: "Where is he? Is my father safe?" },
      { speaker: 2, text: "He was here, not three weeks ago. When the proclamation spread, the men from Whitmore's grew desperate — violence everywhere across the state." },
      { speaker: 1, text: "So he had to move again." },
      { speaker: 2, text: "He went south along the river to find your mother. She was alone, raising your sister Lily through all the chaos after the war broke wide open." },
      { speaker: 2, text: "Before he left, he hid this letter — meant for your mother. He hoped it would reach her somehow. I kept it safe." },
      { speaker: 1, text: "Then I will read it. I have to find them." },
    ], 'dual', () => goTo('letter2'));
  }, 350);
}

// ─── ZIGZAG / RAIL FENCE CIPHER (3 RAILS) ────────────────────────────────────
const ZZ_VARIANTS = [
  { answer: 'THERIVERMOUTH', display: 'THE RIVER MOUTH' },
  { answer: 'GALVESTONBAY',  display: 'GALVESTON BAY'  },
  { answer: 'COASTALMARSH',  display: 'COASTAL MARSH'  },
  { answer: 'BRAZOSRIVER',   display: 'BRAZOS RIVER'   },
  { answer: 'TRINITYDELTA',  display: 'TRINITY DELTA'  },
  { answer: 'SABINEPASS',    display: 'SABINE PASS'    },
];
let ZZ_ANSWER, ZZ_DISPLAY, ZZ_RAIL0, ZZ_RAIL1, ZZ_RAIL2, ZZ_ENCODED;
{
  const v = ZZ_VARIANTS[Math.floor(Math.random() * ZZ_VARIANTS.length)];
  const r = [[], [], []];
  for (let i = 0; i < v.answer.length; i++) {
    const p = i % 4; r[p <= 2 ? p : 4 - p].push(v.answer[i]);
  }
  ZZ_ANSWER  = v.answer;
  ZZ_DISPLAY = v.display;
  ZZ_RAIL0   = r[0].join('');
  ZZ_RAIL1   = r[1].join('');
  ZZ_RAIL2   = r[2].join('');
  ZZ_ENCODED = r[0].join('') + r[1].join('') + r[2].join('');
}

// Returns which rail (0, 1, or 2) a given position falls on
function getRailFor(i) {
  const pos = i % 4; // period = 2*(3-1) = 4
  return pos <= 2 ? pos : 4 - pos; // 0,1,2,1,0,1,2,1…
}

function openZigzagModal() {
  document.getElementById('zigzag-modal').style.display = 'flex';
  buildZigzagVisual();
  const ans = document.getElementById('zz-answer');
  if (ans) { ans.value = ''; ans.disabled = false; }
  // Show 3 rail groups
  document.getElementById('zz-encoded-flat').textContent =
    ZZ_RAIL0 + ' · ' + ZZ_RAIL1 + ' · ' + ZZ_RAIL2;
  document.getElementById('zz-msg').textContent = 'Interleave the three rows to recover the original message';
  document.getElementById('zz-msg').style.color = '';
  document.getElementById('zz-reveal').textContent = '📍 ' + ZZ_DISPLAY;
  document.getElementById('zz-reveal').classList.remove('show');
  document.getElementById('zz-continue').style.display = 'none';
  initModalGemini(2);
}

// Build a colour-coded 3-row grid for any text
function buildRailGrid(text, cellPx) {
  const sz = cellPx || 22;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
  const n         = text.length;
  const posToRail = Array.from({ length: n }, (_, i) => getRailFor(i));
  const railStyle = [
    'background:#1e3a18;border:1px solid #2e5a28;color:#a8d890;',   // rail 0 — green
    'background:#1a1208;border:1px solid #3a2010;color:#c8a060;',   // rail 1 — gold
    'background:#0e1e30;border:1px solid #1a3050;color:#80b0d8;',   // rail 2 — blue
  ];
  for (let r = 0; r < 3; r++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:2px;';
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('div');
      const base = `width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:bold;border-radius:2px;`;
      if (posToRail[i] === r) {
        cell.style.cssText = base + railStyle[r];
        cell.textContent   = text[i];
      } else {
        cell.style.cssText = base + 'opacity:0;';
      }
      row.appendChild(cell);
    }
    wrapper.appendChild(row);
  }
  return wrapper;
}

function buildZigzagVisual() {
  const container = document.getElementById('zz-visual');
  container.innerHTML = '';

  // ── Example: FREEDOM (different word, shows the method) ──
  const exLbl = document.createElement('div');
  exLbl.style.cssText = 'font-size:0.58rem;letter-spacing:2px;color:#4a3820;margin-bottom:4px;';
  exLbl.textContent   = 'HOW IT WORKS — EXAMPLE: "FREEDOM"';
  container.appendChild(exLbl);
  container.appendChild(buildRailGrid('FREEDOM', 20));

  const exInfo = document.createElement('div');
  exInfo.style.cssText = 'font-size:0.63rem;color:#5a4030;margin:4px 0 10px;line-height:1.5;';
  exInfo.innerHTML =
    'Rail 0: <span style="color:#a8d890">FD</span> &nbsp;·&nbsp; ' +
    'Rail 1: <span style="color:#c8a060">REO</span> &nbsp;·&nbsp; ' +
    'Rail 2: <span style="color:#80b0d8">EM</span> ' +
    '→ Encoded: <strong style="color:#f0d890">FDREOEM</strong>';
  container.appendChild(exInfo);

}

function checkZigzagAnswer(submit) {
  const input = document.getElementById('zz-answer');
  const msg   = document.getElementById('zz-msg');
  const val   = input.value.replace(/\s+/g, '').toUpperCase();
  if (val === ZZ_ANSWER) {
    msg.style.color = '#4caf50';
    msg.textContent = '✓ Correct! The location is revealed.';
    document.getElementById('zz-reveal').classList.add('show');
    document.getElementById('zz-continue').style.display = 'inline-block';
    input.disabled = true;
  } else if (submit) {
    msg.style.color = '#e05050';
    msg.textContent = 'Not quite — follow the 0→1→2→1→0 pattern to interleave the three rails';
    setTimeout(() => {
      msg.style.color = '';
      msg.textContent = 'Interleave the three rows to recover the original message';
    }, 2200);
  }
}

function zigzagSolved() {
  document.getElementById('zigzag-modal').style.display = 'none';
  startScene3();
}

// ─── MIRROR LOCK DATA ────────────────────────────────────────────────────────
const OUTSIDE_CODE  = Array.from({length: 4}, () => Math.floor(Math.random() * 10));
const MIRROR_ANSWER = OUTSIDE_CODE.map(d => (d + 5) % 10).reverse();

// ─── GEMINI FALLBACKS (shown when API quota is exceeded) ─────────────────────
const GEMINI_FALLBACKS = {
  hint: {
    1: 'Each letter was shifted forward by its position number — letter 1 shifts +1, letter 2 shifts +2, and so on. To decode, subtract each position\'s number from the encoded letter and work backwards through the alphabet.',
    2: 'The message was split across 3 rails in a zigzag pattern (0→1→2→1→0…). The encoded text lists all of rail 0 first, then rail 1, then rail 2. Identify which positions belong to each rail, then interleave them to reveal the message.',
    3: 'Thomas read the code through a window — that means the digits you see are already the right way up for you. Add 5 to each digit (wrapping around past 9), then reverse the entire sequence to get the lock combination.',
  },
  example: {
    1: 'Take "CAT": C(+1)=D, A(+2)=C, T(+3)=W → encoded "DCW". To decode "DCW": D−1=C, C−2=A, W−3=T → "CAT". Apply the same logic to each letter in your cipher.',
    2: '"FREEDOM" on 3 rails — Rail 0: F,D · Rail 1: R,E,O · Rail 2: E,M → encoded FDREOEM. The zigzag order is 0→1→2→1→0→1→2 for each letter position. Interleave the three rails following that same pattern to decode.',
    3: `Outside code 1-2-3-4: add 5 mod 10 to each digit → 6-7-8-9, then reverse → 9-8-7-6. That's the combination. Now apply the same two steps to ${OUTSIDE_CODE.join('-')}!`,
  },
};

// ─── MODAL GEMINI (Ciphers 1 & 2) ────────────────────────────────────────────
let currentModalCipher = 0;
const modalHintIdx = { 1: 0, 2: 0 };

// Lazy-evaluated so encodedLocation / selectedLocation are ready
const MODAL_CIPHER_DATA = {
  1: {
    getContext() {
      return `June is decoding a Shifting Dial cipher from her father's letter. ` +
        `Encoded text: "${encodedLocation}". Each letter was shifted forward by its position number (+1, +2, +3…). ` +
        `To decode, subtract each position's shift from the encoded letter. ` +
        `The decoded location is "${selectedLocation.name}". ` +
        `Give a helpful 2-sentence hint without stating the full answer.`;
    },
    hints: [
      `Each letter was shifted forward by its position number. To reverse it: Position 1 → go back 1, Position 2 → go back 2, etc. Example — if 'D' is at position 3, go back 3 to get 'A' (wrap Z→A if needed).`,
      `Work left to right through the encoded text, skipping spaces. Subtract each letter's sequential position number from its encoded value. The result will spell a place name.`,
      `You are looking for a location of 2–3 words. Keep subtracting each shift and the hidden name will appear. You are so close!`,
    ],
  },
  2: {
    getContext() {
      return `June is decoding a 3-rail Rail Fence cipher from her father's letter. ` +
        `Rail 0 (top): "${ZZ_RAIL0}", Rail 1 (middle): "${ZZ_RAIL1}", Rail 2 (bottom): "${ZZ_RAIL2}". ` +
        `Encoded text reads rail by rail: "${ZZ_ENCODED}". ` +
        `To decode, interleave the three rails in zigzag order 0→1→2→1→0→1→2… ` +
        `The decoded message is "THE RIVER MOUTH". Give a 2-sentence hint without stating the answer.`;
    },
    hints: [
      `The message zigzags across THREE rails. Rail 0: TIMH, Rail 1: HRVROT, Rail 2: EEU. To decode, pick one letter at a time in zigzag order: Rail 0 → Rail 1 → Rail 2 → Rail 1 → Rail 0 → Rail 1 → Rail 2…`,
      `Follow the zigzag 0→1→2→1→0→1→2→1→0… Pick: T(r0), H(r1), E(r2), R(r1), I(r0), V(r1), E(r2), R(r1), M(r0), O(r1), U(r2), T(r1), H(r0). What place does that spell?`,
      `The decoded message reveals a meeting place on the river. Keep weaving the three rails together in zigzag order — you are nearly there!`,
    ],
  },
};

function initModalGemini(cipherNum) {
  currentModalCipher = cipherNum;
  modalHintIdx[cipherNum] = 0;
  const prefix   = cipherNum === 1 ? 'cm' : 'zz';
  const msgs     = document.getElementById(`${prefix}-gem-msgs`);
  if (msgs) msgs.innerHTML = '';
  const hintBtn    = document.getElementById(`${prefix}-gem-hint-btn`);
  const exampleBtn = document.getElementById(`${prefix}-gem-example-btn`);
  const solveBtn   = document.getElementById(`${prefix}-gem-solve-btn`);
  if (hintBtn)    hintBtn.style.display    = 'inline-block';
  if (exampleBtn) exampleBtn.style.display = 'none';
  if (solveBtn)   solveBtn.style.display   = 'none';
  // Show key overlay if no API key
  const overlay = document.getElementById(`${prefix}-gem-key-overlay`);
  if (overlay) overlay.style.display = localStorage.getItem('google_api_key') ? 'none' : 'flex';
}

function saveModalGeminiKey(prefix) {
  const inp = document.getElementById(`${prefix}-gem-key-inp`);
  const val = inp ? inp.value.trim() : '';
  if (val) {
    localStorage.setItem('google_api_key', val);
    const overlay = document.getElementById(`${prefix}-gem-key-overlay`);
    if (overlay) overlay.style.display = 'none';
  }
}

function addModalMessage(cipherNum, text, role) {
  const prefix = cipherNum === 1 ? 'cm' : 'zz';
  const box    = document.getElementById(`${prefix}-gem-msgs`);
  if (!box) return;
  const div       = document.createElement('div');
  div.className   = `gem-bbl ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop   = box.scrollHeight;
}

async function requestModalGeminiHint() {
  const n    = currentModalCipher;
  const data = MODAL_CIPHER_DATA[n];
  if (!data) return;
  const key    = localStorage.getItem('google_api_key');
  const prefix = n === 1 ? 'cm' : 'zz';

  if (!key) return; // overlay is blocking the button — safety guard only

  addModalMessage(n, 'thinking…', 't');
  let reply;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `You are a warm companion in an 1865 Juneteenth adventure game. 2-3 sentences max.\n\n${data.getContext()}`
          }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 120,
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        })
      }
    );
    const box = document.getElementById(`${prefix}-gem-msgs`);
    if (box && box.lastChild && box.lastChild.classList.contains('t')) box.lastChild.remove();
    if (res.status === 429) { reply = `⚠ Quota exceeded — built-in hint:\n${GEMINI_FALLBACKS.hint[n]}`; }
    else if (!res.ok) throw new Error();
    else {
      const d = await res.json();
      const parts = d.candidates[0].content.parts;
      reply = (parts.find(p => !p.thought) || parts[0]).text;
    }
  } catch {
    const box = document.getElementById(`${prefix}-gem-msgs`);
    if (box && box.lastChild && box.lastChild.classList.contains('t')) box.lastChild.remove();
    reply = 'Could not reach Gemini — check your API key and internet connection.';
  }

  addModalMessage(n, reply, 'g');
  // Hint done → hide Hint, show Example
  const hintBtn    = document.getElementById(`${prefix}-gem-hint-btn`);
  const exampleBtn = document.getElementById(`${prefix}-gem-example-btn`);
  if (hintBtn)    hintBtn.style.display    = 'none';
  if (exampleBtn) exampleBtn.style.display = 'inline-block';
}

const MODAL_EXAMPLE_PROMPT = {
  1: `You are a warm companion in an 1865 Juneteenth adventure game. Show a quick Shifting Dial example: pick any short word (NOT the actual puzzle answer), then show how each letter shifts forward by its position number (+1 for the 1st letter, +2 for the 2nd…). Present it clearly. 3 sentences max.`,
  2: `You are a warm companion in an 1865 Juneteenth adventure game. Walk through the FREEDOM example with 3-rail Rail Fence: show the zigzag grid, the three rails, and how they combine into the encoded string. 3 sentences max.`,
};

async function requestModalGeminiExample() {
  const n      = currentModalCipher;
  const key    = localStorage.getItem('google_api_key');
  const prefix = n === 1 ? 'cm' : 'zz';
  if (!key) return;

  addModalMessage(n, 'thinking…', 't');
  let reply;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: MODAL_EXAMPLE_PROMPT[n] }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 160, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );
    const box = document.getElementById(`${prefix}-gem-msgs`);
    if (box && box.lastChild && box.lastChild.classList.contains('t')) box.lastChild.remove();
    if (res.status === 429) { reply = `⚠ Quota exceeded — built-in example:\n${GEMINI_FALLBACKS.example[n]}`; }
    else if (!res.ok) throw new Error();
    else {
      const d = await res.json();
      const parts = d.candidates[0].content.parts;
      reply = (parts.find(p => !p.thought) || parts[0]).text;
    }
  } catch {
    const box = document.getElementById(`${prefix}-gem-msgs`);
    if (box && box.lastChild && box.lastChild.classList.contains('t')) box.lastChild.remove();
    reply = 'Could not reach Gemini — check your API key and internet connection.';
  }

  addModalMessage(n, reply, 'g');
  // Example done → hide Example, show Solve
  const exampleBtn = document.getElementById(`${prefix}-gem-example-btn`);
  const solveBtn   = document.getElementById(`${prefix}-gem-solve-btn`);
  if (exampleBtn) exampleBtn.style.display = 'none';
  if (solveBtn)   solveBtn.style.display   = 'inline-block';
}

function requestModalGeminiSolve() {
  const n      = currentModalCipher;
  const prefix = n === 1 ? 'cm' : 'zz';

  if (n === 1) {
    addModalMessage(n, `The decoded location is "${selectedLocation.name}". Entering the answer now…`, 'g');
    setTimeout(() => {
      const inp = document.getElementById('cm-answer');
      if (inp) { inp.value = selectedLocation.name; checkAnswer(true); }
      document.getElementById(`${prefix}-gem-hint-btn`).style.display  = 'none';
      document.getElementById(`${prefix}-gem-solve-btn`).style.display = 'none';
    }, 700);
  } else if (n === 2) {
    addModalMessage(n, `The decoded message is "${ZZ_DISPLAY}". Entering the answer now…`, 'g');
    setTimeout(() => {
      const inp = document.getElementById('zz-answer');
      if (inp) { inp.value = ZZ_DISPLAY; checkZigzagAnswer(true); }
      document.getElementById(`${prefix}-gem-hint-btn`).style.display  = 'none';
      document.getElementById(`${prefix}-gem-solve-btn`).style.display = 'none';
    }, 700);
  }
}

// ─── SCENE 3 — Captured (June & Thomas) ──────────────────────────────────────
function startScene3() {
  setCharacters('JUNE', 'persons/june.png', 'THOMAS', 'persons/boy.png');
  goTo('scene3');
  setTimeout(() => {
    showDialogue([
      { speaker: 1, text: "Where am I? How did I end up in here?" },
      { speaker: 2, text: "You were kidnapped. The Whitmore men — they grabbed you last night from the dockside restaurant." },
      { speaker: 1, text: "The restaurant… I remember now. I was sitting by the window watching the street. A man in a black coat brought me tea. Then everything went dark." },
      { speaker: 2, text: "They think you know where your father is hiding. I'm Thomas. I've been locked in this cellar for a week." },
      { speaker: 1, text: "There has to be a way out. What do you know about that lock on the door?" },
      { speaker: 2, text: `There's a code scratched on the outside — ${OUTSIDE_CODE.join(', ')}. But those numbers don't open it from in here. The mechanism runs backwards.` },
      { speaker: 1, text: `Backwards… If the dial goes 0 through 9 and outside shows ${OUTSIDE_CODE[0]}, then on this side ${OUTSIDE_CODE[0]}'s opposite is ${(OUTSIDE_CODE[0]+5)%10}. Separated by exactly five. And the whole sequence would be reversed.` },
      { speaker: 2, text: "You actually think that works?" },
      { speaker: 1, text: "Only one way to find out." },
    ], 'dual', () => { goTo('game'); showAct(3); });
  }, 350);
}

let wheelVals = [0, 0, 0, 0];

// ─── GAME SCREEN ─────────────────────────────────────────────────────────────
let currentAct    = 3;
let geminiHintIdx = { 3: 0 };

const ACTS = {
  3: {
    tag:   'SCENE 3 — CAPTURED',
    title: 'The Mirror Lock',
    desc:  `Thomas read the outside code: ${OUTSIDE_CODE.join(' · ')}. But from the inside the mechanism is mirrored — each digit flips to its opposite (add 5, mod 10) and the whole sequence is reversed. Work out the inside combination to escape.`,
    geminiContext: `June is trapped in a cellar with a 4-digit mirror lock. Thomas read the outside code as ${OUTSIDE_CODE.join('-')}. The rule: each digit becomes its "opposite" on a 0-9 dial (add 5, mod 10 — e.g. ${OUTSIDE_CODE[0]}→${(OUTSIDE_CODE[0]+5)%10}), then the whole sequence is reversed. The inside combination is ${MIRROR_ANSWER.join('-')}. Give hints gradually without stating the full answer at first.`,
    geminiHints: [
      `Thomas saw ${OUTSIDE_CODE.join('-')} on the outside. Think of the dial like a clock face going 0–9. If a digit is ${OUTSIDE_CODE[0]}, what number sits exactly 5 steps away on that dial?`,
      `Work out the opposite of each digit (add 5, mod 10): ${OUTSIDE_CODE.map(d=>`${d}→${(d+5)%10}`).join(', ')}. Now remember — June said the whole sequence is also reversed.`,
      `The four opposites in order are ${OUTSIDE_CODE.map(d=>(d+5)%10).join('-')}. Reversed, that gives ${MIRROR_ANSWER.join('-')}. Set those four wheels and the lock will open!`,
    ],
  },
};

function showAct(actNum) {
  currentAct = actNum;
  const act  = ACTS[actNum];
  document.getElementById('p-tag').textContent   = act.tag;
  document.getElementById('p-title').textContent = act.title;
  document.getElementById('p-desc').textContent  = act.desc;
  document.getElementById('gate-wrap').style.display = 'none';
  document.getElementById('lock-wrap').style.display = 'none';
  const btnNext = document.getElementById('btn-next');
  btnNext.style.display = 'none';
  btnNext.textContent   = 'Lead to Freedom →';
  document.getElementById('gem-msgs').innerHTML = '';
  geminiHintIdx[actNum] = 0;
  buildMirrorLock();
  initGeminiPanel();
}

function advanceAct() {
  goTo('end');
  startOutroAnimation();
}

// ─── MIRROR LOCK ─────────────────────────────────────────────────────────────
function buildMirrorLock() {
  document.getElementById('lock-wrap').style.display = 'flex';
  const ocd = document.getElementById('outside-code-display');
  if (ocd) ocd.textContent = OUTSIDE_CODE.join(' · ');
  wheelVals = [0, 0, 0, 0];
  const rowEl = document.getElementById('wheels-row');
  rowEl.innerHTML = '';
  MIRROR_ANSWER.forEach((_, i) => {
    const wEl = document.createElement('div');
    wEl.className = 'dwheel';
    wEl.innerHTML = `
      <button class="wbtn" onclick="spinWheel(${i}, 1)">▲</button>
      <div class="wdigit-wrap"><div class="wdigit" id="wd-${i}">0</div></div>
      <button class="wbtn" onclick="spinWheel(${i}, -1)">▼</button>`;
    rowEl.appendChild(wEl);
  });
  const status = document.getElementById('lock-status');
  status.className = 'lock-status'; status.textContent = 'LOCKED';
  document.getElementById('lock-open-msg').classList.remove('show');
}

function spinWheel(idx, dir) {
  wheelVals[idx] = (wheelVals[idx] + dir + 10) % 10;
  const el = document.getElementById(`wd-${idx}`);
  el.textContent = wheelVals[idx];
  el.classList.remove('spin');
  void el.offsetWidth;
  el.classList.add('spin');
  checkMirrorLock();
}

function checkMirrorLock() {
  const correct = MIRROR_ANSWER.every((v, i) => wheelVals[i] === v);
  if (correct) {
    const status = document.getElementById('lock-status');
    status.className = 'lock-status open'; status.textContent = 'UNLOCKED';
    document.getElementById('lock-open-msg').classList.add('show');
    const btn = document.getElementById('btn-next');
    btn.textContent   = 'Lead to Freedom →';
    btn.style.display = 'inline-block';
    addMessage('The gears click and the cellar door swings open. Well done, June — freedom is just outside. Run!', 'g');
  }
}

// ─── GEMINI PANEL ────────────────────────────────────────────────────────────
function addMessage(text, role) {
  const box = document.getElementById('gem-msgs');
  const div = document.createElement('div');
  div.className   = `gem-bbl ${role}`;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function initGeminiPanel() {
  const key     = localStorage.getItem('google_api_key');
  const overlay = document.getElementById('gem-key-overlay');
  if (overlay) overlay.style.display = key ? 'none' : 'flex';
  document.getElementById('gem-hint-btn').style.display    = 'inline-block';
  document.getElementById('gem-example-btn').style.display = 'none';
  document.getElementById('gem-solve-btn').style.display   = 'none';
}

function saveGeminiKey() {
  const val = document.getElementById('gem-key-inp').value.trim();
  if (val) {
    localStorage.setItem('google_api_key', val);
    document.getElementById('gem-key-overlay').style.display = 'none';
  }
}

function useBuiltinHints() {
  document.getElementById('gem-key-overlay').style.display = 'none';
}

async function requestGeminiHint() {
  const key = localStorage.getItem('google_api_key');
  if (!key) return; // overlay blocks the button — safety guard only
  const act = ACTS[currentAct];
  if (!act) return;

  const typing = document.createElement('div');
  typing.className = 'gem-bbl t'; typing.textContent = 'thinking…';
  document.getElementById('gem-msgs').appendChild(typing);
  const reply = await callGeminiAPI('Give me a hint for this puzzle', GEMINI_FALLBACKS.hint[3]);
  typing.remove();

  addMessage(reply, 'g');
  // Hint done → hide Hint, show Example
  document.getElementById('gem-hint-btn').style.display    = 'none';
  document.getElementById('gem-example-btn').style.display = 'inline-block';
}

async function requestGeminiExample() {
  const key = localStorage.getItem('google_api_key');
  if (!key) return;

  const typing = document.createElement('div');
  typing.className = 'gem-bbl t'; typing.textContent = 'thinking…';
  document.getElementById('gem-msgs').appendChild(typing);

  const prompt = `You are a warm companion in an 1865 Juneteenth adventure game. Explain the Mirror Lock puzzle with a short example: the outside code seen through a window is read normally, each digit is transformed by adding 5 mod 10, then the whole sequence is reversed to get the lock combination. Show with a simple 4-digit example (NOT 5-3-7-1). 3 sentences max.`;

  const reply = await callGeminiAPI(prompt, GEMINI_FALLBACKS.example[3]);
  typing.remove();

  addMessage(reply, 'g');
  // Example done → hide Example, show Solve
  document.getElementById('gem-example-btn').style.display = 'none';
  document.getElementById('gem-solve-btn').style.display   = 'inline-block';
}

async function requestGeminiSolve() {
  // Show the answer in chat, then auto-set the wheels
  addMessage(
    `The answer is ${MIRROR_ANSWER.join('-')}. Flip each outside digit (add 5 mod 10): ${OUTSIDE_CODE.map(d=>`${d}→${(d+5)%10}`).join(', ')} → giving ${OUTSIDE_CODE.map(d=>(d+5)%10).join('-')}, then reverse → ${MIRROR_ANSWER.join('-')}. Setting the wheels now…`,
    'g'
  );
  document.getElementById('gem-hint-btn').style.display    = 'none';
  document.getElementById('gem-example-btn').style.display = 'none';
  document.getElementById('gem-solve-btn').style.display   = 'none';

  // Animate wheels to correct values
  MIRROR_ANSWER.forEach((val, i) => {
    wheelVals[i] = val;
    const el = document.getElementById(`wd-${i}`);
    if (el) {
      el.textContent = val;
      el.classList.remove('spin');
      void el.offsetWidth;
      el.classList.add('spin');
    }
  });
  setTimeout(checkMirrorLock, 400);
}

async function callGeminiAPI(userMsg, fallback = null) {
  const key = localStorage.getItem('google_api_key');
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `You are Gemini, a warm and encouraging companion guiding June through an 1865 Juneteenth adventure game. Tone: inspiring, slightly mysterious. 2-3 sentences max.\n\nPuzzle context: ${ACTS[currentAct].geminiContext}\n\nUser: ${userMsg}`
          }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 120,
            thinkingConfig: { thinkingBudget: 0 }
          }
        })
      }
    );
    if (res.status === 429) return fallback ? `⚠ Quota exceeded — built-in hint:\n${fallback}` : '⚠ Quota exceeded — please try again later.';
    if (!res.ok) throw new Error();
    const data = await res.json();
    const parts = data.candidates[0].content.parts;
    return (parts.find(p => !p.thought) || parts[0]).text;
  } catch {
    return 'Could not reach Gemini — check your API key and internet connection.';
  }
}

// ─── OUTRO SPARKLES ──────────────────────────────────────────────────────────
function startOutroAnimation() {
  setTimeout(() => {
    const sc = document.getElementById('sparkle-canvas');
    if (!sc) return;
    sc.width  = sc.offsetWidth  || window.innerWidth;
    sc.height = sc.offsetHeight || window.innerHeight;
    const sctx = sc.getContext('2d');

    function makeSpark() {
      return {
        x: Math.random() * sc.width,
        y: sc.height + Math.random() * 40,
        r: 0.8 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(0.5 + Math.random() * 1.8),
        life: 0.6 + Math.random() * 0.4,
        decay: 0.003 + Math.random() * 0.005,
        gold: Math.random() < 0.65,
      };
    }
    const sparks = Array.from({ length: 80 }, makeSpark);

    function tick() {
      sctx.clearRect(0, 0, sc.width, sc.height);
      sparks.forEach((s, i) => {
        s.x    += s.vx;
        s.y    += s.vy;
        s.life -= s.decay;
        if (s.life <= 0) { sparks[i] = makeSpark(); return; }
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sctx.fillStyle = s.gold
          ? `rgba(255,210,80,${s.life.toFixed(2)})`
          : `rgba(255,255,210,${s.life.toFixed(2)})`;
        sctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();

    document.querySelectorAll('#s-end .outro-item').forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateY(0)';
      }, 300 + i * 380);
    });
  }, 60);
}

// ─── SKIP ────────────────────────────────────────────────────────────────────
function skipToEnd() { goTo('end'); startOutroAnimation(); }

// ─── INIT ────────────────────────────────────────────────────────────────────
// startScene() is called by dismissCh3Intro() in index.html after the chapter overlay fades
