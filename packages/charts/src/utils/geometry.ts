export type Point = { x: number; y: number };
export type ArcSlice = {
  startAngle: number;
  endAngle: number;
  value: number;
  percent: number;
};

export function linePath(
  points: readonly (Point | null | undefined)[],
  curve: "linear" | "smooth" = "smooth",
  connectNulls = true
): string {
  if (connectNulls) {
    const validPoints = points.filter((p): p is Point => !!p && Number.isFinite(p.x) && Number.isFinite(p.y));
    return buildContinuousLinePath(validPoints, curve);
  }

  // Split into contiguous non-null segments
  const segments: Point[][] = [];
  let currentSegment: Point[] = [];

  for (const p of points) {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      currentSegment.push(p);
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments.map((seg) => buildContinuousLinePath(seg, curve)).filter(Boolean).join(" ");
}

function buildContinuousLinePath(validPoints: readonly Point[], curve: "linear" | "smooth" = "smooth"): string {
  if (validPoints.length === 0) return "";
  const first = validPoints[0];
  if (!first) return "";
  if (validPoints.length === 1) return `M ${first.x} ${first.y}`;
  if (curve === "linear") return validPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  const commands = [`M ${first.x} ${first.y}`];
  for (let index = 0; index < validPoints.length - 1; index += 1) {
    const p0 = validPoints[Math.max(0, index - 1)] ?? first;
    const p1 = validPoints[index] ?? first;
    const p2 = validPoints[index + 1] ?? p1;
    const p3 = validPoints[Math.min(validPoints.length - 1, index + 2)] ?? p2;
    const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    commands.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`);
  }
  return commands.join(" ");
}

export function areaPath(
  points: readonly (Point | null | undefined)[],
  baselineY: number,
  curve: "linear" | "smooth" = "smooth",
  connectNulls = true
): string {
  if (!Number.isFinite(baselineY)) return "";

  if (connectNulls) {
    const validPoints = points.filter((p): p is Point => !!p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (validPoints.length === 0) return "";
    const first = validPoints[0];
    const last = validPoints[validPoints.length - 1];
    if (!first || !last) return "";
    return `${buildContinuousLinePath(validPoints, curve)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }

  // Split into contiguous non-null segments
  const segments: Point[][] = [];
  let currentSegment: Point[] = [];

  for (const p of points) {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      currentSegment.push(p);
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments
    .map((seg) => {
      if (seg.length === 0) return "";
      const first = seg[0];
      const last = seg[seg.length - 1];
      if (!first || !last) return "";
      return `${buildContinuousLinePath(seg, curve)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
    })
    .filter(Boolean)
    .join(" ");
}

export function pieSlices(values: readonly number[], padAngle = 0): readonly ArcSlice[] {
  // Treat invalid input the same as an empty slice. This keeps the exported
  // geometry helper safe even when it is used without DonutChart's accessors.
  const positive = values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const nonZeroCount = positive.filter(Boolean).length;
  // If only 1 slice, no padding needed/allowed
  if (nonZeroCount <= 1) {
    let cursor = -Math.PI / 2;
    return positive.map((value) => {
      if (value === 0) return { startAngle: cursor, endAngle: cursor, value, percent: 0 };
      const startAngle = cursor;
      const endAngle = cursor + Math.PI * 2;
      cursor = endAngle;
      return { startAngle, endAngle, value, percent: 1 };
    });
  }

  const safePad = Number.isFinite(padAngle) ? Math.max(0, padAngle) : 0;
  const totalPad = Math.min(safePad * nonZeroCount, Math.PI * 1.5);
  const effectivePad = totalPad / nonZeroCount;
  const available = Math.PI * 2 - totalPad;
  let cursor = -Math.PI / 2;

  return positive.map((value) => {
    if (value === 0) return { startAngle: cursor, endAngle: cursor, value, percent: 0 };
    const angle = (value / total) * available;
    // Guard against pad exceeding slice width to prevent inverted slices
    const pad = Math.min(effectivePad, angle * 0.8);
    const startAngle = cursor + pad / 2;
    const endAngle = cursor + angle + effectivePad - pad / 2;
    cursor += angle + effectivePad;
    return { startAngle, endAngle, value, percent: value / total };
  });
}

export function arcPath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  if (
    ![cx, cy, innerRadius, outerRadius, startAngle, endAngle].every(Number.isFinite) ||
    outerRadius <= 0 ||
    endAngle === startAngle
  ) {
    return "";
  }

  const safeOuterRadius = Math.max(0, outerRadius);
  const safeInnerRadius = Math.min(safeOuterRadius, Math.max(0, innerRadius));
  const clockwise = endAngle > startAngle;
  const sweep = clockwise ? 1 : 0;
  const angleDelta = Math.abs(endAngle - startAngle);
  const isFullCircle = angleDelta >= Math.PI * 2 - 0.001;

  if (isFullCircle) {
    const outerOppositeY = cy + safeOuterRadius;
    const outerStartY = cy - safeOuterRadius;
    const innerOppositeY = cy + safeInnerRadius;
    const innerStartY = cy - safeInnerRadius;
    const innerSweep = clockwise ? 0 : 1;

    if (safeInnerRadius <= 0) {
      // Full pie / solid circle: two half-circle arcs are valid SVG geometry.
      return [
        `M ${cx} ${outerStartY}`,
        `A ${safeOuterRadius} ${safeOuterRadius} 0 1 ${sweep} ${cx} ${outerOppositeY}`,
        `A ${safeOuterRadius} ${safeOuterRadius} 0 1 ${sweep} ${cx} ${outerStartY}`,
        "Z"
      ].join(" ");
    }

    // Full donut rings need separate closed subpaths because SVG arcs cannot
    // represent a complete circle with a single command.
    return [
      `M ${cx} ${outerStartY}`,
      `A ${safeOuterRadius} ${safeOuterRadius} 0 1 ${sweep} ${cx} ${outerOppositeY}`,
      `A ${safeOuterRadius} ${safeOuterRadius} 0 1 ${sweep} ${cx} ${outerStartY}`,
      "Z",
      `M ${cx} ${innerStartY}`,
      `A ${safeInnerRadius} ${safeInnerRadius} 0 1 ${innerSweep} ${cx} ${innerOppositeY}`,
      `A ${safeInnerRadius} ${safeInnerRadius} 0 1 ${innerSweep} ${cx} ${innerStartY}`,
      "Z"
    ].join(" ");
  }

  const safeDelta = Math.min(angleDelta, Math.PI * 2 - 0.0001);
  const safeEnd = startAngle + (clockwise ? safeDelta : -safeDelta);
  const outerStart = polar(cx, cy, safeOuterRadius, startAngle);
  const outerEnd = polar(cx, cy, safeOuterRadius, safeEnd);
  const innerStart = polar(cx, cy, safeInnerRadius, startAngle);
  const innerEnd = polar(cx, cy, safeInnerRadius, safeEnd);
  const largeArc = safeDelta > Math.PI ? 1 : 0;

  if (safeInnerRadius <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${safeOuterRadius} ${safeOuterRadius} 0 ${largeArc} ${sweep} ${outerEnd.x} ${outerEnd.y}`,
      "Z"
    ].join(" ");
  }

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${safeOuterRadius} ${safeOuterRadius} 0 ${largeArc} ${sweep} ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${safeInnerRadius} ${safeInnerRadius} 0 ${largeArc} ${sweep === 1 ? 0 : 1} ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
}

export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100
  };
}
