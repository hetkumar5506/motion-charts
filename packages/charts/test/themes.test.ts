import { describe, expect, it } from "vitest";
import { animationPresets, chartPalettes, chartThemes, resolveChartTheme } from "../src";

describe("themes and presets", () => {
  it("ships enough palettes for product styling", () => {
    expect(Object.keys(chartPalettes).length).toBeGreaterThanOrEqual(10);
    expect(chartPalettes.aurora.length).toBeGreaterThanOrEqual(6);
  });

  it("resolves named themes and lets explicit colors win", () => {
    expect(resolveChartTheme("midnight").colors).toEqual(chartThemes.midnight.colors);
    expect(resolveChartTheme("ocean", ["#000", "#fff"]).colors).toEqual(["#000", "#fff"]);
  });

  it("supports partial theme overrides", () => {
    const theme = resolveChartTheme({ palette: "fire", textColor: "#111" });
    expect(theme.colors).toEqual(chartPalettes.fire);
    expect(theme.textColor).toBe("#111");
  });

  it("exports motion presets", () => {
    expect(animationPresets.bouncy.type).toBe("spring");
    expect(animationPresets.calm.type).toBe("tween");
  });
});
