// SWR fetcher. A non-2xx response throws (with its status attached), so SWR
// keeps the last good data and exposes `error` instead of caching the error
// body as data.
export default async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw Object.assign(new Error(res.statusText), { status: res.status });
  }
  return res.json();
}
