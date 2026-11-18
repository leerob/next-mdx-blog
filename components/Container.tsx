import Head from 'next/head';
import { useRouter } from 'next/router';

import Footer from 'components/Footer';

export default function Container(props) {
  const { children, noindex = false, ...customMeta } = props;
  const router = useRouter();
  const path = router.asPath.split(/[?#]/)[0];
  const url = `https://www.ziyizhu.com${path}`;
  const meta = {
    title: 'Ziyi Zhu',
    description: `Curious mind, researcher and tech enthusiast.`,
    image: 'https://www.ziyizhu.com/static/images/banner.png',
    type: 'website',
    ...customMeta
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{meta.title}</title>
        <meta name="robots" content={noindex ? 'noindex' : 'follow, index'} />
        <meta content={meta.description} name="description" />
        <meta property="og:url" content={url} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Ziyi Zhu" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@neoziyism" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        {meta.date && (
          <meta property="article:published_time" content={meta.date} />
        )}
      </Head>
      <main
        id="skip"
        className="flex flex-col justify-center px-8 bg-gray-50 dark:bg-gray-900"
      >
        {children}
        <Footer />
      </main>
    </div>
  );
}
