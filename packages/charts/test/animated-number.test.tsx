import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnimatedNumber, BarChart } from "../src";

describe("AnimatedNumber and count-up labels", () => {
  it("SSR renders the final formatted value", () => {
    const html = renderToString(<AnimatedNumber value={8420} format={(value) => `$${value.toLocaleString("en-US")}`} />);
    expect(html).toContain("$8,420");
    expect(html).not.toContain("NaN");
  });

  it("supports opt-out count-up labels without changing the final value", () => {
    const html = renderToString(
      <BarChart
        data={[{ label: "A", value: 42 }]}
        xKey="label"
        yKey="value"
        showValues={{ countUp: false }}
      />
    );
    expect(html).toContain(">42<");
  });
});
