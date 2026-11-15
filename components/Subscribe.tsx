import { useCallback } from 'react';
import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import { Subscribers } from 'lib/types';
import SpringyEmail from 'components/SpringyEmail';

export default function Subscribe() {
  const { data } = useSWR<Subscribers>('/api/subscribers', fetcher);
  const subscriberCount = Number(data?.count) || 0;

  const subscribe = useCallback(async (email: string) => {
    const res = await fetch(
      `/api/subscribe?email=${encodeURIComponent(email)}`,
      { method: 'POST' }
    );
    const { error } = await res.json().catch(() => ({ error: res.statusText }));
    return error ? String(error) : null;
  }, []);

  return (
    <div className="surface w-full my-4 p-5 sm:p-6 rounded-[28px]">
      <p className="text-lg font-bold tracking-tight text-ink">
        Subscribe to the newsletter
      </p>
      <p className="mt-1 mb-5 text-sm text-muted">
        Get emails from me about web development, tech, and early access to new
        articles.
      </p>
      <SpringyEmail onSubmit={subscribe} />
      <p className="mt-1 text-xs text-muted-2">
        {`${
          subscriberCount > 0 ? subscriberCount.toLocaleString() : '-'
        } subscribers – `}
        <a
          href="https://www.getrevue.co/profile/leerob"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          View all issues
        </a>
      </p>
    </div>
  );
}
