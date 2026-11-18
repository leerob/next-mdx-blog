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

// Reduced motion, read live (one query for every spring), so turning it on
// in the system settings takes effect at once
const reduced =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

export const S = (x: number, k = 400, c = 30): Spring => ({
  x,
  v: 0,
  t: x,
  k,
  c
});

export const tune = (s: Spring, k: number, c: number) => {
  s.k = k;
  s.c = c;
};

// Reduced motion: critically damp every spring, so nothing overshoots.
export const step = (s: Spring, dt: number) => {
  const c = reduced?.matches ? 2 * Math.sqrt(s.k) : s.c;
  const a = -s.k * (s.x - s.t) - c * s.v;
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

// One component's error must not stop the loop for every other one: report
// it, drop that component (or timer) and carry on. Left to throw, the loop
// would die with `raf` still set, so kick() would never restart it and every
// spring on the page would stop responding until a reload.
function guard(fn: () => void, c?: MotionComponent) {
  try {
    fn();
  } catch (e) {
    if (c) comps.delete(c);
    (globalThis.reportError ?? console.error)(e);
  }
}

function loop(now: number) {
  raf = 0;
  // the frame can start a little before the kick that asked for it
  const dt = Math.max(0, Math.min((now - last) / 1000, 1 / 30));
  last = now;
  for (let i = timers.length - 1; i >= 0; i--) {
    if (i < timers.length && (timers[i].t -= dt) <= 0) {
      const t = timers.splice(i, 1)[0];
      guard(t.fn);
    }
  }
  const sub = 4;
  for (let k = 0; k < sub; k++)
    comps.forEach((c) => guard(() => c.frame(dt / sub), c));
  comps.forEach((c) => guard(() => c.render(), c));

  let busy = timers.length > 0;
  comps.forEach((c) =>
    guard(() => {
      busy ||= !c.idle || !c.idle();
    }, c)
  );
  if (busy) kick(now);
}

// Wake the loop after changing a spring target.
export function kick(now?: number) {
  if (raf || typeof window === 'undefined') return;
  last = now ?? performance.now();
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
