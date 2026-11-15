import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Container from '../components/Container';
import BlogPostCard from '../components/BlogPostCard';
import ResearchPaperCard from '../components/ResearchPaperCard';
import Subscribe from '../components/Subscribe';
import VideoCard from '../components/VideoCard';
import RollText from '../components/RollText';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Container>
        <div className="flex flex-col justify-center items-start max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pb-16">
          <div className="flex flex-col-reverse sm:flex-row items-start">
            <div className="flex flex-col pr-8">
              <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-1 text-black dark:text-white">
                Ziyi Zhu
              </h1>
              <h2 className="text-gray-700 dark:text-gray-200 mb-4">
                Member of Technical Staff at{' '}
                <span className="font-semibold">Slingshot AI</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-16">
                Solving challenging real-world problems with machine
                intelligence and data-driven mathematical tools.
              </p>
            </div>
            <div className="w-[80px] sm:w-[176px] relative mb-8 sm:mb-0 mr-auto">
              <Image
                alt="Ziyi Zhu"
                height={176}
                width={176}
                src="/avatar.jpg"
                sizes="30vw"
                priority
                className="rounded-full filter"
              />
            </div>
          </div>

          <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-6 text-black dark:text-white">
            Latest Research
          </h3>
          <div className="flex gap-6 flex-col md:flex-row">
            <ResearchPaperCard
              title="Rewarding Chatbots for Real-World Engagement with Millions of Users"
              venue="arXiv 2023"
              href="https://arxiv.org/abs/2303.06135"
              arxivId="2303.06135"
              gradient="from-[#FDE68A] via-[#FCA5A5] to-[#FECACA]"
            />
            <ResearchPaperCard
              title="DIAL: Direct Iterative Adversarial Learning for Realistic Multi-Turn Dialogue Simulation"
              venue="arXiv 2025"
              href="https://arxiv.org/abs/2512.20773"
              arxivId="2512.20773"
              gradient="from-[#6EE7B7] via-[#3B82F6] to-[#9333EA]"
            />
          </div>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.semanticscholar.org/author/Ziyi-Zhu/2214424924"
            className="flex items-center mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
          >
            <RollText text="View all publications" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 ml-1"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
              />
            </svg>
          </a>

          <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-6 mt-16 text-black dark:text-white">
            Featured Posts
          </h3>
          <div className="flex gap-6 flex-col md:flex-row">
            <BlogPostCard
              title="Evolution of Policy Gradient Methods"
              slug="policy-optimization"
            />
            <BlogPostCard
              title="Stop-Limit Order Execution via Martingale Theory"
              slug="stop-limit-order"
            />
            <BlogPostCard
              title="Kelly Criterion and Optimal Betting Strategy"
              slug="kelly-criterion"
            />
          </div>
          <Link
            href="/blog"
            className="flex items-center mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
          >
            <>
              <RollText text="Read all posts" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 ml-1"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
                />
              </svg>
            </>
          </Link>

          <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-4 mt-16 text-black dark:text-white">
            Acoustic Guitar Cover
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Music and art are the guiding lights of the world. This channel
            features some of my acoustic guitar cover of popular songs.
          </p>
          <VideoCard
            index="01"
            href="https://youtu.be/JqTIkdMLcHw"
            length="02:39"
            title="Sungha Jung - Seventh #9"
          />
          <VideoCard
            index="02"
            href="https://youtu.be/BS11lif_yuM"
            length="03:16"
            title="아이유 IU - Through The Night"
          />
          <VideoCard
            index="03"
            href="https://youtu.be/CgwppQEoTkk"
            length="04:46"
            title="松井佑贵 Yuki Matsui - Sunny Day"
          />
          <VideoCard
            index="04"
            href="https://youtu.be/3Tr_-s0pZjs"
            length="03:03"
            title="Secret Base ～君がくれたもの～"
          />
          <VideoCard
            index="05"
            href="https://youtu.be/z2txWTlBmTQ"
            length="05:18"
            title="松井佑贵 Yuki Matsui - Rider"
          />
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.youtube.com/@neoziyism"
            className="flex items-center mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
          >
            <RollText text="Watch all videos" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 ml-1"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
              />
            </svg>
          </a>
          <span className="h-16" />
        </div>
      </Container>
    </Suspense>
  );
}
