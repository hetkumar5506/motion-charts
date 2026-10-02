"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  DonutChart,
  LineChart,
  MultiLineChart,
  ResponsiveChart,
  Sparkline,
  type AnimationPresetName,
  type ChartThemeName
} from "@motion-charts/core";

const revenueDataSets = [
  [
    { month: "Jan", revenue: 45, users: 22, orders: 34, growth: 12 },
    { month: "Feb", revenue: 68, users: 31, orders: 52, growth: 18 },
    { month: "Mar", revenue: 54, users: 39, orders: 44, growth: -6 },
    { month: "Apr", revenue: 92, users: 48, orders: 67, growth: 28 },
    { month: "May", revenue: 81, users: 59, orders: 63, growth: 14 },
    { month: "Jun", revenue: 115, users: 74, orders: 85, growth: 32 }
  ],
  [
    { month: "Jan", revenue: 62, users: 28, orders: 44, growth: 16 },
    { month: "Feb", revenue: 41, users: 24, orders: 32, growth: -12 },
    { month: "Mar", revenue: 84, users: 42, orders: 63, growth: 35 },
    { month: "Apr", revenue: 76, users: 51, orders: 59, growth: 10 },
    { month: "May", revenue: 125, users: 80, orders: 94, growth: 42 },
    { month: "Jun", revenue: 104, users: 72, orders: 79, growth: -8 }
  ],
  [
    { month: "Jan", revenue: 38, users: 18, orders: 28, growth: 8 },
    { month: "Feb", revenue: 58, users: 33, orders: 42, growth: 22 },
    { month: "Mar", revenue: 71, users: 41, orders: 55, growth: 15 },
    { month: "Apr", revenue: 55, users: 36, orders: 41, growth: -10 },
    { month: "May", revenue: 98, users: 66, orders: 74, growth: 30 },
    { month: "Jun", revenue: 138, users: 92, orders: 105, growth: 48 }
  ]
];

const trafficChannels = [
  [
    { channel: "Direct / Organic", visitors: 48 },
    { channel: "Product Hunt", visitors: 26 },
    { channel: "Social / X", visitors: 22 },
    { channel: "Email Digest", visitors: 16 }
  ],
  [
    { channel: "Direct / Organic", visitors: 36 },
    { channel: "Product Hunt", visitors: 42 },
    { channel: "Social / X", visitors: 19 },
    { channel: "Email Digest", visitors: 25 }
  ],
  [
    { channel: "Direct / Organic", visitors: 58 },
    { channel: "Product Hunt", visitors: 18 },
    { channel: "Social / X", visitors: 14 },
    { channel: "Email Digest", visitors: 34 }
  ]
];

const themes: { id: ChartThemeName; label: string; accent: string }[] = [
  { id: "aurora", label: "Aurora", accent: "#2563eb" },
  { id: "midnight", label: "Midnight", accent: "#38bdf8" },
  { id: "candy", label: "Candy", accent: "#d946ef" },
  { id: "ocean", label: "Ocean", accent: "#0284c7" },
  { id: "sunset", label: "Sunset", accent: "#ea580c" },
  { id: "minimal", label: "Minimal", accent: "#0f172a" }
];

const presets: AnimationPresetName[] = ["spring", "gentle", "snappy", "bouncy", "calm"];

export function ChartShowcase() {
  const [dataIndex, setDataIndex] = useState(0);
  const [theme, setTheme] = useState<ChartThemeName>("aurora");
  const [preset, setPreset] = useState<AnimationPresetName>("gentle");
  const [activeTab, setActiveTab] = useState<"overview" | "bar" | "line" | "multiline" | "donut">("overview");

  const data = revenueDataSets[dataIndex % revenueDataSets.length] ?? revenueDataSets[0]!;
  const channels = trafficChannels[dataIndex % trafficChannels.length] ?? trafficChannels[0]!;
  const totalVisitors = useMemo(() => channels.reduce((sum, item) => sum + item.visitors, 0), [channels]);
  const isDark = theme === "midnight";

  return (
    <div className={`rounded-2xl border transition-colors duration-200 ${
      isDark ? "bg-[#090d16] border-slate-800 text-slate-100" : "bg-white border-slate-200/90 text-slate-900 shadow-sm"
    }`}>
      {/* Control Header */}
      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
        isDark ? "border-slate-800/80" : "border-slate-100"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-base font-bold tracking-tight">Interactive Component Playground</h2>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
              isDark ? "bg-slate-800 text-slate-300" : "bg-blue-50 text-blue-700"
            }`}>
              @motion-charts/core v0.2.0
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Zero-layout-shift SVG graphics rendered with Framer Motion spring interpolation and accessible roving keyboard navigation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDataIndex((v) => v + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 8a6 6 0 1 0 1.76-4.24L1 6m0 0V2m0 4h4" />
            </svg>
            Animate New Data
          </button>
        </div>
      </div>

      {/* Toolbar: Themes, Presets, and Tab switcher */}
      <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-4 text-xs ${
        isDark ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
      }`}>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/60 p-1 rounded-lg">
          {(["overview", "bar", "line", "multiline", "donut"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md font-semibold capitalize transition ${
                activeTab === tab
                  ? isDark
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-white text-slate-900 shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "overview" ? "Dashboard View" : tab}
            </button>
          ))}
        </div>

        {/* Theme & Preset Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Theme:</span>
            <div className="flex items-center gap-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1.5 ${
                    theme === t.id
                      ? isDark
                        ? "bg-slate-800 text-white font-semibold ring-1 ring-slate-700"
                        : "bg-white text-slate-900 font-semibold shadow-xs ring-1 ring-slate-200"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Physics:</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as AnimationPresetName)}
              className={`rounded-md border text-xs px-2 py-1 font-medium outline-hidden ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-slate-200"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              {presets.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Showcase Body */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Sparkline Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Net Revenue", key: "revenue" as const, prefix: "$", suffix: "k", colorIndex: 0 },
                { label: "Active Customers", key: "users" as const, prefix: "", suffix: "k", colorIndex: 1 },
                { label: "Total Orders", key: "orders" as const, prefix: "", suffix: "k", colorIndex: 2 }
              ].map((kpi) => {
                const currentVal = data[data.length - 1]?.[kpi.key] ?? 0;
                return (
                  <div
                    key={kpi.key}
                    className={`rounded-xl border p-4 transition ${
                      isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50/70 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {kpi.label}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        +18.4%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold tracking-tight mb-3">
                      {kpi.prefix}{currentVal}{kpi.suffix}
                    </div>
                    <Sparkline
                      data={data.map((d) => ({ month: d.month, val: d[kpi.key] }))}
                      xKey="month"
                      yKey="val"
                      theme={theme}
                      colorIndex={kpi.colorIndex}
                      height={64}
                      padding={4}
                      showArea
                      showPoints={false}
                      showEndValue
                      valueFormatter={(v) => `${kpi.prefix}${v}${kpi.suffix}`}
                      animation={{ preset, stagger: 0.015 }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Split Grid: BarChart & MultiLineChart */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className={`rounded-xl border p-5 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
                <div className="mb-4">
                  <h3 className="text-sm font-bold tracking-tight">Monthly Performance (BarChart)</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Animated spring bars with calibrated rounded radius and theme-aware tooltips.
                  </p>
                </div>
                <ResponsiveChart minHeight={270} maxHeight={320}>
                  {({ width, height }) => (
                    <BarChart
                      data={data}
                      xKey="month"
                      yKey="revenue"
                      width={width}
                      height={height}
                      theme={theme}
                      showValues
                      barRadius={6}
                      valueFormatter={(v) => `$${v}k`}
                      animation={{ preset, stagger: 0.03 }}
                    />
                  )}
                </ResponsiveChart>
              </div>

              <div className={`rounded-xl border p-5 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
                <div className="mb-4">
                  <h3 className="text-sm font-bold tracking-tight">Telemetry Trends (MultiLineChart)</h3>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Concurrent series with Catmull-Rom cubic bezier curves and theme-adapted legends.
                  </p>
                </div>
                <ResponsiveChart minHeight={270} maxHeight={320}>
                  {({ width, height }) => (
                    <MultiLineChart
                      data={data}
                      xKey="month"
                      series={[
                        { id: "revenue", label: "Revenue ($k)", yKey: "revenue", showArea: true },
                        { id: "orders", label: "Orders (k)", yKey: "orders" },
                        { id: "users", label: "Customers (k)", yKey: "users" }
                      ]}
                      width={width}
                      height={height}
                      theme={theme}
                      showLegend
                      valueFormatter={(v) => `${v}k`}
                      animation={{ preset, stagger: 0.02 }}
                    />
                  )}
                </ResponsiveChart>
              </div>
            </div>

            {/* Donut Chart Distribution */}
            <div className={`rounded-xl border p-5 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
              <div className="mb-4">
                <h3 className="text-sm font-bold tracking-tight">Channel Acquisition Share (DonutChart)</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Polar arc geometry with inner cutout, centered metric display, and accessible graphics semantics.
                </p>
              </div>
              <ResponsiveChart minHeight={260} maxHeight={320}>
                {({ width, height }) => (
                  <DonutChart
                    data={channels}
                    labelKey="channel"
                    valueKey="visitors"
                    width={width}
                    height={height}
                    theme={theme}
                    centerLabel={`${totalVisitors}k Visitors`}
                    showLegend
                    showLabels
                    valueFormatter={(v) => `${v}k`}
                    animation={{ preset, stagger: 0.035 }}
                  />
                )}
              </ResponsiveChart>
            </div>
          </div>
        )}

        {activeTab === "bar" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">BarChart Component Demonstration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Featuring roving tabIndex, value labels above short bars, and configurable zeroLine baseline.
                </p>
              </div>
            </div>
            <div className={`rounded-xl border p-6 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
              <ResponsiveChart minHeight={340} maxHeight={420}>
                {({ width, height }) => (
                  <BarChart
                    data={data}
                    xKey="month"
                    yKey="revenue"
                    width={width}
                    height={height}
                    theme={theme}
                    showValues
                    barRadius={6}
                    valueFormatter={(v) => `$${v},000`}
                    animation={{ preset, stagger: 0.04 }}
                  />
                )}
              </ResponsiveChart>
            </div>
          </div>
        )}

        {activeTab === "line" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">LineChart Component Demonstration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Clean area gradients, dynamic crosshairs, date label formatting, and connectNulls gap management.
                </p>
              </div>
            </div>
            <div className={`rounded-xl border p-6 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
              <ResponsiveChart minHeight={340} maxHeight={420}>
                {({ width, height }) => (
                  <LineChart
                    data={data}
                    xKey="month"
                    yKey="revenue"
                    width={width}
                    height={height}
                    theme={theme}
                    showArea
                    showPoints
                    valueFormatter={(v) => `$${v}k`}
                    animation={{ preset, stagger: 0.03 }}
                  />
                )}
              </ResponsiveChart>
            </div>
          </div>
        )}

        {activeTab === "multiline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">MultiLineChart Component Demonstration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Series-aware hover tracking, isolated active points, and theme-adaptive legend pills.
                </p>
              </div>
            </div>
            <div className={`rounded-xl border p-6 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
              <ResponsiveChart minHeight={340} maxHeight={420}>
                {({ width, height }) => (
                  <MultiLineChart
                    data={data}
                    xKey="month"
                    series={[
                      { id: "revenue", label: "Monthly Revenue", yKey: "revenue", showArea: true },
                      { id: "orders", label: "Customer Orders", yKey: "orders" },
                      { id: "users", label: "Registered Users", yKey: "users" }
                    ]}
                    width={width}
                    height={height}
                    theme={theme}
                    showLegend
                    valueFormatter={(v) => `${v}k`}
                    animation={{ preset, stagger: 0.025 }}
                  />
                )}
              </ResponsiveChart>
            </div>
          </div>
        )}

        {activeTab === "donut" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">DonutChart Component Demonstration</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Automatic percent calculation, radial gradients, center summary label, and negative clamping safeguards.
                </p>
              </div>
            </div>
            <div className={`rounded-xl border p-6 ${isDark ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/40 border-slate-200/70"}`}>
              <ResponsiveChart minHeight={340} maxHeight={420}>
                {({ width, height }) => (
                  <DonutChart
                    data={channels}
                    labelKey="channel"
                    valueKey="visitors"
                    width={width}
                    height={height}
                    theme={theme}
                    centerLabel={`${totalVisitors}k Total`}
                    showLegend
                    showLabels
                    valueFormatter={(v) => `${v}k`}
                    animation={{ preset, stagger: 0.04 }}
                  />
                )}
              </ResponsiveChart>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


const galleryData = [
  { month: "Jan", value: 24, secondary: 16 },
  { month: "Feb", value: 42, secondary: 28 },
  { month: "Mar", value: 34, secondary: 38 },
  { month: "Apr", value: 58, secondary: 46 }
];

/** A compact matrix covering every built-in theme, chart type, and surface. */
export function ThemeGallery() {
  return (
    <section id="theme-gallery" className="space-y-8">
      <div>
        <span className="font-mono text-[10px] font-bold tracking-wider text-indigo-600 uppercase">Surface matrix</span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Every theme on light and dark surfaces</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          The same five chart primitives are rendered for every built-in theme on both explicit surfaces. Use this matrix to choose tokens for a card, modal, or dashboard shell.
        </p>
      </div>
      {(["light", "dark"] as const).map((surface) => (
        <div key={surface} className={`rounded-2xl p-5 md:p-6 ${surface === "dark" ? "bg-slate-950" : "bg-slate-100"}`}>
          <div className={`mb-4 flex items-center justify-between ${surface === "dark" ? "text-slate-100" : "text-slate-900"}`}>
            <h3 className="text-base font-bold capitalize">{surface} surface</h3>
            <code className={`text-xs ${surface === "dark" ? "text-slate-400" : "text-slate-500"}`}>surface: "{surface}"</code>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {themes.map((theme) => {
              const themeInput = { base: theme.id, surface } as const;
              return (
                <div key={`${surface}-${theme.id}`} className={`rounded-xl border p-4 ${surface === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                  <h4 className={`mb-2 text-xs font-bold ${surface === "dark" ? "text-slate-100" : "text-slate-800"}`}>{theme.label}</h4>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <MiniChart title="Bar" theme={themeInput}><BarChart data={galleryData} xKey="month" yKey="value" width={190} height={130} theme={themeInput} animation={{ disabled: true }} /></MiniChart>
                    <MiniChart title="Line" theme={themeInput}><LineChart data={galleryData} xKey="month" yKey="value" width={190} height={130} theme={themeInput} animation={{ disabled: true }} /></MiniChart>
                    <MiniChart title="Multi" theme={themeInput}><MultiLineChart data={galleryData} xKey="month" series={[{ id: "value", label: "Value", yKey: "value" }, { id: "secondary", label: "Secondary", yKey: "secondary" }]} width={190} height={130} theme={themeInput} animation={{ disabled: true }} /></MiniChart>
                    <MiniChart title="Donut" theme={themeInput}><DonutChart data={[{ label: "A", value: 42 }, { label: "B", value: 31 }, { label: "C", value: 27 }]} labelKey="label" valueKey="value" width={190} height={130} theme={themeInput} animation={{ disabled: true }} /></MiniChart>
                    <MiniChart title="Sparkline" theme={themeInput}><Sparkline data={galleryData} xKey="month" yKey="value" width={190} height={130} theme={themeInput} animation={{ disabled: true }} /></MiniChart>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

function MiniChart({ title, theme, children }: { title: string; theme: { surface: "light" | "dark" }; children: React.ReactNode }) {
  return (
    <div>
      <div className={`mb-1 text-[10px] font-semibold ${theme.surface === "dark" ? "text-slate-400" : "text-slate-500"}`}>{title}</div>
      <div className={`overflow-hidden rounded-lg ${theme.surface === "dark" ? "bg-slate-950" : "bg-white"}`}>{children}</div>
    </div>
  );
}
