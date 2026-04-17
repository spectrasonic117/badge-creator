// Pixel font (3x5 + some 5-wide glyphs) used to rasterize badge text.
// Each glyph is an array of rows; "1" = pixel on. We support A-Z, 0-9, basic punctuation.

export type Glyph = string[];

const G: Record<string, Glyph> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10001", "10001"],
  N: ["1001", "1101", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "111", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["10001", "10001", "10101", "11011", "10001"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["110", "001", "010", "001", "110"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "100", "100"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "110"],
  "+": ["000", "010", "111", "010", "000"],
  "-": ["000", "000", "111", "000", "000"],
  "_": ["000", "000", "000", "000", "111"],
  "!": ["1", "1", "1", "0", "1"],
  "?": ["110", "001", "010", "000", "010"],
  ".": ["0", "0", "0", "0", "1"],
  ",": ["00", "00", "00", "01", "10"],
  "*": ["101", "010", "111", "010", "101"],
  "#": ["00000", "01010", "11111", "01010", "11111"],
  "/": ["001", "001", "010", "100", "100"],
  ":": ["0", "1", "0", "1", "0"],
  " ": ["00", "00", "00", "00", "00"],
};

export const GLYPH_HEIGHT = 5;
export const GLYPH_GAP = 1;

export function getGlyph(ch: string): Glyph {
  return G[ch.toUpperCase()] ?? G["?"];
}

export function measureText(text: string): { width: number; height: number } {
  if (!text.length) return { width: 0, height: GLYPH_HEIGHT };
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    const g = getGlyph(text[i]);
    w += g[0].length;
    if (i < text.length - 1) w += GLYPH_GAP;
  }
  return { width: w, height: GLYPH_HEIGHT };
}

export type GradientStop = {
  /** hex color #rrggbb */
  color: string;
  /** position 0..1 */
  pos: number;
};

export type BadgeConfig = {
  text: string;
  padding: { l: number; r: number; t: number; b: number };
  gradientDirection: "horizontal" | "vertical";
  /** Ordered list of gradient color stops (min 2). */
  gradientStops: GradientStop[];
  textColor: string;
  shadowEnabled: boolean;
  /** Shadow color in #rrggbb (alpha applied separately). */
  shadowColor: string;
  /** 0..1 alpha for the shadow color. */
  shadowAlpha: number;
  /** Pixel-art corner radius (in logical px). 0 = square. */
  cornerRadius: number;
};

/**
 * Pixel-art quarter-circle mask: for a corner of size r,
 * returns true if pixel (x,y) within the r×r box should be CUT (transparent).
 * Uses circle equation so the corner reads as a chunky pixel arc.
 */
function isCornerCut(x: number, y: number, r: number): boolean {
  if (r <= 0) return false;
  // Distance from the inner-corner pivot to the pixel center.
  const dx = r - 0.5 - x;
  const dy = r - 0.5 - y;
  return dx * dx + dy * dy > (r - 0.5) * (r - 0.5);
}

/** Convert #rrggbb + alpha (0..1) into rgba() string for canvas fill. */
export function hexWithAlphaToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Render a badge onto a canvas at logical pixel size (1 cell = 1 px).
 * Caller scales the canvas via CSS for crisp preview.
 */
export function renderBadge(
  canvas: HTMLCanvasElement,
  cfg: BadgeConfig,
): { width: number; height: number } {
  const { text, padding, gradientDirection, gradientStops, textColor, shadowEnabled, shadowColor, shadowAlpha, cornerRadius } = cfg;
  const m = measureText(text);
  const width = padding.l + m.width + padding.r;
  const height = padding.t + m.height + padding.b;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  // Background gradient (supports N stops)
  const grad =
    gradientDirection === "horizontal"
      ? ctx.createLinearGradient(0, 0, 0, height)
      : ctx.createLinearGradient(0, 0, width, 0);
  const stops = [...gradientStops].sort((a, b) => a.pos - b.pos);
  for (const s of stops) {
    grad.addColorStop(Math.max(0, Math.min(1, s.pos)), s.color);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Draw text glyphs
  let cx = padding.l;
  const cy = padding.t;
  const shadowFill = hexWithAlphaToRgba(shadowColor, shadowAlpha);
  for (let i = 0; i < text.length; i++) {
    const g = getGlyph(text[i]);
    const gw = g[0].length;
    // Shadow first (1px down-right) so text overlays cleanly
    if (shadowEnabled) {
      ctx.fillStyle = shadowFill;
      for (let y = 0; y < g.length; y++) {
        for (let x = 0; x < gw; x++) {
          if (g[y][x] === "1") {
            ctx.fillRect(cx + x, cy + y + 1, 1, 1);
          }
        }
      }
    }
    ctx.fillStyle = textColor;
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < gw; x++) {
        if (g[y][x] === "1") {
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
    cx += gw + GLYPH_GAP;
  }

  // Pixel-art rounded corners — clear pixels in the four corners.
  const r = Math.max(0, Math.min(Math.floor(Math.min(width, height) / 2), Math.floor(cornerRadius)));
  if (r > 0) {
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < r; x++) {
        if (isCornerCut(x, y, r)) {
          ctx.clearRect(x, y, 1, 1);                            // top-left
          ctx.clearRect(width - 1 - x, y, 1, 1);                // top-right
          ctx.clearRect(x, height - 1 - y, 1, 1);               // bottom-left
          ctx.clearRect(width - 1 - x, height - 1 - y, 1, 1);   // bottom-right
        }
      }
    }
  }

  return { width, height };
}

/** Convert hex (#rrggbb) to oklch components for the dynamic accent. */
export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  // sRGB -> linear
  const lin = (u: number) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
  const R = lin(r),
    G = lin(g),
    B = lin(b);

  // linear sRGB -> Oklab
  const l_ = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m_ = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s_ = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

export const GRADIENT_PRESETS: { name: string; stops: GradientStop[] }[] = [
  { name: "Red", stops: [{ color: "#FF3333", pos: 0 }, { color: "#CC0000", pos: 1 }] },
  { name: "Orange", stops: [{ color: "#FFA64D", pos: 0 }, { color: "#E66B00", pos: 1 }] },
  { name: "Yellow", stops: [{ color: "#FFE94D", pos: 0 }, { color: "#E6B800", pos: 1 }] },
  { name: "Green", stops: [{ color: "#5CE65C", pos: 0 }, { color: "#1F9E1F", pos: 1 }] },
  { name: "Cyan", stops: [{ color: "#5CE6E6", pos: 0 }, { color: "#0E8C8C", pos: 1 }] },
  { name: "Blue", stops: [{ color: "#4DA6FF", pos: 0 }, { color: "#1257B5", pos: 1 }] },
  { name: "Purple", stops: [{ color: "#B266FF", pos: 0 }, { color: "#6A1FB5", pos: 1 }] },
  { name: "Pink", stops: [{ color: "#FF66CC", pos: 0 }, { color: "#CC1F8E", pos: 1 }] },
  { name: "White", stops: [{ color: "#FFFFFF", pos: 0 }, { color: "#BFBFBF", pos: 1 }] },
  { name: "Black", stops: [{ color: "#4D4D4D", pos: 0 }, { color: "#0A0A0A", pos: 1 }] },
  { name: "Teal", stops: [{ color: "#33D9B2", pos: 0 }, { color: "#0E8068", pos: 1 }] },
  { name: "Magenta", stops: [{ color: "#FF4DBF", pos: 0 }, { color: "#A31273", pos: 1 }] },
  { name: "Gold", stops: [{ color: "#FFD24D", pos: 0 }, { color: "#B8860B", pos: 1 }] },
  { name: "Rainbow", stops: [
    { color: "#FF3333", pos: 0 },
    { color: "#FFD24D", pos: 0.33 },
    { color: "#33D9B2", pos: 0.66 },
    { color: "#B266FF", pos: 1 },
  ] },
];

/** Build a CSS linear-gradient string from stops, for previews. */
export function stopsToCss(stops: GradientStop[], angleDeg: number): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const parts = sorted.map((s) => `${s.color} ${(s.pos * 100).toFixed(1)}%`);
  return `linear-gradient(${angleDeg}deg, ${parts.join(", ")})`;
}
