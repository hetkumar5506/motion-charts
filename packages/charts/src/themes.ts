import { useEffect, useMemo, useState, type CSSProperties } from "react";

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
  bloom: ["#be185d", "#e11d48", "#9d174d", "#c026d3", "#fb7185", "#f43f5e"],
  // Editorial, scientific, earthy, Nordic, and plum additions
  editorial: ["#0f172a", "#b45309", "#64748b", "#7c2d12", "#475569", "#92400e"],
  okabe: ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00"],
  terra: ["#9a3412", "#4d7c0f", "#a16207", "#166534", "#7c2d12", "#3f6212"],
  nordic: ["#1e3a5f", "#4a6fa5", "#7899c2", "#2d4a6d", "#94a3b8", "#567db0"],
  plum: ["#86198f", "#be185d", "#9d174d", "#a21caf", "#d946ef", "#e879f9"]
} as const;

export type ChartPaletteName = keyof typeof chartPalettes;

export type ChartTheme = {
  /** Surface the theme is tuned against; chart SVGs remain transparent. */
  surface: "light" | "dark";
  surfaceColor: string;
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
  | "auto"
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
    surface: "dark",
    surfaceColor: "#0f172a",
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

const builtInThemePalettes: Record<ChartThemeName, ChartPaletteName> = {
  aurora: "aurora",
  midnight: "cyber",
  candy: "candy",
  ocean: "ocean",
  sunset: "sunset",
  minimal: "graphite"
};

/**
 * Resolve a theme without reading the browser during render. SSR and the first
 * client render use the light surface; an effect then follows live OS changes.
 */
export function useChartTheme(input?: ChartThemeInput, colorsOverride?: readonly string[]): ChartTheme {
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    if (input !== "auto" || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setPrefersDark(media.matches);
    update();
    if (media.addEventListener) media.addEventListener("change", update);
    else media.addListener?.(update);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update);
      else media.removeListener?.(update);
    };
  }, [input]);

  return useMemo(
    () => resolveChartTheme(input === "auto" && prefersDark ? "midnight" : input, colorsOverride),
    [input, colorsOverride, prefersDark]
  );
}

export function resolveChartTheme(input?: ChartThemeInput, colorsOverride?: readonly string[]): ChartTheme {
  const isAuto = input === "auto";
  const isNamed = typeof input === "string" && !isAuto;
  const namedBase = isNamed
    ? chartThemes[input as ChartThemeName]
    : (typeof input === "object" && input?.base ? chartThemes[input.base] : undefined);
  const base = namedBase ?? chartThemes.aurora;
  const overrides = typeof input === "object" && input ? input : {};
  const palette = "palette" in overrides ? overrides.palette : undefined;
  const builtInPalette = typeof input === "object" && input?.base ? builtInThemePalettes[input.base] : undefined;
  const effectiveSurface = overrides.surface ?? base.surface;
  // Precedence: explicit colorsOverride -> theme.colors -> theme.palette -> base.colors.
  // A built-in palette is also adapted when a caller requests the other surface.
  const colors = colorsOverride?.length
    ? colorsOverride
    : overrides.colors?.length
      ? overrides.colors
      : paletteColors(palette ?? builtInPalette, effectiveSurface) ?? base.colors;

  const { base: _base, palette: _palette, tooltipStyle: overrideTooltipStyle, ...restOverrides } = overrides;

  return {
    ...base,
    ...restOverrides,
    colors,
    tooltipStyle: { ...base.tooltipStyle, ...overrideTooltipStyle }
  };
}

export function paletteColors(palette?: ChartPaletteName | readonly string[], surface: "light" | "dark" = "light"): readonly string[] | undefined {
  if (!palette) return undefined;
  const colors = typeof palette === "string"
    ? (chartPalettes as Record<string, readonly string[]>)[palette] ?? chartPalettes.aurora
    : palette;
  return surface === "dark" ? colors.map(lightenForDarkSurface) : colors.map(darkenForLightSurface);
}

function lightenForDarkSurface(color: string): string {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(match[1]!.slice(offset, offset + 2), 16));
  const lifted = channels.map((channel) => Math.round(channel + (255 - channel) * 0.3));
  return `#${lifted.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function darkenForLightSurface(color: string): string {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(match[1]!.slice(offset, offset + 2), 16));
  const luminance = (candidate: readonly number[]) => {
    const linear = candidate.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
  };
  if ((1.05) / (luminance(channels) + 0.05) >= 2) return color;
  const lifted = channels.map((channel) => Math.round(channel * 0.7));
  return `#${lifted.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function makeTheme(palette: ChartPaletteName, overrides: Omit<ChartTheme, "colors" | "fontFamily" | "fontSize" | "surface" | "surfaceColor"> & Partial<Pick<ChartTheme, "surface" | "surfaceColor">>): ChartTheme {
  return {
    surface: "light",
    surfaceColor: "#ffffff",
    colors: chartPalettes[palette],
    fontFamily,
    fontSize: 12,
    ...overrides
  };
}

function tooltip(background: string, color: string, borderColor: string): CSSProperties {
  return { background, color, borderColor };
}
