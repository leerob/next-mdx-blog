import { type NextRequest } from 'next/server';
import { getNowPlaying } from 'lib/spotify';

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
    const response = await getNowPlaying();

    // 204: nothing is playing
    if (response.status === 204 || !response.ok) {
      return notPlaying();
    }

    song = await response.json();
  } catch {
    return notPlaying();
  }

  // e.g. an ad or a podcast episode in a state without an item
  if (!song?.item) {
    return notPlaying();
  }

  const isPlaying = song.is_playing;
  const title = song.item.name;
  const artist = (song.item.artists ?? [])
    .map((_artist) => _artist.name)
    .join(', ');
  const album = song.item.album?.name;
  const albumImageUrl = song.item.album?.images?.[0]?.url ?? null;
  const songUrl = song.item.external_urls?.spotify;

  return new Response(
    JSON.stringify({
      album,
      albumImageUrl,
      artist,
      isPlaying,
      songUrl,
      title
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    }
  );
}
