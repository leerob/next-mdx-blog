import { RefObject, useEffect, useRef } from 'react';

import { S, step, clamp, atRest, register, kick } from 'lib/spring';

const NEAR = 20; // show the count, and turn orange, this close to the limit
const MAX_DROPS = 30;

type Drop = {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  age: number;
};

// Letter Limit (designbookmark.com/motion#db-letter-limit): a ring fills as
// you type, goes orange near the limit and red at it. Type past the limit and
// the letters that do not fit are cut off and thrown out of the ring: each
// hops, falls with gravity and spin, and fades away, while the ring shakes
// its head.
export default function LetterLimit({
  inputRef,
  limit,
  resetKey
}: {
  inputRef: RefObject<HTMLInputElement>;
  limit: number;
  resetKey?: unknown;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const meterRef = useRef<SVGSVGElement>(null);
  const fillRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const pileRef = useRef<HTMLSpanElement>(null);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const input = inputRef.current;
    const box = boxRef.current!,
      meter = meterRef.current!,
      fill = fillRef.current!;
    const count = countRef.current!,
      pile = pileRef.current!;
    if (!input) return;

    const F = S(0, 280, 22); // ring fill
    const CP = S(1, 520, 16); // count pop
    const SH = S(0, 700, 12); // the shake of its head on a refused letter
    let drops: Drop[] = [],
      len = 0;

    function drop(chars: string) {
      Array.from(chars)
        .filter((ch) => ch.trim())
        .slice(0, MAX_DROPS)
        .forEach((ch, i) => {
          const el = document.createElement('span');
          el.textContent = ch;
          pile.appendChild(el);
          drops.push({
            el,
            x: i * 6,
            y: 0,
            vx: -60 + Math.random() * 140,
            vy: -150 - Math.random() * 110,
            r: 0,
            vr: (Math.random() - 0.5) * 720,
            age: 0
          });
        });
      SH.v += 34;
      CP.x = 1.25;
    }

    function sync() {
      let v = input.value;
      if (v.length > limit) {
        // cut what does not fit, and throw it out
        const caret = Math.min(input.selectionStart ?? limit, limit);
        drop(v.slice(limit));
        input.value = v = v.slice(0, limit);
        input.setSelectionRange(caret, caret);
      }
      const was = len;
      len = v.length;
      if (len !== was) CP.x = Math.max(CP.x, 1.12);
      const left = limit - len;
      count.textContent = String(left);
      box.classList.toggle('is-on', len > 0);
      box.classList.toggle('is-near', left <= NEAR && left > 0);
      box.classList.toggle('is-full', left <= 0);
      F.t = len / limit;
      kick();
    }
    syncRef.current = sync;
    input.addEventListener('input', sync);
    sync();

    const unregister = register({
      frame(dt) {
        [F, CP, SH].forEach((s) => step(s, dt));
        drops.forEach((d) => {
          d.age += dt;
          d.vy += 1900 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.r += d.vr * dt;
        });
      },
      render() {
        fill.style.strokeDashoffset = (1 - clamp(F.x, 0, 1)).toFixed(4);
        const sh = SH.x * 0.5;
        meter.style.transform = `translateX(${sh.toFixed(2)}px) rotate(-90deg)`;
        count.style.transform = `translateX(${sh.toFixed(2)}px) scale(${CP.x.toFixed(4)})`;
        drops = drops.filter((d) => {
          if (d.age > 0.9) {
            d.el.remove();
            return false;
          }
          d.el.style.opacity = clamp((0.9 - d.age) / 0.35, 0, 1).toFixed(3);
          d.el.style.transform = `translate(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px) rotate(${d.r.toFixed(1)}deg)`;
          return true;
        });
      },
      idle: () => drops.length === 0 && atRest(F) && atRest(CP) && atRest(SH)
    });

    return () => {
      input.removeEventListener('input', sync);
      drops.forEach((d) => d.el.remove());
      unregister();
    };
  }, [inputRef, limit]);

  // the form clears the input by hand after posting, which fires no event
  useEffect(() => {
    syncRef.current();
  }, [resetKey]);

  return (
    <span
      ref={boxRef}
      aria-hidden="true"
      className="letter-limit absolute right-[124px] top-1 h-8 flex items-center gap-1.5 pointer-events-none"
    >
      <span
        ref={countRef}
        className="letter-count text-xs font-medium tabular-nums will-change-transform"
      />
      <svg
        ref={meterRef}
        viewBox="0 0 24 24"
        className="w-5 h-5 -rotate-90 will-change-transform"
      >
        <circle className="letter-track" cx="12" cy="12" r="9" />
        <circle
          ref={fillRef}
          className="letter-fill"
          cx="12"
          cy="12"
          r="9"
          pathLength="1"
        />
      </svg>
      <span ref={pileRef} className="letter-pile absolute right-2 top-1/2" />
    </span>
  );
}
