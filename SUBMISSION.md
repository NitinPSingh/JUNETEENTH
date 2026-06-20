*This is a submission for the [June Solstice Game Jam](https://dev.to/challenges/june-game-jam-2026-06-03)*

## What I Built

**Juneteenth: 1865** — an interactive browser story game set across three chapters, spanning the historic days around June 19, 1865, the day freedom finally arrived in Texas.

🎮 **[Play the Game → juneteenth1865.netlify.app](https://juneteenth1865.netlify.app/)**

The game follows two parallel journeys:

- **General Gordon Granger** sailing into Galveston Bay to deliver the long-overdue proclamation of freedom
- **June**, a young woman decoding her father's hidden letters to find her family after years of separation

The game is kept **short and completable by design** — every puzzle has guidance so any player can reach the ending, regardless of experience.

---

### The Three Chapters

**Chapter 1 — The Galveston Tide** *(June 18, 1865)*

A side-scrolling ship runner on the HTML5 Canvas. General Granger and his Captain navigate Confederate wreckage to reach Galveston Bay. Collect lighthouse beacons to light the way through the night. A pre-game dialogue between the General and Captain sets the historical scene before sailing begins.

---

**Chapter 2 — A Voice Across the Regions** *(June 19, 1865)*

Three connected moments:

1. **Pull the rope** — drag the curtain handle to raise a red theatre curtain and reveal General Order No. 3, the proclamation that freed over 250,000 enslaved people in Texas. Read it. Let it land.

2. **Dialogue** — the Reverend and Clara speak about what comes next: the word of freedom must reach all eight districts of Galveston, not just one.

3. **The Bell Puzzle** — inspired by the LinkedIn Queens game. An 8×8 grid divided into 8 coloured districts. Place one freedom bell in each district so that no two bells share the same row, column, or touch each other diagonally. Every bell placed means another district hears the message. Spread the word to all eight corners of the city.

---

**Chapter 3 — June's Horizon** *(June 20, 1865)*

Three cryptographic puzzles woven into June's search for her father:

- **Cipher 1 — The Shifting Dial:** A positional shift cipher where each letter is shifted forward by its position number. An A–Z reference grid helps players decode. 6 randomised location answers.
- **Cipher 2 — The Rail Fence:** A 3-rail zigzag cipher with 6 randomised encoded locations, computed dynamically each session.
- **Cipher 3 — The Mirror Lock:** A 4-digit mirror transformation (add 5 mod 10, reverse the sequence). Fully randomised every session — no two playthroughs are the same.

Each cipher has a **Gemini AI Companion** with a sequential hint flow: **Hint → Example → Solve for me**. Quota errors trigger built-in fallback hints automatically.

---

## Video Demo

{% youtube L_xiLhG66C4 %}

---

## Code

{% github NitinPSingh/JUNETEENTH %}

🔗 **[github.com/NitinPSingh/JUNETEENTH](https://github.com/NitinPSingh/JUNETEENTH)**

---

## How I Built It

**Pure vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.** Everything runs directly in the browser from a single folder.

### Architecture

- 3 standalone chapters, each a self-contained `index.html` + `game.js`
- A root landing page handles the Google API key and navigates into Chapter 1
- `localStorage` persists the key across all chapters seamlessly

---

### Chapter 1 — Canvas Game Engine

Built entirely on the HTML5 Canvas API with a custom game loop:

- Lane-based ship movement with keyboard controls
- Procedural obstacle and lighthouse spawning with increasing speed
- Sprite rendering using transparent PNGs
- Screen shake on collision, HUD with health and progress tracking
- Two-phase structure: dodge phase → lighthouse-collection phase
- Dual character dialogue (General Granger & the Captain) plays before the game begins

---

### Chapter 2 — Curtain Drag + Bell Puzzle

**Curtain mechanic:** A draggable rope handle controls a CSS `translateY` transform on the curtain cloth. As the handle reaches the bottom, the curtain fully rises and the proclamation is revealed. Works on both mouse and touch.

**Bell Puzzle:** An 8×8 grid puzzle inspired by the LinkedIn Queens game, reskinned to fit the story:

- 8 coloured regions represent the 8 districts of Galveston
- Players place freedom bells — one per district
- Rules: no two bells in the same row, no two in the same column, no two touching diagonally
- Validation runs on every placement — conflicting cells shake and highlight
- A progress bar tracks how many districts have heard the message
- Solving the puzzle unlocks the path to Chapter 3

---

### Chapter 3 — Cipher Engine

**Shifting Dial** — picks one of 6 location variants at page load, renders per-letter tiles with shift numbers, and provides an A–Z reference grid so players can decode without counting manually.

**Rail Fence** — computes all three rails at runtime using period-4 zigzag logic:

```js
const p = i % 4;
rail = p <= 2 ? p : 4 - p; // 0→1→2→1→0→1→2…
```

All 6 variants encode dynamically — the modal, Gemini context, and solve message always match the picked variant.

**Mirror Lock** — generates 4 random digits each session and derives the answer as:

```js
const OUTSIDE_CODE  = Array.from({length: 4}, () => Math.floor(Math.random() * 10));
const MIRROR_ANSWER = OUTSIDE_CODE.map(d => (d + 5) % 10).reverse();
```

The dialogue, lock display, act description, Gemini hints, and solve message all reference the live random values via template literals.

**Gemini 2.5 Flash** is called with `thinkingBudget: 0` to suppress reasoning tokens. A `parts.find(p => !p.thought)` filter ensures only the actual response text is shown. HTTP 429 quota errors fall back to hand-written cipher-specific hints automatically.

---

## Prize Category

### Best Google AI Usage

Gemini 2.5 Flash powers an in-game AI companion across all three cipher puzzles. The integration goes beyond a simple chatbot:

- **Context-aware prompts** — each cipher's prompt includes the specific encoded text, rails, or outside code for that session's random values, so hints are always relevant to the exact puzzle the player is solving
- **Sequential reveal system** — Hint → Example → Solve for me, one button visible at a time, preventing accidental spoilers
- **Graceful degradation** — HTTP 429 quota errors trigger hand-written fallback hints per cipher, so the game is fully playable without API access
- **Key overlay UX** — a frosted overlay physically blocks all AI buttons until a Google API key is entered

### Best Ode to Alan Turing

Alan Turing spent his life **breaking codes to free the world from tyranny**. Juneteenth: 1865 honours that legacy by weaving cipher-breaking into a story about another kind of freedom — the freedom of enslaved people in Texas.

- The Shifting Dial, Rail Fence, and Mirror Lock puzzles are inspired by real cipher families that Turing's era of cryptography studied and broke
- The Rail Fence cipher mirrors the mechanical transposition techniques Turing encountered at Bletchley Park
- The Mirror Lock's `(digit + 5) mod 10` transformation echoes the modular arithmetic at the heart of Enigma-era cryptanalysis
- The Bell Puzzle's placement logic — one per row, one per column, no adjacency — echoes the constraint-satisfaction problems that underpinned Turing's computational thinking
- Just as Turing's work required patience, pattern recognition, and the right key — so does June's search for her father

Freedom. Codes. The belief that the truth, once decoded, changes everything.

---

*Built for the June Solstice Game Jam 2026 — a tribute to Juneteenth and to Alan Turing.*
