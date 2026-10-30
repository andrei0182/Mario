/*
 * Lumo – Aventura Săritoare
 * Platformer 2D pentru mobil. HTML5 Canvas + JavaScript vanilla, fără asset-uri externe.
 */
(() => {
'use strict';

// ---------------------------------------------------------------------------
// Constante
// ---------------------------------------------------------------------------
const T = 32;                 // mărimea unei dale (unități logice)
const ROWS = 12;              // rânduri pe nivel = înălțimea vizibilă
const VIEW_H = T * ROWS;      // înălțimea logică a ecranului

const PHYS = {
  accelGround: 1700,
  accelAir: 1100,
  friction: 1900,
  maxSpeed: 215,
  jumpVel: 660,
  gravityHold: 1500,          // gravitație cât timp butonul e ținut la urcare
  gravity: 2700,
  maxFall: 900,
  coyote: 0.09,
  jumpBuffer: 0.12,
  stompBounce: 430,
};

const STORAGE_BEST = 'lumo.best';
const STORAGE_MUTE = 'lumo.mute';

// ---------------------------------------------------------------------------
// Nivele (date). Legendă:
//   #  pământ         B  cărămidă (se sparge de jos)   ?  bloc-surpriză (monedă)
//   W  ladă           -  platformă (traversabilă de jos) ^  țepi
//   o  monedă         e  Bumbo (gândac care patrulează) f  Zumzi (zburător)
//   P  start jucător  K  punct de control              F  steag de final
//   *  bloc-surpriză cu bere (Lumo crește mare)
//   %  bloc-surpriză cu carne (Lumo aruncă cu mici)
// ---------------------------------------------------------------------------
const LEVELS = [
  {
    name: "Pajiștea Însorită",
    theme: "meadow",
    time: 300,
    map: [
      "                                                                                                                                                      ",
      "                                                                                                                                                      ",
      "                                                                                                                                                      ",
      "                   ooo                                                                                                                           F    ",
      "                                                                                                                oo                       ###          ",
      "                                                          BB%BB                                                ---                      ####          ",
      "              *   B?B?B       ooo     ooooo    ooo                      ooo      oooo              ooo     oo               *B?        #####          ",
      "                                #             -----               o             BBBBBB                    ---                         ######          ",
      "                               ##                                 W                                                                  #######          ",
      "   P    ooo              e    ###                      e     e              K       e     ^^  e                     e   e           ########          ",
      "#######################################   #############################   #########################   ################################################",
      "#######################################   #############################   #########################   ################################################"
    ]
  },
  {
    name: "Peștera de Cristal",
    theme: "cave",
    time: 300,
    map: [
      "################################################################################################################################################################",
      "                                                                                                                                                                ",
      "                                                                                                                                                                ",
      "                                                                                                                                              f            F    ",
      "                                      f                                                                   f                              oo                     ",
      "                                                                                    f         oo                                        ----         ##         ",
      "        B*B              oo    ooo                   ooo o ooo        ?B%B?                o  --                BB*BB  ooo          oo              ###         ",
      "                        ----   ---            BBBB   ---   ---                    ###      --                          ---         ----            ####         ",
      "                                                                                 #####                                                            #####         ",
      "   P    ooo   e     e                     ^^^  e                  K     e   e   ######              ^^  e   e                  K       e    e    ######         ",
      "###############################    ##################    ##    ############################     #######################    #####################################",
      "###############################    ##################    ##    ############################     #######################    #####################################"
    ]
  },
  {
    name: "Cetatea din Nori",
    theme: "sky",
    time: 300,
    map: [
      "                                                                                                                                                                               ",
      "                                                                                                                                                                               ",
      "                                                                                                                                                                         F     ",
      "                                                      f                                                   f                                                      ###           ",
      "                                                                                                                                                f               ####           ",
      "                                         ooo     oo              oo               f          oo                      oo                                        #####           ",
      "          *B?      ooo         ooo              BBBB          oo   oo         %       ooo    --       B*B?B                  ---          BBB                 ######           ",
      "                                     e                       --- ##---                ---                        --- ##-- ooo                                #######           ",
      "                                   ######                        ##                       ###                        ##                                     ########           ",
      "   P    oo     e          e        ######           e   e        ##     K   ^^  e         ###       e   e   e        ##   ###      K    e     ^^^ e   e    #########           ",
      "###################   #########    ######    ################    ##   ################    ###   #################    ##   ###   ###############################################",
      "###################   #########    ######    ################    ##   ################    ###   #################    ##   ###   ###############################################"
    ]
  }
];

const THEMES = {
  meadow: {
    skyTop: '#4fb8ff', skyBot: '#c8f1ff', far: '#9edcb0', near: '#63bd7c',
    ground: '#b7773f', groundDark: '#8c5428', grass: '#4fd35c', grassDark: '#2c9b3c',
    brick: '#d98a4c', brickDark: '#9c5428', plank: '#e8b46c', plankDark: '#a8723a',
    cloud: 'rgba(255,255,255,0.9)', text: '#ffffff', deco: 'flowers',
  },
  cave: {
    skyTop: '#140b2a', skyBot: '#35205a', far: '#26173f', near: '#33204f',
    ground: '#5d4c80', groundDark: '#3c2d5a', grass: '#5ae6d8', grassDark: '#24a197',
    brick: '#7d62ad', brickDark: '#4b3777', plank: '#9b8bd0', plankDark: '#5f4f99',
    cloud: 'rgba(120,255,240,0.10)', text: '#ffffff', deco: 'crystals',
  },
  sky: {
    skyTop: '#ff8466', skyBot: '#ffdca6', far: '#f7c1a6', near: '#eaa192',
    ground: '#ece6f4', groundDark: '#bdb2d2', grass: '#ffffff', grassDark: '#d6cdea',
    brick: '#c98ad4', brickDark: '#93569f', plank: '#fff7ef', plankDark: '#d8c4b8',
    cloud: 'rgba(255,247,238,0.95)', text: '#ffffff', deco: 'towers',
  },
};

// ---------------------------------------------------------------------------
// Canvas & dimensiuni
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
let dpr = 1, scale = 1, viewW = 800, cssW = 0, cssH = 0;
const safe = { l: 0, r: 0, t: 0, b: 0 };

function resize() {
  cssW = window.innerWidth;
  cssH = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  scale = cssH / VIEW_H;
  viewW = cssW / scale;
  const cs = getComputedStyle(document.getElementById('safe'));
  safe.t = (parseFloat(cs.paddingTop) || 0) / scale;
  safe.r = (parseFloat(cs.paddingRight) || 0) / scale;
  safe.b = (parseFloat(cs.paddingBottom) || 0) / scale;
  safe.l = (parseFloat(cs.paddingLeft) || 0) / scale;
  layoutButtons();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));

// ---------------------------------------------------------------------------
// Utilitare
// ---------------------------------------------------------------------------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function hash(a, b, c) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function load(key, def) {
  try { const v = localStorage.getItem(key); return v === null ? def : v; } catch (e) { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, String(val)); } catch (e) { /* stocare indisponibilă */ }
}

// ---------------------------------------------------------------------------
// Audio (Web Audio API, sunete sintetizate)
// ---------------------------------------------------------------------------
const Sound = {
  ctx: null,
  master: null,
  muted: load(STORAGE_MUTE, '0') === '1',
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  toggle() {
    this.muted = !this.muted;
    save(STORAGE_MUTE, this.muted ? '1' : '0');
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
  },
  tone(freq, dur, type = 'square', vol = 0.5, slideTo = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, vol = 0.4) {
    if (!this.ctx || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf; src.connect(g); g.connect(this.master);
    src.start();
  },
  jump()  { this.tone(320, 0.16, 'square', 0.25, 680); },
  coin()  { this.tone(988, 0.07, 'square', 0.25); this.tone(1319, 0.22, 'square', 0.25, 0, 0.07); },
  stomp() { this.tone(260, 0.14, 'triangle', 0.6, 70); this.noise(0.06, 0.25); },
  bump()  { this.tone(140, 0.08, 'square', 0.3, 90); },
  brick() { this.noise(0.18, 0.45); this.tone(180, 0.1, 'square', 0.2, 60); },
  hurt()  { this.tone(520, 0.5, 'sawtooth', 0.3, 90); },
  oneUp() { [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.1, 'square', 0.22, 0, i * 0.08)); },
  check() { this.tone(660, 0.1, 'triangle', 0.4); this.tone(990, 0.2, 'triangle', 0.4, 0, 0.1); },
  flag()  { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'square', 0.22, 0, i * 0.12)); },
  grow()  { [262, 330, 392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.09, 'square', 0.22, 0, i * 0.06)); },
  shrink() { [784, 587, 440, 330].forEach((f, i) => this.tone(f, 0.1, 'square', 0.22, 0, i * 0.07)); },
  sizzle() { this.noise(0.12, 0.18); this.tone(700, 0.1, 'square', 0.12, 300); },
  appear() { this.tone(200, 0.35, 'triangle', 0.4, 520); },
  over()  { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.45, 0, i * 0.22)); },
};

// ---------------------------------------------------------------------------
// Muzică de fundal: teme originale, sintetizate și planificate cu Web Audio.
// Note: string-uri de 8 optimi pe măsură; "_" = ține nota, "." = pauză.
// Tobe/bas: 16 șaisprezecimi pe măsură; "x" = lovește, "o" = bas cu o octavă sus.
// ---------------------------------------------------------------------------
const SONGS = {
  meadow: {
    bpm: 100, vol: 0.55,
    chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],   // Am F C G
    bass: [45, 41, 48, 43],
    bassPat: 'x..xx.o.x..xx.o.',
    arp: 8,
    melody: [
      'E5 _ A5 _ G5 E5 D5 C5', 'C5 _ A4 _ C5 D5 E5 _', 'G5 _ E5 _ D5 C5 D5 E5', 'D5 _ _ _ B4 _ . .',
      'E5 _ A5 _ B5 A5 G5 E5', 'F5 _ E5 _ C5 _ A4 C5', 'E5 _ D5 C5 D5 _ E5 G5', 'A5 _ _ _ G5 _ _ _',
    ],
    drums: { k: 'x.......x.x.....', s: '....x.......x...', h: '..x...x...x...x.' },
  },
  cave: {
    bpm: 84, vol: 0.6, echo: true,
    chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],   // Dm Bb Gm A
    bass: [50, 46, 43, 45],
    bassPat: 'x.......x...o...',
    arp: 16,
    melody: [
      'D5 _ _ F5 E5 _ D5 _', '. . F5 _ D5 _ _ _', 'G5 _ F5 _ D5 _ Bb4 _', 'A4 _ _ _ C#5 _ E5 _',
      'F5 _ E5 D5 A5 _ _ _', 'G5 _ F5 _ D5 _ _ _', 'Bb4 _ D5 _ G5 _ F5 E5', 'E5 _ _ _ . . . .',
    ],
    drums: { k: 'x...........x...', s: '................', h: '......x.......x.' },
  },
  sky: {
    bpm: 124, vol: 0.62,
    chords: [[52, 55, 59], [48, 52, 55], [50, 55, 59], [50, 54, 57]],   // Em C G D
    bass: [52, 48, 43, 50],
    bassPat: 'x.xox.xox.xox.xo',
    arp: 8,
    melody: [
      'B4 _ E5 _ G5 _ F#5 E5', 'G5 _ _ E5 C5 _ E5 _', 'D5 _ G5 _ B5 _ A5 G5', 'F#5 _ _ _ A5 _ F#5 _',
      'G5 _ B5 _ E6 _ D6 B5', 'C6 _ B5 _ G5 _ E5 _', 'D5 _ G5 _ A5 B5 A5 G5', 'F#5 _ _ _ D5 _ F#5 _',
    ],
    drums: { k: 'x.....x.x.....x.', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  },
};

const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
function noteToMidi(n) {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  return m ? NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12 : null;
}
const midiFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Pre-procesează melodiile: pentru fiecare optime -> { midi, len (în optimi) } sau null.
for (const song of Object.values(SONGS)) {
  song.notes = song.melody.map((bar) => {
    const tok = bar.split(/\s+/);
    const out = new Array(8).fill(null);
    for (let i = 0; i < 8; i++) {
      const midi = noteToMidi(tok[i]);
      if (midi === null) continue;
      let len = 1;
      while (i + len < 8 && tok[i + len] === '_') len++;
      out[i] = { midi, len };
    }
    return out;
  });
}

const Music = {
  name: null, song: null, timer: 0, step: 0, nextTime: 0, bus: null, echoBus: null, noiseBuf: null,
  setup() {
    const ac = Sound.ctx;
    if (this.bus || !ac) return;
    this.bus = ac.createGain();
    this.bus.connect(Sound.master);
    // ecou pentru peșteră
    this.echoBus = ac.createGain();
    const delay = ac.createDelay(1);
    delay.delayTime.value = 0.36;
    const fb = ac.createGain(); fb.gain.value = 0.38;
    const wet = ac.createGain(); wet.gain.value = 0.45;
    this.echoBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(this.bus);
    this.echoBus.connect(this.bus);
    const len = Math.floor(ac.sampleRate * 0.3);
    this.noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  // Pornește (sau continuă de unde a rămas) tema cerută; null oprește muzica.
  play(name) {
    if (name === this.name && this.timer) return;
    if (!name) { this.pause(); return; }
    if (!Sound.ctx) return;
    this.setup();
    if (name !== this.name) { this.step = 0; }
    this.name = name;
    this.song = SONGS[name];
    this.bus.gain.value = this.song.vol;
    this.nextTime = Sound.ctx.currentTime + 0.08;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 25);
  },
  pause() {
    clearInterval(this.timer);
    this.timer = 0;
  },
  stop() {
    this.pause();
    this.name = null;
  },
  tick() {
    const ac = Sound.ctx;
    if (!ac || ac.state !== 'running') return;
    if (this.nextTime < ac.currentTime - 0.2) this.nextTime = ac.currentTime + 0.05; // după o întrerupere
    const sixteenth = 60 / this.song.bpm / 4;
    while (this.nextTime < ac.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, sixteenth);
      this.nextTime += sixteenth;
      this.step++;
    }
  },
  playStep(step, t, sx) {
    const song = this.song;
    const bars = song.notes.length;
    const bar = Math.floor(step / 16) % bars;
    const s = step % 16;
    const ci = bar % song.chords.length;
    const chord = song.chords[ci];
    const target = song.echo ? this.echoBus : this.bus;

    const b = song.bassPat[s];
    if (b === 'x' || b === 'o') this.voice('triangle', midiFreq(song.bass[ci] - 12 + (b === 'o' ? 12 : 0)), t, sx * 1.8, 0.5, this.bus);
    if (b === 'x' || b === 'o') this.voice('square', midiFreq(song.bass[ci] - 12 + (b === 'o' ? 12 : 0)), t, sx * 1.2, 0.06, this.bus, 600);

    if (song.arp === 16 || s % 2 === 0) {
      const k = song.arp === 16 ? s : s / 2;
      const n = chord[[0, 1, 2, 1][k % 4]] + 12;
      this.voice('triangle', midiFreq(n), t, sx * 1.5, song.echo ? 0.09 : 0.07, target);
    }
    if (s === 0) for (const n of chord) this.voice('sawtooth', midiFreq(n), t, sx * 15, 0.025, this.bus, 900, 0.25);

    if (s % 2 === 0) {
      const note = song.notes[bar][s / 2];
      if (note) {
        const dur = note.len * sx * 2 * 0.92;
        this.voice('square', midiFreq(note.midi), t, dur, 0.11, target, 2600);
        this.voice('triangle', midiFreq(note.midi), t, dur, 0.12, target);
      }
    }

    const dr = song.drums;
    if (dr.k[s] === 'x') this.kick(t);
    if (dr.s[s] === 'x') this.hit(t, 0.14, 1800, 0.22, 'bandpass');
    if (dr.h[s] === 'x') this.hit(t, 0.04, 7000, song.echo ? 0.05 : 0.08, 'highpass');
  },
  voice(type, freq, t, dur, vol, dest, lowpass, attack = 0.008) {
    const ac = Sound.ctx;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - 0.05));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    let node = o;
    if (lowpass) {
      const f = ac.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = lowpass;
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.1);
  },
  kick(t) {
    const ac = Sound.ctx;
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + 0.2);
  },
  hit(t, dur, freq, vol, type) {
    const ac = Sound.ctx;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.noiseBuf;
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.bus);
    src.start(t); src.stop(t + dur + 0.02);
  },
};

// Ce temă ar trebui să se audă acum, în funcție de starea jocului.
function syncMusic() {
  let want = null;
  if (game.state === 'start') want = 'meadow';
  else if (game.state === 'playing' && !game.paused && !isPortraitBlocked() && level) want = level.def.theme;
  if (want !== Music.name || !Music.timer) {
    if (want) Music.play(want); else Music.pause();
  }
}

// ---------------------------------------------------------------------------
// Input: tastatură + touch (multi-touch prin Pointer Events)
// ---------------------------------------------------------------------------
const keys = { left: false, right: false, jump: false, fire: false };
const pointers = new Map();     // pointerId -> zonă ('left' | 'right' | 'jump' | null)
const input = { left: false, right: false, jump: false, fire: false };
let prevJump = false, prevFire = false;
// apăsările foarte scurte (sub un cadru) sunt reținute până la următorul update
const queued = { jump: false, fire: false };
let touchUI = matchMedia('(pointer: coarse)').matches;

const buttons = {
  left:  { x: 0, y: 0, r: 40 },
  right: { x: 0, y: 0, r: 40 },
  jump:  { x: 0, y: 0, r: 50 },
  fire:  { x: 0, y: 0, r: 36 },
  mute:  { x: 0, y: 0, r: 18 },
  pause: { x: 0, y: 0, r: 18 },
};
function layoutButtons() {
  const b = VIEW_H - 58 - safe.b;
  buttons.left.x = 62 + safe.l;   buttons.left.y = b;
  buttons.right.x = 160 + safe.l; buttons.right.y = b;
  buttons.jump.x = viewW - 76 - safe.r; buttons.jump.y = b - 6;
  buttons.fire.x = buttons.jump.x - 104; buttons.fire.y = b + 8;
  buttons.mute.x = viewW - 30 - safe.r; buttons.mute.y = 26 + safe.t;
  buttons.pause.x = viewW - 72 - safe.r; buttons.pause.y = 26 + safe.t;
}

function toLogical(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
}
function hitButton(btn, p, pad = 0) {
  const dx = p.x - btn.x, dy = p.y - btn.y, r = btn.r + pad;
  return dx * dx + dy * dy <= r * r;
}
// Zone generoase: toată partea stângă-jos e pentru mers, dreapta-jos pentru săritură.
function zoneFor(p) {
  if (p.y < VIEW_H * 0.35) return null;
  const mid = (buttons.left.x + buttons.right.x) / 2;
  if (p.x < mid) return 'left';
  if (p.x < buttons.right.x + 70) return 'right';
  if (p.x > viewW * 0.55) {
    // butonul de aruncat mici există doar cât timp Lumo are puterea
    if (canThrow()) {
      const dj = Math.hypot(p.x - buttons.jump.x, p.y - buttons.jump.y);
      const df = Math.hypot(p.x - buttons.fire.x, p.y - buttons.fire.y);
      if (df < dj) return 'fire';
    }
    return 'jump';
  }
  return null;
}
function refreshInput() {
  let l = keys.left, r = keys.right, j = keys.jump, f = keys.fire;
  for (const z of pointers.values()) {
    if (z === 'left') l = true; else if (z === 'right') r = true; else if (z === 'jump') j = true; else if (z === 'fire') f = true;
  }
  input.left = l; input.right = r; input.jump = j; input.fire = f;
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  Sound.unlock();
  if (e.pointerType === 'touch') touchUI = true;
  const p = toLogical(e);
  if (hitButton(buttons.mute, p, 8)) { Sound.toggle(); return; }
  if (game.state === 'playing' && hitButton(buttons.pause, p, 8)) { game.paused = !game.paused; return; }
  if (game.paused) { game.paused = false; return; }
  if (onMenuAction()) return;
  const z = zoneFor(p);
  if (z === 'jump' || z === 'fire') queued[z] = true;
  pointers.set(e.pointerId, z);
  refreshInput();
}, { passive: false });
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  e.preventDefault();
  pointers.set(e.pointerId, zoneFor(toLogical(e)));
  refreshInput();
}, { passive: false });
const endPointer = (e) => { pointers.delete(e.pointerId); refreshInput(); };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', endPointer);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump',
  KeyX: 'fire', KeyJ: 'fire', ShiftLeft: 'fire', ShiftRight: 'fire',
};
window.addEventListener('keydown', (e) => {
  Sound.unlock();
  const k = KEYMAP[e.code];
  if (k) {
    e.preventDefault();
    if (!e.repeat && k === 'jump' && onMenuAction()) return;
    if (!e.repeat && (k === 'jump' || k === 'fire')) queued[k] = true;
    keys[k] = true; refreshInput();
  } else if (e.code === 'Enter') {
    onMenuAction();
  } else if (e.code === 'KeyM') {
    Sound.toggle();
  } else if ((e.code === 'KeyP' || e.code === 'Escape') && game.state === 'playing') {
    game.paused = !game.paused;
  }
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) { keys[k] = false; refreshInput(); }
});
window.addEventListener('blur', () => {
  keys.left = keys.right = keys.jump = keys.fire = false; pointers.clear(); refreshInput();
});

// ---------------------------------------------------------------------------
// Starea jocului
// ---------------------------------------------------------------------------
const game = {
  state: 'start',      // start | playing | dying | clear | gameover | win
  paused: false,
  levelIndex: 0,
  score: 0,
  coins: 0,
  lives: 3,
  best: parseInt(load(STORAGE_BEST, '0'), 10) || 0,
  newBest: false,
  time: 0,
  timer: 0,            // cronometru pentru tranziții
  t: 0,                // timp global pentru animații
  shake: 0,
  fps: 0,
};

let level = null;     // nivelul curent (date runtime)
let player = null;
let camX = 0;

// Dimensiuni Lumo: mic / mare (după bere)
const SIZE_SMALL = { w: 20, h: 28 };
const SIZE_BIG = { w: 26, h: 42 };

function freshPlayer(x, y, big) {
  const sz = big ? SIZE_BIG : SIZE_SMALL;
  return {
    x, y: y + SIZE_SMALL.h - sz.h, w: sz.w, h: sz.h, vx: 0, vy: 0, big: !!big, growT: 0,
    power: null, throwCd: 0,
    onGround: false, facing: 1, coyote: 0, jumpBuf: 0, jumping: false,
    invuln: 0, walk: 0, squash: 0, dead: false,
  };
}

function setBig(p, big) {
  if (p.big === big) return;
  const sz = big ? SIZE_BIG : SIZE_SMALL;
  const cx = p.x + p.w / 2, bottom = p.y + p.h;
  p.big = big; p.w = sz.w; p.h = sz.h;
  p.x = cx - p.w / 2; p.y = bottom - p.h;
  p.growT = 0.6;
}

function buildLevel(index) {
  const def = LEVELS[index];
  const rows = def.map.map((r) => r.split(''));
  const width = rows[0].length;
  const lv = {
    def, theme: THEMES[def.theme], width, rows,
    coins: [], enemies: [], bonus: [], checkpoints: [],
    flag: null, start: { x: 64, y: 256 }, respawn: null,
    particles: [], popups: [], items: [], mici: [], canvas: null,
  };
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < width; x++) {
      const c = rows[y][x];
      const px = x * T, py = y * T;
      switch (c) {
        case 'o': lv.coins.push({ x: px + 8, y: py + 6, w: 16, h: 20, phase: x * 0.4 }); rows[y][x] = ' '; break;
        case 'e': lv.enemies.push(makeEnemy('walker', px + 4, py + 10)); rows[y][x] = ' '; break;
        case 'f': lv.enemies.push(makeEnemy('flyer', px + 4, py + 6)); rows[y][x] = ' '; break;
        case 'P': lv.start = { x: px + 6, y: py + 4 }; rows[y][x] = ' '; break;
        case 'K': lv.checkpoints.push({ x: px + 8, y: py - T, w: 16, h: T * 2, on: false }); rows[y][x] = ' '; break;
        case 'F': {
          let gy = y;
          while (gy < ROWS && !isSolid(rows[gy][x])) gy++;
          lv.flag = { x: px + 12, y: py, w: 8, h: gy * T - py, top: py, base: gy * T, drop: 0 };
          rows[y][x] = ' ';
          break;
        }
        case '?': lv.bonus.push({ tx: x, ty: y, used: false, bump: 0 }); break;
        case '*': lv.bonus.push({ tx: x, ty: y, used: false, bump: 0, item: 'beer' }); break;
        case '%': lv.bonus.push({ tx: x, ty: y, used: false, bump: 0, item: 'meat' }); break;
        default: break;
      }
    }
  }
  lv.respawn = { ...lv.start };
  renderLevelCanvas(lv);
  lv.bg = renderBackground(lv.theme);
  return lv;
}

function makeEnemy(type, x, y) {
  return type === 'walker'
    ? { type, x, y, w: 24, h: 22, vx: -55, vy: 0, alive: true, dead: null, deadT: 0, anim: Math.random() * 6 }
    : { type, x, y, w: 24, h: 20, vx: -60, vy: 0, baseY: y, alive: true, dead: null, deadT: 0, anim: Math.random() * 6, x0: x };
}

function startLevel(index, keepRespawn, big = false) {
  const prev = level;
  if (!keepRespawn || !prev || prev.def !== LEVELS[index]) {
    level = buildLevel(index);
  } else {
    // reîncercare după pierderea unei vieți: nivel proaspăt, dar păstrăm punctul de control
    const resp = prev.respawn;
    const cps = prev.checkpoints.map((c) => c.on);
    level = buildLevel(index);
    level.respawn = resp;
    level.checkpoints.forEach((c, i) => { c.on = cps[i]; });
  }
  game.levelIndex = index;
  game.time = level.def.time;
  player = freshPlayer(level.respawn.x, level.respawn.y, big);
  camX = clamp(player.x - viewW * 0.35, 0, Math.max(0, level.width * T - viewW));
  game.state = 'playing';
  game.paused = false;
}

function newGame() {
  game.score = 0; game.coins = 0; game.lives = 3; game.newBest = false;
  level = null;
  startLevel(0, false);
}

function onMenuAction() {
  if (game.state === 'start') { requestFullscreenLandscape(); newGame(); return true; }
  if ((game.state === 'gameover' || game.state === 'win') && game.timer <= 0) {
    game.state = 'start'; game.timer = 0.3; level = null; return true;
  }
  return false;
}

function requestFullscreenLandscape() {
  if (!touchUI) return;
  if (matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(el);
    if (p && p.then) {
      p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
        .catch(() => {});
    }
  } catch (e) { /* ignorat */ }
}

function addScore(n, x, y) {
  game.score += n;
  if (x !== undefined) level.popups.push({ x, y, text: '+' + n, life: 0.8 });
  if (game.score > game.best) { game.best = game.score; game.newBest = true; }
}

function saveBest() { save(STORAGE_BEST, game.best); }

// ---------------------------------------------------------------------------
// Dale & coliziuni
// ---------------------------------------------------------------------------
function isSolid(c) { return c === '#' || c === 'B' || c === '?' || c === '*' || c === '%' || c === 'W'; }
function tileAt(tx, ty) {
  if (tx < 0 || tx >= level.width) return '#';      // margini laterale solide
  if (ty < 0 || ty >= ROWS) return ' ';
  return level.rows[ty][tx];
}

function moveX(o, dt) {
  o.x += o.vx * dt;
  const top = Math.floor(o.y / T), bot = Math.floor((o.y + o.h - 0.01) / T);
  if (o.vx > 0) {
    const tx = Math.floor((o.x + o.w) / T);
    for (let ty = top; ty <= bot; ty++) if (isSolid(tileAt(tx, ty))) { o.x = tx * T - o.w; o.vx = 0; return true; }
  } else if (o.vx < 0) {
    const tx = Math.floor(o.x / T);
    for (let ty = top; ty <= bot; ty++) if (isSolid(tileAt(tx, ty))) { o.x = (tx + 1) * T; o.vx = 0; return true; }
  }
  return false;
}

// Returnează dala lovită cu capul (dacă există) pentru blocuri interactive.
function moveY(o, dt) {
  const prevBottom = o.y + o.h;
  o.y += o.vy * dt;
  o.onGround = false;
  const left = Math.floor(o.x / T), right = Math.floor((o.x + o.w - 0.01) / T);
  if (o.vy > 0) {
    const ty = Math.floor((o.y + o.h) / T);
    for (let tx = left; tx <= right; tx++) {
      const c = tileAt(tx, ty);
      if (isSolid(c) || (c === '-' && prevBottom <= ty * T + 0.5)) {
        o.y = ty * T - o.h; o.vy = 0; o.onGround = true; return null;
      }
    }
  } else if (o.vy < 0) {
    const ty = Math.floor(o.y / T);
    let hit = null, best = 1e9;
    const cx = o.x + o.w / 2;
    for (let tx = left; tx <= right; tx++) {
      if (isSolid(tileAt(tx, ty))) {
        const d = Math.abs(tx * T + T / 2 - cx);
        if (d < best) { best = d; hit = { tx, ty }; }
      }
    }
    if (hit) { o.y = (ty + 1) * T; o.vy = 0; return hit; }
  }
  return null;
}

function hitBlockFromBelow(tx, ty) {
  const c = tileAt(tx, ty);
  if (c === '?' || c === '*' || c === '%') {
    const b = level.bonus.find((q) => q.tx === tx && q.ty === ty);
    if (b && !b.used) {
      b.used = true; b.bump = 0.15;
      if (b.item) {
        // obiectul iese încet din bloc, apoi alunecă spre dreapta (carnea mai încet)
        level.items.push({ kind: b.item, x: tx * T + 6, y: ty * T, w: 20, h: 24, vx: 0, vy: 0, rise: 24, blockTop: ty * T, onGround: false });
        Sound.appear();
      } else {
        collectCoin(tx * T + T / 2, ty * T - 8, true);
        addScore(50);
      }
    } else Sound.bump();
  } else if (c === 'B' && !player.big) {
    // Lumo mic doar lovește cărămida; spargerea cere forma mare
    Sound.bump();
    for (let i = 0; i < 4; i++) {
      level.particles.push({ x: tx * T + 6 + i * 6, y: ty * T + T, vx: (i - 1.5) * 40, vy: -60, life: 0.3, size: 3, color: level.theme.brickDark });
    }
  } else if (c === 'B') {
    level.rows[ty][tx] = ' ';
    redrawTile(level, tx, ty);
    redrawTile(level, tx, ty + 1);
    for (let i = 0; i < 8; i++) {
      level.particles.push({
        x: tx * T + 8 + (i % 4) * 5, y: ty * T + 8 + (i >> 2) * 10,
        vx: (i % 4 - 1.5) * 70, vy: -260 - Math.random() * 140, life: 1, size: 7, color: level.theme.brick,
      });
    }
    addScore(20, tx * T + T / 2, ty * T);
    Sound.brick();
    game.shake = 0.08;
    // inamicii de deasupra blocului sunt aruncați
    for (const e of level.enemies) {
      if (e.alive && e.type === 'walker' && Math.abs(e.x + e.w / 2 - (tx * T + T / 2)) < T && Math.abs(e.y + e.h - ty * T) < 4) killEnemy(e, true);
    }
  } else {
    Sound.bump();
  }
}

function collectCoin(x, y, fromBlock) {
  game.coins++;
  Sound.coin();
  if (fromBlock) level.particles.push({ x: x - 8, y, vx: 0, vy: -380, life: 0.5, size: 0, coin: true, color: '#ffd23f' });
  else addScore(50, x, y);
  if (game.coins >= 50) { game.coins -= 50; game.lives++; Sound.oneUp(); level.popups.push({ x, y: y - 16, text: '+1 VIAȚĂ', life: 1.2 }); }
}

function killEnemy(e, flip) {
  e.alive = false;
  e.dead = flip ? 'flip' : 'squash';
  e.deadT = 0.5;
  e.vy = flip ? -350 : 0;
  addScore(100, e.x + e.w / 2, e.y);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  game.t += dt;
  if (game.timer > 0) game.timer -= dt;
  if (game.shake > 0) game.shake -= dt;

  const jumpEdge = (input.jump && !prevJump) || queued.jump;
  prevJump = input.jump;
  const fireEdge = (input.fire && !prevFire) || queued.fire;
  prevFire = input.fire;
  queued.jump = queued.fire = false;

  if (game.state === 'start' || game.state === 'gameover' || game.state === 'win') return;
  if (game.paused || isPortraitBlocked()) return;

  updateParticles(dt);

  if (game.state === 'dying') {
    player.vy += PHYS.gravity * 0.6 * dt;
    player.y += player.vy * dt;
    if (game.timer <= 0) afterDeath();
    return;
  }
  if (game.state === 'clear') {
    updateClear(dt);
    return;
  }

  // cronometru nivel
  game.time -= dt;
  if (game.time <= 0) { game.time = 0; loseLife(); return; }

  updatePlayer(dt, jumpEdge, fireEdge);
  updateMici(dt);
  updateEnemies(dt);
  updateItems(dt);
  updateCamera(dt);
}

function canThrow() {
  return !!player && player.power === 'mici' && game.state === 'playing';
}

function throwMici(p) {
  if (level.mici.length >= 2 || p.throwCd > 0) return;
  p.throwCd = 0.25;
  level.mici.push({
    x: p.facing > 0 ? p.x + p.w : p.x - 14, y: p.y + p.h * 0.4, w: 14, h: 8,
    vx: p.facing * 340 + p.vx * 0.3, vy: 80, onGround: false, life: 2.5, spin: 0,
  });
  Sound.sizzle();
}

function smoke(x, y) {
  for (let k = 0; k < 5; k++) {
    level.particles.push({ x: x + (k - 2) * 3, y, vx: (k - 2) * 30, vy: -120 - k * 20, life: 0.3, size: 4, color: 'rgba(230,230,230,0.8)' });
  }
}

// Mici aruncați: sar pe jos, se opresc în pereți, doboară inamicii.
function updateMici(dt) {
  const list = level.mici;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.life -= dt; m.spin += dt * 18 * Math.sign(m.vx);
    m.vy = Math.min(m.vy + PHYS.gravity * 0.75 * dt, PHYS.maxFall);
    const hitWall = moveX(m, dt);
    moveY(m, dt);
    if (m.onGround) m.vy = -300;
    let gone = hitWall || m.life <= 0 || m.y > VIEW_H + 20 || m.x < camX - 40 || m.x > camX + viewW + 40;
    if (!gone) {
      for (const e of level.enemies) {
        if (e.alive && overlap(m, e)) { killEnemy(e, true); Sound.stomp(); gone = true; break; }
      }
    }
    if (gone) { smoke(m.x + 7, m.y); list.splice(i, 1); }
  }
}

function updatePlayer(dt, jumpEdge, fireEdge) {
  const p = player;
  if (p.throwCd > 0) p.throwCd -= dt;
  if (fireEdge && p.power === 'mici') throwMici(p);
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const accel = p.onGround ? PHYS.accelGround : PHYS.accelAir;
  if (dir !== 0) {
    if (Math.sign(p.vx) !== dir && p.onGround) p.vx += dir * PHYS.friction * dt; // întoarcere rapidă
    p.vx += dir * accel * dt;
    p.facing = dir;
  } else if (p.onGround) {
    const f = PHYS.friction * dt;
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
  }
  p.vx = clamp(p.vx, -PHYS.maxSpeed, PHYS.maxSpeed);

  // săritură cu buffer + coyote time
  if (jumpEdge) p.jumpBuf = PHYS.jumpBuffer; else p.jumpBuf -= dt;
  if (p.onGround) p.coyote = PHYS.coyote; else p.coyote -= dt;
  if (p.jumpBuf > 0 && p.coyote > 0) {
    p.vy = -PHYS.jumpVel;
    p.jumping = true; p.jumpBuf = 0; p.coyote = 0; p.onGround = false;
    p.squash = -0.25;
    Sound.jump();
  }
  // înălțime variabilă: gravitație mai mică cât timp ții apăsat, tăiere la eliberare
  if (p.jumping && !input.jump && p.vy < 0) { p.vy *= 0.45; p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;
  const g = (p.jumping && input.jump && p.vy < 0) ? PHYS.gravityHold : PHYS.gravity;
  p.vy = Math.min(p.vy + g * dt, PHYS.maxFall);

  const wasGround = p.onGround;
  const vyBefore = p.vy;
  moveX(p, dt);
  const hit = moveY(p, dt);
  if (hit) hitBlockFromBelow(hit.tx, hit.ty);
  if (p.onGround && !wasGround && vyBefore > 300) p.squash = 0.3;
  p.squash *= Math.pow(0.0005, dt);
  if (p.onGround && Math.abs(p.vx) > 10) p.walk += Math.abs(p.vx) * dt * 0.06;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.growT > 0) p.growT -= dt;

  // țepi
  const sx0 = Math.floor((p.x + 3) / T), sx1 = Math.floor((p.x + p.w - 3) / T);
  const sy = Math.floor((p.y + p.h - 1) / T);
  for (let tx = sx0; tx <= sx1; tx++) {
    if (tileAt(tx, sy) === '^' && (p.y + p.h) > sy * T + 14 && p.invuln <= 0) { hurtPlayer(true); if (game.state !== 'playing') return; break; }
  }
  // căzut în prăpastie
  if (p.y > VIEW_H + 40) { loseLife(); return; }

  // puncte de control
  for (const c of level.checkpoints) {
    if (!c.on && p.x + p.w > c.x) {
      c.on = true;
      level.respawn = { x: c.x - 4, y: c.y + T + 4 };
      Sound.check();
      level.popups.push({ x: c.x + 8, y: c.y - 6, text: 'PUNCT DE CONTROL', life: 1.2 });
    }
  }
  // steag
  const fl = level.flag;
  if (fl && p.x + p.w > fl.x && p.x < fl.x + fl.w + 6) reachFlag();
}

function updateEnemies(dt) {
  const p = player;
  for (const e of level.enemies) {
    e.anim += dt;
    if (!e.alive) {
      if (e.dead === 'flip') { e.vy += PHYS.gravity * dt; e.y += e.vy * dt; } // aruncat
      else e.deadT -= dt;
      continue;
    }
    // activare doar în apropierea camerei (performanță + corectitudine)
    if (e.x > camX + viewW + 96 || e.x + e.w < camX - 200) continue;

    if (e.type === 'walker') {
      e.vy = Math.min(e.vy + PHYS.gravity * dt, PHYS.maxFall);
      const prevVx = e.vx;
      if (moveX(e, dt)) e.vx = -prevVx;
      moveY(e, dt);
      // se întoarce la marginea platformei (patrulare)
      if (e.onGround) {
        const aheadX = e.vx > 0 ? e.x + e.w + 1 : e.x - 1;
        const below = tileAt(Math.floor(aheadX / T), Math.floor((e.y + e.h + 2) / T));
        if (!isSolid(below) && below !== '-') e.vx = -e.vx;
      }
      if (e.y > VIEW_H + 40) { e.alive = false; e.dead = 'gone'; }
    } else {
      // zburător: patrulează orizontal pe ±3 dale, plutind
      e.x += e.vx * dt;
      if (e.x < e.x0 - T * 3 || e.x > e.x0 + T * 3) { e.vx = -e.vx; e.x = clamp(e.x, e.x0 - T * 3, e.x0 + T * 3); }
      e.y = e.baseY + Math.sin(e.anim * 2.6) * 14;
    }

    if (p.invuln <= 0 && overlap(p, e)) {
      const pBottom = p.y + p.h;
      if (p.vy > 40 && pBottom - e.y < 16) {
        killEnemy(e, false);
        p.vy = -(input.jump ? PHYS.stompBounce * 1.35 : PHYS.stompBounce);
        p.jumping = input.jump;
        p.y = e.y - p.h;
        Sound.stomp();
      } else {
        hurtPlayer(false);
        if (game.state !== 'playing') return;
      }
    }
  }
}

function updateItems(dt) {
  const p = player;
  for (let i = level.coins.length - 1; i >= 0; i--) {
    const c = level.coins[i];
    if (overlap(p, c)) {
      level.coins.splice(i, 1);
      collectCoin(c.x + 8, c.y);
      for (let k = 0; k < 6; k++) {
        level.particles.push({ x: c.x + 8, y: c.y + 10, vx: Math.cos(k) * 120, vy: Math.sin(k) * 120 - 60, life: 0.35, size: 3, color: '#fff3a0' });
      }
    }
  }
  for (const b of level.bonus) if (b.bump > 0) b.bump -= dt;
  const items = level.items;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.rise > 0) {
      const d = Math.min(it.rise, 40 * dt);
      it.rise -= d; it.y -= d;
      if (it.rise <= 0) it.vx = it.kind === 'meat' ? 55 : 85;
    } else {
      it.vy = Math.min(it.vy + PHYS.gravity * dt, PHYS.maxFall);
      const prevVx = it.vx;
      if (moveX(it, dt)) it.vx = -prevVx;
      moveY(it, dt);
    }
    if (it.y > VIEW_H + 40) { items.splice(i, 1); continue; }
    if (it.rise <= 0 && overlap(p, it)) {
      items.splice(i, 1);
      if (!p.big) { setBig(p, true); Sound.grow(); }
      else if (it.kind === 'meat' && p.power !== 'mici') { p.growT = 0.6; Sound.grow(); }
      else Sound.coin();
      if (it.kind === 'meat') p.power = 'mici';
      addScore(1000, it.x + 10, it.y);
      level.popups.push({ x: it.x + 10, y: it.y - 16, text: it.kind === 'meat' ? 'MICI LA GRĂTAR!' : 'NOROC!', life: 1.2 });
    }
  }
}

function updateParticles(dt) {
  const ps = level.particles;
  for (let i = ps.length - 1; i >= 0; i--) {
    const q = ps[i];
    q.life -= dt;
    if (q.life <= 0) { ps.splice(i, 1); continue; }
    q.vy += (q.coin ? 1400 : 1600) * dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
  }
  const pp = level.popups;
  for (let i = pp.length - 1; i >= 0; i--) {
    pp[i].life -= dt; pp[i].y -= 40 * dt;
    if (pp[i].life <= 0) pp.splice(i, 1);
  }
}

function updateCamera(dt) {
  const target = player.x + player.w / 2 - viewW * 0.4 + player.facing * 30;
  camX += (target - camX) * Math.min(1, dt * 6);
  camX = clamp(camX, 0, Math.max(0, level.width * T - viewW));
}

// Lovit: forma mare se micșorează (cu invulnerabilitate scurtă), forma mică pierde o viață.
function hurtPlayer(spikes) {
  const p = player;
  if (!p.big) { loseLife(); return; }
  setBig(p, false);
  p.power = null;
  p.invuln = 2;
  if (spikes) p.vy = -480;
  Sound.shrink();
  game.shake = 0.12;
}

function loseLife() {
  if (game.state !== 'playing') return;
  game.state = 'dying';
  game.timer = 1.4;
  game.lives--;
  player.dead = true;
  player.vy = -520;
  game.shake = 0.25;
  Sound.hurt();
}

function afterDeath() {
  if (game.lives <= 0) {
    game.state = 'gameover';
    game.timer = 0.8;
    saveBest();
    Sound.over();
  } else {
    startLevel(game.levelIndex, true);
  }
}

function reachFlag() {
  const fl = level.flag;
  game.state = 'clear';
  game.timer = 3.2;
  const h = clamp(1 - (player.y + player.h - fl.top) / fl.h, 0, 1);
  const bonus = Math.round(100 + h * 900) - (Math.round(100 + h * 900) % 50);
  addScore(bonus, fl.x, player.y - 10);
  player.x = fl.x - player.w + 4;
  player.vx = 0; player.vy = 0;
  level.timeBonusLeft = Math.ceil(game.time);
  Sound.flag();
}

function updateClear(dt) {
  const p = player, fl = level.flag;
  fl.drop = Math.min(1, fl.drop + dt * 1.2);
  if (p.y + p.h < fl.base) {
    p.y = Math.min(fl.base - p.h, p.y + 220 * dt);
  } else {
    p.onGround = true;
    p.facing = 1;
    p.x += 110 * dt;
    p.walk += 110 * dt * 0.06;
    p.y = fl.base - p.h;
  }
  // cronometrul rămas se transformă în puncte
  if (level.timeBonusLeft > 0) {
    const n = Math.min(level.timeBonusLeft, 5);
    level.timeBonusLeft -= n;
    game.time = Math.max(0, game.time - n);
    addScore(n * 10);
  }
  updateParticles(dt);
  updateCamera(dt);
  if (game.timer <= 0) {
    if (game.levelIndex + 1 < LEVELS.length) {
      level = null;
      const power = player.power;
      startLevel(game.levelIndex + 1, false, player.big);
      player.power = power;
    } else {
      game.state = 'win';
      game.timer = 0.8;
      saveBest();
    }
  }
}

function isPortraitBlocked() {
  return touchUI && cssH > cssW;
}

// ---------------------------------------------------------------------------
// Randare: dalele statice într-un canvas offscreen (o singură imagine / frame)
// ---------------------------------------------------------------------------
function renderLevelCanvas(lv) {
  const c = document.createElement('canvas');
  c.width = lv.width * T;
  c.height = VIEW_H;
  lv.canvas = c;
  lv.g = c.getContext('2d');
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < lv.width; x++) drawTile(lv, x, y);
}

function redrawTile(lv, tx, ty) {
  if (ty < 0 || ty >= ROWS) return;
  lv.g.clearRect(tx * T, ty * T, T, T);
  drawTile(lv, tx, ty);
}

function drawTile(lv, tx, ty) {
  const g = lv.g, th = lv.theme, c = lv.rows[ty][tx];
  const x = tx * T, y = ty * T;
  const at = (dx, dy) => {
    const xx = tx + dx, yy = ty + dy;
    if (yy < 0) return lv.rows[ty][tx];          // plafonul nu primește iarbă
    if (xx < 0 || xx >= lv.width || yy >= ROWS) return yy >= ROWS ? '#' : ' ';
    return lv.rows[yy][xx];
  };
  switch (c) {
    case '#': {
      g.fillStyle = th.ground; g.fillRect(x, y, T, T);
      g.fillStyle = th.groundDark;
      for (let i = 0; i < 5; i++) {
        const r = hash(tx, ty, i);
        g.fillRect(x + (r % 14) * 2, y + ((r >>> 5) % 14) * 2, 4, 2);
      }
      if (at(-1, 0) !== '#') g.fillRect(x, y, 2, T);
      if (at(1, 0) !== '#') g.fillRect(x + T - 2, y, 2, T);
      if (at(0, -1) !== '#') {
        g.fillStyle = th.grass; g.fillRect(x, y, T, 8);
        g.fillStyle = th.grassDark;
        g.fillRect(x, y + 8, T, 2);
        for (let i = 0; i < T; i += 4) if (hash(tx, i, 3) % 3 === 0) g.fillRect(x + i, y + 10, 4, 2);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, y, T, 2);
        decorate(lv, x, y, tx, ty, at);
      }
      break;
    }
    case 'B': {
      g.fillStyle = th.brickDark; g.fillRect(x, y, T, T);
      g.save(); g.beginPath(); g.rect(x, y, T, T); g.clip();
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 8 : 0;
        for (let bx = -off; bx < T; bx += 16) {
          g.fillStyle = th.brick; g.fillRect(x + bx + 1, y + r * 8 + 1, 14, 6);
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + bx + 1, y + r * 8 + 1, 14, 2);
        }
      }
      g.restore();
      break;
    }
    case 'W': {
      g.fillStyle = '#7a4a22'; g.fillRect(x, y, T, T);
      g.fillStyle = '#c88a48'; g.fillRect(x + 3, y + 3, T - 6, T - 6);
      g.fillStyle = '#9c6230';
      g.fillRect(x + 3, y + 14, T - 6, 4);
      g.save(); g.translate(x + T / 2, y + T / 2); g.rotate(Math.PI / 4);
      g.fillRect(-2, -18, 4, 36); g.restore();
      g.strokeStyle = '#5a3416'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, T - 2, T - 2);
      break;
    }
    case '-': {
      g.fillStyle = th.plankDark; g.fillRect(x, y + 2, T, 12);
      g.fillStyle = th.plank; g.fillRect(x, y, T, 10);
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y, T, 2);
      g.fillStyle = th.plankDark; g.fillRect(x + 6, y + 4, 2, 2); g.fillRect(x + 24, y + 4, 2, 2);
      break;
    }
    case '^': {
      g.fillStyle = '#9aa3b5';
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(x + i * 8, y + T); g.lineTo(x + i * 8 + 4, y + 12); g.lineTo(x + i * 8 + 8, y + T);
        g.fill();
      }
      g.fillStyle = '#e8edf5';
      for (let i = 0; i < 4; i++) g.fillRect(x + i * 8 + 3, y + 14, 2, 8);
      break;
    }
    default: break;
  }
}

function decorate(lv, x, y, tx, ty, at) {
  const g = lv.g, th = lv.theme, r = hash(tx, ty, 9);
  if (at(0, -1) !== ' ') return;
  if (th.deco === 'flowers' && r % 5 === 0) {
    const fx = x + 6 + (r >>> 4) % 18;
    g.fillStyle = '#2c9b3c'; g.fillRect(fx + 1, y - 6, 2, 6);
    g.fillStyle = ['#ff6b8a', '#ffe14d', '#ffffff', '#b38cff'][(r >>> 8) % 4];
    g.fillRect(fx - 1, y - 9, 6, 4); g.fillRect(fx + 1, y - 11, 2, 8);
    g.fillStyle = '#ffcc00'; g.fillRect(fx + 1, y - 8, 2, 2);
  } else if (th.deco === 'crystals' && r % 4 === 0) {
    const fx = x + 4 + (r >>> 4) % 20, h = 8 + (r >>> 9) % 10;
    g.fillStyle = (r >>> 7) % 2 ? '#5ae6d8' : '#c77dff';
    g.beginPath(); g.moveTo(fx, y); g.lineTo(fx + 3, y - h); g.lineTo(fx + 6, y); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(fx + 2, y - h + 4, 1, h - 5);
  } else if (th.deco === 'towers' && r % 6 === 0) {
    g.fillStyle = '#d6cdea'; g.fillRect(x + 10, y - 8, 12, 8);
    g.fillStyle = '#c98ad4'; g.fillRect(x + 12, y - 12, 8, 4);
  }
}

// Fundal: degradeu + două straturi de dealuri (paralaxă), pre-randate.
function renderBackground(th) {
  const W = 1024;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = VIEW_H; return c; };
  const sky = document.createElement('canvas'); sky.width = 4; sky.height = VIEW_H;
  const sg = sky.getContext('2d');
  const grad = sg.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, th.skyTop); grad.addColorStop(1, th.skyBot);
  sg.fillStyle = grad; sg.fillRect(0, 0, 4, VIEW_H);

  const far = mk(), near = mk();
  const fg = far.getContext('2d'), ng = near.getContext('2d');
  if (th.deco === 'crystals') {
    // stalactite & stalagmite
    fg.fillStyle = th.far;
    for (let i = 0; i < 24; i++) {
      const x = (i * 97) % W, w = 30 + (i * 37) % 50, h = 60 + (i * 53) % 120;
      fg.beginPath(); fg.moveTo(x, VIEW_H); fg.lineTo(x + w / 2, VIEW_H - h); fg.lineTo(x + w, VIEW_H); fg.fill();
      fg.beginPath(); fg.moveTo(x + 40, 0); fg.lineTo(x + 40 + w / 3, h * 0.7); fg.lineTo(x + 40 + w * 0.66, 0); fg.fill();
    }
    ng.fillStyle = th.near;
    for (let i = 0; i < 14; i++) {
      const x = (i * 151) % W, w = 50 + (i * 29) % 60, h = 90 + (i * 41) % 110;
      ng.beginPath(); ng.moveTo(x, VIEW_H); ng.lineTo(x + w / 2, VIEW_H - h); ng.lineTo(x + w, VIEW_H); ng.fill();
    }
    for (let i = 0; i < 40; i++) {
      ng.fillStyle = i % 2 ? 'rgba(90,230,216,0.5)' : 'rgba(199,125,255,0.5)';
      ng.fillRect((i * 211) % W, (i * 67) % (VIEW_H - 120), 2, 2);
    }
  } else {
    const hills = (g, color, base, amp, freq, phase) => {
      g.fillStyle = color;
      g.beginPath(); g.moveTo(0, VIEW_H);
      for (let x = 0; x <= W; x += 8) {
        const y = base - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.3) * amp * 0.25;
        g.lineTo(x, y);
      }
      g.lineTo(W, VIEW_H); g.fill();
    };
    // frecvențe multiple de 2π/W ca să se repete fără cusătură
    const f = (n) => (Math.PI * n) / W;
    hills(fg, th.far, VIEW_H - 120, 90, f(3), 0.3);
    hills(ng, th.near, VIEW_H - 70, 70, f(5), 1.1);
    if (th.deco === 'towers') {
      ng.fillStyle = th.near;
      for (let i = 0; i < 4; i++) {
        const x = 120 + i * 256;
        ng.fillRect(x, VIEW_H - 200, 26, 140);
        ng.beginPath(); ng.moveTo(x - 6, VIEW_H - 200); ng.lineTo(x + 13, VIEW_H - 240); ng.lineTo(x + 32, VIEW_H - 200); ng.fill();
      }
    }
  }
  return { sky, far, near, W };
}

// ---------------------------------------------------------------------------
// Randare: personaje
// ---------------------------------------------------------------------------
function drawLumo(g, p, t) {
  const cx = p.x + p.w / 2, by = p.y + p.h;
  const sq = p.squash;
  const sx = 1 + sq * 0.6, sy = 1 - sq * 0.6;
  const moving = p.onGround && Math.abs(p.vx) > 10;
  const step = moving ? Math.sin(p.walk * 2.2) : 0;
  const airborne = !p.onGround && !p.dead;

  g.save();
  g.translate(cx, by);
  // creștere/micșorare: clipește între cele două mărimi
  let k = p.big ? 1.5 : 1;
  if (p.growT > 0 && Math.floor(p.growT * 16) % 2) k = p.big ? 1 : 1.5;
  g.scale(p.facing * sx * k, sy * k);
  if (p.dead) g.rotate(Math.sin(t * 20) * 0.2);

  // fular (flutură în spate)
  const wave = Math.sin(t * 14) * 3;
  const chef = p.power === 'mici';      // cu puterea micilor fularul devine roșu
  g.fillStyle = chef ? '#d62828' : '#ff7a2e';
  g.beginPath();
  g.moveTo(-6, -16); g.lineTo(-17, -15 + wave); g.lineTo(-18, -10 + wave); g.lineTo(-6, -11);
  g.fill();

  // picioare
  g.fillStyle = '#1f7f78';
  const lf = airborne ? -3 : step * 3, rf = airborne ? 2 : -step * 3;
  g.fillRect(-8 + lf, -5, 7, 5);
  g.fillRect(1 + rf, -5, 7, 5);

  // corp
  g.fillStyle = '#1f7f78';
  g.beginPath(); g.ellipse(0, -15, 12, 13, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3fd6c6';
  g.beginPath(); g.ellipse(0, -15.5, 10.5, 11.5, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#9ff5ea';
  g.beginPath(); g.ellipse(2, -11, 6, 5, 0, 0, Math.PI * 2); g.fill();

  // fular (față)
  g.fillStyle = chef ? '#d62828' : '#ff7a2e'; g.fillRect(-9, -15, 18, 4);
  g.fillStyle = chef ? '#ff8a8a' : '#ffb36b'; g.fillRect(-9, -15, 18, 1);

  // ochi
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(4, -21, 4, 4.5, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(-3, -21, 3.2, 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#14202b';
  if (p.dead) {
    g.fillRect(2, -22, 5, 1.5); g.fillRect(-5, -22, 4, 1.5);
  } else {
    const blink = (Math.floor(t * 10) % 37) === 0;
    if (blink) { g.fillRect(2, -21, 5, 1.5); g.fillRect(-5, -21, 4, 1.5); }
    else { g.fillRect(5, -23, 2.5, 4); g.fillRect(-1.5, -23, 2, 4); }
  }

  // mlădiță pe cap
  const sway = Math.sin(t * 4 + p.walk) * 0.25 - p.vx / 900;
  g.save();
  g.translate(0, -28);
  g.rotate(sway);
  g.fillStyle = '#2e9e3a'; g.fillRect(-1, -6, 2, 6);
  g.fillStyle = '#6be36e';
  g.beginPath(); g.ellipse(4, -7, 5, 2.6, -0.5, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(-3.5, -5, 3.5, 2, 0.6, 0, Math.PI * 2); g.fill();
  g.restore();

  g.restore();
}

function drawEnemy(g, e, t) {
  if (!e.alive && (e.dead === 'gone' || (e.dead === 'squash' && e.deadT <= 0))) return;
  const cx = e.x + e.w / 2, by = e.y + e.h;
  g.save();
  g.translate(cx, by);
  const dir = e.vx > 0 ? 1 : -1;
  if (e.dead === 'squash') g.scale(1.3, 0.35);
  if (e.dead === 'flip') { g.translate(0, -e.h / 2); g.scale(1, -1); g.translate(0, e.h / 2); }
  g.scale(dir, 1);

  if (e.type === 'walker') {
    // Bumbo – cărăbuș roșu cu carapace
    const leg = Math.sin(e.anim * 14) * 2;
    g.fillStyle = '#2a1626';
    g.fillRect(-10 + leg, -4, 4, 4); g.fillRect(-2 - leg, -4, 4, 4); g.fillRect(6 + leg, -4, 4, 4);
    g.fillStyle = '#7a1630';
    g.beginPath(); g.ellipse(-1, -11, 13, 10, 0, Math.PI, 0); g.lineTo(12, -4); g.lineTo(-14, -4); g.fill();
    g.fillStyle = '#e8384f';
    g.beginPath(); g.ellipse(-2, -11, 11, 8.5, 0, Math.PI, 0); g.lineTo(9, -5); g.lineTo(-13, -5); g.fill();
    g.fillStyle = '#7a1630'; g.fillRect(-3, -19, 2, 14);
    g.fillStyle = '#ffd1d8'; g.fillRect(-9, -15, 3, 3); g.fillRect(3, -14, 3, 3);
    // cap
    g.fillStyle = '#2a1626';
    g.beginPath(); g.ellipse(10, -8, 6, 6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.fillRect(10, -11, 4, 4);
    g.fillStyle = '#000'; g.fillRect(12, -10, 2, 3);
    g.fillStyle = '#fff'; g.fillRect(8, -13, 6, 1.5); // sprânceană încruntată
    g.fillStyle = '#2a1626'; g.fillRect(12, -17, 1.5, 5); g.fillRect(14, -16, 1.5, 4);
  } else {
    // Zumzi – insectă zburătoare mov-galbenă
    const flap = Math.sin(t * 40) * 0.6;
    g.fillStyle = 'rgba(220,245,255,0.8)';
    g.save(); g.translate(-2, -16); g.rotate(-0.4 + flap);
    g.beginPath(); g.ellipse(0, -6, 4, 8, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.save(); g.translate(3, -16); g.rotate(0.3 - flap);
    g.beginPath(); g.ellipse(0, -6, 3.5, 7, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.fillStyle = '#5b2a86';
    g.beginPath(); g.ellipse(0, -9, 12, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffd23f'; g.fillRect(-6, -17, 4, 16); g.fillRect(1, -17, 3, 16);
    g.fillStyle = '#5b2a86'; g.beginPath(); g.moveTo(-12, -9); g.lineTo(-17, -7); g.lineTo(-11, -6); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(7, -11, 4, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#000'; g.fillRect(8, -12, 2.5, 3);
  }
  g.restore();
}

function drawCoin(g, x, y, t, phase) {
  const s = Math.abs(Math.cos(t * 3 + phase));
  const w = Math.max(2, 8 * s);
  g.fillStyle = '#b97800';
  g.beginPath(); g.ellipse(x + 8, y + 10, w, 10, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.ellipse(x + 8, y + 10, Math.max(1, w - 2), 8, 0, 0, Math.PI * 2); g.fill();
  if (s > 0.4) {
    g.fillStyle = '#fff6b0'; g.fillRect(x + 8 - w * 0.35, y + 5, Math.max(1, w * 0.3), 8);
  }
}

function drawBonus(g, b, th, t) {
  const x = b.tx * T, y = b.ty * T - (b.bump > 0 ? Math.sin((b.bump / 0.15) * Math.PI) * 8 : 0);
  if (b.used) {
    g.fillStyle = '#6e5a4a'; g.fillRect(x, y, T, T);
    g.fillStyle = '#8f7a66'; g.fillRect(x + 2, y + 2, T - 4, T - 4);
    g.fillStyle = '#5a4838';
    g.fillRect(x + 4, y + 4, 3, 3); g.fillRect(x + T - 7, y + 4, 3, 3);
    g.fillRect(x + 4, y + T - 7, 3, 3); g.fillRect(x + T - 7, y + T - 7, 3, 3);
    return;
  }
  const glow = 0.5 + Math.sin(t * 5 + b.tx) * 0.5;
  g.fillStyle = '#a8650a'; g.fillRect(x, y, T, T);
  g.fillStyle = '#ffbe2e'; g.fillRect(x + 2, y + 2, T - 4, T - 4);
  g.fillStyle = '#ffe28a'; g.fillRect(x + 2, y + 2, T - 4, 3);
  // gemă în centru
  g.fillStyle = `rgba(90,230,216,${0.75 + glow * 0.25})`;
  g.beginPath(); g.moveTo(x + 16, y + 7); g.lineTo(x + 24, y + 16); g.lineTo(x + 16, y + 25); g.lineTo(x + 8, y + 16); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x + 14, y + 11, 3, 5);
}

// Halbă de bere: sticlă, bere aurie cu bule, spumă albă, toartă.
function drawBeer(g, it, t) {
  const x = it.x, y = it.y;
  g.save();
  if (it.rise > 0) { g.beginPath(); g.rect(x - 8, y - 6, it.w + 16, it.blockTop - (y - 6)); g.clip(); }
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3;
  g.beginPath(); g.arc(x + 17, y + 13, 5, -Math.PI / 2, Math.PI / 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(x, y + 4, 16, 20);
  g.fillStyle = '#f2a516'; g.fillRect(x + 2, y + 7, 12, 15);
  g.fillStyle = '#ffd04a'; g.fillRect(x + 3, y + 8, 3, 13);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 3; i++) {
    const by = y + 20 - ((t * 18 + i * 5) % 12);
    g.fillRect(x + 6 + i * 3, by, 2, 2);
  }
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.ellipse(x + 4, y + 5, 5, 4, 0, 0, Math.PI * 2);
  g.ellipse(x + 10, y + 3, 5, 5, 0, 0, Math.PI * 2);
  g.ellipse(x + 15, y + 6, 3.5, 3.5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillRect(x, y + 5, 16, 3);
  g.restore();
}

// Bucată de carne (friptură cu os).
function drawMeat(g, it, t) {
  const x = it.x, y = it.y;
  g.save();
  if (it.rise > 0) { g.beginPath(); g.rect(x - 8, y - 6, it.w + 16, it.blockTop - (y - 6)); g.clip(); }
  g.fillStyle = '#f4efe6';
  g.fillRect(x + 13, y + 14, 9, 4);
  g.beginPath(); g.arc(x + 22, y + 14, 3, 0, Math.PI * 2); g.arc(x + 22, y + 18, 3, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fff3e0';
  g.beginPath(); g.ellipse(x + 9, y + 14, 11, 9, -0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#b5322b';
  g.beginPath(); g.ellipse(x + 9, y + 14, 9, 7, -0.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e0605a';
  g.beginPath(); g.ellipse(x + 6, y + 12, 4, 2.5, -0.2, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7a1d18'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(x + 3, y + 17); g.lineTo(x + 14, y + 11); g.moveTo(x + 5, y + 20); g.lineTo(x + 15, y + 15); g.stroke();
  g.restore();
}

// Un mic la grătar, rotindu-se în aer.
function drawMic(g, cx, cy, spin) {
  g.save();
  g.translate(cx, cy);
  g.rotate(spin);
  g.fillStyle = '#7a3e1d';
  g.beginPath();
  if (g.roundRect) g.roundRect(-7, -3.5, 14, 7, 3.5); else g.rect(-7, -3.5, 14, 7);
  g.fill();
  g.fillStyle = '#a65a2e'; g.fillRect(-5, -2.5, 10, 2);
  g.fillStyle = '#3d1d0c'; g.fillRect(-3, -3.5, 1.5, 7); g.fillRect(1.5, -3.5, 1.5, 7);
  g.restore();
}

function drawFlag(g, fl, t) {
  g.fillStyle = '#4a4a5a'; g.fillRect(fl.x + 2, fl.top, 4, fl.base - fl.top);
  g.fillStyle = '#ffd23f';
  g.beginPath(); g.arc(fl.x + 4, fl.top - 2, 6, 0, Math.PI * 2); g.fill();
  const fy = fl.top + 6 + fl.drop * (fl.base - fl.top - 40);
  g.fillStyle = '#3fd6c6';
  g.beginPath();
  g.moveTo(fl.x + 6, fy);
  for (let i = 0; i <= 6; i++) g.lineTo(fl.x + 6 + i * 6, fy + Math.sin(t * 8 + i) * 2 + i * 0.5);
  g.lineTo(fl.x + 6, fy + 24);
  g.fill();
  g.fillStyle = '#ff7a2e'; g.beginPath(); g.arc(fl.x + 20, fy + 11, 4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6e5a4a'; g.fillRect(fl.x - 6, fl.base - 8, 20, 8);
}

function drawCheckpoint(g, c, t) {
  g.fillStyle = '#5a4a3a'; g.fillRect(c.x + 6, c.y + 8, 4, c.h - 8);
  g.fillStyle = c.on ? '#4fd35c' : '#9aa3b5';
  const w = Math.sin(t * 6) * (c.on ? 2 : 0.5);
  g.beginPath(); g.moveTo(c.x + 10, c.y + 8); g.lineTo(c.x + 26, c.y + 14 + w); g.lineTo(c.x + 10, c.y + 20); g.fill();
}

// ---------------------------------------------------------------------------
// Randare: frame complet
// ---------------------------------------------------------------------------
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const k = scale * dpr;
  ctx.setTransform(k, 0, 0, k, 0, 0);

  if (!level) { drawMenuBackground(); drawOverlay(); return; }

  const th = level.theme, bg = level.bg;
  let shakeX = 0, shakeY = 0;
  if (game.shake > 0) { shakeX = (Math.random() - 0.5) * 6; shakeY = (Math.random() - 0.5) * 6; }
  // camera rotunjită la pixel fizic, ca să nu apară cusături
  const cam = Math.round(camX * k) / k;

  ctx.drawImage(bg.sky, 0, 0, 4, VIEW_H, 0, 0, viewW + 1, VIEW_H);
  drawParallax(bg.far, bg.W, cam * 0.2);
  if (th.deco !== 'crystals') drawClouds(cam, th);
  drawParallax(bg.near, bg.W, cam * 0.45);

  ctx.save();
  ctx.translate(-cam + shakeX, shakeY);

  // dale statice: o singură copiere din canvas-ul nivelului
  const sx = Math.max(0, Math.floor(cam));
  const sw = Math.min(level.canvas.width - sx, Math.ceil(viewW) + 2);
  if (sw > 0) ctx.drawImage(level.canvas, sx, 0, sw, VIEW_H, sx, 0, sw, VIEW_H);

  const t = game.t;
  const x0 = cam - T, x1 = cam + viewW + T;
  for (const b of level.bonus) if (b.tx * T > x0 && b.tx * T < x1) drawBonus(ctx, b, th, t);
  for (const c of level.checkpoints) if (c.x > x0 && c.x < x1) drawCheckpoint(ctx, c, t);
  if (level.flag && level.flag.x > x0 - 60 && level.flag.x < x1) drawFlag(ctx, level.flag, t);
  for (const c of level.coins) if (c.x > x0 && c.x < x1) drawCoin(ctx, c.x, c.y, t, c.phase);
  for (const e of level.enemies) if (e.x > x0 && e.x < x1 && e.y < VIEW_H + 40) drawEnemy(ctx, e, t);

  for (const it of level.items) if (it.x > x0 && it.x < x1) (it.kind === 'meat' ? drawMeat : drawBeer)(ctx, it, t);
  for (const m of level.mici) drawMic(ctx, m.x + m.w / 2, m.y + m.h / 2, m.spin);

  const p = player;
  if (!(p.invuln > 0 && Math.floor(t * 20) % 2)) drawLumo(ctx, p, t);

  for (const q of level.particles) {
    if (q.coin) drawCoin(ctx, q.x, q.y, t * 4, 0);
    else { ctx.fillStyle = q.color; ctx.fillRect(q.x, q.y, q.size, q.size); }
  }
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const pp of level.popups) {
    ctx.globalAlpha = Math.min(1, pp.life * 2);
    ctx.fillStyle = '#000'; ctx.fillText(pp.text, pp.x + 1, pp.y + 1);
    ctx.fillStyle = '#fff'; ctx.fillText(pp.text, pp.x, pp.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (th.deco === 'crystals') {
    // vignetă pentru peșteră
    const gr = ctx.createRadialGradient(viewW / 2, VIEW_H / 2, VIEW_H * 0.4, viewW / 2, VIEW_H / 2, viewW * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,0,30,0.45)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, viewW, VIEW_H);
  }

  drawHUD();
  if (touchUI && (game.state === 'playing' || game.state === 'dying')) drawTouchControls();
  drawOverlay();
}

function drawParallax(img, W, off) {
  let x = -(off % W);
  if (x > 0) x -= W;
  for (; x < viewW; x += W) ctx.drawImage(img, Math.round(x), 0);
}

function drawClouds(cam, th) {
  ctx.fillStyle = th.cloud;
  for (let i = 0; i < 7; i++) {
    const span = viewW + 300;
    let x = (i * 263 - cam * 0.3 + game.t * (6 + i)) % span;
    if (x < 0) x += span;
    x -= 150;
    const y = 30 + (i * 47) % 110, s = 0.7 + (i % 3) * 0.25;
    ctx.beginPath();
    ctx.ellipse(x, y, 34 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 20 * s, y + 4 * s, 20 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 18 * s, y - 6 * s, 20 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function text(str, x, y, size, color = '#fff', align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillText(str, x + 1.5, y + 1.5);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function drawHUD() {
  const l = 14 + safe.l, top = 20 + safe.t;
  // vieți
  for (let i = 0; i < Math.min(game.lives, 6); i++) drawHeart(l + 8 + i * 20, top, 1);
  if (game.lives > 6) text('x' + game.lives, l + 128, top, 14);
  // monede
  drawCoin(ctx, l, top + 14, 0, 0);
  text('× ' + game.coins, l + 22, top + 25, 15);
  if (player && player.power === 'mici') {
    drawMic(ctx, l + 82, top + 25, -0.3);
    text(touchUI ? 'MICI' : 'MICI (X)', l + 94, top + 25, 12, '#ffb36b');
  }
  // scor
  text('SCOR ' + String(game.score).padStart(6, '0'), viewW / 2, top - 2, 16, '#fff', 'center');
  text('RECORD ' + String(game.best).padStart(6, '0'), viewW / 2, top + 17, 11, '#ffe28a', 'center');
  // nivel + timp
  const rx = buttons.pause.x - 30;
  text(`${game.levelIndex + 1}-${level.def.name}`, rx, top - 2, 12, '#fff', 'right');
  text('⏱ ' + Math.ceil(game.time), rx, top + 17, 14, game.time < 30 ? '#ff6b6b' : '#fff', 'right');
  drawPauseButton();
  drawMuteButton();
}

function drawHeart(x, y, s) {
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath();
  ctx.moveTo(x, y + 6 * s);
  ctx.bezierCurveTo(x - 9 * s, y - 1 * s, x - 6 * s, y - 9 * s, x, y - 4 * s);
  ctx.bezierCurveTo(x + 6 * s, y - 9 * s, x + 9 * s, y - 1 * s, x, y + 6 * s);
  ctx.fill();
  ctx.fillStyle = '#ffb3c1'; ctx.fillRect(x - 5 * s, y - 4 * s, 2 * s, 2 * s);
}

function roundBtn(b, active) {
  ctx.fillStyle = active ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
}

function drawMuteButton() {
  const b = buttons.mute;
  roundBtn(b, false);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(b.x - 9, b.y - 4); ctx.lineTo(b.x - 4, b.y - 4); ctx.lineTo(b.x + 2, b.y - 9);
  ctx.lineTo(b.x + 2, b.y + 9); ctx.lineTo(b.x - 4, b.y + 4); ctx.lineTo(b.x - 9, b.y + 4);
  ctx.fill();
  ctx.strokeStyle = Sound.muted ? '#ff6b6b' : '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (Sound.muted) {
    ctx.moveTo(b.x + 5, b.y - 5); ctx.lineTo(b.x + 11, b.y + 5);
    ctx.moveTo(b.x + 11, b.y - 5); ctx.lineTo(b.x + 5, b.y + 5);
  } else {
    ctx.arc(b.x + 3, b.y, 5, -0.9, 0.9);
    ctx.moveTo(b.x + 7.5, b.y - 7.5); ctx.arc(b.x + 3, b.y, 9, -0.9, 0.9);
  }
  ctx.stroke();
}

function drawPauseButton() {
  const b = buttons.pause;
  roundBtn(b, game.paused);
  ctx.fillStyle = '#fff';
  if (game.paused) {
    ctx.beginPath(); ctx.moveTo(b.x - 4, b.y - 7); ctx.lineTo(b.x + 7, b.y); ctx.lineTo(b.x - 4, b.y + 7); ctx.fill();
  } else {
    ctx.fillRect(b.x - 6, b.y - 7, 4, 14); ctx.fillRect(b.x + 2, b.y - 7, 4, 14);
  }
}

function drawTouchControls() {
  const L = buttons.left, R = buttons.right, J = buttons.jump;
  roundBtn(L, input.left); roundBtn(R, input.right); roundBtn(J, input.jump);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const arrow = (b, d) => {
    ctx.beginPath();
    ctx.moveTo(b.x + d * 14, b.y); ctx.lineTo(b.x - d * 9, b.y - 15); ctx.lineTo(b.x - d * 9, b.y + 15);
    ctx.fill();
  };
  arrow(L, -1); arrow(R, 1);
  ctx.beginPath();
  ctx.moveTo(J.x, J.y - 18); ctx.lineTo(J.x + 16, J.y + 2); ctx.lineTo(J.x + 6, J.y + 2);
  ctx.lineTo(J.x + 6, J.y + 14); ctx.lineTo(J.x - 6, J.y + 14); ctx.lineTo(J.x - 6, J.y + 2);
  ctx.lineTo(J.x - 16, J.y + 2);
  ctx.fill();
  if (canThrow()) {
    const F = buttons.fire;
    roundBtn(F, input.fire);
    drawMic(ctx, F.x - 5, F.y - 6, -0.4);
    drawMic(ctx, F.x + 4, F.y + 6, -0.4);
  }
}

// fundal animat pentru meniu (fără nivel încărcat)
let menuBg = null;
function drawMenuBackground() {
  if (!menuBg) menuBg = renderBackground(THEMES.meadow);
  ctx.drawImage(menuBg.sky, 0, 0, 4, VIEW_H, 0, 0, viewW + 1, VIEW_H);
  const off = game.t * 30;
  drawParallax(menuBg.far, menuBg.W, off * 0.3);
  drawClouds(off, THEMES.meadow);
  drawParallax(menuBg.near, menuBg.W, off * 0.6);
  ctx.fillStyle = THEMES.meadow.ground; ctx.fillRect(0, VIEW_H - 64, viewW, 64);
  ctx.fillStyle = THEMES.meadow.grass; ctx.fillRect(0, VIEW_H - 64, viewW, 8);
  ctx.fillStyle = THEMES.meadow.grassDark; ctx.fillRect(0, VIEW_H - 56, viewW, 2);
}

function panel(w, h) {
  const x = viewW / 2 - w / 2, y = VIEW_H / 2 - h / 2;
  ctx.fillStyle = 'rgba(20,10,40,0.72)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 16); else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  return { x, y };
}

function drawOverlay() {
  const cx = viewW / 2, t = game.t;
  const prompt = touchUI ? 'Atinge ecranul' : 'Apasă SPAȚIU';
  const blink = Math.floor(t * 2) % 2 === 0;

  if (game.state === 'start') {
    // personaj animat pe ecranul de start
    const demo = { x: cx - 10, y: VIEW_H - 64 - 28 - Math.abs(Math.sin(t * 3)) * 40, w: 20, h: 28, vx: 0, facing: 1, onGround: false, squash: 0, walk: t * 4, dead: false };
    drawLumo(ctx, demo, t);
    text('LUMO', cx, 80, 64, '#3fd6c6', 'center', '900');
    text('Aventura Săritoare', cx, 128, 22, '#fff', 'center');
    text('RECORD: ' + game.best, cx, 162, 16, '#ffe28a', 'center');
    if (blink) text(prompt + ' pentru a începe', cx, 210, 18, '#fff', 'center');
    text(touchUI ? '◀ ▶ mers   •   ⤒ săritură (ține apăsat = mai sus)'
                 : '← → mers   •   SPAȚIU săritură   •   X aruncă mici   •   M sunet   •   P pauză', cx, VIEW_H - 22, 13, '#fff', 'center', '600');
    drawMuteButton();
    return;
  }
  if (game.paused) {
    panel(280, 120);
    text('PAUZĂ', cx, VIEW_H / 2 - 18, 30, '#fff', 'center');
    text(touchUI ? 'Atinge pentru a continua' : 'Apasă P pentru a continua', cx, VIEW_H / 2 + 22, 14, '#ddd', 'center', '600');
    return;
  }
  if (isPortraitBlocked()) return;
  if (game.state === 'clear') {
    text('NIVEL TERMINAT!', cx, 110, 32, '#ffe28a', 'center', '900');
    return;
  }
  if (game.state === 'gameover' || game.state === 'win') {
    const win = game.state === 'win';
    panel(360, 230);
    text(win ? 'AI CÂȘTIGAT!' : 'GAME OVER', cx, VIEW_H / 2 - 78, 36, win ? '#ffe28a' : '#ff6b6b', 'center', '900');
    if (win) text('Lumo a ajuns în Cetatea din Nori!', cx, VIEW_H / 2 - 44, 14, '#fff', 'center', '600');
    text('Scor: ' + game.score, cx, VIEW_H / 2 - 8, 22, '#fff', 'center');
    text('Record: ' + game.best, cx, VIEW_H / 2 + 22, 18, '#ffe28a', 'center');
    if (game.newBest) text('★ RECORD NOU! ★', cx, VIEW_H / 2 + 50, 16, '#57e3d6', 'center');
    if (game.timer <= 0 && blink) text(prompt + ' pentru meniu', cx, VIEW_H / 2 + 84, 15, '#fff', 'center', '600');
  }
}

// ---------------------------------------------------------------------------
// Bucla principală (pași fizici fixi de 1/120 s, independent de refresh rate)
// ---------------------------------------------------------------------------
const STEP = 1 / 120;
let last = 0, acc = 0, fpsFrames = 0, fpsTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const ms = now - (last || now);
  last = now;
  let dt = Math.min(ms / 1000, 0.1);
  fpsFrames++; fpsTime += ms;
  if (fpsTime >= 1000) { game.fps = Math.round((fpsFrames * 1000) / fpsTime); fpsFrames = 0; fpsTime = 0; }
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 12) { update(STEP); acc -= STEP; steps++; }
  if (steps === 12) acc = 0;
  syncMusic();
  render();
  if (showFps) text(game.fps + ' FPS', 8 + safe.l, VIEW_H - 12, 12, '#0f0', 'left');
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.state === 'playing') game.paused = true;
    if (Sound.ctx) Sound.ctx.suspend();
  } else if (Sound.ctx && game.state !== 'start') {
    Sound.ctx.resume();
  }
});

const showFps = /[?&]fps/.test(location.search);
// expus pentru teste automate / depanare
window.__lumo = { game, get player() { return player; }, get level() { return level; }, startLevel, LEVELS, Music, Sound, SONGS };

resize();
requestAnimationFrame(frame);
})();
