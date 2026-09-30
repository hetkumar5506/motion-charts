import type { Transition } from "framer-motion";
import type { MotionOptions } from "../types";
import { animationPreset } from "./animationPresets";

export function chartTransition(animation: MotionOptions | undefined, reducedMotion: boolean | null, index = 0): Transition {
  if (animation?.disabled || reducedMotion) return { duration: 0 };
  const userDelay = animation?.transition?.delay;
  const stagger = Math.min(Math.max(0, animation?.stagger ?? 0.025) * index, 0.6);
  const delay = userDelay !== undefined ? userDelay : stagger;
  return {
    ...animationPreset(animation?.preset),
    ...animation?.transition,
    delay
  };
}

export function shouldAnimateInitial(animation: MotionOptions | undefined, reducedMotion: boolean | null): boolean {
  return animation?.initial !== false && !animation?.disabled && !reducedMotion;
}
