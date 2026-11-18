import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from 'lib/prisma';
import { GUESTBOOK_MAX_LENGTH } from 'lib/types';

const ALLOWED_METHODS = ['GET', 'PUT', 'DELETE'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!ALLOWED_METHODS.includes(req.method ?? '')) {
    res.setHeader('Allow', ALLOWED_METHODS.join(', '));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID.test(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { email } = session.user;

  try {
    const entry = await prisma.guestbook.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (req.method === 'GET') {
      return res.json({
        id: entry.id,
        body: entry.body,
        created_by: entry.created_by,
        updated_at: entry.updated_at
      });
    }

    if (!email || email !== entry.email) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (req.method === 'DELETE') {
      await prisma.guestbook.delete({
        where: { id }
      });

      return res.status(204).end();
    }

    // PUT
    const raw = req.body?.body;
    const body =
      typeof raw === 'string' ? raw.trim().slice(0, GUESTBOOK_MAX_LENGTH) : '';
    if (!body) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const updated = await prisma.guestbook.update({
      where: { id },
      data: {
        body,
        updated_at: new Date().toISOString()
      }
    });

    return res.status(200).json({
      id: updated.id,
      body: updated.body,
      created_by: updated.created_by,
      updated_at: updated.updated_at
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
