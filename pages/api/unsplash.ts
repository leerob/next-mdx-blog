import { type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  let stats: { downloads: number; views: number } | null = null;
  try {
    // the key goes in a header, so it can't end up in URL logs
    const response = await fetch(
      'https://api.unsplash.com/users/ziyizhu/statistics',
      {
        method: 'GET',
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );

    if (response.ok) {
      const unsplashdata = await response.json();
      const downloads = unsplashdata?.downloads?.total;
      const views = unsplashdata?.views?.total;
      if (typeof downloads === 'number' && typeof views === 'number') {
        stats = { downloads, views };
      }
    }
  } catch {
    // network error: handled below like any other failure
  }

  // never cache a failure, so it can't replace the last good numbers
  if (!stats) {
    return new Response(JSON.stringify({}), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store'
      }
    });
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control':
        'public, s-maxage=1200, stale-while-revalidate=600, stale-if-error=86400'
    }
  });
}
