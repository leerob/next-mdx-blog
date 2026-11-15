import { useEffect, useRef } from 'react';

import {
  S,
  step,
  clamp,
  atRest,
  register,
  after,
  cancel,
  kick,
  Spring
} from 'lib/spring';

// The rest of the first title that continues what was typed, matched at the
// start of the title first, then at the start of any word in it.
function complete(value: string, titles: string[]) {
  const q = value.toLowerCase();
  if (!q.trim()) return '';
  const hit = (t: string) => {
    const l = t.toLowerCase();
    let i = l.indexOf(q);
    while (i > 0 && /\w/.test(l[i - 1])) i = l.indexOf(q, i + 1);
    return i;
  };
  const best =
    titles.find((t) => t.toLowerCase().startsWith(q)) ??
    titles.find((t) => hit(t) >= 0);
  if (!best) return '';
  return best.slice(hit(best) + q.length);
}

type Letter = { el: HTMLSpanElement; o: Spring; y: Spring };

// Ghost Suggestion (designbookmark.com/motion#db-ghost-suggestion): as you
// type, the rest of a matching post title appears in a dim colour with a Tab
// key next to it. Tab (or → at the end, or tapping the key) accepts it: each
// suggested letter turns bright with a small hop, left to right.
//
// The input's own text is transparent; a mirror drawn over it shows the typed
// text and the suggestion, so the letters can move on their own.
export default function GhostSearch({
  titles,
  onChange
}: {
  titles: string[];
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const tabRef = useRef<HTMLSpanElement>(null);
  const api = useRef<{ input(): void; accept(): boolean; dismiss(): void }>();

  useEffect(() => {
    const input = inputRef.current!,
      track = trackRef.current!;
    const typed = typedRef.current!,
      ghost = ghostRef.current!,
      tab = tabRef.current!;
    const tabS = S(0, 520, 24);
    let letters: Letter[] = [],
      rest = '',
      offered = false,
      timers = [];
    const later = (s: number, f: () => void) => {
      const t = after(s, () => {
        timers = timers.filter((x) => x !== t);
        f();
      });
      timers.push(t);
    };
    const clear = () => {
      timers.forEach(cancel);
      timers = [];
    };

    function offer(text: string) {
      ghost.innerHTML = '';
      letters = [];
      rest = text;
      offered = !!text;
      tabS.t = offered ? 1 : 0;
      if (!offered) tabS.x = 0;
      Array.from(text).forEach((ch, i) => {
        const el = document.createElement('span');
        el.className = 'ghost-letter';
        el.textContent = ch;
        el.style.opacity = '0';
        ghost.appendChild(el);
        const l = { el, o: S(0, 300, 30), y: S(0, 520, 16) };
        letters.push(l);
        later(i * 0.008, () => {
          l.o.t = 1;
        });
      });
      kick();
    }

    api.current = {
      input() {
        clear();
        typed.textContent = input.value;
        const atEnd = input.selectionStart === input.value.length;
        offer(atEnd ? complete(input.value, titles) : '');
      },
      accept() {
        if (!offered) return false;
        offered = false;
        clear();
        tabS.v = -9;
        tabS.t = 0; // the key goes down and away
        letters.forEach((l, i) =>
          later(i * 0.016, () => {
            l.el.classList.add('ok');
            l.y.v = -70;
            l.o.t = 1;
          })
        );
        input.value += rest;
        input.setSelectionRange(input.value.length, input.value.length);
        onChange(input.value);
        kick();
        return true;
      },
      dismiss() {
        clear();
        typed.textContent = input.value;
        offer('');
      }
    };

    const unregister = register({
      frame(dt) {
        step(tabS, dt);
        letters.forEach((l) => {
          step(l.o, dt);
          step(l.y, dt);
        });
      },
      render() {
        track.style.transform = `translateX(${-input.scrollLeft}px)`;
        const t = clamp(tabS.x, -0.2, 1.2);
        tab.style.opacity = clamp(t, 0, 1).toFixed(3);
        tab.style.transform = `scale(${(0.6 + 0.4 * clamp(t, 0, 1.2)).toFixed(4)})`;
        letters.forEach((l) => {
          l.el.style.opacity = clamp(l.o.x, 0, 1).toFixed(3);
          l.el.style.transform = `translateY(${l.y.x.toFixed(2)}px)`;
        });
      },
      idle: () =>
        atRest(tabS) && letters.every((l) => atRest(l.o) && atRest(l.y))
    });

    return () => {
      clear();
      unregister();
    };
  }, [titles, onChange]);

  const sync = () => kick();

  return (
    <div className="relative w-full mt-4 mb-4">
      <input
        ref={inputRef}
        aria-label="Search articles"
        aria-describedby="ghost-search-hint"
        type="text"
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value);
          api.current?.input();
        }}
        onKeyDown={(e) => {
          const el = e.currentTarget;
          const atEnd = el.selectionStart === el.value.length;
          if (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd)) {
            if (api.current?.accept()) e.preventDefault();
          } else if (e.key === 'Escape') {
            api.current?.dismiss();
          }
        }}
        onSelect={sync}
        onScroll={sync}
        onBlur={() => api.current?.dismiss()}
        placeholder="Search articles"
        className="surface block w-full h-12 pl-5 pr-12 py-3 rounded-full border-0 focus:ring-2 focus:ring-[color:var(--fill-3)] text-transparent caret-[color:var(--text)] placeholder:text-muted-2"
      />
      <span id="ghost-search-hint" className="sr-only">
        Press Tab to complete a matching title.
      </span>
      <div
        aria-hidden="true"
        className="absolute inset-0 pl-5 pr-12 py-3 overflow-hidden pointer-events-none"
      >
        <span ref={trackRef} className="flex items-center whitespace-pre">
          <span ref={typedRef} className="text-ink" />
          <span ref={ghostRef} />
          <span
            ref={tabRef}
            onMouseDown={(e) => {
              e.preventDefault();
              api.current?.accept();
            }}
            className="ml-2 px-1.5 rounded-md text-[11px] leading-[18px] font-semibold bg-fill-3 text-ink-2 opacity-0 pointer-events-auto cursor-pointer will-change-transform"
          >
            Tab
          </span>
        </span>
      </div>
      <svg
        className="absolute w-5 h-5 text-muted right-4 top-3.5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}
