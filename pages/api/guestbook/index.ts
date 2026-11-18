import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from 'lib/prisma';
import { GUESTBOOK_MAX_LENGTH } from 'lib/types';

const ALLOWED_METHODS = ['GET', 'POST'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!ALLOWED_METHODS.includes(req.method ?? '')) {
    res.setHeader('Allow', ALLOWED_METHODS.join(', '));
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const entries = await prisma.guestbook.findMany({
        orderBy: {
          updated_at: 'desc'
        }
      });

      return res.json(
        entries.map((entry) => ({
          id: entry.id.toString(),
          body: entry.body,
          created_by: entry.created_by,
          updated_at: entry.updated_at
        }))
      );
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { email, name } = session.user;

  // entries are owned by email; without one the author could never edit or
  // delete theirs
  if (!email) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const raw = req.body?.body;
  const body =
    typeof raw === 'string' ? raw.trim().slice(0, GUESTBOOK_MAX_LENGTH) : '';
  if (!body) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const newEntry = await prisma.guestbook.create({
      data: {
        email,
        body,
        created_by: name
      }
    });

    return res.status(201).json({
      id: newEntry.id.toString(),
      body: newEntry.body,
      created_by: newEntry.created_by,
      updated_at: newEntry.updated_at
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
