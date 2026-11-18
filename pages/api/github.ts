import { type NextRequest } from 'next/server';

export const config = {
  runtime: 'edge'
};

export default async function handler(req: NextRequest) {
  // a token is optional, but lifts the unauthenticated 60 requests/hour limit
  const headers: HeadersInit = process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {};

  let result: { followers: number; stars: number } | null = null;
  try {
    const [userResponse, userReposResponse] = await Promise.all([
      fetch('https://api.github.com/users/ziyi-zhu', { headers }),
      fetch('https://api.github.com/users/ziyi-zhu/repos?per_page=100', {
        headers
      })
    ]);

    if (userResponse.ok && userReposResponse.ok) {
      const [user, repositories] = await Promise.all([
        userResponse.json(),
        userReposResponse.json()
      ]);

      if (Array.isArray(repositories)) {
        const mine = repositories.filter((repo) => !repo.fork);
        const stars = mine.reduce((accumulator, repository) => {
          return accumulator + repository['stargazers_count'];
        }, 0);
        result = { followers: user.followers, stars };
      }
    }
  } catch {
    // network error: handled below like any other failure
  }

  // A failed lookup (usually a rate limit) must not be cached, or it would
  // replace the last good counts.
  if (!result) {
    return new Response(JSON.stringify({}), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store'
      }
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control':
        'public, s-maxage=1200, stale-while-revalidate=600, stale-if-error=86400'
    }
  });
}
