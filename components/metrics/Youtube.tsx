import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import { YouTube } from 'lib/types';
import MetricCard from 'components/metrics/Card';

export default function YouTubeCard() {
  const { data } = useSWR<YouTube>('/api/youtube', fetcher);

  const subscriberCount = Number(data?.subscriberCount) || 0;
  const viewCount = Number(data?.viewCount) || 0;
  const link = 'https://www.youtube.com/@neoziyism';

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
      <MetricCard
        header="YouTube Subscribers"
        link={link}
        metric={subscriberCount}
        isCurrency={false}
      />
      <MetricCard
        header="YouTube Views"
        link={link}
        metric={viewCount}
        isCurrency={false}
      />
    </div>
  );
}
