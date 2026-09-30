import { ChartShowcase } from "../components/ChartShowcase";

const features = [
  {
    title: "Physics-Driven Interpolation",
    category: "MOTION",
    body: "Built directly on Framer Motion primitives. When data updates or time periods shift, geometry interpolates smoothly instead of snapping."
  },
  {
    title: "12 Curated Palettes",
    category: "DESIGN TOKENS",
    body: "Designed for SaaS analytics, fintech telemetry, and inventory displays. Tuned hues with high contrast and zero neon noise."
  },
  {
    title: "Container-Aware Scales",
    category: "RESPONSIVENESS",
    body: "Powered by ResizeObserver with bounded scales, SVG viewBox normalization, and full reduced-motion accessibility out of the box."
  }
];

const palettes = {
  aurora: ["#2563eb", "#0284c7", "#0d9488", "#d97706", "#7c3aed", "#e11d48"],
  ocean: ["#0284c7", "#2563eb", "#06b6d4", "#0369a1", "#0891b2", "#1d4ed8"],
  sunset: ["#ea580c", "#d97706", "#c2410c", "#e11d48", "#9a3412", "#b91c1c"],
  forest: ["#059669", "#0d9488", "#16a34a", "#65a30d", "#047857", "#15803d"],
  candy: ["#9333ea", "#c026d3", "#db2777", "#6366f1", "#7c3aed", "#e11d48"],
  royal: ["#4338ca", "#3b82f6", "#6366f1", "#64748b", "#1e293b", "#334155"],
  fire: ["#dc2626", "#ea580c", "#d97706", "#b91c1c", "#c2410c", "#7f1d1d"],
  cyber: ["#0891b2", "#16a34a", "#7c3aed", "#2563eb", "#0284c7", "#4f46e5"],
  pastel: ["#64748b", "#0284c7", "#0d9488", "#d97706", "#7c3aed", "#be185d"],
  graphite: ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"],
  emerald: ["#059669", "#0d9488", "#10b981", "#047857", "#0f766e", "#34d399"],
  bloom: ["#be185d", "#e11d48", "#9d174d", "#c026d3", "#fb7185", "#f43f5e"]
};

const components = [
  { name: "BarChart", bestFor: "Categorical comparison, revenue by interval, order counts", traits: "Individual bar spring physics, rounded caps, value labels" },
  { name: "LineChart", bestFor: "Continuous metrics: retention, MRR, traffic, temperature", traits: "Catmull-Rom cubic bezier curves, understated area gradient, hover probes" },
  { name: "MultiLineChart", bestFor: "Multi-series telemetry: revenue vs users vs orders", traits: "Synchronized crosshairs, per-series strokes, auto-keying" },
  { name: "DonutChart", bestFor: "Compositional ratios, acquisition channels, device share", traits: "Polar coordinate interpolation, inner cutout, centered metric display" },
  { name: "Sparkline", bestFor: "KPI telemetry cards, compact table embeds, header badges", traits: "Zero-dependency layout, lightweight memory profile, trailing point pulse" },
  { name: "ResponsiveChart", bestFor: "Full-width dashboard grids & dynamic window views", traits: "ResizeObserver integration, aspect ratio lock, zero layout shift" }
];

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900">
      {/* Top Engineering Nav */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-bold text-white shadow-sm">
              MC
            </span>
            <span className="font-bold tracking-tight text-slate-900 text-sm">motion-charts</span>
            <span className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 font-semibold">
              v0.1.0
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold text-slate-600">
            <a href="#playground" className="hover:text-slate-950 transition">Playground</a>
            <a href="#palettes" className="hover:text-slate-950 transition">Palettes</a>
            <a href="#api" className="hover:text-slate-950 transition">API Reference</a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 py-12 md:py-16">
        {/* Header Hero */}
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              SVG + Framer Motion Primitives
            </div>
            
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] leading-[1.12]">
              Charts engineered for production product interfaces.
            </h1>
            
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              A declarative React library where every coordinate interpolates via Framer Motion physics. Calibrated color tokens, responsive ResizeObserver measurement, and accessible geometry.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs text-slate-800 shadow-sm">
                <span className="text-slate-400 mr-2">$</span>
                npm install @motion-charts/core framer-motion
              </div>
              <a
                href="#playground"
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Inspect Live Charts
              </a>
            </div>
          </div>

          {/* Code Specimen */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-700">MonthlyRevenueChart.tsx</span>
              </div>
              <span className="font-mono text-[11px] font-medium text-slate-500">React 19</span>
            </div>
            <pre className="p-5 font-mono text-xs leading-relaxed text-slate-800 bg-[#fbfcfd] overflow-x-auto">
              <code>{`import { BarChart, ResponsiveChart } from "@motion-charts/core";

export function MonthlyRevenue({ data }) {
  return (
    <ResponsiveChart minHeight={280}>
      {({ width, height }) => (
        <BarChart
          data={data}
          width={width}
          height={height}
          xKey="month"
          yKey="revenue"
          theme="aurora"
          animation={{ preset: "gentle", stagger: 0.03 }}
          valueFormatter={(v) => \`$\${v}k\`}
          showValues
        />
      )}
    </ResponsiveChart>
  );
}`}</code>
            </pre>
          </div>
        </section>

        {/* Live Interactive Showcase */}
        <section id="playground">
          <ChartShowcase />
        </section>

        {/* Core Principles */}
        <section className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="font-mono text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                {feature.category}
              </span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{feature.body}</p>
            </div>
          ))}
        </section>

        {/* Palettes Grid */}
        <section id="palettes" className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="font-mono text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                Tokens
              </span>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Twelve Curated Palettes</h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              Each palette is formulated for high distinction across series and optimal contrast against light surfaces.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(palettes).map(([name, colors]) => (
              <div key={name} className="rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition hover:border-slate-200">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold capitalize text-slate-800">{name}</span>
                  <span className="font-mono text-[10px] text-slate-400">6 tones</span>
                </div>
                <div className="flex h-6 overflow-hidden rounded border border-slate-200/60 shadow-xs">
                  {colors.map((color) => (
                    <span key={color} className="flex-1" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Component Table */}
        <section id="api" className="rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <span className="font-mono text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
              Reference
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Component Primitives</h2>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-mono text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-4 font-semibold">Primitive</th>
                  <th className="py-3 px-4 font-semibold">Primary Use Case</th>
                  <th className="py-3 px-4 font-semibold">Engineered Attributes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {components.map((item) => (
                  <tr key={item.name} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-600">{item.bestFor}</td>
                    <td className="py-3 px-4 text-slate-500">{item.traits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 motion-charts · MIT License</p>
          <div className="flex items-center gap-4">
            <span>npm: @motion-charts/core</span>
            <span>TypeScript 5.9</span>
            <span>Framer Motion 12</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
