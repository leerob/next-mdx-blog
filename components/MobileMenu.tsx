import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  S,
  step,
  clamp,
  atRest,
  register,
  after,
  cancel,
  kick
} from 'lib/spring';

const LINKS = [
  { href: '/', text: 'Home' },
  { href: '/guestbook', text: 'Guestbook' },
  { href: '/dashboard', text: 'Dashboard' },
  { href: '/blog', text: 'Blog' },
  { href: '/notes', text: 'Notes' },
  { href: 'https://portfolio.ziyizhu.com/', text: 'Portfolio' }
];

// The original's measurements: closed it is a 150 × 52 pill (radius 26) with
// the ZZ logo inset 20px on the left and the 24px toggle 14px from the right;
// the header stays 52px tall when open.
const PILL_W = 150,
  HEAD = 52,
  HEAD_OPEN = 52,
  PAD_R = 14,
  ROW = 48;

// Dynamic Menu (designbookmark.com/motion#db-dynamic-menu): a pill with the
// name and a two line toggle. Open, it springs into a panel: width and height have
// their own springs, the height a little softer so the panel lands after it
// has widened. The lines meet in the middle and turn into a cross, and the
// links rise in one by one, dropping away in reverse when it closes.
export default function MobileMenu() {
  const router = useRouter();
  const path = router.asPath.split(/[?#]/)[0]; // without ?query or #hash
  const active = LINKS.find((l) => l.href === path);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const b1Ref = useRef<HTMLElement>(null);
  const b2Ref = useRef<HTMLElement>(null);
  const z2Ref = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const liRefs = useRef<(HTMLLIElement | null)[]>([]);
  const setRef = useRef<(o: boolean) => void>(() => {});

  useEffect(() => {
    const menu = menuRef.current!,
      b1 = b1Ref.current!,
      b2 = b2Ref.current!,
      z2 = z2Ref.current!,
      btn = btnRef.current!,
      list = listRef.current!;
    const lis = liRefs.current.map((el) => ({ el: el!, s: S(0, 260, 22) }));
    const W = S(PILL_W, 320, 26),
      H = S(HEAD, 240, 22),
      X = S(0, 380, 24);
    let timers = [];

    setRef.current = (o) => {
      // open wide, but stop short of the theme toggle on the right
      // (page gutters 2 × 32px, toggle 40px, gap 8px)
      const big = Math.min(300, window.innerWidth - 64 - 48);
      W.t = o ? big : PILL_W;
      H.t = o ? HEAD_OPEN + 4 + lis.length * ROW + 10 : HEAD;
      X.t = o ? 1 : 0;
      timers.forEach(cancel);
      timers = lis.map((l, i) =>
        after(o ? 0.08 + i * 0.05 : (lis.length - 1 - i) * 0.03, () => {
          l.s.t = o ? 1 : 0;
        })
      );
      kick();
    };

    const unregister = register({
      frame(dt) {
        [W, H, X].forEach((s) => step(s, dt));
        lis.forEach((l) => step(l.s, dt));
      },
      render() {
        menu.style.width = W.x.toFixed(2) + 'px';
        menu.style.height = H.x.toFixed(2) + 'px';
        // a full pill (radius 26) when closed, a rounded panel (22) when open
        const o = clamp(X.x, 0, 1);
        menu.style.borderRadius = (HEAD / 2 - 4 * o).toFixed(2) + 'px';
        // the left Z stays put and the right one slides out by 0.7rem, the
        // same total gap the portfolio's hover opens between them
        z2.style.transform = `translate(${(11.2 * o).toFixed(2)}px, -50%)`;
        // the header keeps its height, so the name and toggle stay put
        const head = HEAD + (HEAD_OPEN - HEAD) * o;
        btn.style.height = head.toFixed(2) + 'px';
        list.style.top = head.toFixed(2) + 'px';
        const x = clamp(X.x, -0.1, 1.1);
        // two lines 8px apart meet in the middle and turn 45 degrees each way
        b1.style.transform = `translateY(${(-4 * (1 - x)).toFixed(2)}px) rotate(${(45 * x).toFixed(2)}deg)`;
        b2.style.transform = `translateY(${(4 * (1 - x)).toFixed(2)}px) rotate(${(-45 * x).toFixed(2)}deg)`;
        lis.forEach((l) => {
          l.el.style.opacity = clamp(l.s.x, 0, 1).toFixed(3);
          l.el.style.transform = `translateY(${((1 - l.s.x) * 18).toFixed(2)}px)`;
          l.el.style.visibility =
            l.s.x < 0.01 && l.s.t === 0 ? 'hidden' : 'visible';
        });
      },
      idle: () =>
        [W, H, X].every((s) => atRest(s)) && lis.every((l) => atRest(l.s))
    });
    return () => {
      timers.forEach(cancel);
      unregister();
    };
  }, []);

  useEffect(() => {
    setRef.current(open);
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Escape closes it; focus inside goes back to the toggle, not to a link
    // that is about to hide
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (menuRef.current?.contains(document.activeElement))
        btnRef.current?.focus();
      setOpen(false);
    };
    // tabbing out of it closes it too
    const leave = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !menuRef.current?.contains(to)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    document.addEventListener('focusout', leave);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
      document.removeEventListener('focusout', leave);
    };
  }, [open]);

  // close after navigating
  useEffect(() => setOpen(false), [router.asPath]);

  return (
    <div className="relative md:hidden" style={{ width: PILL_W, height: HEAD }}>
      <div
        ref={menuRef}
        className="surface absolute left-0 top-0 z-50 overflow-hidden shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)]"
        style={{ width: PILL_W, height: HEAD, borderRadius: HEAD / 2 }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu-links"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          ref={btnRef}
          // the logo is inset 20px on the left and the toggle 14px on the
          // right; the toggle rides out to the right as the panel opens
          className="group absolute inset-x-0 top-0 flex items-center justify-end text-ink focus:outline-none"
          style={{ height: HEAD, paddingRight: PAD_R }}
        >
          {/* ZZ monogram from portfolio.ziyizhu.com: the two Zs overlap into
              one mark when closed; the right Z slides out as the menu opens */}
          <span
            aria-hidden="true"
            className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-6"
          >
            <span className="zz-letter" style={{ left: 0 }}>
              Z
            </span>
            <span ref={z2Ref} className="zz-letter" style={{ left: '0.8rem' }}>
              Z
            </span>
          </span>
          <span className="relative flex-none w-6 h-6 rounded-full group-focus-visible:ring-2 group-focus-visible:ring-[color:var(--fill-3)] group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-[color:var(--surface)]">
            <i
              ref={b1Ref}
              className="dyn-line"
              style={{ transform: 'translateY(-4px)' }}
            />
            <i
              ref={b2Ref}
              className="dyn-line"
              style={{ transform: 'translateY(4px)' }}
            />
          </span>
        </button>
        <ul
          ref={listRef}
          id="mobile-menu-links"
          className="absolute inset-x-0 px-2.5 pb-2.5 pt-1"
          style={{ top: HEAD }}
        >
          {LINKS.map((l, i) => (
            <li
              key={l.href}
              ref={(el) => {
                liRefs.current[i] = el;
              }}
              className="opacity-0 invisible will-change-transform"
            >
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="flex items-center justify-between h-12 px-2.5 rounded-[14px] text-[22px] font-bold tracking-tight text-ink hover:bg-fill-1"
              >
                {l.text}
                {l === active && (
                  <span className="text-xs font-medium tracking-normal px-2 py-0.5 rounded-full bg-fill-2 text-muted">
                    Here
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
