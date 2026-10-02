import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { AxisBottom, AxisLeft, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf, rawNumberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, useChartEntrance } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent } from "../utils/scales";
import { useChartTheme } from "../themes";
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
  /** Show a spring-smoothed vertical guide snapped to the nearest hovered point. */
  crosshair?: boolean;
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
  referenceLines = [],
  tooltip,
  xAxis,
  yAxis,
  showGrid = true,
  showLegend = true,
  showPoints = true,
  showArea = false,
  curve = "smooth",
  connectNulls = true,
  crosshair = false,
  onDatumClick
}: MultiLineChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useChartTheme(theme, colors);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [activeGlobalIndex, setActiveGlobalIndex] = useState(0);
  const { isEntering, onAnimationComplete } = useChartEntrance(animation, reducedMotion);
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
    () => [
      ...preparedSeries.flatMap((item) =>
        safeData
          .map((datum, index) => rawNumberOf(datum, index, item.yKey))
          .filter((v): v is number => v !== null)
      ),
      ...referenceLines.flatMap((line) => typeof line.y === "number" && Number.isFinite(line.y) ? [line.y] : [])
    ],
    [preparedSeries, referenceLines, safeData]
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
  const tooltipEnabled = tooltip !== false;
  const drawEntrance = animation?.entrance === "draw";

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
    if (!tooltipEnabled && !crosshair) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    if (!hoveredPoint || hoveredPoint.seriesId !== row.seriesId || hoveredPoint.index !== row.index) {
      setHoveredPoint({ seriesId: row.seriesId, index: row.index });
      if (tooltipEnabled) setTooltipState({ x: clientX, y: clientY, content: tooltipContent(row), id: tooltipId });
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
    const current = renderablePoints[pointIndex];
    if ((event.key === "Enter" || event.key === " ") && onDatumClick && current) {
      event.preventDefault();
      onDatumClick({
        datum: current.row.datum,
        index: current.row.index,
        label: current.row.label,
        value: current.row.value,
        color: current.row.color,
        seriesId: current.row.seriesId,
        seriesLabel: current.row.seriesLabel
      });
      return;
    }

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
  const crosshairX = useSpring(hoveredX ?? 0, { stiffness: 520, damping: 34, duration: reducedMotion ? 0 : undefined });
  useEffect(() => {
    crosshairX.set(hoveredX ?? 0);
  }, [crosshairX, hoveredX]);

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
        {crosshair && hoveredX !== null ? (
          <motion.line
            x1={crosshairX}
            x2={crosshairX}
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

        {referenceLines.map((line, referenceIndex) => {
          const color = line.color ?? chartTheme.textColor;
          const yPosition = typeof line.y === "number" && Number.isFinite(line.y) ? yScale.scale(line.y) : null;
          const xLabel = line.x === undefined ? null : String(line.x);
          const xIndex = xLabel === null ? -1 : labels.indexOf(xLabel);
          const xPosition = xIndex >= 0 ? xScale.center(xLabel!, xIndex) : null;
          if (yPosition === null && xPosition === null) return null;
          const vertical = xPosition !== null && yPosition === null;
          return (
            <g key={`reference-${referenceIndex}`} aria-label={line.label}>
              <motion.line
                x1={vertical ? xPosition : bounds.left}
                x2={vertical ? xPosition : bounds.left + bounds.innerWidth}
                y1={vertical ? bounds.top : (yPosition ?? bounds.top)}
                y2={vertical ? bounds.top + bounds.innerHeight : (yPosition ?? bounds.top)}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={line.dash ?? "5 4"}
                initial={false}
                animate={isEntering ? { opacity: [0, 1], pathLength: [0, 1] } : { opacity: 1, pathLength: 1 }}
                transition={chartTransition(animation, reducedMotion, renderedSeries.length + referenceIndex)}
                pointerEvents="none"
              />
              {line.label ? <text x={vertical ? xPosition! + 4 : bounds.left + 4} y={vertical ? bounds.top + 14 : yPosition! - 6} fill={color} fontFamily={chartTheme.fontFamily} fontSize={11} fontWeight={600}>{line.label}</text> : null}
            </g>
          );
        })}

        {renderedSeries.map((item, seriesIndex) => (
          <g key={item.id}>
            {(showArea || item.showArea) && item.fillPath ? (
              <motion.path
                d={item.fillPath}
                fill={`url(#${gradientBaseId}-${seriesIndex})`}
                initial={false}
                animate={isEntering
                  ? { opacity: [0, 1], d: [item.initialFillPath, item.fillPath] }
                  : { opacity: 1, d: item.fillPath }}
                transition={chartTransition(animation, reducedMotion, seriesIndex + (drawEntrance ? seriesIndex : 0))}
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
                initial={false}
                animate={isEntering
                  ? { d: [item.initialPath, item.path], opacity: [0, 1], pathLength: drawEntrance ? [0, 1] : 1 }
                  : { d: item.path, opacity: 1 }}
                transition={chartTransition(animation, reducedMotion, seriesIndex + (drawEntrance ? seriesIndex : 0))}
                onAnimationComplete={isEntering && renderablePoints.length === 0 && seriesIndex === renderedSeries.length - 1 ? onAnimationComplete : undefined}
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
                initial={false}
                animate={isEntering
                  ? { r: [0, isHovered ? 6 : (showPoints ? 4 : 7)], opacity: [0, 1] }
                  : { r: isHovered ? 6 : (showPoints ? 4 : 7), opacity: 1 }}
                whileHover={{ r: 7.5, strokeWidth: 3 }}
                transition={chartTransition(animation, reducedMotion, row.index + seriesIdx + (drawEntrance ? renderedSeries.length : 0))}
                onAnimationComplete={isEntering && ptIndex === renderablePoints.length - 1 ? onAnimationComplete : undefined}
                role="graphics-symbol"
                aria-roledescription="data point"
                aria-label={aria}
                aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
                tabIndex={ptIndex === activeGlobalIndex ? 0 : -1}
                style={{
                  cursor: onDatumClick ? "pointer" : "default",
                  touchAction: crosshair ? "none" : "auto",
                  filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.12))",
                  outline: "none"
                }}
                onPointerEnter={(event) => handlePointerMove(event, row)}
                onPointerMove={(event) => handlePointerMove(event, row)}
                onPointerDown={(event) => {
                  if (event.pointerType === "touch") {
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    handlePointerMove(event, row);
                  }
                }}
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
