import { useEffect, useRef } from 'react';

import { S, step, atRest, register, kick } from 'lib/spring';

// Number roll from Stat Card (designbookmark.com/motion#db-stat-card): when
// the metric arrives it springs up from zero to its value instead of popping
// in, and rolls between values if it changes.
function RollingNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useRef(S(0, 160, 22));

  useEffect(() => {
    const el = ref.current!,
      val = spring.current;
    return register({
      frame(dt) {
        step(val, dt);
      },
      render() {
        el.textContent = Math.max(0, Math.round(val.x)).toLocaleString();
      },
      idle: () => atRest(val, 0.5)
    });
  }, []);

  useEffect(() => {
    spring.current.t = value;
    kick();
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      0
    </span>
  );
}

// Laid out like Stat Card (designbookmark.com/motion#db-stat-card): a
// borderless surface, a muted label and one big tabular number.
export default function MetricCard({ header, link, metric, isCurrency }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={link}
      className="metric-card not-prose surface group block w-full rounded-3xl p-5 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between text-sm leading-[18px] text-muted">
        {header}
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 17L17 7M8 7h9v9"
          />
        </svg>
      </div>
      <p className="mt-1.5 text-[34px] leading-10 font-semibold tracking-[-0.02em] text-ink">
        {metric > 0 && isCurrency && '$'}
        {metric > 0 ? <RollingNumber value={metric} /> : '–'}
      </p>
    </a>
  );
}
