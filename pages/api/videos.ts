import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

import googleAuth from 'lib/google';
import type { VideoStats } from 'lib/types';

const VIDEO_ID = /^[\w-]{11}$/;

// Views and likes per video, for the cover list on the home page. Takes
// ?ids=a,b,c (at most 20 well-formed IDs). One videos.list call costs 1 unit
// of the YouTube quota, and the CDN keeps the answer for an hour.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ids = String(req.query.ids ?? '')
    .split(',')
    .filter((id) => VIDEO_ID.test(id))
    .slice(0, 20);
  if (!ids.length) return res.status(400).json({});

  try {
    const youtube = google.youtube({ version: 'v3', auth: googleAuth });
    const { data } = await youtube.videos.list({
      id: ids,
      part: ['statistics']
    });

    const stats: Record<string, VideoStats> = {};
    for (const video of data.items ?? []) {
      const { viewCount, likeCount } = video.statistics ?? {};
      stats[video.id!] = {
        views: Number(viewCount ?? 0),
        likes: likeCount == null ? null : Number(likeCount) // hidden by some channels
      };
    }

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400'
    );
    return res.status(200).json(stats);
  } catch {
    // never cache a failure, so it can't replace the last good numbers
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({});
  }
}
