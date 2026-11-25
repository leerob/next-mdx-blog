import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';
import { sanityClient } from 'lib/sanity-server';

export type Counts = { guestbook: number; blog: number; notes: number };

// How many guestbook entries, blog posts and notes there are, for the
// numbers beside those links in the mobile menu.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [guestbook, { blog, notes }] = await Promise.all([
      prisma.guestbook.count(),
      sanityClient.fetch<{ blog: number; notes: number }>(
        `{ "blog": count(*[_type == "post"]), "notes": count(*[_type == "snippet"]) }`
      )
    ]);

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600'
    );
    return res.status(200).json({ guestbook, blog, notes } satisfies Counts);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
