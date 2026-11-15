// Tiny spring engine, ported from the DesignBookmark motion studies
// (https://designbookmark.com/motion). Springs are "stiffness damping" pairs,
// stepped by one shared requestAnimationFrame loop that sleeps whenever every
// registered component is at rest and no timer is pending.

export type Spring = { x: number; v: number; t: number; k: number; c: number };

export type MotionComponent = {
  frame(dt: number): void;
  render(): void;
  // Return true when nothing is moving, so the loop can go to sleep.
  idle?(): boolean;
};

type Timer = { t: number; fn: () => void };

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const S = (x: number, k = 400, c = 30): Spring => {
  const s = { x, v: 0, t: x, k, c };
  tune(s, k, c);
  return s;
};

// Reduced motion: critically damp every spring, so nothing overshoots.
export const tune = (s: Spring, k: number, c: number) => {
  s.k = k;
  s.c = reduceMotion() ? 2 * Math.sqrt(k) : c;
};

export const step = (s: Spring, dt: number) => {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
};

export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

export const atRest = (s: Spring, eps = 0.001) => {
  if (Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps * 10) {
    s.x = s.t;
    s.v = 0;
    return true;
  }
  return false;
};

const comps = new Set<MotionComponent>();
const timers: Timer[] = [];
let raf = 0;
let last = 0;

function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  for (let i = timers.length - 1; i >= 0; i--) {
    if ((timers[i].t -= dt) <= 0) timers.splice(i, 1)[0].fn();
  }
  const sub = 4;
  for (let k = 0; k < sub; k++) comps.forEach((c) => c.frame(dt / sub));
  comps.forEach((c) => c.render());

  const busy =
    timers.length > 0 || Array.from(comps).some((c) => !c.idle || !c.idle());
  raf = busy ? requestAnimationFrame(loop) : 0;
}

// Wake the loop after changing a spring target.
export function kick() {
  if (raf || typeof window === 'undefined') return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

export function register(c: MotionComponent) {
  comps.add(c);
  kick();
  return () => {
    comps.delete(c);
  };
}

export function after(sec: number, fn: () => void): Timer {
  const t = { t: sec, fn };
  timers.push(t);
  kick();
  return t;
}

export function cancel(t: Timer | null | undefined) {
  if (!t) return;
  const i = timers.indexOf(t);
  if (i > -1) timers.splice(i, 1);
}
