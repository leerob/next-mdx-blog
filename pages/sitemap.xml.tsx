import { sanityClient } from 'lib/sanity-server';
import { postSlugsQuery, snippetSlugsQuery } from 'lib/queries';

const createSitemap = (slugs) => `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${slugs
          .map((slug) => {
            return `
                <url>
                    <loc>${`https://www.ziyizhu.com/${slug}`}</loc>
                </url>
            `;
          })
          .join('')}
    </urlset>
`;
export async function getServerSideProps({ res }) {
  const [allPosts, allNotes] = await Promise.all([
    sanityClient.fetch(postSlugsQuery),
    sanityClient.fetch(snippetSlugsQuery)
  ]);
  const allPages = [
    ...allPosts.map((slug) => `blog/${slug}`),
    ...allNotes.map((slug) => `notes/${slug}`),
    ...['', 'about', 'blog', 'dashboard', 'guestbook', 'notes']
  ];

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=1200, stale-while-revalidate=600'
  );
  res.write(createSitemap(allPages));
  res.end();

  return {
    props: {}
  };
}

export default function Sitemap() {
  return null;
}
