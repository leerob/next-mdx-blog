import Link from 'next/link';

import Container from 'components/Container';

export default function NotFound() {
  return (
    <Container title="404 – Ziyi Zhu">
      <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          451 – Unavailable For Legal Reasons
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Why show a generic 404 when I can make it sound mysterious? It seems
          you've found something that used to exist, or you spelled something
          wrong. I'm guessing you spelled something wrong. Can you double check
          that URL?
        </p>
        <Link
          href="/"
          className="inline-flex items-center h-10 px-5 rounded-full bg-inverse text-on-inverse font-semibold transition-transform active:scale-95"
        >
          Return Home
        </Link>
      </div>
    </Container>
  );
}
