import { describe, expect, it } from "vitest";
import { arcPath, areaPath, linePath, pieSlices } from "../src/utils/geometry";

describe("geometry", () => {
  it("creates linear and smooth line paths", () => {
    expect(linePath([{ x: 0, y: 0 }, { x: 10, y: 10 }], "linear")).toBe("M 0 0 L 10 10");
    expect(linePath([{ x: 0, y: 0 }, { x: 10, y: 10 }], "smooth")).toContain("C");
  });

  it("closes area paths to the baseline", () => {
    expect(areaPath([{ x: 0, y: 5 }, { x: 10, y: 1 }], 20, "linear")).toBe("M 0 5 L 10 1 L 10 20 L 0 20 Z");
  });

  it("creates pie slices that sum to one", () => {
    const slices = pieSlices([1, 3]);
    expect(slices).toHaveLength(2);
    expect(slices[0]?.percent).toBeCloseTo(0.25);
    expect(slices[1]?.percent).toBeCloseTo(0.75);
  });

  it("handles high padAngle without slice inversion or >2pi overshoot", () => {
    const slices = pieSlices([10, 20, 30], 1.2);
    for (const slice of slices) {
      expect(slice.endAngle).toBeGreaterThanOrEqual(slice.startAngle);
    }
    const last = slices[slices.length - 1];
    expect(last?.endAngle).toBeLessThanOrEqual(Math.PI * 1.5 + 0.1);
  });

  it("creates an svg arc path", () => {
    expect(arcPath(50, 50, 20, 40, -Math.PI / 2, 0)).toContain("A 40 40");
  });

  it("sanitizes invalid pie values and arc inputs", () => {
    expect(pieSlices([1, Number.NaN, Number.POSITIVE_INFINITY, 3])).toHaveLength(4);
    expect(pieSlices([1, Number.NaN, Number.POSITIVE_INFINITY, 3]).every((slice) => Number.isFinite(slice.endAngle))).toBe(true);
    expect(arcPath(50, 50, 20, Number.NaN, 0, 1)).toBe("");
    expect(arcPath(50, 50, 20, 40, 1, 0)).not.toContain("NaN");
  });

  it("handles full circle 360 degree pie and donut arcs without degenerate geometry", () => {
    const fullPie = arcPath(50, 50, 0, 40, -Math.PI / 2, Math.PI * 1.5);
    expect(fullPie).toContain("A 40 40");
    expect(fullPie).toContain("Z");
    expect(fullPie).not.toContain("NaN");

    const fullDonut = arcPath(50, 50, 20, 40, -Math.PI / 2, Math.PI * 1.5);
    expect(fullDonut).toContain("A 40 40");
    expect(fullDonut).toContain("A 20 20");
    expect(fullDonut).toContain("Z");
    expect(fullDonut).not.toContain("NaN");
  });
});
