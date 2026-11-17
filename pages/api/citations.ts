import { type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

// arXiv IDs; Semantic Scholar merges them with the ACL Anthology versions
const IDS = ['2603.01865', '2512.20773'];

// Citation counts for every paper in one batch request, so a single success
// fills them all (separate requests per paper tended to trip the rate limit).
export default async function handler(req: NextRequest) {
  let citations: Record<string, number> | null = null;
  try {
    const res = await fetch(
      'https://api.semanticscholar.org/graph/v1/paper/batch?fields=citationCount',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: IDS.map((id) => `arXiv:${id}`) })
      }
    );
    if (res.ok) {
      // one entry per requested ID, in order; null for an unknown paper
      const papers: ({ citationCount?: number } | null)[] = await res.json();
      if (papers.every((p) => typeof p?.citationCount === 'number')) {
        citations = Object.fromEntries(
          IDS.map((id, i) => [id, papers[i]!.citationCount!])
        );
      }
    }
  } catch {
    // network error: handled below like any other failure
  }

  // A failed lookup (usually a 429 rate limit) must not be cached, or it
  // would replace the last good counts for a day.
  if (!citations) {
    return new Response(
      JSON.stringify(Object.fromEntries(IDS.map((id) => [id, null]))),
      {
        status: 503,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store'
        }
      }
    );
  }

  return new Response(JSON.stringify(citations), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control':
        'public, s-maxage=86400, stale-while-revalidate=43200, stale-if-error=86400'
    }
  });
}
