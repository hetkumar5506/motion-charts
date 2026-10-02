import React from "react";
import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { animationPresets, chartPalettes, chartThemes, getContrastRatio, paletteColors, resolveChartTheme, useChartTheme } from "../src";

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

  it("supports extending a named theme via base", () => {
    const extended = resolveChartTheme({ base: "midnight", gridColor: "#f00" });
    expect(extended.textColor).toBe("#f8fafc");
    expect(extended.gridColor).toBe("#f00");
    expect(extended.axisColor).toBe(chartThemes.midnight.axisColor);
  });

  it("respects colors over palette in theme override", () => {
    const theme = resolveChartTheme({ colors: ["#111"], palette: "cyber" });
    expect(theme.colors).toEqual(["#111"]);
  });

  it("provides contrast-safe text and tooltip tokens for every surface", () => {
    for (const theme of Object.values(chartThemes)) {
      expect(getContrastRatio(theme.textColor, theme.surfaceColor)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(theme.mutedTextColor, theme.surfaceColor)).toBeGreaterThanOrEqual(3);
      expect(getContrastRatio(String(theme.tooltipStyle.color), String(theme.tooltipStyle.background))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("provides usable palette colors on both explicit surfaces", () => {
    for (const name of Object.keys(chartPalettes) as Array<keyof typeof chartPalettes>) {
      const light = paletteColors(name, "light")!;
      const dark = paletteColors(name, "dark")!;
      expect(light).toHaveLength(chartPalettes[name].length);
      expect(dark).toHaveLength(chartPalettes[name].length);
      for (const color of light) expect(getContrastRatio(color, "#ffffff")).toBeGreaterThanOrEqual(2);
      for (const color of dark) expect(getContrastRatio(color, "#0f172a")).toBeGreaterThanOrEqual(2.5);
    }
  });

  it("keeps auto resolution deterministic for SSR", () => {
    expect(resolveChartTheme("auto").surface).toBe("light");
    expect(resolveChartTheme("auto").colors).toEqual(chartThemes.aurora.colors);
  });

  it("follows live prefers-color-scheme changes after the SSR-safe first render", async () => {
    let matches = false;
    let listener: (() => void) | undefined;
    const previousWindow = (globalThis as { window?: unknown }).window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: () => ({
          get matches() { return matches; },
          addEventListener: (_event: string, next: () => void) => { listener = next; },
          removeEventListener: () => undefined
        })
      }
    });
    function Probe() {
      const theme = useChartTheme("auto");
      return React.createElement("span", null, theme.surface);
    }
    try {
      let renderer!: ReturnType<typeof create>;
      await act(async () => { renderer = create(React.createElement(Probe)); });
      expect(renderer.root.findByType("span").children).toEqual(["light"]);
      matches = true;
      await act(async () => { listener?.(); });
      expect(renderer.root.findByType("span").children).toEqual(["dark"]);
      renderer.unmount();
    } finally {
      if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window;
      else Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    }
  });

  it("exports motion presets and animationPreset resolver", () => {
    expect(animationPresets.bouncy.type).toBe("spring");
    expect(animationPresets.calm.type).toBe("tween");
  });
});
