import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import { Unsplash } from 'lib/types';
import MetricCard from 'components/metrics/Card';

export default function UnsplashCard() {
  const { data } = useSWR<Unsplash>('/api/unsplash', fetcher);

  const downloads = Number(data?.downloads) || 0;
  const views = Number(data?.views) || 0;
  const link = 'https://unsplash.com/@ziyizhu';

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
      <MetricCard
        header="Unsplash Downloads"
        link={link}
        metric={downloads}
        isCurrency={false}
      />
      <MetricCard
        header="Unsplash Views"
        link={link}
        metric={views}
        isCurrency={false}
      />
    </div>
  );
}
