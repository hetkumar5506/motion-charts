import { useId, useMemo, useState, type PointerEvent, type ReactNode } from "react";
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
  data,
  labelKey,
  valueKey,
  width = 520,
  height = 360,
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
  const reducedMotion = useReducedMotion();
  const chartTheme = useMemo(() => resolveChartTheme(theme, colors), [colors, theme]);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const rows = useMemo(
    () =>
      data.map((datum, index) => {
        const label = labelOf(datum, index, labelKey);
        const value = Math.max(0, numberOf(datum, index, valueKey));
        const color = colorAt(chartTheme.colors, index);
        return { datum, index, label, value, color };
      }),
    [chartTheme.colors, data, labelKey, valueKey]
  );
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const slices = pieSlices(
    rows.map((row) => row.value),
    padAngle
  );
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.max(20, Math.min(width, height) / 2 - 22);
  const innerRadius = outerRadius * Math.min(0.9, Math.max(0, innerRadiusRatio));
  const shouldInitial = shouldAnimateInitial(animation, reducedMotion);
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

  function showTooltip(event: PointerEvent<SVGPathElement>, row: (typeof rows)[number], percent: number) {
    if (!tooltipEnabled) return;
    setTooltipState({ x: event.clientX, y: event.clientY, content: tooltipContent(row, percent) });
  }

  const legendItems = rows.map((row) => ({ label: row.label, color: row.color }));

  return (
    <div className={className} style={style}>
      <ChartSurface width={width} height={height} ariaLabel={ariaLabel} ariaDescription={ariaDescription} tooltip={tooltipState} tooltipStyle={chartTheme.tooltipStyle}>
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
        {slices.map((slice, index) => {
          const row = rows[index];
          if (!row || slice.value <= 0) return null;
          const path = arcPath(cx, cy, innerRadius, outerRadius, slice.startAngle, slice.endAngle);
          const mid = (slice.startAngle + slice.endAngle) / 2;
          const labelPoint = polar(cx, cy, (innerRadius + outerRadius) / 2, mid);
          const aria = joinLabels([row.label, valueFormatter(row.value), `${Math.round(slice.percent * 100)}%`]);
          const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };

          return (
            <g key={`${row.label}-${row.index}`}>
              <motion.path
                d={path}
                fill={sliceVariant === "gradient" ? `url(#${gradientBaseId}-${row.index})` : row.color}
                initial={shouldInitial ? { opacity: 0, scale: 0.86 } : false}
                animate={{ opacity: 1, scale: 1, d: path }}
                whileHover={{ scale: 1.035, opacity: 0.95 }}
                transition={chartTransition(animation, reducedMotion, index)}
                role="img"
                aria-label={aria}
                tabIndex={0}
                onPointerEnter={(event) => showTooltip(event, row, slice.percent)}
                onPointerMove={(event) => showTooltip(event, row, slice.percent)}
                onPointerLeave={() => setTooltipState(null)}
                onFocus={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row, slice.percent) });
                }}
                onBlur={() => setTooltipState(null)}
                onClick={() => onDatumClick?.(context)}
                style={{
                  cursor: onDatumClick ? "pointer" : "default",
                  transformOrigin: `${cx}px ${cy}px`,
                  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.08))"
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
                  transition={chartTransition(animation, reducedMotion, index + 1)}
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
      {showLegend ? <InlineLegend items={legendItems} color={chartTheme.mutedTextColor} /> : null}
    </div>
  );
}
