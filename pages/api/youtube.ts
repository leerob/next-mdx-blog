import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

import googleAuth from 'lib/google';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: googleAuth
    });

    const response = await youtube.channels.list({
      id: ['UC0snS_FYHj_5y_uFmWzp2hg'],
      part: ['statistics']
    });

    const statistics = response.data.items?.[0]?.statistics;
    if (statistics) {
      const { subscriberCount, viewCount } = statistics;

      res.setHeader(
        'Cache-Control',
        'public, s-maxage=1200, stale-while-revalidate=600, stale-if-error=86400'
      );

      return res.status(200).json({
        subscriberCount,
        viewCount
      });
    }
  } catch {
    // auth, quota or network error: handled below like any other failure
  }

  // never cache a failure, so it can't replace the last good numbers
  res.setHeader('Cache-Control', 'no-store');
  return res.status(503).json({});
}
