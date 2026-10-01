import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { isDev } from "../utils/env";

export type ResponsiveChartSize = {
  width: number;
  height: number;
};

export type ResponsiveChartProps = {
  children: (size: ResponsiveChartSize) => ReactNode;
  aspectRatio?: number;
  minHeight?: number;
  maxHeight?: number;
  fallbackWidth?: number;
  className?: string;
  style?: CSSProperties;
};

export function ResponsiveChart({
  children,
  aspectRatio = 16 / 9,
  minHeight = 260,
  maxHeight = 520,
  fallbackWidth = 720,
  className,
  style
}: ResponsiveChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const safeFallbackWidth = finitePositive(fallbackWidth, 720);
  const safeAspectRatio = finitePositive(aspectRatio, 16 / 9);
  const safeMinHeight = finiteNonNegative(minHeight, 260);
  const safeMaxHeight = Math.max(safeMinHeight, finiteNonNegative(maxHeight, 520));
  const [width, setWidth] = useState(safeFallbackWidth);
  const height = Math.round(Math.min(safeMaxHeight, Math.max(safeMinHeight, width / safeAspectRatio)));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measuredWidth = element.clientWidth;
    setWidth(measuredWidth > 0 ? measuredWidth : safeFallbackWidth);

    if (typeof ResizeObserver === "undefined") {
      if (isDev()) {
        console.warn("[ResponsiveChart] ResizeObserver is not available in this environment. Falling back to static fallbackWidth.");
      }
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width ?? 0;
      // Ignore zero-width observations while a responsive parent is hidden;
      // retaining the previous width avoids a flash of a 1px chart.
      if (Number.isFinite(nextWidth) && nextWidth > 0) {
        setWidth(Math.max(1, Math.round(nextWidth)));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [safeFallbackWidth]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", minWidth: 0, minHeight: safeMinHeight, ...style }}
    >
      {children({ width, height })}
    </div>
  );
}

function finitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegative(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
