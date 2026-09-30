import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import * as ReactDOM from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

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

  return (
    <div className={className} style={{ position: "relative", width: "100%", ...style }}>
      <svg
        role="group"
        aria-roledescription="chart"
        aria-labelledby={titleId}
        aria-describedby={ariaDescription ? descriptionId : undefined}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
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
  const tooltipRef = useState<{ current: HTMLDivElement | null }>({ current: null })[0];
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On touch devices, pointerleave often does not fire. Add an outside tap handler to dismiss lingering tooltip.
  useEffect(() => {
    if (!tooltip) return;
    const handleOutsideTouch = (event: TouchEvent | MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.("[role='graphics-symbol']") && !target?.closest?.("[role='tooltip']")) {
        // If tapped outside active symbols and tooltip, hide
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      }
    };
    window.addEventListener("touchstart", handleOutsideTouch, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleOutsideTouch);
    };
  }, [tooltip]);

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setMeasuredSize({ width: rect.width, height: rect.height });
      }
    }
  }, [tooltip?.content]);

  if (!tooltip) return null;

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
        ref={(el) => {
          tooltipRef.current = el;
          if (el && (!measuredSize || measuredSize.width !== el.offsetWidth || measuredSize.height !== el.offsetHeight)) {
            setMeasuredSize({ width: el.offsetWidth, height: el.offsetHeight });
          }
        }}
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
