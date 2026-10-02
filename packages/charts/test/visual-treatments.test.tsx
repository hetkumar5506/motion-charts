import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { BarChart, DonutChart, LineChart, MultiLineChart, Sparkline, animationPresets } from "../src";

const data = [
  { month: "Jan", value: 24, secondary: 18 },
  { month: "Feb", value: 42, secondary: 31 },
  { month: "Mar", value: 35, secondary: 47 }
];

describe("kinetic visual treatments", () => {
  it("ships the high-visual motion presets", () => {
    expect(animationPresets.silky.type).toBe("tween");
    expect(animationPresets.lively.type).toBe("spring");
    expect(animationPresets.cinematic.type).toBe("tween");
  });

  it("renders gradient paths and area-depth controls without invalid SVG", () => {
    const line = renderToString(
      <LineChart
        data={data}
        xKey="month"
        yKey="value"
        showArea
        showPoints
        strokeVariant="gradient"
        gradientToColor="#7c3aed"
        areaOpacity={0.24}
        pointVariant="halo"
        animation={{ entrance: "rise", preset: "silky" }}
      />
    );
    const multi = renderToString(
      <MultiLineChart
        data={data}
        xKey="month"
        series={[{ id: "value", yKey: "value", showArea: true }, { id: "secondary", yKey: "secondary" }]}
        strokeVariant="gradient"
        areaOpacity={0.2}
        animation={{ entrance: "pop", preset: "lively" }}
      />
    );
    const sparkline = renderToString(
      <Sparkline
        data={data}
        xKey="month"
        yKey="value"
        showArea
        strokeVariant="gradient"
        gradientToColor="#7c3aed"
        areaOpacity={0.3}
        animation={{ entrance: "rise", preset: "cinematic" }}
      />
    );

    for (const html of [line, multi, sparkline]) {
      expect(html).toContain("linearGradient");
      expect(html).toMatch(/stroke="url\(#.+-stroke\)"/);
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
    }
    expect(line).toContain("#7c3aed");
    expect(sparkline).toContain("#7c3aed");
  });

  it("renders glass gradients for bars and donut slices", () => {
    const bars = renderToString(
      <BarChart
        data={data}
        xKey="month"
        yKey="value"
        barVariant="glass"
        animation={{ entrance: "pop", preset: "lively" }}
      />
    );
    const donut = renderToString(
      <DonutChart
        data={data}
        labelKey="month"
        valueKey="value"
        sliceVariant="glass"
        animation={{ entrance: "pop", preset: "lively" }}
      />
    );

    for (const html of [bars, donut]) {
      expect(html).toContain('stop-color="#ffffff"');
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});
