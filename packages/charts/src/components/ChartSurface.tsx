import { useId, type CSSProperties, type ReactNode } from "react";
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
        role="img"
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
  return (
    <AnimatePresence>
      {tooltip ? (
        <motion.div
          role="tooltip"
          initial={{ opacity: 0, y: 6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.94 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 12,
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
            backdropFilter: "blur(12px)",
            ...style
          }}
        >
          {tooltip.content}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
