import { type NextRequest } from 'next/server';
import { getNowPlaying } from 'lib/lastfm';

export const config = {
  runtime: 'edge'
};

const notPlaying = () =>
  new Response(JSON.stringify({ isPlaying: false }), {
    status: 200,
    headers: {
      'content-type': 'application/json'
    }
  });

export default async function handler(req: NextRequest) {
  let song;
  try {
    song = await getNowPlaying();
  } catch {
    return notPlaying();
  }

  if (!song) {
    return notPlaying();
  }

  return new Response(JSON.stringify({ ...song, isPlaying: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  });
}
