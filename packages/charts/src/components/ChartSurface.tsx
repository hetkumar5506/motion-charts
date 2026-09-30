import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

export type TooltipState = {
  x: number;
  y: number;
  content: ReactNode;
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
};

export function ChartSurface({ width, height, className, style, ariaLabel, ariaDescription, children, tooltip, tooltipStyle }: ChartSurfaceProps) {
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
      <ChartTooltip tooltip={tooltip} style={tooltipStyle} />
    </div>
  );
}

function ChartTooltip({ tooltip, style }: { tooltip?: TooltipState; style?: CSSProperties }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!tooltip) return null;

  // Viewport clamping & flip logic
  const tooltipWidth = 220;
  const tooltipHeight = 64;
  const offset = 14;

  let left = tooltip.x + offset;
  let top = tooltip.y - 12;

  if (typeof window !== "undefined") {
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    // Flip to left if overflowing right edge
    if (left + tooltipWidth > vpWidth - 12) {
      left = Math.max(12, tooltip.x - tooltipWidth - offset);
    }
    // Flip or clamp if overflowing bottom edge
    if (top + tooltipHeight > vpHeight - 12) {
      top = Math.max(12, vpHeight - tooltipHeight - 12);
    }
    // Clamp top boundary
    if (top < 12) {
      top = 12;
    }
  }

  const tooltipElement = (
    <AnimatePresence>
      <motion.div
        role="tooltip"
        initial={{ opacity: 0, y: 6, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.94 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
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

  if (mounted && typeof document !== "undefined" && document.body) {
    return createPortal(tooltipElement, document.body);
  }

  return tooltipElement;
}
