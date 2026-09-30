import type { Transition } from "framer-motion";
import type { MotionOptions } from "../types";
import { animationPreset } from "./animationPresets";

export function chartTransition(animation: MotionOptions | undefined, reducedMotion: boolean | null, index = 0): Transition {
  if (animation?.disabled || reducedMotion) return { duration: 0 };
  return {
    ...animationPreset(animation?.preset),
    ...animation?.transition,
    delay: (animation?.transition?.delay ?? 0) + (animation?.stagger ?? 0.025) * index
  };
}

export function shouldAnimateInitial(animation: MotionOptions | undefined, reducedMotion: boolean | null): boolean {
  return animation?.initial !== false && !animation?.disabled && !reducedMotion;
}
