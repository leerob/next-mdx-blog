import { useMemo } from 'react';
import { MDXRemote } from 'next-mdx-remote';
import BlogLayout from 'layouts/blog';
import Tweet from 'components/Tweet';
import components from 'components/MDXComponents';
import { postQuery, postSlugsQuery } from 'lib/queries';
import { getTweets } from 'lib/twitter';
import { sanityClient, getClient } from 'lib/sanity-server';
import { mdxToHtml } from 'lib/mdx';
import { Post } from 'lib/types';

export default function PostPage({ post }: { post: Post }) {
  // Built once per post so StaticTweet keeps a stable component identity
  // across renders (a component defined inline would remount every time).
  const mdxComponents = useMemo(() => {
    const tweets = post.tweets ?? [];
    const StaticTweet = ({ id }) => {
      const tweet = tweets.find((tweet) => tweet.id === id);
      return tweet ? <Tweet {...tweet} /> : null;
    };
    return { ...components, StaticTweet };
  }, [post.tweets]);

  return (
    <BlogLayout post={post}>
      <MDXRemote {...post.content} components={mdxComponents as any} />
    </BlogLayout>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(postSlugsQuery);
  return {
    paths: paths.map((slug) => ({ params: { slug } })),
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params, preview = false }) {
  const { post } = await getClient(preview).fetch(postQuery, {
    slug: params.slug
  });

  if (!post) {
    return { notFound: true, revalidate: 60 };
  }

  const { html, tweetIDs, readingTime } = await mdxToHtml(post.content);
  const tweets = await getTweets(tweetIDs);

  return {
    props: {
      post: {
        ...post,
        content: html,
        tweets,
        readingTime
      }
    },
    revalidate: 3600
  };
}
