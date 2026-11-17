import { type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  const res = await fetch(
    'https://api.semanticscholar.org/graph/v1/author/2214424924?fields=paperCount,citationCount'
  );

  // a failed lookup (usually a 429 rate limit) must not be cached, or it
  // would replace the last good counts for a day
  if (!res.ok) {
    return new Response(
      JSON.stringify({ paperCount: null, citationCount: null }),
      {
        status: 503,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store'
        }
      }
    );
  }

  const data = await res.json();

  return new Response(
    JSON.stringify({
      paperCount: data.paperCount ?? null,
      citationCount: data.citationCount ?? null
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control':
          'public, s-maxage=86400, stale-while-revalidate=43200, stale-if-error=86400'
      }
    }
  );
}
