import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'lib/prisma';

const SLUG = /^[a-z0-9-]{1,200}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (typeof slug !== 'string' || !SLUG.test(slug)) {
    return res.status(400).json({ message: 'Invalid slug' });
  }

  try {
    if (req.method === 'POST') {
      const newOrUpdatedViews = await prisma.views.upsert({
        where: { slug },
        create: {
          slug
        },
        update: {
          count: {
            increment: 1
          }
        }
      });

      return res.status(200).json({
        total: newOrUpdatedViews.count.toString()
      });
    }

    const views = await prisma.views.findUnique({
      where: {
        slug
      }
    });

    // a post nobody has viewed yet has no row
    return res.status(200).json({ total: (views?.count ?? 0).toString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
