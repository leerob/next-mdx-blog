import Link from 'next/link';
import Image from 'next/image';
import { urlForImage } from 'lib/sanity';

export default function FunctionCard({
  title,
  description,
  slug,
  logo,
  ...rest
}) {
  return (
    <Link
      href={`/snippets/${slug}`}
      className="surface block w-full rounded-3xl p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
      {...rest}
    >
      <Image
        alt={title}
        height={32}
        width={32}
        src={urlForImage(logo).url()}
        className="rounded-full"
      />
      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </Link>
  );
}
