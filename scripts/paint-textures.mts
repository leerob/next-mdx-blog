// Pre-generates the painted textures behind the research cards on the home
// page, as WebP files in public/static/images/papers. Run it after adding a
// paper (and add the paper to PAPERS below):
//
//   node scripts/paint-textures.mts
//
// The texture, drawn once per paper from a seed and a hue:
//
// 1. Domain-warped fBm (Inigo Quilez, iquilezles.org/articles/warp): noise
//    sampled through noise, f(p + 2r), r = fbm(p + 2q), q = fbm(p), gives the
//    soft, flowing forms.
// 2. A gradient map through deep, base, rose, warm and cream colours derived
//    from the hue, interpolated in OKLab so the blends stay clean.
// 3. Patches of a muted complementary accent, from their own noise field.
// 4. Ridged noise, 1 - |n| raised to a high power, for thin branching veins.
// 5. Stippled grain: each pixel's position on the gradient is jittered, so
//    colours scatter into each other at their edges, plus fine film grain.

import sharp from 'sharp';

// the cards on the home page: the seed is the arXiv ID, the hue the card's
const PAPERS = [
  { id: '2603.01865', hue: 350 }, // CyclicJudge
  { id: '2512.20773', hue: 220 } // DIAL
];

// the card's background layer overhangs the 272px-tall card by 20px a side;
// drawn at 2x for sharp grain on high-density screens
const WIDTH = 840,
  HEIGHT = 624;

// ---------- seeded randomness and noise ----------

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 2D gradient noise in about [-1, 1], with a permutation table from `rand`
function gradientNoise(rand: () => number) {
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const gx = new Float32Array(8),
    gy = new Float32Array(8);
  for (let i = 0; i < 8; i++) {
    gx[i] = Math.cos((i * Math.PI) / 4);
    gy[i] = Math.sin((i * Math.PI) / 4);
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = x - xi,
      yf = y - yi;
    const X = xi & 255,
      Y = yi & 255;
    const g = (ix: number, iy: number, dx: number, dy: number) => {
      const k = p[ix + p[iy]] & 7;
      return gx[k] * dx + gy[k] * dy;
    };
    const u = fade(xf),
      v = fade(yf);
    const a = g(X, Y, xf, yf),
      b = g(X + 1, Y, xf - 1, yf),
      c = g(X, Y + 1, xf, yf - 1),
      d = g(X + 1, Y + 1, xf - 1, yf - 1);
    return 1.4 * (a + u * (b - a) + v * (c - a + u * (a - b - c + d)));
  };
}

// ---------- colour ----------

type RGB = [number, number, number];

function hsl(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const toGamma = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

function toOklab([r, g, b]: RGB): RGB {
  [r, g, b] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

function fromOklab([L, A, B]: RGB): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const out = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
  return out.map((c) =>
    Math.round(255 * Math.min(1, Math.max(0, toGamma(c))))
  ) as RGB;
}

// a 256-step lookup table through the given stops, blended in OKLab
function ramp(stops: [number, RGB][]) {
  const lab = stops.map(([t, c]) => [t, toOklab(c)] as const);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let k = 0;
    while (k < lab.length - 2 && t > lab[k + 1][0]) k++;
    const [t0, c0] = lab[k],
      [t1, c1] = lab[k + 1];
    const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    const rgb = fromOklab([
      c0[0] + (c1[0] - c0[0]) * u,
      c0[1] + (c1[1] - c0[1]) * u,
      c0[2] + (c1[2] - c0[2]) * u
    ]);
    lut.set(rgb, i * 3);
  }
  return lut;
}

// ---------- the texture ----------

function paint(seed: string, hue: number, W: number, H: number) {
  const rand = mulberry32(hash(seed));
  const noise = gradientNoise(rand);

  // the palette, all from one hue: deep, base, a rose and a warm neighbour,
  // and a cream highlight, plus a muted complement that reads as an accent
  // (the teal in an orange field, the periwinkle in a green one) and a light
  // gold for the veins
  const deep = hsl(hue - 35, 45, 24),
    base = hsl(hue, 74, 55),
    rose = hsl(hue - 24, 70, 63),
    warm = hsl(hue + 26, 82, 64),
    pale = hsl(hue + 40, 65, 89),
    accent = hsl(hue + 180, 36, 58),
    vein = hsl(hue + 45, 100, 70);
  const main = ramp([
    [0, deep],
    [0.28, base],
    [0.48, rose],
    [0.68, warm],
    [0.9, pale],
    [1, pale]
  ]);
  const acc = ramp([
    [0, hsl(hue + 200, 35, 30)],
    [0.5, accent],
    [1, hsl(hue + 170, 40, 86)]
  ]);

  // random offsets so each seed samples a different part of the noise
  const ox = rand() * 100,
    oy = rand() * 100;
  const fbm = (x: number, y: number, oct = 5) => {
    let v = 0,
      a = 0.5;
    for (let i = 0; i < oct; i++) {
      v += a * noise(x, y);
      // rotate a little each octave to hide the grid
      const nx = 1.6 * x + 1.2 * y,
        ny = -1.2 * x + 1.6 * y;
      x = nx + 3.1;
      y = ny + 1.7;
      a *= 0.5;
    }
    return v;
  };

  // the smooth fields are sampled on a coarser grid and interpolated
  const STEP = 2;
  const gw = Math.ceil(W / STEP) + 2,
    gh = Math.ceil(H / STEP) + 2;
  const T = new Float32Array(gw * gh),
    A = new Float32Array(gw * gh),
    V = new Float32Array(gw * gh);
  const scale = 1.0 / Math.max(W, H);
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const px = i * STEP * scale + ox,
        py = j * STEP * scale + oy;
      const qx = fbm(px, py, 3),
        qy = fbm(px + 5.2, py + 1.3, 3);
      const rx = fbm(px + 2 * qx + 1.7, py + 2 * qy + 9.2, 4),
        ry = fbm(px + 2 * qx + 8.3, py + 2 * qy + 2.8, 4);
      const f = fbm(px + 2 * rx, py + 2 * ry, 4);
      const yn = (j * STEP) / H;
      const k = j * gw + i;
      // brighter toward the top, so white text at the bottom stays legible
      T[k] = 0.5 + 0.65 * f + 0.4 * (0.45 - yn) + 0.25 * rx;
      // accent patches from their own low-frequency field
      const ac = fbm(0.8 * px + 20 + 0.5 * rx, 0.8 * py + 7 + 0.5 * ry, 3);
      A[k] = Math.max(0, Math.min(1, (ac - 0.08) * 3.5));
      // ridged noise along the warped field: thin, branching lines
      const wx = px + 1.5 * rx,
        wy = py + 1.5 * ry;
      const n1 = 1 - Math.abs(noise(6 * wx, 6 * wy));
      const n2 = 1 - Math.abs(noise(13 * wx + 4, 13 * wy + 9));
      const mask = Math.max(0, Math.min(1, (qx + 0.1) * 3));
      V[k] = (n1 ** 28 + 0.6 * n2 ** 40) * mask;
    }
  }

  const d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const gy = y / STEP,
      j = Math.floor(gy),
      fy = gy - j;
    for (let x = 0; x < W; x++) {
      const gx = x / STEP,
        i = Math.floor(gx),
        fx = gx - i;
      const k = j * gw + i;
      const lerp = (F: Float32Array) => {
        const a = F[k] + (F[k + 1] - F[k]) * fx;
        const b = F[k + gw] + (F[k + gw + 1] - F[k + gw]) * fx;
        return a + (b - a) * fy;
      };
      // stipple: jitter the position on the ramp so neighbouring colours
      // scatter into each other
      let t = lerp(T) + (rand() - 0.5) * 0.24;
      t = Math.min(1, Math.max(0, t));
      const ti = Math.round(t * 255) * 3;
      let r = main[ti],
        g = main[ti + 1],
        b = main[ti + 2];
      // the accent appears as scattered grains where its field is strong
      const a = lerp(A);
      if (rand() < a * 0.85) {
        const w = 0.55 + 0.45 * a;
        r += (acc[ti] - r) * w;
        g += (acc[ti + 1] - g) * w;
        b += (acc[ti + 2] - b) * w;
      }
      const v = Math.min(1, lerp(V) * (0.7 + 0.6 * rand()));
      r += (vein[0] * 255 - r) * v;
      g += (vein[1] * 255 - g) * v;
      b += (vein[2] * 255 - b) * v;
      const n = (rand() - 0.5) * 18; // film grain
      const p = (y * W + x) * 4;
      d[p] = r + n;
      d[p + 1] = g + n;
      d[p + 2] = b + n;
      d[p + 3] = 255;
    }
  }
  return d;
}

for (const { id, hue } of PAPERS) {
  const file = `public/static/images/papers/${id}.webp`;
  await sharp(Buffer.from(paint(id, hue, WIDTH, HEIGHT).buffer), {
    raw: { width: WIDTH, height: HEIGHT, channels: 4 }
  })
    .webp({ quality: 82 })
    .toFile(file);
  console.log(file);
}
