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
