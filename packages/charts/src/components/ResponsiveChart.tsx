import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

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
  const [width, setWidth] = useState(fallbackWidth);
  const safeAspectRatio = Math.max(0.1, aspectRatio);
  const height = Math.round(Math.min(maxHeight, Math.max(minHeight, width / safeAspectRatio)));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (element.clientWidth > 0) {
      setWidth(element.clientWidth);
    }

    if (typeof ResizeObserver === "undefined") {
      const isDev = typeof (globalThis as Record<string, unknown>).process !== "undefined" &&
        ((globalThis as Record<string, unknown>).process as { env?: Record<string, string> })?.env?.NODE_ENV !== "production";
      if (isDev) {
        console.warn("[ResponsiveChart] ResizeObserver is not available in this environment. Falling back to static fallbackWidth.");
      }
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry?.contentRect.width ?? fallbackWidth);
      if (nextWidth > 0) setWidth(nextWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [fallbackWidth]);

  return (
    <div ref={ref} className={className} style={{ width: "100%", minHeight, ...style }}>
      {children({ width, height })}
    </div>
  );
}
