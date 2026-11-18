import Container from 'components/Container';
import FunctionCard from 'components/FunctionCard';
import { InferGetStaticPropsType } from 'next';
import { allSnippetsQuery } from 'lib/queries';
import { getClient } from 'lib/sanity-server';
import { Snippet } from 'lib/types';

export default function Notes({
  snippets
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Container
      title="Notes – Ziyi Zhu"
      description="Notes on mathematics, machine learning, finance and books."
    >
      <div className="flex flex-col items-start justify-center max-w-2xl mx-auto mb-16">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-black md:text-5xl dark:text-white">
          Notes
        </h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          These are a collection of notes I've written in the past. Some are
          algorithms that I find interesting, some are mathematical theorems,
          and some are just books that I've read.
        </p>
        <div className="grid w-full grid-cols-1 gap-4 mt-4 sm:grid-cols-2">
          {snippets.map((snippet) => (
            <FunctionCard
              key={snippet.slug}
              title={snippet.title}
              slug={snippet.slug}
              logo={snippet.logo}
              description={snippet.description}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}

export async function getStaticProps({ preview = false }) {
  const snippets: Snippet[] = await getClient(preview).fetch(allSnippetsQuery);

  return { props: { snippets }, revalidate: 3600 };
}
