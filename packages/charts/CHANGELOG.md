# Changelog

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
