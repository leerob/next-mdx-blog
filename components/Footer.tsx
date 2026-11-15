import Link from 'next/link';

import NowPlaying from 'components/NowPlaying';
import RollText from 'components/RollText';

const ExternalLink = ({ href, children }) => (
  <a
    className="roll-link text-gray-500 transition-colors"
    target="_blank"
    rel="noopener noreferrer"
    href={href}
  >
    <RollText text={children} />
  </a>
);

export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-start max-w-2xl mx-auto w-full mb-8">
      <hr className="w-full border-1 border-gray-200 dark:border-gray-800 mb-8" />
      <NowPlaying />
      <div className="w-full max-w-2xl roll-group grid grid-cols-1 gap-4 pb-16 sm:grid-cols-3">
        <div className="flex flex-col space-y-4">
          <Link href="/" className="roll-link text-gray-500 transition-colors">
            <RollText text="Home" />
          </Link>
          <Link
            href="/about"
            className="roll-link text-gray-500 transition-colors"
          >
            <RollText text="About" />
          </Link>
        </div>
        <div className="flex flex-col space-y-4">
          <ExternalLink href="https://www.linkedin.com/in/ziyizhu/">
            LinkedIn
          </ExternalLink>
          <ExternalLink href="https://github.com/ziyi-zhu">GitHub</ExternalLink>
          <ExternalLink href="https://www.youtube.com/@neoziyism">
            YouTube
          </ExternalLink>
        </div>
        <div className="flex flex-col space-y-4">
          <Link
            href="/guestbook"
            className="roll-link text-gray-500 transition-colors"
          >
            <RollText text="Guestbook" />
          </Link>
          <Link
            href="/snippets"
            className="roll-link text-gray-500 transition-colors"
          >
            <RollText text="Snippets" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
