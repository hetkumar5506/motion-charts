import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BarChart, LineChart, MultiLineChart } from "../src";

describe("reference lines and crosshair API", () => {
  it("includes y reference values in every supported chart domain", () => {
    const data = [{ x: "A", y: 10 }, { x: "B", y: 20 }];
    for (const html of [
      renderToString(<BarChart data={data} xKey="x" yKey="y" referenceLines={[{ y: 100, label: "Target" }]} />),
      renderToString(<LineChart data={data} xKey="x" yKey="y" referenceLines={[{ y: 100, label: "Target" }]} />),
      renderToString(<MultiLineChart data={data} xKey="x" series={[{ id: "main", yKey: "y" }]} referenceLines={[{ y: 100, label: "Target" }]} />)
    ]) {
      expect(html).toContain("Target");
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
    }
  });

  it("keeps crosshair opt-in in SSR", () => {
    const off = renderToString(<LineChart data={[{ x: "A", y: 10 }]} xKey="x" yKey="y" />);
    const on = renderToString(<LineChart data={[{ x: "A", y: 10 }]} xKey="x" yKey="y" crosshair />);
    expect(off).not.toContain("stroke-dasharray=\"4 4\"");
    expect(on).not.toContain("stroke-dasharray=\"4 4\"");
  });
});
