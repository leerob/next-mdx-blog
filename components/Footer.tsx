import Link from 'next/link';

import NowPlaying from 'components/NowPlaying';
import RollText from 'components/RollText';

const linkClass = 'roll-link text-gray-500 transition-colors';

// Three columns on desktop, one on phones: this site, work profiles and
// social accounts. External links open in a new tab.
const COLUMNS = [
  [
    { href: '/', text: 'Home' },
    { href: '/about', text: 'About' },
    { href: 'https://portfolio.ziyizhu.com/', text: 'Portfolio' }
  ],
  [
    { href: 'https://github.com/ziyi-zhu', text: 'GitHub' },
    {
      href: 'https://scholar.google.com/citations?user=wR-Ssa4AAAAJ',
      text: 'Google Scholar'
    },
    {
      href: 'https://www.semanticscholar.org/author/2214424924',
      text: 'Semantic Scholar'
    }
  ],
  [
    { href: 'https://www.linkedin.com/in/ziyizhu/', text: 'LinkedIn' },
    { href: 'https://www.youtube.com/@neoziyism', text: 'YouTube' },
    { href: 'https://unsplash.com/@ziyizhu', text: 'Unsplash' }
  ]
];

export default function Footer() {
  return (
    <footer className="flex flex-col justify-center items-start max-w-2xl mx-auto w-full mb-8">
      <hr className="w-full border-1 border-gray-200 dark:border-gray-800 mb-8" />
      <NowPlaying />
      <nav
        aria-label="Footer"
        className="w-full max-w-2xl roll-group grid grid-cols-1 gap-4 pb-16 sm:grid-cols-3"
      >
        {COLUMNS.map((links) => (
          <div key={links[0].href} className="flex flex-col space-y-4">
            {links.map(({ href, text }) =>
              href.startsWith('/') ? (
                <Link key={href} href={href} className={linkClass}>
                  <RollText text={text} />
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <RollText text={text} />
                </a>
              )
            )}
          </div>
        ))}
      </nav>
    </footer>
  );
}
