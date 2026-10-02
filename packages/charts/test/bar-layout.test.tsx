import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { BarChart } from "../src";

describe("BarChart layouts", () => {
  it("renders horizontal bars from a shared zero baseline", () => {
    const html = renderToString(
      <BarChart
        data={[{ label: "Positive", value: 80 }, { label: "Negative", value: -40 }]}
        xKey="label"
        yKey="value"
        layout="horizontal"
        width={600}
        height={320}
        yAxis={{ zeroLine: true }}
      />
    );
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
    expect(html).toContain("Positive");
    expect(html).toContain("Negative");
    const bars = [...html.matchAll(/<rect[^>]*role="graphics-symbol"[^>]*>/g)].map((match) => match[0]);
    expect(bars).toHaveLength(2);
    expect(bars.every((bar) => bar.includes("width="))).toBe(true);
    expect(html).toContain("transform-origin");
  });

  it("uses showValues.formatter for value labels without changing tooltip or axis formatting", () => {
    const html = renderToString(
      <BarChart
        data={[{ month: "March", revenue: 42000 }]}
        xKey="month"
        yKey="revenue"
        valueFormatter={(value) => `$${value.toLocaleString()}`}
        showValues={{ formatter: (value) => `$${Math.round(value / 1000)}k` }}
        animation={{ disabled: true }}
      />
    );
    expect(html).toContain("$42k");
    expect(html).toContain("$42,000");
  });

  it("computes grouped and stacked series without invalid geometry", () => {
    const data = [
      { month: "March", web: 12, app: 8, store: -3 },
      { month: "April", web: 20, app: 10, store: -5 }
    ];
    const series = [
      { id: "web", yKey: "web" as const, label: "Web" },
      { id: "app", yKey: "app" as const, label: "App" },
      { id: "store", yKey: "store" as const, label: "Store" }
    ];
    const grouped = renderToString(<BarChart data={data} xKey="month" series={series} seriesLayout="grouped" />);
    const stacked = renderToString(<BarChart data={data} xKey="month" series={series} seriesLayout="stacked" />);
    for (const html of [grouped, stacked]) {
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
      expect(html.match(/role="graphics-symbol"/g)).toHaveLength(6);
      expect(html).toContain("March · Web");
      expect(html).toContain("Store");
      expect(html).toContain("Chart legend");
    }
  });
});
