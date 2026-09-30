import type { CSSProperties } from "react";

export const chartPalettes = {
  // Hallmark / Cobalt inspired: Electric cobalt signal with slate, teal, and amber companions
  aurora: ["#2563eb", "#0284c7", "#0d9488", "#d97706", "#7c3aed", "#e11d48"],
  // Precision ocean: Deep sapphire down to sea-glass teal
  ocean: ["#0284c7", "#2563eb", "#06b6d4", "#0369a1", "#0891b2", "#1d4ed8"],
  // Lumen / warm editorial: Molten brass, terracotta, coral, oxblood
  sunset: ["#ea580c", "#d97706", "#c2410c", "#e11d48", "#9a3412", "#b91c1c"],
  // Natural botanical: Sage, forest green, chartreuse, olive
  forest: ["#059669", "#0d9488", "#16a34a", "#65a30d", "#047857", "#15803d"],
  // Hum-inspired: Plum, berry, soft violet, indigo, rose
  candy: ["#9333ea", "#c026d3", "#db2777", "#6366f1", "#7c3aed", "#e11d48"],
  // Classical institutional: Deep indigo, imperial blue, slate
  royal: ["#4338ca", "#3b82f6", "#6366f1", "#64748b", "#1e293b", "#334155"],
  // Warm signal: Crimson, burnt orange, amber
  fire: ["#dc2626", "#ea580c", "#d97706", "#b91c1c", "#c2410c", "#7f1d1d"],
  // High contrast devtool: Cyan, lime, violet, electric blue
  cyber: ["#0891b2", "#16a34a", "#7c3aed", "#2563eb", "#0284c7", "#4f46e5"],
  // Subtle paper tints: Muted wisteria, seafoam, oat, sky
  pastel: ["#64748b", "#0284c7", "#0d9488", "#d97706", "#7c3aed", "#be185d"],
  // Swiss minimal: Slate monochromes with hairline contrast
  graphite: ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
  // Clean emerald / mint
  emerald: ["#059669", "#0d9488", "#10b981", "#047857", "#0f766e", "#34d399"],
  // Vibrant berry & rose
  bloom: ["#be185d", "#e11d48", "#9d174d", "#c026d3", "#fb7185", "#f43f5e"]
} as const;

export type ChartPaletteName = keyof typeof chartPalettes;

export type ChartTheme = {
  colors: readonly string[];
  axisColor: string;
  gridColor: string;
  tickColor: string;
  textColor: string;
  mutedTextColor: string;
  fontFamily: string;
  fontSize: number;
  tooltipStyle: CSSProperties;
};

export type ChartThemeInput =
  | keyof typeof chartThemes
  | (Partial<ChartTheme> & {
      base?: keyof typeof chartThemes;
      palette?: ChartPaletteName | readonly string[];
    });

const fontFamily = 'Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const chartThemes = {
  aurora: makeTheme("aurora", {
    axisColor: "rgba(148, 163, 184, 0.35)",
    gridColor: "rgba(226, 232, 240, 0.65)",
    tickColor: "#64748b",
    textColor: "#0f172a",
    mutedTextColor: "#64748b",
    tooltipStyle: tooltip("#ffffff", "#0f172a", "#e2e8f0")
  }),
  midnight: makeTheme("cyber", {
    axisColor: "rgba(71, 85, 105, 0.45)",
    gridColor: "rgba(51, 65, 85, 0.35)",
    tickColor: "#94a3b8",
    textColor: "#f8fafc",
    mutedTextColor: "#94a3b8",
    tooltipStyle: tooltip("#0f172a", "#f8fafc", "#334155")
  }),
  candy: makeTheme("candy", {
    axisColor: "rgba(216, 180, 254, 0.35)",
    gridColor: "rgba(243, 232, 255, 0.6)",
    tickColor: "#7e22ce",
    textColor: "#3b0764",
    mutedTextColor: "#9333ea",
    tooltipStyle: tooltip("#ffffff", "#0f172a", "#f3e8ff")
  }),
  ocean: makeTheme("ocean", {
    axisColor: "rgba(186, 230, 253, 0.5)",
    gridColor: "rgba(224, 242, 254, 0.65)",
    tickColor: "#0369a1",
    textColor: "#082f49",
    mutedTextColor: "#0284c7",
    tooltipStyle: tooltip("#ffffff", "#0f172a", "#e0f2fe")
  }),
  sunset: makeTheme("sunset", {
    axisColor: "rgba(254, 215, 170, 0.45)",
    gridColor: "rgba(255, 237, 213, 0.65)",
    tickColor: "#c2410c",
    textColor: "#431407",
    mutedTextColor: "#ea580c",
    tooltipStyle: tooltip("#ffffff", "#0f172a", "#ffedd5")
  }),
  minimal: makeTheme("graphite", {
    axisColor: "rgba(203, 213, 225, 0.55)",
    gridColor: "rgba(241, 245, 249, 0.8)",
    tickColor: "#475569",
    textColor: "#0f172a",
    mutedTextColor: "#64748b",
    tooltipStyle: tooltip("#ffffff", "#0f172a", "#e2e8f0")
  })
} as const;

export type ChartThemeName = keyof typeof chartThemes;

export function resolveChartTheme(input?: ChartThemeInput, colorsOverride?: readonly string[]): ChartTheme {
  const isString = typeof input === "string";
  const namedBase = isString ? chartThemes[input] : (typeof input === "object" && input?.base ? chartThemes[input.base] : undefined);
  const base = namedBase ?? chartThemes.aurora;
  const overrides = typeof input === "object" && input ? input : {};
  const palette = "palette" in overrides ? overrides.palette : undefined;
  // Precedence: explicit colorsOverride -> theme.colors -> theme.palette -> base.colors
  const colors = colorsOverride?.length
    ? colorsOverride
    : overrides.colors?.length
      ? overrides.colors
      : paletteColors(palette) ?? base.colors;

  const { base: _base, palette: _palette, tooltipStyle: overrideTooltipStyle, ...restOverrides } = overrides;

  return {
    ...base,
    ...restOverrides,
    colors,
    tooltipStyle: { ...base.tooltipStyle, ...overrideTooltipStyle }
  };
}

export function paletteColors(palette?: ChartPaletteName | readonly string[]): readonly string[] | undefined {
  if (!palette) return undefined;
  return typeof palette === "string" ? chartPalettes[palette] : palette;
}

function makeTheme(palette: ChartPaletteName, overrides: Omit<ChartTheme, "colors" | "fontFamily" | "fontSize">): ChartTheme {
  return {
    colors: chartPalettes[palette],
    fontFamily,
    fontSize: 12,
    ...overrides
  };
}

function tooltip(background: string, color: string, borderColor: string): CSSProperties {
  return { background, color, borderColor };
}
