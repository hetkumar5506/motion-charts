import type { Transition } from "framer-motion";
import type { MotionOptions } from "../types";
import { animationPreset } from "./animationPresets";

export function chartTransition(animation: MotionOptions | undefined, reducedMotion: boolean | null, index = 0): Transition {
  if (animation?.disabled || reducedMotion) return { duration: 0 };
  const userDelay = animation?.transition?.delay;
  const rawStagger = animation?.stagger ?? 0.025;
  const stagger = Number.isFinite(rawStagger)
    ? Math.min(Math.max(0, rawStagger) * Math.max(0, index), 0.6)
    : 0;
  const delay = typeof userDelay === "number" && Number.isFinite(userDelay) ? userDelay : stagger;
  return {
    ...animationPreset(animation?.preset),
    ...animation?.transition,
    delay
  };
}

export function shouldAnimateInitial(animation: MotionOptions | undefined, reducedMotion: boolean | null): boolean {
  return animation?.initial !== false && !animation?.disabled && !reducedMotion;
}
