import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BarChart, DonutChart, LineChart, MultiLineChart, Sparkline } from "../src";
import { resolveChartBounds } from "../src/utils/layout";

describe("responsive layout safety", () => {
  it("fits requested margins into very narrow chart viewports", () => {
    const bounds = resolveChartBounds(40, 40, { top: 24, right: 28, bottom: 44, left: 56 });
    expect(bounds.width).toBe(40);
    expect(bounds.height).toBe(40);
    expect(bounds.innerWidth).toBeGreaterThanOrEqual(1);
    expect(bounds.innerHeight).toBeGreaterThanOrEqual(1);
    expect(bounds.left + bounds.right + bounds.innerWidth).toBeLessThanOrEqual(bounds.width + 0.000001);
    expect(bounds.top + bounds.bottom + bounds.innerHeight).toBeLessThanOrEqual(bounds.height + 0.000001);
  });

  it("never emits invalid SVG attributes for narrow or invalid dimensions", () => {
    const data = [{ label: "A", value: 10 }, { label: "B", value: 20 }];
    const elements = [
      <BarChart data={data} xKey="label" yKey="value" width={Number.NaN} height={Number.POSITIVE_INFINITY} />,
      <LineChart data={data} xKey="label" yKey="value" width={40} height={40} showArea />,
      <MultiLineChart data={data} xKey="label" series={[{ id: "value", yKey: "value" }]} width={40} height={40} showArea />,
      <DonutChart data={data} labelKey="label" valueKey="value" width={30} height={30} showLabels />,
      <Sparkline data={data} xKey="label" yKey="value" width={Number.NaN} height={Number.POSITIVE_INFINITY} showArea />
    ];

    for (const element of elements) {
      const html = renderToString(element);
      expect(html).not.toMatch(/(?:NaN|Infinity|undefined)/);
    }
  });
});
