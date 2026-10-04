import { APP_VERSION } from './version.js';
import { createDealer, fr, FAM } from './generate.js';
import { createFX } from './fx.js';

const $ = (id) => document.getElementById(id);

const LS_PLAYER = 'physique-flash-player';
const LS_RECORDS = 'physique-flash-records';

let mode = 'traj', diff = 'moyen', duration = 60;
let player = { name: 'Paloma' };
let records = {};

/** Paliers de départ, plafond, pénalité et bonus par niveau choisi. */
const RULES = {
  facile: { start: 1, max: 3, min: 1, penalty: 2, bonus: 1, step: 4 },
  moyen: { start: 2, max: 4, min: 1, penalty: 3, bonus: 1.35, step: 4 },
  expert: { start: 3, max: 5, min: 2, penalty: 4, bonus: 2, step: 3 }
};
const R = () => RULES[diff];
const DIFF_NAME = { facile: 'Tranquille', moyen: '6ème', expert: 'Expert' };

/* ---------- mémoire locale ---------- */

function loadPersisted() {
  try {
    const p = JSON.parse(localStorage.getItem(LS_PLAYER) || 'null');
    if (p && typeof p.name === 'string' && p.name.trim()) player.name = p.name.trim().slice(0, 14);
  } catch { /* on garde Paloma */ }
  try {
    const r = JSON.parse(localStorage.getItem(LS_RECORDS) || '{}');
    if (r && typeof r === 'object' && !Array.isArray(r)) records = r;
  } catch { records = {}; }
}
function savePlayer() {
  try { localStorage.setItem(LS_PLAYER, JSON.stringify({ name: player.name })); } catch { /* quota */ }
}
function saveRecords() {
  try { localStorage.setItem(LS_RECORDS, JSON.stringify(records)); } catch { /* quota */ }
}

/* ---------- son ---------- */

let muted = false, actx = null, master = null;
function unlockAudio() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (!master) { master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination); }
    if (actx.state === 'suspended') actx.resume();
  } catch { /* pas d'audio */ }
}
document.addEventListener('pointerdown', unlockAudio, { passive: true });
document.addEventListener('keydown', unlockAudio);

function beep(freq, dur, type) {
  if (muted) return;
  try {
    unlockAudio();
    if (!actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.26, actx.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(master || actx.destination);
    o.start(); o.stop(actx.currentTime + dur + 0.02);
  } catch { /* ignore */ }
}
const sGood = () => { beep(880, 0.09); setTimeout(() => beep(1320, 0.1), 70); };
const sBad = () => beep(150, 0.22, 'sawtooth');
const sUp = () => { beep(660, 0.08); setTimeout(() => beep(990, 0.08), 60); setTimeout(() => beep(1480, 0.14), 120); };
const sFanfare = () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => beep(f, 0.16), i * 110));

$('mute').addEventListener('click', function () {
  muted = !muted;
  this.textContent = muted ? '🔇' : '🔊';
  this.setAttribute('aria-label', muted ? 'Remettre le son' : 'Couper le son');
  if (!muted) { unlockAudio(); sGood(); }
});

const FX = createFX($('fx'));

/* ---------- manche ---------- */

let G = {};
let misses = [];

function reset(queue) {
  G = {
    running: false, left: duration, score: 0, shown: 0, streak: 0, best: 0,
    good: 0, total: 0, level: R().start, top: R().start,
    q: null, typed: '', qStart: 0, log: [], locked: false,
    dealer: createDealer({ mode, diff, memory: 10 }),
    queue: Array.isArray(queue) ? queue.slice() : null
  };
}

function paintScore() {
  const step = () => {
    const d = G.score - G.shown;
    if (Math.abs(d) < 1) { G.shown = G.score; $('score').textContent = G.score; return; }
    G.shown += d * 0.3;
    $('score').textContent = Math.round(G.shown);
    requestAnimationFrame(step);
  };
  step();
}
function paintBumpers() {
  const s = G.streak;
  for (let i = 0; i < 3; i++) {
    $('b' + i).classList.toggle('on', (s % 3 === 0 && s > 0) ? true : (s % 3) > i);
  }
  const m = $('multi');
  if (s >= 9) { m.textContent = '×3'; m.classList.add('on'); }
  else if (s >= 5) { m.textContent = '×2'; m.classList.add('on'); }
  else m.classList.remove('on');
}
const mult = () => (G.streak >= 9 ? 3 : G.streak >= 5 ? 2 : 1);

function paintLevel(up) {
  const el = $('lvl');
  el.textContent = 'Palier ' + G.level;
  if (up) { el.classList.add('up'); setTimeout(() => el.classList.remove('up'), 700); }
}
function paintAnswer(bad) {
  const el = $('ans');
  el.classList.toggle('bad', !!bad);
  if (G.typed === '') { el.classList.add('empty'); el.textContent = 'Tape ta réponse'; }
  else { el.classList.remove('empty'); el.textContent = G.typed; }
}

function nextQ() {
  if (G.queue) {
    if (!G.queue.length) return finish();
    G.q = G.queue.shift();
  } else {
    G.q = G.dealer.next(G.level);
  }
  G.typed = '';
  G.qStart = performance.now();
  G.locked = false;

  const qt = $('qtext');
  qt.textContent = G.q.t;
  $('qtag').textContent = G.q.tag;
  qt.classList.toggle('long', G.q.t.length > 26);
  qt.classList.toggle('xlong', G.q.t.length > 44);
  const c = $('qcard');
  c.classList.remove('in', 'good', 'bad');
  void c.offsetWidth;
  c.classList.add('in');
  paintChoices();
}

/** Les options d'une question à toucher, ou null quand la réponse se tape. */
function choiceList() {
  const list = G.q && G.q.choices;
  return Array.isArray(list) && list.length > 1 ? list : null;
}

/** Une question à choix remplace le pavé et l'afficheur par un bouton par option. */
function paintChoices() {
  const box = $('choices');
  const list = choiceList();
  box.replaceChildren();
  box.classList.toggle('hide', !list);
  $('pad').classList.toggle('hide', !!list);
  $('ans').classList.toggle('hide', !!list);
  if (!list) { paintAnswer(false); return; }
  const longest = Math.max(...list.map((c) => c.label.length));
  box.classList.toggle('stack', longest > 13 || list.length === 3);
  list.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.dataset.i = String(i);
    b.textContent = c.label;
    box.appendChild(b);
  });
}

/** Un seul tap compte : la question se verrouille dès la première option touchée. */
function choose(i) {
  const list = choiceList();
  if (!G.running || G.locked || !list || !list[i]) return;
  G.locked = true;
  const c = list[i];
  const btn = $('choices').children[i];
  if (btn) btn.classList.add(c.v === G.q.a ? 'picked' : 'missed');
  resolve(c.v, c.label);
}
$('choices').addEventListener('click', (e) => {
  const b = e.target.closest('.choice');
  if (b) choose(+b.dataset.i);
});

function ready() {
  return G.typed !== '' && !G.typed.endsWith(',');
}
function submit() {
  if (!G.running || choiceList() || !ready()) return;
  resolve(parseFloat(G.typed.replace(',', '.')), G.typed);
}

function resolve(given, givenLabel) {
  const ok = Math.abs(given - G.q.a) < 1e-9;
  const secs = (performance.now() - G.qStart) / 1000;
  G.total++;
  const card = $('qcard');
  const entry = {
    t: G.q.t, a: G.q.aLabel, ok, given: givenLabel, s: secs,
    fam: G.q.fam, famKey: G.q.famKey, tag: G.q.tag, item: G.q
  };
  G.log.push(entry);

  if (ok) {
    G.good++; G.streak++; G.best = Math.max(G.best, G.streak);
    const speed = secs < 2 ? 60 : secs < 4 ? 40 : secs < 7 ? 25 : 15;
    G.score += Math.round((speed + G.level * 5) * mult() * R().bonus);
    if (G.streak === 5 || G.streak === 9) sUp(); else sGood();
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('good');
    paintScore(); paintBumpers();
    if (G.streak % R().step === 0 && G.level < R().max) {
      G.level++;
      G.top = Math.max(G.top, G.level);
      paintLevel(true);
    }
    setTimeout(() => { if (G.running) nextQ(); }, 200);
  } else {
    G.streak = 0;
    G.left = Math.max(0, G.left - R().penalty);
    sBad();
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('bad');
    G.typed = '';
    if (!choiceList()) paintAnswer(true);
    paintBumpers();
    if (G.level > R().min && G.total > 3 && G.good / G.total < 0.6) { G.level--; paintLevel(false); }
    setTimeout(() => { if (G.running) nextQ(); }, 700);
  }
}

function press(k) {
  if (!G.running || choiceList()) return;
  if (k === 'ok') return submit();
  if (k === 'del') { G.typed = G.typed.slice(0, -1); return paintAnswer(false); }
  if (k === ',') {
    if (G.typed === '' || G.typed.includes(',')) return;
    G.typed += ',';
    return paintAnswer(false);
  }
  if (G.typed.replace(',', '').length >= 6) return;
  G.typed += k;
  paintAnswer(false);
  if (ready() && G.typed.length >= fr(G.q.a).length) setTimeout(submit, 60);
}
$('pad').addEventListener('click', (e) => {
  const b = e.target.closest('.key');
  if (b) press(b.dataset.k);
});
document.addEventListener('keydown', (e) => {
  if (!G.running) return;
  const list = choiceList();
  if (list) {
    const n = e.ctrlKey || e.metaKey || e.altKey ? NaN : +e.key;
    if (n >= 1 && n <= Math.min(9, list.length)) { e.preventDefault(); choose(n - 1); }
    return;
  }
  if (e.key >= '0' && e.key <= '9') press(e.key);
  else if (e.key === ',' || e.key === '.') press(',');
  else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
  else if (e.key === 'Enter') press('ok');
});

/* ---------- chrono ---------- */

let timer = null;
function renderHud() {
  const t = Math.ceil(G.left);
  $('time').textContent = t;
  $('time').classList.toggle('low', t <= 10);
  $('bar').value = Math.round(G.left / duration * 1000);
  $('bar').classList.toggle('low', t <= 10);
}
function tick() {
  G.left -= 0.1;
  if (G.left <= 0) { G.left = 0; renderHud(); finish(); return; }
  renderHud();
}

function begin(queue) {
  reset(queue);
  G.running = true;
  $('setup').classList.add('hide');
  $('over').classList.add('hide');
  $('who').classList.add('hide');
  $('play').classList.remove('hide');
  $('score').textContent = '0';
  paintBumpers(); paintLevel(false); renderHud(); nextQ();
  clearInterval(timer);
  timer = setInterval(tick, 100);
}

function finish() {
  G.running = false;
  clearInterval(timer);
  $('play').classList.add('hide');
  $('over').classList.remove('hide');

  const acc = G.total ? Math.round(G.good / G.total * 100) : 0;
  const times = G.log.filter((l) => l.ok).map((l) => l.s);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  $('finalScore').textContent = G.score;
  $('sGood').textContent = G.good;
  $('sAcc').textContent = acc + '%';
  $('sSpeed').textContent = fr(Math.round(avg * 10) / 10) + 's';

  const rec = records[player.name] = records[player.name] || {};
  const key = mode + ':' + diff;
  const isRecord = G.total > 0 && G.score > (rec[key] || 0);
  if (!G.queue) {
    rec[key] = Math.max(rec[key] || 0, G.score);
    saveRecords();
  }
  $('finalCap').textContent = G.queue
    ? 'points · rattrapage des erreurs'
    : isRecord
      ? 'NOUVEAU RECORD · palier ' + G.top
      : 'points · record ' + DIFF_NAME[diff] + ' : ' + (rec[key] || 0) + ' · palier ' + G.top;
  if (isRecord && !G.queue) sUp();

  const tags = $('chalTags');
  tags.replaceChildren();
  [
    [FAM[mode] || mode, true],
    [DIFF_NAME[diff], true],
    ['palier ' + G.top + '/' + R().max, false],
    [duration < 120 ? duration + ' s' : '2 min', false],
    [G.total + (G.total > 1 ? ' questions' : ' question'), false]
  ].forEach(([txt, hi]) => {
    const s = document.createElement('span');
    s.textContent = txt;
    if (hi) s.className = 'hi';
    tags.appendChild(s);
  });

  const byFam = {};
  G.log.forEach((l) => {
    const f = l.fam || '—';
    byFam[f] = byFam[f] || { ok: 0, n: 0, t: 0 };
    byFam[f].n++; byFam[f].t += l.s;
    if (l.ok) byFam[f].ok++;
  });
  const fl = $('famList');
  fl.replaceChildren();
  Object.entries(byFam).sort((a, b) => b[1].n - a[1].n).forEach(([f, v]) => {
    const pct = Math.round(v.ok / v.n * 100);
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = f;
    const b = document.createElement('b');
    b.className = pct >= 90 ? 'ok' : pct >= 70 ? 'mid' : 'ko';
    b.append(document.createTextNode(v.ok + '/' + v.n + ' '));
    const dim = document.createElement('span');
    dim.className = 'dim-sm';
    dim.textContent = '· ' + fr(Math.round(v.t / v.n * 10) / 10) + ' s';
    b.append(dim);
    li.append(name, b);
    fl.appendChild(li);
  });

  FX.clear();
  const cb = $('celeb');
  cb.className = 'celeb hide';
  if (G.total >= 8) {
    const tier = acc >= 95 ? { cls: '', icon: '🎆', fx: 'feu', title: 'Feu d’artifice !' }
      : acc >= 90 ? { cls: 'arg', icon: '🌟', fx: 'etoiles', title: 'Pluie d’étoiles !' }
        : acc >= 80 ? { cls: 'bro', icon: '🎉', fx: 'confettis', title: 'Confettis !' }
          : null;
    if (tier) {
      cb.classList.remove('hide');
      if (tier.cls) cb.classList.add(tier.cls);
      $('celebIcon').textContent = tier.icon;
      $('celebTitle').textContent = tier.title;
      $('celebSub').textContent = acc + ' % de réussite';
      FX.play(tier.fx, tier.fx === 'feu' ? 3400 : 2000);
      if (tier.fx === 'feu') sFanfare(); else sUp();
    }
  }

  let msg;
  if (G.total === 0) msg = 'Rien de joué cette fois. On réessaie ?';
  else if (acc >= 90 && avg < 3) msg = 'Rapide et juste, ' + player.name + '. Rien à dire.';
  else if (acc >= 90) msg = 'Presque tout juste, ' + player.name + '. Maintenant, plus vite.';
  else if (acc >= 70) msg = 'Bonne manche. Regarde la liste en dessous et relance.';
  else msg = 'On relit les définitions, ' + player.name + ', puis on relance une manche.';
  if (acc >= 90 && avg < 3.5 && diff !== 'expert') msg += ' Essaie le niveau au-dessus.';
  if (G.best >= 5) msg += ' Meilleure série : ' + G.best + ' d’affilée.';
  $('praise').textContent = msg;

  const wrong = G.log.filter((l) => !l.ok);
  const slow = G.log.filter((l) => l.ok).sort((a, b) => b.s - a.s).slice(0, 3).filter((l) => l.s > 5);
  const list = $('recapList');
  list.replaceChildren();
  wrong.slice(0, 6).forEach((l) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'stem';
    span.append(document.createTextNode(l.t + ' → '));
    const b = document.createElement('b');
    b.textContent = l.a;
    span.append(b);
    if (l.given && l.given !== l.a) {
      const s = document.createElement('s');
      s.textContent = ' ' + l.given;
      span.append(s);
    }
    li.append(span);
    list.appendChild(li);
  });
  slow.forEach((l) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'stem';
    span.append(document.createTextNode(l.t + ' → '));
    const b = document.createElement('b');
    b.textContent = l.a;
    span.append(b);
    const em = document.createElement('em');
    em.textContent = fr(Math.round(l.s * 10) / 10) + ' s';
    li.append(span, em);
    list.appendChild(li);
  });
  $('recap').classList.toggle('hide', list.children.length === 0);

  misses = wrong.map((l) => l.item);
  $('retry').classList.toggle('hide', misses.length === 0);
  $('retry').textContent = 'Rejouer les erreurs (' + misses.length + ')';
}

/* ---------- navigation ---------- */

$('toSetup').addEventListener('click', () => {
  const n = $('pname').value.trim();
  player.name = n === '' ? 'Championne' : n.charAt(0).toUpperCase() + n.slice(1);
  savePlayer();
  $('tagline').textContent = 'Le chrono tourne. À toi de jouer, ' + player.name + ' !';
  $('who').classList.add('hide');
  $('setup').classList.remove('hide');
});
$('pname').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('toSetup').click(); });
$('changePlayer').addEventListener('click', () => {
  $('setup').classList.add('hide');
  $('who').classList.remove('hide');
});

function chipGroup(id, assign) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    [...$(id).children].forEach((c) => c.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    assign(b.dataset);
  });
}
chipGroup('modes', (d) => { mode = d.mode; });
chipGroup('diffs', (d) => { diff = d.diff; });
chipGroup('durs', (d) => { duration = +d.dur; });

$('start').addEventListener('click', () => begin(null));
$('again').addEventListener('click', () => { FX.clear(); begin(null); });
$('retry').addEventListener('click', () => { FX.clear(); begin(misses); });
$('back').addEventListener('click', () => {
  FX.clear();
  $('over').classList.add('hide');
  $('setup').classList.remove('hide');
});
$('quit').addEventListener('click', () => { if (G.running) finish(); });

/* ---------- version ---------- */

function hardReload() {
  const go = () => location.reload();
  if (!navigator.serviceWorker) return go();
  navigator.serviceWorker.getRegistrations()
    .then((rs) => Promise.all(rs.map((r) => r.unregister())))
    .then(go)
    .catch(go);
}
$('reloadBtn').addEventListener('click', hardReload);
$('reloadLatest').addEventListener('click', hardReload);

async function checkVersion() {
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const j = await r.json();
    if (j.version && j.version !== APP_VERSION) $('updateBanner').classList.remove('hide');
  } catch { /* hors ligne */ }
}

$('verNum').textContent = APP_VERSION;
loadPersisted();
$('pname').value = player.name;
$('tagline').textContent = 'Le chrono tourne. À toi de jouer, ' + player.name + ' !';
reset(null);
checkVersion();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
