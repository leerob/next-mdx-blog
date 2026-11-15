import { useEffect, useRef } from 'react';

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

// Copy Button (designbookmark.com/motion#db-copy-button): the copy icon
// shrinks and turns away while a check pops in, the word rolls up from Copy
// to Copied and the button's width springs to fit. After a moment it rolls
// back.
function CopyButton({ getText }: { getText: () => string }) {
  const refs = {
    iCopy: useRef<SVGSVGElement>(null),
    iOk: useRef<SVGSVGElement>(null),
    roll: useRef<HTMLSpanElement>(null),
    w: useRef<HTMLSpanElement>(null)
  };
  const copyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const iCopy = refs.iCopy.current!,
      iOk = refs.iOk.current!;
    const roll = refs.roll.current!,
      w = refs.w.current!;
    const [a, b] = Array.from(w.children) as HTMLElement[];
    const R = S(0, 260, 20),
      I = S(0, 420, 18),
      RW = S(0, 300, 24);
    const widths = () => [a.offsetWidth, b.offsetWidth];
    let timer = null;

    copyRef.current = () => {
      try {
        navigator.clipboard.writeText(getText()).catch(() => {});
      } catch (e) {}
      R.t = 1;
      I.t = 1;
      RW.t = widths()[1];
      cancel(timer);
      timer = after(1.8, () => {
        R.t = 0;
        I.t = 0;
        RW.t = widths()[0];
      });
      kick();
    };

    const unregister = register({
      frame(dt) {
        if (!RW.x) RW.x = RW.t = widths()[0];
        [R, I, RW].forEach((s) => step(s, dt));
      },
      render() {
        roll.style.width = RW.x.toFixed(2) + 'px';
        w.style.transform = `translateY(${(-18 * R.x).toFixed(2)}px)`;
        const i = clamp(I.x, -0.2, 1.2),
          c = clamp(i, 0, 1);
        iCopy.style.opacity = clamp(1 - i * 1.6, 0, 1).toFixed(3);
        iCopy.style.transform = `scale(${(1 - 0.5 * c).toFixed(3)}) rotate(${(-40 * c).toFixed(1)}deg)`;
        iOk.style.opacity = clamp(i * 1.6 - 0.4, 0, 1).toFixed(3);
        iOk.style.transform = `scale(${(0.4 + 0.6 * i).toFixed(3)})`;
      },
      idle: () => RW.x > 0 && atRest(R) && atRest(I) && atRest(RW)
    });
    return () => {
      cancel(timer);
      unregister();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={() => copyRef.current()}
      className="absolute right-2 top-2 flex items-center gap-1.5 h-8 pl-2 pr-2.5 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-700 dark:text-gray-200 text-xs font-medium not-prose"
    >
      <span className="relative w-4 h-4 flex-none">
        <svg
          ref={refs.iCopy}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute inset-0 w-4 h-4 fill-none stroke-current will-change-transform"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="8.5" y="8.5" width="11" height="11" rx="3" />
          <path d="M15.5 8.5V7a2.5 2.5 0 0 0-2.5-2.5H7A2.5 2.5 0 0 0 4.5 7v6A2.5 2.5 0 0 0 7 15.5h1.5" />
        </svg>
        <svg
          ref={refs.iOk}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="absolute inset-0 w-4 h-4 fill-none stroke-current text-green-500 opacity-0 will-change-transform"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span ref={refs.roll} className="relative block h-[18px] overflow-hidden">
        <span
          ref={refs.w}
          aria-live="polite"
          className="flex flex-col items-start will-change-transform"
        >
          <b className="block h-[18px] leading-[18px] font-medium whitespace-nowrap">
            Copy
          </b>
          <b className="block h-[18px] leading-[18px] font-medium whitespace-nowrap text-green-600 dark:text-green-400">
            Copied
          </b>
        </span>
      </span>
    </button>
  );
}

export default function CodeBlock(props: JSX.IntrinsicElements['pre']) {
  const preRef = useRef<HTMLPreElement>(null);
  return (
    <div className="code-block relative">
      <pre ref={preRef} {...props} />
      <CopyButton getText={() => preRef.current?.innerText ?? ''} />
    </div>
  );
}
