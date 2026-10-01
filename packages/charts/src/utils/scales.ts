export type LinearScale = {
  domain: [number, number];
  range: [number, number];
  ticks: readonly number[];
  scale: (value: number) => number;
};

export type CategoryScale = {
  labels: readonly string[];
  range: [number, number];
  bandwidth: number;
  step: number;
  position: (label: string, index?: number) => number;
  center: (label: string, index?: number) => number;
};

export function extent(values: readonly number[], includeZero = true): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Infinity || max === -Infinity) return includeZero ? [0, 1] : [0, 0];
  if (!includeZero && min !== max) return [min, max];
  if (min === max) {
    if (min === 0) return includeZero ? [0, 1] : [-1, 1];
    const [lower, upper] = expandFlatDomain(min);
    return includeZero ? [Math.min(0, lower), Math.max(0, upper)] : [lower, upper];
  }
  return [Math.min(includeZero ? 0 : min, min), Math.max(includeZero ? 0 : max, max)];
}

export function niceTicks(min: number, max: number, count = 5): readonly number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min];

  const desired = Number.isFinite(count) ? Math.max(2, Math.floor(count)) : 5;
  const span = max - min;
  if (!Number.isFinite(span)) return [min, max];
  const step0 = Math.abs(span) / Math.max(1, desired - 1);
  const power = 10 ** Math.floor(Math.log10(step0));
  const error = step0 / power;
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;
  const step = factor * power;
  if (!Number.isFinite(step) || step <= 0) return [safeTick(min, min), safeTick(max, max)];
  const start = Math.ceil(min / step) * step;
  const end = Math.floor(max / step) * step;
  const ticks: number[] = [];

  for (let value = start; Number.isFinite(value) && value <= end + step / 2; value += step) {
    const tick = roundTick(value);
    if (Number.isFinite(tick)) ticks.push(tick);
  }

  if (ticks.length === 0) return [safeTick(min, min), safeTick(max, max)];
  if (ticks[0] !== min) ticks.unshift(safeTick(Math.floor(min / step) * step, min));
  const last = ticks[ticks.length - 1];
  if (last !== undefined && last < max) ticks.push(safeTick(Math.ceil(max / step) * step, max));
  return ticks;
}

export function createLinearScale(domain: [number, number], range: [number, number], tickCount = 5): LinearScale {
  const rawDomain: [number, number] = domain[0] === domain[1] ? expandFlatDomain(domain[0]) : domain;
  const ticks = niceTicks(rawDomain[0], rawDomain[1], tickCount);
  const firstTick = ticks[0] ?? rawDomain[0];
  const lastTick = ticks[ticks.length - 1] ?? rawDomain[1];
  const [d0, d1] = firstTick === lastTick ? [firstTick, firstTick + 1] : [firstTick, lastTick];
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;
  const scale = (value: number): number => {
    let ratio: number;
    if (Number.isFinite(domainSpan)) {
      ratio = (value - d0) / domainSpan;
    } else if (value <= d0) {
      ratio = 0;
    } else if (value >= d1) {
      ratio = 1;
    } else if (d0 < 0 && d1 > 0) {
      // Avoid subtracting opposite-signed extreme values (which overflows to
      // Infinity) while retaining a useful position across the zero point.
      const negativeSpan = -d0;
      const positiveSpan = d1;
      if (value < 0) {
        ratio = (1 - value / d0) / (1 + positiveSpan / negativeSpan);
      } else {
        ratio = 1 - ((1 - value / positiveSpan) / (1 + negativeSpan / positiveSpan));
      }
    } else {
      ratio = 0;
    }
    return r0 + ratio * rangeSpan;
  };
  return {
    domain: [d0, d1],
    range,
    ticks,
    scale
  };
}

export function createCategoryScale(labels: readonly string[], range: [number, number], padding = 0.2): CategoryScale {
  const hasDuplicates = new Set(labels).size !== labels.length;
  // If there are duplicate labels (e.g. repeated date strings or multi-series points),
  // preserve sequential items so indices don't collapse to the first occurrence
  const displayLabels = hasDuplicates ? [...labels] : [...new Set(labels)];
  const [start, end] = range;
  const width = Math.max(0, end - start);
  const count = Math.max(1, displayLabels.length);
  const safePadding = Number.isFinite(padding) ? Math.min(0.8, Math.max(0, padding)) : 0.2;
  const step = width / count;
  const bandwidth = step * (1 - safePadding);
  const inset = (step - bandwidth) / 2;
  const indexByLabel = new Map<string, number>();
  displayLabels.forEach((label, idx) => {
    if (!indexByLabel.has(label)) {
      indexByLabel.set(label, idx);
    }
  });

  const resolveIndex = (label: string, index?: number): number => {
    if (typeof index === "number" && index >= 0 && index < count) {
      return index;
    }
    return indexByLabel.get(label) ?? 0;
  };

  return {
    labels: displayLabels,
    range,
    bandwidth,
    step,
    position: (label, index) => start + resolveIndex(label, index) * step + inset,
    center: (label, index) => start + resolveIndex(label, index) * step + step / 2
  };
}

function safeTick(value: number, fallback: number): number {
  const rounded = roundTick(value);
  return Number.isFinite(rounded) ? rounded : fallback;
}

function expandFlatDomain(value: number): [number, number] {
  if (value === 0) return [0, 1];
  const pad = Math.abs(value) * 0.1;
  let lower = value - pad;
  let upper = value + pad;
  if (!Number.isFinite(lower)) lower = value;
  if (!Number.isFinite(upper)) upper = value;
  if (lower === upper) {
    return value > 0 ? [0, value] : [value, 0];
  }
  return [lower, upper];
}

function roundTick(value: number): number {
  return Number.parseFloat(value.toPrecision(12));
}
