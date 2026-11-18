import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

import { S, step, atRest, register, after, cancel, kick } from 'lib/spring';

// The slot it hangs in: the same 40px square as the other nav buttons. The
// cord is the demo's: twelve 9px links, 108px in all, hung from above the
// top of the page so the bead rests in the slot; the long cord is what makes
// it swing as wide as the demo's.
const BOX = 40,
  // the bead: the classic bulb icon (drawn 682 units tall, see below),
  // hung tip up and exactly as tall as the slot, so it fills it like a button
  BULB = (418 * BOX) / 682, // its width, about 24.5px
  GLOBE = (473.5 * BOX) / 682, // the globe's centre, below the top
  REST = 0, // where the bead hangs from: the slot's top
  N = 12, // links in the cord
  L = 108, // its length (9px a link)
  CLICK = 22, // stretch that flips the switch (the original's)
  MAXS = 54; // the most it gives

type P = { x: number; y: number; vx: number; vy: number };

let transitions = 0;

// The demo's light circle: a spring from 0 to 1 (120, 21) to turn the light
// on, from 1 to 0 (170, 27) to turn it off, run here once and sampled at 60
// frames a second as keyframes for the reveal. Returns them and the duration.
function reveal(on: boolean): [number[], number] {
  const c = S(on ? 0 : 1, on ? 120 : 170, on ? 21 : 27);
  c.t = on ? 1 : 0;
  const frames = [c.x];
  while (!atRest(c) && frames.length < 600) {
    for (let i = 0; i < 4; i++) step(c, 1 / 240);
    frames.push(Math.max(0, c.x));
  }
  frames[frames.length - 1] = c.t;
  return [frames, ((frames.length - 1) * 1000) / 60];
}

// Pull Cord (designbookmark.com/motion#db-pull-cord), the cord without the
// lamp. The cord is a chain of points with weight, kept at length by soft
// links, so it hangs, swings and whips like a rope. Held, the bead follows the
// pointer until the cord is tight; past that it stretches like rubber, and a
// pull past the click flips the theme. Let go and it whips back. A tap, Enter
// or Space pulls it for you.
export default function ThemeCord() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const beadRefs = useRef<(HTMLElement | null)[]>([]);
  const grabRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<() => void>(() => {});
  const light = resolvedTheme === 'light';

  useEffect(() => setMounted(true), []);
  // Flip the theme the demo's way: the light page is a circle around the
  // bulb, sized by a spring, that grows over the dark one to turn the light
  // on and shrinks back into the bulb to turn it off. The page is drawn twice
  // with View Transitions (old and new), the cord stays live on top, in both
  // colours, so it keeps swinging through the change. Instant where
  // unsupported or motion is reduced.
  toggleRef.current = () => {
    const root = document.documentElement;
    let on = false;
    const apply = () => {
      // read the theme when the change lands, not when the pull started, so
      // two quick pulls flip it twice; set the class here so the change is
      // inside the transition's snapshot
      on = root.classList.contains('dark');
      root.classList.toggle('dark', !on);
      setTheme(on ? 'light' : 'dark');
    };
    const doc = document as Document & {
      startViewTransition?: (update: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };
    if (
      !doc.startViewTransition ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return apply();
    // centred on the bulb at rest, not where a pull has stretched it to
    const slot = grabRef.current!.parentElement!.getBoundingClientRect();
    const cx = BOX / 2,
      cy = REST + GLOBE,
      x = slot.left + cx,
      y = slot.top + cy;
    const w =
      Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) +
      24;
    const id = ++transitions;
    const anims: Animation[] = [];
    root.classList.add('cord-turning');
    const t = doc.startViewTransition(() => {
      apply();
      root.classList.toggle('cord-off', !on);
    });
    t.ready
      .then(() => {
        const [frames, duration] = reveal(on);
        // under 4px it is gone, as in the demo
        const circle = (r: number, ox: number, oy: number) =>
          `circle(${(r < 4 ? 0 : r).toFixed(1)}px at ${ox}px ${oy}px)`;
        const opts = { duration, easing: 'linear', fill: 'forwards' as const };
        // the light page: the new one turning on, the old one turning off,
        // and the light cord with it, in its own box's coordinates
        anims.push(
          root.animate(
            { clipPath: frames.map((c) => circle(c * w, x, y)) },
            {
              ...opts,
              pseudoElement: `::view-transition-${on ? 'new' : 'old'}(root)`
            }
          ),
          root.animate(
            { clipPath: frames.map((c) => circle(c * w, cx, cy)) },
            { ...opts, pseudoElement: '::view-transition-new(cord-light)' }
          )
        );
      })
      // a newer pull skips this transition; its theme change still applies
      .catch(() => {});
    t.finished
      .catch(() => {})
      .then(() => {
        // held at the end (fill: forwards) so nothing flashes before the
        // transition ends; let go of them now
        anims.forEach((a) => a.cancel());
        if (id !== transitions) return;
        root.classList.remove('cord-turning', 'cord-off');
      });
  };

  useEffect(() => {
    const paths = pathRefs.current as SVGPathElement[],
      beads = beadRefs.current as HTMLElement[],
      grab = grabRef.current!;
    const HX = S(0, 210, 22),
      HY = S(0, 210, 22); // the hand that pulls on a tap
    const K = S(1, 300, 17); // how far the cord is stretched: it eases back, so letting go is a bounce and not a whip
    // where the cord hangs from: its length above the bead's rest, which is
    // off the top of the page
    const ax = BOX / 2,
      ay = REST - L,
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
      HX.t = ax + side * 26;
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
        const ang = Math.atan2(e.x - b.x, b.y - e.y);
        paths.forEach((path) => path.setAttribute('d', d));
        beads.forEach(
          (bead) =>
            (bead.style.transform = `translate(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px) rotate(${ang.toFixed(4)}rad)`)
        );
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

  // The cord twice, once in each theme's colours, like the demo's two rooms:
  // one shows at a time, and while the theme changes both show and the light
  // one is cut to the same circle as the light page (see globals.css).
  const copy = (theme: 'light' | 'dark', k: number) => (
    <div className={`cord-copy cord-${theme}`} aria-hidden="true">
      <svg
        className="absolute left-0 top-0 overflow-visible"
        width={BOX}
        height={BOX}
      >
        <path
          ref={(el) => {
            pathRefs.current[k] = el;
          }}
          d={`M${BOX / 2} ${REST - L}L${BOX / 2} ${REST}`}
          fill="none"
          stroke={theme === 'light' ? '#85847e' : '#828282'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* the bead, in the demo's lamp colours: a grey screw base and a
          classic bulb, lit (yellow) in light mode and dim in dark */}
      <i
        ref={(el) => {
          beadRefs.current[k] = el;
        }}
        className="absolute top-0 will-change-transform"
        style={{
          left: -BULB / 2,
          width: BULB,
          transformOrigin: `${BULB / 2}px 0`,
          transform: `translate(${BOX / 2}px,${REST}px)`
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
          <g fill={theme === 'light' ? '#85847e' : '#828282'}>
            <path d="M-54 40A54 40 0 0 1 54 40Z" />
            <rect x={-91.5} y={57} width={183} height={34} rx={17} />
            <rect x={-100} y={108} width={200} height={34} rx={17} />
            <rect x={-105} y={159} width={210} height={34} rx={17} />
          </g>
          {/* the glass: a 217-wide neck, rounded at the base, flaring
              through a fillet of 88 into a globe of radius 208.5 */}
          <path
            vectorEffect="non-scaling-stroke"
            className={
              theme === 'light'
                ? 'fill-[#ffd23f]'
                : 'fill-white/[.14] stroke-white/[.12]'
            }
            d="M-96.5 210A12 12 0 0 0 -108.5 222V251.5A88 88 0 0 1 -138.18 317.39A208.5 208.5 0 1 0 138.18 317.39A88 88 0 0 1 108.5 251.5V222A12 12 0 0 0 96.5 210Z"
          />
        </svg>
      </i>
    </div>
  );

  return (
    <div className="relative" style={{ width: BOX, height: BOX }}>
      {copy('dark', 0)}
      {copy('light', 1)}
      {/* the one real control: it sits on the bead and follows it */}
      <button
        ref={grabRef}
        type="button"
        role="switch"
        aria-checked={mounted ? light : undefined}
        aria-label="Light mode"
        className="cord-grab"
        style={{ transform: `translate(${BOX / 2}px,${REST}px)` }}
      />
    </div>
  );
}
