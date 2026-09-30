import { useId, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxisBottom, AxisLeft, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";
import { resolveChartTheme } from "../themes";

export type LineSeries<TDatum extends object> = {
  id: string;
  yKey: Accessor<TDatum, number>;
  label?: string;
  color?: string;
  showArea?: boolean;
  strokeWidth?: number;
};

export type MultiLineTooltipContext<TDatum> = TooltipRenderContext<TDatum> & {
  seriesId: string;
  seriesLabel: string;
};

export type MultiLineChartProps<TDatum extends object> = Omit<CommonChartProps<TDatum>, "tooltip"> & {
  xKey: Accessor<TDatum, string | number>;
  series: readonly LineSeries<TDatum>[];
  tooltip?: false | ((context: MultiLineTooltipContext<TDatum>) => ReactNode);
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  showGrid?: boolean;
  showLegend?: boolean;
  showPoints?: boolean;
  showArea?: boolean;
  curve?: "linear" | "smooth";
  onDatumClick?: (context: MultiLineTooltipContext<TDatum>) => void;
};

const defaultMargin = { top: 24, right: 28, bottom: 44, left: 56 };

export function MultiLineChart<TDatum extends object>({
  data,
  series,
  xKey,
  width = 720,
  height = 360,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Multi-line chart",
  ariaDescription,
  valueFormatter = defaultValueFormatter,
  emptyState,
  animation,
  tooltip,
  xAxis,
  yAxis,
  showGrid = true,
  showLegend = true,
  showPoints = true,
  showArea = false,
  curve = "smooth",
  onDatumClick
}: MultiLineChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const bounds = useMemo(() => ({
    ...defaultMargin,
    ...margin,
    width,
    height,
    innerWidth: Math.max(1, width - (margin?.left ?? defaultMargin.left) - (margin?.right ?? defaultMargin.right)),
    innerHeight: Math.max(1, height - (margin?.top ?? defaultMargin.top) - (margin?.bottom ?? defaultMargin.bottom))
  }), [height, margin, width]);

  const labels = useMemo(() => data.map((datum, index) => labelOf(datum, index, xKey)), [data, xKey]);
  const preparedSeries = useMemo(
    () =>
      series.map((item, index) => ({
        ...item,
        label: item.label ?? item.id,
        color: item.color ?? colorAt(chartTheme.colors, index),
        strokeWidth: item.strokeWidth ?? 3
      })),
    [chartTheme.colors, series]
  );
  const allValues = useMemo(
    () => preparedSeries.flatMap((item) => data.map((datum, index) => numberOf(datum, index, item.yKey))),
    [data, preparedSeries]
  );
  const xScale = useMemo(
    () => createCategoryScale(labels, [bounds.left, bounds.left + bounds.innerWidth], 0),
    [bounds.innerWidth, bounds.left, labels]
  );
  // Default line charts to includeZero: false so variations are visible
  const includeZero = yAxis?.includeZero ?? false;
  const yScale = useMemo(
    () => createLinearScale(extent(allValues, includeZero), [bounds.top + bounds.innerHeight, bounds.top], yAxis?.tickCount ?? 5),
    [allValues, bounds.innerHeight, bounds.top, includeZero, yAxis?.tickCount]
  );
  const baseline = yScale.scale(0);
  const shouldInitial = shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;

  const renderedSeries = useMemo(
    () =>
      preparedSeries.map((item) => {
        const rows = data.map((datum, index) => {
          const label = labels[index] ?? String(index + 1);
          const value = numberOf(datum, index, item.yKey);
          return { datum, index, label, value, color: item.color, seriesId: item.id, seriesLabel: item.label };
        });
        const points = rows.map((row) => ({
          x: xScale.center(row.label, row.index),
          y: yScale.scale(row.value)
        }));
        const baselinePoints = points.map((p) => ({ x: p.x, y: baseline }));
        return {
          ...item,
          rows,
          points,
          path: linePath(points, curve),
          initialPath: linePath(baselinePoints, curve),
          fillPath: areaPath(points, baseline, curve),
          initialFillPath: areaPath(baselinePoints, baseline, curve)
        };
      }),
    [baseline, curve, data, labels, preparedSeries, xScale, yScale]
  );

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  function tooltipContent(row: (typeof renderedSeries)[number]["rows"][number]): ReactNode {
    const context = {
      datum: row.datum,
      index: row.index,
      label: row.label,
      value: row.value,
      color: row.color,
      seriesId: row.seriesId,
      seriesLabel: row.seriesLabel
    };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <span style={{ display: "grid", gap: 3 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: chartTheme.mutedTextColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: row.color }} />
          {row.seriesLabel}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: chartTheme.textColor }}>
          {row.label} · <span style={{ color: row.color }}>{valueFormatter(row.value)}</span>
        </span>
      </span>
    );
  }

  function showTooltip(event: PointerEvent<SVGCircleElement>, row: (typeof renderedSeries)[number]["rows"][number]) {
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

  const legendItems = useMemo(() => preparedSeries.map((item) => ({ label: item.label, color: item.color })), [preparedSeries]);
  const hasData = data.length > 0 && preparedSeries.length > 0;
  const hoveredX =
    hoveredIndex !== null && labels[hoveredIndex] !== undefined
      ? xScale.center(labels[hoveredIndex]!, hoveredIndex)
      : null;

  return (
    <div className={className} style={style}>
      <ChartSurface
        width={width}
        height={height}
        ariaLabel={ariaLabel}
        ariaDescription={ariaDescription}
        tooltip={tooltipState}
        tooltipStyle={chartTheme.tooltipStyle}
      >
        <defs>
          {renderedSeries.map((item, index) => (
            <linearGradient key={item.id} id={`${gradientBaseId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.14" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>
        {!hasData ? <EmptyState x={width / 2} y={height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
        {showGrid ? <GridRows scale={yScale} x1={bounds.left} x2={bounds.left + bounds.innerWidth} style={chartTheme} /> : null}

        {/* Vertical crosshair guide on active point */}
        {hoveredX !== null ? (
          <line
            x1={hoveredX}
            x2={hoveredX}
            y1={bounds.top}
            y2={bounds.top + bounds.innerHeight}
            stroke="rgba(148, 163, 184, 0.45)"
            strokeWidth={1}
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        ) : null}

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

        {renderedSeries.map((item, seriesIndex) => (
          <g key={item.id}>
            {(showArea || item.showArea) && item.fillPath ? (
              <motion.path
                d={item.fillPath}
                fill={`url(#${gradientBaseId}-${seriesIndex})`}
                initial={shouldInitial ? { d: item.initialFillPath, opacity: 0 } : false}
                animate={{ opacity: 1, d: item.fillPath }}
                transition={chartTransition(animation, reducedMotion, seriesIndex)}
                pointerEvents="none"
              />
            ) : null}
            {item.path ? (
              <motion.path
                d={item.path}
                fill="none"
                stroke={item.color}
                strokeWidth={item.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={shouldInitial ? { d: item.initialPath, opacity: 0 } : false}
                animate={{ d: item.path, opacity: 1 }}
                transition={chartTransition(animation, reducedMotion, seriesIndex)}
                pointerEvents="none"
              />
            ) : null}
            {item.rows.map((row, index) => {
              const point = item.points[index];
              if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
              const isHovered = hoveredIndex === index;
              const context = {
                datum: row.datum,
                index: row.index,
                label: row.label,
                value: row.value,
                color: row.color,
                seriesId: row.seriesId,
                seriesLabel: row.seriesLabel
              };
              const aria = joinLabels([row.seriesLabel, row.label, valueFormatter(row.value)]);
              const initialY = Number.isFinite(baseline) ? baseline : point.y;
              return (
                <motion.circle
                  key={`${item.id}-${row.label}-${row.index}`}
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : (showPoints ? 4 : 7)}
                  fill={showPoints || isHovered ? item.color : "transparent"}
                  stroke={showPoints || isHovered ? "#ffffff" : "transparent"}
                  strokeWidth={showPoints || isHovered ? 2.5 : 0}
                  initial={shouldInitial ? { cx: point.x, cy: initialY, r: 0, opacity: 0 } : false}
                  animate={{
                    cx: point.x,
                    cy: point.y,
                    r: isHovered ? 6 : (showPoints ? 4 : 7),
                    opacity: 1
                  }}
                  whileHover={{ r: 7.5, strokeWidth: 3 }}
                  transition={chartTransition(animation, reducedMotion, index + seriesIndex)}
                  role="graphics-symbol"
                  aria-roledescription="data point"
                  aria-label={aria}
                  tabIndex={index === 0 && seriesIndex === 0 ? 0 : -1}
                  style={{
                    cursor: onDatumClick ? "pointer" : "default",
                    filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.12))"
                  }}
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
                >
                  <title>{aria}</title>
                </motion.circle>
              );
            })}
          </g>
        ))}
      </ChartSurface>
      {showLegend ? <InlineLegend items={legendItems} color={chartTheme.mutedTextColor} /> : null}
    </div>
  );
}
