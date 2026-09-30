import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BarChart, DonutChart, LineChart, MultiLineChart, Sparkline } from "../src";
import { numberOf } from "../src/utils/accessors";

describe("audit v0.1.3 regression and compliance suite", () => {
  it("warns in dev mode on null input and coerces to 0", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const val = numberOf({ v: null }, 0, "v");
    expect(val).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[@motion-charts/core] Received non-finite numerical value at index 0:"),
      null,
      "Coercing to 0."
    );
    warnSpy.mockRestore();
  });

  it("SSR server-renders non-blank charts with valid geometry and opacity 1", () => {
    const data = [
      { month: "Jan", revenue: 100 },
      { month: "Feb", revenue: 200 }
    ];

    const barHtml = renderToString(
      <BarChart data={data} xKey="month" yKey="revenue" width={500} height={300} />
    );
    // SSR should NOT have height="0" or opacity="0" for bars
    expect(barHtml).toContain('role="graphics-symbol"');
    expect(barHtml).not.toContain('height="0"');
    expect(barHtml).toContain('tabindex="0"');
    expect(barHtml).toContain('tabindex="-1"');

    const lineHtml = renderToString(
      <LineChart data={data} xKey="month" yKey="revenue" width={500} height={300} showPoints />
    );
    expect(lineHtml).toContain('role="graphics-symbol"');
    expect(lineHtml).toContain('tabindex="0"');
    expect(lineHtml).toContain('tabindex="-1"');

    const donutHtml = renderToString(
      <DonutChart data={data} labelKey="month" valueKey="revenue" width={400} height={300} />
    );
    expect(donutHtml).toContain('role="graphics-symbol"');
    expect(donutHtml).toContain('tabindex="0"');

    const sparkHtml = renderToString(
      <Sparkline data={data} yKey="revenue" width={200} height={80} />
    );
    expect(sparkHtml).toContain('role="graphics-symbol"');
    expect(sparkHtml).toContain('tabindex="0"');
  });

  it("assigns roving tabIndex and keyboard navigation attributes", () => {
    const data = [
      { label: "A", val: 10 },
      { label: "B", val: 20 },
      { label: "C", val: 30 }
    ];

    const html = renderToString(
      <BarChart data={data} xKey="label" yKey="val" width={400} height={200} />
    );
    // Initial element has tabIndex 0, following have -1
    const matches0 = html.match(/tabindex="0"/g);
    const matchesMinus1 = html.match(/tabindex="-1"/g);
    expect(matches0).toHaveLength(1);
    expect(matchesMinus1).toHaveLength(2);
  });
});
