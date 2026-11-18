import RSS from 'rss';
import { sanityClient } from 'lib/sanity-server';
import { indexQuery } from 'lib/queries';

export async function getServerSideProps({ res }) {
  try {
    const feed = new RSS({
      title: 'Ziyi Zhu',
      site_url: 'https://www.ziyizhu.com',
      feed_url: 'https://www.ziyizhu.com/feed.xml'
    });

    // the rss package XML-escapes titles, descriptions and URLs itself
    const allPosts = await sanityClient.fetch(indexQuery);
    allPosts.forEach((post) => {
      feed.item({
        title: post.title,
        url: `https://www.ziyizhu.com/blog/${encodeURIComponent(post.slug)}`,
        date: post.date,
        description: post.excerpt
      });
    });

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=1200, stale-while-revalidate=600'
    );
    res.write(feed.xml({ indent: true }));
    res.end();
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }

  return {
    props: {}
  };
}

export default function RSSFeed() {
  return null;
}
