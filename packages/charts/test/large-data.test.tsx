import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { BarChart, DonutChart, LineChart, MultiLineChart } from "../src";

const telemetry = Array.from({ length: 240 }, (_, index) => ({
  timestamp: `T${String(index + 1).padStart(3, "0")}`,
  requests: 420 + Math.round(Math.sin(index / 7) * 95) + index * 3,
  latency: 38 + Math.round(Math.cos(index / 9) * 11) + (index % 19),
  errors: Math.max(0, Math.round(Math.sin(index / 5) * 8 + 12)),
  saturation: 52 + Math.round(Math.sin(index / 13) * 16)
}));

const segments = Array.from({ length: 16 }, (_, index) => ({
  label: `Segment ${index + 1}`,
  value: 12 + ((index * 7) % 31)
}));

describe("large and complex visualization rendering", () => {
  it("keeps dense multi-series charts finite and interactive during SSR", () => {
    const html = renderToString(
      <>
        <BarChart
          data={telemetry.slice(0, 48)}
          xKey="timestamp"
          series={[
            { id: "requests", yKey: "requests", label: "Requests" },
            { id: "latency", yKey: "latency", label: "Latency" }
          ]}
          seriesLayout="grouped"
          width={960}
          height={420}
          animation={{ initial: false }}
          ariaLabel="Dense grouped telemetry comparison"
        />
        <LineChart
          data={telemetry}
          xKey="timestamp"
          yKey="requests"
          showArea
          showPoints={false}
          connectNulls={false}
          width={960}
          height={420}
          animation={{ initial: false }}
          ariaLabel="Request volume across 240 intervals"
        />
        <MultiLineChart
          data={telemetry}
          xKey="timestamp"
          series={[
            { id: "requests", yKey: "requests", label: "Requests" },
            { id: "latency", yKey: "latency", label: "Latency" },
            { id: "errors", yKey: "errors", label: "Errors" },
            { id: "saturation", yKey: "saturation", label: "Saturation" }
          ]}
          showLegend
          crosshair
          width={960}
          height={420}
          animation={{ initial: false }}
          ariaLabel="Four related telemetry signals across 240 intervals"
        />
        <DonutChart
          data={segments}
          labelKey="label"
          valueKey="value"
          showLegend
          width={520}
          height={420}
          animation={{ initial: false }}
          ariaLabel="Sixteen-way traffic segment distribution"
        />
      </>
    );

    const symbols = html.match(/role="graphics-symbol"/g) ?? [];
    expect(symbols.length).toBeGreaterThan(900);
    expect(html).toContain("Dense grouped telemetry comparison");
    expect(html).toContain("Four related telemetry signals across 240 intervals");
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });
});
