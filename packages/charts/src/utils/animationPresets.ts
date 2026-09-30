import type { Transition } from "framer-motion";

export const animationPresets = {
  spring: { type: "spring", stiffness: 420, damping: 36, mass: 0.8 },
  gentle: { type: "spring", stiffness: 220, damping: 28, mass: 1 },
  snappy: { type: "spring", stiffness: 620, damping: 32, mass: 0.7 },
  bouncy: { type: "spring", stiffness: 360, damping: 18, mass: 0.8 },
  calm: { type: "tween", duration: 0.42, ease: "easeOut" },
  dramatic: { type: "spring", stiffness: 180, damping: 20, mass: 1.25 },
  linear: { type: "tween", duration: 0.28, ease: "linear" }
} as const satisfies Record<string, Transition>;

export type AnimationPresetName = keyof typeof animationPresets;

export function animationPreset(name: AnimationPresetName | string | undefined): Transition {
  if (name && name in animationPresets) {
    return animationPresets[name as AnimationPresetName];
  }
  return animationPresets.spring;
}
