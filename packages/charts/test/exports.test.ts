import { describe, expect, it } from "vitest";
import { BarChart, DonutChart, LineChart, MultiLineChart, ResponsiveChart, Sparkline } from "../src";

describe("public exports", () => {
  it("exports the chart components used by dashboards", () => {
    expect(typeof BarChart).toBe("function");
    expect(typeof LineChart).toBe("function");
    expect(typeof MultiLineChart).toBe("function");
    expect(typeof DonutChart).toBe("function");
    expect(typeof Sparkline).toBe("function");
    expect(typeof ResponsiveChart).toBe("function");
  });
});
