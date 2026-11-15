import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from 'lib/prisma';
import { GUESTBOOK_MAX_LENGTH } from 'lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  const { id } = req.query;

  if (!session || !session.user) {
    return res.status(403).send('Unauthorized');
  }

  const { email } = session.user;

  const entry = await prisma.guestbook.findUnique({
    where: {
      id: String(id)
    }
  });

  if (req.method === 'GET') {
    return res.json({
      id: entry.id,
      body: entry.body,
      created_by: entry.created_by,
      updated_at: entry.updated_at
    });
  }

  if (email !== entry?.email) {
    return res.status(403).send('Unauthorized');
  }

  if (req.method === 'DELETE') {
    await prisma.guestbook.delete({
      where: {
        id: String(id)
      }
    });

    return res.status(204).json({});
  }

  if (req.method === 'PUT') {
    const body = (req.body.body || '').slice(0, GUESTBOOK_MAX_LENGTH);

    await prisma.guestbook.update({
      where: {
        id: String(id)
      },
      data: {
        body,
        updated_at: new Date().toISOString()
      }
    });

    return res.status(201).json({
      ...entry,
      body
    });
  }

  return res.send('Method not allowed.');
}
