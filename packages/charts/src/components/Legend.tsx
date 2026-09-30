export function InlineLegend({ items, color = "#475569" }: { items: readonly { label: string; color: string }[]; color?: string }) {
  if (items.length === 0) return null;
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
        color,
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
            background: "rgba(241, 245, 249, 0.6)",
            border: "1px solid rgba(226, 232, 240, 0.7)"
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: item.color,
              display: "inline-block",
              boxShadow: "0 0 0 1.5px #ffffff"
            }}
          />
          <span style={{ color: "#334155", fontWeight: 600 }}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
