import type { CategoryScale, LinearScale } from "../utils/scales";

export type AxisStyle = {
  axisColor?: string;
  gridColor?: string;
  tickColor?: string;
  fontFamily?: string;
  fontSize?: number;
};

const defaults = {
  axisColor: "rgba(148, 163, 184, 0.35)",
  gridColor: "rgba(226, 232, 240, 0.7)",
  tickColor: "#475569",
  fontFamily: 'Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 12
};

export function GridRows({ scale, x1, x2, style }: { scale: LinearScale; x1: number; x2: number; style?: AxisStyle }) {
  const merged = { ...defaults, ...style };
  return (
    <g aria-hidden="true">
      {scale.ticks.map((tick) => (
        <line key={tick} x1={x1} x2={x2} y1={scale.scale(tick)} y2={scale.scale(tick)} stroke={merged.gridColor} strokeDasharray="3 4" strokeWidth={1} />
      ))}
    </g>
  );
}

export function AxisLeft({
  scale,
  x,
  textX,
  formatter,
  style
}: {
  scale: LinearScale;
  x: number;
  textX: number;
  formatter?: (value: number) => string;
  style?: AxisStyle;
}) {
  const merged = { ...defaults, ...style };
  return (
    <g aria-hidden="true">
      <line x1={x} x2={x} y1={scale.range[0]} y2={scale.range[1]} stroke={merged.axisColor} />
      {scale.ticks.map((tick) => (
        <g key={tick} transform={`translate(0 ${scale.scale(tick)})`}>
          <line x1={x - 4} x2={x} y1={0} y2={0} stroke={merged.axisColor} />
          <text
            x={textX}
            y={0}
            dy="0.32em"
            textAnchor="end"
            fill={merged.tickColor}
            fontFamily={merged.fontFamily}
            fontSize={merged.fontSize}
            fontWeight={500}
          >
            {formatter ? formatter(tick) : tick}
          </text>
        </g>
      ))}
    </g>
  );
}

export function AxisLeftCategory({
  scale,
  x,
  textX,
  formatter,
  style
}: {
  scale: CategoryScale;
  x: number;
  textX: number;
  formatter?: (value: string) => string;
  style?: AxisStyle;
}) {
  const merged = { ...defaults, ...style };
  return (
    <g aria-hidden="true">
      <line x1={x} x2={x} y1={scale.range[0]} y2={scale.range[1]} stroke={merged.axisColor} />
      {scale.labels.map((label, index) => (
        <g key={`${label}-${index}`} transform={`translate(${x} ${scale.center(label, index)})`}>
          <line x1={x - 4} x2={x} y1={0} y2={0} stroke={merged.axisColor} />
          <text
            x={textX - x}
            y={0}
            dy="0.32em"
            textAnchor="end"
            fill={merged.tickColor}
            fontFamily={merged.fontFamily}
            fontSize={merged.fontSize}
            fontWeight={500}
          >
            {formatter ? formatter(label) : label}
          </text>
        </g>
      ))}
    </g>
  );
}

export function AxisBottomLinear({
  scale,
  y,
  formatter,
  style
}: {
  scale: LinearScale;
  y: number;
  formatter?: (value: number) => string;
  style?: AxisStyle;
}) {
  const merged = { ...defaults, ...style };
  return (
    <g aria-hidden="true">
      <line x1={scale.range[0]} x2={scale.range[1]} y1={y} y2={y} stroke={merged.axisColor} />
      {scale.ticks.map((tick) => (
        <g key={tick} transform={`translate(${scale.scale(tick)} ${y})`}>
          <line x1={0} x2={0} y1={0} y2={4} stroke={merged.axisColor} />
          <text
            x={0}
            y={12}
            dy="0.72em"
            textAnchor="middle"
            fill={merged.tickColor}
            fontFamily={merged.fontFamily}
            fontSize={merged.fontSize}
            fontWeight={500}
          >
            {formatter ? formatter(tick) : tick}
          </text>
        </g>
      ))}
    </g>
  );
}

export function GridColumns({ scale, y1, y2, style }: { scale: LinearScale; y1: number; y2: number; style?: AxisStyle }) {
  const merged = { ...defaults, ...style };
  return (
    <g aria-hidden="true">
      {scale.ticks.map((tick) => (
        <line key={tick} x1={scale.scale(tick)} x2={scale.scale(tick)} y1={y1} y2={y2} stroke={merged.gridColor} strokeDasharray="3 4" strokeWidth={1} />
      ))}
    </g>
  );
}

export function AxisBottom({
  scale,
  y,
  formatter,
  style,
  tickCount
}: {
  scale: CategoryScale;
  y: number;
  formatter?: (value: string) => string;
  style?: AxisStyle;
  tickCount?: number;
}) {
  const merged = { ...defaults, ...style };
  const totalLabels = scale.labels.length;

  // Thin labels if tickCount is provided or if there are too many labels for the width
  const rangeWidth = Math.abs(scale.range[1] - scale.range[0]);
  const maxTicks = tickCount && tickCount > 0 ? tickCount : Math.max(2, Math.floor(rangeWidth / 55));
  const step = totalLabels > maxTicks ? Math.ceil(totalLabels / maxTicks) : 1;

  const visibleIndices = new Set<number>();
  for (let i = 0; i < totalLabels; i += step) {
    visibleIndices.add(i);
  }
  // Ensure the last label is also represented if there's enough space
  if (totalLabels > 1 && !visibleIndices.has(totalLabels - 1)) {
    const lastVisible = Math.max(0, Math.floor((totalLabels - 1) / step) * step);
    if (totalLabels - 1 - lastVisible >= Math.floor(step / 2)) {
      visibleIndices.add(totalLabels - 1);
    }
  }

  return (
    <g aria-hidden="true">
      <line x1={scale.range[0]} x2={scale.range[1]} y1={y} y2={y} stroke={merged.axisColor} />
      {scale.labels.map((label, i) => {
        if (!visibleIndices.has(i)) return null;
        return (
          <g key={`${label}-${i}`} transform={`translate(${scale.center(label, i)} ${y})`}>
            <line x1={0} x2={0} y1={0} y2={4} stroke={merged.axisColor} />
            <text
              x={0}
              y={12}
              dy="0.72em"
              textAnchor="middle"
              fill={merged.tickColor}
              fontFamily={merged.fontFamily}
              fontSize={merged.fontSize}
              fontWeight={500}
            >
              {formatter ? formatter(label) : label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
