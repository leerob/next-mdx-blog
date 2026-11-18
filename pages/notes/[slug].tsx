import { MDXRemote } from 'next-mdx-remote';
import NoteLayout from 'layouts/notes';
import components from 'components/MDXComponents';
import { snippetsQuery, snippetSlugsQuery } from 'lib/queries';
import { sanityClient, getClient } from 'lib/sanity-server';
import { mdxToHtml } from 'lib/mdx';
import { Snippet } from 'lib/types';

export default function NotePage({ snippet }: { snippet: Snippet }) {
  return (
    <NoteLayout snippet={snippet}>
      <MDXRemote {...snippet.content} components={components} />
    </NoteLayout>
  );
}

export async function getStaticPaths() {
  const paths = await sanityClient.fetch(snippetSlugsQuery);
  return {
    paths: paths.map((slug) => ({ params: { slug } })),
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params, preview = false }) {
  const { snippet } = await getClient(preview).fetch(snippetsQuery, {
    slug: params.slug
  });

  if (!snippet) {
    return { notFound: true, revalidate: 60 };
  }

  const { html } = await mdxToHtml(snippet.content);

  return {
    props: {
      snippet: {
        ...snippet,
        content: html
      }
    },
    revalidate: 3600
  };
}
