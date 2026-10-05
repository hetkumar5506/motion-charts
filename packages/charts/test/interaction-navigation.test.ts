import { describe, expect, it, vi } from "vitest";
import { moveRovingFocus } from "../src/utils/interaction";

function keyboardEvent(key: string, focus = vi.fn()) {
  const preventDefault = vi.fn();
  const marks = [{ focus: vi.fn() }, { focus }, { focus: vi.fn() }];
  return {
    event: {
      key,
      preventDefault,
      currentTarget: { closest: () => ({ querySelectorAll: () => marks }) }
    } as never,
    focus,
    preventDefault
  };
}

describe("roving chart focus", () => {
  it("moves between marks and ignores unrelated keys", () => {
    const arrow = keyboardEvent("ArrowRight");
    expect(moveRovingFocus(arrow.event, 0, 3)).toBe(1);
    expect(arrow.preventDefault).toHaveBeenCalledOnce();
    expect(arrow.focus).toHaveBeenCalledOnce();

    const unrelated = keyboardEvent("Escape");
    expect(moveRovingFocus(unrelated.event, 0, 3)).toBeNull();
    expect(unrelated.preventDefault).not.toHaveBeenCalled();
  });
});
