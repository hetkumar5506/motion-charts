import { describe, expect, it } from "vitest";
import { chartTransition } from "../src/utils/motion";

describe("directional chart cascades", () => {
  it("cascades marks from the configured edge or center", () => {
    const fromEnd = { preset: "silky" as const, stagger: 0.1, staggerFrom: "end" as const };
    const fromCenter = { preset: "silky" as const, stagger: 0.1, staggerFrom: "center" as const };

    expect(chartTransition(fromEnd, false, 0, 5).delay).toBeCloseTo(0.4);
    expect(chartTransition(fromEnd, false, 4, 5).delay).toBeCloseTo(0);
    expect(chartTransition(fromCenter, false, 0, 5).delay).toBeCloseTo(0.2);
    expect(chartTransition(fromCenter, false, 2, 5).delay).toBeCloseTo(0);
    expect(chartTransition(fromCenter, false, 4, 5).delay).toBeCloseTo(0.2);
  });

  it("adds a transition delay before a stagger rather than replacing it", () => {
    const transition = chartTransition({
      preset: "silky",
      stagger: 0.05,
      staggerFrom: "start",
      transition: { delay: 0.2 }
    }, false, 2, 4);

    expect(transition.delay).toBeCloseTo(0.3);
  });

  it("keeps reduced-motion transitions immediate", () => {
    expect(chartTransition({ stagger: 0.1, staggerFrom: "end" }, true, 0, 5)).toEqual({ duration: 0 });
  });
});
