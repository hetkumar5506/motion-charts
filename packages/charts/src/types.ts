import type { CSSProperties, ReactNode } from "react";
import type { Transition } from "framer-motion";
import type { ChartThemeInput } from "./themes";
import type { AnimationPresetName } from "./utils/animationPresets";

export type Primitive = string | number | boolean | null | undefined;
export type ChartDatum = Record<string, Primitive | Date>;
export type Accessor<TDatum, TValue> = keyof TDatum | ((datum: TDatum, index: number) => TValue);

export type ChartMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type AxisOptions = {
  show?: boolean;
  tickCount?: number;
  formatter?: (value: number | string) => string;
};

export type MotionOptions = {
  /** Disable all entrance/update motion for this chart. Reduced-motion users are respected automatically. */
  disabled?: boolean;
  /** Named motion preset. Use custom transition to override exact values. */
  preset?: AnimationPresetName;
  /** Framer Motion transition used by bars, points, lines, and slices. */
  transition?: Transition;
  /** Set to false when server/client hydration must not include entrance animation. */
  initial?: boolean;
  /** Delay each item by index * stagger. */
  stagger?: number;
};

export type TooltipRenderContext<TDatum> = {
  datum: TDatum;
  index: number;
  label: string;
  value: number;
  color: string;
};

export type TooltipRenderer<TDatum> = false | ((context: TooltipRenderContext<TDatum>) => ReactNode);

export type CommonChartProps<TDatum> = {
  data: readonly TDatum[];
  width?: number;
  height?: number;
  margin?: Partial<ChartMargin>;
  className?: string;
  style?: CSSProperties;
  colors?: readonly string[];
  /** Named built-in theme or a partial theme override. `colors` wins over theme palette. */
  theme?: ChartThemeInput;
  ariaLabel?: string;
  ariaDescription?: string;
  valueFormatter?: (value: number) => string;
  emptyState?: ReactNode;
  animation?: MotionOptions;
  tooltip?: TooltipRenderer<TDatum>;
};

