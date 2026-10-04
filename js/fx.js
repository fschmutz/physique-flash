/** Confettis et feux d'artifice sur canvas. Pas de dépendance, pas de réseau. */

const COLORS = ['#2bd9d2', '#7fd4ff', '#ffc93c', '#ff5c7a', '#3ee7b8', '#eef7ff'];

export function createFX(canvas) {
  const ctx = canvas.getContext('2d');
  let parts = [];
  let raf = 0;
  let stopAt = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    const r = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * r);
    canvas.height = Math.floor(innerHeight * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }
  addEventListener('resize', size);
  size();

  function burst(x, y, n, spread) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = spread * (0.35 + Math.random() * 0.8);
      parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 1.4,
        r: 2 + Math.random() * 3.5,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1
      });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0.02 && p.y < innerHeight + 30);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.09;
      p.vx *= 0.995;
      p.life -= 0.009;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (performance.now() < stopAt || parts.length) raf = requestAnimationFrame(frame);
    else { raf = 0; clear(); }
  }

  function clear() {
    cancelAnimationFrame(raf);
    raf = 0;
    parts = [];
    stopAt = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }

  /** `kind` vaut 'feu', 'etoiles' ou 'confettis'. */
  function play(kind, ms) {
    if (reduced) return;
    stopAt = performance.now() + ms;
    const shoot = () => {
      if (performance.now() > stopAt) return;
      const x = innerWidth * (0.15 + Math.random() * 0.7);
      const y = innerHeight * (0.2 + Math.random() * 0.35);
      burst(x, y, kind === 'feu' ? 46 : kind === 'etoiles' ? 30 : 20, kind === 'feu' ? 5 : 3.4);
      setTimeout(shoot, kind === 'feu' ? 320 : 460);
    };
    shoot();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return { play, clear };
}
