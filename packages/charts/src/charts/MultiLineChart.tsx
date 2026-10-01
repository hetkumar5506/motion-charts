import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxisBottom, AxisLeft, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf, rawNumberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";
import { resolveChartTheme } from "../themes";
import { finiteNonNegative, resolveChartBounds } from "../utils/layout";

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
  /** When true (default), bridges missing/null/NaN data points. When false, renders gaps in the lines/areas. */
  connectNulls?: boolean;
  onDatumClick?: (context: MultiLineTooltipContext<TDatum>) => void;
};

const defaultMargin = { top: 24, right: 28, bottom: 44, left: 56 };

export function MultiLineChart<TDatum extends object>({
  data = [],
  series = [],
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
  dateFormatter,
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
  connectNulls = true,
  onDatumClick
}: MultiLineChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [activeGlobalIndex, setActiveGlobalIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const bounds = useMemo(
    () => resolveChartBounds(width, height, defaultMargin, margin),
    [height, margin, width]
  );

  const safeData = data ?? [];
  const safeSeries = series ?? [];

  const labels = useMemo(() => safeData.map((datum, index) => labelOf(datum, index, xKey, dateFormatter)), [dateFormatter, safeData, xKey]);
  const preparedSeries = useMemo(() => {
    const usedIds = new Set<string>();
    return safeSeries.map((item, index) => {
      const baseId = (typeof item.id === "string" ? item.id.trim() : "") || `series-${index + 1}`;
      let id = baseId;
      let duplicateNumber = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${duplicateNumber}`;
        duplicateNumber += 1;
      }
      usedIds.add(id);

      return {
        ...item,
        id,
        label: item.label ?? item.id,
        color: item.color ?? colorAt(chartTheme.colors, index),
        strokeWidth: finiteNonNegative(item.strokeWidth, 3)
      };
    });
  }, [chartTheme.colors, safeSeries]);
  // Exclude null/non-finite values from extent calculation
  const allValidValues = useMemo(
    () =>
      preparedSeries.flatMap((item) =>
        safeData
          .map((datum, index) => rawNumberOf(datum, index, item.yKey))
          .filter((v): v is number => v !== null)
      ),
    [preparedSeries, safeData]
  );
  const xScale = useMemo(
    () => createCategoryScale(labels, [bounds.left, bounds.left + bounds.innerWidth], 0),
    [bounds.innerWidth, bounds.left, labels]
  );
  // Default line charts to includeZero: false so variations are visible
  const includeZero = yAxis?.includeZero ?? false;
  const yScale = useMemo(
    () => createLinearScale(extent(allValidValues, includeZero), [bounds.top + bounds.innerHeight, bounds.top], yAxis?.tickCount ?? 5),
    [allValidValues, bounds.innerHeight, bounds.top, includeZero, yAxis?.tickCount]
  );
  // When includeZero is false (or dataset is strictly positive above 0),
  // baseline should anchor to the inner bottom of the chart area so the area fill stays within chart bounds
  const baseline = yScale.domain[0] > 0 || !includeZero
    ? bounds.top + bounds.innerHeight
    : yScale.scale(0);
  const shouldInitial = mounted && shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;

  const renderedSeries = useMemo(
    () =>
      preparedSeries.map((item) => {
        const rows = safeData.map((datum, index) => {
          const label = labels[index] ?? String(index + 1);
          const rawVal = rawNumberOf(datum, index, item.yKey);
          const value = rawVal ?? 0;
          const isNull = rawVal === null;
          return { datum, index, label, value, rawVal, isNull, color: item.color, seriesId: item.id, seriesLabel: item.label };
        });
        const points: (Point | null)[] = rows.map((row) => {
          if (row.isNull) return null;
          return {
            x: xScale.center(row.label, row.index),
            y: yScale.scale(row.value)
          };
        });
        const baselinePoints: (Point | null)[] = points.map((p) => (p ? { x: p.x, y: baseline } : null));
        return {
          ...item,
          rows,
          points,
          path: linePath(points, curve, connectNulls),
          initialPath: linePath(baselinePoints, curve, connectNulls),
          fillPath: areaPath(points, baseline, curve, connectNulls),
          initialFillPath: areaPath(baselinePoints, baseline, curve, connectNulls)
        };
      }),
    [baseline, connectNulls, curve, labels, preparedSeries, safeData, xScale, yScale]
  );

  // Flatten only renderable points across all series for 1:1 keyboard navigation
  const renderablePoints = useMemo(
    () =>
      renderedSeries.flatMap((item, seriesIdx) =>
        item.rows
          .map((row, index) => {
            const point = item.points[index];
            if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
            return { item, row, point, seriesIdx, index };
          })
          .filter((p): p is { item: (typeof renderedSeries)[number]; row: (typeof renderedSeries)[number]["rows"][number]; point: Point; seriesIdx: number; index: number } => p !== null)
      ),
    [renderedSeries]
  );

  useEffect(() => {
    setActiveGlobalIndex((current) => renderablePoints.length === 0 ? 0 : Math.min(current, renderablePoints.length - 1));
  }, [renderablePoints.length]);

  const [hoveredPoint, setHoveredPoint] = useState<{ seriesId: string; index: number } | null>(null);

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

  function handlePointerMove(event: PointerEvent<SVGCircleElement>, row: (typeof renderedSeries)[number]["rows"][number]) {
    if (!tooltipEnabled) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    if (!hoveredPoint || hoveredPoint.seriesId !== row.seriesId || hoveredPoint.index !== row.index) {
      setHoveredPoint({ seriesId: row.seriesId, index: row.index });
      setTooltipState({ x: clientX, y: clientY, content: tooltipContent(row), id: tooltipId });
    }
  }

  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  function hideTooltip() {
    setHoveredPoint(null);
    setTooltipState(null);
    setIsKeyboardFocused(false);
  }

  const totalPoints = renderablePoints.length;

  function handleKeyDown(event: KeyboardEvent<SVGCircleElement>, pointIndex: number) {
    if (totalPoints <= 1) return;
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
      : event.key === "Home" ? -pointIndex
      : event.key === "End" ? totalPoints - 1 - pointIndex : 0;

    if (!delta) return;
    event.preventDefault();
    const nextIndex = Math.min(totalPoints - 1, Math.max(0, pointIndex + delta));
    setActiveGlobalIndex(nextIndex);
    setIsKeyboardFocused(true);
    const targetPoint = renderablePoints[nextIndex];
    if (targetPoint) {
      setHoveredPoint({ seriesId: targetPoint.item.id, index: targetPoint.row.index });
    }
    const svg = event.currentTarget.closest("svg");
    const targets = svg?.querySelectorAll<SVGElement>("[role='graphics-symbol']");
    targets?.[nextIndex]?.focus();
  }

  const legendItems = useMemo(() => preparedSeries.map((item) => ({ label: item.label, color: item.color })), [preparedSeries]);
  const hasData = safeData.length > 0 && preparedSeries.length > 0;
  const hoveredX =
    hoveredPoint !== null && labels[hoveredPoint.index] !== undefined
      ? xScale.center(labels[hoveredPoint.index]!, hoveredPoint.index)
      : null;

  return (
    <div className={className} style={{ width: "100%", minWidth: 0, ...style }}>
      <ChartSurface
        width={bounds.width}
        height={bounds.height}
        ariaLabel={ariaLabel}
        ariaDescription={ariaDescription}
        tooltip={tooltipState}
        tooltipStyle={chartTheme.tooltipStyle}
        tooltipId={tooltipId}
      >
        <defs>
          {renderedSeries.map((item, index) => (
            <linearGradient key={item.id} id={`${gradientBaseId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity="0.14" />
              <stop offset="100%" stopColor={item.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>
        {!hasData ? <EmptyState x={bounds.width / 2} y={bounds.height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
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
          </g>
        ))}

        {renderablePoints.map(({ item, row, point, seriesIdx }, ptIndex) => {
          const isHovered = hoveredPoint !== null && hoveredPoint.seriesId === row.seriesId && hoveredPoint.index === row.index;
          const isFocused = isKeyboardFocused && activeGlobalIndex === ptIndex;
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
            <g key={`${item.id}-${row.label}-${row.index}`}>
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
                transition={chartTransition(animation, reducedMotion, row.index + seriesIdx)}
                role="graphics-symbol"
                aria-roledescription="data point"
                aria-label={aria}
                aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
                tabIndex={ptIndex === activeGlobalIndex ? 0 : -1}
                style={{
                  cursor: onDatumClick ? "pointer" : "default",
                  filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.12))",
                  outline: "none"
                }}
                onPointerEnter={(event) => handlePointerMove(event, row)}
                onPointerMove={(event) => handlePointerMove(event, row)}
                onPointerLeave={hideTooltip}
                onFocus={(event) => {
                  setActiveGlobalIndex(ptIndex);
                  setIsKeyboardFocused(true);
                  setHoveredPoint({ seriesId: row.seriesId, index: row.index });
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row), id: tooltipId });
                }}
                onBlur={hideTooltip}
                onKeyDown={(event) => handleKeyDown(event, ptIndex)}
                onClick={() => onDatumClick?.(context)}
              >
                <title>{aria}</title>
              </motion.circle>
            </g>
          );
        })}
      </ChartSurface>
      {showLegend ? <InlineLegend items={legendItems} theme={chartTheme} /> : null}
    </div>
  );
}
