import Analytics from 'components/metrics/Analytics';
import Container from 'components/Container';
import GitHub from 'components/metrics/Github';
import { Publications, Citations } from 'components/metrics/SemanticScholar';
import Unsplash from 'components/metrics/Unsplash';
import YouTube from 'components/metrics/Youtube';
import TopTracks from 'components/TopTracks';

export default function Dashboard() {
  return (
    <Container
      title="Dashboard – Ziyi Zhu"
      description="My personal dashboard, tracking metrics across Unsplash, YouTube, GitHub and more."
    >
      <div className="flex flex-col justify-center items-start w-full max-w-2xl mx-auto mb-16">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This is my personal dashboard. I use it to track various metrics
          across platforms like Unsplash, YouTube, GitHub, and more.{' '}
          {/*Want to build your own? Check out my&nbsp;
            <Link
              href="/blog/fetching-data-with-swr"
              className="text-gray-900 dark:text-gray-100 underline"
            >
              blog series.
            </Link>*/}
        </p>
        <div className="flex flex-col gap-4 w-full mt-4">
          <Unsplash />
          <YouTube />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full">
            <Analytics />
            <GitHub />
            <Publications />
            <Citations />
          </div>
        </div>
        <h2 className="font-bold text-2xl md:text-4xl tracking-tight mb-4 mt-16 text-black dark:text-white">
          Top Tracks
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Curious what I'm currently jamming to? Here are my top tracks from the
          past month, updated daily.
        </p>
        <TopTracks />
      </div>
    </Container>
  );
}
