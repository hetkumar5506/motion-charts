# Changelog

## 0.1.6

### Fixed
- **Sub-Pixel Hydration Discrepancy**: Standardized polar coordinate rounding in `DonutChart` label positions and `BarChart` value labels to two fixed decimal places. Prevents floating-point precision mismatches between Node.js V8 server rendering and browser JavaScript engines (e.g. `311.1123833667782` vs `"311.11238336677815"`).

## 0.1.5

### Fixed & Enhanced
- **Vite & Client Bundler Dev Warnings**: Completely removed `typeof process !== "undefined"` guards in favor of a try/catch `process.env.NODE_ENV !== "production"` pattern. Bundlers like Vite now statically replace `process.env.NODE_ENV` with `"development"` without getting blocked by a missing global `process` object in the browser.
- **Dynamic Tooltip Measurement & Clamping**: Chart tooltips now dynamically measure their rendered bounding box (`getBoundingClientRect`) and clamp seamlessly against viewport edges for custom or multi-line content.
- **Portaled Tooltip Isolation**: Tooltips render into `document.body` via `createPortal`, isolating `position: fixed` from CSS `transform` / `filter` containing blocks created by animated ancestor elements (e.g. Framer Motion cards).
- **Touch Device Dismissal**: Added outside-touch dismissal for mobile screens where `pointerleave` does not fire after a tap, preventing tooltips from lingering indefinitely.
- **Optional Gapped Line Semantics (`connectNulls`)**: Added `connectNulls` prop (default `true`) to `LineChart` and `MultiLineChart`. When set to `false`, lines and areas break cleanly with visual gaps across `null` / `NaN` data points.
- **Zero-Line Axis Baseline Support (`zeroLine`)**: Added `zeroLine?: boolean` option to `AxisOptions` (`xAxis` / `yAxis`), allowing `BarChart` to anchor the horizontal baseline line directly at `y=0` when displaying mixed positive and negative data.
- **Documentation & Testing**: Added comprehensive regression tests for `connectNulls`, `zeroLine`, and bundler `isDev` behavior. Updated documentation on parameter defaults and layout behavior.

## 0.1.4

### Fixed & Enhanced
- **Strict Numeric Sanitization**: Properly parenthesized finite checking in `numberOf` so `NaN`, `Infinity`, and `-Infinity` numbers are caught, warn in dev mode, and coerce to `0` instead of corrupting SVG paths.
- **Path Builder Robustness**: Filtered non-finite points in `linePath` and `areaPath` so a dirty datum cannot break or blank out the entire line or area fill in `LineChart`, `MultiLineChart`, and `Sparkline`.
- **X-Axis Tick Thinning**: Added smart label thinning to `AxisBottom` respecting `xAxis.tickCount` and container width, preventing overlapping label ink smears when displaying dense (e.g. 60+ points) datasets.
- **Typed Date Support**: `Date` instances passed to `xKey` or `labelKey` now format automatically via `.toLocaleDateString()` instead of printing raw verbose `Date.toString()`.
- **Theme-Aware Legend**: `InlineLegend` chips and labels now dynamically adapt background, border, and text colors to light or dark themes (e.g. `midnight`).
- **Series-Aware MultiLineChart**: Tooltip and hover focus now store `{ seriesId, index }`, preventing hover on one series from erroneously highlighting same-index points across other series.
- **Animation Preset Fallback**: `animationPreset()` now safely falls back to `spring` when an unknown preset name or typo is passed.
- **Bundler-Compatible Dev Warnings**: Dev mode warnings now use standard `process.env.NODE_ENV !== "production"` syntax so bundlers like Vite statically replace and activate warnings in browser dev consoles.
- **Value Labels Visibility**: `BarChart` `showValues` now renders value labels for short bars rather than silently clipping at ≤14px.
- **Donut Negative Value Warning**: Dev mode warning added when negative values are clamped to 0 in `DonutChart`.
- **Cached Number Format**: Reused a cached `Intl.NumberFormat` instance for high-frequency 60fps formatting performance.

## 0.1.3

### Fixed & Enhanced
- **WCAG 2.1 Level A Roving Keyboard Navigation**: Complete keyboard traversal for `BarChart`, `LineChart`, `MultiLineChart`, `DonutChart`, and `Sparkline`. Users can tab to the chart and move focus between symbols using `ArrowRight`, `ArrowLeft`, `ArrowUp`, `ArrowDown`, `Home`, and `End`.
- **Visible Focus Indicator**: Added high-contrast focus rings (`2px solid`) matching active themes on focused and active SVG shapes.
- **Tooltip Accessibility**: Active data points now associate with live floating tooltips using `aria-describedby`.
- **SSR Pre-Hydration HTML**: Server-rendered charts paint complete SVG geometries and `opacity: 1` instead of empty 0-height boxes before client hydration.
- **Null Value Coercion Guard**: Dev warning now correctly fires when `null` is passed into numerical accessors, coercing cleanly to `0`.
- **Pointermove Rendering Optimization**: Tooltip state updates are keyed to datum indices, avoiding React reconciliation thrashing on sub-pixel mouse movement.
- **Smooth Tooltip Boundary Clamping**: Smooth edge clamping prevents discontinuous horizontal flip teleportation.
- **Non-DOM Compatibility**: Safely feature-detect `createPortal` to prevent import crashes in non-DOM React reconcilers.
- **Documentation**: Updated `README.md` and `llms.txt` with `includeZero`, `theme.base`, `animationPreset`, and roving keyboard navigation details.

## 0.1.2

### Fixed
- Packaging: Added nodenext `.js` relative imports in declaration files and dual ESM (`index.d.ts`) / CJS (`index.d.cts`) declaration maps.
- Packaging: Exported `./package.json` subpath and included default export conditions.
- Tarball size: Excluded TypeScript source files and unminified maps from publication tarball.
- Geometry: Fixed 360° donut arc rendering and arc endpoint inversion at large `padAngle`.
- Geometry: Resolved duplicate category labels with index-based tick mapping.
- Themes: Fixed named theme extension with `theme.base` and prioritized explicit `colors` array over palette presets.

## 0.1.1

### Fixed
- Fixed y-axis ticks dynamic range for non-zero baselines on trend charts.
- Fixed tooltip contrast on dark themes.
- Removed `aria-hidden` on legend items to improve screen reader visibility.

## 0.1.0

Initial public preview.

### Added

- Animated `BarChart`, `LineChart`, `MultiLineChart`, `DonutChart`, and `Sparkline`.
- `ResponsiveChart` wrapper powered by native `ResizeObserver`.
- Theme system with `aurora`, `midnight`, `candy`, `ocean`, `sunset`, and `minimal`.
- Palette system with 12 brand-ready palettes.
- Animation presets: `spring`, `gentle`, `snappy`, `bouncy`, `calm`, `dramatic`, and `linear`.
- Gradient bars, gradient donut slices, line area fills, tooltips, legends, value labels, grid lines, and axes.
- Accessibility basics: SVG image roles, native titles/descriptions, keyboard focus, and reduced-motion support.
- `llms.txt` usage guide for AI coding agents.
