import type { ReactNode } from "react";
import type { ChartTheme } from "../themes";

export function EmptyState({
  x,
  y,
  children = "No data",
  theme
}: {
  x: number;
  y: number;
  children?: ReactNode;
  theme: ChartTheme;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={theme.mutedTextColor}
      fontFamily={theme.fontFamily}
      fontSize={13}
    >
      {children}
    </text>
  );
}
