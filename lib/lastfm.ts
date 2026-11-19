// Last.fm keeps the listening history (scrobbled from Spotify, Apple Music or
// anything else), so the site reads both widgets from it with a plain API key.
const API_ROOT = 'https://ws.audioscrobbler.com/2.0/';

const call = async (method: string, params: Record<string, string>) => {
  const url = new URL(API_ROOT);
  url.search = new URLSearchParams({
    method,
    user: process.env.LASTFM_USERNAME ?? '',
    api_key: process.env.LASTFM_API_KEY ?? '',
    format: 'json',
    ...params
  }).toString();

  const response = await fetch(url, { cache: 'no-store' });
  const data = await response.json().catch(() => null);

  // Last.fm can report an error inside a 200 response
  if (!response.ok || !data || data.error) {
    throw new Error(
      `Last.fm ${method} failed: ${data?.message ?? response.status}`
    );
  }

  return data;
};

// a single result can come back as an object rather than an array
const asList = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const largestImage = (images) =>
  asList(images)
    .map((image) => image?.['#text'])
    .filter(Boolean)
    .pop() ?? null;

export const getNowPlaying = async () => {
  const data = await call('user.getrecenttracks', { limit: '1' });
  const track = asList(data.recenttracks?.track)[0];

  if (!track || track['@attr']?.nowplaying !== 'true') {
    return null;
  }

  return {
    album: track.album?.['#text'] || null,
    albumImageUrl: largestImage(track.image),
    artist: track.artist?.['#text'] ?? '',
    songUrl: track.url,
    title: track.name
  };
};

export const getTopTracks = async (limit = 10) => {
  const data = await call('user.gettoptracks', {
    period: '1month',
    limit: String(limit)
  });

  return asList(data.toptracks?.track).map((track) => ({
    artist: track.artist?.name ?? '',
    songUrl: track.url,
    title: track.name
  }));
};
