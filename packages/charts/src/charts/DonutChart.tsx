import { useEffect, useId, useMemo, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useSpring, type Transition } from "framer-motion";
import { ChartSurface, type TooltipState } from "../components/ChartSurface";
import { EmptyState } from "../components/EmptyState";
import { InlineLegend } from "../components/Legend";
import type { Accessor, CommonChartProps, TooltipRenderContext } from "../types";
import { labelOf, numberOf } from "../utils/accessors";
import { colorAt, getContrastTextColor } from "../utils/color";
import { defaultValueFormatter, joinLabels } from "../utils/format";
import { useChartTheme } from "../themes";
import { arcPath, pieSlices, polar } from "../utils/geometry";
import { chartTransition, useChartEntrance } from "../utils/motion";
import { isDev } from "../utils/env";
import { finiteNonNegative, resolveChartBounds } from "../utils/layout";

const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 };

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
  data = [],
  labelKey,
  valueKey,
  width = 520,
  height = 360,
  margin,
  className,
  style,
  colors,
  theme,
  ariaLabel = "Donut chart",
  ariaDescription,
  dateFormatter,
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
  const tooltipId = useId().replace(/:/g, "");
  const reducedMotion = useReducedMotion();
  const chartTheme = useChartTheme(theme, colors);
  const [tooltipState, setTooltipState] = useState<TooltipState>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
  const { isEntering, onAnimationComplete } = useChartEntrance(animation, reducedMotion);

  const safeData = data ?? [];

  const rows = useMemo(
    () =>
      safeData.map((datum, index) => {
        const label = labelOf(datum, index, labelKey, dateFormatter);
        const rawValue = numberOf(datum, index, valueKey);
        if (rawValue < 0 && isDev()) {
          console.warn(`[@motion-charts/core] DonutChart received negative value at index ${index} (${rawValue}). Clamping to 0.`);
        }
        const value = Math.max(0, rawValue);
        const color = colorAt(chartTheme.colors, index);
        return { datum, index, label, value, color };
      }),
    [chartTheme.colors, dateFormatter, labelKey, safeData, valueKey]
  );
  const total = useMemo(() => rows.reduce((sum, row) => {
    const next = sum + row.value;
    return Number.isFinite(next) ? next : Number.MAX_VALUE;
  }, 0), [rows]);
  const slices = useMemo(
    () => pieSlices(rows.map((row) => row.value), padAngle),
    [padAngle, rows]
  );

  // Filter only renderable slices with value > 0 for 1:1 DOM index keyboard navigation
  const renderableSlices = useMemo(
    () =>
      slices
        .map((slice, index) => ({ slice, row: rows[index], originalIndex: index }))
        .filter((item): item is { slice: (typeof slices)[number]; row: (typeof rows)[number]; originalIndex: number } => !!item.row && item.slice.value > 0),
    [rows, slices]
  );

  useEffect(() => {
    setActiveSliceIndex((current) => renderableSlices.length === 0 ? 0 : Math.min(current, renderableSlices.length - 1));
  }, [renderableSlices.length]);

  const bounds = useMemo(
    () => resolveChartBounds(width, height, defaultMargin, margin),
    [height, margin, width]
  );
  const { left: padLeft, top: padTop } = bounds;
  const innerW = bounds.innerWidth;
  const innerH = bounds.innerHeight;

  const cx = padLeft + innerW / 2;
  const cy = padTop + innerH / 2;
  const smallestDimension = Math.min(innerW, innerH);
  // Keep the ring inside the viewBox even when a chart is rendered in a very
  // narrow responsive card. The inset scales down with the available space.
  const radiusInset = Math.min(22, smallestDimension * 0.1);
  const outerRadius = Math.max(0, smallestDimension / 2 - radiusInset);
  const safeInnerRadiusRatio = Math.min(0.9, finiteNonNegative(innerRadiusRatio, 0.62));
  const innerRadius = outerRadius * safeInnerRadiusRatio;
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

  function handlePointerMove(event: PointerEvent<SVGPathElement>, row: (typeof rows)[number], percent: number) {
    if (!tooltipEnabled) return;
    const clientX = Math.round(event.clientX);
    const clientY = Math.round(event.clientY);
    if (hoveredIndex !== row.index) {
      setHoveredIndex(row.index);
      setTooltipState({ x: clientX, y: clientY, content: tooltipContent(row, percent), id: tooltipId });
    }
  }

  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  function hideTooltip() {
    setHoveredIndex(null);
    setTooltipState(null);
    setIsKeyboardFocused(false);
  }

  function handleKeyDown(event: KeyboardEvent<SVGPathElement>, itemIndex: number) {
    const current = renderableSlices[itemIndex];
    if ((event.key === "Enter" || event.key === " ") && onDatumClick && current) {
      event.preventDefault();
      onDatumClick({
        datum: current.row.datum,
        index: current.row.index,
        label: current.row.label,
        value: current.row.value,
        color: current.row.color
      });
      return;
    }

    const count = renderableSlices.length;
    if (count <= 1) return;
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
      : event.key === "Home" ? -itemIndex
      : event.key === "End" ? count - 1 - itemIndex : 0;

    if (!delta) return;
    event.preventDefault();
    const nextItemIndex = Math.min(count - 1, Math.max(0, itemIndex + delta));
    setActiveSliceIndex(nextItemIndex);
    setIsKeyboardFocused(true);
    const nextSliceItem = renderableSlices[nextItemIndex];
    if (nextSliceItem) {
      setHoveredIndex(nextSliceItem.row.index);
    }
    const svg = event.currentTarget.closest("svg");
    const targets = svg?.querySelectorAll<SVGElement>("[role='graphics-symbol']");
    targets?.[nextItemIndex]?.focus();
  }

  const legendItems = useMemo(() => rows.map((row) => ({ label: row.label, color: row.color })), [rows]);

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
        {renderableSlices.map(({ slice, row, originalIndex }, itemIndex) => {
          const path = arcPath(cx, cy, innerRadius, outerRadius, slice.startAngle, slice.endAngle);
          const mid = (slice.startAngle + slice.endAngle) / 2;
          const labelPoint = polar(cx, cy, (innerRadius + outerRadius) / 2, mid);
          const aria = joinLabels([row.label, valueFormatter(row.value), `${Math.round(slice.percent * 100)}%`]);
          const context = { datum: row.datum, index: row.index, label: row.label, value: row.value, color: row.color };
          const isHovered = hoveredIndex === row.index;
          const isFocused = isKeyboardFocused && activeSliceIndex === itemIndex;
          const hasLabel = showLabels && slice.percent > 0.05;

          return (
            <g key={`${row.label}-${row.index}`}>
              <AnimatedDonutSlice
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={slice.startAngle}
                endAngle={slice.endAngle}
                fill={sliceVariant === "gradient" ? `url(#${gradientBaseId}-${row.index})` : row.color}
                stroke={isFocused ? chartTheme.textColor : "transparent"}
                strokeWidth={isFocused ? 2.5 : 0}
                transformScale={isFocused ? 1.04 : 1}
                hoverScale={1.035}
                transition={chartTransition(animation, reducedMotion, originalIndex)}
                sweep={animation?.entrance === "sweep"}
                isEntering={isEntering}
                reducedMotion={reducedMotion}
                sweepIndex={itemIndex}
                sweepCount={renderableSlices.length}
                onAnimationComplete={isEntering && itemIndex === renderableSlices.length - 1 && !hasLabel ? onAnimationComplete : undefined}
                role="graphics-symbol"
                aria-roledescription="slice"
                aria-label={aria}
                aria-describedby={tooltipState && (isHovered || isFocused) ? tooltipId : undefined}
                tabIndex={itemIndex === activeSliceIndex ? 0 : -1}
                onPointerEnter={(event) => handlePointerMove(event, row, slice.percent)}
                onPointerMove={(event) => handlePointerMove(event, row, slice.percent)}
                onPointerLeave={hideTooltip}
                onFocus={(event) => {
                  setActiveSliceIndex(itemIndex);
                  setIsKeyboardFocused(true);
                  setHoveredIndex(row.index);
                  const rect = event.currentTarget.getBoundingClientRect();
                  setTooltipState({ x: rect.left + rect.width / 2, y: rect.top, content: tooltipContent(row, slice.percent), id: tooltipId });
                }}
                onBlur={hideTooltip}
                onKeyDown={(event) => handleKeyDown(event, itemIndex)}
                onClick={() => onDatumClick?.(context)}
                style={{
                  cursor: onDatumClick ? "pointer" : "default",
                  transformOrigin: `${cx}px ${cy}px`,
                  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.08))",
                  outline: "none"
                }}
              >
                <title>{aria}</title>
              </AnimatedDonutSlice>
              {hasLabel ? (
                <motion.text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={getContrastTextColor(row.color)}
                  fontFamily={chartTheme.fontFamily}
                  fontSize={chartTheme.fontSize}
                  fontWeight={700}
                  pointerEvents="none"
                  initial={false}
                  animate={isEntering ? { opacity: [0, 1] } : { opacity: 1 }}
                  transition={chartTransition(animation, reducedMotion, originalIndex + 1)}
                  onAnimationComplete={isEntering && itemIndex === renderableSlices.length - 1 ? onAnimationComplete : undefined}
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
      {showLegend ? <InlineLegend items={legendItems} theme={chartTheme} /> : null}
    </div>
  );
}

type AnimatedDonutSliceProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  transformScale: number;
  hoverScale: number;
  transition: Transition;
  sweep: boolean;
  isEntering: boolean;
  reducedMotion: boolean | null;
  sweepIndex: number;
  sweepCount: number;
  onAnimationComplete?: () => void;
  role: string;
  "aria-roledescription": string;
  "aria-label": string;
  "aria-describedby"?: string;
  tabIndex: number;
  onPointerEnter: (event: PointerEvent<SVGPathElement>) => void;
  onPointerMove: (event: PointerEvent<SVGPathElement>) => void;
  onPointerLeave: () => void;
  onFocus: (event: FocusEvent<SVGPathElement>) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<SVGPathElement>) => void;
  onClick: () => void;
  style: CSSProperties;
  children: ReactNode;
};

function AnimatedDonutSlice({
  cx,
  cy,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  stroke,
  strokeWidth,
  transformScale,
  hoverScale,
  transition,
  sweep,
  isEntering,
  reducedMotion,
  sweepIndex,
  onAnimationComplete,
  role,
  "aria-roledescription": ariaRoleDescription,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  tabIndex,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
  style,
  children
}: AnimatedDonutSliceProps) {
  const targetStart = Number.isFinite(startAngle) ? startAngle : 0;
  const targetEnd = Number.isFinite(endAngle) ? endAngle : 0;
  const startMotion = useSpring(sweep && isEntering ? 0 : targetStart, transition as never);
  const endMotion = useSpring(sweep && isEntering ? 0 : targetEnd, transition as never);
  const [angles, setAngles] = useState({ start: sweep && isEntering ? 0 : targetStart, end: sweep && isEntering ? 0 : targetEnd });

  useMotionValueEvent(startMotion, "change", (value) => setAngles((current) => ({ ...current, start: value })));
  useMotionValueEvent(endMotion, "change", (value) => setAngles((current) => ({ ...current, end: value })));

  useEffect(() => {
    if (reducedMotion) {
      startMotion.jump(targetStart);
      endMotion.jump(targetEnd);
      return;
    }
    if (sweep && isEntering) {
      startMotion.jump(0);
      endMotion.jump(0);
      const delay = Math.min(0.6, sweepIndex * 0.12) * 1000;
      const timer = window.setTimeout(() => {
        startMotion.set(targetStart);
        endMotion.set(targetEnd);
      }, delay);
      return () => window.clearTimeout(timer);
    }
    startMotion.set(targetStart);
    endMotion.set(targetEnd);
  }, [endMotion, isEntering, reducedMotion, startMotion, sweep, sweepIndex, targetEnd, targetStart]);

  const path = arcPath(cx, cy, innerRadius, outerRadius, angles.start, angles.end);
  return (
    <motion.path
      d={path}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      initial={false}
      animate={isEntering && !sweep
        ? { opacity: [0, 1], scale: [0.86, transformScale] }
        : { opacity: 1, scale: transformScale }}
      whileHover={{ scale: hoverScale, opacity: 0.95 }}
      transition={transition}
      onAnimationComplete={onAnimationComplete}
      role={role}
      aria-roledescription={ariaRoleDescription}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onClick={onClick}
      style={style}
    >
      {children}
    </motion.path>
  );
}
