import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxisBottom, AxisLeft, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf, rawNumberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { resolveChartTheme } from "../themes";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, useChartEntrance } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";
import { finiteNonNegative, resolveChartBounds } from "../utils/layout";

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
  colorIndex?: number;
  /** When true (default), bridges missing/null/NaN data points. When false, renders gaps in the line/area. */
  connectNulls?: boolean;
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

const defaultMargin = { top: 24, right: 28, bottom: 44, left: 56 };

export function LineChart<TDatum extends object>({
  data = [],
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
  dateFormatter,
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
  colorIndex = 0,
  connectNulls = true,
  onDatumClick
}: LineChartProps<TDatum>) {
  const gradientId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const { isEntering, onAnimationComplete } = useChartEntrance(animation, reducedMotion);
  const bounds = useMemo(
    () => resolveChartBounds(width, height, defaultMargin, margin),
    [height, margin, width]
  );
  const safeStrokeWidth = finiteNonNegative(strokeWidth, 3);
  const color = colorAt(chartTheme.colors, colorIndex);

  const safeData = data ?? [];

  const rows = useMemo(
    () =>
      safeData.map((datum, index) => {
        const label = labelOf(datum, index, xKey, dateFormatter);
        const rawVal = rawNumberOf(datum, index, yKey);
        const value = rawVal ?? 0;
        const isNull = rawVal === null;
        return { datum, index, label, value, rawVal, isNull, color };
      }),
    [color, dateFormatter, safeData, xKey, yKey]
  );

  const labels = useMemo(() => rows.map((row) => row.label), [rows]);
  const xScale = useMemo(
    () => createCategoryScale(labels, [bounds.left, bounds.left + bounds.innerWidth], 0),
    [bounds.innerWidth, bounds.left, labels]
  );

  // Exclude null/missing values from extent calculation so missing points do not pollute y-scale
  const validValues = useMemo(() => rows.filter((r) => !r.isNull).map((r) => r.value), [rows]);
  const includeZero = yAxis?.includeZero ?? false;
  const yScale = useMemo(
    () => createLinearScale(extent(validValues, includeZero), [bounds.top + bounds.innerHeight, bounds.top], yAxis?.tickCount ?? 5),
    [bounds.innerHeight, bounds.top, includeZero, validValues, yAxis?.tickCount]
  );

  const points: (Point | null)[] = useMemo(
    () =>
      rows.map((row) => {
        if (row.isNull) return null;
        return {
          x: xScale.center(row.label, row.index),
          y: yScale.scale(row.value)
        };
      }),
    [rows, xScale, yScale]
  );

  // Renderable items are only rows with valid non-null values
  const renderableItems = useMemo(
    () =>
      rows
        .map((row) => ({ row, point: points[row.index] }))
        .filter((item): item is { row: (typeof rows)[number]; point: Point } => !!item.point && Number.isFinite(item.point.x) && Number.isFinite(item.point.y)),
    [points, rows]
  );

  // Keep roving tabindex valid when a live data update changes the number of
  // finite points (for example, when the latest API response contains gaps).
  useEffect(() => {
    setActiveItemIndex((current) => renderableItems.length === 0 ? 0 : Math.min(current, renderableItems.length - 1));
  }, [renderableItems.length]);

  // When includeZero is false (or dataset is strictly positive above 0),
  // baseline should anchor to the inner bottom of the chart area so the area fill stays within chart bounds
  const baseline = yScale.domain[0] > 0 || !includeZero
    ? bounds.top + bounds.innerHeight
    : yScale.scale(0);
  const baselinePoints: (Point | null)[] = useMemo(
    () => points.map((p) => (p ? { x: p.x, y: baseline } : null)),
    [baseline, points]
  );
  const path = useMemo(() => linePath(points, curve, connectNulls), [connectNulls, curve, points]);
  const initialPath = useMemo(() => linePath(baselinePoints, curve, connectNulls), [baselinePoints, connectNulls, curve]);
  const fillPath = useMemo(() => areaPath(points, baseline, curve, connectNulls), [baseline, connectNulls, curve, points]);
  const initialFillPath = useMemo(() => areaPath(baselinePoints, baseline, curve, connectNulls), [baseline, baselinePoints, connectNulls, curve]);
  const tooltipEnabled = tooltip !== false;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  function tooltipContent(row: (typeof rows)[number]): ReactNode {
    const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <span style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: chartTheme.mutedTextColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {row.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: chartTheme.textColor }}>
          {valueFormatter(row.value)}
        </span>
      </span>
    );
  }

  function handlePointerMove(event: PointerEvent<SVGCircleElement>, row: (typeof rows)[number]) {
    if (!tooltipEnabled) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    if (hoveredIndex !== row.index) {
      setHoveredIndex(row.index);
      setTooltipState({ x: clientX, y: clientY, content: tooltipContent(row), id: tooltipId });
    }
  }

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
    setIsKeyboardFocused(false);
  }

  // Roving keyboard navigation over renderable items only
  function handleKeyDown(event: KeyboardEvent<SVGCircleElement>, itemIndex: number) {
    const count = renderableItems.length;
    if (count <= 1) return;
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
      : event.key === "Home" ? -itemIndex
      : event.key === "End" ? count - 1 - itemIndex : 0;

    if (!delta) return;
    event.preventDefault();
    const nextItemIndex = Math.min(count - 1, Math.max(0, itemIndex + delta));
    setActiveItemIndex(nextItemIndex);
    setIsKeyboardFocused(true);
    const nextItem = renderableItems[nextItemIndex];
    if (nextItem) {
      setHoveredIndex(nextItem.row.index);
    }
    const svg = event.currentTarget.closest("svg");
    const targets = svg?.querySelectorAll<SVGElement>("[role='graphics-symbol']");
    targets?.[nextItemIndex]?.focus();
  }

  const hoveredX =
    hoveredIndex !== null && labels[hoveredIndex] !== undefined
      ? xScale.center(labels[hoveredIndex]!, hoveredIndex)
      : null;

  return (
    <ChartSurface
      width={bounds.width}
      height={bounds.height}
      className={className}
      style={style}
      ariaLabel={ariaLabel}
      ariaDescription={ariaDescription}
      tooltip={tooltipState}
      tooltipStyle={chartTheme.tooltipStyle}
      tooltipId={tooltipId}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {rows.length === 0 ? <EmptyState x={bounds.width / 2} y={bounds.height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
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
        <AxisBottom
          scale={xScale}
          y={bounds.top + bounds.innerHeight}
          formatter={(value) => xAxis?.formatter?.(value) ?? value}
          style={chartTheme}
          tickCount={xAxis?.tickCount}
        />
      )}

      {showArea && fillPath ? (
        <motion.path
          d={fillPath}
          fill={`url(#${gradientId})`}
          initial={false}
          animate={isEntering ? { opacity: [0, 1], d: [initialFillPath, fillPath] } : { opacity: 1, d: fillPath }}
          transition={chartTransition(animation, reducedMotion)}
          pointerEvents="none"
        />
      ) : null}
      {path ? (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={safeStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={isEntering ? { d: [initialPath, path], opacity: [0, 1] } : { d: path, opacity: 1 }}
          transition={chartTransition(animation, reducedMotion)}
          onAnimationComplete={isEntering && renderableItems.length === 0 ? onAnimationComplete : undefined}
          pointerEvents="none"
        />
      ) : null}
      {renderableItems.map(({ row, point }, itemIndex) => {
        const isHovered = hoveredIndex === row.index;
        const isFocused = isKeyboardFocused && activeItemIndex === itemIndex;
        const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
        const aria = joinLabels([row.label, valueFormatter(row.value)]);
        return (
          <g key={`${row.label}-${row.index}`}>
            {isFocused ? (
              <circle
                cx={point.x}
                cy={point.y}
                r={10.5}
                fill="none"
                stroke={chartTheme.textColor}
                strokeWidth={2}
                pointerEvents="none"
                opacity={0.85}
              />
            ) : null}
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={isHovered ? 6.5 : (showPoints ? 4.5 : 7.5)}
              fill={showPoints || isHovered ? color : "transparent"}
              stroke={showPoints || isHovered ? "#ffffff" : "transparent"}
              strokeWidth={showPoints || isHovered ? 2.5 : 0}
              initial={false}
              animate={isEntering
                ? { r: [0, isHovered ? 6.5 : (showPoints ? 4.5 : 7.5)], opacity: [0, 1] }
                : { r: isHovered ? 6.5 : (showPoints ? 4.5 : 7.5), opacity: 1 }}
              whileHover={{ r: 7.5, strokeWidth: 3 }}
              transition={chartTransition(animation, reducedMotion, row.index)}
              onAnimationComplete={isEntering && itemIndex === renderableItems.length - 1 ? onAnimationComplete : undefined}
              role="graphics-symbol"
              aria-roledescription="data point"
              aria-label={aria}
              aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
              tabIndex={itemIndex === activeItemIndex ? 0 : -1}
              style={{
                cursor: onDatumClick ? "pointer" : "default",
                filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.12))",
                outline: "none"
              }}
              onPointerEnter={(event) => handlePointerMove(event, row)}
              onPointerMove={(event) => handlePointerMove(event, row)}
              onPointerLeave={hideTooltip}
              onFocus={(event) => {
                setActiveItemIndex(itemIndex);
                setIsKeyboardFocused(true);
                setHoveredIndex(row.index);
                const rect = event.currentTarget.getBoundingClientRect();
                setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row), id: tooltipId });
              }}
              onBlur={hideTooltip}
              onKeyDown={(event) => handleKeyDown(event, itemIndex)}
              onClick={() => onDatumClick?.(context)}
            >
              <title>{aria}</title>
            </motion.circle>
          </g>
        );
      })}
    </ChartSurface>
  );
}
