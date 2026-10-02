export const defaultColors = [
  "#7c3aed",
  "#06b6d4",
  "#f97316",
  "#22c55e",
  "#ec4899",
  "#eab308",
  "#3b82f6",
  "#ef4444"
] as const;

export function colorAt(colors: readonly string[] | undefined, index: number): string {
  const palette = colors && colors.length > 0 ? colors : defaultColors;
  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  const normalizedIndex = ((safeIndex % palette.length) + palette.length) % palette.length;
  return palette[normalizedIndex] ?? defaultColors[0];
}

const MAX_CACHE_SIZE = 200;
const rgbCache = new Map<string, [number, number, number] | null>();
const isDarkCache = new Map<string, boolean>();
const contrastCache = new Map<string, string>();

/**
 * Parse the color formats that can reasonably be used in an SVG theme without
 * relying on the DOM. This matters for SSR, where getComputedStyle is not
 * available. Alpha is intentionally ignored because luminance is calculated
 * against the supplied RGB channels.
 */
export function parseToRgb(color: string): [number, number, number] | null {
  if (typeof color !== "string" || !color.trim()) return null;

  const normalized = color.trim().toLowerCase();
  const cached = rgbCache.get(normalized);
  if (cached !== undefined) return cached;

  const result = parseColor(normalized);
  setBounded(rgbCache, normalized, result);
  return result;
}

export function getContrastRatio(foreground: string, background: string): number {
  const foregroundRgb = parseToRgb(foreground);
  const backgroundRgb = parseToRgb(background);
  if (!foregroundRgb || !backgroundRgb) return 1;
  const lighter = Math.max(getRelativeLuminance(foregroundRgb), getRelativeLuminance(backgroundRgb));
  const darker = Math.min(getRelativeLuminance(foregroundRgb), getRelativeLuminance(backgroundRgb));
  return (lighter + 0.05) / (darker + 0.05);
}

export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [rs, gs, bs] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isDarkColor(color: string): boolean {
  const key = typeof color === "string" ? color.trim().toLowerCase() : "";
  const cached = isDarkCache.get(key);
  if (cached !== undefined) return cached;
  const rgb = parseToRgb(key);
  if (!rgb) return false;
  const result = getRelativeLuminance(rgb) < 0.45;
  setBounded(isDarkCache, key, result);
  return result;
}

export function getContrastTextColor(backgroundColor: string): string {
  const key = typeof backgroundColor === "string" ? backgroundColor.trim().toLowerCase() : "";
  const cached = contrastCache.get(key);
  if (cached !== undefined) return cached;
  const rgb = parseToRgb(key);
  if (!rgb) return "#ffffff";
  const result = getRelativeLuminance(rgb) > 0.45 ? "#0f172a" : "#ffffff";
  setBounded(contrastCache, key, result);
  return result;
}

function parseColor(color: string): [number, number, number] | null {
  if (color.startsWith("#")) return parseHex(color.slice(1));

  const functionMatch = color.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (functionMatch) {
    const [, functionName, body] = functionMatch;
    const channels = body?.trim().split(/[,\s/]+/).filter(Boolean) ?? [];
    if (functionName?.startsWith("rgb")) return parseRgbChannels(channels);
    if (functionName?.startsWith("hsl")) return parseHslChannels(channels);
  }

  return namedColors[color] ?? null;
}

function parseHex(hex: string): [number, number, number] | null {
  if (![3, 4, 6, 8].includes(hex.length) || !/^[0-9a-f]+$/i.test(hex)) return null;
  const expanded = hex.length === 3 || hex.length === 4
    ? hex.slice(0, 3).split("").map((channel) => `${channel}${channel}`).join("")
    : hex.slice(0, 6);
  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return [red, green, blue];
}

function parseRgbChannels(channels: readonly string[]): [number, number, number] | null {
  if (channels.length < 3) return null;
  const parsed = channels.slice(0, 3).map(parseRgbChannel);
  if (parsed.some((value) => value === null)) return null;
  return [parsed[0]!, parsed[1]!, parsed[2]!];
}

function parseRgbChannel(value: string): number | null {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(clamp(value.endsWith("%") ? numeric * 255 / 100 : numeric, 0, 255));
}

function parseHslChannels(channels: readonly string[]): [number, number, number] | null {
  if (channels.length < 3) return null;
  const hue = Number.parseFloat(channels[0]!);
  const saturation = parsePercentage(channels[1]!);
  const lightness = parsePercentage(channels[2]!);
  if (!Number.isFinite(hue) || saturation === null || lightness === null) return null;

  const h = ((hue % 360) + 360) % 360 / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255)
  ];
}

function parsePercentage(value: string): number | null {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? clamp(numeric, 0, 100) : null;
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function setBounded<T>(cache: Map<string, T>, key: string, value: T): void {
  if (cache.has(key)) cache.delete(key);
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

// Common CSS named colors keep luminance checks useful during SSR. Unknown
// names safely fall back to white text rather than crashing the chart.
const namedColors: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
  purple: [128, 0, 128],
  pink: [255, 192, 203],
  brown: [165, 42, 42],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  navy: [0, 0, 128],
  teal: [0, 128, 128],
  aqua: [0, 255, 255],
  cyan: [0, 255, 255],
  lime: [0, 255, 0],
  olive: [128, 128, 0],
  maroon: [128, 0, 0],
  fuchsia: [255, 0, 255],
  indigo: [75, 0, 130],
  violet: [238, 130, 238],
  gold: [255, 215, 0],
  transparent: [255, 255, 255]
};
