import { useCallback, useEffect, useState } from "react";
import type { Transition } from "framer-motion";
import type { MotionOptions } from "../types";
import { animationPreset } from "./animationPresets";

function staggerPosition(index: number, count: number | undefined, from: MotionOptions["staggerFrom"]): number {
  const safeIndex = Math.max(0, index);
  if (!count || count < 1 || from === undefined || from === "start") return safeIndex;

  const lastIndex = Math.max(0, count - 1);
  const clampedIndex = Math.min(safeIndex, lastIndex);
  if (from === "end") return lastIndex - clampedIndex;
  return Math.abs(clampedIndex - lastIndex / 2);
}

/** Keep pointer feedback short so rapid hover changes never inherit a long chart preset. */
export const chartHoverTransition: Transition = { type: "tween", duration: 0.14, ease: [0.2, 0.8, 0.2, 1] };

/**
 * Spring and inertia transitions support two keyframes only. The default lively
 * preset supplies the controlled overshoot for pop entrances without a third keyframe.
 */
export function popKeyframes(from: number, to: number): [number, number] {
  return [from, to];
}

/** Build a chart transition with an optional directional cascade across `count` marks. */
export function chartTransition(animation: MotionOptions | undefined, reducedMotion: boolean | null, index = 0, count?: number): Transition {
  if (animation?.disabled || reducedMotion) return { duration: 0 };
  const userDelay = animation?.transition?.delay;
  const rawStagger = animation?.stagger ?? 0.025;
  const stagger = Number.isFinite(rawStagger)
    ? Math.min(Math.max(0, rawStagger) * staggerPosition(index, count, animation?.staggerFrom), 0.6)
    : 0;
  const baseDelay = typeof userDelay === "number" && Number.isFinite(userDelay) ? userDelay : 0;
  const preset = animation?.entrance === "pop" && animation.preset === undefined ? "lively" : animation?.preset;
  return {
    ...animationPreset(preset),
    ...animation?.transition,
    delay: baseDelay + stagger
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
