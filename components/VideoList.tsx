import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import fetcher from 'lib/fetcher';
import type { VideoStats } from 'lib/types';

import {
  S,
  step,
  clamp,
  atRest,
  register,
  after,
  cancel,
  kick,
  Spring
} from 'lib/spring';

type Video = { href: string; title: string; length: string; duet?: boolean };

const ROW = 72,
  GAP = 8,
  THUMB = 48;

const videoId = (href: string) => href.split('/').pop()!.split('?')[0];

// 1234 -> "1.2K", like YouTube's own counts
const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
});
const count = (n: number, word: string) =>
  `${compact.format(n)} ${n === 1 ? word : word + 's'}`;

type Row = {
  el: HTMLDivElement;
  thumb: HTMLElement;
  head: HTMLElement;
  index: HTMLElement;
  more: HTMLElement;
  p: Spring;
  a: Spring;
  y: Spring;
  o: Spring;
  s: Spring;
};

// Expand Card (designbookmark.com/motion#db-expand-card): one progress spring
// per row drives everything: card height, thumbnail size and corner, title
// and index position. The chosen row rides up to the top and opens into a
// card while the others sink and fade. Click it again to fold it back.
export default function VideoList({ videos }: { videos: Video[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [open, setOpen] = useState(-1);
  const showRef = useRef<(i: number) => void>(() => {});
  const home = (i: number) => i * (ROW + GAP);
  // views and likes for every video in one request; until they arrive (or if
  // the API is unavailable) the card simply shows no chips
  const { data: stats } = useSWR<Record<string, VideoStats>>(
    `/api/videos?ids=${videos.map((v) => videoId(v.href)).join(',')}`,
    fetcher
  );
  const listH = videos.length * ROW + (videos.length - 1) * GAP;

  useEffect(() => {
    const list = listRef.current!;
    const q = (el: HTMLElement, c: string) => el.querySelector<HTMLElement>(c)!;
    const rows: Row[] = rowRefs.current.map((el, i) => ({
      el: el!,
      thumb: q(el!, '.ex-thumb'),
      head: q(el!, '.ex-head'),
      index: q(el!, '.ex-index'),
      more: q(el!, '.ex-more'),
      p: S(0, 240, 21),
      a: S(0, 260, 28),
      y: S(home(i), 300, 26),
      o: S(1, 300, 30),
      s: S(1, 300, 26)
    }));
    const LH = S(listH, 300, 26); // the list's own height follows the open card
    let cur = -1,
      timer = null;

    const imgH = (W: number) => Math.min(220, Math.round(((W - 24) * 9) / 16));
    // open, the demo's spacing: image at 12, title 12 below it, the 38px
    // title block, 12 more, then the tags row and a 16px bottom pad
    const fullH = (r: Row, W: number) =>
      imgH(W) + 74 + r.more.offsetHeight + 16;

    showRef.current = (i) => {
      cur = i;
      cancel(timer);
      const W = list.offsetWidth;
      rows.forEach((r, k) => {
        if (i < 0) {
          r.p.t = 0;
          r.a.t = 0;
          r.y.t = home(k);
          r.o.t = 1;
          r.s.t = 1;
          return;
        }
        if (k === i) {
          r.p.t = 1;
          r.y.t = 0;
          r.o.t = 1;
          r.s.t = 1;
          timer = after(0.16, () => {
            if (cur === i) r.a.t = 1;
          });
          r.el.style.zIndex = '2';
        } else {
          r.a.t = 0;
          r.p.t = 0;
          r.o.t = 0;
          r.s.t = 0.94;
          r.y.t = home(k) + (k < i ? -24 : 24);
          r.el.style.zIndex = '1';
        }
      });
      LH.t = i < 0 ? listH : fullH(rows[i], W);
      kick();
    };

    const unregister = register({
      frame(dt) {
        step(LH, dt);
        rows.forEach((r) =>
          [r.p, r.a, r.y, r.o, r.s].forEach((s) => step(s, dt))
        );
      },
      render() {
        const W = list.offsetWidth,
          IMG = imgH(W);
        list.style.height = LH.x.toFixed(2) + 'px';
        rows.forEach((r) => {
          const p = r.p.x,
            c = clamp(p, 0, 1);
          r.el.style.height = (ROW + p * (fullH(r, W) - ROW)).toFixed(2) + 'px';
          r.el.style.transform = `translateY(${r.y.x.toFixed(2)}px) scale(${r.s.x.toFixed(4)})`;
          r.el.style.opacity = clamp(r.o.x, 0, 1).toFixed(3);
          r.el.style.pointerEvents = r.o.t > 0.5 ? 'auto' : 'none';
          r.thumb.style.width =
            (THUMB + c * (W - 24 - THUMB)).toFixed(2) + 'px';
          r.thumb.style.height =
            Math.max(THUMB, THUMB + p * (IMG - THUMB)).toFixed(2) + 'px';
          r.thumb.style.borderRadius = (12 + c * 4).toFixed(2) + 'px';
          r.head.style.transform = `translate(${(72 - 56 * c).toFixed(2)}px,${(16 + (IMG + 8) * p).toFixed(2)}px)`;
          // leave room for the length on the right, open or closed
          r.head.style.width = `${(W - 136 + c * 56).toFixed(2)}px`;
          r.index.style.transform = `translateY(${(25 + (IMG + 3) * p).toFixed(2)}px)`;
          const a = clamp(r.a.x, 0, 1);
          r.more.style.top = `${IMG + 74}px`;
          r.more.style.opacity = a.toFixed(3);
          r.more.style.transform = `translateY(${((1 - r.a.x) * 10).toFixed(2)}px)`;
          r.more.style.visibility =
            r.a.t === 0 && a < 0.01 ? 'hidden' : 'visible';
        });
      },
      idle: () =>
        atRest(LH) &&
        rows.every((r) => [r.p, r.a, r.y, r.o, r.s].every((s) => atRest(s)))
    });

    const relayout = () => showRef.current(cur);
    window.addEventListener('resize', relayout);
    return () => {
      cancel(timer);
      window.removeEventListener('resize', relayout);
      unregister();
    };
  }, [videos.length, listH]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    showRef.current(open);
    if (open < 0) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(-1);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  return (
    <div ref={listRef} className="relative w-full" style={{ height: listH }}>
      {videos.map((v, i) => {
        const id = videoId(v.href);
        const stat = stats?.[id];
        const toggle = () => setOpen((o) => (o === i ? -1 : i));
        return (
          <div
            key={v.href}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            role="button"
            tabIndex={0}
            aria-expanded={open === i}
            aria-label={`${v.title}, ${v.length}`}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
              }
            }}
            className="surface absolute left-0 top-0 w-full overflow-hidden rounded-[20px] cursor-pointer will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fill-3)]"
            style={{ height: ROW, transform: `translateY(${home(i)}px)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="ex-thumb absolute left-3 top-3 object-cover bg-fill-2"
              style={{ width: THUMB, height: THUMB, borderRadius: 12 }}
            />
            <div
              className="ex-head absolute left-0 top-0 will-change-transform"
              style={{
                transform: 'translate(72px,16px)',
                width: 'calc(100% - 136px)'
              }}
            >
              <p className="text-[15px] font-semibold leading-5 truncate text-ink">
                {v.title}
              </p>
              {/* views and likes; placeholders while loading or if the
                  stats are unavailable */}
              <p className="h-[18px] text-[13px] leading-[18px] text-muted tabular-nums">
                {stat
                  ? [
                      count(stat.views, 'view'),
                      stat.likes != null && count(stat.likes, 'like')
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : '– views · – likes'}
              </p>
            </div>
            <span
              className="ex-index absolute right-4 top-0 text-[15px] font-semibold leading-[22px] tabular-nums text-ink will-change-transform"
              style={{ transform: 'translateY(25px)' }}
            >
              {v.length}
            </span>
            <div
              className="ex-more absolute left-4 right-4 opacity-0 invisible will-change-transform"
              style={{ top: 0 }}
            >
              <div className="flex items-center gap-1.5">
                {['Acoustic', v.duet ? 'Duet' : 'Solo'].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium leading-[18px] px-2.5 py-[5px] rounded-full bg-fill-2 text-ink-2"
                  >
                    {tag}
                  </span>
                ))}
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={open === i ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto flex items-center gap-1.5 pl-3 pr-3.5 py-[7px] rounded-full bg-inverse text-on-inverse text-[13px] font-semibold leading-5 whitespace-nowrap active:scale-95 transition-transform"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                    fillRule="evenodd"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
