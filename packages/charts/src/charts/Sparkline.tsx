import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import type { Accessor, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf, rawNumberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, useChartEntrance } from "../utils/motion";
import { createLinearScale, extent } from "../utils/scales";
import { resolveChartTheme } from "../themes";
import { finiteNonNegative, resolveChartBounds } from "../utils/layout";

export type SparklineProps<TDatum extends object> = CommonChartProps<TDatum> & {
  yKey: Accessor<TDatum, number>;
  xKey?: Accessor<TDatum, string | number>;
  padding?: number;
  strokeWidth?: number;
  colorIndex?: number;
  curve?: "linear" | "smooth";
  showArea?: boolean;
  showPoints?: boolean;
  showEndValue?: boolean;
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

export function Sparkline<TDatum extends object>({
  data = [],
  yKey,
  xKey,
  width = 320,
  height = 96,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Sparkline chart",
  ariaDescription,
  dateFormatter,
  valueFormatter = defaultValueFormatter,
  emptyState,
  animation,
  tooltip,
  padding = 10,
  strokeWidth = 2.5,
  colorIndex = 0,
  curve = "smooth",
  showArea = true,
  showPoints = false,
  showEndValue = false,
  onDatumClick
}: SparklineProps<TDatum>) {
  const gradientId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const { isEntering, onAnimationComplete } = useChartEntrance(animation, reducedMotion);

  const color = colorAt(chartTheme.colors, colorIndex);
  const safePadding = finiteNonNegative(padding, 10);
  const safeStrokeWidth = finiteNonNegative(strokeWidth, 2.5);
  const bounds = useMemo(
    () => resolveChartBounds(
      width,
      height,
      {
        top: safePadding,
        right: showEndValue ? Math.max(safePadding, 46) : safePadding,
        bottom: safePadding,
        left: safePadding
      },
      margin
    ),
    [height, margin, safePadding, showEndValue, width]
  );
  const safeData = data ?? [];
  const rows = useMemo(
    () =>
      safeData.map((datum, index) => {
        const label = xKey ? labelOf(datum, index, xKey, dateFormatter) : String(index + 1);
        const rawVal = rawNumberOf(datum, index, yKey);
        const value = rawVal ?? 0;
        const isNull = rawVal === null;
        return { datum, index, label, value, rawVal, isNull, color };
      }),
    [color, dateFormatter, safeData, xKey, yKey]
  );
  const validValues = useMemo(() => rows.filter((r) => !r.isNull).map((r) => r.value), [rows]);
  const yScale = useMemo(
    () => createLinearScale(extent(validValues, false), [bounds.top + bounds.innerHeight, bounds.top], 4),
    [bounds, validValues]
  );
  const xStep = rows.length <= 1 ? 0 : bounds.innerWidth / (rows.length - 1);
  const points: (Point | null)[] = useMemo(
    () =>
      rows.map((row, index) => {
        if (row.isNull) return null;
        return { x: bounds.left + xStep * index, y: yScale.scale(row.value) };
      }),
    [bounds.left, rows, xStep, yScale]
  );
  const baseline = bounds.top + bounds.innerHeight;
  const baselinePoints: (Point | null)[] = useMemo(
    () => points.map((p) => (p ? { x: p.x, y: baseline } : null)),
    [baseline, points]
  );
  const path = useMemo(() => linePath(points, curve, true), [curve, points]);
  const initialPath = useMemo(() => linePath(baselinePoints, curve, true), [baselinePoints, curve]);
  const fillPath = useMemo(() => areaPath(points, baseline, curve, true), [baseline, curve, points]);
  const initialFillPath = useMemo(() => areaPath(baselinePoints, baseline, curve, true), [baseline, baselinePoints, curve]);
  const tooltipEnabled = tooltip !== false;

  // Renderable items are only rows with non-null values
  const renderableItems = useMemo(
    () =>
      rows
        .map((row) => ({ row, point: points[row.index] }))
        .filter((item): item is { row: (typeof rows)[number]; point: Point } => !!item.point && Number.isFinite(item.point.x) && Number.isFinite(item.point.y)),
    [points, rows]
  );

  useEffect(() => {
    setActiveItemIndex((current) => renderableItems.length === 0 ? 0 : Math.min(current, renderableItems.length - 1));
  }, [renderableItems.length]);

  // For showEndValue, find the last finite value
  const lastFiniteItem = useMemo(() => {
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i]!;
      const point = points[i];
      if (!row.isNull && point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        return { row, point };
      }
    }
    return null;
  }, [points, rows]);

  function tooltipContent(row: (typeof rows)[number]): ReactNode {
    const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <span style={{ display: "grid", gap: 2 }}>
        <strong style={{ color: "inherit", fontWeight: 650 }}>{row.label}</strong>
        <span style={{ opacity: 0.78 }}>{valueFormatter(row.value)}</span>
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
      {showEndValue && lastFiniteItem ? (() => {
        const { row, point } = lastFiniteItem;
        const text = String(valueFormatter(row.value) ?? "");
        const desiredPillWidth = Math.max(34, text.length * 7.5 + 10);
        const pillWidth = Math.min(desiredPillWidth, Math.max(1, bounds.width));
        const pillHeight = Math.min(20, Math.max(1, bounds.height));
        const maxPillX = Math.max(0, bounds.width - pillWidth);
        const maxPillY = Math.max(0, bounds.height - pillHeight);
        const pillX = Math.min(maxPillX, Math.max(0, point.x + 8));
        const pillY = Math.min(maxPillY, Math.max(0, point.y - pillHeight / 2));
        const desiredTextWidth = text.length * 7.5;
        const showPillText = pillWidth >= 8;
        const textLength = showPillText && desiredTextWidth > pillWidth - 8 ? pillWidth - 8 : undefined;

        return (
          <g>
            <motion.rect
              x={pillX}
              y={pillY}
              width={pillWidth}
              height={pillHeight}
              rx={5}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth={1}
              initial={false}
              animate={isEntering ? { opacity: [0, 1], scale: [0.9, 1] } : { opacity: 1, scale: 1 }}
              transition={chartTransition(animation, reducedMotion, rows.length)}
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))" }}
            />
            <motion.text
              x={pillX + pillWidth / 2}
              y={pillY + pillHeight / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={chartTheme.textColor}
              fontFamily={chartTheme.fontFamily}
              fontSize={11}
              fontWeight={700}
              textLength={textLength}
              lengthAdjust={textLength ? "spacingAndGlyphs" : undefined}
              initial={false}
              animate={isEntering ? { opacity: [0, 1] } : { opacity: 1 }}
              transition={chartTransition(animation, reducedMotion, rows.length)}
            >
              {showPillText ? text : null}
            </motion.text>
          </g>
        );
      })() : null}
      {renderableItems.map(({ row, point }, itemIndex) => {
        const visible = showPoints || itemIndex === renderableItems.length - 1;
        const aria = joinLabels([row.label, valueFormatter(row.value)]);
        const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
        const isHovered = hoveredIndex === row.index;
        const isFocused = isKeyboardFocused && activeItemIndex === itemIndex;
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
              r={visible ? 4 : 7}
              fill={visible ? color : "transparent"}
              stroke={visible ? "white" : "transparent"}
              strokeWidth={visible ? 2 : 0}
              initial={false}
              animate={isEntering ? { scale: [0, 1], opacity: [0, 1] } : { scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.35 }}
              transition={chartTransition(animation, reducedMotion, row.index)}
              onAnimationComplete={isEntering && itemIndex === renderableItems.length - 1 ? onAnimationComplete : undefined}
              role="graphics-symbol"
              aria-roledescription="data point"
              aria-label={aria}
              aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
              tabIndex={itemIndex === activeItemIndex ? 0 : -1}
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
              style={{
                cursor: onDatumClick ? "pointer" : "default",
                transformOrigin: `${point.x}px ${point.y}px`,
                outline: "none"
              }}
            >
              <title>{aria}</title>
            </motion.circle>
          </g>
        );
      })}
    </ChartSurface>
  );
}
