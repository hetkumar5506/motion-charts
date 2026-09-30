import { useId, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxisBottom, AxisLeft, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { resolveChartTheme } from "../themes";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";

export type BarChartProps<TDatum extends object> = CommonChartProps<TDatum> & {
  xKey: Accessor<TDatum, string | number>;
  yKey: Accessor<TDatum, number>;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  showGrid?: boolean;
  showValues?: boolean;
  barRadius?: number;
  barPadding?: number;
  barVariant?: "solid" | "gradient";
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

const defaultMargin = { top: 24, right: 20, bottom: 44, left: 56 };

export function BarChart<TDatum extends object>({
  data,
  xKey,
  yKey,
  width = 720,
  height = 360,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Bar chart",
  ariaDescription,
  valueFormatter = defaultValueFormatter,
  emptyState,
  animation,
  tooltip,
  xAxis,
  yAxis,
  showGrid = true,
  showValues = false,
  barRadius = 8,
  barPadding = 0.22,
  barVariant = "gradient",
  onDatumClick
}: BarChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const bounds = useMemo(() => ({
    ...defaultMargin,
    ...margin,
    width,
    height,
    innerWidth: Math.max(1, width - (margin?.left ?? defaultMargin.left) - (margin?.right ?? defaultMargin.right)),
    innerHeight: Math.max(1, height - (margin?.top ?? defaultMargin.top) - (margin?.bottom ?? defaultMargin.bottom))
  }), [height, margin, width]);

  const rows = useMemo(
    () =>
      data.map((datum, index) => {
        const label = labelOf(datum, index, xKey);
        const value = numberOf(datum, index, yKey);
        const color = colorAt(chartTheme.colors, index);
        return { datum, index, label, value, color };
      }),
    [chartTheme.colors, data, xKey, yKey]
  );

  const labels = useMemo(() => rows.map((row) => row.label), [rows]);
  const xScale = useMemo(
    () => createCategoryScale(labels, [bounds.left, bounds.left + bounds.innerWidth], barPadding),
    [bounds.innerWidth, bounds.left, labels, barPadding]
  );
  const includeZero = yAxis?.includeZero ?? true;
  const yScale = useMemo(
    () => createLinearScale(extent(rows.map((row) => row.value), includeZero), [bounds.top + bounds.innerHeight, bounds.top], yAxis?.tickCount ?? 5),
    [bounds.innerHeight, bounds.top, includeZero, rows, yAxis?.tickCount]
  );
  const baseline = yScale.scale(0);
  const shouldInitial = shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;

  function tooltipContent(row: (typeof rows)[number]): ReactNode {
    const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: row.color, display: "inline-block" }} />
          <span style={{ color: chartTheme.mutedTextColor, fontSize: 11, fontWeight: 500 }}>{row.label}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: chartTheme.textColor, paddingLeft: 14 }}>
          {valueFormatter(row.value)}
        </div>
      </div>
    );
  }

  function showTooltip(event: PointerEvent<SVGRectElement>, row: (typeof rows)[number]) {
    if (!tooltipEnabled) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    setHoveredIndex(row.index);
    setTooltipState((prev) => {
      if (prev && Math.abs(prev.x - clientX) < 3 && Math.abs(prev.y - clientY) < 3 && hoveredIndex === row.index) {
        return prev;
      }
      return { x: clientX, y: clientY, content: tooltipContent(row) };
    });
  }

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
  }

  return (
    <ChartSurface
      width={width}
      height={height}
      className={className}
      style={style}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      tooltip={tooltipState}
      tooltipStyle={chartTheme.tooltipStyle}
    >
      <defs>
        {barVariant === "gradient"
          ? rows.map((row) => (
              <linearGradient key={row.index} id={`${gradientBaseId}-${row.index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={row.color} stopOpacity="1" />
                <stop offset="100%" stopColor={row.color} stopOpacity="0.82" />
              </linearGradient>
            ))
          : null}
      </defs>
      {rows.length === 0 ? <EmptyState x={width / 2} y={height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
      {showGrid ? <GridRows scale={yScale} x1={bounds.left} x2={bounds.left + bounds.innerWidth} style={chartTheme} /> : null}
      {yAxis?.show === false ? null : (
        <AxisLeft
          scale={yScale}
          x={bounds.left}
          textX={bounds.left - 10}
          formatter={(value) => yAxis?.formatter?.(value) ?? valueFormatter(value)}
          style={chartTheme}
        />
      )}
      {xAxis?.show === false ? null : (
        <AxisBottom scale={xScale} y={bounds.top + bounds.innerHeight} formatter={(value) => xAxis?.formatter?.(value) ?? value} style={chartTheme} />
      )}

      <g>
        {rows.map((row, index) => {
          const x = xScale.position(row.label, row.index);
          const scaled = yScale.scale(row.value);
          const y = Math.min(scaled, baseline);
          const barHeight = Math.abs(baseline - scaled);
          const aria = joinLabels([row.label, valueFormatter(row.value)]);
          const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
          const isHovered = hoveredIndex === index;

          return (
            <g key={`${row.label}-${row.index}`}>
              <motion.rect
                x={x}
                y={y}
                width={xScale.bandwidth}
                height={barHeight}
                rx={Math.min(barRadius, xScale.bandwidth / 2, Math.max(0, barHeight) / 2)}
                fill={barVariant === "gradient" ? `url(#${gradientBaseId}-${row.index})` : row.color}
                initial={shouldInitial ? { y: baseline, height: 0, opacity: 0 } : false}
                animate={{ y, height: barHeight, opacity: isHovered ? 0.92 : 1 }}
                transition={chartTransition(animation, reducedMotion, row.index)}
                role="graphics-symbol"
                aria-roledescription="bar"
                aria-label={aria}
                tabIndex={index === 0 ? 0 : -1}
                onPointerEnter={(event) => showTooltip(event, row)}
                onPointerMove={(event) => showTooltip(event, row)}
                onPointerLeave={hideTooltip}
                onFocus={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setHoveredIndex(row.index);
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row) });
                }}
                onBlur={hideTooltip}
                onClick={() => onDatumClick?.(context)}
                style={{
                  cursor: onDatumClick ? "pointer" : "default"
                }}
              >
                <title>{aria}</title>
              </motion.rect>
              {showValues && barHeight > 14 ? (() => {
                const isPositive = row.value >= 0;
                // If bar is tall enough, place inside bar near the top for clean, unclipped look
                // If bar is short, place above the bar, strictly clamped above baseline
                const fitInside = barHeight >= 28;
                const textY = fitInside
                  ? (isPositive ? y + 15 : y + barHeight - 8)
                  : (isPositive ? Math.max(bounds.top + 10, y - 8) : y + barHeight + 14);
                const textColor = fitInside ? "#ffffff" : chartTheme.textColor;

                return (
                  <motion.text
                    x={x + xScale.bandwidth / 2}
                    y={textY}
                    textAnchor="middle"
                    fill={textColor}
                    fontFamily={chartTheme.fontFamily}
                    fontSize={11}
                    fontWeight={600}
                    initial={shouldInitial ? { opacity: 0, y: baseline } : false}
                    animate={{ opacity: 1, y: textY }}
                    transition={chartTransition(animation, reducedMotion, row.index + 1)}
                    style={{
                      filter: fitInside ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "none",
                      userSelect: "none",
                      pointerEvents: "none"
                    }}
                  >
                    {valueFormatter(row.value)}
                  </motion.text>
                );
              })() : null}
            </g>
          );
        })}
      </g>
    </ChartSurface>
  );
}
