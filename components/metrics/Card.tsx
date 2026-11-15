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

export default function MetricCard({ header, link, metric, isCurrency }) {
  return (
    <div className="metric-card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 w-full">
      <a
        aria-label={header}
        target="_blank"
        rel="noopener noreferrer"
        href={link}
      >
        <div className="flex items-center text-gray-900 dark:text-gray-100">
          {header}
          <svg
            className="h-4 w-4 ml-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      </a>
      <p className="mt-2 text-3xl font-bold spacing-sm text-black dark:text-white">
        {metric > 0 && isCurrency && '$'}
        {metric > 0 ? <RollingNumber value={metric} /> : '-'}
      </p>
    </div>
  );
}
