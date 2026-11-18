import Image from 'next/image';

// Renders both variants and lets the `dark` class on <html> pick one, so the
// server and client markup match and there's no flash or hydration mismatch.
export default function ImageWithTheme({
  light,
  dark,
  alt,
  className = '',
  ...props
}) {
  return (
    <>
      <Image
        alt={alt}
        src={light}
        className={`${className} dark:hidden`.trim()}
        {...props}
      />
      <Image
        alt={alt}
        src={dark}
        className={`${className} hidden dark:block`.trim()}
        {...props}
      />
    </>
  );
}
