/** Générateurs de questions de physique 6ème. Navigateur + Node (node --test). Pas de DOM. */

/** Écriture française d'un nombre. Gomme le bruit des flottants, garde 4 décimales utiles. */
export function fr(n) {
  const r = Math.round(n * 1e6) / 1e6;
  return (r === 0 ? 0 : r).toString().replace('.', ',');
}

export function rint(a, b, rnd = Math.random) {
  return Math.floor(rnd() * (b - a + 1)) + a;
}

export function pick(arr, rnd = Math.random) {
  return arr[Math.floor(rnd() * arr.length)];
}

/** Mélange une copie du tableau. Les options d'un QCM ne doivent jamais arriver dans l'ordre. */
export function shuffle(arr, rnd = Math.random) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

/** Tire n éléments distincts. */
function sample(arr, n, rnd = Math.random) {
  return shuffle(arr, rnd).slice(0, n);
}

export const FAM_KEYS = ['traj', 'vitesse', 'conv', 'mix'];

export const FAM = {
  traj: 'Trajectoires',
  vitesse: 'Vitesse V = d / t',
  conv: 'Conversions',
  mix: 'Mélange'
};

/* ------------------------------------------------------------------ *
 * Fabrique d'items
 * ------------------------------------------------------------------ */

/**
 * Question tapée au pavé : la réponse est un nombre.
 * `a` est la valeur attendue, comparée à 1e-9 près.
 */
function typed(t, a, meta) {
  return { t, a, aLabel: fr(a), choices: null, ...meta };
}

/**
 * Question à toucher : options mélangées, une seule vaut la réponse.
 * `v` est l'index de l'option après mélange, `a` l'index de la bonne.
 * Les doublons de libellé sont retirés avant le mélange : deux boutons
 * identiques rendraient la question injouable.
 */
function mcq(t, ok, ko, meta, rnd = Math.random) {
  const labels = [ok];
  for (const k of ko) if (labels.indexOf(k) === -1) labels.push(k);
  const choices = shuffle(labels, rnd).map((label, i) => ({ v: i, label }));
  const good = choices.find((c) => c.label === ok);
  return { t, a: good.v, aLabel: ok, choices, ...meta };
}

/* ------------------------------------------------------------------ *
 * Activité 1 — Les trajectoires à Marseille
 * ------------------------------------------------------------------ */

export const MOVES = {
  rectiligne: { label: 'rectiligne', path: 'une droite' },
  circulaire: { label: 'circulaire', path: 'un cercle ou un arc de cercle' },
  quelconque: { label: 'quelconque (curviligne)', path: 'ni une droite, ni un cercle' },
  mixte: { label: 'rectiligne puis circulaire', path: 'une droite, puis un arc de cercle' }
};

export const MOVE_KEYS = ['rectiligne', 'circulaire', 'quelconque', 'mixte'];

/** `long` part dans l'énoncé, `short` sert de libellé de bouton. */
export const SITUATIONS = [
  { long: 'Le ferry-boat traverse le Vieux-Port tout droit', short: 'Le ferry, tout droit', move: 'rectiligne' },
  { long: 'La bille roule le long de la règle', short: 'La bille sur la règle', move: 'rectiligne' },
  { long: "L'ascenseur monte jusqu'au 10e étage", short: "L'ascenseur qui monte", move: 'rectiligne' },
  { long: 'Le tram file tout droit sur le boulevard', short: 'Le tram sur le boulevard', move: 'rectiligne' },
  { long: 'Une goutte de pluie tombe tout droit sur la vitre', short: 'La goutte sur la vitre', move: 'rectiligne' },
  { long: 'Les valises avancent sur le tapis roulant', short: 'Les valises sur le tapis', move: 'rectiligne' },
  { long: 'Le ballon roule droit vers le but du Vélodrome', short: 'Le ballon qui roule droit', move: 'rectiligne' },
  { long: 'Paloma plonge tout droit du plongeoir', short: 'Le plongeon tout droit', move: 'rectiligne' },
  { long: 'Le nageur file droit dans sa ligne d’eau', short: 'Le nageur dans sa ligne', move: 'rectiligne' },
  { long: 'Le ballon de basket tombe droit dans le panier', short: 'Le ballon dans le panier', move: 'rectiligne' },
  { long: 'La trottinette descend tout droit la Canebière', short: 'La trottinette qui descend', move: 'rectiligne' },

  { long: 'Une nacelle de la grande roue de Borély', short: 'La nacelle de la grande roue', move: 'circulaire' },
  { long: "L'objet au bout de la ficelle qu'on fait tourner", short: 'Le bout de la ficelle', move: 'circulaire' },
  { long: "La grande aiguille de l'horloge de Saint-Charles", short: "L'aiguille de l'horloge", move: 'circulaire' },
  { long: 'Un cheval de bois du manège du Vieux-Port', short: 'Le cheval du manège', move: 'circulaire' },
  { long: 'Le bout de la pale du ventilateur du gymnase', short: 'La pale du ventilateur', move: 'circulaire' },
  { long: 'Une dent du pédalier du vélo qui tourne', short: 'La dent du pédalier', move: 'circulaire' },
  { long: 'Le seau que Paloma fait tourner à bout de bras', short: 'Le seau à bout de bras', move: 'circulaire' },
  { long: 'Un point du disque qui tourne dans le lecteur', short: 'Un point du disque', move: 'circulaire' },
  { long: 'La Terre tourne autour du Soleil', short: 'La Terre autour du Soleil', move: 'circulaire' },
  { long: 'Le bout de l’hélice du bateau qui tourne', short: 'Le bout de l’hélice', move: 'circulaire' },
  { long: 'La petite aiguille de la montre de Paloma', short: 'L’aiguille de la montre', move: 'circulaire' },

  { long: 'Les goélands tournoient au-dessus du Vieux-Port', short: 'Les goélands dans le ciel', move: 'quelconque' },
  { long: 'La boule de pétanque lancée en cloche au Prado', short: 'La boule en cloche', move: 'quelconque' },
  { long: "Le ballon tiré en lucarne par l'attaquant de l'OM", short: 'Le ballon en lucarne', move: 'quelconque' },
  { long: "Une feuille tombe de l'arbre en zigzag", short: 'La feuille qui tombe', move: 'quelconque' },
  { long: 'Le scooter se faufile dans les ruelles du Panier', short: 'Le scooter dans le Panier', move: 'quelconque' },
  { long: 'Une abeille butine de fleur en fleur', short: "L'abeille qui butine", move: 'quelconque' },
  { long: 'Le kitesurfeur saute de vague en vague', short: 'Le kitesurfeur sur les vagues', move: 'quelconque' },
  { long: 'Le chien court après la balle sur la plage', short: 'Le chien après la balle', move: 'quelconque' },
  { long: 'La mouette plonge vers un morceau de pain', short: 'La mouette qui plonge', move: 'quelconque' },
  { long: 'Le cerf-volant danse dans le mistral', short: 'Le cerf-volant au mistral', move: 'quelconque' },
  { long: 'Le skateur enchaîne les courbes du skatepark', short: 'Le skateur au skatepark', move: 'quelconque' },

  { long: "Le tram descend l'avenue, puis tourne au rond-point", short: 'Le tram puis le rond-point', move: 'mixte' },
  { long: 'La voiture roule droit, puis prend le rond-point du Prado', short: 'La voiture au rond-point', move: 'mixte' },
  { long: 'Le vélo file sur la Corniche, puis prend le virage', short: 'Le vélo puis le virage', move: 'mixte' },
  { long: 'Paloma court droit, puis tourne autour du plot', short: 'Courir droit puis tourner' , move: 'mixte' },
  { long: 'Le bus 83 roule droit, puis tourne autour de la place', short: 'Le bus puis la place', move: 'mixte' }
];

const DEFS = [
  {
    q: "La trajectoire d'un objet, c'est…",
    ok: "le chemin suivi par l'objet",
    ko: ["la vitesse de l'objet", 'la durée du parcours', "le poids de l'objet"]
  },
  {
    q: 'Pour tracer une trajectoire, on relie…',
    ok: 'toutes les positions successives',
    ko: ['les vitesses mesurées', 'les durées mesurées', 'les deux bouts de la règle']
  },
  {
    q: 'Un mouvement circulaire, sa trajectoire peut être…',
    ok: 'un arc de cercle',
    ko: ['une droite', 'un zigzag', 'une ligne brisée']
  },
  {
    q: 'Une trajectoire quelconque, c’est une trajectoire…',
    ok: 'ni droite, ni circulaire',
    ko: ['toujours droite', 'toujours circulaire', 'toujours en zigzag']
  },
  {
    q: 'Le feutre magique fixé sur un objet qui bouge trace…',
    ok: 'sa trajectoire',
    ko: ['sa vitesse', 'sa durée', 'sa masse']
  }
];

const TRAJ_KINDS = {
  1: ['move', 'move', 'move', 'path', 'fromPath', 'def'],
  2: ['move', 'move', 'path', 'fromPath', 'def', 'which'],
  3: ['move', 'move4', 'path', 'fromPath', 'def', 'which'],
  4: ['move4', 'move4', 'fromPath', 'which', 'intrus', 'def', 'path'],
  5: ['move4', 'move4', 'fromPath', 'which', 'intrus', 'intrus', 'def']
};

const PLAIN = SITUATIONS.filter((s) => s.move !== 'mixte');
const PLAIN_KEYS = ['rectiligne', 'circulaire', 'quelconque'];

function trajQuestion(level, opt = {}) {
  const rnd = opt.random || Math.random;
  const L = Math.min(5, Math.max(1, level | 0));
  const kind = opt.kind || pick(TRAJ_KINDS[L], rnd);
  const meta = { fam: FAM.traj, famKey: 'traj' };

  if (kind === 'move' || kind === 'move4') {
    const four = kind === 'move4';
    const s = pick(four ? SITUATIONS : PLAIN, rnd);
    const others = (four ? MOVE_KEYS : PLAIN_KEYS).filter((k) => k !== s.move);
    const ko = sample(others, four ? 3 : 2, rnd).map((k) => MOVES[k].label);
    return mcq(s.long + ' : quel mouvement ?', MOVES[s.move].label, ko, { ...meta, tag: 'Mouvement' }, rnd);
  }

  if (kind === 'path') {
    const key = pick(L >= 3 ? MOVE_KEYS : PLAIN_KEYS, rnd);
    const ko = MOVE_KEYS.filter((k) => k !== key).map((k) => MOVES[k].path);
    return mcq(
      'Mouvement ' + MOVES[key].label + ' : sa trajectoire est…',
      MOVES[key].path, ko, { ...meta, tag: 'Trajectoire' }, rnd
    );
  }

  if (kind === 'fromPath') {
    const key = pick(L >= 3 ? MOVE_KEYS : PLAIN_KEYS, rnd);
    const ko = MOVE_KEYS.filter((k) => k !== key).map((k) => MOVES[k].label);
    return mcq(
      'La trajectoire est ' + MOVES[key].path + '. Le mouvement est…',
      MOVES[key].label, ko, { ...meta, tag: 'Trajectoire' }, rnd
    );
  }

  if (kind === 'which') {
    const key = pick(L >= 4 ? MOVE_KEYS : PLAIN_KEYS, rnd);
    const ok = pick(SITUATIONS.filter((s) => s.move === key), rnd);
    const ko = sample(SITUATIONS.filter((s) => s.move !== key), 3, rnd).map((s) => s.short);
    return mcq(
      'Quelle situation est un mouvement ' + MOVES[key].label + ' ?',
      ok.short, ko, { ...meta, tag: 'Mouvement' }, rnd
    );
  }

  /* L'intrus ne doit jamais être une situation mixte : « pas rectiligne »
     serait discutable pour un tram qui part droit avant de tourner. */
  if (kind === 'intrus') {
    const key = pick(PLAIN_KEYS, rnd);
    const same = sample(SITUATIONS.filter((s) => s.move === key), 3, rnd).map((s) => s.short);
    const odd = pick(PLAIN.filter((s) => s.move !== key), rnd);
    return mcq(
      'Intrus : quelle situation n’est pas ' + MOVES[key].label + ' ?',
      odd.short, same, { ...meta, tag: 'Intrus' }, rnd
    );
  }

  const d = pick(DEFS, rnd);
  return mcq(d.q, d.ok, d.ko, { ...meta, tag: 'Définition' }, rnd);
}

/* ------------------------------------------------------------------ *
 * Activité 2 — Vitesse au stade Vélodrome : V = d / t
 * ------------------------------------------------------------------ */

const SUJ_MS = [
  'Un coureur au stade', 'Paloma sur la piste', 'Le sprinteur de l’OM',
  'Le ballon sur la pelouse', 'Un nageur au bassin', 'Le chien sur la plage',
  'Paloma en rollers', 'La boule de pétanque'
];
const SUJ_KMH = [
  'Le bus 83', 'Le tram 2', 'Le ferry du Frioul', 'Un cycliste sur la Corniche',
  'La voiture sur l’autoroute', 'Le TER vers Aubagne', 'Le scooter de la Canebière',
  'Le car des supporters'
];

/** Couples (vitesse, durée) qui tombent juste : la distance reste un nombre entier. */
function msTriple(L, rnd) {
  const vs = L <= 1 ? [2, 3, 4, 5, 6, 8, 10]
    : L === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
      : [1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 9, 10, 12, 15];
  const ts = L <= 1 ? [2, 4, 5, 10]
    : L === 2 ? [4, 5, 8, 10, 20, 25]
      : [4, 5, 8, 10, 12, 20, 25, 30, 40, 50, 60];
  for (let i = 0; i < 60; i++) {
    const v = pick(vs, rnd), t = pick(ts, rnd), d = v * t;
    if (Number.isInteger(d) && d >= 8 && d <= 1500) return { v, t, d };
  }
  return { v: 5, t: 10, d: 50 };
}

/** Idem en km/h. `tMin` non nul quand la durée s'affiche en minutes. */
function kmhTriple(L, rnd) {
  const vs = L <= 1 ? [4, 5, 6, 8, 10, 12, 15, 20, 30]
    : L === 2 ? [4, 6, 8, 10, 12, 15, 18, 20, 24, 25, 30, 40, 50, 60]
      : [4, 6, 8, 10, 12, 16, 20, 24, 30, 36, 40, 48, 50, 60, 72, 80, 90, 100, 120];
  const hs = L <= 1 ? [1, 2, 3] : L === 2 ? [1, 2, 3, 4, 0.5] : [0.5, 1, 1.5, 2, 2.5, 3, 4];
  const mins = [15, 30, 45, 60, 90, 120];
  const useMin = L >= 3 && rnd() < 0.45;
  for (let i = 0; i < 60; i++) {
    const v = pick(vs, rnd);
    const tMin = useMin ? pick(mins, rnd) : 0;
    const t = useMin ? tMin / 60 : pick(hs, rnd);
    const d = Math.round(v * t * 1e6) / 1e6;
    if (Number.isInteger(d) && d >= 2 && d <= 600) return { v, t, d, tMin };
  }
  return { v: 30, t: 2, d: 60, tMin: 0 };
}

/** Les trois vitesses des documents de l'Activité 2. */
const VIT_FACTS = [
  { v: 126, show: '126', u: 'km/h' },
  { v: 9.5, show: '9,5', u: 'm/s' },
  { v: 300000, show: '300 000', u: 'km/s' }
];

const VIT_MCQ = [
  {
    q: 'Pour calculer une vitesse, je fais…',
    ok: 'distance ÷ durée',
    ko: ['durée ÷ distance', 'distance × durée', 'distance + durée'],
    tag: 'Formule'
  },
  {
    q: 'Pour trouver la distance, je fais…',
    ok: 'vitesse × durée',
    ko: ['vitesse ÷ durée', 'durée ÷ vitesse', 'vitesse + durée'],
    tag: 'Formule'
  },
  {
    q: 'Pour trouver la durée, je fais…',
    ok: 'distance ÷ vitesse',
    ko: ['vitesse ÷ distance', 'distance × vitesse', 'distance − vitesse'],
    tag: 'Formule'
  },
  {
    q: 'Des mètres divisés par des secondes : la vitesse est en…',
    ok: 'm/s',
    ko: ['km/h', 'm', 's'],
    tag: 'Unités'
  },
  {
    q: 'Des kilomètres divisés par des heures : la vitesse est en…',
    ok: 'km/h',
    ko: ['m/s', 'km', 'h'],
    tag: 'Unités'
  },
  {
    q: 'Pour calculer une vitesse, je dois mesurer…',
    ok: 'une distance et une durée',
    ko: ['une distance et une masse', 'deux durées', 'une masse et une durée'],
    tag: 'Protocole'
  },
  {
    q: 'Pour mesurer la durée du parcours, j’utilise…',
    ok: 'un chronomètre',
    ko: ['un décamètre', 'une balance', 'un thermomètre'],
    tag: 'Matériel'
  },
  {
    q: 'Pour mesurer la distance parcourue, j’utilise…',
    ok: 'un décamètre',
    ko: ['un chronomètre', 'une balance', 'un thermomètre'],
    tag: 'Matériel'
  },
  {
    q: 'Dans V = d / t, la lettre d est…',
    ok: 'la distance parcourue',
    ko: ['la durée du parcours', 'la vitesse moyenne', 'le nombre de départs'],
    tag: 'Formule'
  },
  {
    q: 'Dans V = d / t, la lettre t est…',
    ok: 'la durée du parcours',
    ko: ['la distance parcourue', 'la vitesse moyenne', 'la taille du terrain'],
    tag: 'Formule'
  }
];

const VIT_KINDS = {
  1: ['vms', 'vms', 'vkmh', 'mcq'],
  2: ['vms', 'vkmh', 'vkmh', 'mcq', 'sens'],
  3: ['vms', 'vkmh', 'dist', 'mcq', 'sens'],
  4: ['vms', 'vkmh', 'dist', 'duree', 'plusvite', 'sens', 'mcq'],
  5: ['vkmh', 'dist', 'duree', 'duree', 'plusvite', 'sens', 'mcq', 'vms']
};

function vitesseQuestion(level, opt = {}) {
  const rnd = opt.random || Math.random;
  const L = Math.min(5, Math.max(1, level | 0));
  const kind = opt.kind || pick(VIT_KINDS[L], rnd);
  const meta = { fam: FAM.vitesse, famKey: 'vitesse' };

  if (kind === 'vms') {
    const { v, t, d } = msTriple(L, rnd);
    return typed(
      pick(SUJ_MS, rnd) + ' : ' + fr(d) + ' m en ' + fr(t) + ' s. Vitesse en m/s ?',
      v, { ...meta, tag: 'V = d / t' }
    );
  }

  if (kind === 'vkmh') {
    const { v, t, d, tMin } = kmhTriple(L, rnd);
    const dur = tMin ? fr(tMin) + ' min' : fr(t) + ' h';
    return typed(
      pick(SUJ_KMH, rnd) + ' : ' + fr(d) + ' km en ' + dur + '. Vitesse en km/h ?',
      v, { ...meta, tag: 'V = d / t' }
    );
  }

  if (kind === 'dist') {
    const { v, t, d, tMin } = kmhTriple(L, rnd);
    const dur = tMin ? fr(tMin) + ' min' : fr(t) + ' h';
    return typed(
      pick(SUJ_KMH, rnd) + ' : ' + fr(v) + ' km/h pendant ' + dur + '. Distance en km ?',
      d, { ...meta, tag: 'd = V × t' }
    );
  }

  if (kind === 'duree') {
    const { v, t, d, tMin } = kmhTriple(L, rnd);
    const minutes = tMin || Math.round(t * 60);
    const wantMin = L >= 4 && Number.isInteger(minutes) && rnd() < 0.5;
    return typed(
      pick(SUJ_KMH, rnd) + ' : ' + fr(d) + ' km à ' + fr(v) + ' km/h. Durée en ' + (wantMin ? 'min' : 'h') + ' ?',
      wantMin ? minutes : Math.round(t * 1e6) / 1e6,
      { ...meta, tag: 't = d / V' }
    );
  }

  if (kind === 'plusvite') {
    const kmh = pick([18, 36, 45, 54, 72, 90, 108, 126], rnd);
    const ms = pick([5, 8, 9.5, 10, 12, 15, 20, 25, 30], rnd);
    const gap = Math.abs(kmh / 3.6 - ms);
    if (gap < 1) return vitesseQuestion(level, { ...opt, kind: 'sens' });
    const a = fr(kmh) + ' km/h', b = fr(ms) + ' m/s';
    const ok = kmh / 3.6 > ms ? a : b;
    /* Les deux vitesses sont dans l'énoncé : les options sont la question. */
    return mcq('Qui va le plus vite : ' + a + ' ou ' + b + ' ?', ok, [ok === a ? b : a], { ...meta, tag: 'Comparer' }, rnd);
  }

  if (kind === 'sens') {
    const f = pick(VIT_FACTS, rnd);
    const per = { 'km/h': ['km', 'h'], 'm/s': ['m', 's'], 'km/s': ['km', 's'] }[f.u];
    const ok = f.show + ' ' + per[0] + ' en 1 ' + per[1];
    const ko = [
      f.show + ' ' + per[0] + ' en 1 min',
      '1 ' + per[0] + ' en ' + f.show + ' ' + per[1],
      f.show + ' ' + per[1] + ' en 1 ' + per[0]
    ].filter((s) => s !== ok);
    return mcq(f.show + ' ' + f.u + ', ça veut dire…', ok, ko, { ...meta, tag: 'Unités' }, rnd);
  }

  const m = pick(VIT_MCQ, rnd);
  return mcq(m.q, m.ok, m.ko, { ...meta, tag: m.tag }, rnd);
}

/* ------------------------------------------------------------------ *
 * Conversions à savoir par cœur
 * ------------------------------------------------------------------ */

/** Chaque unité vers sa base : m pour les distances, s pour les durées, m/s pour les vitesses. */
export const UNITS = {
  m: { kind: 'd', base: 1 },
  km: { kind: 'd', base: 1000 },
  s: { kind: 't', base: 1 },
  min: { kind: 't', base: 60 },
  h: { kind: 't', base: 3600 },
  'm/s': { kind: 'v', base: 1 },
  'km/h': { kind: 'v', base: 1 / 3.6 }
};

/** Convertit une valeur d'une unité vers une autre du même genre. */
export function convert(value, from, to) {
  const a = UNITS[from], b = UNITS[to];
  if (!a || !b || a.kind !== b.kind) throw new Error('conversion impossible : ' + from + ' → ' + to);
  return Math.round(value * a.base / b.base * 1e6) / 1e6;
}

/** Les valeurs de départ qui donnent une réponse propre, par paire d'unités et par niveau. */
const CONV_ROWS = [
  { from: 'km', to: 'm', lvl: 1, vals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50] },
  { from: 'min', to: 's', lvl: 1, vals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30] },
  { from: 'h', to: 's', lvl: 1, vals: [1, 2, 3] },
  { from: 'm', to: 'km', lvl: 2, vals: [1000, 2000, 3000, 5000, 8000, 10000, 1500, 2500, 4500, 7500] },
  { from: 's', to: 'min', lvl: 2, vals: [60, 120, 180, 240, 300, 420, 600, 900, 1200, 90, 150] },
  { from: 'h', to: 'min', lvl: 2, vals: [1, 2, 3, 0.5, 0.25, 0.75, 1.5, 2.5] },
  { from: 'min', to: 'h', lvl: 2, vals: [15, 30, 45, 60, 90, 120, 150, 180] },
  { from: 'km', to: 'm', lvl: 3, vals: [0.5, 1.5, 2.5, 3.5, 0.25, 0.75, 7.5, 12.5, 0.1, 0.9] },
  { from: 'h', to: 's', lvl: 3, vals: [0.5, 1.5, 2, 2.5, 0.25, 0.75, 4] },
  { from: 'm', to: 'km', lvl: 3, vals: [250, 500, 750, 100, 1250, 6500, 12500] },
  { from: 'km/h', to: 'm/s', lvl: 4, vals: [18, 36, 54, 72, 90, 108, 126, 144, 9, 45] },
  { from: 'm/s', to: 'km/h', lvl: 4, vals: [5, 10, 15, 20, 25, 30, 2, 9.5, 7.5, 12] },
  { from: 's', to: 'h', lvl: 5, vals: [3600, 7200, 1800, 5400, 900, 10800] },
  { from: 'min', to: 's', lvl: 5, vals: [0.5, 1.5, 2.5, 25, 40, 45, 50] }
];

const CONV_MCQ = [
  { q: 'Pour passer des km aux m, je multiplie par…', ok: '1000', ko: ['10', '100', '3600'], lvl: 1 },
  { q: 'Pour passer des h aux s, je multiplie par…', ok: '3600', ko: ['60', '360', '1000'], lvl: 1 },
  { q: 'Pour passer des min aux s, je multiplie par…', ok: '60', ko: ['6', '600', '3600'], lvl: 1 },
  { q: 'Pour passer des m aux km, je divise par…', ok: '1000', ko: ['10', '100', '3600'], lvl: 2 },
  { q: 'Pour passer des s aux min, je divise par…', ok: '60', ko: ['6', '600', '3600'], lvl: 2 },
  { q: 'Pour passer des s aux h, je divise par…', ok: '3600', ko: ['60', '360', '1000'], lvl: 2 },
  { q: '1 h, c’est…', ok: '3600 s', ko: ['60 s', '600 s', '1000 s'], lvl: 1 },
  { q: '1 km, c’est…', ok: '1000 m', ko: ['10 m', '100 m', '3600 m'], lvl: 1 },
  { q: '1 min, c’est…', ok: '60 s', ko: ['6 s', '100 s', '360 s'], lvl: 1 },
  { q: '30 min, en heures, c’est…', ok: '0,5 h', ko: ['0,3 h', '3 h', '30 h'], lvl: 2 },
  { q: '15 min, en heures, c’est…', ok: '0,25 h', ko: ['0,15 h', '1,5 h', '4 h'], lvl: 3 },
  { q: '45 min, en heures, c’est…', ok: '0,75 h', ko: ['0,45 h', '4,5 h', '3 h'], lvl: 3 },
  { q: 'Pour passer des km/h aux m/s, je divise par…', ok: '3,6', ko: ['3600', '60', '1000'], lvl: 4 },
  { q: 'Pour passer des m/s aux km/h, je multiplie par…', ok: '3,6', ko: ['3600', '60', '1000'], lvl: 4 }
];

function convQuestion(level, opt = {}) {
  const rnd = opt.random || Math.random;
  const L = Math.min(5, Math.max(1, level | 0));
  const meta = { fam: FAM.conv, famKey: 'conv' };
  const kind = opt.kind || (rnd() < 0.3 ? 'mcq' : 'calc');

  if (kind === 'mcq') {
    const pool = CONV_MCQ.filter((m) => m.lvl <= L);
    const m = pick(pool.length ? pool : CONV_MCQ, rnd);
    return mcq(m.q, m.ok, m.ko, { ...meta, tag: 'Par cœur' }, rnd);
  }

  const rows = CONV_ROWS.filter((r) => r.lvl <= L);
  const row = pick(rows.length ? rows : CONV_ROWS, rnd);
  const value = pick(row.vals, rnd);
  return typed(
    fr(value) + ' ' + row.from + ' = ? ' + row.to,
    convert(value, row.from, row.to),
    { ...meta, tag: row.from + ' → ' + row.to }
  );
}

/* ------------------------------------------------------------------ *
 * Entrée unique
 * ------------------------------------------------------------------ */

const GENS = { traj: trajQuestion, vitesse: vitesseQuestion, conv: convQuestion };

/**
 * Une question.
 * @param {number} level 1 à 5
 * @param {{mode?:string, diff?:string, random?:function, kind?:string}} opt
 * @returns {{t:string, a:number, aLabel:string, tag:string, fam:string, famKey:string,
 *            choices:?Array<{v:number,label:string}>}}
 */
export function generateQuestion(level, opt = {}) {
  const rnd = opt.random || Math.random;
  let mode = opt.mode;
  if (!GENS[mode]) mode = pick(['traj', 'vitesse', 'conv'], rnd);
  return GENS[mode](level, opt);
}

/**
 * Distribue des questions sans répéter un énoncé déjà vu récemment.
 * `memory` énoncés sont retenus ; au-delà, le plus ancien peut revenir.
 */
export function createDealer(opt = {}) {
  const memory = Math.max(1, opt.memory || 10);
  const seen = [];
  return {
    seen,
    next(level) {
      let q = generateQuestion(level, opt);
      for (let i = 0; i < 60 && seen.indexOf(q.t) !== -1; i++) q = generateQuestion(level, opt);
      seen.push(q.t);
      while (seen.length > memory) seen.shift();
      return q;
    }
  };
}
