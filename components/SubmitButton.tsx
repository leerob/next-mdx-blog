import { useEffect, useRef } from 'react';

import { Form } from 'lib/types';
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

const W_IDLE = 112,
  W_LOAD = 32,
  W_DONE = 100;
const MIN_LOAD = 0.6; // s, so a fast request still reads as "working"

// Loading > Success (designbookmark.com/motion#db-loading-success): on submit
// the label drops away and the button closes into a circle with a spinner.
// When the request succeeds it opens into a green pill, the check draws itself
// and the done label rises in. A moment later it goes back to the label.
export default function SubmitButton({
  state,
  label,
  doneLabel
}: {
  state: Form;
  label: string;
  doneLabel: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const txtRef = useRef<HTMLSpanElement>(null);
  const spinRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const tickRef = useRef<SVGPathElement>(null);
  const api = useRef<{ load(): void; done(): void; reset(): void }>();

  useEffect(() => {
    const btn = btnRef.current!,
      txt = txtRef.current!,
      spin = spinRef.current!;
    const done = doneRef.current!,
      tick = tickRef.current!;
    const W = S(W_IDLE, 300, 22),
      T = S(1, 400, 30),
      P = S(0, 300, 28);
    const D = S(0, 220, 20),
      G = S(0, 200, 30),
      K = S(0, 120, 20);
    const len = 22;
    tick.style.strokeDasharray = String(len);
    let phase: 'idle' | 'load' | 'done' = 'idle',
      rot = 0,
      loadAt = 0;
    let timers = [];
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

    function idle() {
      clear();
      phase = 'idle';
      P.t = 0;
      D.t = 0;
      G.t = 0;
      K.t = 0;
      W.t = W_IDLE;
      later(0.12, () => {
        T.t = 1;
      });
      kick();
    }

    api.current = {
      load() {
        if (phase !== 'idle') clear();
        phase = 'load';
        loadAt = performance.now();
        T.t = 0;
        W.t = W_LOAD;
        P.t = 1;
        D.t = 0;
        G.t = 0;
        K.t = 0;
        kick();
      },
      done() {
        if (phase !== 'load') return;
        const wait = Math.max(
          0,
          MIN_LOAD - (performance.now() - loadAt) / 1000
        );
        later(wait, () => {
          phase = 'done';
          P.t = 0;
          W.t = W_DONE;
          G.t = 1;
          D.t = 1;
          later(0.15, () => {
            K.t = 1;
          });
          later(2.2, idle);
        });
      },
      reset() {
        if (phase === 'load') idle();
      }
    };

    const unregister = register({
      frame(dt) {
        rot += dt * 360 * 1.4;
        [W, T, P, D, G, K].forEach((s) => step(s, dt));
      },
      render() {
        btn.style.width = W.x.toFixed(2) + 'px';
        // the 4px corners round up into a circle as it closes
        const shut = clamp((W_IDLE - W.x) / (W_IDLE - W_LOAD), 0, 1);
        btn.style.borderRadius = (4 + 12 * shut).toFixed(2) + 'px';
        const g = clamp(G.x, 0, 1);
        btn.style.background = `color-mix(in srgb, #22c55e ${(g * 100).toFixed(1)}%, var(--btn-bg))`;
        txt.style.opacity = clamp(T.x, 0, 1).toFixed(3);
        txt.style.transform = `translateY(${((1 - T.x) * 10).toFixed(2)}px)`;
        spin.style.opacity = clamp(P.x, 0, 1).toFixed(3);
        spin.style.transform = `rotate(${rot % 360}deg) scale(${(0.6 + 0.4 * clamp(P.x, 0, 1.2)).toFixed(3)})`;
        done.style.opacity = clamp(D.x, 0, 1).toFixed(3);
        done.style.transform = `translateY(${((1 - D.x) * 9).toFixed(2)}px)`;
        tick.style.strokeDashoffset = (len * (1 - clamp(K.x, 0, 1))).toFixed(2);
      },
      idle: () => phase !== 'load' && [W, T, P, D, G, K].every((s) => atRest(s))
    });

    return () => {
      clear();
      unregister();
    };
  }, []);

  useEffect(() => {
    if (state === Form.Loading) api.current?.load();
    else if (state === Form.Success) api.current?.done();
    else api.current?.reset();
  }, [state]);

  return (
    <button
      ref={btnRef}
      type="submit"
      disabled={state === Form.Loading}
      aria-label={state === Form.Loading ? `${label}…` : undefined}
      style={{ width: W_IDLE }}
      className="absolute right-1 top-1 h-8 rounded overflow-hidden font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 [--btn-bg:theme(colors.gray.100)] dark:[--btn-bg:theme(colors.gray.700)]"
    >
      <span
        ref={txtRef}
        className="absolute inset-0 flex items-center justify-center will-change-transform"
      >
        {label}
      </span>
      <span
        ref={spinRef}
        aria-hidden="true"
        className="submit-spin absolute left-1/2 top-1/2 w-[18px] h-[18px] -ml-[9px] -mt-[9px] rounded-full opacity-0 will-change-transform"
      />
      <span
        ref={doneRef}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-1.5 text-white opacity-0 whitespace-nowrap will-change-transform"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-[18px] h-[18px] fill-none stroke-current"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path ref={tickRef} d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        <b className="font-semibold">{doneLabel}</b>
      </span>
    </button>
  );
}
