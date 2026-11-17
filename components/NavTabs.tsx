import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import cn from 'classnames';

import { S, tune, step, clamp, atRest, register, kick } from 'lib/spring';

const ITEMS = [
  { href: '/', text: 'Home' },
  { href: '/guestbook', text: 'Guestbook' },
  { href: '/dashboard', text: 'Dashboard' },
  { href: '/blog', text: 'Blog' },
  { href: '/notes', text: 'Notes' },
  { href: 'https://portfolio.ziyizhu.com/', text: 'Portfolio' }
];

// Where the pill was when the previous page unmounted, so after navigating
// it stretches over from the old tab instead of appearing under the new one.
let lastPill: { l: number; r: number; o: number } | null = null;

// Tab Pill (designbookmark.com/motion#db-tab-pill): two springs per pill, one
// per edge. The edge facing the move is stiff and the other is soft, so the
// pill stretches toward the new tab, then pulls its tail in. It follows the
// pointer and returns to the current page's tab when the pointer leaves.
export default function NavTabs() {
  const router = useRouter();
  const active = ITEMS.findIndex((item) => item.href === router.asPath);
  const pillRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const pickRef = useRef<(i: number) => void>(() => {});

  useEffect(() => {
    const pill = pillRef.current;
    const els = itemRefs.current;
    if (!pill) return;

    const A = S(0),
      B = S(0),
      O = S(0, 420, 32);
    let cur = -1;

    function pick(i: number, snap = false) {
      if (i < 0) {
        O.t = 0;
        kick();
        return;
      }
      const el = els[i];
      if (!el || !el.offsetWidth) return;
      const l = el.offsetLeft,
        r = l + el.offsetWidth;
      const dir = l >= A.t ? 1 : -1;
      if (dir > 0) {
        tune(B, 620, 40);
        tune(A, 170, 19);
      } else {
        tune(A, 620, 40);
        tune(B, 170, 19);
      }
      A.t = l;
      B.t = r;
      O.t = 1;
      // nothing to slide from: open up in place
      if (snap || O.x < 0.05) {
        A.x = l;
        B.x = r;
      }
      pill.style.top = el.offsetTop + 'px';
      pill.style.height = el.offsetHeight + 'px';
      cur = i;
      kick();
    }
    pickRef.current = pick;

    if (lastPill && lastPill.o > 0.05) {
      A.x = A.t = lastPill.l;
      B.x = B.t = lastPill.r;
      O.x = O.t = lastPill.o;
    }
    pick(active);

    const relayout = () => {
      const i = cur;
      cur = -1;
      pick(i, true);
    };
    window.addEventListener('resize', relayout);
    document.fonts?.ready.then(relayout);

    const unregister = register({
      frame(dt) {
        step(A, dt);
        step(B, dt);
        step(O, dt);
      },
      render() {
        pill.style.transform = `translateX(${A.x.toFixed(2)}px)`;
        pill.style.width = Math.max(0, B.x - A.x).toFixed(2) + 'px';
        pill.style.opacity = clamp(O.x, 0, 1).toFixed(3);
      },
      idle: () => atRest(A) && atRest(B) && atRest(O)
    });

    return () => {
      lastPill = { l: A.x, r: B.x, o: O.x };
      window.removeEventListener('resize', relayout);
      unregister();
    };
  }, [active]);

  return (
    <div
      className="relative hidden md:flex items-center"
      onPointerLeave={() => pickRef.current(active)}
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className="absolute left-0 top-0 rounded-full bg-fill-2 opacity-0 will-change-transform pointer-events-none"
      />
      {ITEMS.map((item, i) => (
        <NextLink
          key={item.href}
          href={item.href}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          onPointerEnter={() => pickRef.current(i)}
          onFocus={() => pickRef.current(i)}
          onBlur={() => pickRef.current(active)}
          aria-current={i === active ? 'page' : undefined}
          className={cn(
            i === active
              ? 'font-semibold text-gray-800 dark:text-gray-200'
              : 'font-normal text-gray-600 dark:text-gray-400',
            'relative flex items-center h-10 px-3.5 rounded-full transition-colors'
          )}
        >
          {item.text}
        </NextLink>
      ))}
    </div>
  );
}
