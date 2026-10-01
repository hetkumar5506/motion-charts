import { useCallback, useEffect, useState } from "react";
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

/**
 * Start entrance keyframes after hydration without hiding the SSR paint.
 * Framer Motion reads `initial` only during mount, so changing an `initial`
 * prop from false after a mounted flag flips cannot start an animation. Charts
 * render their final geometry on the server, then switch to explicit keyframes
 * in this hook's post-mount phase.
 */
export function useChartEntrance(animation: MotionOptions | undefined, reducedMotion: boolean | null): {
  isEntering: boolean;
  onAnimationComplete: () => void;
} {
  const shouldEnter = shouldAnimateInitial(animation, reducedMotion);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    setIsEntering(shouldEnter);
  }, [shouldEnter]);

  const onAnimationComplete = useCallback(() => {
    setIsEntering(false);
  }, []);

  return { isEntering, onAnimationComplete };
}
