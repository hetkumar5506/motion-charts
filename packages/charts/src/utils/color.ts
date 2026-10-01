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
  return palette[index % palette.length] ?? defaultColors[0];
}

const rgbCache = new Map<string, [number, number, number] | null>();
const isDarkCache = new Map<string, boolean>();
const contrastCache = new Map<string, string>();

export function parseToRgb(color: string): [number, number, number] | null {
  if (!color || typeof color !== "string") return null;
  const cached = rgbCache.get(color);
  if (cached !== undefined) return cached;

  const c = color.trim().toLowerCase();
  let result: [number, number, number] | null = null;

  if (c.startsWith("#")) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0]! + hex[0]!, 16);
      const g = Number.parseInt(hex[1]! + hex[1]!, 16);
      const b = Number.parseInt(hex[2]! + hex[2]!, 16);
      result = [r, g, b];
    } else if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      result = [r, g, b];
    }
  } else {
    const rgbMatch = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (rgbMatch) {
      const r = Number.parseInt(rgbMatch[1]!, 10);
      const g = Number.parseInt(rgbMatch[2]!, 10);
      const b = Number.parseInt(rgbMatch[3]!, 10);
      result = [r, g, b];
    } else if (c === "white") {
      result = [255, 255, 255];
    } else if (c === "black") {
      result = [0, 0, 0];
    }
  }

  if (rgbCache.size < 200) {
    rgbCache.set(color, result);
  }
  return result;
}

export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [rs, gs, bs] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isDarkColor(color: string): boolean {
  const cached = isDarkCache.get(color);
  if (cached !== undefined) return cached;
  const rgb = parseToRgb(color);
  if (!rgb) return false;
  const result = getRelativeLuminance(rgb) < 0.45;
  if (isDarkCache.size < 200) {
    isDarkCache.set(color, result);
  }
  return result;
}

export function getContrastTextColor(backgroundColor: string): string {
  const cached = contrastCache.get(backgroundColor);
  if (cached !== undefined) return cached;
  const rgb = parseToRgb(backgroundColor);
  if (!rgb) return "#ffffff";
  const result = getRelativeLuminance(rgb) > 0.45 ? "#0f172a" : "#ffffff";
  if (contrastCache.size < 200) {
    contrastCache.set(backgroundColor, result);
  }
  return result;
}

