import Link from 'next/link';
import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import { Views } from 'lib/types';

export default function BlogPostCard({ title, slug }) {
  const { data } = useSWR<Views>(`/api/views/${slug}`, fetcher);
  const views = data?.total;

  return (
    <Link
      href={`/blog/${slug}`}
      className="surface block w-full md:w-1/3 rounded-3xl p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col md:flex-row justify-between">
          <h4 className="text-lg font-semibold leading-snug mb-6 sm:mb-10 w-full text-ink tracking-tight">
            {title}
          </h4>
        </div>
        <div className="flex items-center text-sm text-muted capsize">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="ml-2 align-baseline capsize">
            {views ? new Number(views).toLocaleString() : '–––'}
          </span>
        </div>
      </div>
    </Link>
  );
}
