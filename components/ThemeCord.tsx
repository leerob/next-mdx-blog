import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

import { S, step, atRest, register, after, cancel, kick } from 'lib/spring';

// The slot it hangs in: the same 40px square as the other nav buttons. The
// cord is the demo's: twelve 9px links, 108px in all, hung from above the
// top of the page so the bead rests at the slot's top; the long cord is what
// makes it swing as wide as the demo's.
const BOX = 40,
  // the bead: the classic bulb icon (drawn 682 units tall, see below), hung
  // tip up and exactly as tall as the slot, so it fills it like a button
  BULB = (418 * BOX) / 682, // its width, about 24.5px
  N = 12, // links in the cord
  L = 108, // its length (9px a link)
  CLICK = 22, // stretch that flips the switch (the original's)
  MAXS = 54, // the most it gives
  TICK = 1 / 240; // the rope's fixed step (see tick)

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

  useEffect(() => setMounted(true), []);
  // the plain switch: the theme changes at once
  toggleRef.current = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const path = pathRef.current!,
      bead = beadRef.current!,
      grab = grabRef.current!;
    const HX = S(0, 210, 22),
      HY = S(0, 210, 22); // the hand that pulls on a tap
    const K = S(1, 300, 17); // how far the cord is stretched: it eases back, so letting go is a bounce and not a whip
    // where the cord hangs from: its length above the bead's rest, which is
    // off the top of the page
    const ax = BOX / 2,
      ay = -L,
      SEG = L / N;
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
      side = 1,
      acc = 0, // time not yet stepped (see tick)
      asleep = false,
      calm = 0, // how long it has been still
      moved = true; // stepped since it was last drawn
    // its timers, all cancelled when it goes
    const timers = new Set<ReturnType<typeof after>>();
    const later = (sec: number, fn: () => void) => {
      const t = after(sec, () => {
        timers.delete(t);
        fn();
      });
      timers.add(t);
    };

    const flip = () => later(0.14, () => toggleRef.current());
    // what holds the bead: a real pointer, or the hand that pulls on a tap
    const pin = () => (held ? [held.x, held.y] : ghost ? [HX.x, HY.x] : null);
    function pull() {
      if (ghost || held) return;
      asleep = false;
      const b = pts[N];
      ghost = true;
      armed = true;
      side = -side;
      HX.x = b.x;
      HY.x = b.y;
      HX.v = b.vx;
      HY.v = b.vy;
      HX.t = ax + side * 26;
      HY.t = ay + L + 64;
      later(1.1, () => {
        ghost = false; // let go even if it never clicked
      });
      kick();
    }

    const local = (e: PointerEvent) => {
      const r = grab.parentElement!.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    let released = -1e9; // when a pointer last let go of it
    const down = (e: PointerEvent) => {
      // the main button of the primary pointer only
      if (e.button !== 0 || !e.isPrimary) return;
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
      asleep = false;
      try {
        grab.setPointerCapture(e.pointerId);
      } catch {}
      grab.classList.add('is-held');
      kick();
    };
    const move = (e: PointerEvent) => {
      if (!held || e.pointerId !== held.id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) return drop(e); // released off-screen
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
      released = performance.now();
      grab.classList.remove('is-held');
      if (tap) pull();
      kick();
    };
    // keyboard and assistive tech: a click no pointer just let go of
    // (Enter, Space, VoiceOver) pulls it for you
    const click = () => {
      if (performance.now() - released > 500) pull();
    };
    grab.addEventListener('pointerdown', down);
    grab.addEventListener('pointermove', move);
    grab.addEventListener('pointerup', drop);
    grab.addEventListener('pointercancel', drop);
    grab.addEventListener('lostpointercapture', drop);
    grab.addEventListener('click', click);

    // One step of the rope. It runs on a fixed step, whatever the screen's
    // frame rate: the sag a rope like this settles into depends on the step,
    // so a step that varied with the frame rate (iOS moves between 60 and
    // 120 a second whenever anything animates) would nudge the resting bead
    // every time. Settled and untouched, it sleeps until the next touch.
    function tick(dt: number) {
      [HX, HY, K].forEach((s) => step(s, dt));
      const p = pin(),
        b = pts[N];

      // the held end: free inside the cord's reach, rubber past it
      let px = 0,
        py = 0,
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
          else later(0.12, () => (ghost = false));
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
      moved = true;
      // still for a quarter of a second, not just at the turn of a swing
      const still =
        !held &&
        !ghost &&
        [HX, HY, K].every((s) => atRest(s)) &&
        pts.every((q) => Math.abs(q.vx) < 0.5 && Math.abs(q.vy) < 0.5);
      calm = still ? calm + dt : 0;
      if (calm > 0.25) {
        asleep = true;
        calm = 0;
        pts.forEach((q) => (q.vx = q.vy = 0));
      }
    }

    const unregister = register({
      frame(dt) {
        if (asleep) return;
        acc += dt;
        while (acc >= TICK) {
          acc -= TICK;
          tick(TICK);
          if (asleep) break;
        }
      },
      render() {
        if (!moved) return; // asleep: nothing new to draw
        moved = false;
        const b = pts[N],
          e = pts[N - 1];
        let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 1; i < N; i++)
          d += `Q${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${((pts[i].x + pts[i + 1].x) / 2).toFixed(1)} ${((pts[i].y + pts[i + 1].y) / 2).toFixed(1)}`;
        d += `L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        const ang = Math.atan2(e.x - b.x, b.y - e.y);
        path.setAttribute('d', d);
        bead.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px) rotate(${ang.toFixed(4)}rad)`;
        grab.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px)`;
      },
      // idle once the rope sleeps and has been drawn at rest
      idle: () => asleep && !moved
    });

    return () => {
      grab.removeEventListener('pointerdown', down);
      grab.removeEventListener('pointermove', move);
      grab.removeEventListener('pointerup', drop);
      grab.removeEventListener('pointercancel', drop);
      grab.removeEventListener('lostpointercapture', drop);
      grab.removeEventListener('click', click);
      timers.forEach(cancel);
      unregister();
    };
  }, []);

  return (
    <div className="relative" style={{ width: BOX, height: BOX }}>
      <svg
        aria-hidden="true"
        className="absolute left-0 top-0 overflow-visible pointer-events-none"
        width={BOX}
        height={BOX}
      >
        <path
          ref={pathRef}
          d={`M${BOX / 2} ${-L}L${BOX / 2} 0`}
          fill="none"
          className="stroke-[#85847e] dark:stroke-[#828282]"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* the bead, in the demo's lamp colours: a grey screw base and a
          classic bulb, lit (yellow) in light mode and dim in dark */}
      <i
        ref={beadRef}
        aria-hidden="true"
        className="absolute top-0 pointer-events-none will-change-transform"
        style={{
          left: -BULB / 2,
          width: BULB,
          transformOrigin: `${BULB / 2}px 0`,
          transform: `translate(${BOX / 2}px,0)`
        }}
      >
        <svg
          viewBox="-209 0 418 682"
          width={BULB}
          height={BOX}
          className="block overflow-visible"
        >
          {/* the screw base, tip up: a domed contact and three threads,
              widening toward the neck: threads and gaps all even (34 and
              17, about 2px and 1px) */}
          <g className="fill-[#85847e] dark:fill-[#828282]">
            <path d="M-54 40A54 40 0 0 1 54 40Z" />
            <rect x={-91.5} y={57} width={183} height={34} rx={17} />
            <rect x={-100} y={108} width={200} height={34} rx={17} />
            <rect x={-105} y={159} width={210} height={34} rx={17} />
          </g>
          {/* the glass: a 217-wide neck, rounded at the base, flaring
              through a fillet of 88 into a globe of radius 208.5 */}
          <path
            vectorEffect="non-scaling-stroke"
            className="fill-[#ffd23f] dark:fill-white/[.14] dark:stroke-white/[.12]"
            d="M-96.5 210A12 12 0 0 0 -108.5 222V251.5A88 88 0 0 1 -138.18 317.39A208.5 208.5 0 1 0 138.18 317.39A88 88 0 0 1 108.5 251.5V222A12 12 0 0 0 96.5 210Z"
          />
        </svg>
      </i>
      {/* the one real control: it sits on the bead and follows it */}
      <button
        ref={grabRef}
        type="button"
        role="switch"
        aria-checked={mounted ? resolvedTheme === 'light' : undefined}
        aria-label="Light mode"
        className="cord-grab"
        style={{ transform: `translate(${BOX / 2}px,0)` }}
      />
    </div>
  );
}
