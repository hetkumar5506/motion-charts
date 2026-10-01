import type { ChartMargin } from "../types";

export type ChartBounds = ChartMargin & {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
};

/**
 * Resolve chart dimensions and margins into finite values that always leave a
 * drawable viewport. Responsive parents can briefly report zero width during
 * layout, and JavaScript consumers can pass NaN or Infinity; neither should
 * reach an SVG attribute or scale calculation.
 */
export function resolveChartBounds(
  width: number,
  height: number,
  defaults: ChartMargin,
  margin?: Partial<ChartMargin>
): ChartBounds {
  const safeWidth = Math.max(1, finitePositive(width, 1));
  const safeHeight = Math.max(1, finitePositive(height, 1));
  const requested = {
    top: finiteNonNegative(margin?.top, defaults.top),
    right: finiteNonNegative(margin?.right, defaults.right),
    bottom: finiteNonNegative(margin?.bottom, defaults.bottom),
    left: finiteNonNegative(margin?.left, defaults.left)
  };

  const [left, right] = fitMargins(requested.left, requested.right, safeWidth);
  const [top, bottom] = fitMargins(requested.top, requested.bottom, safeHeight);

  return {
    width: safeWidth,
    height: safeHeight,
    top,
    right,
    bottom,
    left,
    innerWidth: Math.max(1, safeWidth - left - right),
    innerHeight: Math.max(1, safeHeight - top - bottom)
  };
}

export function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function finiteNonNegative(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function fitMargins(start: number, end: number, size: number): [number, number] {
  const total = start + end;
  if (total <= size - 1 || total <= 0) return [start, end];

  // Preserve the caller's proportions while guaranteeing at least one SVG
  // unit for the plotting area. This is important on very narrow cards.
  const factor = Math.max(0, (size - 1) / total);
  return [start * factor, end * factor];
}
