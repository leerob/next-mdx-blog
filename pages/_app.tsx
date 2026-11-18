import 'styles/global.css';
import 'katex/dist/katex.min.css';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';

import SiteNav from 'components/SiteNav';

const interVariable = Inter({
  subsets: ['latin']
});

export default function App({
  Component,
  pageProps: { session, ...pageProps }
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class">
        <div
          className={`${interVariable.className} bg-gray-50 dark:bg-gray-900`}
        >
          <SiteNav />
          <Component {...pageProps} />
          <Analytics />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
