"use client";

import { useMemo, useState } from "react";
import { BarChart, DonutChart, MultiLineChart, ResponsiveChart, Sparkline, type ChartThemeName } from "@motion-charts/core";

const datasets = [
  [
    { month: "Jan", revenue: 42, users: 18, orders: 31 },
    { month: "Feb", revenue: 64, users: 28, orders: 46 },
    { month: "Mar", revenue: 51, users: 34, orders: 39 },
    { month: "Apr", revenue: 86, users: 41, orders: 61 },
    { month: "May", revenue: 72, users: 54, orders: 57 },
    { month: "Jun", revenue: 98, users: 67, orders: 73 }
  ],
  [
    { month: "Jan", revenue: 58, users: 24, orders: 41 },
    { month: "Feb", revenue: 36, users: 21, orders: 29 },
    { month: "Mar", revenue: 77, users: 38, orders: 58 },
    { month: "Apr", revenue: 69, users: 45, orders: 54 },
    { month: "May", revenue: 112, users: 72, orders: 86 },
    { month: "Jun", revenue: 91, users: 66, orders: 71 }
  ],
  [
    { month: "Jan", revenue: 34, users: 15, orders: 24 },
    { month: "Feb", revenue: 52, users: 29, orders: 38 },
    { month: "Mar", revenue: 63, users: 36, orders: 49 },
    { month: "Apr", revenue: 48, users: 32, orders: 36 },
    { month: "May", revenue: 88, users: 59, orders: 67 },
    { month: "Jun", revenue: 124, users: 84, orders: 93 }
  ]
];

const channels = [
  [
    { channel: "Organic", users: 44 },
    { channel: "Product Hunt", users: 18 },
    { channel: "Twitter", users: 24 },
    { channel: "Newsletter", users: 14 }
  ],
  [
    { channel: "Organic", users: 31 },
    { channel: "Product Hunt", users: 34 },
    { channel: "Twitter", users: 21 },
    { channel: "Newsletter", users: 24 }
  ],
  [
    { channel: "Organic", users: 52 },
    { channel: "Product Hunt", users: 16 },
    { channel: "Twitter", users: 12 },
    { channel: "Newsletter", users: 32 }
  ]
];

const themes: ChartThemeName[] = ["aurora", "ocean", "sunset", "candy", "midnight", "minimal"];

export function ChartShowcase() {
  const [version, setVersion] = useState(0);
  const [theme, setTheme] = useState<ChartThemeName>("aurora");
  const data = datasets[version % datasets.length] ?? datasets[0]!;
  const channelData = channels[version % channels.length] ?? channels[0]!;
  const totalUsers = useMemo(() => channelData.reduce((sum, item) => sum + item.users, 0), [channelData]);
  const kpis = useMemo(
    () => [
      { label: "Revenue", value: `$${data[data.length - 1]?.revenue ?? 0}k`, key: "revenue" as const, colorIndex: 0 },
      { label: "Customers", value: `${data[data.length - 1]?.users ?? 0}k`, key: "users" as const, colorIndex: 1 },
      { label: "Orders", value: `${data[data.length - 1]?.orders ?? 0}k`, key: "orders" as const, colorIndex: 2 }
    ],
    [data]
  );

  return (
    <section className="grid gap-6">
      {/* Interactive Bar Chart Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Interactive Playground</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Live data transitions, spring physics, and responsive SVG rasterization.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVersion((value) => value + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 8a6 6 0 1 0 1.76-4.24L1 6m0 0V2m0 4h4" />
              </svg>
              Shuffle Data
            </button>
          </div>
        </div>

        {/* Theme Selectors */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100/80 border border-slate-200/60 w-fit">
          <span className="text-[11px] font-medium text-slate-500 px-2">Palette:</span>
          {themes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTheme(item)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                theme === item
                  ? "bg-white text-slate-900 shadow-sm font-semibold border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* KPI Sparklines Grid */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {kpis.map((kpi) => (
            <article key={kpi.key} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition hover:border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100/70 text-emerald-800">
                  +12.4%
                </span>
              </div>
              <div className="mt-2">
                <Sparkline
                  data={data.map((item) => ({ month: item.month, value: item[kpi.key] }))}
                  xKey="month"
                  yKey="value"
                  theme={theme}
                  colorIndex={kpi.colorIndex}
                  height={76}
                  padding={14}
                  ariaLabel={`${kpi.label} sparkline`}
                  valueFormatter={(value) => `${value}k`}
                  animation={{ preset: "snappy", stagger: 0.012 }}
                  showEndValue
                />
              </div>
            </article>
          ))}
        </div>

        {/* BarChart Container */}
        <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-4 pt-6">
          <ResponsiveChart minHeight={300} maxHeight={380}>
            {({ width, height }) => (
              <BarChart
                data={data}
                width={width}
                height={height}
                xKey="month"
                yKey="revenue"
                theme={theme}
                ariaLabel="Animated monthly revenue bar chart"
                ariaDescription="Bars animate to new values whenever the dataset changes."
                valueFormatter={(value) => `$${value}k`}
                animation={{ preset: "gentle", stagger: 0.035 }}
                barRadius={4}
                tooltip={({ label, value, color }) => (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: color }} />
                      <span className="text-[11px] font-medium text-slate-500">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 pl-3.5">${value}k revenue</span>
                  </div>
                )}
              />
            )}
          </ResponsiveChart>
        </div>
      </div>

      {/* Two Column Grid for Trends and Composition */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Multi-Series Metric Trends</h3>
            <p className="text-xs text-slate-500 mt-0.5">Smooth cubic bezier interpolation across concurrent series.</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-4 pt-5">
            <ResponsiveChart minHeight={290} maxHeight={360} aspectRatio={1.65}>
              {({ width, height }) => (
                <MultiLineChart
                  data={data}
                  width={width}
                  height={height}
                  xKey="month"
                  series={[
                    { id: "revenue", label: "Revenue", yKey: "revenue", showArea: true },
                    { id: "users", label: "Users", yKey: "users" },
                    { id: "orders", label: "Orders", yKey: "orders" }
                  ]}
                  theme={theme}
                  ariaLabel="Revenue users and orders multi-line chart"
                  valueFormatter={(value) => `${value}k`}
                  animation={{ preset: "gentle", stagger: 0.025 }}
                />
              )}
            </ResponsiveChart>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Acquisition Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Polar arc transitions with centered total summary.</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-4 pt-5">
            <ResponsiveChart minHeight={270} maxHeight={340} aspectRatio={1.15}>
              {({ width, height }) => (
                <DonutChart
                  data={channelData}
                  width={width}
                  height={height}
                  labelKey="channel"
                  valueKey="users"
                  theme={theme}
                  ariaLabel="Animated acquisition channel donut chart"
                  valueFormatter={(value) => `${value}k`}
                  centerLabel={`${totalUsers}k`}
                  animation={{ preset: "gentle", stagger: 0.04 }}
                  showLabels
                />
              )}
            </ResponsiveChart>
          </div>
        </div>
      </div>
    </section>
  );
}
