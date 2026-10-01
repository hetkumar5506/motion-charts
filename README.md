# Motion Charts

[![npm version](https://img.shields.io/npm/v/@motion-charts/core.svg?color=2563eb&label=%40motion-charts%2Fcore)](https://www.npmjs.com/package/@motion-charts/core)
[![license](https://img.shields.io/npm/l/@motion-charts/core.svg?color=0d9488)](./LICENSE)

Motion Charts is an animation-first React chart library built with SVG, TypeScript, and Framer Motion. It is designed for production interfaces such as ecommerce dashboards, SaaS analytics, POS reports, fintech telemetry, inventory screens, and KPI cards.

The repository contains the published package and a small interactive showcase:

- [`packages/charts`](./packages/charts) — `@motion-charts/core`, the library package and its API documentation.
- [`apps/docs`](./apps/docs) — the Next.js showcase with live controls for data, themes, and motion presets.
- [`packages/charts/llms.txt`](./packages/charts/llms.txt) — a compact guide for AI coding agents.

## What is included

- `BarChart` for categorical comparisons and baseline-anchored bar motion.
- `LineChart` for a single trend with optional area and point geometry.
- `MultiLineChart` for multiple synchronized series.
- `DonutChart` for composition and share-of-total data.
- `Sparkline` for compact KPI and table-card trends.
- `ResponsiveChart` for measured width, aspect-ratio sizing, and CSS grid/flex layouts.
- Built-in themes and palettes, custom colors, tooltips, formatters, legends, empty states, and axis controls.
- SVG-native accessibility semantics, roving keyboard navigation, focus indicators, reduced-motion support, and SSR-safe final geometry.
- ESM, CommonJS, and TypeScript declaration exports.

## Install the package

```bash
npm install @motion-charts/core framer-motion
```

React and React DOM are peer dependencies. The consuming application owns the React and Framer Motion runtime versions.

For the package quick start, chart-by-chart examples, shared props, date handling, responsive sizing, accessibility, and troubleshooting, read [`packages/charts/README.md`](./packages/charts/README.md).

## Quick start

```tsx
"use client";

import { BarChart, ResponsiveChart } from "@motion-charts/core";

const data = [
  { month: "Jan", revenue: 42 },
  { month: "Feb", revenue: 64 },
  { month: "Mar", revenue: 51 }
];

export function RevenueChart() {
  return (
    <ResponsiveChart minHeight={280} maxHeight={420}>
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
          valueFormatter={(value) => `$${value}k`}
          showValues
        />
      )}
    </ResponsiveChart>
  );
}
```

## Develop the repository

Requirements: Node.js 18 or newer and npm. From the repository root:

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

The development command starts the Next.js showcase. It is also possible to run workspace commands directly:

```bash
npm run typecheck --workspace @motion-charts/core
npm test --workspace @motion-charts/core
npm run build --workspace @motion-charts/core
npm run dev --workspace docs
```

Useful checks before opening a pull request:

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
git diff --check
```

The package test suite covers geometry, scales, themes, exports, SSR output, invalid data, responsive layout, accessibility regressions, and animation lifecycle behavior.

## Project conventions

- Keep chart geometry in SVG attributes and use Framer Motion for safe interpolation.
- Preserve final SSR geometry; entrance animation begins after hydration.
- Treat `prefers-reduced-motion`, keyboard navigation, labels, and tooltips as part of the public API.
- Keep date formatting deterministic across server and browser timezones. Use `dateFormatter` when an application needs an explicit timezone policy.
- Prefer relative URLs and browser-safe client behavior in the docs app.
- Add a regression test for every fixed bug, especially for SSR, hydration, data updates, and timezone behavior.

## Release notes

The changelog for the package lives at [`packages/charts/CHANGELOG.md`](./packages/charts/CHANGELOG.md). The package is published as `@motion-charts/core`; release/version/tag operations should be performed only after the full validation matrix passes.

## License

[MIT](./LICENSE)
