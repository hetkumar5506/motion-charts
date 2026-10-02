import { useEffect, useId, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxisBottom, AxisBottomLinear, AxisLeft, AxisLeftCategory, GridColumns, GridRows } from "../components/Axis";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import { AnimatedNumberText } from "../components/AnimatedNumber";
import type { Accessor, AxisOptions, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt, getContrastTextColor } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { useChartTheme } from "../themes";
import { chartTransition, useChartEntrance } from "../utils/motion";
import { createCategoryScale, createLinearScale, extent, type CategoryScale, type LinearScale } from "../utils/scales";
import { finiteNonNegative, resolveChartBounds } from "../utils/layout";
import { isDev } from "../utils/env";

export type BarSeries<TDatum extends object> = {
  id: string;
  yKey: Accessor<TDatum, number>;
  label?: string;
  color?: string;
};

export type ShowValuesOptions = {
  /** Set false to keep value labels static while bars animate. */
  countUp?: boolean;
  /** Formats value labels only; axes and tooltips continue to use valueFormatter. */
  formatter?: (value: number) => string;
};

export type BarChartProps<TDatum extends object> = CommonChartProps<TDatum> & {
  xKey: Accessor<TDatum, string | number>;
  /** Single-series shorthand. `series` takes precedence when both are supplied. */
  yKey?: Accessor<TDatum, number>;
  series?: readonly BarSeries<TDatum>[];
  layout?: "vertical" | "horizontal";
  seriesLayout?: "stacked" | "grouped";
  legend?: boolean;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  showGrid?: boolean;
  showValues?: boolean | ShowValuesOptions;
  barRadius?: number;
  barPadding?: number;
  /** `glass` adds a restrained specular highlight over the existing gradient treatment. */
  barVariant?: "solid" | "gradient" | "glass";
  onDatumClick?: (context: TooltipRenderContext<TDatum>) => void;
};

type PreparedBarSeries<TDatum extends object> = BarSeries<TDatum> & {
  label: string;
  color: string;
};

type BarSegment<TDatum extends object> = {
  datum: TDatum;
  index: number;
  label: string;
  value: number;
  color: string;
  seriesId: string;
  seriesLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const defaultMargin = { top: 24, right: 20, bottom: 44, left: 56 };
const warnedSeriesConflict = new WeakSet<object>();

export function BarChart<TDatum extends object>({
  data = [],
  xKey,
  yKey,
  series,
  layout = "vertical",
  seriesLayout = "grouped",
  legend = true,
  width = 720,
  height = 360,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Bar chart",
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
  showValues = false,
  barRadius = 8,
  barPadding = 0.22,
  barVariant = "gradient",
  onDatumClick
}: BarChartProps<TDatum>) {
  const gradientBaseId = useId().replace(/:/g, "");
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useChartTheme(theme, colors);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const { isEntering, onAnimationComplete } = useChartEntrance(animation, reducedMotion);
  const bounds = useMemo(() => resolveChartBounds(width, height, defaultMargin, margin), [height, margin, width]);
  const safeBarRadius = finiteNonNegative(barRadius, 8);
  const safeBarPadding = finiteNonNegative(barPadding, 0.22);
  const safeData = data ?? [];
  const hasSeries = Boolean(series?.length);

  if (hasSeries && yKey && typeof yKey === "string" && !warnedSeriesConflict.has(series as object)) {
    warnedSeriesConflict.add(series as object);
    if (typeof console !== "undefined" && isDev()) {
      console.warn("[@motion-charts/core] BarChart received both series and yKey; series takes precedence.");
    }
  }

  const preparedSeries = useMemo<PreparedBarSeries<TDatum>[]>(() => {
    const source = hasSeries
      ? (series ?? [])
      : yKey
        ? [{ id: "value", yKey, label: "Value" }]
        : [];
    const usedIds = new Set<string>();
    return source.map((item, index) => {
      const baseId = item.id.trim() || `series-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix++}`;
      }
      usedIds.add(id);
      return {
        ...item,
        id,
        label: item.label ?? item.id ?? `Series ${index + 1}`,
        color: item.color ?? colorAt(chartTheme.colors, index)
      };
    });
  }, [chartTheme.colors, hasSeries, series, yKey]);

  const rows = useMemo(
    () => safeData.map((datum, index) => ({ datum, index, label: labelOf(datum, index, xKey, dateFormatter) })),
    [dateFormatter, safeData, xKey]
  );
  const labels = useMemo(() => rows.map((row) => row.label), [rows]);
  const valuesBySeries = useMemo(
    () => preparedSeries.map((item) => rows.map((row) => numberOf(row.datum, row.index, item.yKey))),
    [preparedSeries, rows]
  );
  const domainValues = useMemo(() => {
    if (seriesLayout !== "stacked") return valuesBySeries.flat();
    const values: number[] = [];
    rows.forEach((_row, rowIndex) => {
      let positive = 0;
      let negative = 0;
      valuesBySeries.forEach((valuesForSeries) => {
        const value = valuesForSeries[rowIndex] ?? 0;
        if (value >= 0) positive += value;
        else negative += value;
      });
      values.push(positive, negative);
    });
    return values;
  }, [rows, seriesLayout, valuesBySeries]);
  const referenceValues = referenceLines.flatMap((line) => typeof line.y === "number" && Number.isFinite(line.y) ? [line.y] : []);
  const valueDomain = extent([...domainValues, ...referenceValues], true);
  const categoryScale = useMemo<CategoryScale>(
    () => createCategoryScale(labels, layout === "vertical" ? [bounds.left, bounds.left + bounds.innerWidth] : [bounds.top, bounds.top + bounds.innerHeight], safeBarPadding),
    [bounds.innerHeight, bounds.innerWidth, bounds.left, bounds.top, labels, layout, safeBarPadding]
  );
  const valueScale = useMemo<LinearScale>(
    () => createLinearScale(valueDomain, layout === "vertical" ? [bounds.top + bounds.innerHeight, bounds.top] : [bounds.left, bounds.left + bounds.innerWidth], yAxis?.tickCount ?? 5),
    [bounds.height, bounds.innerHeight, bounds.innerWidth, bounds.left, bounds.top, layout, valueDomain, yAxis?.tickCount]
  );
  const baseline = valueScale.scale(0);
  const showValueLabels = Boolean(showValues);
  const segments = useMemo<BarSegment<TDatum>[]>(() => {
    const result: BarSegment<TDatum>[] = [];
    rows.forEach((row, rowIndex) => {
      let positive = 0;
      let negative = 0;
      const count = Math.max(1, preparedSeries.length);
      preparedSeries.forEach((item, seriesIndex) => {
        const value = valuesBySeries[seriesIndex]?.[rowIndex] ?? 0;
        const startValue = seriesLayout === "stacked" ? (value >= 0 ? positive : negative) : 0;
        const endValue = seriesLayout === "stacked"
          ? (value >= 0 ? positive + value : negative + value)
          : value;
        if (value >= 0) positive = seriesLayout === "stacked" ? positive + value : positive;
        else negative = seriesLayout === "stacked" ? negative + value : negative;

        if (layout === "vertical") {
          const groupWidth = seriesLayout === "grouped" ? categoryScale.bandwidth / count : categoryScale.bandwidth;
          const width = seriesLayout === "grouped" ? groupWidth * 0.82 : groupWidth;
          const x = categoryScale.position(row.label, row.index) + (seriesLayout === "grouped"
            ? (categoryScale.bandwidth - groupWidth * count) / 2 + seriesIndex * groupWidth + (groupWidth - width) / 2
            : 0);
          const y0 = valueScale.scale(startValue);
          const y1 = valueScale.scale(endValue);
          result.push({ datum: row.datum, index: row.index, label: row.label, value, color: item.color, seriesId: item.id, seriesLabel: item.label, x, y: Math.min(y0, y1), width, height: Math.abs(y1 - y0) });
        } else {
          const groupHeight = seriesLayout === "grouped" ? categoryScale.bandwidth / count : categoryScale.bandwidth;
          const height = seriesLayout === "grouped" ? groupHeight * 0.82 : groupHeight;
          const y = categoryScale.position(row.label, row.index) + (seriesLayout === "grouped"
            ? (categoryScale.bandwidth - groupHeight * count) / 2 + seriesIndex * groupHeight + (groupHeight - height) / 2
            : 0);
          const x0 = valueScale.scale(startValue);
          const x1 = valueScale.scale(endValue);
          result.push({ datum: row.datum, index: row.index, label: row.label, value, color: item.color, seriesId: item.id, seriesLabel: item.label, x: Math.min(x0, x1), y, width: Math.abs(x1 - x0), height });
        }
      });
    });
    return result;
  }, [categoryScale, layout, preparedSeries, rows, seriesLayout, valueScale, valuesBySeries]);

  useEffect(() => {
    setActiveIndex((current) => segments.length === 0 ? 0 : Math.min(current, segments.length - 1));
  }, [segments.length]);

  const tooltipEnabled = tooltip !== false;
  const popEntrance = animation?.entrance === "pop";
  const countUp = typeof showValues === "object" ? showValues.countUp !== false : true;
  const valueLabelFormatter = typeof showValues === "object" && showValues.formatter
    ? showValues.formatter
    : valueFormatter;

  function contextFor(segment: BarSegment<TDatum>): TooltipRenderContext<TDatum> {
    return { datum: segment.datum, index: segment.index, label: segment.label, value: segment.value, color: segment.color, seriesId: segment.seriesId, seriesLabel: segment.seriesLabel };
  }

  function tooltipContent(segment: BarSegment<TDatum>): ReactNode {
    const context = contextFor(segment);
    if (typeof tooltip === "function") return tooltip(context);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: segment.color, display: "inline-block" }} />
          <span style={{ color: chartTheme.mutedTextColor, fontSize: 11, fontWeight: 500 }}>{segment.label} · {segment.seriesLabel}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: chartTheme.textColor, paddingLeft: 14 }}>{valueFormatter(segment.value)}</div>
      </div>
    );
  }

  function handlePointerMove(event: PointerEvent<SVGRectElement>, segment: BarSegment<TDatum>, segmentIndex: number) {
    setIsKeyboardFocused(false);
    setHoveredIndex(segmentIndex);
    if (tooltipEnabled) setTooltipState({ x: Math.round(event.clientX), y: Math.round(event.clientY), content: tooltipContent(segment), id: tooltipId });
  }

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
    setIsKeyboardFocused(false);
  }

  function handleKeyDown(event: KeyboardEvent<SVGRectElement>, index: number) {
    const segment = segments[index];
    if ((event.key === "Enter" || event.key === " ") && onDatumClick && segment) {
      event.preventDefault();
      onDatumClick(contextFor(segment));
      return;
    }
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
      : event.key === "Home" ? -index
      : event.key === "End" ? segments.length - 1 - index : 0;
    if (!delta || segments.length <= 1) return;
    event.preventDefault();
    const next = Math.min(segments.length - 1, Math.max(0, index + delta));
    setActiveIndex(next);
    setIsKeyboardFocused(true);
    const svg = event.currentTarget.closest("svg");
    svg?.querySelectorAll<SVGElement>("[role='graphics-symbol']")[next]?.focus();
  }

  const axisValueFormatter = (value: number) => yAxis?.formatter?.(value) ?? valueFormatter(value);
  const axisCategoryFormatter = (value: string) => xAxis?.formatter?.(value) ?? value;

  return (
    <div className={className} style={{ width: "100%", minWidth: 0, ...style }}>
      <ChartSurface width={bounds.width} height={bounds.height} ariaLabel={ariaLabel} ariaDescription={ariaDescription} tooltip={tooltipState} tooltipStyle={chartTheme.tooltipStyle} tooltipId={tooltipId}>
        <defs>
          {barVariant !== "solid" ? preparedSeries.map((item, seriesIndex) => (
            <linearGradient key={item.id} id={`${gradientBaseId}-${seriesIndex}`} x1="0" y1="0" x2={layout === "horizontal" ? "1" : "0"} y2={layout === "horizontal" ? "0" : "1"}>
              {barVariant === "glass" ? <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" /> : null}
              {barVariant === "glass" ? <stop offset="20%" stopColor={item.color} stopOpacity="1" /> : null}
              <stop offset={barVariant === "glass" ? "46%" : "0%"} stopColor={item.color} stopOpacity="1" />
              <stop offset="100%" stopColor={item.color} stopOpacity={barVariant === "glass" ? "0.72" : "0.82"} />
            </linearGradient>
          )) : null}
        </defs>
        {segments.length === 0 ? <EmptyState x={bounds.width / 2} y={bounds.height / 2} theme={chartTheme}>{emptyState}</EmptyState> : null}
        {layout === "vertical" ? (
          <>
            {showGrid ? <GridRows scale={valueScale} x1={bounds.left} x2={bounds.left + bounds.innerWidth} style={chartTheme} /> : null}
            {yAxis?.show === false ? null : <AxisLeft scale={valueScale} x={bounds.left} textX={bounds.left - 10} formatter={axisValueFormatter} style={chartTheme} />}
            {xAxis?.show === false ? null : <AxisBottom scale={categoryScale} y={xAxis?.zeroLine || yAxis?.zeroLine ? baseline : bounds.top + bounds.innerHeight} formatter={axisCategoryFormatter} style={chartTheme} tickCount={xAxis?.tickCount} />}
            {xAxis?.zeroLine || yAxis?.zeroLine ? <line x1={baseline} x2={baseline} y1={bounds.top} y2={bounds.top + bounds.innerHeight} stroke={chartTheme.axisColor} /> : null}
          </>
        ) : (
          <>
            {showGrid ? <GridColumns scale={valueScale} y1={bounds.top} y2={bounds.top + bounds.innerHeight} style={chartTheme} /> : null}
            {xAxis?.show === false ? null : <AxisBottomLinear scale={valueScale} y={bounds.top + bounds.innerHeight} formatter={axisValueFormatter} style={chartTheme} />}
            {yAxis?.show === false ? null : <AxisLeftCategory scale={categoryScale} x={bounds.left} textX={bounds.left - 10} formatter={axisCategoryFormatter} style={chartTheme} />}
            {xAxis?.zeroLine || yAxis?.zeroLine ? <line x1={baseline} x2={baseline} y1={bounds.top} y2={bounds.top + bounds.innerHeight} stroke={chartTheme.axisColor} /> : null}
          </>
        )}

        {referenceLines.map((line, referenceIndex) => {
          const color = line.color ?? chartTheme.textColor;
          const yPosition = typeof line.y === "number" && Number.isFinite(line.y) ? valueScale.scale(line.y) : null;
          const xLabel = line.x === undefined ? null : String(line.x);
          const categoryIndex = xLabel === null ? -1 : labels.indexOf(xLabel);
          const categoryPosition = categoryIndex >= 0 ? categoryScale.center(xLabel!, categoryIndex) : null;
          if (layout === "vertical" && yPosition === null && categoryPosition === null) return null;
          if (layout === "horizontal" && yPosition === null && categoryPosition === null) return null;
          const x1 = layout === "vertical" ? (categoryPosition ?? bounds.left) : (yPosition ?? bounds.left);
          const x2 = layout === "vertical" ? (categoryPosition ?? bounds.left + bounds.innerWidth) : (yPosition ?? bounds.left);
          const y1 = layout === "vertical" ? (yPosition ?? bounds.top) : (categoryPosition ?? bounds.top);
          const y2 = layout === "vertical" ? (yPosition ?? bounds.top + bounds.innerHeight) : (categoryPosition ?? bounds.top + bounds.innerHeight);
          return (
            <g key={`reference-${referenceIndex}`} aria-label={line.label}>
              <motion.line
                x1={layout === "vertical" && yPosition !== null ? bounds.left : x1}
                x2={layout === "vertical" && yPosition !== null ? bounds.left + bounds.innerWidth : x2}
                y1={layout === "vertical" && yPosition !== null ? yPosition : y1}
                y2={layout === "vertical" && yPosition !== null ? yPosition : y2}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={line.dash ?? "5 4"}
                initial={false}
                animate={isEntering ? { opacity: [0, 1], pathLength: [0, 1] } : { opacity: 1, pathLength: 1 }}
                transition={chartTransition(animation, reducedMotion, referenceIndex, referenceLines.length)}
                pointerEvents="none"
              />
              {line.label ? <text x={layout === "horizontal" ? (yPosition ?? bounds.left) : bounds.left + 4} y={layout === "vertical" ? (yPosition ?? bounds.top) - 6 : (categoryPosition ?? bounds.top) - 6} fill={color} fontFamily={chartTheme.fontFamily} fontSize={11} fontWeight={600}>{line.label}</text> : null}
            </g>
          );
        })}

        {segments.map((segment, index) => {
          const isHovered = hoveredIndex === index;
          const isFocused = isKeyboardFocused && activeIndex === index;
          const labelInside = layout === "vertical"
            ? segment.height >= 28
            : segment.width >= 44;
          const rawLabelX = layout === "vertical"
            ? segment.x + segment.width / 2
            : segment.value >= 0 ? segment.x + segment.width + 8 : segment.x - 8;
          const rawLabelY = layout === "vertical"
            ? segment.value >= 0 ? (labelInside ? segment.y + 15 : segment.y - 8) : (labelInside ? segment.y + segment.height - 8 : segment.y + segment.height + 14)
            : segment.y + segment.height / 2;
          const labelX = layout === "horizontal" ? Math.max(bounds.left + 4, Math.min(bounds.width - 4, rawLabelX)) : rawLabelX;
          const labelY = layout === "horizontal" ? rawLabelY : Math.max(bounds.top + 10, Math.min(bounds.height - 4, rawLabelY));
          const aria = joinLabels([segment.label, segment.seriesLabel, valueFormatter(segment.value)]);
          return (
            <g key={`${segment.seriesId}-${segment.label}-${segment.index}`}>
              {isFocused ? <rect x={Math.max(0, segment.x - 3)} y={Math.max(0, segment.y - 3)} width={Math.min(bounds.width, segment.width + 6)} height={Math.min(bounds.height, segment.height + 6)} fill="none" stroke={chartTheme.textColor} strokeWidth={2} pointerEvents="none" opacity={0.85} /> : null}
              <motion.rect
                x={segment.x}
                y={segment.y}
                width={segment.width}
                height={segment.height}
                rx={Math.min(safeBarRadius, layout === "vertical" ? segment.width / 2 : segment.height / 2, Math.max(0, layout === "vertical" ? segment.height : segment.width) / 2)}
                fill={barVariant !== "solid" ? `url(#${gradientBaseId}-${preparedSeries.findIndex((item) => item.id === segment.seriesId)})` : segment.color}
                initial={false}
                animate={isEntering
                  ? {
                      attrX: segment.x,
                      attrY: segment.y,
                      width: segment.width,
                      height: segment.height,
                      scaleX: layout === "horizontal" ? (popEntrance ? [0, 1.045, 1] : [0, 1]) : 1,
                      scaleY: layout === "vertical" ? (popEntrance ? [0, 1.045, 1] : [0, 1]) : 1,
                      opacity: [0, isHovered ? 0.92 : 1]
                    }
                  : { attrX: segment.x, attrY: segment.y, width: segment.width, height: segment.height, scaleX: 1, scaleY: 1, opacity: isHovered ? 0.92 : 1 }}
                whileHover={{ opacity: 0.85 }}
                transition={chartTransition(animation, reducedMotion, index, segments.length)}
                onAnimationComplete={isEntering && index === segments.length - 1 && !showValueLabels ? onAnimationComplete : undefined}
                role="graphics-symbol"
                aria-roledescription="bar"
                aria-label={aria}
                aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
                tabIndex={index === activeIndex ? 0 : -1}
                onPointerEnter={(event) => handlePointerMove(event, segment, index)}
                onPointerMove={(event) => handlePointerMove(event, segment, index)}
                onPointerLeave={hideTooltip}
                onFocus={(event) => {
                  setActiveIndex(index);
                  setIsKeyboardFocused(true);
                  setHoveredIndex(index);
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(segment), id: tooltipId });
                }}
                onBlur={hideTooltip}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onClick={() => onDatumClick?.(contextFor(segment))}
                style={{ cursor: onDatumClick ? "pointer" : "default", outline: "none", originX: layout === "horizontal" ? (segment.value >= 0 ? 0 : 1) : 0.5, originY: layout === "vertical" ? (segment.value >= 0 ? 1 : 0) : 0.5 }}
              >
                <title>{aria}</title>
              </motion.rect>
              {showValueLabels ? (
                <motion.text
                  x={labelX}
                  y={labelY}
                  textAnchor={layout === "horizontal" ? (segment.value >= 0 ? "start" : "end") : "middle"}
                  dominantBaseline={layout === "horizontal" ? "middle" : undefined}
                  fill={labelInside && layout === "vertical" ? getContrastTextColor(segment.color) : chartTheme.textColor}
                  fontFamily={chartTheme.fontFamily}
                  fontSize={11}
                  fontWeight={600}
                  initial={false}
                  animate={isEntering ? { opacity: [0, 1], scale: [0.96, 1] } : { opacity: 1, scale: 1 }}
                  transition={chartTransition(animation, reducedMotion, index, segments.length)}
                  onAnimationComplete={isEntering && index === segments.length - 1 ? onAnimationComplete : undefined}
                  style={{ filter: labelInside && layout === "vertical" ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" : "none", userSelect: "none", pointerEvents: "none", originX: 0.5, originY: 0.5 }}
                >
                  <AnimatedNumberText
                    value={segment.value}
                    format={valueLabelFormatter}
                    transition={chartTransition(animation, reducedMotion, index, segments.length)}
                    initialValue={countUp && isEntering ? 0 : undefined}
                    reducedMotion={reducedMotion}
                  />
                </motion.text>
              ) : null}
            </g>
          );
        })}
      </ChartSurface>
      {hasSeries && legend ? <InlineLegend items={preparedSeries.map((item) => ({ label: item.label, color: item.color }))} theme={chartTheme} /> : null}
    </div>
  );
}
