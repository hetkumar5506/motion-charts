import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { finitePositive } from "../utils/layout";

export type TooltipState = {
  x: number;
  y: number;
  content: ReactNode;
  id?: string;
} | null;

export type ChartSurfaceProps = {
  width: number;
  height: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
  ariaDescription?: string;
  children: ReactNode;
  tooltip?: TooltipState;
  tooltipStyle?: CSSProperties;
  tooltipId?: string;
};

export function ChartSurface({
  width,
  height,
  className,
  style,
  ariaLabel,
  ariaDescription,
  children,
  tooltip,
  tooltipStyle,
  tooltipId
}: ChartSurfaceProps) {
  const titleId = useId();
  const descriptionId = useId();
  const safeWidth = finitePositive(width, 1);
  const safeHeight = finitePositive(height, 1);

  return (
    <div className={className} style={{ position: "relative", width: "100%", minWidth: 0, ...style }}>
      <svg
        role="group"
        aria-roledescription="chart"
        aria-labelledby={titleId}
        aria-describedby={ariaDescription ? descriptionId : undefined}
        width="100%"
        height={safeHeight}
        viewBox={`0 0 ${safeWidth} ${safeHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", overflow: "visible" }}
      >
        <title id={titleId}>{ariaLabel}</title>
        {ariaDescription ? <desc id={descriptionId}>{ariaDescription}</desc> : null}
        {children}
      </svg>
      <ChartTooltip tooltip={tooltip} style={tooltipStyle} tooltipId={tooltipId} />
    </div>
  );
}

function ChartTooltip({ tooltip, style, tooltipId }: { tooltip?: TooltipState; style?: CSSProperties; tooltipId?: string }) {
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset dismissed state whenever tooltip changes (new point hovered/focused)
  useEffect(() => {
    setDismissed(false);
  }, [tooltip?.content, tooltip?.x, tooltip?.y]);

  // On touch devices, pointerleave often does not fire. Add an outside tap handler to dismiss lingering tooltip.
  useEffect(() => {
    if (!tooltip) return;
    const handleOutsideTouch = (event: TouchEvent | MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.("[role='graphics-symbol']") && !target?.closest?.("[role='tooltip']")) {
        setDismissed(true);
      }
    };
    window.addEventListener("touchstart", handleOutsideTouch, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleOutsideTouch);
    };
  }, [tooltip]);

  // Measure after the portal is mounted and keep the size current when a
  // custom renderer or viewport changes the tooltip's dimensions. The first
  // render uses a conservative fallback so it is still correctly clamped.
  useEffect(() => {
    if (!tooltip || !mounted) return;

    setMeasuredSize(null);
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const element = tooltipRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMeasuredSize((previous) => (
          previous?.width === rect.width && previous.height === rect.height
            ? previous
            : { width: rect.width, height: rect.height }
        ));
      }
    };
    const scheduleMeasure = () => {
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(measure);
      } else {
        window.setTimeout(measure, 0);
      }
    };

    scheduleMeasure();
    window.addEventListener("resize", scheduleMeasure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleMeasure);
    if (observer && tooltipRef.current) observer.observe(tooltipRef.current);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", scheduleMeasure);
      observer?.disconnect();
    };
  }, [mounted, style, tooltip?.content, tooltip?.id]);

  if (!tooltip || dismissed) return null;

  // Viewport clamping & position logic:
  // Measure actual element bounds when available with sane initial fallback
  const tooltipWidth = measuredSize?.width ?? 280;
  const tooltipHeight = measuredSize?.height ?? 70;
  const offset = 14;

  let left = tooltip.x + offset;
  let top = tooltip.y - 12;

  if (typeof window !== "undefined") {
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    // Smoothly constrain left within [12, vpWidth - tooltipWidth - 12]
    // If cursor is near right edge, place to the left of cursor
    if (left + tooltipWidth > vpWidth - 12) {
      const leftAlternative = tooltip.x - tooltipWidth - offset;
      left = leftAlternative >= 12 ? leftAlternative : Math.max(12, vpWidth - tooltipWidth - 12);
    } else {
      left = Math.max(12, left);
    }

    // Clamp vertical bounds to keep fully inside viewport
    if (top + tooltipHeight > vpHeight - 12) {
      top = Math.max(12, vpHeight - tooltipHeight - 12);
    }
    if (top < 12) {
      top = 12;
    }
  }

  const tooltipElement = (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        id={tooltipId || tooltip.id}
        role="tooltip"
        initial={{ opacity: 0, y: 4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 3, scale: 0.96 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          left,
          top,
          zIndex: 9999,
          pointerEvents: "none",
          minWidth: 120,
          maxWidth: 280,
          borderRadius: 10,
          border: "1px solid rgba(226, 232, 240, 0.9)",
          background: "#ffffff",
          color: "#0f172a",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
          padding: "9px 13px",
          font: '13px/1.45 Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          ...style
        }}
      >
        {tooltip.content}
      </motion.div>
    </AnimatePresence>
  );

  // By portaling to document.body, fixed positioning is relative to viewport and avoids
  // CSS transform/filter containing blocks created by ancestor elements (such as Framer Motion parents)
  const portalFn = (ReactDOM as unknown as { createPortal?: typeof ReactDOM.createPortal }).createPortal;
  if (mounted && typeof document !== "undefined" && document.body && typeof portalFn === "function") {
    return portalFn(tooltipElement, document.body);
  }

  return tooltipElement;
}
