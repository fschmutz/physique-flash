import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateQuestion,
  createDealer,
  convert,
  shuffle,
  fr,
  FAM,
  MOVES,
  MOVE_KEYS,
  SITUATIONS,
  UNITS
} from '../js/generate.js';
import { expectedFromText, askedKind, askedUnit, num, unitKind } from './expected.mjs';

const MODES = ['traj', 'vitesse', 'conv'];
const LEVELS = [1, 2, 3, 4, 5];
const DIFFS = ['facile', 'moyen', 'expert'];

/** RNG graine : la couverture ne doit jamais dépendre de la chance. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function close(a, b) {
  return Math.abs(a - b) < 1e-6;
}

/** Toutes les questions d'une case mode / niveau, avec une graine fixe. */
function batch(mode, level, n, seed, extra = {}) {
  const random = mulberry32(seed);
  const out = [];
  for (let i = 0; i < n; i++) out.push(generateQuestion(level, { mode, random, ...extra }));
  return out;
}

/* ---------------- écriture des nombres ---------------- */

test('fr écrit les décimaux à la française', () => {
  assert.equal(fr(1.5), '1,5');
  assert.equal(fr(10), '10');
  assert.equal(fr(0.25), '0,25');
  assert.equal(fr(0.75), '0,75');
  assert.equal(fr(3600), '3600');
  assert.equal(fr(126 / 3.6), '35');
  assert.equal(fr(-0.0000001), '0');
});

/* ---------------- conversions ---------------- */

test('les conversions à savoir par cœur sont exactes', () => {
  assert.equal(convert(1, 'km', 'm'), 1000);
  assert.equal(convert(3.5, 'km', 'm'), 3500);
  assert.equal(convert(2500, 'm', 'km'), 2.5);
  assert.equal(convert(1, 'h', 's'), 3600);
  assert.equal(convert(0.5, 'h', 's'), 1800);
  assert.equal(convert(1, 'min', 's'), 60);
  assert.equal(convert(7, 'min', 's'), 420);
  assert.equal(convert(300, 's', 'min'), 5);
  assert.equal(convert(15, 'min', 'h'), 0.25);
  assert.equal(convert(30, 'min', 'h'), 0.5);
  assert.equal(convert(45, 'min', 'h'), 0.75);
  assert.equal(convert(60, 'min', 'h'), 1);
  assert.equal(convert(90, 'min', 'h'), 1.5);
  assert.equal(convert(36, 'km/h', 'm/s'), 10);
  assert.equal(convert(126, 'km/h', 'm/s'), 35);
  assert.equal(convert(10, 'm/s', 'km/h'), 36);
  assert.equal(convert(9.5, 'm/s', 'km/h'), 34.2);
});

test('convert refuse de mélanger les genres de grandeur', () => {
  assert.throws(() => convert(1, 'km', 's'));
  assert.throws(() => convert(1, 'h', 'm/s'));
  assert.throws(() => convert(1, 'km/h', 'km'));
});

test('UNITS et la table du test disent la même chose', () => {
  for (const u of Object.keys(UNITS)) {
    assert.equal(UNITS[u].kind, unitKind(u), u);
  }
});

/* ---------------- forme d'un item ---------------- */

/** Les invariants que l'interface suppose, item par item. */
function checkItem(q, mode) {
  assert.ok(typeof q.t === 'string' && q.t.length > 0, 'énoncé vide');
  assert.ok(q.t.length <= 80, 'énoncé trop long pour la carte : ' + q.t);
  assert.ok(Number.isFinite(q.a), 'réponse non finie : ' + q.t);
  assert.ok(q.tag && q.fam && q.famKey, 'étiquettes manquantes : ' + q.t);
  if (mode !== 'mix') assert.equal(q.famKey, mode, q.t);
  assert.equal(q.fam, FAM[q.famKey]);

  if (q.choices) {
    const n = q.choices.length;
    assert.ok(n >= 2 && n <= 4, n + ' options : ' + q.t);
    const labels = q.choices.map((c) => c.label);
    assert.equal(new Set(labels).size, n, 'options en double : ' + q.t + ' → ' + labels.join(' | '));
    assert.equal(new Set(q.choices.map((c) => c.v)).size, n, 'valeurs en double : ' + q.t);
    const good = q.choices.filter((c) => close(c.v, q.a));
    assert.equal(good.length, 1, good.length + ' bonnes réponses : ' + q.t);
    assert.equal(good[0].label, q.aLabel, q.t);
    labels.forEach((l) => assert.ok(l.length > 0 && l.length <= 34, 'option trop longue : ' + l));
    return;
  }

  /* Réponse tapée : l'énoncé doit suffire à la recalculer. */
  assert.equal(q.aLabel, fr(q.a), q.t);
  const exp = expectedFromText(q.t);
  assert.ok(exp !== null, 'énoncé non relisible : ' + q.t);
  assert.ok(close(exp, q.a), q.t + ' → attendu ' + exp + ', obtenu ' + q.a);
  assert.ok(fr(q.a).replace('-', '').replace(',', '').length <= 6, 'réponse trop longue à taper : ' + q.t);
  assert.ok(q.a >= 0, 'réponse négative : ' + q.t);
}

for (const mode of MODES) {
  test('la réponse correspond à l’énoncé : ' + mode, () => {
    let n = 0;
    for (const level of LEVELS) {
      for (const diff of DIFFS) {
        for (const q of batch(mode, level, 120, level * 7919 + diff.length, { diff })) {
          checkItem(q, mode);
          n++;
        }
      }
    }
    assert.ok(n >= 1800, n);
  });
}

test('le mélange reste sur une famille connue', () => {
  for (const q of batch('mix', 3, 400, 4242)) {
    assert.ok(MODES.includes(q.famKey), q.famKey);
    checkItem(q, 'mix');
  }
});

test('un mode inconnu retombe sur une famille connue', () => {
  for (const q of batch('nawak', 2, 100, 7)) assert.ok(MODES.includes(q.famKey), q.famKey);
});

/* ---------------- QCM ---------------- */

test('toute question à choix a exactement une bonne option', () => {
  let mcqs = 0;
  for (const mode of MODES) {
    for (const level of LEVELS) {
      for (const q of batch(mode, level, 300, level * 31 + mode.length)) {
        if (!q.choices) continue;
        mcqs++;
        const good = q.choices.filter((c) => c.v === q.a);
        assert.equal(good.length, 1, q.t);
        assert.equal(good[0].label, q.aLabel, q.t);
        assert.ok(q.choices.every((c) => Number.isInteger(c.v) && c.v >= 0 && c.v < q.choices.length));
      }
    }
  }
  assert.ok(mcqs > 1000, mcqs);
});

test('les options ne sortent pas toujours dans le même ordre', () => {
  const firsts = new Set();
  const random = mulberry32(99);
  for (let i = 0; i < 60; i++) {
    const q = generateQuestion(1, { mode: 'traj', kind: 'path', random });
    firsts.add(q.choices[0].label);
  }
  assert.ok(firsts.size >= 3, 'options figées : ' + [...firsts].join(' | '));
});

test('shuffle garde exactement les mêmes éléments', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = shuffle(src, mulberry32(5));
  assert.deepEqual(out.slice().sort((a, b) => a - b), src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('la trajectoire ne se joue qu’au doigt', () => {
  for (const level of LEVELS) {
    for (const q of batch('traj', level, 200, level * 13)) {
      assert.ok(q.choices, 'pas d’options : ' + q.t);
    }
  }
});

/* ---------------- le fond des QCM ---------------- */

const BY_LONG = new Map(SITUATIONS.map((s) => [s.long, s]));
const BY_SHORT = new Map(SITUATIONS.map((s) => [s.short, s]));

test('chaque situation est classée comme dans le cours', () => {
  let n = 0;
  for (const level of LEVELS) {
    for (const q of batch('traj', level, 600, level * 123)) {
      const m = /^(.+) : quel mouvement \?$/.exec(q.t);
      if (!m) continue;
      const s = BY_LONG.get(m[1]);
      assert.ok(s, 'situation inconnue : ' + m[1]);
      assert.equal(q.aLabel, MOVES[s.move].label, q.t);
      n++;
    }
  }
  assert.ok(n > 500, n);
});

test('la forme de la trajectoire et le nom du mouvement vont ensemble', () => {
  for (const level of LEVELS) {
    for (const q of batch('traj', level, 400, level * 321)) {
      let m = /^Mouvement (.+) : sa trajectoire est…$/.exec(q.t);
      if (m) {
        const key = MOVE_KEYS.find((k) => MOVES[k].label === m[1]);
        assert.ok(key, q.t);
        assert.equal(q.aLabel, MOVES[key].path, q.t);
      }
      m = /^La trajectoire est (.+)\. Le mouvement est…$/.exec(q.t);
      if (m) {
        const key = MOVE_KEYS.find((k) => MOVES[k].path === m[1]);
        assert.ok(key, q.t);
        assert.equal(q.aLabel, MOVES[key].label, q.t);
      }
    }
  }
});

test('« quelle situation » et « intrus » désignent la bonne', () => {
  let found = 0;
  for (const level of [2, 3, 4, 5]) {
    for (const q of batch('traj', level, 600, level * 456)) {
      let m = /^Quelle situation est un mouvement (.+) \?$/.exec(q.t);
      if (m) {
        const key = MOVE_KEYS.find((k) => MOVES[k].label === m[1]);
        assert.equal(BY_SHORT.get(q.aLabel).move, key, q.t);
        q.choices.filter((c) => c.label !== q.aLabel)
          .forEach((c) => assert.notEqual(BY_SHORT.get(c.label).move, key, q.t + ' → ' + c.label));
        found++;
      }
      m = /^Intrus : quelle situation n’est pas (.+) \?$/.exec(q.t);
      if (m) {
        const key = MOVE_KEYS.find((k) => MOVES[k].label === m[1]);
        assert.notEqual(BY_SHORT.get(q.aLabel).move, key, q.t);
        q.choices.filter((c) => c.label !== q.aLabel)
          .forEach((c) => assert.equal(BY_SHORT.get(c.label).move, key, q.t + ' → ' + c.label));
        found++;
      }
    }
  }
  assert.ok(found > 200, found);
});

test('la comparaison de deux vitesses désigne vraiment la plus rapide', () => {
  const random = mulberry32(606);
  let n = 0;
  for (let i = 0; i < 600; i++) {
    const q = generateQuestion(5, { mode: 'vitesse', kind: 'plusvite', random });
    const m = /^Qui va le plus vite : (.+) ou (.+) \?$/.exec(q.t);
    if (!m) continue;
    const ms = (label) => {
      const p = /^([\d,]+) (km\/h|m\/s)$/.exec(label);
      return num(p[1]) * (p[2] === 'km/h' ? 1 / 3.6 : 1);
    };
    const faster = ms(m[1]) > ms(m[2]) ? m[1] : m[2];
    assert.equal(q.aLabel, faster, q.t);
    assert.deepEqual(q.choices.map((c) => c.label).sort(), [m[1], m[2]].sort(), q.t);
    n++;
  }
  assert.ok(n > 400, n);
});

test('« 126 km/h, ça veut dire » rend bien 126 km en 1 h', () => {
  const random = mulberry32(707);
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const q = generateQuestion(4, { mode: 'vitesse', kind: 'sens', random });
    const m = /^(.+) (km\/h|m\/s|km\/s), ça veut dire…$/.exec(q.t);
    assert.ok(m, q.t);
    const per = { 'km/h': ['km', 'h'], 'm/s': ['m', 's'], 'km/s': ['km', 's'] }[m[2]];
    assert.equal(q.aLabel, m[1] + ' ' + per[0] + ' en 1 ' + per[1], q.t);
    seen.add(q.t);
  }
  assert.equal(seen.size, 3, [...seen].join(' | '));
});

/* ---------------- unités ---------------- */

test('l’unité demandée est celle de la réponse', () => {
  for (const mode of ['vitesse', 'conv']) {
    for (const level of LEVELS) {
      for (const q of batch(mode, level, 200, level * 101)) {
        if (q.choices) continue;
        const unit = askedUnit(q.t);
        const kind = askedKind(q.t);
        assert.ok(unit && kind, q.t);
        assert.equal(unitKind(unit), kind, q.t);
        if (/Vitesse en/.test(q.t)) assert.equal(kind, 'v', q.t);
        if (/Distance en/.test(q.t)) assert.equal(kind, 'd', q.t);
        if (/Durée en/.test(q.t)) assert.equal(kind, 't', q.t);
      }
    }
  }
});

test('la vitesse ne se demande qu’en m/s ou en km/h', () => {
  let n = 0;
  for (const level of LEVELS) {
    for (const q of batch('vitesse', level, 300, level * 77)) {
      if (q.choices) continue;
      const m = /\. (Vitesse|Distance|Durée) en (km\/h|m\/s|km|m|h|min|s) \?$/.exec(q.t);
      assert.ok(m, q.t);
      if (m[1] === 'Vitesse') { assert.ok(['m/s', 'km/h'].includes(m[2]), q.t); n++; }
      if (m[1] === 'Distance') assert.ok(['km', 'm'].includes(m[2]), q.t);
      if (m[1] === 'Durée') assert.ok(['h', 'min', 's'].includes(m[2]), q.t);
    }
  }
  assert.ok(n > 100, n);
});

test('une durée en minutes se convertit avant de diviser', () => {
  const random = mulberry32(31337);
  let seen = 0;
  for (let i = 0; i < 2000; i++) {
    const q = generateQuestion(5, { mode: 'vitesse', kind: 'vkmh', random });
    const m = / : (\d+(?:,\d+)?) km en (\d+) min\. Vitesse en km\/h \?$/.exec(q.t);
    if (!m) continue;
    seen++;
    assert.ok(close(q.a, num(m[1]) / (num(m[2]) / 60)), q.t + ' → ' + q.a);
  }
  assert.ok(seen > 50, 'jamais de durée en minutes : ' + seen);
});

test('les conversions tapées couvrent les six passages du cours', () => {
  const pairs = new Set();
  const random = mulberry32(8);
  for (let i = 0; i < 4000; i++) {
    const q = generateQuestion(5, { mode: 'conv', kind: 'calc', random });
    const m = /^-?[\d,]+ (\S+) = \? (\S+)$/.exec(q.t);
    assert.ok(m, q.t);
    pairs.add(m[1] + '→' + m[2]);
  }
  for (const p of ['km→m', 'm→km', 'h→s', 'min→s', 'min→h', 'km/h→m/s', 'm/s→km/h']) {
    assert.ok(pairs.has(p), 'jamais tiré : ' + p);
  }
});

test('km/h → m/s n’arrive qu’au niveau 4', () => {
  for (const level of [1, 2, 3]) {
    for (const q of batch('conv', level, 400, level * 55, { kind: 'calc' })) {
      assert.ok(!/km\/h|m\/s/.test(q.t), 'trop tôt : ' + q.t + ' (niveau ' + level + ')');
    }
  }
});

/* ---------------- pas de doublons ---------------- */

test('le distributeur ne répète pas un énoncé de mémoire', () => {
  for (const mode of [...MODES, 'mix']) {
    for (const level of LEVELS) {
      const memory = 10;
      const dealer = createDealer({ mode, memory, random: mulberry32(level * 991 + mode.length) });
      const drawn = [];
      for (let i = 0; i < 300; i++) {
        const q = dealer.next(level);
        const window = drawn.slice(-memory);
        assert.equal(window.indexOf(q.t), -1, 'répétition : ' + q.t + ' (' + mode + ' L' + level + ')');
        drawn.push(q.t);
      }
    }
  }
});

test('chaque case mode / niveau a de quoi varier', () => {
  for (const mode of MODES) {
    for (const level of LEVELS) {
      const stems = batch(mode, level, 400, level * 17 + mode.length).map((q) => q.t);
      const uniq = new Set(stems);
      assert.ok(uniq.size >= 40, mode + ' L' + level + ' : seulement ' + uniq.size + ' énoncés');
      const counts = {};
      stems.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
      const top = Math.max(...Object.values(counts));
      assert.ok(top <= stems.length * 0.1, mode + ' L' + level + ' : un énoncé revient ' + top + ' fois');
    }
  }
});

test('aucune situation n’est écrite deux fois', () => {
  assert.equal(new Set(SITUATIONS.map((s) => s.long)).size, SITUATIONS.length);
  assert.equal(new Set(SITUATIONS.map((s) => s.short)).size, SITUATIONS.length);
});

/* ---------------- couverture du cours ---------------- */

test('les quatre mouvements du cours sont tous jouables', () => {
  const asAnswer = new Set();
  for (const level of LEVELS) {
    for (const q of batch('traj', level, 400, level * 7)) asAnswer.add(q.aLabel);
  }
  for (const key of MOVE_KEYS) {
    assert.ok(asAnswer.has(MOVES[key].label), 'jamais la bonne réponse : ' + MOVES[key].label);
  }
});

test('chaque situation a un mouvement du cours et un libellé de bouton court', () => {
  for (const s of SITUATIONS) {
    assert.ok(MOVE_KEYS.includes(s.move), s.long);
    assert.ok(s.short.length <= 30, 'libellé trop long : ' + s.short);
    assert.ok(s.long.length >= s.short.length);
  }
  for (const key of MOVE_KEYS) {
    const n = SITUATIONS.filter((s) => s.move === key).length;
    assert.ok(n >= 4, key + ' : seulement ' + n + ' situations');
  }
});

test('les deux activités et les conversions sont toutes atteintes par le mélange', () => {
  const fams = new Set(batch('mix', 3, 600, 2024).map((q) => q.famKey));
  assert.deepEqual([...fams].sort(), ['conv', 'traj', 'vitesse']);
});

test('la formule V = d / t est interrogée dans les trois sens', () => {
  const tags = new Set();
  for (const level of LEVELS) {
    for (const q of batch('vitesse', level, 400, level * 3 + 1)) tags.add(q.tag);
  }
  for (const tag of ['V = d / t', 'd = V × t', 't = d / V', 'Unités', 'Formule', 'Matériel']) {
    assert.ok(tags.has(tag), 'jamais vu : ' + tag);
  }
});
