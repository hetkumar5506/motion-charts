"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart,
  DonutChart,
  LineChart,
  MultiLineChart,
  ResponsiveChart,
  Sparkline,
  paletteColors,
  paletteProfiles,
  type AnimationPresetName,
  type ChartPaletteName,
  type ChartThemeInput,
  type ChartThemeName,
  type MotionOptions
} from "@motion-charts/core";

const revenueDataSets = [
  [
    { month: "Jan", revenue: 45, users: 22, orders: 34 },
    { month: "Feb", revenue: 68, users: 31, orders: 52 },
    { month: "Mar", revenue: 54, users: 39, orders: 44 },
    { month: "Apr", revenue: 92, users: 48, orders: 67 },
    { month: "May", revenue: 81, users: 59, orders: 63 },
    { month: "Jun", revenue: 115, users: 74, orders: 85 }
  ],
  [
    { month: "Jan", revenue: 62, users: 28, orders: 44 },
    { month: "Feb", revenue: 41, users: 24, orders: 32 },
    { month: "Mar", revenue: 84, users: 42, orders: 63 },
    { month: "Apr", revenue: 76, users: 51, orders: 59 },
    { month: "May", revenue: 125, users: 80, orders: 94 },
    { month: "Jun", revenue: 104, users: 72, orders: 79 }
  ],
  [
    { month: "Jan", revenue: 38, users: 18, orders: 28 },
    { month: "Feb", revenue: 58, users: 33, orders: 42 },
    { month: "Mar", revenue: 71, users: 41, orders: 55 },
    { month: "Apr", revenue: 55, users: 36, orders: 51 },
    { month: "May", revenue: 98, users: 66, orders: 70 },
    { month: "Jun", revenue: 138, users: 92, orders: 96 }
  ]
];

const trafficChannels = [
  [
    { channel: "Direct", visitors: 48 },
    { channel: "Launch", visitors: 26 },
    { channel: "Social", visitors: 22 },
    { channel: "Email", visitors: 16 }
  ],
  [
    { channel: "Direct", visitors: 36 },
    { channel: "Launch", visitors: 42 },
    { channel: "Social", visitors: 19 },
    { channel: "Email", visitors: 25 }
  ],
  [
    { channel: "Direct", visitors: 58 },
    { channel: "Launch", visitors: 18 },
    { channel: "Social", visitors: 14 },
    { channel: "Email", visitors: 34 }
  ]
];

const themes: { id: ChartThemeName; label: string; accent: string; palette: "aurora" | "cyber" | "candy" | "ocean" | "sunset" | "graphite" }[] = [
  { id: "aurora", label: "Aurora", accent: "#2563eb", palette: "aurora" },
  { id: "midnight", label: "Midnight", accent: "#51b2c9", palette: "cyber" },
  { id: "candy", label: "Candy", accent: "#c026d3", palette: "candy" },
  { id: "ocean", label: "Ocean", accent: "#058ea5", palette: "ocean" },
  { id: "sunset", label: "Sunset", accent: "#ea580c", palette: "sunset" },
  { id: "minimal", label: "Minimal", accent: "#0f172a", palette: "graphite" }
];

const presets: AnimationPresetName[] = ["spring", "gentle", "silky", "lively", "cinematic", "snappy", "bouncy", "calm"];
const entrances: NonNullable<MotionOptions["entrance"]>[] = ["fade", "rise", "pop", "draw", "sweep"];
const paletteChoices: ChartPaletteName[] = ["aurora", "lagoon", "orchid", "citrus", "prism", "okabe", "editorial", "terra", "nordic", "plum"];
const cascadeDirections: NonNullable<MotionOptions["staggerFrom"]>[] = ["start", "center", "end"];
const tabs = ["overview", "bar", "line", "multiline", "donut"] as const;
type Tab = (typeof tabs)[number];

const tabCopy: Record<Tab, { title: string; description: string; label: string }> = {
  overview: {
    title: "Revenue pulse",
    description: "A composed dashboard view: KPI trends, categorical performance, and acquisition share in one responsive surface.",
    label: "Overview"
  },
  bar: {
    title: "Categorical motion",
    description: "Baseline-anchored bars retain their physical origin as values and layouts change.",
    label: "Bar"
  },
  line: {
    title: "Continuous signal",
    description: "Smooth geometry, precise interaction targets, and an optional area layer for a single metric.",
    label: "Line"
  },
  multiline: {
    title: "Synchronized telemetry",
    description: "Stable series IDs keep related paths, legends, and keyboard targets in sync.",
    label: "Multi-line"
  },
  donut: {
    title: "Share of attention",
    description: "Arc interpolation makes composition changes feel deliberate instead of discontinuous.",
    label: "Donut"
  }
};

export function ChartShowcase() {
  const [dataIndex, setDataIndex] = useState(0);
  const [theme, setTheme] = useState<ChartThemeName>("aurora");
  const [palette, setPalette] = useState<ChartPaletteName>("aurora");
  const [preset, setPreset] = useState<AnimationPresetName>("silky");
  const [entrance, setEntrance] = useState<NonNullable<MotionOptions["entrance"]>>("rise");
  const [staggerFrom, setStaggerFrom] = useState<NonNullable<MotionOptions["staggerFrom"]>>("start");
  const [finish, setFinish] = useState<"signature" | "glass">("glass");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const data = revenueDataSets[dataIndex % revenueDataSets.length] ?? revenueDataSets[0]!;
  const channels = trafficChannels[dataIndex % trafficChannels.length] ?? trafficChannels[0]!;
  const totalVisitors = useMemo(() => channels.reduce((sum, item) => sum + item.visitors, 0), [channels]);
  const activeTheme = themes.find((item) => item.id === theme) ?? themes[0]!;
  const activePalette = paletteProfiles[palette];
  const isDark = theme === "midnight";
  const chartTheme: ChartThemeInput = { base: theme, palette };
  const animation = { preset, entrance, stagger: 0.035, staggerFrom } as const;
  const chrome = isDark
    ? "border-white/10 bg-[#0b1220] text-slate-100"
    : "border-slate-200 bg-white text-slate-950 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.5)]";
  const subtle = isDark ? "border-white/10 bg-white/[0.035]" : "border-slate-200/90 bg-slate-50/70";
  const muted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`overflow-hidden rounded-[28px] border ${chrome}`}>
      <div className={`flex flex-col gap-5 border-b px-5 py-5 sm:px-7 lg:flex-row lg:items-end lg:justify-between ${isDark ? "border-white/10" : "border-slate-200"}`}>
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>
            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? "text-cyan-300" : "text-blue-700"}`}>Live control room</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-[1.7rem]">Make a change. Watch the geometry keep up.</h2>
          <p className={`mt-2 text-sm leading-6 ${muted}`}>Switch data, palette, visual finish, and motion in a real set of chart primitives. Every demo is keyboard-accessible and rendered from the published API.</p>
        </div>

        <button
          type="button"
          onClick={() => setDataIndex((value) => value + 1)}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          <RefreshIcon />
          Run new scenario
          <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">0{(dataIndex % revenueDataSets.length) + 1}/0{revenueDataSets.length}</span>
        </button>
      </div>

      <div className={`flex flex-col gap-4 border-b px-5 py-4 sm:px-7 xl:flex-row xl:items-center xl:justify-between ${isDark ? "border-white/10 bg-black/10" : "border-slate-200 bg-slate-50/80"}`}>
        <div className="flex flex-wrap gap-1 rounded-xl bg-black/[0.045] p-1 dark:bg-white/[0.06]" role="tablist" aria-label="Chart demo">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                activeTab === tab
                  ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-slate-950 shadow-sm"
                  : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tabCopy[tab].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <fieldset className="flex items-center gap-1.5">
            <legend className="sr-only">Theme</legend>
            <span className={`mr-1 text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Theme</span>
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Use ${item.label} theme`}
                aria-pressed={theme === item.id}
                onClick={() => setTheme(item.id)}
                className={`flex h-6 w-6 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${theme === item.id ? "ring-2 ring-blue-500 ring-offset-2" : "opacity-70 hover:scale-110 hover:opacity-100"} ${isDark ? "ring-offset-[#0b1220]" : "ring-offset-slate-50"}`}
                style={{ backgroundColor: item.accent }}
              >
                <span className="sr-only">{item.label}</span>
              </button>
            ))}
          </fieldset>

          <label className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Palette</span>
            <select
              value={palette}
              onChange={(event) => setPalette(event.target.value as ChartPaletteName)}
              className={`max-w-28 rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
            >
              {paletteChoices.map((item) => <option key={item} value={item}>{paletteProfiles[item].label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Motion</span>
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value as AnimationPresetName)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
            >
              {presets.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Entrance</span>
            <select
              value={entrance}
              onChange={(event) => setEntrance(event.target.value as NonNullable<MotionOptions["entrance"]>)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
            >
              {entrances.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Cascade</span>
            <select
              value={staggerFrom}
              onChange={(event) => setStaggerFrom(event.target.value as NonNullable<MotionOptions["staggerFrom"]>)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
            >
              {cascadeDirections.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${muted}`}>Finish</span>
            <select
              value={finish}
              onChange={(event) => setFinish(event.target.value as "signature" | "glass")}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${isDark ? "border-white/10 bg-white/[0.06] text-slate-100" : "border-slate-200 bg-white text-slate-800"}`}
            >
              <option value="signature">signature</option>
              <option value="glass">glass + gradient</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[255px_minmax(0,1fr)]">
        <aside className={`border-b px-5 py-6 xl:border-b-0 xl:border-r xl:px-7 ${isDark ? "border-white/10 bg-black/10" : "border-slate-200 bg-slate-50/45"}`}>
          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? "text-cyan-300" : "text-blue-700"}`}>Selected module</span>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em]">{tabCopy[activeTab].title}</h3>
          <p className={`mt-2 text-xs leading-5 ${muted}`}>{tabCopy[activeTab].description}</p>

          <div className={`mt-6 grid gap-2 rounded-2xl border p-3 ${subtle}`}>
            <StatusRow label="Theme" value={activeTheme.label} color={activeTheme.accent} />
            <StatusRow label="Palette" value={activePalette.label} color={(paletteColors(palette, isDark ? "dark" : "light") ?? [activeTheme.accent])[0]} />
            <StatusRow label="Preset" value={preset} />
            <StatusRow label="Entrance" value={entrance} />
            <StatusRow label="Cascade" value={staggerFrom} />
            <StatusRow label="Finish" value={finish} />
            <p className={`border-t pt-2 text-[11px] leading-4 ${muted}`}>{activePalette.mood}. Best for {activePalette.bestFor.slice(0, 2).join(" and ")}.</p>
          </div>

          <div className="mt-6 hidden xl:block">
            <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${muted}`}>Included discipline</p>
            <ul className={`mt-3 space-y-2 text-xs ${muted}`}>
              <li className="flex gap-2"><CheckIcon /> Final geometry on SSR</li>
              <li className="flex gap-2"><CheckIcon /> Roving keyboard focus</li>
              <li className="flex gap-2"><CheckIcon /> Reduced-motion safe</li>
            </ul>
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7" role="tabpanel">
          {activeTab === "overview" ? <Overview data={data} channels={channels} totalVisitors={totalVisitors} theme={chartTheme} animation={animation} finish={finish} dark={isDark} /> : null}
          {activeTab === "bar" ? <BarDemo data={data} theme={chartTheme} animation={animation} finish={finish} dark={isDark} /> : null}
          {activeTab === "line" ? <LineDemo data={data} theme={chartTheme} animation={animation} finish={finish} dark={isDark} /> : null}
          {activeTab === "multiline" ? <MultiLineDemo data={data} theme={chartTheme} animation={animation} finish={finish} dark={isDark} /> : null}
          {activeTab === "donut" ? <DonutDemo channels={channels} totalVisitors={totalVisitors} theme={chartTheme} animation={animation} finish={finish} dark={isDark} /> : null}
        </div>
      </div>
    </div>
  );
}

type RevenueDatum = (typeof revenueDataSets)[number][number];
type ChannelDatum = (typeof trafficChannels)[number][number];
type DemoProps = {
  theme: ChartThemeInput;
  animation: { readonly preset: AnimationPresetName; readonly entrance: NonNullable<MotionOptions["entrance"]>; readonly stagger: number; readonly staggerFrom: NonNullable<MotionOptions["staggerFrom"]> };
  finish: "signature" | "glass";
  dark: boolean;
};

function Overview({ data, channels, totalVisitors, theme, animation, finish, dark }: DemoProps & { data: RevenueDatum[]; channels: ChannelDatum[]; totalVisitors: number }) {
  const cards = [
    { label: "Revenue", value: `$${data[data.length - 1]?.revenue ?? 0}k`, key: "revenue" as const, delta: "+12.8%", colorIndex: 0 },
    { label: "Customers", value: `${data[data.length - 1]?.users ?? 0}k`, key: "users" as const, delta: "+8.4%", colorIndex: 1 },
    { label: "Orders", value: `${data[data.length - 1]?.orders ?? 0}k`, key: "orders" as const, delta: "+15.1%", colorIndex: 2 }
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/[0.035]" : "border-slate-200 bg-slate-50/60"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{card.label}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{card.delta}</span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <strong className="text-2xl font-semibold tracking-[-0.04em]">{card.value}</strong>
              <div className="w-20">
                <Sparkline data={data.map((item) => ({ month: item.month, value: item[card.key] }))} xKey="month" yKey="value" height={42} padding={3} theme={theme} colorIndex={card.colorIndex} showArea showPoints={false} strokeVariant={finish === "glass" ? "gradient" : "solid"} areaOpacity={finish === "glass" ? 0.24 : 0.16} animation={animation} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(240px,0.8fr)]">
        <DemoPanel title="Monthly revenue" detail="BarChart · rounded endpoints" dark={dark}>
          <ResponsiveChart minHeight={260} maxHeight={300}>
            {({ width, height }) => <BarChart data={data} xKey="month" yKey="revenue" width={width} height={height} theme={theme} showValues={{ formatter: (value) => `$${value}k` }} barVariant={finish === "glass" ? "glass" : "gradient"} barRadius={8} animation={animation} ariaLabel="Monthly revenue" />}
          </ResponsiveChart>
        </DemoPanel>
        <DemoPanel title="Acquisition mix" detail={`${totalVisitors}k visitors · DonutChart`} dark={dark}>
          <ResponsiveChart minHeight={260} maxHeight={300}>
            {({ width, height }) => <DonutChart data={channels} labelKey="channel" valueKey="visitors" width={width} height={height} theme={theme} centerLabel={`${totalVisitors}k`} sliceVariant={finish === "glass" ? "glass" : "gradient"} showLegend={false} showLabels animation={animation} ariaLabel="Acquisition channel share" />}
          </ResponsiveChart>
        </DemoPanel>
      </div>
    </div>
  );
}

function BarDemo({ data, theme, animation, finish, dark }: DemoProps & { data: RevenueDatum[] }) {
  return (
    <DemoPanel title="Monthly revenue" detail="Value labels use their own compact formatter; axes and tooltips retain the full formatter." dark={dark}>
      <ResponsiveChart minHeight={360} maxHeight={440}>
        {({ width, height }) => <BarChart data={data} xKey="month" yKey="revenue" width={width} height={height} theme={theme} showValues={{ formatter: (value) => `$${value}k` }} valueFormatter={(value) => `$${value.toLocaleString()}k`} barVariant={finish === "glass" ? "glass" : "gradient"} barRadius={9} animation={animation} ariaLabel="Monthly revenue" />}
      </ResponsiveChart>
    </DemoPanel>
  );
}

function LineDemo({ data, theme, animation, finish, dark }: DemoProps & { data: RevenueDatum[] }) {
  return (
    <DemoPanel title="Customer growth" detail="LineChart · palette-blended stroke · halo points · spring crosshair" dark={dark}>
      <ResponsiveChart minHeight={360} maxHeight={440}>
        {({ width, height }) => <LineChart data={data} xKey="month" yKey="users" width={width} height={height} theme={theme} showArea showPoints crosshair strokeVariant={finish === "glass" ? "gradient" : "solid"} areaOpacity={finish === "glass" ? 0.26 : 0.16} pointVariant={finish === "glass" ? "halo" : "solid"} valueFormatter={(value) => `${value}k`} animation={animation} ariaLabel="Monthly customer growth" />}
      </ResponsiveChart>
    </DemoPanel>
  );
}

function MultiLineDemo({ data, theme, animation, finish, dark }: DemoProps & { data: RevenueDatum[] }) {
  return (
    <DemoPanel title="Revenue, orders, and customers" detail="MultiLineChart · synchronized legend · gradient path option" dark={dark}>
      <ResponsiveChart minHeight={360} maxHeight={440}>
        {({ width, height }) => <MultiLineChart data={data} xKey="month" series={[{ id: "revenue", label: "Revenue", yKey: "revenue", showArea: true }, { id: "orders", label: "Orders", yKey: "orders" }, { id: "users", label: "Customers", yKey: "users" }]} width={width} height={height} theme={theme} showLegend crosshair strokeVariant={finish === "glass" ? "gradient" : "solid"} areaOpacity={finish === "glass" ? 0.22 : 0.14} valueFormatter={(value) => `${value}k`} animation={animation} ariaLabel="Revenue, orders, and customers by month" />}
      </ResponsiveChart>
    </DemoPanel>
  );
}

function DonutDemo({ channels, totalVisitors, theme, animation, finish, dark }: DemoProps & { channels: ChannelDatum[]; totalVisitors: number }) {
  return (
    <DemoPanel title="Acquisition channel share" detail="DonutChart · spring updates · sweep and pop entrances" dark={dark}>
      <ResponsiveChart minHeight={360} maxHeight={440}>
        {({ width, height }) => <DonutChart data={channels} labelKey="channel" valueKey="visitors" width={width} height={height} theme={theme} centerLabel={`${totalVisitors}k total`} sliceVariant={finish === "glass" ? "glass" : "gradient"} showLegend showLabels valueFormatter={(value) => `${value}k`} animation={animation} ariaLabel="Acquisition channel share" />}
      </ResponsiveChart>
    </DemoPanel>
  );
}

function DemoPanel({ title, detail, dark, children }: { title: string; detail: string; dark: boolean; children: ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-white/[0.025]" : "border-slate-200 bg-white"}`}>
      <div className={`flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${dark ? "border-white/10" : "border-slate-100"}`}>
        <h3 className="text-sm font-semibold tracking-[-0.015em]">{title}</h3>
        <span className={`font-mono text-[10px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{detail}</span>
      </div>
      <div className="min-w-0 p-2 sm:p-3">{children}</div>
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5 font-mono font-medium text-inherit">{color ? <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> : null}{value}</span>
    </div>
  );
}

const galleryData = [
  { month: "Jan", value: 24 },
  { month: "Feb", value: 42 },
  { month: "Mar", value: 34 },
  { month: "Apr", value: 58 }
];

/** A compact, live check of every built-in surface-aware theme. */
export function ThemeGallery() {
  const [surface, setSurface] = useState<"light" | "dark">("light");
  const isDark = surface === "dark";

  return (
    <section id="themes" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Theme lab</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950">One token system. Two dependable surfaces.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Inspect all six built-in themes on the surface you are shipping. The same palette calibration powers named themes and explicit palette selections, including the new high-energy <code>prism</code> palette.</p>
        </div>
        <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Theme gallery surface">
          {(["light", "dark"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setSurface(item)} aria-pressed={surface === item} className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${surface === item ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-950"}`}>{item}</button>
          ))}
        </div>
      </div>

      <div className={`rounded-[28px] p-4 sm:p-6 ${isDark ? "bg-[#09111f]" : "border border-slate-200 bg-slate-100/80"}`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((item) => {
            const themeInput = { base: item.id, surface } as const;
            const colors = paletteColors(item.palette, surface) ?? [];
            return (
              <article key={`${surface}-${item.id}`} className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.045]" : "border-white bg-white shadow-sm"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} /><h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>{item.label}</h3></div>
                  <span className={`font-mono text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{surface}</span>
                </div>
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
                  {colors.map((color) => <span key={color} className="flex-1" style={{ backgroundColor: color }} />)}
                </div>
                <div className={`mt-4 rounded-xl ${isDark ? "bg-[#0b1220]" : "bg-slate-50"}`}>
                  <Sparkline data={galleryData} xKey="month" yKey="value" width={240} height={76} padding={10} theme={themeInput} showArea showPoints={false} animation={{ disabled: true }} ariaLabel={`${item.label} ${surface} theme preview`} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RefreshIcon() {
  return <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13.4 5.4A5.8 5.8 0 1 0 14 8M13.4 1.8v3.9H9.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 8 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
