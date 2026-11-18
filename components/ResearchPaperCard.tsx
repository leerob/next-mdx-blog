import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import cn from 'classnames';
import Image from 'next/image';

import fetcher from 'lib/fetcher';
import { S, step, clamp, atRest, register, kick } from 'lib/spring';

// The example's own defaults (--ticket-tilt, --ticket-depth, --ticket-flip)
const TILT = 14; // deg
const DEPTH = 18; // px a layer of depth 1 slides at full tilt

type Paper = {
  title: string;
  venue: string;
  authors: string[];
  pages: string;
  anthologyId: string;
  href: string;
  pdf: string;
  arxivId: string; // for the citation count and the texture's file name
  hue: number; // the texture's hue, shown as a plain fill while it loads
};

// .layer in the original (the sides are .ticket-side in global.css)
const layer = 'absolute will-change-transform pointer-events-none';

// Parallax Ticket (designbookmark.com/motion#db-parallax-ticket): the card
// tilts toward the cursor and each layer moves by its own depth, so the
// mesh and the title separate in space, while a glare follows the
// cursor. Click flips it on a spring that overshoots a little, showing the
// paper's details and links on the back. Untouched, it rests flat.
export default function ResearchPaperCard(paper: Paper) {
  const { title, venue, authors, pages, anthologyId, href, pdf, arxivId, hue } =
    paper;
  const { data } = useSWR<Record<string, number | null>>(
    '/api/citations',
    fetcher
  );
  const citations = data?.[arxivId];
  const [flipped, setFlipped] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<(to: boolean) => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current!,
      card = cardRef.current!,
      glare = glareRef.current!;
    const faces = Array.from(
      card.querySelectorAll<HTMLElement>('.ticket-side')
    );
    const layers = Array.from(
      card.querySelectorAll<HTMLElement>('[data-depth]')
    ).map((el) => ({
      el,
      depth: parseFloat(el.dataset.depth!)
    }));
    const RX = S(0, 220, 18),
      RY = S(0, 220, 18),
      G = S(0, 300, 26),
      LIFT = S(1, 300, 18);
    const F = S(0, 170, 15); // flip angle, overshoots a little
    let gx = 50,
      gy = 30,
      hover = false;

    flipRef.current = (to) => {
      if (F.t === (to ? 180 : 0)) return;
      F.t = to ? 180 : 0;
      LIFT.v += 1.5;
      kick();
    };
    const move = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      gx = (nx + 1) * 50;
      gy = (ny + 1) * 50;
      hover = true;
      kick();
    };
    const leave = () => {
      hover = false;
      kick();
    };
    const down = () => {
      LIFT.t = 0.97;
      kick();
    };
    const up = () => {
      LIFT.t = 1;
      kick();
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerleave', leave);
    stage.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    // a scroll that starts on the card cancels the press, with no pointerup
    window.addEventListener('pointercancel', up);

    const unregister = register({
      frame(dt) {
        if (hover) {
          RX.t = -(gy / 50 - 1) * TILT;
          RY.t = (gx / 50 - 1) * TILT;
          G.t = 1;
        } else {
          RX.t = 0;
          RY.t = 0;
          G.t = 0;
        }
        [RX, RY, G, LIFT, F].forEach((s) => step(s, dt));
      },
      render() {
        const ry = RY.x + F.x;
        card.style.transform = `rotateX(${RX.x.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) scale(${LIFT.x.toFixed(4)})`;
        // Show only the face turned toward the viewer. backface-visibility
        // alone is not enough: iOS Safari ignores it in some compositing
        // paths and draws the back face mirrored over the front.
        const front = Math.cos((ry * Math.PI) / 180) >= 0;
        faces[0].style.visibility = front ? 'visible' : 'hidden';
        faces[1].style.visibility = front ? 'hidden' : 'visible';
        // parallax: layers slide by depth against the tilt
        const ox = RY.x / TILT,
          oy = -RX.x / TILT;
        layers.forEach((l) => {
          l.el.style.transform = `translate(${(ox * DEPTH * l.depth).toFixed(2)}px,${(oy * DEPTH * l.depth).toFixed(2)}px)`;
        });
        glare.style.opacity = clamp(G.x, 0, 1).toFixed(3);
        glare.style.setProperty('--gx', gx + '%');
        glare.style.setProperty('--gy', gy + '%');
      },
      // a resting pointer is idle too: each move kicks the loop again
      idle: () => [RX, RY, G, LIFT, F].every((s) => atRest(s))
    });

    return () => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerleave', leave);
      stage.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      unregister();
    };
  }, []);

  useEffect(() => flipRef.current(flipped), [flipped]);

  const flip = () => setFlipped((f) => !f);
  // "Findings of EMNLP 2026" -> conference "EMNLP 2026", track "Findings"
  const conference = venue.replace(/^Findings of /, '');
  const track = venue.startsWith('Findings') ? 'Findings' : 'Main';
  const citationText =
    citations != null
      ? `${Number(citations).toLocaleString()} citations`
      : null;

  return (
    <div ref={stageRef} className="w-full md:w-1/2 [perspective:900px]">
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${title}. ${flipped ? 'Showing details' : 'Press for details'}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) return;
          flip();
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            flip();
          }
        }}
        className="relative h-[272px] rounded-[28px] cursor-pointer pointer-events-none [transform-style:preserve-3d] will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fill-3)]"
      >
        {/* front */}
        <div
          className="ticket-side"
          aria-hidden={flipped}
          // The card is only a 3D wrapper and takes no clicks itself: in 3D
          // hit-testing it shares a plane with the faces. Only the face that
          // is showing receives clicks, which bubble up to the card.
          style={{ pointerEvents: flipped ? 'none' : 'auto' }}
        >
          {/* the painted texture, pre-generated by scripts/paint-textures.mts;
              preloaded, with the hue as a plain fill until it arrives */}
          <div
            data-depth="0.25"
            className={cn(layer, '-inset-5')}
            style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
          >
            <Image
              src={`/static/images/papers/${arxivId}.webp`}
              alt=""
              fill
              priority
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/45" />
          <div data-depth="0.9" className={cn(layer, 'inset-0')}>
            {/* the conference only; the track (Findings or Main) is on the back */}
            <span className="absolute left-5 top-5 text-xs font-medium px-2.5 py-1 rounded-full bg-black/25 text-white">
              {conference}
            </span>
            <h4 className="absolute left-5 right-5 bottom-[52px] text-xl font-bold leading-snug tracking-tight text-white">
              {title}
            </h4>
            <div className="absolute left-5 right-5 bottom-5 text-sm text-white/75">
              <span>
                {citationText ?? `${authors[0].split(' ').pop()} et al.`}
              </span>
            </div>
          </div>
          <div
            ref={glareRef}
            className="absolute inset-0 pointer-events-none opacity-0 mix-blend-screen"
            style={{
              background:
                'radial-gradient(240px circle at var(--gx,50%) var(--gy,30%), rgba(255,255,255,.22), transparent 60%)'
            }}
          />
        </div>

        {/* back */}
        <div
          className="ticket-side flex flex-col p-5 [transform:rotateY(180deg)]"
          aria-hidden={!flipped}
          // hidden until the card turns (the render loop keeps it in step)
          style={{
            pointerEvents: flipped ? 'auto' : 'none',
            visibility: 'hidden'
          }}
        >
          {/* Laid out from the examples' own parts: the expand card's chip,
              the profile card's bio, the ticket back's seat row (small label
              over a bold value) and the profile card's actions. */}
          <span className="self-start px-2.5 py-[5px] rounded-full bg-fill-2 text-[12px] font-medium leading-[14px] text-ink-2 whitespace-nowrap">
            {conference}
          </span>
          <p className="mt-3 text-[14px] leading-5 text-ink-2 line-clamp-4">
            {authors.join(', ')}
          </p>
          <dl className="mt-4 flex gap-[22px]">
            {[
              ['Track', track],
              ['Pages', pages],
              [
                'Cited',
                citations != null ? Number(citations).toLocaleString() : '–'
              ]
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] leading-[14px] text-muted">
                  {label}
                </dt>
                <dd className="mt-0.5 text-[16px] font-semibold leading-[21px] text-ink tabular-nums whitespace-nowrap">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex items-center gap-2">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-inverse text-on-inverse text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
            >
              Open paper
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17L17 7M8 7h9v9" />
              </svg>
            </a>
            <a
              href={pdf}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-fill-2 text-ink text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
            >
              PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
