# @motion-charts/core

[![npm version](https://img.shields.io/npm/v/@motion-charts/core.svg?color=2563eb&label=@motion-charts/core)](https://www.npmjs.com/package/@motion-charts/core)
[![license](https://img.shields.io/npm/l/@motion-charts/core.svg?color=0d9488)](https://github.com/hetkumar5506/motion-charts/blob/main/LICENSE)

Animation-first React charts powered by SVG and Framer Motion.

`@motion-charts/core` is built for dashboards that should feel like polished product UI: ecommerce analytics, POS reports, SaaS admin panels, inventory dashboards, landing-page stats, and internal tools.

## Documentation map

- [Install and quick start](#install)
- [Choose a chart](#components)
- [Data, accessors, and dates](#data-accessors-and-dates)
- [Responsive sizing](#responsive-charts)
- [Animation and reduced motion](#animation-presets)
- [Tooltips and interactions](#tooltips)
- [Accessibility and SSR](#accessibility)
- [Themes and palettes](#themes-and-palettes)
- [Tuning and defaults](#tuning--defaults)
- [Roadmap](#roadmap)

## Requirements

- React `18` or `19`
- Framer Motion `10`, `11`, or `12`
- Node.js `18` or newer for tooling and server rendering
- TypeScript is recommended but not required

The package ships ESM and CommonJS entry points plus generated TypeScript declarations. React, React DOM, and Framer Motion remain peer dependencies so the application controls their versions.

## Install

```bash
npm install @motion-charts/core framer-motion
```

Live on npm: **[npmjs.com/package/@motion-charts/core](https://www.npmjs.com/package/@motion-charts/core)**

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
| `AnimatedNumber` | spring-driven KPI values and count-up metrics |

## AnimatedNumber

Use `AnimatedNumber` for KPI cards outside a chart. It renders the final formatted value during SSR, springs on the client, and respects reduced motion.

```tsx
<AnimatedNumber
  value={8420}
  format={(value) => `$${value.toLocaleString("en-US")}`}
  transition="snappy"
/>
```

`transition` accepts an animation preset name or a Framer Motion transition object. Formatters receive finite values rounded to two decimal places during the spring.

## Data, accessors, and dates

Every chart accepts a `readonly` data array. Keys can be property names or functions, so both of these forms are supported:

```tsx
const data = [
  { month: "Jan", revenue: 42 },
  { month: "Feb", revenue: 64 }
];

<BarChart data={data} xKey="month" yKey="revenue" />
<BarChart
  data={data}
  xKey={(row, index) => `${index + 1}. ${row.month}`}
  yKey={(row) => row.revenue}
/>
```

Use `valueFormatter` for display-only formatting such as currency, percentages, or units. It does not change scale calculations or tooltip values. Invalid numeric values (`null`, `undefined`, `NaN`, and infinities) are warned about in development and safely coerced; line-family charts omit invalid points from geometry.

### Date labels

Date-valued `xKey` and `labelKey` values use a deterministic `YYYY-MM-DD` label by default:

- Values at UTC midnight, including `new Date("2026-03-01")`, use UTC calendar parts. This keeps an ISO date-only value on March 1 in both Los Angeles and Calcutta.
- Other dates, such as `new Date(2026, 2, 1)` or `new Date("2026-03-01T15:30:00")`, use the runtime's local calendar parts.
- A timestamp exactly at UTC midnight is indistinguishable from an ISO date-only value. Use `dateFormatter` when that distinction matters or when a specific timezone is required.

```tsx
<LineChart
  data={[{ date: new Date("2026-03-01"), value: 42 }]}
  xKey="date"
  yKey="value"
  dateFormatter={(date) => date.toISOString().slice(0, 10)}
/>
```

`dateFormatter` receives the original valid `Date` and is used for axis labels, datum labels, and tooltip context labels. Invalid dates render as `Invalid Date` rather than producing an invalid SVG attribute.

## Responsive charts

Use `ResponsiveChart` when the chart should compute its real container width instead of only scaling a fixed SVG viewBox. It is safe to use inside CSS grid and flex layouts; the wrapper opts into `min-width: 0` so a chart can shrink with its card instead of forcing horizontal overflow.

```tsx
<ResponsiveChart minHeight={280} maxHeight={440} aspectRatio={16 / 9}>
  {({ width, height }) => (
    <BarChart data={data} width={width} height={height} xKey="month" yKey="revenue" />
  )}
</ResponsiveChart>
```

For a chart inside your own flex or grid item, also allow that item to shrink:

```tsx
<div style={{ minWidth: 0, width: "100%" }}>
  <ResponsiveChart minHeight={240} maxHeight={420}>
    {({ width, height }) => (
      <LineChart data={data} width={width} height={height} xKey="month" yKey="value" showArea />
    )}
  </ResponsiveChart>
</div>
```

The wrapper sanitizes invalid dimensions, ignores temporary zero-width observations while a parent is hidden, and clamps chart margins to keep the plotting area inside the SVG at narrow widths. Individual charts also protect against invalid `width`, `height`, margin, padding, and stroke values.

| `ResponsiveChart` prop | Purpose |
| --- | --- |
| `children` | A render function receiving the measured `{ width, height }` for the chart. |
| `fallbackWidth` | SSR and no-`ResizeObserver` width before/without a real measurement. Defaults to `720`. |
| `className`, `style` | Applied to the measured wrapper. The wrapper always includes `width: 100%` and `min-width: 0`; supplied styles can extend or override it. |
| `aspectRatio`, `minHeight`, `maxHeight` | Control calculated height with safe defaults and bounds. |

### Shared chart props

All chart components accept these common options:

| Prop | Purpose |
| --- | --- |
| `width`, `height` | Explicit SVG dimensions. Use `ResponsiveChart` when the parent controls size. |
| `margin` | Partial `{ top, right, bottom, left }` plot margins. Values are sanitized and clamped. |
| `theme`, `colors` | Built-in/extended theme or an explicit palette. `colors` takes precedence over the theme palette. |
| `ariaLabel`, `ariaDescription` | Accessible chart name and description. Provide a meaningful `ariaLabel` for every chart. |
| `valueFormatter` | Formats numeric labels and tooltip values without changing the data domain. |
| `dateFormatter` | Controls Date-valued category labels; see [Date labels](#date-labels). |
| `animation` | Entrance/update motion, preset, stagger, transition overrides, and opt-out. |
| `tooltip` | Custom renderer or `false` to disable tooltips. |
| `onDatumClick` | Called with the datum context from pointer click or keyboard `Enter`/`Space` activation. |
| `emptyState` | Content shown when `data` is empty. |

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
- `barVariant` — `"gradient"`, `"glass"`, or `"solid"`. `glass` adds a compact linear sheen while retaining the palette color and readable value labels.
- `barRadius`, `barPadding` — visual tuning.
- `showValues`, `showGrid`, `xAxis`, `yAxis`.

`showValues` can be a boolean or `{ countUp?: boolean; formatter?: (value) => string }`. Count-up labels are enabled by default and use the same spring timing as the bars; use `showValues={{ countUp: false }}` to keep labels static. `showValues.formatter` formats the label above or inside a bar only; `valueFormatter` continues to format axes, accessible labels, and tooltips.

```tsx
<BarChart
  data={monthlyRevenue}
  xKey="month"
  yKey="revenue"
  valueFormatter={(value) => `$${value.toLocaleString()}`}
  showValues={{ formatter: (value) => `$${Math.round(value / 1000)}k` }}
/>
```

### Horizontal bars

Set `layout="horizontal"` when categories should run down the y-axis and values should run left-to-right. Positive bars grow from the zero baseline toward the right; negative bars grow toward the left.

```tsx
<BarChart
  data={data}
  xKey="month"
  yKey="revenue"
  layout="horizontal"
  showValues
  yAxis={{ zeroLine: true }}
/>
```

### Stacked and grouped series

Use `series` for multiple numeric fields. `seriesLayout="grouped"` is the default; use `"stacked"` for cumulative columns. A supplied `series` takes precedence over the single-series `yKey` shorthand.

```tsx
<BarChart
  data={monthly}
  xKey="month"
  series={[
    { id: "web", yKey: "web", label: "Web" },
    { id: "app", yKey: "app", label: "App" }
  ]}
  seriesLayout="stacked"
  showValues
/>
```

Each segment is individually labelled and focusable. When `series` is present, a legend is shown automatically; pass `legend={false}` to hide it. Missing numeric segments follow the library's normal non-finite-value handling and render as zero rather than invalid SVG geometry.

## LineChart

### Draw-on entrance

Line-family charts keep the existing fade/morph entrance by default. Opt into a left-to-right stroke draw with `animation={{ entrance: "draw" }}`. The final SVG path is still rendered during SSR, and reduced-motion users receive the final pose immediately.

```tsx
<LineChart
  data={traffic}
  xKey="day"
  yKey="visitors"
  animation={{ entrance: "draw", stagger: 0.08 }}
/>
```

`MultiLineChart` staggers series paths, and `Sparkline` uses the same option for compact KPI cards. Data-update morphing remains enabled after the entrance.

Set `crosshair` when the interaction should snap a spring-smoothed vertical guide to the nearest point:

```tsx
<LineChart data={traffic} xKey="day" yKey="visitors" crosshair />
```

```tsx
<LineChart
  data={traffic}
  xKey="day"
  yKey="visitors"
  theme="ocean"
  showArea
  showPoints
  strokeVariant="gradient"
  gradientToColor="#7c3aed"
  areaOpacity={0.22}
  pointVariant="halo"
  animation={{ preset: "silky", entrance: "rise" }}
/>
```

Useful props:

- `curve` — `"smooth"` (default) or `"linear"`.
- `showArea`, `showPoints`, `showGrid` — control supporting geometry.
- `strokeVariant` — `"solid"` (default) or `"gradient"`. Gradients blend into the next palette token or `gradientToColor`.
- `areaOpacity` — the top opacity of the area fill, clamped to `[0, 1]` (default `0.16`).
- `pointVariant` — `"solid"`, `"ring"`, or `"halo"` for a higher-visibility point treatment.
- `connectNulls` — bridge missing values or leave visible gaps.
- `colorIndex`, `strokeWidth`, `xAxis`, and `yAxis` — tune the visual and scale.

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

Use this for ecommerce dashboards, SaaS admin panels, and POS analytics where multiple metrics need to move together. Each `series` entry requires a stable `id` and `yKey`; `label`, `color`, `showArea`, and `strokeWidth` are optional per-series overrides. `showLegend` is enabled when you want those labels exposed in the chart. Set `strokeVariant="gradient"` to blend every path into its next palette color and use `areaOpacity` to tune the density of its area fills.

## Larger and complex datasets

The primitives are tested with dense multi-series SVG output, including four related series across 240 intervals, grouped categorical comparisons, and a 16-slice donut. For production dashboards, keep the visible data aligned with the decision a user needs to make:

- Use stable `series.id` values and `animation={{ initial: false }}` for frequently refreshing telemetry.
- For dense line charts, use `showPoints={false}` and enable `crosshair` only when point-level inspection is useful.
- Aggregate, window, or sample multi-thousand-point browser datasets before rendering. SVG remains the right choice for accessible, interactive product charts with hundreds of visible marks; it is not a replacement for canvas/WebGL time-series exploration at extreme scale.
- Prefer `BarChart` for a limited set of meaningful category comparisons and show a legend or table when a donut has many slices.

## DonutChart

Set `animation={{ entrance: "sweep" }}` to reveal slices clockwise with angle interpolation. Donut data updates use the same safe angle interpolation instead of trying to tween SVG arc command strings.

```tsx
<DonutChart
  data={channels}
  labelKey="channel"
  valueKey="users"
  animation={{ entrance: "sweep" }}
  centerLabel="128k"
/>
```

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
- `sliceVariant` — `"gradient"`, `"glass"`, or `"solid"`. `glass` adds a compact linear sheen without changing the palette token or creating per-slice focal hotspots.
- `showLegend`, `showLabels`, `centerLabel`.

Values are normalized into slices; zero and non-positive values do not receive an interactive slice. Use `centerLabel` for a total or short summary rather than repeating the full dataset in the middle of the chart.

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

`Sparkline` keeps the same interaction, tooltip, and reduced-motion behavior as the larger charts. Use `padding` for compact cards, `colorIndex` to select a stable palette entry, and `showEndValue` to display the last finite datum. It also supports `strokeVariant="gradient"`, `gradientToColor`, and `areaOpacity` for denser KPI treatments.

## Y-Axis and Zero Inclusions

Control whether axes strictly include zero or dynamically fit the data range:

```tsx
<LineChart
  data={stockPrices}
  xKey="date"
  yKey="price"
  // includeZero defaults to false on LineChart/MultiLineChart for high dynamic resolution
  yAxis={{ includeZero: false, tickCount: 6 }}
/>

<BarChart
  data={revenue}
  xKey="month"
  yKey="amount"
  // includeZero defaults to true on BarChart
  yAxis={{ includeZero: true }}
/>
```

## Themes and palettes

Built-in themes:

```ts
"aurora" | "midnight" | "candy" | "ocean" | "sunset" | "minimal"
```

Built-in palettes:

```ts
"aurora" | "ocean" | "sunset" | "forest" | "candy" | "royal" |
"fire" | "cyber" | "pastel" | "graphite" | "emerald" | "bloom" | "prism" |
"lagoon" | "orchid" | "citrus" | "editorial" | "okabe" | "terra" | "nordic" | "plum"
```

Choose an explicit light/dark surface variant. `auto` is SSR-safe: it renders the light variant on the server and first client render, then follows live `prefers-color-scheme` changes without hydration drift.

```tsx
<LineChart data={data} xKey="month" yKey="revenue" theme="auto" />
<LineChart data={data} xKey="month" yKey="revenue" theme={{ base: "aurora", surface: "dark" }} />
```

Every built-in palette can be selected on either surface with `theme={{ base: "aurora", palette: "okabe", surface: "dark" }}`. Named themes use the same surface-adjusted palette as their matching palette name, so `theme="ocean"` and `theme={{ base: "ocean", palette: "ocean" }}` stay visually aligned. The chart SVG stays transparent; apply `theme.surfaceColor` or your own card background to the containing surface.

On light surfaces, built-in palette colors are calibrated to a minimum 2.5:1 contrast ratio against white. Colors that already meet that threshold are left untouched, which keeps established visual tokens stable.

### Palette selection contract

Use a theme to match the surrounding surface and a palette to communicate the chart’s role; they are intentionally independent. `paletteProfiles` exposes a machine-readable label, mood, recommended contexts, and an `avoidWhen` note for every built-in palette. `recommendPalette` provides a stable shortcut for common product contexts.

```tsx
import { paletteProfiles, recommendPalette } from "@motion-charts/core";

const palette = recommendPalette("fintech"); // "lagoon"
const profile = paletteProfiles[palette]; // use profile.mood / profile.bestFor in a theme picker

<LineChart
  data={balances}
  xKey="date"
  yKey="value"
  theme={{ base: "aurora", palette, surface: "light" }}
  ariaLabel="Daily account balance"
/>
```

| Intent | Recommended palette | Use it when |
| --- | --- | --- |
| `default` | `aurora` | a balanced product dashboard needs a dependable default |
| `commerce` | `sunset` | conversion, sales, or launch metrics need warm energy |
| `fintech` | `lagoon` | trust, calm, and information density matter |
| `developer` | `cyber` | dark-native developer tooling, observability, or security is the context |
| `editorial` | `editorial` | an executive readout or report should feel considered and quiet |
| `wellness` | `emerald` | progress, sustainability, inventory, or wellbeing is the focus |
| `accessible` | `okabe` | a multi-series chart needs a colorblind-considered starting point |
| `creative` | `orchid` | media, campaigns, or creator-facing UI benefits from expressive color |

For visual matching, start with `lagoon` for calm blue/teal product surfaces, `orchid` for expressive violet/magenta UI, `citrus` for warm operational dashboards, `prism` for a premium high-contrast feature moment, and `okabe` when broad multi-series distinction is more important than brand tone. See `llms.txt` for the complete agent-oriented decision guide.

Extend a named theme using `base`:

```tsx
<BarChart
  data={data}
  xKey="month"
  yKey="revenue"
  theme={{ base: "midnight", gridColor: "#334155" }}
/>
```

Use only a palette override:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" theme={{ palette: "cyber" }} />
```

Use product colors directly:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" colors={["#111827", "#2563eb", "#22c55e"]} />
```

Chart surfaces are transparent by design, so the consuming card/page supplies the background. This is especially important with `midnight`, `minimal`, or custom themes: pair their text and tick colors with a surface that provides readable contrast.

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
animation={{ preset: "silky" }}
animation={{ preset: "lively" }}
animation={{ preset: "cinematic" }}
animation={{ preset: "dramatic" }}
animation={{ preset: "linear" }}
```

Exported helper `animationPreset("bouncy")` is also available for custom animation builders.

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
    staggerFrom: "center",
    transition: { damping: 24 }
  }}
/>
```

Disable motion when needed:

```tsx
<BarChart data={data} xKey="month" yKey="revenue" animation={{ disabled: true }} />
```

Reduced-motion users are respected automatically.

### Motion behavior

- Charts render final geometry during SSR, then play entrance keyframes after hydration so server HTML is useful and hydration-safe.
- Data changes animate by default. Bars tween their baseline-safe SVG geometry; paths and points morph to the next dataset.
- `animation={{ initial: false }}` disables the entrance while preserving data-update transitions.
- `animation={{ entrance: "draw" }}` traces line-family paths; `"sweep"` reveals donut slices clockwise.
- `animation={{ entrance: "rise" }}` gives line-family geometry an upward settle; `"pop"` adds a small, staggered overshoot to marks and slices.
- `animation={{ disabled: true }}` disables entrance and update motion for that chart.
- `prefers-reduced-motion: reduce` suppresses motion without removing the final chart or its interactions.
- `stagger` is measured in seconds per item and is clamped to a safe range. Add `staggerFrom: "start" | "center" | "end"` to make marks cascade in reading order, bloom from the middle, or resolve from the final mark. A transition-level `delay` is a base delay and is added before the per-mark stagger. `transition` overrides the selected preset when you need exact Framer Motion behavior.

| Preset | Character |
| --- | --- |
| `spring` | Balanced default spring |
| `gentle` | Soft, low-energy spring |
| `snappy` | Fast response for compact UI |
| `bouncy` | Noticeable overshoot for dashboards and demos |
| `calm` | Slow, restrained movement |
| `silky` | Premium, long easing curve for smooth dashboard transitions |
| `lively` | Fast spring with a small, controlled overshoot |
| `cinematic` | Deliberate longer timing for feature moments and presentations |
| `dramatic` | Stronger entrance emphasis |
| `linear` | Constant-duration interpolation |

## Tooltips

All chart components support a `tooltip` render prop or `tooltip={false}`. Tooltips render with dynamic measurement, viewport boundary clamping, portal rendering to `document.body` (to avoid CSS transform/filter containing-block clipping from parent cards or Framer Motion animations), and outside-touch dismissal for mobile screens. Active shapes are connected to live tooltips with `aria-describedby`.

```tsx
<BarChart
  data={data}
  xKey="month"
  yKey="revenue"
  tooltip={({ label, value }) => <span>{label}: ${value}k</span>}
/>
```

The renderer receives `{ datum, index, label, value, color }`. In multi-series charts and grouped/stacked bars, it also receives `seriesId` (the stable series key) and `seriesLabel` (the visible series name). Return any React node, or set `tooltip={false}` to disable the default tooltip.

## Datum actions

`onDatumClick` is supported by every chart with interactive data marks. It receives the same context for pointer and keyboard activation:

```tsx
<BarChart
  data={data}
  xKey="month"
  yKey="revenue"
  onDatumClick={({ datum, index, label, value, color }) => {
    console.log({ datum, index, label, value, color });
  }}
/>
```

When a datum has focus, `Enter` and `Space` invoke the callback. `Space` prevents page scrolling. Supplying the callback also exposes a pointer cursor on the datum.

## Accessibility

The library provides a useful baseline for WCAG-oriented interfaces, while the surrounding page remains responsible for meaningful names, sufficient surface contrast, and keyboard-flow decisions.

- **Chart semantics**: The surface exposes `role="group"`, `aria-roledescription="chart"`, a generated title, and your `ariaLabel`/`ariaDescription`.
- **Datum semantics**: Bars, points, and slices use `role="graphics-symbol"`, an `aria-roledescription`, and a label containing the category and formatted value.
- **Keyboard navigation**: Interactive data marks use a roving `tabIndex`. `ArrowRight`/`ArrowDown`, `ArrowLeft`/`ArrowUp`, `Home`, and `End` move focus without trapping the user.
- **Focus indication**: Focus rings are SVG-native and remain visible at chart edges; they do not rely on CSS outlines around SVG geometry.
- **Tooltips**: Pointer and keyboard activation share the tooltip lifecycle. The active mark receives `aria-describedby` only while the live tooltip exists.
- **Reduced motion**: `prefers-reduced-motion: reduce` suppresses animation while preserving final geometry, focus, labels, and tooltips.
- **SSR and hydration**: Server-rendered markup contains final geometry rather than an empty animated state, and the post-hydration entrance does not change the semantic structure.

For best results, pass a specific `ariaLabel` such as `Monthly revenue`, keep chart text on a suitable surface, and provide a visible heading when the chart is part of a larger report.

## Reference lines

Add target or threshold guides with `referenceLines`. A `y` line expands the value domain so it remains visible; a category `x` line snaps to an existing category label.

```tsx
<LineChart
  data={data}
  xKey="month"
  yKey="revenue"
  referenceLines={[
    { y: 100, label: "Target", color: "#b45309", dash: "6 4" }
  ]}
/>
```

Reference lines draw after the main entrance, render statically in SSR, and become immediate when reduced motion is enabled.

## Tuning & defaults

- `connectNulls` (boolean, default `true`): In `LineChart` and `MultiLineChart`, controls whether `null`/`NaN` data points are bridged or rendered with distinct visual gaps in line and area paths.
- `zeroLine` (boolean, default `false`): In `BarChart`, set `xAxis={{ zeroLine: true }}` or `yAxis={{ zeroLine: true }}` to anchor the horizontal axis baseline line at `y=0` when displaying negative data.
- `colorIndex` (number, default `0`): Available on both `LineChart` and `Sparkline` to select an exact palette color index without custom array overrides.
- `fallbackWidth` (number, default `720`): Sizing prop on `ResponsiveChart` to establish predictable initial dimensions during SSR or before initial ResizeObserver measurement.
- `className` & `style`: Supported across all chart containers and `ResponsiveChart` for seamless CSS layout, flex, and grid integration.
- `children`: `ResponsiveChart` accepts a function `({ width, height }) => ReactNode` to inject measured dimensions into chart components; `ChartSurface` accepts standard child nodes.
- `seriesId` & `seriesLabel`: Provided in the `TooltipRenderContext` for multi-series marks (e.g. stacked/grouped bars and multi-line series) to distinguish series in custom tooltip renderers.
- `barPadding` is clamped to `[0, 0.8]` (default `0.22`).
- `innerRadiusRatio` in `DonutChart` is clamped to `[0, 0.9]` (default `0.62`).
- `Date` objects passed to `xKey` or `labelKey` format deterministically as `YYYY-MM-DD`: UTC-midnight values use UTC parts (stable for ISO date-only strings), while other values use local parts. Use `dateFormatter` for an explicit timezone or instant policy; invalid dates are handled safely.
- Numeric accessors warn in development on non-finite values (`null`, `undefined`, `NaN`, `Infinity`) and coerce safely to `0`. Missing values in LineChart, MultiLineChart, and Sparkline are excluded from axis extents and rendered points.
- Responsive dimensions and chart margins are sanitized so narrow grid/flex cards do not produce invalid SVG attributes or geometry outside the chart viewport.

## Empty states

```tsx
<BarChart data={[]} xKey="month" yKey="revenue" emptyState="No revenue yet" />
```

## Troubleshooting

### The chart overflows a grid or flex card

Set `minWidth: 0` on the chart's grid/flex item and prefer `ResponsiveChart` over hard-coded dimensions:

```tsx
<div style={{ minWidth: 0 }}>
  <ResponsiveChart>{({ width, height }) => <LineChart data={data} width={width} height={height} xKey="label" yKey="value" />}</ResponsiveChart>
</div>
```

### Dates show the wrong day

ISO date-only values are normalized to their UTC calendar day. Local constructors and local timestamps use local parts. If your backend sends instants and your UI needs a specific timezone, provide `dateFormatter` and format the date with the application timezone policy.

### The chart is static in a test or during SSR

That is expected: server output contains final geometry, and entrance keyframes start after hydration. Set `animation={{ disabled: true }}` when a test intentionally needs no motion; do not assert against a temporary client-only empty state.

### A tooltip is not visible

Make sure `tooltip` is not `false`, the mark is interactive, and the chart is rendered in a browser environment. Tooltips use a portal for transformed or clipped cards and are connected to the active mark with `aria-describedby`.

### Text is hard to read

Chart SVGs are transparent. Put them on a suitable surface, choose a contrasting theme/text color, or provide explicit `colors`. `valueFormatter` changes text only; it does not alter numeric geometry.

## Roadmap

The library is intentionally focused on production-ready SVG primitives rather than a large plugin surface. Next areas of exploration are guided by real product use:

- richer annotation and threshold-guide ergonomics;
- improved tooltip density controls for touch and compact dashboards;
- additional chart families only when they can match the existing accessibility, SSR, and motion guarantees.

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
- Accessibility is built in with roving keyboard navigation, SVG graphics semantics, titles, descriptions, and reduced-motion support.

## Roadmap

- Area chart component with stacked area modes and curved interpolation.
- Scatter and bubble plots with continuous spatial scales and collision-aware labels.
- Interactive brush and zoom controls for large timeline datasets.
- Radial bar and radar charts for multivariate comparative scoring.
- Export utilities for SVG download and canvas rasterization.
