import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LineChart, MultiLineChart, Sparkline } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function finalPaths(renderer: ReactTestRenderer) {
  return renderer.root.findAll((node) => node.type === "path" && typeof node.props.d === "string");
}

describe("line-family draw entrances", () => {
  it.each([
    ["LineChart", <LineChart data={[{ x: "A", y: 1 }, { x: "B", y: 4 }]} xKey="x" yKey="y" animation={{ entrance: "draw" }} />],
    ["MultiLineChart", <MultiLineChart data={[{ x: "A", y: 1 }, { x: "B", y: 4 }]} xKey="x" series={[{ id: "main", yKey: "y" }]} animation={{ entrance: "draw" }} />],
    ["Sparkline", <Sparkline data={[{ x: "A", y: 1 }, { x: "B", y: 4 }]} xKey="x" yKey="y" animation={{ entrance: "draw" }} />]
  ] as const)("renders a complete final path for $0", (_name, element) => {
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(element);
    });
    expect(finalPaths(renderer).length).toBeGreaterThan(0);
  });

  it("keeps SSR at the final path without line dash artifacts", () => {
    const html = renderToString(
      <LineChart data={[{ x: "A", y: 1 }, { x: "B", y: 4 }]} xKey="x" yKey="y" animation={{ entrance: "draw" }} />
    );
    const pathTags = html.match(/<path[^>]*>/g) ?? [];
    expect(pathTags.length).toBeGreaterThan(0);
    expect(pathTags.every((tag) => !tag.includes("stroke-dasharray"))).toBe(true);
    expect(pathTags.every((tag) => !tag.includes('opacity="0"'))).toBe(true);
  });
});
