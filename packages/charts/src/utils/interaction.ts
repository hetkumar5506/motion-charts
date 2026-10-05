import type { KeyboardEvent } from "react";

/** Move focus between SVG data marks for Arrow, Home, and End keys. */
export function moveRovingFocus(event: KeyboardEvent<SVGElement>, index: number, count: number): number | null {
  if (count <= 1) return null;
  const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1
    : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
    : event.key === "Home" ? -index
    : event.key === "End" ? count - 1 - index : 0;
  if (!delta) return null;

  event.preventDefault();
  const next = Math.min(count - 1, Math.max(0, index + delta));
  event.currentTarget.closest("svg")
    ?.querySelectorAll<SVGElement>("[role='graphics-symbol']")[next]
    ?.focus();
  return next;
}
