import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DonutChart } from "../src";

describe("Donut angle motion", () => {
  it("SSR renders final sweep geometry without invalid path data", () => {
    const html = renderToString(
      <DonutChart
        data={[{ label: "Web", value: 40 }, { label: "App", value: 60 }]}
        labelKey="label"
        valueKey="value"
        animation={{ entrance: "sweep" }}
        centerLabel="100"
      />
    );
    expect(html).toContain(">100<");
    expect(html.match(/role="graphics-symbol"/g)).toHaveLength(2);
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("continues to render complete arcs after a changed dataset", () => {
    const first = renderToString(<DonutChart data={[{ label: "A", value: 20 }, { label: "B", value: 80 }]} labelKey="label" valueKey="value" />);
    const second = renderToString(<DonutChart data={[{ label: "A", value: 80 }, { label: "B", value: 20 }]} labelKey="label" valueKey="value" />);
    expect(first).toContain('d="M');
    expect(second).toContain('d="M');
    expect(second).not.toMatch(/NaN|Infinity/);
  });

  it("renders non-sweep default entrance slices cleanly", () => {
    const html = renderToString(
      <DonutChart
        data={[{ label: "Web", value: 40 }, { label: "App", value: 60 }]}
        labelKey="label"
        valueKey="value"
      />
    );
    expect(html).toContain('role="graphics-symbol"');
    expect(html).toContain('aria-roledescription="slice"');
    expect(html).not.toMatch(/NaN|undefined/);
  });
});
