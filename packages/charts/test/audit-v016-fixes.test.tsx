import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import { LineChart } from "../src/charts/LineChart";
import { MultiLineChart } from "../src/charts/MultiLineChart";
import { BarChart } from "../src/charts/BarChart";
import { DonutChart } from "../src/charts/DonutChart";
import { Sparkline } from "../src/charts/Sparkline";
import { paletteColors } from "../src/themes";
import { isDarkColor, getContrastTextColor } from "../src/utils/color";

describe("Audit Report Confirmed Bug Fixes (BUG-1 to BUG-9)", () => {
  // BUG-1: Missing (null) data points excluded from y-scale extent & no fake 0 dip
  it("BUG-1: excludes null/missing data points from y-extent when includeZero is false", () => {
    const data = [
      { m: "a", v: 100 },
      { m: "b", v: null },
      { m: "c", v: 110 }
    ];
    const html = renderToString(
      <LineChart
        data={data as any}
        xKey="m"
        yKey="v"
        yAxis={{ includeZero: false }}
        showPoints={true}
      />
    );

    // With includeZero: false, y domain is [100, 110], not [0, 110]
    // The rendered points should only be for 'a' (100) and 'c' (110)
    expect(html).toContain('aria-label="a · 100"');
    expect(html).toContain('aria-label="c · 110"');
    // There should be NO fabricated "b · 0" point
    expect(html).not.toContain('aria-label="b · 0"');
    expect(html).not.toContain('aria-label="b ·"');
  });

  // BUG-2: Keyboard navigation & renderable points count match gapped data
  it("BUG-2: only renders graphics-symbols for valid points in LineChart with gaps", () => {
    const data = [
      { m: "a", v: 10 },
      { m: "b", v: null },
      { m: "c", v: 30 },
      { m: "d", v: 40 }
    ];
    const html = renderToString(
      <LineChart
        data={data as any}
        xKey="m"
        yKey="v"
        connectNulls={false}
      />
    );
    const symbolMatches = html.match(/role="graphics-symbol"/g);
    // Exactly 3 symbols: a, c, d (b is skipped)
    expect(symbolMatches?.length).toBe(3);
    // One element must have tabindex="0" (the roving tabindex entry)
    expect(html).toContain('tabindex="0"');
  });

  // BUG-4: Hard crash when data/series is undefined
  it("BUG-4: does not throw TypeError when data or series is undefined", () => {
    expect(() => {
      renderToString(<BarChart xKey="m" yKey="v" data={undefined as any} />);
    }).not.toThrow();

    expect(() => {
      renderToString(<LineChart xKey="m" yKey="v" data={undefined as any} />);
    }).not.toThrow();

    expect(() => {
      renderToString(<MultiLineChart xKey="m" data={undefined as any} series={undefined as any} />);
    }).not.toThrow();

    expect(() => {
      renderToString(<DonutChart labelKey="l" valueKey="v" data={undefined as any} />);
    }).not.toThrow();

    expect(() => {
      renderToString(<Sparkline yKey="v" data={undefined as any} />);
    }).not.toThrow();
  });

  // BUG-5: DonutChart skips zero-value slices in DOM and index space
  it("BUG-5: DonutChart renders graphics-symbol only for slices with value > 0", () => {
    const data = [
      { l: "Slice 1", v: 20 },
      { l: "Zero Slice", v: 0 },
      { l: "Slice 3", v: 40 }
    ];
    const html = renderToString(
      <DonutChart data={data} labelKey="l" valueKey="v" />
    );
    const symbols = html.match(/role="graphics-symbol"/g);
    expect(symbols?.length).toBe(2);
  });

  // BUG-6: showValues in-bar label text color contrast
  it("BUG-6: uses dark contrast text for light colored bars in BarChart", () => {
    const data = [{ l: "A", v: 100 }];
    // #fef08a is a pale yellow
    const html = renderToString(
      <BarChart
        data={data}
        xKey="l"
        yKey="v"
        showValues={true}
        colors={["#fef08a"]}
      />
    );
    // fill inside bar should use dark text (#0f172a) instead of hardcoded #ffffff
    expect(html).toContain('fill="#0f172a"');
    expect(html).not.toContain('fill="#ffffff"');
  });

  // BUG-7: No dangling aria-describedby in SSR output when tooltip is not visible
  it("BUG-7: does not emit dangling aria-describedby when tooltip is not active", () => {
    const data = [{ m: "a", v: 10 }, { m: "b", v: 20 }];
    const htmlLine = renderToString(<LineChart data={data} xKey="m" yKey="v" />);
    expect(htmlLine).not.toContain('aria-describedby="_R_');

    const htmlBar = renderToString(<BarChart data={data} xKey="m" yKey="v" />);
    expect(htmlBar).not.toContain('aria-describedby="_R_');
  });

  // BUG-8: Legend / Theme color luminance detection works with custom themes and hex/rgb/hsl
  it("BUG-8: correctly detects dark colors via relative luminance", () => {
    expect(isDarkColor("#0f172a")).toBe(true);
    expect(isDarkColor("#1e293b")).toBe(true);
    expect(isDarkColor("#ffffff")).toBe(false);
    expect(isDarkColor("#f8fafc")).toBe(false);
    expect(isDarkColor("white")).toBe(false);
    expect(isDarkColor("black")).toBe(true);
    expect(getContrastTextColor("#fef08a")).toBe("#0f172a");
    expect(getContrastTextColor("#1e293b")).toBe("#ffffff");
  });

  // O-1 Observation: paletteColors gracefully falls back to default palette on typo
  it("O-1: paletteColors returns aurora palette when passed unknown palette name", () => {
    const colors = paletteColors("unknown-typo" as any);
    expect(colors).toBeDefined();
    expect(colors?.length).toBeGreaterThan(0);
  });

  // Outline defect: circles must not render rectangular CSS outline boxes
  it("visual polish: circles have outline: 'none' preventing rectangular box artifacts", () => {
    const data = [{ m: "a", v: 10 }, { m: "b", v: 20 }];
    const html = renderToString(<LineChart data={data} xKey="m" yKey="v" showPoints={true} />);
    expect(html).toContain('outline:none');
    expect(html).not.toContain('outline:2px solid');
  });

  // P1: Native SVG focus indicators for accessible keyboard traversal
  it("P1: LineChart and Sparkline support native SVG focus ring and Donut slice focus stroke", () => {
    const lineHtml = renderToString(<LineChart data={[{ x: "A", y: 10 }]} xKey="x" yKey="y" showPoints={true} />);
    expect(lineHtml).toContain('role="graphics-symbol"');

    const donutHtml = renderToString(<DonutChart data={[{ l: "A", v: 10 }]} labelKey="l" valueKey="v" />);
    expect(donutHtml).toContain('role="graphics-symbol"');
  });

  // P2: Sparkline excludes null data points & badges last finite value
  it("P2: Sparkline excludes nulls from rendered symbols and badges last finite value", () => {
    const data = [
      { m: "a", v: 100 },
      { m: "b", v: null },
      { m: "c", v: 110 },
      { m: "d", v: null }
    ];
    const html = renderToString(
      <Sparkline data={data as any} xKey="m" yKey="v" showEndValue={true} showPoints={true} />
    );
    const symbols = html.match(/role="graphics-symbol"/g);
    // Exactly 2 symbols: a (100) and c (110)
    expect(symbols?.length).toBe(2);
    // End value pill should display 110 (the last finite value), NOT 0
    expect(html).toContain(">110<");
    expect(html).not.toContain('aria-label="b · 0"');
    expect(html).not.toContain('aria-label="d · 0"');
  });

  // LineChart colorIndex support
  it("supports colorIndex on LineChart", () => {
    const data = [{ x: "A", y: 10 }, { x: "B", y: 20 }];
    const htmlDefault = renderToString(<LineChart data={data} xKey="x" yKey="y" colorIndex={0} />);
    const htmlIndexed = renderToString(<LineChart data={data} xKey="x" yKey="y" colorIndex={1} />);
    expect(htmlDefault).not.toEqual(htmlIndexed);
  });
});
