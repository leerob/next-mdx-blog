# ziyizhu.com

My personal website: research, blog posts, notes, guitar covers and a guestbook. Live at [www.ziyizhu.com](https://www.ziyizhu.com).

- **Framework:** [Next.js](https://nextjs.org/) (pages router), deployed on [Vercel](https://vercel.com)
- **Content:** [Sanity](https://www.sanity.io/), rendered as MDX with KaTeX for maths
- **Database:** [CockroachDB](https://www.cockroachlabs.com/) through [Prisma](https://prisma.io/), for post views and the guestbook
- **Auth:** [NextAuth.js](https://next-auth.js.org/) with GitHub, for signing the guestbook
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## Structure

- `pages/` – home, about, blog, notes, guestbook and dashboard, plus the RSS feed and sitemap
- `pages/api/` – live data: GitHub, YouTube, Unsplash, Spotify, Semantic Scholar, post views and the guestbook
- `components/`, `layouts/` – UI and page layouts
- `lib/` – Sanity queries, API clients and shared helpers
- `prisma/` – database schema
- `styles/` – global styles on top of Tailwind

## Running locally

Requires Node.js 18.18+ and [pnpm](https://pnpm.io/).

```bash
pnpm install
cp .env.example .env.local   # then fill in the keys you need
pnpm dev
```

Sections whose service has no key just show no data. Git hooks format staged files on commit, and run the type check, lint and a production build before each push.

## Credits

Started from [leerob/leerob.io](https://github.com/leerob/leerob.io). See [LICENSE.txt](LICENSE.txt).
