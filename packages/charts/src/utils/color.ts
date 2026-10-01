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

export function parseToRgb(color: string): [number, number, number] | null {
  if (!color || typeof color !== "string") return null;
  const c = color.trim().toLowerCase();
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      const r = Number.parseInt(hex[0]! + hex[0]!, 16);
      const g = Number.parseInt(hex[1]! + hex[1]!, 16);
      const b = Number.parseInt(hex[2]! + hex[2]!, 16);
      return [r, g, b];
    }
    if (hex.length === 6) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    }
  }
  const rgbMatch = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (rgbMatch) {
    const r = Number.parseInt(rgbMatch[1]!, 10);
    const g = Number.parseInt(rgbMatch[2]!, 10);
    const b = Number.parseInt(rgbMatch[3]!, 10);
    return [r, g, b];
  }
  if (c === "white") return [255, 255, 255];
  if (c === "black") return [0, 0, 0];
  return null;
}

export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [rs, gs, bs] = rgb.map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function isDarkColor(color: string): boolean {
  const rgb = parseToRgb(color);
  if (!rgb) return false;
  return getRelativeLuminance(rgb) < 0.45;
}

export function getContrastTextColor(backgroundColor: string): string {
  const rgb = parseToRgb(backgroundColor);
  if (!rgb) return "#ffffff";
  return getRelativeLuminance(rgb) > 0.45 ? "#0f172a" : "#ffffff";
}

