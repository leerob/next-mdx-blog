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
      href={`/notes/${slug}`}
      className="surface block w-full rounded-3xl p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
      {...rest}
    >
      {logo ? (
        <Image
          alt=""
          // 48px, the size of the video thumbnails on the home page
          height={48}
          width={48}
          src={urlForImage(logo).url()}
          className="rounded-[22%]"
        />
      ) : null}
      <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </Link>
  );
}
