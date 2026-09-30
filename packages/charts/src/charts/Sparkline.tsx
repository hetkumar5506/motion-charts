import { useId, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import type { Accessor, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { areaPath, linePath, type Point } from "../utils/geometry";
import { chartTransition, shouldAnimateInitial } from "../utils/motion";
import { createLinearScale, extent } from "../utils/scales";
import { resolveChartTheme } from "../themes";

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
  data,
  yKey,
  xKey,
  width = 320,
  height = 96,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Sparkline chart",
  ariaDescription,
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
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const color = colorAt(chartTheme.colors, colorIndex);
  const rows = useMemo(
    () =>
      data.map((datum, index) => {
        const label = xKey ? labelOf(datum, index, xKey) : String(index + 1);
        const value = numberOf(datum, index, yKey);
        return { datum, index, label, value, color };
      }),
    [color, data, xKey, yKey]
  );
  const padLeft = padding;
  const padRight = showEndValue ? Math.max(padding, 46) : padding;
  const yScale = createLinearScale(extent(rows.map((row) => row.value), false), [height - padding, padding], 4);
  const xStep = rows.length <= 1 ? 0 : (width - padLeft - padRight) / (rows.length - 1);
  const points: Point[] = rows.map((row, index) => ({ x: padLeft + xStep * index, y: yScale.scale(row.value) }));
  const baseline = height - padding;
  const baselinePoints: Point[] = points.map((p) => ({ x: p.x, y: baseline }));
  const path = linePath(points, curve);
  const initialPath = linePath(baselinePoints, curve);
  const fillPath = areaPath(points, baseline, curve);
  const initialFillPath = areaPath(baselinePoints, baseline, curve);
  const shouldInitial = shouldAnimateInitial(animation, reducedMotion);
  const tooltipEnabled = tooltip !== false;
  const lastRow = rows[rows.length - 1];
  const lastPoint = points[points.length - 1];

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

  function showTooltip(event: PointerEvent<SVGCircleElement>, row: (typeof rows)[number]) {
    if (!tooltipEnabled) return;
    setTooltipState({ x: event.clientX, y: event.clientY, content: tooltipContent(row) });
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
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {rows.length === 0 ? <EmptyState x={width / 2} y={height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
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
      {showEndValue && lastRow && lastPoint ? (() => {
        const text = valueFormatter(lastRow.value);
        const pillWidth = Math.max(34, text.length * 7.5 + 10);
        const pillHeight = 20;
        // Position pill to the right of the dot in the reserved right margin, with a 6px gap
        const pillX = Math.min(width - pillWidth - 2, lastPoint.x + 8);
        const pillY = Math.max(2, Math.min(height - pillHeight - 2, lastPoint.y - pillHeight / 2));

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
              initial={shouldInitial ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
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
              initial={shouldInitial ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={chartTransition(animation, reducedMotion, rows.length)}
            >
              {text}
            </motion.text>
          </g>
        );
      })() : null}
      {rows.map((row, index) => {
        const point = points[index];
        if (!point) return null;
        const visible = showPoints || index === rows.length - 1;
        const aria = joinLabels([row.label, valueFormatter(row.value)]);
        const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
        return (
          <motion.circle
            key={`${row.label}-${row.index}`}
            cx={point.x}
            cy={point.y}
            r={visible ? 4 : 7}
            fill={visible ? color : "transparent"}
            stroke={visible ? "white" : "transparent"}
            strokeWidth={visible ? 2 : 0}
            initial={shouldInitial ? { cy: baseline, scale: 0, opacity: 0 } : false}
            animate={{ cx: point.x, cy: point.y, scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.35 }}
            transition={chartTransition(animation, reducedMotion, index)}
            role="img"
            aria-label={aria}
            tabIndex={0}
            onPointerEnter={(event) => showTooltip(event, row)}
            onPointerMove={(event) => showTooltip(event, row)}
            onPointerLeave={() => setTooltipState(null)}
            onFocus={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row) });
            }}
            onBlur={() => setTooltipState(null)}
            onClick={() => onDatumClick?.(context)}
            style={{ cursor: onDatumClick ? "pointer" : "default", transformOrigin: `${point.x}px ${point.y}px` }}
          >
            <title>{aria}</title>
          </motion.circle>
        );
      })}
    </ChartSurface>
  );
}
