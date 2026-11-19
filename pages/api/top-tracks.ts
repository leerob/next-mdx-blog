import { type NextRequest } from 'next/server';
import { getTopTracks } from 'lib/lastfm';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  let tracks = null;
  try {
    const result = await getTopTracks(10);
    if (result.length) {
      tracks = result;
    }
  } catch {
    // API or network error: handled below like any other failure
  }

  // never cache a failure, so it can't replace the last good list
  if (!tracks) {
    return new Response(JSON.stringify({ tracks: [] }), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store'
      }
    });
  }

  return new Response(JSON.stringify({ tracks }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control':
        'public, s-maxage=86400, stale-while-revalidate=43200, stale-if-error=86400'
    }
  });
}
