import Link from 'next/link';
import Image from 'next/image';

import ProsCard from 'components/ProsCard';
import ConsCard from 'components/ConsCard';
import Unsplash from 'components/metrics/Unsplash';
import Analytics from 'components/metrics/Analytics';
import YouTube from 'components/metrics/Youtube';
import Step from 'components/Step';
import ImageWithTheme from 'components/ImageWithTheme';
import CodeBlock from 'components/CodeBlock';

const CustomLink = (props) => {
  const href = props.href;
  const isInternalLink = href && (href.startsWith('/') || href.startsWith('#'));

  if (isInternalLink) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

// A Notion-style callout: tinted block, emoji aligned with the first line.
function Callout({ emoji = '💡', children }) {
  return (
    <div className="callout-box">
      <span className="callout-emoji" aria-hidden="true">
        {emoji}
      </span>
      <div className="callout">{children}</div>
    </div>
  );
}

const MDXComponents = {
  Image: RoundedImage,
  ImageWithTheme,
  a: CustomLink,
  pre: CodeBlock,
  Callout,
  Analytics,
  ConsCard,
  ProsCard,
  Step,
  Unsplash,
  YouTube
};

export default MDXComponents;
