import { useEffect, useRef } from 'react';

import { S, tune, step, atRest, register, after, kick } from 'lib/spring';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DONE_W = 232; // px, width of the green "on the list" pill

// Springy Input (designbookmark.com/motion#db-springy-input): the real input
// stays in place (typing, selection, paste, a11y) but its text is transparent.
// A mirror draws one span per character: new ones land with a bounce, deleted
// ones float away, and a custom caret springs between positions, stretching
// with its speed. Submit: a wrong email shakes the letters in a wave, a right
// one sends them up and the field morphs into a green pill.
export default function SpringyEmail({
  onSubmit
}: {
  // resolves to an error message, or null on success
  onSubmit: (email: string) => Promise<string | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  const helpRef = useRef<HTMLParagraphElement>(null);
  const submitRef = useRef<(e: React.FormEvent) => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current!,
      field = fieldRef.current!,
      input = inputRef.current!;
    const layer = layerRef.current!,
      caret = caretRef.current!,
      label = labelRef.current!;
    const go = goRef.current!,
      help = helpRef.current!;

    const C = S(0, 700, 32); // caret x
    const LB = S(0, 420, 26); // label float 0..1
    const W = S(0, 300, 20); // field width (0 = natural)
    const shake = S(0, 700, 10);
    let spans: HTMLSpanElement[] = [],
      prev = '',
      scroll = 0,
      lastMove = 0;
    let focused = false,
      busy = false,
      done = false;

    function sync() {
      const next = input.value;
      if (next === prev) return;
      let a = 0;
      while (a < prev.length && a < next.length && prev[a] === next[a]) a++;
      let b = 0;
      while (
        b < prev.length - a &&
        b < next.length - a &&
        prev[prev.length - 1 - b] === next[next.length - 1 - b]
      )
        b++;
      // removed characters float away from where they were
      spans.splice(a, prev.length - a - b).forEach((s) => {
        const left = s.offsetLeft;
        s.classList.remove('in', 'nope');
        s.style.left = left + 'px';
        s.classList.add('out');
        setTimeout(() => s.remove(), 360);
      });
      // inserted characters land one after another (a paste becomes a wave)
      const ref = spans[a] || null;
      const fresh = Array.from(next.slice(a, next.length - b)).map((ch, i) => {
        const s = document.createElement('span');
        s.className = 'si-ch in';
        s.textContent = ch;
        s.style.setProperty('--d', Math.min(i, 30) * 18 + 'ms');
        layer.insertBefore(s, ref);
        return s;
      });
      spans.splice(a, 0, ...fresh);
      prev = next;
      lastMove = performance.now();
      field.classList.remove('err');
      help.classList.remove('err');
      help.textContent = '';
      go.classList.toggle('idle', !next);
      kick();
    }

    function wave(cls: 'nope' | 'fly', gap: number) {
      spans.forEach((s, i) => {
        s.classList.remove('in', 'nope');
        void s.offsetWidth; // restart the animation
        s.style.setProperty('--d', i * gap + 'ms');
        s.classList.add(cls);
      });
    }

    function refuse(text: string) {
      wave('nope', 14);
      field.classList.add('err');
      help.classList.add('err');
      help.textContent = text;
      shake.v += 420;
      input.focus();
      kick();
    }

    submitRef.current = async (e) => {
      e.preventDefault();
      if (busy || done) return;
      const v = input.value.trim();
      if (!EMAIL.test(v)) {
        refuse(
          v ? 'That email looks off, check it again' : 'Type your email first'
        );
        return;
      }
      busy = true;
      field.classList.add('busy');
      const error = await onSubmit(v).catch(
        () => 'Something went wrong, try again'
      );
      field.classList.remove('busy');
      busy = false;
      if (error) {
        refuse(error);
        return;
      }
      done = true;
      wave('fly', 16);
      after(0.25 + spans.length * 0.016, () => {
        W.x = wrap.clientWidth;
        W.v = 0;
        tune(W, 300, 20);
        W.t = DONE_W;
        field.classList.add('ok');
        field.setAttribute('aria-label', "You're on the list");
        input.blur();
      });
    };

    const onFocus = () => {
      focused = true;
      field.classList.add('focus');
      kick();
    };
    const onBlur = () => {
      focused = false;
      field.classList.remove('focus');
      kick();
    };
    const onMove = () => {
      lastMove = performance.now();
      kick();
    };
    input.addEventListener('input', sync);
    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);
    const moves = ['keydown', 'keyup', 'click', 'select'];
    moves.forEach((ev) => input.addEventListener(ev, onMove));

    function caretTarget() {
      const i = input.selectionEnd ?? spans.length;
      if (!spans.length) return 0;
      if (i < spans.length) return spans[i].offsetLeft;
      const l = spans[spans.length - 1];
      return l.offsetLeft + l.offsetWidth;
    }

    const unregister = register({
      frame(dt) {
        C.t = caretTarget();
        LB.t = focused || input.value ? 1 : 0;
        step(C, dt);
        step(LB, dt);
        step(W, dt);
        step(shake, dt);
      },
      render() {
        // keep the caret in view when the text is wider than the box
        const box = layer.parentElement!.clientWidth;
        const want = Math.max(0, C.t - box + 6);
        scroll += (want - scroll) * 0.25;
        if (Math.abs(want - scroll) < 0.3) scroll = want;
        layer.style.transform = `translateX(${-scroll}px)`;
        input.scrollLeft = scroll;

        const speed = Math.abs(C.v);
        const stretch = Math.min(speed / 80, 7);
        caret.style.width = 2 + stretch + 'px';
        // the stretch trails behind the direction of travel
        caret.style.transform = `translateX(${C.x - scroll - (C.v > 0 ? stretch : 0)}px)`;
        const idle = performance.now() - lastMove > 550 && speed < 5;
        caret.style.opacity = focused && !busy ? '1' : '0';
        caret.classList.toggle('blink', focused && idle);

        const f = LB.x;
        label.style.transform = `translateY(${-13 * f}px) scale(${1 - 0.3 * f})`;
        field.style.width = W.x > 1 ? W.x + 'px' : '';
        field.style.transform = `translateX(${shake.x}px)`;
      },
      // the caret blink is CSS; springs only need frames while moving
      idle: () =>
        !(focused && performance.now() - lastMove < 600) &&
        [C, LB, W, shake].every((s) => atRest(s, 0.05))
    });

    return () => {
      input.removeEventListener('input', sync);
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('blur', onBlur);
      moves.forEach((ev) => input.removeEventListener(ev, onMove));
      unregister();
    };
  }, [onSubmit]);

  return (
    <div ref={wrapRef} className="flex flex-col items-center gap-2.5 w-full">
      <form
        ref={fieldRef}
        className="si-field"
        noValidate
        onSubmit={(e) => submitRef.current(e)}
      >
        <label ref={labelRef} className="si-label" htmlFor="newsletter-email">
          Email address
        </label>
        <div className="si-box">
          <div className="si-layer">
            <div ref={layerRef} className="si-layer-in" />
          </div>
          <input
            ref={inputRef}
            id="newsletter-email"
            className="si-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            aria-describedby="newsletter-help"
          />
          <span ref={caretRef} className="si-caret" />
        </div>
        <button
          ref={goRef}
          className="si-go idle"
          type="submit"
          aria-label="Join the list"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <span className="submit-spin" aria-hidden="true" />
        </button>
        <div className="si-done" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          You&apos;re on the list
        </div>
      </form>
      <p
        ref={helpRef}
        id="newsletter-help"
        className="si-help"
        aria-live="polite"
      />
    </div>
  );
}
