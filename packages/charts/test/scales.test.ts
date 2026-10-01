import { describe, expect, it } from "vitest";
import { createCategoryScale, createLinearScale, extent, niceTicks } from "../src/utils/scales";

describe("scales", () => {
  it("creates a zero-inclusive extent", () => {
    expect(extent([4, 8, 2])).toEqual([0, 8]);
    expect(extent([-4, 8])).toEqual([-4, 8]);
  });

  it("handles empty or flat data", () => {
    expect(extent([])).toEqual([0, 1]);
    expect(extent([0, 0], true)).toEqual([0, 1]);
    const flat = extent([5, 5]);
    expect(flat[0]).toBeLessThan(5);
    expect(flat[1]).toBeGreaterThan(5);
    // Non-zero line charts
    const nonZero = extent([1000, 1010, 1005], false);
    expect(nonZero[0]).toBe(1000);
    expect(nonZero[1]).toBe(1010);
  });

  it("handles large datasets and extreme finite domains without spreading or NaN", () => {
    const large = Array.from({ length: 200_000 }, (_, index) => index - 100_000);
    expect(extent(large, false)).toEqual([-100_000, 99_999]);

    const extreme = createLinearScale([-Number.MAX_VALUE, Number.MAX_VALUE], [100, 0]);
    expect(extreme.ticks.every(Number.isFinite)).toBe(true);
    expect(extreme.scale(-Number.MAX_VALUE)).toBe(100);
    expect(extreme.scale(Number.MAX_VALUE)).toBe(0);
    expect(extreme.scale(0)).toBe(50);

    const flatExtreme = createLinearScale([Number.MAX_VALUE, Number.MAX_VALUE], [100, 0]);
    expect(flatExtreme.domain.every(Number.isFinite)).toBe(true);
    expect(flatExtreme.scale(Number.MAX_VALUE)).toBe(0);
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

  it("handles duplicate labels with index fallback", () => {
    const duplicateScale = createCategoryScale(["Mon", "Mon", "Tue"], [0, 90], 0);
    expect(duplicateScale.labels).toHaveLength(3);
    expect(duplicateScale.center("Mon", 0)).toBe(15);
    expect(duplicateScale.center("Mon", 1)).toBe(45);
    expect(duplicateScale.center("Tue", 2)).toBe(75);
  });
});
