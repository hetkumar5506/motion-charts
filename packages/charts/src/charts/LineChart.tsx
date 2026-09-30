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
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";

export type LineChartProps<TDatum extends object> = CommonChartProps<TDatum> & {
  xKey: Accessor<TDatum, string | number>;
  yKey: Accessor<TDatum, number>;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  showGrid?: boolean;
  showArea?: boolean;
  showPoints?: boolean;
  curve?: "linear" | "smooth";
  strokeWidth?: number;
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

const defaultMargin = { top: 24, right: 28, bottom: 44, left: 56 };

export function LineChart<TDatum extends object>({
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
  ariaLabel = "Line chart",
  ariaDescription,
  valueFormatter = defaultValueFormatter,
  emptyState,
  animation,
  tooltip,
  xAxis,
  yAxis,
  showGrid = true,
  showArea = false,
  showPoints = true,
  curve = "smooth",
  strokeWidth = 3,
  onDatumClick
}: LineChartProps<TDatum>) {
  const gradientId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const bounds = {
    ...defaultMargin,
    ...margin,
    width,
    height,
    innerWidth: Math.max(1, width - (margin?.left ?? defaultMargin.left) - (margin?.right ?? defaultMargin.right)),
    innerHeight: Math.max(1, height - (margin?.top ?? defaultMargin.top) - (margin?.bottom ?? defaultMargin.bottom))
  };
  const color = colorAt(chartTheme.colors, 0);

  const rows = useMemo(
    () =>
      data.map((datum, index) => {
        const label = labelOf(datum, index, xKey);
        const value = numberOf(datum, index, yKey);
        return { datum, index, label, value, color };
      }),
    [color, data, xKey, yKey]
  );

  const labels = rows.map((row) => row.label);
  const xScale = createCategoryScale(labels, [bounds.left, bounds.left + bounds.innerWidth], 0);
  const yScale = createLinearScale(extent(rows.map((row) => row.value), true), [bounds.top + bounds.innerHeight, bounds.top], yAxis?.tickCount ?? 5);
  const points: Point[] = rows.map((row) => ({
    x: xScale.center(row.label, row.index),
    y: yScale.scale(row.value)
  }));
  const baseline = yScale.scale(0);
  const baselinePoints: Point[] = points.map((p) => ({ x: p.x, y: baseline }));
  const path = linePath(points, curve);
  const initialPath = linePath(baselinePoints, curve);
  const fillPath = areaPath(points, baseline, curve);
  const initialFillPath = areaPath(baselinePoints, baseline, curve);
  const shouldInitial = shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  function tooltipContent(row: (typeof rows)[number]): ReactNode {
    const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <span style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {row.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>
          {valueFormatter(row.value)}
        </span>
      </span>
    );
  }

  function showTooltip(event: PointerEvent<SVGCircleElement>, row: (typeof rows)[number]) {
    if (!tooltipEnabled) return;
    setHoveredIndex(row.index);
    setTooltipState({ x: event.clientX, y: event.clientY, content: tooltipContent(row) });
  }

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
  }

  const hoveredX =
    hoveredIndex !== null && labels[hoveredIndex] !== undefined
      ? xScale.center(labels[hoveredIndex]!, hoveredIndex)
      : null;

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
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {rows.length === 0 ? <EmptyState x={width / 2} y={height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
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

      {showArea && fillPath ? (
        <motion.path
          d={fillPath}
          fill={`url(#${gradientId})`}
          initial={shouldInitial ? { d: initialFillPath, opacity: 0 } : false}
          animate={{ opacity: 1, d: fillPath }}
          transition={chartTransition(animation, reducedMotion)}
          pointerEvents="none"
        />
      ) : null}
      {path ? (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldInitial ? { d: initialPath, opacity: 0 } : false}
          animate={{ d: path, opacity: 1 }}
          transition={chartTransition(animation, reducedMotion)}
          pointerEvents="none"
        />
      ) : null}
      {rows.map((row, index) => {
        const point = points[index];
        if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
        const isHovered = hoveredIndex === index;
        const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
        const aria = joinLabels([row.label, valueFormatter(row.value)]);
        const initialY = Number.isFinite(baseline) ? baseline : point.y;
        return (
          <motion.circle
            key={`${row.label}-${row.index}`}
            cx={point.x}
            cy={point.y}
            r={isHovered ? 6.5 : (showPoints ? 4.5 : 7.5)}
            fill={showPoints || isHovered ? color : "transparent"}
            stroke={showPoints || isHovered ? "#ffffff" : "transparent"}
            strokeWidth={showPoints || isHovered ? 2.5 : 0}
            initial={shouldInitial ? { cx: point.x, cy: initialY, r: 0, opacity: 0 } : false}
            animate={{ cx: point.x, cy: point.y, r: isHovered ? 6.5 : (showPoints ? 4.5 : 7.5), opacity: 1 }}
            whileHover={{ r: 7.5, strokeWidth: 3 }}
            transition={chartTransition(animation, reducedMotion, index)}
            role="img"
            aria-label={aria}
            tabIndex={0}
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
    </ChartSurface>
  );
}
