import { type NextRequest } from 'next/server';
import { getTopTracks } from 'lib/spotify';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  let tracks = null;
  try {
    const response = await getTopTracks();
    if (response.ok) {
      const { items } = await response.json();
      if (Array.isArray(items)) {
        tracks = items.slice(0, 10).map((track) => ({
          artist: track.artists.map((_artist) => _artist.name).join(', '),
          songUrl: track.external_urls.spotify,
          title: track.name
        }));
      }
    }
  } catch {
    // token or network error: handled below like any other failure
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
