import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

import { S, step, atRest, register, after, cancel, kick } from 'lib/spring';

// The slot it hangs in: the same 40px square as the other nav buttons. The
// cord comes down from the top of the page (TOP above the slot) and the bead
// rests in the middle of the slot.
const BOX = 40,
  TOP = 32, // the nav's top padding
  N = 8, // links in the cord
  SEG = 4.75, // link length, so the bead rests at the slot's middle
  L = N * SEG,
  CLICK = 22, // stretch that flips the switch (the original's)
  MAXS = 54; // the most it gives

type P = { x: number; y: number; vx: number; vy: number };

// Pull Cord (designbookmark.com/motion#db-pull-cord), the cord without the
// lamp. The cord is a chain of points with weight, kept at length by soft
// links, so it hangs, swings and whips like a rope. Held, the bead follows the
// pointer until the cord is tight; past that it stretches like rubber, and a
// pull past the click flips the theme. Let go and it whips back. A tap, Enter
// or Space pulls it for you.
export default function ThemeCord() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<HTMLElement>(null);
  const grabRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<() => void>(() => {});
  const light = resolvedTheme === 'light';

  useEffect(() => setMounted(true), []);
  toggleRef.current = () => setTheme(light ? 'dark' : 'light');

  useEffect(() => {
    const path = pathRef.current!,
      bead = beadRef.current!,
      grab = grabRef.current!;
    const HX = S(0, 210, 22),
      HY = S(0, 210, 22); // the hand that pulls on a tap
    const K = S(1, 300, 17); // how far the cord is stretched: it eases back, so letting go is a bounce and not a whip
    const ax = BOX / 2,
      ay = -TOP; // where the cord hangs from: the top of the page
    const pts: P[] = Array.from({ length: N + 1 }, (_, i) => ({
      x: ax,
      y: ay + i * SEG,
      vx: 0,
      vy: 0
    }));
    let held: {
      id: number;
      x: number;
      y: number;
      ox: number;
      oy: number;
      sx: number;
      sy: number;
      moved: number;
      flipped: boolean;
    } | null = null;
    let ghost = false,
      armed = true,
      stretch = 0,
      side = 1,
      timer = null;

    const flip = () => after(0.14, () => toggleRef.current());
    // what holds the bead: a real pointer, or the hand that pulls on a tap
    const pin = () => (held ? [held.x, held.y] : ghost ? [HX.x, HY.x] : null);
    function pull() {
      if (ghost || held) return;
      const b = pts[N];
      ghost = true;
      armed = true;
      side = -side;
      HX.x = b.x;
      HY.x = b.y;
      HX.v = b.vx;
      HY.v = b.vy;
      HX.t = ax + side * 10;
      HY.t = ay + L + 64;
      timer = after(1.1, () => {
        ghost = false; // let go even if it never clicked
      });
      kick();
    }

    const local = (e: PointerEvent) => {
      const r = grab.parentElement!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const down = (e: PointerEvent) => {
      const [x, y] = local(e),
        b = pts[N];
      held = {
        id: e.pointerId,
        x: b.x,
        y: b.y,
        ox: b.x - x,
        oy: b.y - y,
        sx: x,
        sy: y,
        moved: 0,
        flipped: false
      };
      ghost = false;
      armed = true;
      try {
        grab.setPointerCapture(e.pointerId);
      } catch {}
      grab.classList.add('is-held');
      kick();
    };
    const move = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      const [x, y] = local(e);
      held.x = x + held.ox;
      held.y = y + held.oy;
      held.moved = Math.max(held.moved, Math.hypot(x - held.sx, y - held.sy));
      kick();
    };
    const drop = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      const tap = held.moved < 5 && !held.flipped && e.type === 'pointerup';
      held = null;
      grab.classList.remove('is-held');
      if (tap) pull();
      kick();
    };
    // keyboard: Enter and Space click the button without a pointer
    const click = (e: MouseEvent) => {
      if (!e.detail) pull();
    };
    grab.addEventListener('pointerdown', down);
    grab.addEventListener('pointermove', move);
    grab.addEventListener('pointerup', drop);
    grab.addEventListener('pointercancel', drop);
    grab.addEventListener('click', click);

    const unregister = register({
      frame(dt) {
        [HX, HY, K].forEach((s) => step(s, dt));
        if (dt <= 0) return;
        const p = pin(),
          b = pts[N];

        // the held end: free inside the cord's reach, rubber past it
        let px = 0,
          py = 0;
        stretch = 0;
        if (p) {
          const dx = p[0] - ax,
            dy = p[1] - ay,
            d = Math.hypot(dx, dy) || 1;
          const over = Math.max(0, d - L),
            give = MAXS * (1 - Math.exp(-over / 70)),
            r = Math.min(d, L) + give;
          px = ax + (dx / d) * r;
          py = ay + (dy / d) * r;
          stretch = give;
          if (over > 0) {
            K.x = K.t = r / L;
            K.v = 0;
          }
          if (armed && give > CLICK) {
            armed = false;
            flip();
            if (held) held.flipped = true;
            else after(0.12, () => (ghost = false));
          }
        }
        if (!p || !stretch) K.t = 1;
        const seg = SEG * Math.max(1, K.x);

        // the rope: gravity, then links pulled back to length a few times
        const prev = pts.map((q) => [q.x, q.y]);
        for (let i = 1; i <= N; i++) {
          const q = pts[i],
            k = Math.exp(-(i === N ? 1.1 : 2.4) * dt);
          q.vy += 2600 * dt;
          q.vx *= k;
          q.vy *= k;
          const sp = Math.hypot(q.vx, q.vy);
          if (sp > 2600) {
            q.vx *= 2600 / sp;
            q.vy *= 2600 / sp;
          }
          q.x += q.vx * dt;
          q.y += q.vy * dt;
        }
        for (let it = 0; it < 8; it++) {
          pts[0].x = ax;
          pts[0].y = ay;
          if (p) {
            b.x = px;
            b.y = py;
          }
          for (let i = 0; i < N; i++) {
            const a = pts[i],
              c = pts[i + 1],
              dx = c.x - a.x,
              dy = c.y - a.y,
              d = Math.hypot(dx, dy) || 1e-6,
              f = ((d - seg) / d) * 0.5;
            // the bead is heavy
            const wa = i === 0 ? 0 : 1,
              wc = i + 1 === N ? (p ? 0 : 0.3) : 1,
              sum = wa + wc || 1;
            a.x += ((dx * f * wa) / sum) * 2;
            a.y += ((dy * f * wa) / sum) * 2;
            c.x -= ((dx * f * wc) / sum) * 2;
            c.y -= ((dy * f * wc) / sum) * 2;
          }
        }
        pts[0].x = ax;
        pts[0].y = ay;
        if (p) {
          b.x = px;
          b.y = py;
        }
        for (let i = 1; i <= N; i++) {
          pts[i].vx = (pts[i].x - prev[i][0]) / dt;
          pts[i].vy = (pts[i].y - prev[i][1]) / dt;
        }
      },
      render() {
        const b = pts[N],
          e = pts[N - 1];
        let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < N; i++)
          d += `Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${((pts[i].x + pts[i + 1].x) / 2).toFixed(1)} ${((pts[i].y + pts[i + 1].y) / 2).toFixed(1)}`;
        d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        path.setAttribute('d', d);
        const ang = Math.atan2(e.x - b.x, b.y - e.y);
        bead.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px) rotate(${ang.toFixed(4)}rad)`;
        grab.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px)`;
      },
      // asleep once nobody holds it and the rope has stopped swinging
      idle: () =>
        !held &&
        !ghost &&
        [HX, HY, K].every((s) => atRest(s)) &&
        pts.every((q) => Math.abs(q.vx) < 0.5 && Math.abs(q.vy) < 0.5)
    });

    return () => {
      grab.removeEventListener('pointerdown', down);
      grab.removeEventListener('pointermove', move);
      grab.removeEventListener('pointerup', drop);
      grab.removeEventListener('pointercancel', drop);
      grab.removeEventListener('click', click);
      cancel(timer);
      unregister();
    };
  }, []);

  return (
    <div className="relative" style={{ width: BOX, height: BOX }}>
      <svg
        className="absolute left-0 top-0 overflow-visible pointer-events-none"
        width={BOX}
        height={BOX}
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d={`M${BOX / 2} ${-TOP}L${BOX / 2} ${-TOP + L}`}
          fill="none"
          stroke="var(--muted-2)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <i
        ref={beadRef}
        aria-hidden="true"
        className="absolute left-[-8px] top-[-3px] w-4 h-[30px] rounded-full bg-inverse will-change-transform"
        style={{
          transformOrigin: '8px 3px',
          transform: `translate(${BOX / 2}px,${-TOP + L}px)`
        }}
      />
      {/* the one real control: it sits on the bead and follows it */}
      <button
        ref={grabRef}
        type="button"
        role="switch"
        aria-checked={mounted ? light : undefined}
        aria-label="Light mode"
        className="cord-grab"
        style={{ transform: `translate(${BOX / 2}px,${-TOP + L}px)` }}
      />
    </div>
  );
}
