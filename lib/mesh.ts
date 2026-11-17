import type { CSSProperties } from 'react';

// The site's grainy mesh, from the motion studies: a base colour with three
// soft blobs (light, pale, deep) and film grain blended over the top. One hue
// sets every colour, so a name or a card only needs a single number.

// FNV-1a: a small, stable 32-bit string hash.
function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A hue in [0, 360) that is always the same for the same seed. */
export function hueFor(seed: string) {
  return hash(seed) % 360;
}

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// the paper cards' shade: darker toward the bottom, so white text stays legible
const SHADE =
  'linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.45))';

/**
 * Background for a hue. Pass `shade: false` when the element already has its
 * own shade layer (the paper cards draw it separately).
 */
export function mesh(hue: number, { shade = true } = {}): CSSProperties {
  const c = (dh: number, s: number, l: number) =>
    `hsl(${(hue + dh + 360) % 360} ${s}% ${l}%)`;
  const layers = [
    GRAIN,
    ...(shade ? [SHADE] : []),
    `radial-gradient(70% 70% at 12% 10%, ${c(15, 100, 76)} 0, transparent 70%)`, // light
    `radial-gradient(60% 60% at 92% 8%, ${c(5, 100, 90)} 0, transparent 70%)`, // pale
    `radial-gradient(75% 75% at 88% 96%, ${c(-50, 85, 50)} 0, transparent 72%)` // deep
  ];
  return {
    backgroundColor: c(0, 95, 58), // base
    backgroundImage: layers.join(', '),
    backgroundBlendMode: [
      'overlay',
      ...layers.slice(1).map(() => 'normal')
    ].join(', ')
  };
}
