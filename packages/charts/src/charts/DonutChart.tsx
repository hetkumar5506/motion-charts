import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import type { Accessor, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { resolveChartTheme } from "../themes";
import { arcPath, pieSlices, polar } from "../utils/geometry";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { isDev } from "../utils/env";

export type DonutChartProps<TDatum extends object> = CommonChartProps<TDatum> & {
  labelKey: Accessor<TDatum, string | number>;
  valueKey: Accessor<TDatum, number>;
  innerRadiusRatio?: number;
  padAngle?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  centerLabel?: string | ((total: number) => string);
  sliceVariant?: "solid" | "gradient";
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

export function DonutChart<TDatum extends object>({
  data = [],
  labelKey,
  valueKey,
  width = 520,
  height = 360,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Donut chart",
  ariaDescription,
  valueFormatter = defaultValueFormatter,
  emptyState,
  animation,
  tooltip,
  innerRadiusRatio = 0.62,
  padAngle = 0.018,
  showLegend = true,
  showLabels = false,
  centerLabel,
  sliceVariant = "gradient",
  onDatumClick
}: DonutChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeData = data ?? [];

  const rows = useMemo(
    () =>
      safeData.map((datum, index) => {
        const label = labelOf(datum, index, labelKey);
        const rawValue = numberOf(datum, index, valueKey);
        if (rawValue < 0 && isDev()) {
          console.warn(`[@motion-charts/core] DonutChart received negative value at index ${index} (${rawValue}). Clamping to 0.`);
        }
        const value = Math.max(0, rawValue);
        const color = colorAt(chartTheme.colors, index);
        return { datum, index, label, value, color };
      }),
    [chartTheme.colors, labelKey, safeData, valueKey]
  );
  const total = useMemo(() => rows.reduce((sum, row) => sum + row.value, 0), [rows]);
  const slices = useMemo(
    () => pieSlices(rows.map((row) => row.value), padAngle),
    [padAngle, rows]
  );

  // Filter only renderable slices with value > 0 for 1:1 DOM index keyboard navigation
  const renderableSlices = useMemo(
    () =>
      slices
        .map((slice, index) => ({ slice, row: rows[index], originalIndex: index }))
        .filter((item): item is { slice: (typeof slices)[number]; row: (typeof rows)[number]; originalIndex: number } => !!item.row && item.slice.value > 0),
    [rows, slices]
  );

  const padLeft = margin?.left ?? 0;
  const padRight = margin?.right ?? 0;
  const padTop = margin?.top ?? 0;
  const padBottom = margin?.bottom ?? 0;
  const innerW = Math.max(20, width - padLeft - padRight);
  const innerH = Math.max(20, height - padTop - padBottom);

  const cx = padLeft + innerW / 2;
  const cy = padTop + innerH / 2;
  const outerRadius = Math.max(20, Math.min(innerW, innerH) / 2 - 22);
  const innerRadius = outerRadius * Math.min(0.9, Math.max(0, innerRadiusRatio));
  const shouldInitial = mounted && shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;

  function tooltipContent(row: (typeof rows)[number], percent: number): ReactNode {
    const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <span style={{ display: "grid", gap: 2 }}>
        <strong style={{ color: "inherit", fontWeight: 650 }}>{row.label}</strong>
        <span style={{ opacity: 0.78 }}>
          {valueFormatter(row.value)} · {Math.round(percent * 100)}%
        </span>
      </span>
    );
  }

  function handlePointerMove(event: PointerEvent<SVGPathElement>, row: (typeof rows)[number], percent: number) {
    if (!tooltipEnabled) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    if (hoveredIndex !== row.index) {
      setHoveredIndex(row.index);
      setTooltipState({ x: clientX, y: clientY, content: tooltipContent(row, percent), id: tooltipId });
    }
  }

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
  }

  function handleKeyDown(event: KeyboardEvent<SVGPathElement>, itemIndex: number) {
    const count = renderableSlices.length;
    if (count <= 1) return;
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
      : event.key === "Home" ? -itemIndex
      : event.key === "End" ? count - 1 - itemIndex : 0;

    if (!delta) return;
    event.preventDefault();
    const nextItemIndex = Math.min(count - 1, Math.max(0, itemIndex + delta));
    setActiveSliceIndex(nextItemIndex);
    const nextSliceItem = renderableSlices[nextItemIndex];
    if (nextSliceItem) {
      setHoveredIndex(nextSliceItem.row.index);
    }
    const svg = event.currentTarget.closest("svg");
    const targets = svg?.querySelectorAll<SVGElement>("[role='graphics-symbol']");
    targets?.[nextItemIndex]?.focus();
  }

  const legendItems = useMemo(() => rows.map((row) => ({ label: row.label, color: row.color })), [rows]);

  return (
    <div className={className} style={{ width: "100%", ...style }}>
      <ChartSurface
        width={width}
        height={height}
        ariaLabel={ariaLabel}
        ariaDescription={ariaDescription}
        tooltip={tooltipState}
        tooltipStyle={chartTheme.tooltipStyle}
        tooltipId={tooltipId}
      >
        <defs>
          {sliceVariant === "gradient"
            ? rows.map((row) => (
                <radialGradient key={row.index} id={`${gradientBaseId}-${row.index}`} cx="45%" cy="35%" r="65%">
                  <stop offset="0%" stopColor={row.color} stopOpacity="1" />
                  <stop offset="100%" stopColor={row.color} stopOpacity="0.84" />
                </radialGradient>
              ))
            : null}
        </defs>
        {total <= 0 ? <EmptyState x={cx} y={cy} theme={chartTheme}>{emptyState}</EmptyState> : null}
        {renderableSlices.map(({ slice, row, originalIndex }, itemIndex) => {
          const path = arcPath(cx, cy, innerRadius, outerRadius, slice.startAngle, slice.endAngle);
          const mid = (slice.startAngle + slice.endAngle) / 2;
          const labelPoint = polar(cx, cy, (innerRadius + outerRadius) / 2, mid);
          const aria = joinLabels([row.label, valueFormatter(row.value), `${Math.round(slice.percent * 100)}%`]);
          const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
          const isHovered = hoveredIndex === row.index;
          const isFocused = activeSliceIndex === itemIndex;

          return (
            <g key={`${row.label}-${row.index}`}>
              <motion.path
                d={path}
                fill={sliceVariant === "gradient" ? `url(#${gradientBaseId}-${row.index})` : row.color}
                initial={shouldInitial ? { opacity: 0, scale: 0.86 } : false}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.035, opacity: 0.95 }}
                transition={chartTransition(animation, reducedMotion, originalIndex)}
                role="graphics-symbol"
                aria-roledescription="slice"
                aria-label={aria}
                aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
                tabIndex={itemIndex === activeSliceIndex ? 0 : -1}
                onPointerEnter={(event) => handlePointerMove(event, row, slice.percent)}
                onPointerMove={(event) => handlePointerMove(event, row, slice.percent)}
                onPointerLeave={hideTooltip}
                onFocus={(event) => {
                  setActiveSliceIndex(itemIndex);
                  setHoveredIndex(row.index);
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row, slice.percent), id: tooltipId });
                }}
                onBlur={hideTooltip}
                onKeyDown={(event) => handleKeyDown(event, itemIndex)}
                onClick={() => onDatumClick?.(context)}
                style={{
                  cursor: onDatumClick ? "pointer" : "default",
                  transformOrigin: `${cx}px ${cy}px`,
                  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.08))",
                  outline: "none"
                }}
              >
                <title>{aria}</title>
              </motion.path>
              {showLabels && slice.percent > 0.05 ? (
                <motion.text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontFamily={chartTheme.fontFamily}
                  fontSize={chartTheme.fontSize}
                  fontWeight={700}
                  pointerEvents="none"
                  initial={shouldInitial ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={chartTransition(animation, reducedMotion, originalIndex + 1)}
                >
                  {Math.round(slice.percent * 100)}%
                </motion.text>
              ) : null}
            </g>
          );
        })}
        {centerLabel ? (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={chartTheme.textColor}
            fontFamily={chartTheme.fontFamily}
            fontSize={15}
            fontWeight={700}
          >
            {typeof centerLabel === "function" ? centerLabel(total) : centerLabel}
          </text>
        ) : null}
      </ChartSurface>
      {showLegend ? <InlineLegend items={legendItems} theme={chartTheme} /> : null}
    </div>
  );
}
