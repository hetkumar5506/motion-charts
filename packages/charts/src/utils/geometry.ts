export type Point = { x: number; y: number };
export type ArcSlice = {
  startAngle: number;
  endAngle: number;
  value: number;
  percent: number;
};

export function linePath(points: readonly Point[], curve: "linear" | "smooth" = "smooth"): string {
  if (points.length === 0) return "";
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;
  if (curve === "linear") return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  const commands = [`M ${first.x} ${first.y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)] ?? first;
    const p1 = points[index] ?? first;
    const p2 = points[index + 1] ?? p1;
    const p3 = points[Math.min(points.length - 1, index + 2)] ?? p2;
    const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    commands.push(`C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`);
  }
  return commands.join(" ");
}

export function areaPath(points: readonly Point[], baselineY: number, curve: "linear" | "smooth" = "smooth"): string {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return "";
  return `${linePath(points, curve)} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function pieSlices(values: readonly number[], padAngle = 0): readonly ArcSlice[] {
  const positive = values.map((value) => Math.max(0, value));
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return [];

  const safePad = Math.max(0, padAngle);
  const totalPad = Math.min(safePad * positive.filter(Boolean).length, Math.PI * 1.5);
  const available = Math.PI * 2 - totalPad;
  let cursor = -Math.PI / 2;

  return positive.map((value) => {
    if (value === 0) return { startAngle: cursor, endAngle: cursor, value, percent: 0 };
    const angle = (value / total) * available;
    const startAngle = cursor + safePad / 2;
    const endAngle = cursor + angle - safePad / 2;
    cursor += angle + safePad;
    return { startAngle, endAngle, value, percent: value / total };
  });
}

export function arcPath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  if (outerRadius <= 0 || !Number.isFinite(cx) || !Number.isFinite(cy)) return "";

  const angleDelta = Math.abs(endAngle - startAngle);
  const isFullCircle = angleDelta >= Math.PI * 2 - 0.001;

  if (isFullCircle) {
    if (innerRadius <= 0) {
      // Full pie / solid circle: two half-circle arcs
      return [
        `M ${cx} ${cy - outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius}`,
        "Z"
      ].join(" ");
    }
    // Full donut ring: outer circle clockwise, inner circle counter-clockwise
    return [
      `M ${cx} ${cy - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius}`,
      `M ${cx} ${cy - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy + innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius}`,
      "Z"
    ].join(" ");
  }

  const safeEnd = Math.min(endAngle, startAngle + Math.PI * 2 - 0.0001);
  const outerStart = polar(cx, cy, outerRadius, startAngle);
  const outerEnd = polar(cx, cy, outerRadius, safeEnd);
  const innerStart = polar(cx, cy, innerRadius, startAngle);
  const innerEnd = polar(cx, cy, innerRadius, safeEnd);
  const largeArc = safeEnd - startAngle > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      "Z"
    ].join(" ");
  }

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z"
  ].join(" ");
}

export function polar(cx: number, cy: number, radius: number, angle: number): Point {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
}
