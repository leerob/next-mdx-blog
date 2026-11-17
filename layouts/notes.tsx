import Image from 'next/image';

import Container from 'components/Container';
import type { PropsWithChildren } from 'react';
import { Snippet } from 'lib/types';
import { urlForImage } from 'lib/sanity';

export default function NoteLayout({
  children,
  snippet
}: PropsWithChildren<{ snippet: Snippet }>) {
  return (
    <Container
      title={`${snippet.title} – Ziyi Zhu`}
      description={snippet.description}
    >
      <article className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
        <div className="flex justify-between w-full mb-8">
          <div>
            <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
              {snippet.title}
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              {snippet.description}
            </p>
          </div>
          {/* sized to the title's line box (36px, then 48px) and top-aligned,
              so it sits flush with the first line of the title */}
          <div className="flex-none pl-4">
            <Image
              alt={snippet.title}
              height={48}
              width={48}
              src={urlForImage(snippet.logo).url()}
              className="w-9 h-9 md:w-12 md:h-12 rounded-[22%]"
            />
          </div>
        </div>
        <div className="prose w-full">{children}</div>
      </article>
    </Container>
  );
}
