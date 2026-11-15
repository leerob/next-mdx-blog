import { useEffect, useRef } from 'react';

import { S, step, atRest, register, after, cancel, kick } from 'lib/spring';

const STAGGER = 0.03;

// Roll Links (designbookmark.com/motion#db-roll-links): each letter is a
// little drum with the letter on it twice. Hovering the surrounding link turns
// the drums one after another, so the word rolls over from left to right, and
// leaving turns them back the same way.
export default function RollText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const host = (root.closest('a,button') as HTMLElement) ?? root;
    const drums = Array.from(root.querySelectorAll<HTMLElement>('.roll-in'));
    const springs = drums.map(() => S(0, 380, 24));
    let on = false,
      timers = [];

    function roll(to: boolean) {
      on = to;
      timers.forEach(cancel);
      timers = springs.map((s, k) =>
        after(k * STAGGER, () => {
          if (on === to) s.t = to ? 1 : 0;
        })
      );
      kick();
    }
    const enter = () => roll(true),
      leave = () => roll(false);
    host.addEventListener('pointerenter', enter);
    host.addEventListener('pointerleave', leave);
    host.addEventListener('focus', enter);
    host.addEventListener('blur', leave);

    const unregister = register({
      frame(dt) {
        springs.forEach((s) => step(s, dt));
      },
      render() {
        drums.forEach((d, i) => {
          d.style.transform = `translateY(${(-springs[i].x * 50).toFixed(2)}%)`;
        });
      },
      idle: () => springs.every((s) => atRest(s))
    });

    return () => {
      timers.forEach(cancel);
      host.removeEventListener('pointerenter', enter);
      host.removeEventListener('pointerleave', leave);
      host.removeEventListener('focus', enter);
      host.removeEventListener('blur', leave);
      unregister();
    };
  }, [text]);

  return (
    <span ref={ref} className="roll-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {Array.from(text).map((ch, i) => (
          <span key={i} className="roll-ch">
            <span className="roll-in">
              <i>{ch}</i>
              <i>{ch}</i>
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
