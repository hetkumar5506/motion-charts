import type { ChartTheme } from "../themes";
import { isDarkColor } from "../utils/color";

export function InlineLegend({
  items,
  theme,
  color
}: {
  items: readonly { label: string; color: string }[];
  theme?: ChartTheme;
  color?: string;
}) {
  if (items.length === 0) return null;
  const textColor = theme?.textColor ?? color ?? "#475569";
  const mutedColor = theme?.mutedTextColor ?? color ?? "#475569";
  const isDark =
    Boolean(theme?.textColor && (
      isDarkColor(theme.textColor) === false ||
      theme.textColor.toLowerCase().startsWith("#f") ||
      theme.textColor.toLowerCase().startsWith("rgb(24") ||
      theme.textColor.toLowerCase() === "white"
    ));
  const chipBg = isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(241, 245, 249, 0.6)";
  const chipBorder = isDark ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.7)";


  return (
    <div
      role="list"
      aria-label="Chart legend"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 16px",
        marginTop: 14,
        alignItems: "center",
        justifyContent: "flex-start",
        color: mutedColor,
        font: "500 11px/1.3 Plus Jakarta Sans, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        letterSpacing: "0.01em"
      }}
    >
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          role="listitem"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "2px 8px 2px 4px",
            borderRadius: 6,
            background: chipBg,
            border: `1px solid ${chipBorder}`
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: item.color,
              display: "inline-block",
              boxShadow: isDark ? "0 0 0 1px rgba(15, 23, 42, 0.8)" : "0 0 0 1.5px #ffffff"
            }}
          />
          <span style={{ color: textColor, fontWeight: 600 }}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
