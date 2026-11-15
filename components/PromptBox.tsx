import { FormEvent, RefObject, useEffect, useRef } from 'react';
import cn from 'classnames';

import { Form } from 'lib/types';
import { S, step, clamp, atRest, register, kick } from 'lib/spring';
import LetterLimit from 'components/LetterLimit';

const LINE = 22; // px, one line of text
const MAX_H = 88; // the field stops growing at four lines

// Prompt Box (designbookmark.com/motion#db-prompt-box): the field grows with
// the text on a spring, the send button lights up once there is something to
// send and turns into a spinner while it goes out, and a status line opens
// above the text to say what happened.
export default function PromptBox({
  fieldRef,
  state,
  message,
  limit,
  placeholder,
  onSubmit
}: {
  fieldRef: RefObject<HTMLTextAreaElement>;
  state: Form;
  message?: string;
  limit: number;
  placeholder: string;
  onSubmit: (e: FormEvent) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLElement>(null);
  const spinRef = useRef<HTMLElement>(null);
  const api = useRef<{
    fit(): void;
    busy(on: boolean): void;
    status(open: boolean): void;
  }>();

  useEffect(() => {
    const field = fieldRef.current!,
      status = statusRef.current!;
    const send = sendRef.current!,
      arrow = arrowRef.current!,
      spin = spinRef.current!;
    const H = S(LINE, 420, 34); // field height
    const SH = S(0, 380, 30); // status line, 0 closed, 1 open
    const M = S(0, 520, 30); // button, 0 arrow, 1 spinner
    let rot = 0;

    function fit() {
      field.style.height = 'auto';
      H.t = Math.min(Math.max(field.scrollHeight, LINE), MAX_H);
      field.style.height = H.x + 'px';
      send.classList.toggle('ready', M.t > 0 || !!field.value.trim());
      kick();
    }
    api.current = {
      fit,
      busy(on) {
        M.t = on ? 1 : 0;
        send.classList.toggle('ready', on || !!field.value.trim());
        kick();
      },
      status(open) {
        SH.t = open ? 1 : 0;
        kick();
      }
    };
    field.addEventListener('input', fit);
    fit();

    const unregister = register({
      frame(dt) {
        rot += dt * 360 * 1.4;
        [H, SH, M].forEach((s) => step(s, dt));
      },
      render() {
        field.style.height = H.x.toFixed(2) + 'px';
        field.style.overflowY = H.t >= MAX_H ? 'auto' : 'hidden';
        status.style.height = (Math.max(0, SH.x) * 30).toFixed(2) + 'px';
        status.style.opacity = clamp(SH.x, 0, 1).toFixed(3);
        const m = clamp(M.x, 0, 1.2);
        arrow.style.transform = `scale(${Math.max(0, 1 - m)}) rotate(${m * 90}deg)`;
        spin.style.transform = `rotate(${rot % 360}deg) scale(${Math.max(0, m)})`;
      },
      idle: () => M.t === 0 && [H, SH, M].every((s) => atRest(s))
    });
    return () => {
      field.removeEventListener('input', fit);
      unregister();
    };
  }, [fieldRef]);

  // the status line follows the request; a success closes again by itself
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.busy(state === Form.Loading);
    a.status(state !== Form.Initial);
    if (state === Form.Success) a.fit();
    if (state !== Form.Success) return;
    const t = setTimeout(() => a.status(false), 2400);
    return () => clearTimeout(t);
  }, [state]);

  const kind =
    state === Form.Loading
      ? 'think'
      : state === Form.Success
        ? 'done'
        : state === Form.Error
          ? 'fail'
          : '';
  const label = state === Form.Loading ? 'Signing' : (message ?? '');

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={cn(
        'rounded-[24px] bg-fill-1 py-2.5 pr-2.5 pl-[18px]',
        state === Form.Loading && 'prompt-busy'
      )}
    >
      <div
        ref={statusRef}
        aria-live="polite"
        className={cn('prompt-status', kind)}
        style={{ height: 0, opacity: 0 }}
      >
        <span className="mark" />
        <span className="label">{label}</span>
      </div>
      <div className="flex items-end gap-2.5">
        <textarea
          ref={fieldRef}
          rows={1}
          required
          aria-label="Your message"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className="flex-1 min-w-0 h-[22px] mb-[5px] p-0 border-0 bg-transparent resize-none overflow-hidden text-[15px] leading-[22px] text-ink placeholder:text-muted-2 focus:outline-none focus:ring-0"
        />
        <LetterLimit inputRef={fieldRef} limit={limit} resetKey={state} />
        <button
          ref={sendRef}
          type="submit"
          aria-label={state === Form.Loading ? 'Signing' : 'Sign the guestbook'}
          disabled={state === Form.Loading}
          className="prompt-send"
        >
          <i ref={arrowRef}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </i>
          <i ref={spinRef} style={{ transform: 'scale(0)' }}>
            <span className="submit-spin block w-4 h-4 rounded-full" />
          </i>
        </button>
      </div>
    </form>
  );
}
