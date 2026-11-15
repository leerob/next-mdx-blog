import { Suspense, useMemo, useState } from 'react';

import Container from 'components/Container';
import BlogPost from 'components/BlogPost';
import GhostSearch from 'components/GhostSearch';
import { InferGetStaticPropsType } from 'next';
import { indexQuery } from 'lib/queries';
import { getClient } from 'lib/sanity-server';
import { Post } from 'lib/types';

export default function Blog({
  posts
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [searchValue, setSearchValue] = useState('');
  const titles = useMemo(() => posts.map((post) => post.title), [posts]);
  const filteredBlogPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Container
      title="Blog – Ziyi Zhu"
      description="Thoughts on the software industry, programming, tech, videography, music, and my personal life."
    >
      <div className="flex flex-col items-start justify-center max-w-2xl mx-auto mb-16">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-black md:text-5xl dark:text-white">
          Blog
        </h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          {`I've been writing online since 2018, mostly about machine learning and quantitative finance.
            In total, I've written ${posts.length} articles on my blog.
            Use the search below to filter by title.`}
        </p>
        <GhostSearch titles={titles} onChange={setSearchValue} />
        {!searchValue && (
          <>
            <h3 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-black md:text-4xl dark:text-white">
              Most Popular
            </h3>
            <BlogPost
              title="Evolution of Policy Gradient Methods"
              excerpt="The blog explores the evolution from vanilla policy gradients to modern approaches like Proximal Policy Optimization (PPO) and the more recent Group Relative Policy Optimization (GRPO)."
              slug="policy-optimization"
            />
            <BlogPost
              title="Stop-Limit Order Execution via Martingale Theory"
              excerpt="This article explores the dynamics underlying a stop-limit order and attempts to calculate its probability of execution under a geometric Brownian motion."
              slug="stop-limit-order"
            />
            <BlogPost
              title="Kelly Criterion and Optimal Betting Strategy"
              excerpt="This blog examines the mathematical foundation of the Kelly criterion and explores the idea of using log utility in gambling and repeated investment problems."
              slug="kelly-criterion"
            />
          </>
        )}
        <Suspense fallback={null}>
          <h3 className="mt-8 mb-4 text-2xl font-bold tracking-tight text-black md:text-4xl dark:text-white">
            All Posts
          </h3>
          {!filteredBlogPosts.length && (
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              No posts found.
            </p>
          )}
          {filteredBlogPosts.map((post) => (
            <BlogPost
              key={post.title}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
            />
          ))}
        </Suspense>
      </div>
    </Container>
  );
}

export async function getStaticProps({ preview = false }) {
  const posts: Post[] = await getClient(preview).fetch(indexQuery);

  return { props: { posts } };
}
