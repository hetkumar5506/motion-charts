import { ChartShowcase, ThemeGallery } from "../components/ChartShowcase";

const principles = [
  {
    number: "01",
    title: "Motion that explains change",
    body: "Bars preserve their baseline, paths morph through data updates, and donut slices interpolate angles instead of SVG command strings."
  },
  {
    number: "02",
    title: "Tokens with guardrails",
    body: "Curated palettes adapt to their surface, with light-surface colors calibrated for contrast and named themes kept in sync."
  },
  {
    number: "03",
    title: "Interaction is a feature",
    body: "Keyboard roving focus, native SVG focus rings, tooltips, SSR-safe final geometry, and reduced-motion support ship together."
  }
];

const components = [
  { name: "BarChart", use: "Category comparisons", note: "Grouped, stacked, or horizontal" },
  { name: "LineChart", use: "A single changing signal", note: "Area, points, crosshair, draw entrance" },
  { name: "MultiLineChart", use: "Related metrics over time", note: "Stable series IDs and legend" },
  { name: "DonutChart", use: "Parts of a whole", note: "Arc updates and sweep entrance" },
  { name: "Sparkline", use: "Dense KPI context", note: "Small, responsive trend marks" },
  { name: "ResponsiveChart", use: "Measured layouts", note: "ResizeObserver render-function wrapper" }
];

export default function Page() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[620px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(191,219,254,0.72),rgba(245,247,251,0)_66%)]" />
      <div className="relative z-10">
        <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f5f7fb]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
            <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Motion Charts home">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 font-mono text-[10px] font-bold tracking-[-0.1em] text-white shadow-lg shadow-slate-950/15">MC</span>
              <span className="text-sm font-semibold tracking-[-0.03em]">motion-charts</span>
              <span className="hidden rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-700 sm:inline">v0.2.3</span>
            </a>
            <div className="hidden items-center gap-6 text-xs font-semibold text-slate-600 md:flex">
              <a href="#playground" className="transition hover:text-slate-950">Playground</a>
              <a href="#themes" className="transition hover:text-slate-950">Theme lab</a>
              <a href="#components" className="transition hover:text-slate-950">Components</a>
              <a href="https://github.com/hetkumar5506/motion-charts" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
                GitHub <ExternalIcon />
              </a>
            </div>
            <a href="#playground" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800 md:hidden">Explore</a>
          </div>
        </nav>

        <main id="top">
          <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                React · SVG · Framer Motion
              </div>
              <h1 className="mt-6 max-w-3xl text-[2.9rem] font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[4.75rem]">
                Data in motion,<br />
                <span className="text-blue-700">without the compromise.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                An animation-first chart kit for product teams that care about the last ten percent: clear interactions, dependable rendering, and motion with a reason to exist.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-xs text-slate-700 shadow-sm">
                  <span className="text-blue-600">$</span>
                  <code className="truncate">npm i @motion-charts/core framer-motion</code>
                </div>
                <a href="#playground" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Open the playground <ArrowIcon />
                </a>
              </div>

              <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-slate-200">
                <Metric value="6" label="chart primitives" />
                <Metric value="21" label="curated palettes" />
                <Metric value="0" label="layout shifts" />
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="absolute -inset-7 -z-10 rounded-[2.5rem] bg-blue-400/15 blur-3xl" />
              <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-[#09111f] p-1 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.7)]">
                <div className="rounded-[23px] border border-white/10 bg-[linear-gradient(135deg,#0f1b30_0%,#09111f_52%,#0d1627_100%)] p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" /><span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">Revenue signal</span></div>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-300">LIVE</span>
                  </div>
                  <div className="mt-8 flex items-end justify-between gap-4">
                    <div><p className="text-xs text-slate-400">Monthly revenue</p><p className="mt-1 text-4xl font-semibold tracking-[-0.06em] text-white">$138k</p></div>
                    <p className="rounded-lg bg-emerald-400/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300">+18.4%</p>
                  </div>
                  <div className="mt-8 flex h-40 items-end gap-2" aria-hidden="true">
                    {[34, 52, 42, 71, 64, 91, 76, 100].map((height, index) => <span key={height} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300" style={{ height: `${height}%`, opacity: 0.55 + index * 0.06 }} />)}
                  </div>
                  <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500"><span>Jan</span><span>Apr</span><span>Aug</span></div>
                  <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 font-mono text-[10px] text-slate-400"><span>SSR-ready</span><span className="text-center">Keyboard-first</span><span className="text-right">Reduced motion</span></div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-white/70">
            <div className="mx-auto grid max-w-7xl gap-px px-5 sm:grid-cols-3 sm:px-8">
              {[
                ["Animation", "Geometry updates without visual snapping."],
                ["Accessibility", "Focusable SVG marks with useful semantics."],
                ["Rendering", "Final server geometry; no blank first paint."]
              ].map(([title, body]) => <div key={title} className="border-slate-200 py-5 sm:border-r sm:px-7 sm:last:border-r-0"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">{title}</p><p className="mt-2 text-sm text-slate-600">{body}</p></div>)}
            </div>
          </section>

          <section id="playground" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="mb-9 max-w-2xl">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Interactive proof</span>
                <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">A showcase built from the exact components you ship.</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">No decorative stand-ins. Change the controls to exercise responsive measurement, surface-aware palette matching, visual finishes, directional cascades, live data updates, and every major chart family.</p>
              </div>
              <ChartShowcase />
            </div>
          </section>

          <section className="px-5 py-20 sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
                <div><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">Design contract</span><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">The defaults are doing real work.</h2></div>
                <p className="max-w-2xl text-base leading-7 text-slate-600">Motion Charts stays deliberately small so its behavior can remain predictable. Every primitive shares a layout, accessibility, and animation contract rather than asking each product team to recreate it.</p>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {principles.map((principle) => <article key={principle.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="font-mono text-xs font-bold text-blue-700">{principle.number}</span><h3 className="mt-8 text-lg font-semibold tracking-[-0.025em]">{principle.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{principle.body}</p></article>)}
              </div>
            </div>
          </section>

          <section className="bg-white px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><ThemeGallery /></div></section>

          <section id="components" className="scroll-mt-24 bg-[#09111f] px-5 py-20 text-white sm:px-8 sm:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-9 sm:flex-row sm:items-end">
                <div><span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Reference</span><h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">A compact set of dependable building blocks.</h2></div>
                <a href="https://github.com/hetkumar5506/motion-charts/tree/main/packages/charts#readme" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white">Read the full API <ArrowIcon /></a>
              </div>
              <div className="mt-2 divide-y divide-white/10">
                {components.map((component) => <div key={component.name} className="grid gap-1 py-5 sm:grid-cols-[0.8fr_1fr_1fr] sm:items-center sm:gap-6"><code className="text-sm font-semibold text-white">{component.name}</code><span className="text-sm text-slate-300">{component.use}</span><span className="font-mono text-[11px] text-slate-500">{component.note}</span></div>)}
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-[#09111f] px-5 pb-8 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Motion Charts · MIT License</p><div className="flex items-center gap-4"><span>React 18 / 19</span><span>Framer Motion 10–12</span><span>TypeScript</span></div></div>
        </footer>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="px-3 first:pl-0"><dd className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">{value}</dd><dt className="mt-1 text-[11px] leading-4 text-slate-500">{label}</dt></div>;
}

function ArrowIcon() {
  return <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8h9m-3.5-3.5L12 8l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ExternalIcon() {
  return <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3h4v4M13 3 7.5 8.5M12 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
