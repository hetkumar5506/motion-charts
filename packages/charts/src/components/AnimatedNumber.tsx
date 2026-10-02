import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion";
import type { Transition } from "framer-motion";
import { animationPreset, type AnimationPresetName } from "../utils/animationPresets";

export type AnimatedNumberProps = {
  value: number;
  format?: (value: number) => string;
  transition?: AnimationPresetName | Transition;
  className?: string;
  style?: CSSProperties;
};

type AnimatedNumberTextProps = {
  value: number;
  format: (value: number) => string;
  transition?: Transition;
  initialValue?: number;
  reducedMotion?: boolean | null;
};

/**
 * A small spring-driven number for KPI cards. The SSR value is always the
 * final formatted value; the spring starts on the client after hydration.
 */
export function AnimatedNumber({ value, format = defaultFormat, transition = "spring", className, style }: AnimatedNumberProps) {
  const text = useAnimatedNumberText(value, format, resolveTransition(transition), undefined, undefined);
  return <motion.span className={className} style={style}>{text}</motion.span>;
}

export function AnimatedNumberText({ value, format, transition, initialValue, reducedMotion }: AnimatedNumberTextProps) {
  return <>{useAnimatedNumberText(value, format, transition, initialValue, reducedMotion)}</>;
}

export function useAnimatedNumberText(
  value: number,
  format: (value: number) => string,
  transition: Transition = animationPreset("spring"),
  initialValue?: number,
  reducedMotionOverride?: boolean | null
): string {
  const reducedMotionFromHook = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? reducedMotionFromHook;
  const safeValue = finiteNumber(value);
  const safeInitial = finiteNumber(initialValue ?? safeValue);
  const springOptions = useMemo(() => {
    const { delay: _delay, ...options } = transition;
    return options;
  }, [transition]);
  const motionValue = useSpring(safeInitial, springOptions as never);
  const [display, setDisplay] = useState(() => formatRounded(safeInitial, format));
  const hasMounted = useRef(false);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(formatRounded(latest, format));
  });

  useEffect(() => {
    if (!hasMounted.current) hasMounted.current = true;
    if (reducedMotion) {
      motionValue.jump(safeValue);
      setDisplay(formatRounded(safeValue, format));
      return;
    }

    if (initialValue !== undefined && Number.isFinite(initialValue) && initialValue !== safeValue) {
      motionValue.jump(safeInitial);
      const frame = typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(() => motionValue.set(safeValue))
        : undefined;
      return () => {
        if (frame !== undefined && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
      };
    }
    motionValue.set(safeValue);
  }, [format, initialValue, motionValue, reducedMotion, safeInitial, safeValue]);

  return display;
}

function resolveTransition(transition: AnimatedNumberProps["transition"]): Transition {
  return typeof transition === "string" ? animationPreset(transition) : (transition ?? animationPreset("spring"));
}

function finiteNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatRounded(value: number, format: (value: number) => string): string {
  const rounded = Math.round(finiteNumber(value) * 100) / 100;
  return String(format(rounded));
}

function defaultFormat(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
