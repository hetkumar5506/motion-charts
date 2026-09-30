# Motion Charts

[![npm version](https://img.shields.io/npm/v/@motion-charts/core.svg?color=2563eb&label=@motion-charts/core)](https://www.npmjs.com/package/@motion-charts/core)
[![license](https://img.shields.io/npm/l/@motion-charts/core.svg?color=0d9488)](https://github.com/motion-charts)

Animation-first React charts built with SVG and Framer Motion. Engineered for dashboards, fintech telemetry, ecommerce analytics, and SaaS admin panels.

Available on npm: **[npmjs.com/package/@motion-charts/core](https://www.npmjs.com/package/@motion-charts/core)**

```bash
npm install @motion-charts/core framer-motion
```

This repository contains:

- `packages/charts` — the published package: `@motion-charts/core`
- `apps/docs` — the Next.js documentation and live interactive showcase

## Quick start

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run dev
```

## Package usage

```tsx
"use client";

import { BarChart, ResponsiveChart } from "@motion-charts/core";

const data = [
  { label: "Jan", value: 42 },
  { label: "Feb", value: 64 },
  { label: "Mar", value: 51 }
];

export function Revenue() {
  return (
    <ResponsiveChart minHeight={280} maxHeight={420}>
      {({ width, height }) => (
        <BarChart
          data={data}
          width={width}
          height={height}
          xKey="label"
          yKey="value"
          theme="aurora"
          animation={{ preset: "bouncy", stagger: 0.04 }}
          ariaLabel="Monthly revenue"
        />
      )}
    </ResponsiveChart>
  );
}
```

## v0.1 feature set

- Animated `BarChart`, `LineChart`, `MultiLineChart`, `DonutChart`, and `Sparkline`
- Responsive measurement wrapper via `ResponsiveChart`
- 6 chart themes: `aurora`, `midnight`, `candy`, `ocean`, `sunset`, `minimal`
- 12 palettes: `aurora`, `ocean`, `sunset`, `forest`, `candy`, `royal`, `fire`, `cyber`, `pastel`, `graphite`, `emerald`, `bloom`
- 7 animation presets: `spring`, `gentle`, `snappy`, `bouncy`, `calm`, `dramatic`, `linear`
- Custom product color arrays with `colors={[...]}`
- Gradient bars and donut slices by default
- Tooltips, value formatters, axes, grids, labels, legends, empty states
- Keyboard focus, SVG titles/descriptions, and reduced-motion support
- `llms.txt` guide for AI coding agents

## Audit commands

```bash
npm run typecheck
npm run test
npm run build
npm audit
npm run audit:ponytail
```

## Publish checklist

1. Create/log in to an npm account.
2. Rename `@motion-charts/core` to your npm scope if needed, for example `@your-name/motion-charts`.
3. Run the audit commands above.
4. From `packages/charts`, run:

```bash
npm publish --access public
```

The first release intentionally focuses on the charts most dashboards need: bars, lines, multi-line trends, donuts, and sparklines. More chart types should be added only when real users ask for them.
