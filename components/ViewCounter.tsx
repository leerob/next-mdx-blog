import { useEffect } from 'react';
import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import { Views } from 'lib/types';

export default function ViewCounter({ slug }: { slug: string }) {
  const { data, mutate } = useSWR<Views>(`/api/views/${slug}`, fetcher);
  const views = Number(data?.total) || 0;

  useEffect(() => {
    let cancelled = false;

    const registerView = async () => {
      try {
        const res = await fetch(`/api/views/${slug}`, { method: 'POST' });
        if (!res.ok) return;
        const updated: Views = await res.json();
        // the POST returns the new total; show it without refetching
        if (!cancelled) mutate(updated, false);
      } catch {
        // counting a view is best effort; the GET still shows the total
      }
    };

    registerView();
    return () => {
      cancelled = true;
    };
  }, [slug, mutate]);

  return <span>{`${views > 0 ? views.toLocaleString() : '–––'} views`}</span>;
}
