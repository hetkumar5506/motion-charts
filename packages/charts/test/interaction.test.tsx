import { act, create, type ReactTestRenderer } from "react-test-renderer";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { BarChart, DonutChart, LineChart, MultiLineChart, Sparkline } from "../src";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function firstDatum(renderer: ReactTestRenderer) {
  const node = renderer.root.findAll((candidate) => candidate.props.role === "graphics-symbol")[0];
  if (!node) throw new Error("chart did not render a graphics-symbol datum");
  return node;
}

function activate(renderer: ReactTestRenderer, key: "Enter" | " ") {
  const preventDefault = vi.fn();
  act(() => {
    firstDatum(renderer).props.onKeyDown({ key, preventDefault } as never);
  });
  expect(preventDefault).toHaveBeenCalledTimes(1);
}

describe("datum keyboard activation", () => {
  it.each([
    ["BarChart", (onDatumClick: (context: unknown) => void) => <BarChart data={[{ label: "A", value: 12 }]} xKey="label" yKey="value" onDatumClick={onDatumClick} />, "Enter"],
    ["DonutChart", (onDatumClick: (context: unknown) => void) => <DonutChart data={[{ label: "A", value: 12 }]} labelKey="label" valueKey="value" onDatumClick={onDatumClick} />, " "],
    ["LineChart", (onDatumClick: (context: unknown) => void) => <LineChart data={[{ label: "A", value: 12 }]} xKey="label" yKey="value" onDatumClick={onDatumClick} />, "Enter"],
    ["MultiLineChart", (onDatumClick: (context: unknown) => void) => <MultiLineChart data={[{ label: "A", value: 12 }]} xKey="label" series={[{ id: "value", yKey: "value" }]} onDatumClick={onDatumClick} />, " "],
    ["Sparkline", (onDatumClick: (context: unknown) => void) => <Sparkline data={[{ label: "A", value: 12 }]} xKey="label" yKey="value" onDatumClick={onDatumClick} />, "Enter"]
  ] as const)("calls onDatumClick for $0 with $2", (_name, render, key) => {
    const onDatumClick = vi.fn();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(render(onDatumClick));
    });

    activate(renderer, key);

    expect(onDatumClick).toHaveBeenCalledTimes(1);
    expect(onDatumClick.mock.calls[0]?.[0]).toMatchObject({
      index: 0,
      label: "A",
      value: 12,
      datum: { label: "A", value: 12 }
    });
  });
});
