import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const totalViews = await prisma.views.aggregate({
      _sum: {
        count: true
      }
    });

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    // the sum is null while the table is empty
    return res.status(200).json({ total: String(totalViews._sum.count ?? 0) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
