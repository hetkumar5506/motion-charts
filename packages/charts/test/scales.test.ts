import { describe, expect, it } from "vitest";
import { createCategoryScale, createLinearScale, extent, niceTicks } from "../src/utils/scales";

describe("scales", () => {
  it("creates a zero-inclusive extent", () => {
    expect(extent([4, 8, 2])).toEqual([0, 8]);
    expect(extent([-4, 8])).toEqual([-4, 8]);
  });

  it("handles empty or flat data", () => {
    expect(extent([])).toEqual([0, 1]);
    const flat = extent([5, 5]);
    expect(flat[0]).toBeLessThan(5);
    expect(flat[1]).toBeGreaterThan(5);
  });

  it("returns readable ticks", () => {
    expect(niceTicks(0, 83, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("maps linear values into a range", () => {
    const scale = createLinearScale([0, 100], [200, 0], 5);
    expect(scale.scale(0)).toBe(200);
    expect(scale.scale(100)).toBe(0);
  });

  it("maps categories to stable centers", () => {
    const scale = createCategoryScale(["a", "b"], [0, 100], 0.2);
    expect(scale.bandwidth).toBe(40);
    expect(scale.center("a")).toBe(25);
    expect(scale.center("b")).toBe(75);
  });
});
