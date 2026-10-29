/* Love Quest 🎮❤️ — an 8-bit love game. Plain JS + canvas, no libraries.
   Made by @hack.n.code */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const DEMO = Q.get('demo') === '1';
const REC = Q.get('rec') === '1';
const GOAL = 10;
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
const SP = { boyA: mk(BOY_A), boyB: mk(BOY_B), boyJ: mk(BOY_J), girlA: mk(GIRL_A), girlB: mk(GIRL_B), heart: mk(HEART), cloud: mk(CLOUD), sign: mk(HEART.map(r => r.replace(/[pPw]/g, 'c'))) };

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
  letterShown = false; bigS = 0; winT = 0; playT = 0; hitCount = 0;
  if (DEMO || REC) rnd = rngF(2910);
  hud();
}
const pad6 = n => String(Math.max(0, n | 0)).padStart(6, '0');
function hud() {
  $('hc').textContent = hearts; $('sc').textContent = pad6(score); $('hs').textContent = pad6(hi);
  const p = Math.min(100, hearts / GOAL * 100); $('fill').style.width = p + '%'; $('pct').textContent = Math.round(p) + '%';
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

/* ---------- game actions ---------- */
function start() {
  const v = clean($('name').value); NAME = v || NAME || 'my love'; $('name').value = NAME === 'my love' ? '' : NAME;
  setNames();
  $('start').classList.remove('show');
  reset(); state = 'play'; speed = BASE_SPEED;
  pop(W / 2, H * 0.35, 'LEVEL 1 · GO!', '#ffd34e', 1.3, 9);
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
  hud();
  if (hearts >= GOAL) win();
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
  state = 'win'; winT = 0;
  objs.forEach(o => { if (o.alive && o.type === 'cloud') burst(o.x, GY - 7, 8, ['#6d6890', '#fff'], 25, 0.5, 10); o.alive = false; });
  const bonus = Math.max(0, Math.round((32 - playT) * 40)) + (hitCount === 0 ? 500 : 0);
  score += bonus; hud();
  if (bonus) pop(W / 2, H * 0.3, 'BONUS +' + bonus, '#5ef2ff', 1.2, 8);
  if (score > hi) { hi = score; localStorage.setItem('lq_hi', hi); $('newhi').classList.add('show'); } else $('newhi').classList.remove('show');
  $('fs').textContent = score; hud();
}
function openLetter() { if (letterShown) return; letterShown = true; setNames(); const L = $('letter'); L.classList.add('show'); requestAnimationFrame(() => requestAnimationFrame(() => L.classList.add('open'))); }
function again() {
  $('letter').classList.remove('show', 'open'); $('banner').classList.remove('show'); closeCard(); start();
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
  for (const o of objs) {
    if (!o.alive || o.bot) continue;
    const dx = o.x - B.x; if (dx < -4) continue;
    const ttr = dx / Math.max(1, speed);
    if (o.type === 'cloud') { if (ttr <= 0.3) { jump(); o.bot = true; } return; }
    if (o.h > 14) { const need = o.h - 8, tH = (V0 - Math.sqrt(V0 * V0 - 2 * GRAV * need)) / GRAV; if (ttr <= tH + 0.01) { jump(); o.bot = true; } return; }
    o.bot = true;
  }
}

/* ---------- update ---------- */
function spawn() {
  const type = nextType;
  if (type === 'cloud') { objs.push({ type, x: W + 10, h: 7, alive: true, ph: rnd() * 6 }); sinceCloud = 0; }
  else { const high = rnd() < 0.55; objs.push({ type: 'heart', x: W + 10, h: high ? 24 + (rnd() * 7 | 0) : 7, alive: true, ph: rnd() * 6 }); sinceCloud++; }
  nextType = (sinceCloud >= 2 && rnd() < 0.6) ? 'cloud' : 'heart';
  gap = nextType === 'cloud' ? 84 + rnd() * 16 : (type === 'cloud' ? 56 : 50) + rnd() * 16;
}
function update(dt) {
  T += dt; anim += dt;
  if (state === 'title') { speed = 32; scroll += speed * dt; }
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
    }
    scroll += speed * dt;
    B.vy -= GRAV * dt; B.y += B.vy * dt;
    if (B.y <= 0) { if (!B.ground && B.vy < -60) dust(B.x, GY); B.y = 0; B.vy = 0; B.ground = true; B.jumps = 0; }
    B.inv = Math.max(0, B.inv - dt);
    for (const o of objs) {
      o.x -= speed * dt; o.ph += dt;
      if (!o.alive || state !== 'play') continue;
      const dx = Math.abs(o.x - B.x);
      if (o.type === 'heart' && dx < 8 && o.h + 3 > B.y && o.h - 3 < B.y + 15) collect(o);
      else if (o.type === 'cloud' && dx < 9 && B.y < 11) hit(o);
    }
    objs = objs.filter(o => o.x > -20 && (o.alive || o.type === 'x'));
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
function render() {
  g.fillStyle = sky; g.fillRect(0, 0, W, GY);
  for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(T * 1.6 + s.p)); g.globalAlpha = a; g.fillStyle = s.b ? '#ffd34e' : '#fff'; g.fillRect(s.x, s.y, 1, 1); if (s.b && a > 0.85) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } }
  g.globalAlpha = 1;
  const mx = W - 22, my = Math.round(H * 0.3); g.fillStyle = 'rgba(255,240,200,.12)'; g.beginPath(); g.arc(mx, my, 17, 0, 6.283); g.fill();
  g.fillStyle = '#fff1c9'; for (let yy = -10; yy <= 10; yy++) { const w = Math.round(Math.sqrt(110 - yy * yy)); g.fillRect(mx - w, my + yy, w * 2, 1); }
  g.fillStyle = '#e8d49e'; g.fillRect(mx - 4, my - 3, 3, 3); g.fillRect(mx + 3, my + 3, 4, 3); g.fillRect(mx - 1, my + 6, 2, 2);
  const fo = (scroll * 0.18) % 260;
  g.fillStyle = '#2d1a63';
  for (let k = -1; k * 260 - fo < W; k++) for (const b of city.far) { const x = Math.round(b.x + k * 260 - fo); if (x > W || x + b.w < 0) continue; g.fillRect(x, GY - b.h, b.w, b.h); }
  const no = (scroll * 0.45) % 300;
  for (let k = -1; k * 300 - no < W; k++) for (const b of city.near) {
    const x = Math.round(b.x + k * 300 - no); if (x > W || x + b.w < 0) continue;
    g.fillStyle = '#1a0f3c'; g.fillRect(x, GY - b.h, b.w, b.h); g.fillStyle = '#26165a'; g.fillRect(x, GY - b.h, b.w, 1);
    for (const [wx, wy, l] of b.win) if (l) { g.fillStyle = l === 2 ? '#ff9cc2' : '#ffd34e'; g.globalAlpha = 0.85; g.fillRect(x + wx, GY - b.h + wy, 2, 2); }
    g.globalAlpha = 1;
    if (b.sign) { const on = Math.sin(T * 4 + b.x) > -0.4; g.globalAlpha = on ? 0.75 : 0.25; g.drawImage(SP.sign, x + (b.w >> 1) - 3, GY - b.h - 8); g.globalAlpha = 1; }
  }
  g.fillStyle = '#2b1658'; g.fillRect(0, GY, W, H - GY);
  g.fillStyle = '#ff4f8b'; g.fillRect(0, GY, W, 2); g.fillStyle = '#ffa0c4'; g.fillRect(0, GY, W, 1);
  g.fillStyle = '#3a2070'; const go = Math.round(scroll) % 12;
  for (let row = 0; GY + 4 + row * 6 < H; row++) { const y = GY + 4 + row * 6; g.fillRect(0, y, W, 1); for (let x = -go + (row % 2) * 6; x < W; x += 12) g.fillRect(x, y + 1, 1, 5); }
  for (const o of objs) {
    if (!o.alive) continue;
    if (o.type === 'heart') { const bob = Math.round(Math.sin(o.ph * 5) * 1.5); g.fillStyle = 'rgba(255,79,139,.25)'; g.fillRect(Math.round(o.x) - 5, GY - o.h - 4 + bob, 11, 9); drawSpr(SP.heart, o.x - 3, GY - o.h - 3 + bob); }
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
  for (const p of parts) {
    const a = 1 - p.t / p.life; g.globalAlpha = Math.max(0, a);
    if (p.c === 'heart') drawSpr(SP.heart, p.x - 3, p.y - 3);
    else { g.fillStyle = p.c; const s = p.t < p.life * 0.3 ? 2 : 1; g.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
  }
  g.globalAlpha = 1;
  if (state !== 'title' || true) {
    const air = !B.ground, fr = air ? SP.boyJ : ((Math.floor(anim * (speed > 5 ? 11 : 0)) % 2) ? SP.boyB : SP.boyA);
    if (!(B.inv > 0 && Math.floor(T * 14) % 2)) drawSpr(fr, B.x - 6, GY - 16 - B.y);
  }
  if (girl.on) { const fr = (girl.x > Math.round(W * 0.68) && Math.floor(girl.walk * 8) % 2) ? SP.girlB : SP.girlA; drawSpr(fr, girl.x - 6, GY - 16, true); }
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
}
const SPBIG = mk(BIG);

/* ---------- loop ---------- */
let last = 0;
function frame(ts) {
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
  update(dt); render(); requestAnimationFrame(frame);
}

/* ---------- input ---------- */
function bindHold(id, key) {
  const el = $(id);
  const on = e => { e.preventDefault(); keys[key] = true; }, off = () => { keys[key] = false; };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
}
bindHold('left', 'l'); bindHold('right', 'r');
$('jump').addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'title') start(); else jump(); });
cv.addEventListener('pointerdown', () => jump());
$('go').addEventListener('click', start);
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); start(); } });
$('music').addEventListener('click', () => { auInit(); setMusic(!AU.on); });
$('again').addEventListener('click', again);
$('share').addEventListener('click', share);
$('card').addEventListener('click', openCard);
$('mclose').addEventListener('click', closeCard);
$('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeCard(); });
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (['ArrowUp', ' ', 'w', 'W'].includes(e.key)) { e.preventDefault(); if (state === 'title') start(); else jump(); }
  if (e.key === 'Enter' && state === 'title') start();
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
if (DEMO && !REC) setTimeout(start, 1600);
window.__api = { start, jump, again, openLetter, openCard, closeCard, share, setMusic, state: () => state, info: () => ({ jumps: jumpsN, hearts, score, playT, winT, W, H, S }) };
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { window.__ready = true; });
})();
