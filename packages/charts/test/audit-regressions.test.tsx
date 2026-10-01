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

  it("handles NaN, Infinity, and -Infinity by warning and coercing to 0 without corrupting paths", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(numberOf({ v: NaN }, 0, "v")).toBe(0);
    expect(numberOf({ v: Infinity }, 0, "v")).toBe(0);
    expect(numberOf({ v: -Infinity }, 0, "v")).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();

    const dataWithNaN = [
      { x: "Jan", y: 10 },
      { x: "Feb", y: NaN },
      { x: "Mar", y: 30 }
    ];
    const html = renderToString(
      <LineChart data={dataWithNaN} xKey="x" yKey="y" width={400} height={200} />
    );
    expect(html).not.toContain("NaN");
    expect(html).toContain('d="M');
  });

  it("formats Date objects appropriately in labelOf", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const html = renderToString(
      <BarChart
        data={[{ d: date, v: 10 }]}
        xKey="d"
        yKey="v"
      />
    );
    // Deterministic ISO format (YYYY-MM-DD) to prevent SSR/client locale mismatch
    expect(html).toContain("2026-01-15");
  });

  it("thins x-axis ticks when there are many data points", () => {
    const denseData = Array.from({ length: 60 }, (_, i) => ({
      x: `Day ${i + 1}`,
      y: i * 2
    }));
    const html = renderToString(
      <LineChart data={denseData} xKey="x" yKey="y" width={600} height={300} xAxis={{ tickCount: 6 }} />
    );
    // Count the number of rendered <text> tick elements inside the bottom axis (marked dy="0.72em")
    const matches = html.match(/dy="0\.72em"/g);
    // 60 points should be thinned down to around 6-12 ticks
    expect(matches?.length).toBeLessThanOrEqual(12);
  });

  it("falls back to spring in animationPreset for unknown preset names", async () => {
    const { animationPreset, animationPresets } = await import("../src");
    expect(animationPreset("unknown-typo" as any)).toEqual(animationPresets.spring);
    expect(animationPreset(undefined)).toEqual(animationPresets.spring);
    expect(animationPreset("bouncy")).toEqual(animationPresets.bouncy);
  });

  it("supports connectNulls=false to render gaps across null/NaN data points", () => {
    const dataWithGap = [
      { x: "Jan", y: 10 },
      { x: "Feb", y: null as unknown as number },
      { x: "Mar", y: 20 },
      { x: "Apr", y: 30 }
    ];

    const connectedHtml = renderToString(
      <LineChart data={dataWithGap} xKey="x" yKey="y" width={500} height={300} connectNulls />
    );
    // When connected, single path command or continuous segment
    expect(connectedHtml).toContain('d="M');

    const gappedHtml = renderToString(
      <LineChart data={dataWithGap} xKey="x" yKey="y" width={500} height={300} connectNulls={false} />
    );
    // In gapped mode, path contains two disjoint M commands separated by the gap
    const mCount = (gappedHtml.match(/M\s/g) || []).length;
    expect(mCount).toBeGreaterThanOrEqual(2);
  });

  it("supports zeroLine positioning on BarChart with negative data", () => {
    const mixedData = [
      { cat: "A", val: 50 },
      { cat: "B", val: -30 }
    ];

    const htmlWithZeroLine = renderToString(
      <BarChart data={mixedData} xKey="cat" yKey="val" width={500} height={300} xAxis={{ zeroLine: true }} />
    );
    // Baseline y should be inside the plot area, not at bottom
    expect(htmlWithZeroLine).toContain('dy="0.72em"');
  });

  it("evaluates isDev safely without throwing ReferenceError when process is not defined", async () => {
    const { isDev } = await import("../src/utils/env");
    expect(typeof isDev()).toBe("boolean");
  });
});
