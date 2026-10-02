import { describe, expect, it } from "vitest";
import { chartPalettes, chartThemes, getContrastRatio, paletteColors, resolveChartTheme, type ChartThemeName } from "../src";

const builtInThemePalettes: Record<ChartThemeName, keyof typeof chartPalettes> = {
  aurora: "aurora",
  midnight: "cyber",
  candy: "candy",
  ocean: "ocean",
  sunset: "sunset",
  minimal: "graphite"
};

describe("theme integrity", () => {
  it("keeps every palette above the contrast gate on both supported surfaces", () => {
    for (const palette of Object.keys(chartPalettes) as Array<keyof typeof chartPalettes>) {
      for (const color of paletteColors(palette, "light") ?? []) {
        expect(getContrastRatio(color, "#ffffff"), `${palette} light ${color}`).toBeGreaterThanOrEqual(2.5);
      }
      for (const color of paletteColors(palette, "dark") ?? []) {
        expect(getContrastRatio(color, "#0f172a"), `${palette} dark ${color}`).toBeGreaterThanOrEqual(2.5);
      }
    }
  });

  it("never recalibrates a light-surface color that already clears the gate", () => {
    expect(paletteColors(["#8e959e", "#24946b", "#2563eb"], "light")).toEqual(["#8e959e", "#24946b", "#2563eb"]);
    expect(paletteColors("graphite", "light")?.[5]).toBe("#8e959e");
    expect(paletteColors("emerald", "light")?.[5]).toBe("#24946b");
  });

  it("keeps named themes aligned with their surface-adjusted palettes and readable tokens", () => {
    for (const name of Object.keys(chartThemes) as ChartThemeName[]) {
      const theme = resolveChartTheme(name);
      expect(theme.colors).toEqual(paletteColors(builtInThemePalettes[name], theme.surface));
      expect(getContrastRatio(theme.textColor, theme.surfaceColor), `${name} text`).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.tickColor, theme.surfaceColor), `${name} ticks`).toBeGreaterThanOrEqual(3);
    }

    expect(resolveChartTheme("ocean").colors).toContain("#058ea5");
  });
});
