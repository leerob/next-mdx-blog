import type { NextApiRequest, NextApiResponse } from 'next';
import { postBySlugQuery } from 'lib/queries';
import { previewClient } from 'lib/sanity-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const secret = process.env.SANITY_PREVIEW_SECRET;
  const { slug } = req.query;

  // an unset secret must not let `?secret=` (undefined === undefined) through
  if (!secret || req.query.secret !== secret || typeof slug !== 'string') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const post = await previewClient.fetch(postBySlugQuery, { slug });

  if (!post) {
    return res.status(404).json({ message: 'Invalid slug' });
  }

  res.setPreviewData({});
  res.writeHead(307, { Location: `/blog/${post.slug}` });
  res.end();
}
