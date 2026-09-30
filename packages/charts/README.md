# @motion-charts/core

Animation-first React charts powered by SVG and Framer Motion.

`@motion-charts/core` is built for dashboards that should feel like polished product UI: ecommerce analytics, POS reports, SaaS admin panels, inventory dashboards, landing-page stats, and internal tools.

## Install

```bash
npm install @motion-charts/core framer-motion
```

`react`, `react-dom`, and `framer-motion` are peer dependencies so your app owns the runtime.

> Next.js App Router: render charts from a client component. The distributed entry includes a `"use client"` directive, but your chart wrapper should still be a client component when using dynamic data or interactions.

## Quick start

```tsx
"use client";

import { BarChart, ResponsiveChart } from "@motion-charts/core";

const data = [
  { month: "Jan", revenue: 42000 },
  { month: "Feb", revenue: 64000 },
  { month: "Mar", revenue: 51000 }
];

export function RevenueChart() {
  return (
    <ResponsiveChart minHeight={280} maxHeight={440}>
      {({ width, height }) => (
        <BarChart
          data={data}
          width={width}
          height={height}
          xKey="month"
          yKey="revenue"
          theme="aurora"
          animation={{ preset: "bouncy", stagger: 0.04 }}
          ariaLabel="Monthly revenue"
          valueFormatter={(value) => `$${value.toLocaleString()}`}
          showValues
        />
      )}
    </ResponsiveChart>
  );
}
```

## Components

| Component | Best for |
| --- | --- |
| `BarChart` | revenue by month, orders by category, inventory comparison |
| `LineChart` | one trend: visitors, MRR, retention, sales |
| `MultiLineChart` | comparing revenue/users/orders/profit over time |
| `DonutChart` | acquisition channels, payment methods, category share |
| `Sparkline` | KPI cards, tiny POS widgets, compact admin metrics |
| `ResponsiveChart` | measuring parent width with `ResizeObserver` |

## Responsive charts

Use `ResponsiveChart` when the chart should compute its real container width instead of only scaling a fixed SVG viewBox.

```tsx
<ResponsiveChart minHeight={280} maxHeight={440} aspectRatio={16 / 9}>
  {({ width, height }) => (
    <BarChart data={data} width={width} height={height} xKey="month" yKey="revenue" />
  )}
</ResponsiveChart>
```

## BarChart

```tsx
<BarChart
  data={monthlyRevenue}
  xKey="month"
  yKey="revenue"
  theme="sunset"
  animation={{ preset: "bouncy", stagger: 0.04 }}
  valueFormatter={(value) => `$${value}k`}
  showValues
/>
```

Useful props:

- `xKey`, `yKey` — object key or accessor function.
- `theme`, `colors` — named theme or exact product colors.
- `barVariant` — `"gradient"` or `"solid"`.
- `barRadius`, `barPadding` — visual tuning.
- `showValues`, `showGrid`, `xAxis`, `yAxis`.

## LineChart

```tsx
<LineChart
  data={traffic}
  xKey="day"
  yKey="visitors"
  theme="ocean"
  showArea
  showPoints
  animation={{ preset: "gentle" }}
/>
```

## MultiLineChart

```tsx
<MultiLineChart
  data={metrics}
  xKey="month"
  series={[
    { id: "revenue", label: "Revenue", yKey: "revenue", showArea: true },
    { id: "users", label: "Users", yKey: "users" },
    { id: "orders", label: "Orders", yKey: "orders" }
  ]}
  theme="aurora"
  valueFormatter={(value) => `${value}k`}
/>
```

Use this for ecommerce dashboards, SaaS admin panels, and POS analytics where multiple metrics need to move together.

## DonutChart

```tsx
<DonutChart
  data={channels}
  labelKey="channel"
  valueKey="users"
  theme="candy"
  centerLabel="128k"
  showLabels
/>
```

Useful props:

- `innerRadiusRatio` — controls donut thickness.
- `padAngle` — spacing between slices.
- `sliceVariant` — `"gradient"` or `"solid"`.
- `showLegend`, `showLabels`, `centerLabel`.

## Sparkline

```tsx
<Sparkline
  data={sales}
  xKey="hour"
  yKey="orders"
  theme="ocean"
  colorIndex={1}
  showEndValue
  valueFormatter={(value) => `${value} orders`}
/>
```

Use sparklines inside metric cards:

- today's revenue
- active carts
- hourly POS sales
- inventory movement
- signups this week

## Themes and palettes

Built-in themes:

```ts
"aurora" | "midnight" | "candy" | "ocean" | "sunset" | "minimal"
```

Built-in palettes:

```ts
"aurora" | "ocean" | "sunset" | "forest" | "candy" | "royal" |
"fire" | "cyber" | "pastel" | "graphite" | "emerald" | "bloom"
```

Use a named theme:

```tsx
<DonutChart data={data} labelKey="source" valueKey="users" theme="sunset" />
```

Use only a palette override:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" theme={{ palette: "cyber" }} />
```

Use product colors directly:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" colors={["#111827", "#2563eb", "#22c55e"]} />
```

Partial custom theme:

```tsx
<LineChart
  data={data}
  xKey="month"
  yKey="revenue"
  theme={{
    palette: "emerald",
    gridColor: "#dcfce7",
    tickColor: "#166534",
    textColor: "#052e16"
  }}
/>
```

## Animation presets

```tsx
animation={{ preset: "spring" }}
animation={{ preset: "gentle" }}
animation={{ preset: "snappy" }}
animation={{ preset: "bouncy" }}
animation={{ preset: "calm" }}
animation={{ preset: "dramatic" }}
animation={{ preset: "linear" }}
```

You can still override exact Framer Motion transition values:

```tsx
<LineChart
  data={data}
  xKey="month"
  yKey="users"
  showArea
  animation={{
    preset: "gentle",
    stagger: 0.03,
    transition: { damping: 24 }
  }}
/>
```

Disable motion when needed:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" animation={{ disabled: true }} />
```

Reduced-motion users are respected automatically.

## Tooltips

All chart components support a `tooltip` render prop or `tooltip={false}`.

```tsx
<BarChart
  data={data}
  xKey="month"
  yKey="revenue"
  tooltip={({ label, value }) => <span>{label}: ${value}k</span>}
/>
```

## Empty states

```tsx
<BarChart data={[]} xKey="month" yKey="revenue" emptyState="No revenue yet" />
```

## AI coding agents

The package includes `llms.txt` with chart-selection guidance for agents. Short version:

- Revenue by month → `BarChart`
- One metric over time → `LineChart`
- Several metrics over time → `MultiLineChart`
- KPI card trend → `Sparkline`
- Channel/category share → `DonutChart`
- Real app layout → wrap with `ResponsiveChart`

## Design goals

- Data changes animate by default.
- SVG output stays crisp at any size.
- TypeScript props guide the API.
- Product teams can match charts to brand colors quickly.
- Accessibility is built in with `role="img"`, `title`, `desc`, keyboard focus, and reduced-motion support.

## Non-goals for v0.1

- D3-scale parity.
- Every possible chart type.
- A huge plugin architecture.

Those can be added after real usage proves the need.
