import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { sanityClient } from 'lib/sanity-server';
import { documentPathQuery } from 'lib/queries';
// Sanity webhook: regenerate the pages a published, edited or deleted post
// or note appears on.
const LIST: Record<string, string> = { post: '/blog', snippet: '/notes' };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const secret = process.env.SANITY_STUDIO_REVALIDATE_SECRET;
  const signature = req.headers[SIGNATURE_HEADER_NAME];
  const body = await readBody(req); // the raw body, as signed
  if (
    !secret ||
    typeof signature !== 'string' ||
    !(await isValidSignature(body, signature, secret))
  ) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  try {
    const doc = JSON.parse(body);
    if (typeof doc?._id !== 'string' || !doc._id) {
      return res.status(400).json({ message: 'Invalid _id' });
    }
    // the payload's own type and slug when the webhook sends them (it must,
    // for a deleted document); otherwise look them up
    let type: string | undefined = doc._type;
    let slug: string | undefined = doc.slug?.current ?? doc.slug;
    if (!type || !slug) {
      const found = await sanityClient.fetch(documentPathQuery, {
        id: doc._id
      });
      type ??= found?._type;
      slug ??= found?.slug;
    }
    const list = LIST[type];
    if (!list) return res.status(200).json({ message: 'Nothing to update' });
    await Promise.all([
      res.revalidate(list),
      typeof slug === 'string' && slug
        ? res.revalidate(`${list}/${slug}`)
        : null
    ]);
    return res.status(200).json({ message: `Updated ${list}/${slug ?? ''}` });
  } catch (err) {
    console.error('revalidate failed', err);
    return res.status(500).json({ message: 'Revalidation failed' });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

async function readBody(readable: NextApiRequest) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
