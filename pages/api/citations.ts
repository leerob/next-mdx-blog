import { type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  // arXiv IDs; Semantic Scholar merges them with the ACL Anthology versions
  const ids = ['2603.01865', '2512.20773'];

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/arXiv:${id}?fields=citationCount`
        );
        if (!res.ok) return { id, citationCount: null };
        const data = await res.json();
        return { id, citationCount: data.citationCount ?? null };
      } catch {
        return { id, citationCount: null };
      }
    })
  );

  const citations: Record<string, number | null> = {};
  for (const r of results) {
    citations[r.id] = r.citationCount;
  }

  return new Response(JSON.stringify(citations), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=43200'
    }
  });
}
