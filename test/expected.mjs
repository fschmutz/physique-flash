/**
 * Relit un énoncé et recalcule la réponse attendue.
 *
 * La table de conversion est réécrite ici exprès : si le test réutilisait celle
 * de `js/generate.js`, une erreur de facteur passerait inaperçue des deux côtés.
 */

const TO_BASE = { m: 1, km: 1000, s: 1, min: 60, h: 3600, 'm/s': 1, 'km/h': 1 / 3.6 };
const KIND = { m: 'd', km: 'd', s: 't', min: 't', h: 't', 'm/s': 'v', 'km/h': 'v' };

/** Lit un nombre écrit à la française. */
export function num(s) {
  return parseFloat(String(s).replace(',', '.'));
}

export function unitKind(u) {
  return KIND[u] || null;
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

/* `km/h` et `m/s` d'abord : sinon `km` et `m` mordraient dessus. */
const N = '(-?\\d+(?:,\\d+)?)';
const U = '(km/h|m/s|km|min|m|h|s)';

const RE = {
  conv: new RegExp('^' + N + ' ' + U + ' = \\? ' + U + '$'),
  vitesse: new RegExp(' : ' + N + ' ' + U + ' en ' + N + ' ' + U + '\\. Vitesse en ' + U + ' \\?$'),
  distance: new RegExp(' : ' + N + ' ' + U + ' pendant ' + N + ' ' + U + '\\. Distance en ' + U + ' \\?$'),
  duree: new RegExp(' : ' + N + ' ' + U + ' à ' + N + ' ' + U + '\\. Durée en ' + U + ' \\?$')
};

function base(value, unit) {
  return num(value) * TO_BASE[unit];
}

/**
 * La réponse que l'énoncé impose, ou `null` quand il n'y a rien à calculer
 * (les questions à choix se vérifient autrement).
 */
export function expectedFromText(t) {
  let m = RE.conv.exec(t);
  if (m) {
    if (KIND[m[2]] !== KIND[m[3]]) return NaN;
    return round6(base(m[1], m[2]) / TO_BASE[m[3]]);
  }

  m = RE.vitesse.exec(t);
  if (m) {
    const metres = base(m[1], m[2]);
    const secondes = base(m[3], m[4]);
    return round6(metres / secondes / TO_BASE[m[5]]);
  }

  m = RE.distance.exec(t);
  if (m) {
    const vitesse = base(m[1], m[2]);
    const secondes = base(m[3], m[4]);
    return round6(vitesse * secondes / TO_BASE[m[5]]);
  }

  m = RE.duree.exec(t);
  if (m) {
    const metres = base(m[1], m[2]);
    const vitesse = base(m[3], m[4]);
    return round6(metres / vitesse / TO_BASE[m[5]]);
  }

  return null;
}

/** Le genre de grandeur que l'énoncé réclame : distance, durée ou vitesse. */
export function askedKind(t) {
  if (RE.conv.test(t)) return KIND[RE.conv.exec(t)[3]];
  if (RE.vitesse.test(t)) return 'v';
  if (RE.distance.test(t)) return 'd';
  if (RE.duree.test(t)) return 't';
  return null;
}

/** L'unité de la réponse demandée. */
export function askedUnit(t) {
  for (const [key, re] of Object.entries(RE)) {
    const m = re.exec(t);
    if (m) return key === 'conv' ? m[3] : m[5];
  }
  return null;
}
