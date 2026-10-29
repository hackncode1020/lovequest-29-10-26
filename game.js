/* Love Quest 🎮❤️ — an 8-bit love game. Plain JS + canvas, no libraries.
   Made by @hack.n.code */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const DEMO = Q.get('demo') === '1';
const REC = Q.get('rec') === '1';
const LV = [
  { n: 'CITY NIGHTS', goal: 10, sp: 92, t: 'city', e: '🏙️' },
  { n: 'RAINY BRIDGE', goal: 8, sp: 100, t: 'rain', e: '💕' },
  { n: 'MOON ROOFTOP', goal: 6, sp: 104, t: 'roof', e: '🌙', boss: true }];
let lv = 0, GOAL = 10, total = 0, transT = 0, boss = null, propT = 0, yesT = 0, onPlat = null, dodges = 0, nameT = [], yesFx = false;
let maxLv = Math.max(0, Math.min(2, +(localStorage.getItem('lq_lv') || 0)));
const clean = n => (n || '').replace(/[<>]/g, '').trim().slice(0, 16);
let NAME = clean(Q.get('name')) || 'my love';

/* ---------- pixel sprites ---------- */
const PAL = { k:'#1b1030', h:'#3a2416', s:'#f5c39b', m:'#c2185b', r:'#e83a5f', w:'#ffffff', b:'#3b4bd8',
  H:'#6b2e1a', d:'#ff6fa8', g:'#6d6890', G:'#433f5e', c:'#5ef2ff', p:'#ff4f8b', P:'#ff9cc2', y:'#ffd34e', R:'#b0143f' };
const BOY_TOP = ['...kkkkkk...','..khhhhhhk..','.khhhhhhhhk.','.khssssssk..','.kssksskssk.','.kssssssssk.',
  '..ksssmssk..','...kssssk...','..krrrrrrk..','.ksrrrrrrsk.','.ksrrwrrrsk.','..krrrrrrk..','..kbbbbbbk..'];
const BOY_A = BOY_TOP.concat(['..kbbkkbbk..','.kbbk..kbbk.','.kkk....kkk.']);
const BOY_B = BOY_TOP.concat(['...kbbbbk...','...kbbkbk...','...kkkkkk...']);
const BOY_J = BOY_TOP.concat(['..kbbkkbbk..','..kbk..kbk..','..kk....kk..']);
const GIRL_TOP = ['...kkkkkk.r.','..kHHHHHHkrr','.kHHHHHHHHk.','.kHssssssHk.','.kHskssksHk.','.kHssssssHk.',
  '.kHssmmssHk.','.kHHssssHHk.','.kHkddddkHk.','..kddddddk..','.ksddwdddsk.','..kddddddk..','.kddddddddk.','kddddddddddk'];
const GIRL_A = GIRL_TOP.concat(['...ks..sk...','...kk..kk...']);
const GIRL_B = GIRL_TOP.concat(['....ksks....','....kkkk....']);
const BOY_K = ['............','............','............'].concat(BOY_TOP.slice(0,12)).concat(['..kbbbbbbbbk']);
const RINGC = ['.kkkkk.','kRrrrRk','kRRRRRk','kkkkkkk'];
const RINGO = ['..kyk..','.ky.yk.','..kck..','kkkkkkk','kRrrrRk','kkkkkkk'];
const MH = ['p.p','ppp','.p.'];
const HEART = ['.pp.pp.','pwpppPp','ppppppp','.ppppp.','..ppp..','...p...'];
const BIG = ['..kkk...kkk..','.kpppk.kpppk.','kpwwppkpppppk','kpwppppppppPk','kpppppppppPPk','.kpppppppPPk.',
  '..kpppppPPk..','...kppppPk...','....kpppk....','.....kpk.....','......k......'];
const CLOUD = ['...kkkk..kk...','.kkggggkkggk..','kggggggggggggk','kggrrggkrrgggk','kgrrrrgkrrrrgk',
  'kggrrrgkrrrggk','.kggrrgkrrggk.','..kkkkkkkkkk..'];
function mk(rows) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
const SP = { boyA: mk(BOY_A), boyB: mk(BOY_B), boyJ: mk(BOY_J), girlA: mk(GIRL_A), girlB: mk(GIRL_B), heart: mk(HEART), cloud: mk(CLOUD), boyK: mk(BOY_K), ringC: mk(RINGC), ringO: mk(RINGO), mh: mk(MH), mhy: mk(MH.map(r=>r.replace(/p/g,'y'))), mhw: mk(MH.map(r=>r.replace(/p/g,'P'))), sign: mk(HEART.map(r => r.replace(/[pPw]/g, 'c'))) };

/* ---------- seeded rng ---------- */
function rngF(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = rngF(DEMO || REC ? 2910 : Date.now());

/* ---------- canvas ---------- */
const cv = $('game'), ctx = cv.getContext('2d');
const lo = document.createElement('canvas'), g = lo.getContext('2d');
let W = 144, H = 240, S = 3, GY = 210, sky, city = null, stars = [];
function resize() {
  const r = $('stage').getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const ph = Math.max(200, r.height * dpr), pw = Math.max(200, r.width * dpr);
  S = Math.max(2, Math.round(ph / 236));
  H = Math.ceil(ph / S); W = Math.ceil(pw / S);
  lo.width = W; lo.height = H; cv.width = W * S; cv.height = H * S;
  g.imageSmoothingEnabled = false; ctx.imageSmoothingEnabled = false;
  GY = H - 30;
  sky = g.createLinearGradient(0, 0, 0, GY);
  sky.addColorStop(0, '#0b0628'); sky.addColorStop(0.55, '#2a1258'); sky.addColorStop(1, '#5a1f6e');
  buildCity();
}
function buildCity() {
  const r = rngF(77);
  stars = Array.from({ length: Math.round(W * H / 420) }, () => ({ x: r() * W | 0, y: r() * GY * 0.7 | 0, p: r() * 6.28, b: r() < 0.18 }));
  const far = [], near = [];
  for (let x = 0; x < 260;) { const w = 9 + r() * 14 | 0; far.push({ x, w, h: 34 + r() * 48 | 0 }); x += w + 1; }
  for (let x = 0; x < 300;) {
    const w = 14 + r() * 18 | 0, h = 22 + r() * 46 | 0, win = [];
    for (let yy = 4; yy < h - 3; yy += 4) for (let xx = 3; xx < w - 3; xx += 4) win.push([xx, yy, r() < 0.45 ? (r() < 0.25 ? 2 : 1) : 0]);
    near.push({ x, w, h, win, sign: r() < 0.22 }); x += w + 2 + (r() * 6 | 0);
  }
  city = { far, near };
}

/* ---------- state ---------- */
const V0 = 232, GRAV = 760, BASE_SPEED = 92;
let state = 'title', scroll = 0, speed = 32, T = 0, playT = 0, winT = 0, anim = 0;
let B, girl, objs, parts, pops, hearts, score, gap, nextType, sinceCloud, shake, flashA, fireT, letterShown, bigS, flyers, hitCount;
let jumpsN = 0;
let hi = +(localStorage.getItem('lq_hi') || 0);
const keys = { l: false, r: false };
function reset() {
  B = { x: Math.round(W * 0.24), y: 0, vy: 0, ground: true, jumps: 0, inv: 0 };
  girl = { x: W + 20, on: false, walk: 0 };
  objs = []; parts = []; pops = []; flyers = [];
  hearts = 0; score = 0; gap = 34; nextType = 'heart'; sinceCloud = 0; shake = 0; flashA = 0; fireT = 0;
  letterShown = false; bigS = 0; winT = 0; playT = 0; hitCount = 0; onPlat = null; boss = null; total = 0; lv = 0; GOAL = LV[0].goal; nameT = []; dodges = 0;
  if (DEMO || REC) rnd = rngF(2910);
  hud();
}
const pad6 = n => String(Math.max(0, n | 0)).padStart(6, '0');
function hud() {
  $('hc').textContent = hearts; if ($('hg')) $('hg').textContent = LV[lv].goal; if ($('lvl')) $('lvl').textContent = 'LV ' + (lv + 1); $('sc').textContent = pad6(score); $('hs').textContent = pad6(hi);
  const p = Math.min(100, hearts / LV[lv].goal * 100); $('fill').style.width = p + '%'; $('pct').textContent = Math.round(p) + '%';
}

/* ---------- audio: tiny WebAudio chiptune ---------- */
const AU = { c: null, m: null, on: localStorage.getItem('lq_music') !== '0', t: 0, step: 0, iv: 0 };
function auInit() {
  if (REC || AU.c) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { AU.c = new AC(); AU.m = AU.c.createGain(); AU.m.gain.value = 0.14; AU.m.connect(AU.c.destination); } catch (e) { AU.c = null; }
}
function tone(f, t, d, type, v) {
  if (!AU.c) return;
  const o = AU.c.createOscillator(), gn = AU.c.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  gn.gain.setValueAtTime(v || 0.4, t); gn.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(gn); gn.connect(AU.m); o.start(t); o.stop(t + d + 0.03);
}
const mf = n => 440 * Math.pow(2, (n - 69) / 12);
const CH = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
const MEL = [76, 0, 79, 76, 74, 72, 74, 76, 72, 0, 76, 72, 69, 0, 72, 74, 77, 0, 76, 74, 72, 0, 69, 72, 74, 0, 71, 72, 74, 76, 79, 0];
function sched() {
  if (!AU.c || !AU.on) return;
  const st = 60 / 150 / 2;
  while (AU.t < AU.c.currentTime + 0.25) {
    const s = AU.step, ch = CH[Math.floor(s / 8) % 4], t = AU.t;
    tone(mf(ch[s % 4] + 12), t, st * 0.9, 'square', 0.12);
    if (s % 2 === 0) tone(mf(ch[0] - 12), t, st * 1.8, 'triangle', 0.5);
    const mn = MEL[s % 32]; if (mn) tone(mf(mn), t, st * 1.6, 'square', 0.2);
    if (s % 4 === 2) tone(90, t, 0.05, 'square', 0.15);
    AU.step++; AU.t += st;
  }
}
function musicStart() { auInit(); if (!AU.c || !AU.on) return; if (AU.c.state === 'suspended') AU.c.resume(); AU.t = AU.c.currentTime + 0.05; clearInterval(AU.iv); AU.iv = setInterval(sched, 60); }
function musicStop() { clearInterval(AU.iv); }
function sfx(kind) {
  if (!AU.c || !AU.on) return; const t = AU.c.currentTime;
  if (kind === 'jump') { tone(520, t, 0.09, 'square', 0.25); tone(780, t + 0.05, 0.08, 'square', 0.2); }
  if (kind === 'heart') { tone(988, t, 0.07, 'square', 0.3); tone(1319, t + 0.06, 0.12, 'square', 0.3); }
  if (kind === 'hit') { tone(180, t, 0.25, 'sawtooth', 0.35); tone(120, t + 0.1, 0.3, 'sawtooth', 0.3); }
  if (kind === 'win') [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(mf(n), t + i * 0.11, 0.22, 'square', 0.28));
  if (kind === 'boom') tone(70 + Math.random() * 40, t, 0.3, 'triangle', 0.4);
}
function setMusic(on) {
  AU.on = on; localStorage.setItem('lq_music', on ? '1' : '0');
  $('music').classList.toggle('off', !on); $('music').textContent = on ? '♪' : '♪';
  if (on && state !== 'title') musicStart(); else if (!on) musicStop();
}

/* ---------- levels ---------- */
function beginLevel(L, first) {
  lv = L; GOAL = LV[L].goal; hearts = 0; state = 'play'; speed = LV[L].sp; gap = 40; sinceCloud = 0; nextType = 'heart'; onPlat = null;
  objs = []; boss = null;
  if (LV[L].boss) boss = { x: W * 0.78, y: GY - 62, hp: LV[L].goal, max: LV[L].goal, hitT: 0, t: 0, dead: 0, shots: 1.2 };
  pop(W / 2, H * 0.33, LV[L].boss ? 'BEAT THE HEARTBREAK!' : 'LEVEL ' + (L + 1) + ' · GO!', '#ffd34e', 1.4, LV[L].boss ? 6 : 9);
  hud();
}
function levelDone() {
  state = 'trans'; transT = 0; sfx('win');
  objs.forEach(o => { if (o.alive) burst(o.x, GY - (o.h || 7), 6, ['#ff9cc2', '#fff'], 25, 0.5, 10); o.alive = false; });
  maxLv = Math.max(maxLv, lv + 1); localStorage.setItem('lq_lv', maxLv); lvButtons();
  const c = $('lvcard'); c.querySelector('b').textContent = 'LEVEL ' + (lv + 2) + ' ' + LV[lv + 1].e;
  c.querySelector('i').textContent = LV[lv + 1].n; c.querySelector('u').textContent = 'LEVEL ' + (lv + 1) + ' CLEAR ✓';
  c.classList.add('show');
}
function lvButtons() {
  document.querySelectorAll('.lvb').forEach((b, i) => { const ok = DEMO || i <= maxLv; b.disabled = !ok; b.textContent = ok ? 'LV' + (i + 1) + ' ' + LV[i].e : 'LV' + (i + 1) + ' 🔒'; });
}
function bossHitBy(o) {
  if (!boss) return;
  flyers2.push({ x: o.x, y: GY - o.h, t: 0 });
}
let flyers2 = [];
/* ---------- proposal ending ---------- */
function propose() {
  if (state === 'propose' || state === 'yes') return;
  $('letter').classList.remove('show', 'open'); closeCard(); $('banner').classList.remove('show');
  state = 'propose'; propT = 0; dodges = 0;
  const no = $('pno'); no.style.left = ''; no.style.top = ''; no.style.position = ''; no.textContent = 'NO';
  $('pyes').style.transform = '';
}
function showProp() { const p = $('prop'); p.classList.add('show'); p.classList.remove('yes'); }
function hideProp() { $('prop').classList.remove('show', 'yes', 'end'); }
const NOS = ['NO', 'NOPE 🙈', 'TRY AGAIN', 'NOT AN OPTION', 'NICE TRY 😜', 'NO WAY', 'CATCH ME'];
function dodge(e) {
  if (e) e.preventDefault();
  if (state !== 'propose') return;
  const box = $('prop').querySelector('.pbtns').getBoundingClientRect(), no = $('pno');
  dodges++;
  const bw = no.offsetWidth, bh = no.offsetHeight, pr = $('prop').getBoundingClientRect();
  const yb = $('pyes').getBoundingClientRect();
  let x, y, tries = 0;
  do {
    x = 8 + rnd() * Math.max(10, pr.width - bw - 16); y = (box.top - pr.top) - 60 + rnd() * 170; tries++;
    y = Math.max(pr.height * 0.42, Math.min(Math.min(pr.height, innerHeight - pr.top) - bh - 10, y));
  } while (tries < 20 && x + pr.left < yb.right + 12 && x + pr.left + bw > yb.left - 12 && y + pr.top < yb.bottom + 12 && y + pr.top + bh > yb.top - 12);
  no.style.position = 'absolute'; no.style.left = x + 'px'; no.style.top = y + 'px';
  no.textContent = NOS[dodges % NOS.length];
  $('pyes').style.transform = 'scale(' + Math.min(1.5, 1 + dodges * 0.1) + ')';
  sfx('jump');
}
function yes() {
  if (state !== 'propose') return;
  state = 'yes'; yesT = 0; flashA = 0.9; sfx('win');
  $('prop').classList.add('yes');
  // hearts spelling the name
  const c = document.createElement('canvas'), x = c.getContext('2d');
  const txt = NAME.toUpperCase(); let fs = 30;
  c.width = W; c.height = 60;
  for (; fs > 8; fs--) { x.font = 'bold ' + fs + 'px "Press Start 2P", monospace'; if (x.measureText(txt).width < W * 0.86) break; }
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, 30);
  const d = x.getImageData(0, 0, W, 60).data, step = fs > 16 ? 4 : 3, cy = Math.round(H * 0.2);
  nameT = [];
  for (let yy = 0; yy < 60; yy += step) for (let xx = 0; xx < W; xx += step) if (d[(yy * W + xx) * 4 + 3] > 120) nameT.push({ tx: xx, ty: cy + yy - 30, sx: rnd() * W, sy: H + 10 + rnd() * 40, d: rnd() * 0.9, c: rnd() < 0.15 ? 'y' : rnd() < 0.3 ? 'w' : 'p' });
  for (let i = 0; i < 4; i++) firework();
}
function yesEnd() { $('prop').classList.add('end'); }

/* ---------- game actions ---------- */
function start(L) {
  if (typeof L !== 'number') L = 0;
  const v = clean($('name').value); NAME = v || NAME || 'my love'; $('name').value = NAME === 'my love' ? '' : NAME;
  setNames();
  $('start').classList.remove('show');
  reset(); hideProp(); beginLevel(L, true);
  if (AU.on) musicStart();
}
function setNames() { $('bname').textContent = NAME; document.querySelectorAll('.nm').forEach(e => e.textContent = NAME); }
function jump() {
  if (state !== 'play') return;
  jumpsN++;
  if (B.ground) { B.vy = V0; B.ground = false; B.jumps = 1; sfx('jump'); dust(B.x, GY); }
  else if (B.jumps < 2) { B.vy = V0 * 0.86; B.jumps = 2; sfx('jump'); }
}
function pop(x, y, text, c, life, size) { pops.push({ x, y, text, c, t: 0, life: life || 0.8, size: size || 7 }); }
function burst(x, y, n, colors, spd, life, grav) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.283, s = spd * (0.35 + rnd() * 0.65);
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: life * (0.6 + rnd() * 0.4), c: colors[i % colors.length], g: grav });
  }
}
function dust(x, y) { burst(x, y - 1, 5, ['#9d8fd0', '#c9bff0'], 22, 0.35, 40); }
function firework() {
  const x = W * (0.12 + rnd() * 0.76), y = H * (0.12 + rnd() * 0.3);
  const sets = [['#ff4f8b', '#ff9cc2', '#fff'], ['#ffd34e', '#fff3b0', '#ff8a3d'], ['#5ef2ff', '#b8f8ff', '#fff'], ['#b98cff', '#ff9cc2', '#fff']];
  burst(x, y, 34, sets[(rnd() * 4) | 0], 52, 1.25, 26); sfx('boom');
}
function collect(o) {
  o.alive = false; hearts++; score += 100; sfx('heart');
  burst(o.x, GY - o.h, 12, ['#ff4f8b', '#ff9cc2', '#fff'], 40, 0.5, 20);
  pop(o.x, GY - o.h - 8, '+100', '#ff9cc2');
  total++; hud();
  if (LV[lv].boss) { bossHitBy(o); return; }
  if (hearts >= GOAL) { if (lv < LV.length - 1) levelDone(); else win(); }
}
function hit(o) {
  if (B.inv > 0) return;
  B.inv = 1.3; hitCount++; shake = 0.3; sfx('hit');
  if (hearts > 0) { hearts--; score = Math.max(0, score - 50); pop(B.x, GY - B.y - 22, '-1 ❤', '#9fb0ff'); }
  else pop(B.x, GY - B.y - 22, 'OUCH', '#9fb0ff');
  burst(o.x, GY - 7, 10, ['#6d6890', '#9fb0ff'], 30, 0.5, 30);
  hud();
}
function win() {
  state = 'win'; winT = 0; boss = null; onPlat = null; maxLv = 2; localStorage.setItem('lq_lv', 2); lvButtons();
  objs.forEach(o => { if (o.alive && o.type === 'cloud') burst(o.x, GY - 7, 8, ['#6d6890', '#fff'], 25, 0.5, 10); o.alive = false; });
  const bonus = Math.max(0, Math.round((32 - playT) * 40)) + (hitCount === 0 ? 500 : 0);
  score += bonus; hud();
  if (bonus) pop(W / 2, H * 0.3, 'BONUS +' + bonus, '#5ef2ff', 1.2, 8);
  if (score > hi) { hi = score; localStorage.setItem('lq_hi', hi); $('newhi').classList.add('show'); } else $('newhi').classList.remove('show');
  $('fs').textContent = score; hud();
}
function openLetter() { if (letterShown) return; letterShown = true; setNames(); const L = $('letter'); L.classList.add('show'); requestAnimationFrame(() => requestAnimationFrame(() => L.classList.add('open'))); }
function again() {
  $('letter').classList.remove('show', 'open'); $('banner').classList.remove('show'); closeCard(); hideProp(); start(0);
}
function shareUrl() { return location.origin + location.pathname + '?name=' + encodeURIComponent(NAME); }
function share() {
  const msg = 'Player 2 has joined your life ❤️ ' + NAME + '\nI made you a game 🎮 Play Love Quest: ' + shareUrl();
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
}

/* ---------- download card ---------- */
function makeCard() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  const gr = x.createLinearGradient(0, 0, 0, 1350); gr.addColorStop(0, '#0b0628'); gr.addColorStop(0.6, '#2a1258'); gr.addColorStop(1, '#5a1f6e');
  x.fillStyle = gr; x.fillRect(0, 0, 1080, 1350);
  const r = rngF(11);
  for (let i = 0; i < 120; i++) { x.fillStyle = r() < 0.2 ? '#ffd34e' : '#ffffff'; x.globalAlpha = 0.4 + r() * 0.6; const s = r() < 0.2 ? 9 : 6; x.fillRect(r() * 1080 | 0, r() * 900 | 0, s, s); }
  x.globalAlpha = 1;
  for (let bx = 0; bx < 1080;) { const w = 60 + r() * 90 | 0, h = 120 + r() * 230 | 0; x.fillStyle = '#1c103f'; x.fillRect(bx, 1180 - h, w, h);
    for (let yy = 1180 - h + 18; yy < 1160; yy += 30) for (let xx = bx + 14; xx < bx + w - 14; xx += 24) if (r() < 0.45) { x.fillStyle = r() < 0.3 ? '#ff9cc2' : '#ffd34e'; x.fillRect(xx, yy, 10, 12); }
    bx += w + 8; }
  x.fillStyle = '#2b1658'; x.fillRect(0, 1180, 1080, 170); x.fillStyle = '#ff4f8b'; x.fillRect(0, 1180, 1080, 10);
  const glow = x.createRadialGradient(540, 640, 30, 540, 640, 420); glow.addColorStop(0, 'rgba(255,79,139,.55)'); glow.addColorStop(1, 'rgba(255,79,139,0)');
  x.fillStyle = glow; x.fillRect(0, 200, 1080, 900);
  x.drawImage(mk(BIG), 540 - 13 * 30 / 2, 640 - 11 * 30 / 2, 13 * 30, 11 * 30);
  x.drawImage(SP.boyA, 330, 1020, 12 * 10, 16 * 10);
  x.save(); x.scale(-1, 1); x.drawImage(SP.girlA, -750, 1020, 12 * 10, 16 * 10); x.restore();
  x.drawImage(SP.heart, 512, 1050, 56, 48);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '54px "Press Start 2P", monospace'; x.fillStyle = '#5a3a00'; x.fillText('LOVE QUEST', 546, 136); x.fillStyle = '#ffd34e'; x.fillText('LOVE QUEST', 540, 130);
  x.font = '34px "Press Start 2P", monospace'; x.fillStyle = '#ffffff';
  x.fillText('You completed', 540, 250); x.fillText('my heart \u{1F496}', 540, 310);
  x.font = '78px VT323, monospace'; x.fillStyle = '#ff9cc2'; x.fillText('Player 2: ' + NAME + ' \u2764\uFE0F', 540, 900);
  x.font = '26px "Press Start 2P", monospace'; x.fillStyle = '#5ef2ff'; x.fillText('LEVEL COMPLETE  ·  SCORE ' + score, 540, 975);
  x.font = '44px VT323, monospace'; x.fillStyle = '#d9ccff'; x.fillText('Made by @hack.n.code', 540, 1290);
  return c.toDataURL('image/png');
}
function openCard() {
  const url = makeCard(); $('cardimg').src = url; $('dla').href = url;
  $('modal').classList.add('show');
}
function closeCard() { $('modal').classList.remove('show'); }

/* ---------- demo autopilot ---------- */
function bot() {
  if (!B.ground) return;
  if (state !== 'play') return;
  for (const o of objs) {
    if (!o.alive || o.bot) continue;
    const dx = o.x - B.x; if (dx < -4) continue;
    const ttr = dx / Math.max(1, speed);
    if (o.type === 'cloud') { if (ttr <= 0.3) { jump(); o.bot = true; } return; }
    if (o.type === 'plat') { o.bot = true; continue; }
    if (o.h > 14) { const need = o.h - 8, tH = (V0 - Math.sqrt(V0 * V0 - 2 * GRAV * need)) / GRAV; if (ttr <= tH + 0.01) { jump(); o.bot = true; } return; }
    o.bot = true;
  }
}

/* ---------- update ---------- */
function spawn() {
  const type = nextType, th = LV[lv].t;
  if (type === 'cloud') { objs.push({ type, x: W + 10, h: 7, alive: true, ph: rnd() * 6 }); sinceCloud = 0; }
  else if (th === 'rain' && rnd() < 0.45) {
    const p = { type: 'plat', x: W + 14, w: 22, base: 13 + (rnd() * 5 | 0), amp: 4, h: 15, alive: true, ph: rnd() * 6 };
    objs.push(p); objs.push({ type: 'heart', x: W + 14, h: p.base + 9, alive: true, ph: rnd() * 6, plat: p }); sinceCloud++;
  }
  else { const high = rnd() < 0.55; objs.push({ type: 'heart', x: W + 10, h: high ? 24 + (rnd() * 7 | 0) : 7, alive: true, ph: rnd() * 6 }); sinceCloud++; }
  const cl = th === 'rain' ? (sinceCloud >= 1 && rnd() < 0.55) : th === 'roof' ? (sinceCloud >= 2 && rnd() < 0.5) : (sinceCloud >= 2 && rnd() < 0.6);
  nextType = cl ? 'cloud' : 'heart';
  gap = nextType === 'cloud' ? 84 + rnd() * 16 : (type === 'cloud' ? 56 : 50) + rnd() * 16;
  if (REC) gap *= 0.62; else if (DEMO) gap *= 0.82;
}
function update(dt) {
  T += dt; anim += dt;
  if (state === 'title') { speed = 32; scroll += speed * dt; }
  if (state === 'trans') {
    transT += dt; scroll += speed * dt;
    if (transT > 2.1) { $('lvcard').classList.remove('show'); beginLevel(lv + 1); }
  }
  if (state === 'propose' || state === 'yes') {
    scroll += speed * dt; speed = Math.max(0, speed - 150 * dt);
    const gx = Math.round(W * 0.68), tx = gx - 17;
    if (state === 'propose') {
      propT += dt;
      if (propT > 0.2) B.x += Math.sign(tx - B.x) * Math.min(Math.abs(tx - B.x), 30 * dt);
      if (propT > 2.4 && !$('prop').classList.contains('show')) showProp();
      if (propT > 1.4 && rnd() < dt * 3) parts.push({ x: B.x + 9 + (rnd() - 0.5) * 6, y: GY - 12, vx: (rnd() - 0.5) * 8, vy: -10 - rnd() * 8, t: 0, life: 1.0, c: '#ffd34e', g: 0 });
    } else {
      yesT += dt; fireT -= dt;
      if (fireT <= 0) { firework(); if (rnd() < 0.5) firework(); fireT = 0.16 + rnd() * 0.14; }
      if (rnd() < dt * 9) parts.push({ x: rnd() * W, y: -4, vx: (rnd() - 0.5) * 10, vy: 18 + rnd() * 16, t: 0, life: 4, c: 'heart', g: 0 });
      if (yesT > 3.6 && !$('prop').classList.contains('end')) yesEnd();
    }
    girl.on = true; if (girl.x > gx) girl.x = Math.max(gx, girl.x - 46 * dt);
    B.vy = 0; B.y = 0; B.ground = true;
  }
  if (state === 'play' || state === 'win') {
    if (state === 'play') {
      playT += dt;
      gap -= speed * dt; if (gap <= 0) spawn();
      if (DEMO) bot();
      const mv = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      B.x = Math.max(10, Math.min(W * 0.62, B.x + mv * 70 * dt));
    } else {
      winT += dt; speed = Math.max(0, speed - 150 * dt);
      const tx = Math.round(W * 0.3); B.x += Math.sign(tx - B.x) * Math.min(Math.abs(tx - B.x), 50 * dt);
      girl.on = true; const gx = Math.round(W * 0.68);
      if (girl.x > gx) { girl.x = Math.max(gx, girl.x - 46 * dt); girl.walk += dt; }
      if (winT > 1.45 && !flyers.length) {
        for (let i = 0; i < GOAL; i++) { const a = i / GOAL * 6.283; flyers.push({ sx: B.x + Math.cos(a) * 22, sy: GY - 34 + Math.sin(a) * 14, d: i * 0.04 }); }
      }
      if (winT > 2.45 && bigS === 0) { bigS = 0.01; flashA = 0.8; sfx('win'); $('banner').classList.add('show'); }
      if (bigS > 0) bigS = Math.min(1, bigS + dt * 2.2);
      if (winT > 2.6) { fireT -= dt; if (fireT <= 0) { firework(); fireT = 0.42 + rnd() * 0.2; } }
      if (winT > 2.6 && rnd() < dt * 5) parts.push({ x: (B.x + girl.x) / 2 + (rnd() - 0.5) * 16, y: GY - 14, vx: (rnd() - 0.5) * 6, vy: -16 - rnd() * 10, t: 0, life: 1.6, c: 'heart', g: 0 });
      if (winT > 6.4 && !letterShown && !REC) openLetter();
      if (DEMO && !REC && letterShown && winT > 10.5) propose();
    }
    scroll += speed * dt;
    const py = B.y;
    B.vy -= GRAV * dt; B.y += B.vy * dt;
    for (const o of objs) if (o.type === 'plat') { o.h = o.base + Math.sin(o.ph * 2.2) * o.amp; }
    for (const o of objs) if (o.type === 'heart' && o.plat) o.h = o.plat.h + 9;
    if (onPlat) { if (Math.abs(onPlat.x - B.x) > onPlat.w / 2 + 2 || B.vy > 0) { if (B.vy <= 0) { B.ground = false; B.jumps = 1; } onPlat = null; } else { B.y = onPlat.h; B.vy = 0; } }
    else if (B.vy <= 0) for (const o of objs) if (o.type === 'plat' && Math.abs(o.x - B.x) < o.w / 2 && py >= o.h - 2 && B.y <= o.h) { onPlat = o; B.y = o.h; B.vy = 0; B.ground = true; B.jumps = 0; break; }
    if (boss) {
      boss.t += dt; boss.hitT = Math.max(0, boss.hitT - dt);
      boss.y = GY - 64 + Math.sin(boss.t * 1.7) * 7; boss.x = W * 0.76 + Math.sin(boss.t * 0.9) * 6;
      if (!boss.dead && rnd() < dt * 22) parts.push({ x: boss.x + (rnd() - 0.5) * 34, y: boss.y + 10, vx: -8, vy: 70, t: 0, life: 0.6, c: '#7fb2ff', g: 60 });
      if (boss.dead) { boss.dead += dt; if (boss.dead > 1.3) win(); }
    }
    for (const f of flyers2) {
      f.t += dt;
      if (boss && f.t >= 0.45 && !f.done) { f.done = 1; boss.hp--; boss.hitT = 0.25; shake = 0.15; sfx('hit'); burst(boss.x, boss.y, 14, ['#ff4f8b', '#fff', '#ffd34e'], 50, 0.6, 10); pop(boss.x, boss.y - 18, 'HIT!', '#ffd34e', 0.7, 7); hud();
        if (boss.hp <= 0 && !boss.dead) { boss.dead = 0.01; flashA = 0.7; for (let i = 0; i < 4; i++) burst(boss.x + (rnd() - .5) * 30, boss.y + (rnd() - .5) * 16, 24, ['#6d6890', '#fff', '#ff9cc2'], 70, 0.9, 10); pop(W / 2, H * 0.3, 'HEARTBREAK DEFEATED!', '#5ef2ff', 1.3, 6); objs.forEach(o => o.alive = false); } }
    }
    flyers2 = flyers2.filter(f => !f.done);
    if (B.y <= 0) { if (!B.ground && B.vy < -60) dust(B.x, GY); B.y = 0; B.vy = 0; B.ground = true; B.jumps = 0; }
    B.inv = Math.max(0, B.inv - dt);
    for (const o of objs) {
      o.x -= speed * dt; o.ph += dt;
      if (!o.alive || state !== 'play') continue;
      const dx = Math.abs(o.x - B.x);
      if (boss && boss.dead) continue;
      if (o.type === 'heart' && dx < 8 && o.h + 3 > B.y && o.h - 3 < B.y + 15) collect(o);
      else if (o.type === 'cloud' && dx < 9 && B.y < 11) hit(o);
    }
    objs = objs.filter(o => o.x > -30 && o.alive);
  }
  for (const p of parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  parts = parts.filter(p => p.t < p.life);
  for (const p of pops) { p.t += dt; p.y -= 14 * dt; }
  pops = pops.filter(p => p.t < p.life);
  shake = Math.max(0, shake - dt); flashA = Math.max(0, flashA - dt * 1.6);
}

/* ---------- render ---------- */
function drawSpr(img, x, y, flip, sc) {
  sc = sc || 1; x = Math.round(x); y = Math.round(y);
  if (flip) { g.save(); g.scale(-1, 1); g.drawImage(img, -x - img.width * sc, y, img.width * sc, img.height * sc); g.restore(); }
  else g.drawImage(img, x, y, img.width * sc, img.height * sc);
}
function themeSky() {
  const th = state === 'title' ? 'city' : LV[lv].t;
  if (th === 'city') return sky;
  const s = g.createLinearGradient(0, 0, 0, GY);
  if (th === 'rain') { s.addColorStop(0, '#070a1f'); s.addColorStop(0.6, '#1b2350'); s.addColorStop(1, '#33306a'); }
  else { s.addColorStop(0, '#04021a'); s.addColorStop(0.5, '#1d0c4a'); s.addColorStop(1, '#4a1a66'); }
  return s;
}
function render() {
  const th = (state === 'title') ? 'city' : LV[lv].t;
  g.fillStyle = themeSky(); g.fillRect(0, 0, W, GY);
  for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(T * 1.6 + s.p)); g.globalAlpha = a; g.fillStyle = s.b ? '#ffd34e' : '#fff'; g.fillRect(s.x, s.y, 1, 1); if (s.b && a > 0.85) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } }
  g.globalAlpha = 1;
  const big = th === 'roof', mx = big ? Math.round(W * 0.3) : W - 22, my = big ? Math.round(H * 0.2) : Math.round(H * 0.3);
  if (th !== 'rain') {
  if (big) { const mg = g.createRadialGradient(mx, my, 8, mx, my, 60); mg.addColorStop(0, 'rgba(255,240,200,.35)'); mg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = mg; g.fillRect(0, 0, W, GY); g.fillStyle = '#fff1c9'; for (let yy = -22; yy <= 22; yy++) { const w = Math.round(Math.sqrt(484 - yy * yy)); g.fillRect(mx - w, my + yy, w * 2, 1); } g.fillStyle = '#e8d49e'; g.fillRect(mx - 9, my - 6, 6, 5); g.fillRect(mx + 6, my + 5, 8, 6); g.fillRect(mx - 2, my + 12, 4, 4); g.fillRect(mx + 8, my - 12, 4, 3); }
  else { g.fillStyle = 'rgba(255,240,200,.12)'; g.beginPath(); g.arc(mx, my, 17, 0, 6.283); g.fill();
  g.fillStyle = '#fff1c9'; for (let yy = -10; yy <= 10; yy++) { const w = Math.round(Math.sqrt(110 - yy * yy)); g.fillRect(mx - w, my + yy, w * 2, 1); }
  g.fillStyle = '#e8d49e'; g.fillRect(mx - 4, my - 3, 3, 3); g.fillRect(mx + 3, my + 3, 4, 3); g.fillRect(mx - 1, my + 6, 2, 2); } }
  const fo = (scroll * 0.18) % 260;
  g.fillStyle = '#2d1a63';
  const fh = th === 'roof' ? 0.35 : 1; if (th === 'rain') g.fillStyle = '#1e2452';
  for (let k = -1; k * 260 - fo < W; k++) for (const b of city.far) { const x = Math.round(b.x + k * 260 - fo); if (x > W || x + b.w < 0) continue; const h = Math.round(b.h * fh); g.fillRect(x, GY - h, b.w, h); }
  const no = (scroll * 0.45) % 300;
  if (th === 'city') for (let k = -1; k * 300 - no < W; k++) for (const b of city.near) {
    const x = Math.round(b.x + k * 300 - no); if (x > W || x + b.w < 0) continue;
    g.fillStyle = '#1a0f3c'; g.fillRect(x, GY - b.h, b.w, b.h); g.fillStyle = '#26165a'; g.fillRect(x, GY - b.h, b.w, 1);
    for (const [wx, wy, l] of b.win) if (l) { g.fillStyle = l === 2 ? '#ff9cc2' : '#ffd34e'; g.globalAlpha = 0.85; g.fillRect(x + wx, GY - b.h + wy, 2, 2); }
    g.globalAlpha = 1;
    if (b.sign) { const on = Math.sin(T * 4 + b.x) > -0.4; g.globalAlpha = on ? 0.75 : 0.25; g.drawImage(SP.sign, x + (b.w >> 1) - 3, GY - b.h - 8); g.globalAlpha = 1; }
  }
  if (th === 'rain') drawBridge(); else if (th === 'roof') drawRoof(); else {
  g.fillStyle = '#2b1658'; g.fillRect(0, GY, W, H - GY);
  g.fillStyle = '#ff4f8b'; g.fillRect(0, GY, W, 2); g.fillStyle = '#ffa0c4'; g.fillRect(0, GY, W, 1);
  g.fillStyle = '#3a2070'; const go = Math.round(scroll) % 12;
  for (let row = 0; GY + 4 + row * 6 < H; row++) { const y = GY + 4 + row * 6; g.fillRect(0, y, W, 1); for (let x = -go + (row % 2) * 6; x < W; x += 12) g.fillRect(x, y + 1, 1, 5); } }
  if (state !== 'title') { g.font = '5px monospace'; }
  for (const o of objs) {
    if (!o.alive) continue;
    if (o.type === 'heart') { const bob = Math.round(Math.sin(o.ph * 5) * 1.5); g.fillStyle = 'rgba(255,79,139,.25)'; g.fillRect(Math.round(o.x) - 5, GY - o.h - 4 + bob, 11, 9); drawSpr(SP.heart, o.x - 3, GY - o.h - 3 + bob); }
    else if (o.type === 'plat') { const y = Math.round(GY - o.h); const x0 = Math.round(o.x - o.w / 2); g.fillStyle = '#1b1030'; g.fillRect(x0 - 1, y - 1, o.w + 2, 5); g.fillStyle = '#ff9cc2'; g.fillRect(x0, y, o.w, 2); g.fillStyle = '#c2185b'; g.fillRect(x0, y + 2, o.w, 2); g.fillStyle = 'rgba(255,156,194,.25)'; g.fillRect(x0 + 2, y + 5, o.w - 4, 1); }
    else { drawSpr(SP.cloud, o.x - 7, GY - 12); g.fillStyle = '#7fb2ff'; for (let i = 0; i < 3; i++) { const yy = ((o.ph * 30 + i * 5) % 6) | 0; g.fillRect(Math.round(o.x) - 4 + i * 4, GY - 4 + yy, 1, 2); } }
  }
  if (flyers.length) {
    const ft = winT - 1.45, cx = W / 2, cy = Math.round(H * 0.5);
    for (const f of flyers) {
      const k = Math.max(0, Math.min(1, (ft - f.d) / 0.85)); if (k >= 1) continue;
      const e = k * k * (3 - 2 * k), sw = Math.sin(k * 3.14) * 18;
      drawSpr(SP.heart, f.sx + (cx - f.sx) * e + sw - 3, f.sy + (cy - f.sy) * e - 3);
    }
  }
  if (bigS > 0) {
    const cx = W / 2, cy = Math.round(H * 0.5);
    const base = Math.max(3, Math.floor(Math.min(W * 0.56 / 13, H * 0.3 / 11)));
    const over = bigS < 1 ? 1 + Math.sin(bigS * 3.14) * 0.25 : 1;
    const beat = 1 + 0.07 * Math.max(0, Math.sin(T * 6.2)) ** 6;
    const px = Math.max(1, Math.round(base * Math.min(1, bigS * 1.3) * over * beat));
    const gl = g.createRadialGradient(cx, cy, 2, cx, cy, px * 11);
    gl.addColorStop(0, 'rgba(255,79,139,.5)'); gl.addColorStop(1, 'rgba(255,79,139,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, GY);
    const hw = 13 * px, hh = 11 * px; g.drawImage(SPBIG, Math.round(cx - hw / 2), Math.round(cy - hh / 2), hw, hh);
    if (Math.sin(T * 5) > 0.3) { g.fillStyle = '#fff'; g.fillRect(Math.round(cx - hw / 2 + px * 2), Math.round(cy - hh / 2 + px * 2), 1, 1); }
  }
  if (boss) {
    const sc = 3, bw = 14 * sc, bh = 8 * sc, bx = Math.round(boss.x - bw / 2), by = Math.round(boss.y - bh / 2);
    if (!boss.dead || boss.dead < 0.5) {
      g.globalAlpha = boss.dead ? 1 - boss.dead * 2 : 1;
      g.fillStyle = 'rgba(80,90,160,.25)'; g.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
      drawSpr(SP.cloud, bx, by, false, sc);
      if (boss.hitT > 0) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx, by + 3, bw, bh - 6); }
      g.fillStyle = '#fff'; g.fillRect(bx + 12, by + 9, 3, 3); g.fillRect(bx + 27, by + 9, 3, 3); g.fillStyle = '#1b1030'; g.fillRect(bx + 13, by + 10, 2, 2); g.fillRect(bx + 28, by + 10, 2, 2);
      g.globalAlpha = 1;
      const hw = 40, hx = Math.round(W / 2 - hw / 2), hy = 6 + Math.round(H * 0.1);
      g.fillStyle = '#1b1030'; g.fillRect(hx - 1, hy - 1, hw + 2, 5); g.fillStyle = '#3a2070'; g.fillRect(hx, hy, hw, 3);
      g.fillStyle = '#ff4f8b'; g.fillRect(hx, hy, Math.round(hw * Math.max(0, boss.hp) / boss.max), 3);
    }
  }
  for (const f of flyers2) { const k = Math.min(1, f.t / 0.45); if (!boss) continue; drawSpr(SP.heart, f.x + (boss.x - f.x) * k - 3, f.y + (boss.y - f.y) * k - Math.sin(k * 3.14) * 16 - 3); }
  if (th === 'rain' && state !== 'title') { g.fillStyle = 'rgba(170,200,255,.55)'; const n = Math.round(W * H / 260); const r = rngF(5); for (let i = 0; i < n; i++) { const x0 = r() * (W + 40), sp = 140 + r() * 60, y = ((r() * H + T * sp) % (GY + 10)); const x = Math.round((x0 - y * 0.25 - T * 20) % (W + 40)); g.fillRect(x < 0 ? x + W + 40 : x, Math.round(y), 1, 3); } }
  if (nameT.length && state === 'yes') {
    for (const p of nameT) { const k = Math.max(0, Math.min(1, (yesT - 0.3 - p.d) / 1.3)); if (k <= 0) continue; const e = 1 - Math.pow(1 - k, 3); const tw = k >= 1 && Math.sin(T * 6 + p.tx) > 0.85;
      drawSpr(tw ? SP.mhw : (p.c === 'y' ? SP.mhy : SP.mh), p.sx + (p.tx - p.sx) * e - 1, p.sy + (p.ty - p.sy) * e - 1); }
  }
  for (const p of parts) {
    const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a);
    if (p.c === 'heart') drawSpr(SP.heart, p.x - 3, p.y - 3);
    else { g.fillStyle = p.c; const s = p.t < p.life * 0.3 ? 2 : 1; g.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
  }
  g.globalAlpha = 1;
  if (state !== 'title' || true) {
    const air = !B.ground, fr = air ? SP.boyJ : ((Math.floor(anim * (speed > 5 ? 11 : 0)) % 2) ? SP.boyB : SP.boyA);
    const kneel = (state === 'propose' && propT > 1.5) || state === 'yes';
    if (!(B.inv > 0 && Math.floor(T * 14) % 2)) drawSpr(kneel ? SP.boyK : (state === 'propose' && speed < 5 ? SP.boyA : fr), B.x - 6, GY - 16 - B.y);
    if (kneel) { const open = state === 'yes' || propT > 2.0; drawSpr(open ? SP.ringO : SP.ringC, B.x + 5, GY - (open ? 13 : 11)); if (open && Math.sin(T * 9) > 0.2) { g.fillStyle = '#fff'; g.fillRect(Math.round(B.x + 8), GY - 16, 1, 1); g.fillRect(Math.round(B.x + 7), GY - 15, 3, 0); } }
  }
  if (girl.on) { const fr = (girl.x > Math.round(W * 0.68) && Math.floor(girl.walk * 8) % 2) ? SP.girlB : SP.girlA; drawSpr(fr, girl.x - 6, GY - 16, true); }
  if (state !== 'title' && state !== 'yes' && state !== 'propose') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(2, GY + 4, 4 * 13, 7); }
  if (flashA > 0) { g.fillStyle = 'rgba(255,240,250,' + flashA * 0.6 + ')'; g.fillRect(0, 0, W, H); }
  const sx = shake > 0 ? Math.round((rnd() - 0.5) * 2 * S) : 0, sy = shake > 0 ? Math.round((rnd() - 0.5) * 2 * S) : 0;
  ctx.fillStyle = '#120838'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(lo, sx, sy, cv.width, cv.height);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, (p.life - p.t) * 4);
    ctx.font = (p.size * S * 0.55 | 0) + 'px "Press Start 2P", monospace';
    ctx.fillStyle = '#000'; ctx.fillText(p.text, p.x * S + S * 0.6, p.y * S + S * 0.6);
    ctx.fillStyle = p.c; ctx.fillText(p.text, p.x * S, p.y * S);
  }
  ctx.globalAlpha = 1;
  if (state !== 'title' && state !== 'yes' && state !== 'propose') { ctx.textAlign = 'left'; ctx.font = (Math.round(S * 2.6)) + 'px "Press Start 2P", monospace'; ctx.fillStyle = '#ffd34e'; ctx.fillText('LV' + (lv + 1) + ' ' + LV[lv].n, 4 * S, (GY + 7.6) * S); }
}
function drawBridge() {
  g.fillStyle = '#0c1430'; g.fillRect(0, GY, W, H - GY);
  g.fillStyle = '#25306a'; for (let i = 0; i < 8; i++) { const y = GY + 8 + i * 3; const o = (T * 12 + i * 17) % 30; for (let x = -o; x < W; x += 30) g.fillRect(Math.round(x), y, 8, 1); }
  g.fillStyle = '#5b3a7a'; g.fillRect(0, GY, W, 4); g.fillStyle = '#ff9cc2'; g.fillRect(0, GY, W, 1);
  const o = Math.round(scroll) % 10; g.fillStyle = '#7a5aa0';
  for (let x = -o; x < W; x += 10) g.fillRect(x, GY - 7, 1, 7);
  g.fillRect(0, GY - 8, W, 1);
  const lo2 = Math.round(scroll) % 70;
  for (let x = -lo2 + 20; x < W + 10; x += 70) { g.fillStyle = '#7a5aa0'; g.fillRect(x, GY - 26, 1, 26); g.fillRect(x - 2, GY - 27, 5, 1); const gl = g.createRadialGradient(x, GY - 24, 1, x, GY - 24, 14); gl.addColorStop(0, 'rgba(255,211,78,.45)'); gl.addColorStop(1, 'rgba(255,211,78,0)'); g.fillStyle = gl; g.fillRect(x - 14, GY - 38, 28, 28); g.fillStyle = '#ffd34e'; g.fillRect(x - 1, GY - 25, 3, 2); }
}
function drawRoof() {
  g.fillStyle = '#2a2148'; g.fillRect(0, GY, W, H - GY);
  g.fillStyle = '#4a3c78'; g.fillRect(0, GY, W, 3); g.fillStyle = '#8a7ac0'; g.fillRect(0, GY, W, 1);
  g.fillStyle = '#342a5a'; const go = Math.round(scroll) % 16; for (let x = -go; x < W; x += 16) g.fillRect(x, GY + 3, 1, H - GY);
  const so = Math.round(scroll * 0.9) % 120;
  for (let x = -so; x < W + 120; x += 120) {
    g.fillStyle = '#3a2f60'; g.fillRect(x + 60, GY - 22, 16, 14); g.fillRect(x + 62, GY - 8, 2, 8); g.fillRect(x + 72, GY - 8, 2, 8); g.fillStyle = '#4a3c78'; g.fillRect(x + 60, GY - 22, 16, 2);
    g.fillStyle = '#5a4a90'; g.fillRect(x + 20, GY - 34, 1, 34); g.fillRect(x + 17, GY - 30, 7, 1);
    if (Math.sin(T * 3 + x) > 0) { g.fillStyle = '#ff4f8b'; g.fillRect(x + 20, GY - 35, 1, 1); }
    for (let i = 0; i <= 20; i++) { const xx = x + 20 + i * 2, yy = GY - 30 + Math.round(Math.sin(i / 20 * 3.14) * 8); g.fillStyle = i % 3 ? '#ffd34e' : '#ff9cc2'; g.globalAlpha = 0.6 + 0.4 * Math.sin(T * 5 + i); g.fillRect(xx, yy, 1, 1); }
    g.globalAlpha = 1;
  }
}
const SPBIG = mk(BIG);

/* ---------- loop ---------- */
let last = 0;
function frame(ts) {
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
  update(dt); render(); requestAnimationFrame(frame);
}

/* ---------- injected UI ---------- */
(function ui() {
  const st = $('stage'); if (getComputedStyle(st).position === 'static') st.style.position = 'relative';
  const c = document.createElement('div'); c.id = 'lvcard'; c.innerHTML = '<u></u><b></b><i></i>'; st.appendChild(c);
  const p = document.createElement('div'); p.id = 'prop';
  p.innerHTML = '<div class="pq">WILL YOU BE MY<br>PLAYER 2 FOREVER? 💍</div><div class="pbtns"><button id="pyes" class="pb y">YES ❤️</button><button id="pno" class="pb n">NO</button></div>' +
    '<div class="py"><b>SHE SAID YES! 💍</b><i>PLAYER 2 · FOREVER ❤️</i></div><div class="pend"><button id="pagain" class="pb s">↻ AGAIN</button><button id="pshare" class="pb s">SHARE 💬</button><button id="pcard" class="pb s">CARD ⬇</button></div>';
  st.appendChild(p);
  const row = document.createElement('div'); row.className = 'lvrow';
  for (let i = 0; i < 3; i++) { const b = document.createElement('button'); b.className = 'lvb'; b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); start(i); }); row.appendChild(b); }
  const go = $('go'); go.parentNode.insertBefore(row, go.nextSibling);
  const r = document.createElement('button'); r.id = 'ring'; r.className = 'ringbtn'; r.type = 'button'; r.textContent = '💍 ONE MORE THING…';
  const ag = $('again'); ag.parentNode.insertBefore(r, ag);
  r.addEventListener('click', propose);
  $('pyes').addEventListener('click', yes);
  ['pointerenter', 'pointerdown', 'touchstart', 'click', 'focus'].forEach(ev => $('pno').addEventListener(ev, dodge, { passive: false }));
  $('pagain').addEventListener('click', again); $('pshare').addEventListener('click', share); $('pcard').addEventListener('click', openCard);
  lvButtons();
})();

/* ---------- input ---------- */
function bindHold(id, key) {
  const el = $(id);
  const on = e => { e.preventDefault(); keys[key] = true; }, off = () => { keys[key] = false; };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
}
bindHold('left', 'l'); bindHold('right', 'r');
$('jump').addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'title') start(0); else jump(); });
cv.addEventListener('pointerdown', () => jump());
$('go').addEventListener('click', () => start(0));
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); start(0); } });
$('music').addEventListener('click', () => { auInit(); setMusic(!AU.on); });
$('again').addEventListener('click', again);
$('share').addEventListener('click', share);
$('card').addEventListener('click', openCard);
$('mclose').addEventListener('click', closeCard);
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeCard(); });
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (['ArrowUp', ' ', 'w', 'W'].includes(e.key)) { e.preventDefault(); if (state === 'title') start(0); else jump(); }
  if (e.key === 'Enter' && state === 'title') start(0);
  if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = true;
  if (e.key === 'ArrowRight' || e.key === 'd') keys.r = true;
});
addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = false; if (e.key === 'ArrowRight' || e.key === 'd') keys.r = false; });
addEventListener('resize', () => { resize(); if (state === 'title') B.x = Math.round(W * 0.24); });

/* ---------- boot ---------- */
resize(); reset();
if (NAME !== 'my love') $('name').value = NAME;
setNames(); setMusic(AU.on);
requestAnimationFrame(frame);
if (DEMO && !REC) setTimeout(() => start(0), 1600);
window.__api = { propose, dodge, yes, levelDone, beginLevel, lv: () => lv, boss: () => boss && { hp: boss.hp, dead: boss.dead }, propT: () => propT, yesT: () => yesT, start, jump, again, openLetter, openCard, closeCard, share, setMusic, state: () => state, info: () => ({ jumps: jumpsN, hearts, score, playT, winT, W, H, S }) };
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { window.__ready = true; });
})();
