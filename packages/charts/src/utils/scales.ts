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
  position: (label: string) => number;
  center: (label: string) => number;
};

export function extent(values: readonly number[], includeZero = true): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return includeZero ? [0, 1] : [0, 0];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (!includeZero && min !== max) return [min, max];
  if (min === max) {
    const pad = Math.abs(min || 1) * 0.1;
    return includeZero ? [Math.min(0, min - pad), Math.max(0, max + pad)] : [min - pad, max + pad];
  }
  return [Math.min(includeZero ? 0 : min, min), Math.max(includeZero ? 0 : max, max)];
}

export function niceTicks(min: number, max: number, count = 5): readonly number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min];

  const desired = Math.max(2, Math.floor(count));
  const span = max - min;
  const step0 = Math.abs(span) / Math.max(1, desired - 1);
  const power = 10 ** Math.floor(Math.log10(step0));
  const error = step0 / power;
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;
  const step = factor * power;
  const start = Math.ceil(min / step) * step;
  const end = Math.floor(max / step) * step;
  const ticks: number[] = [];

  for (let value = start; value <= end + step / 2; value += step) {
    ticks.push(roundTick(value));
  }

  if (ticks.length === 0) return [roundTick(min), roundTick(max)];
  if (ticks[0] !== min) ticks.unshift(roundTick(Math.floor(min / step) * step));
  const last = ticks[ticks.length - 1];
  if (last !== undefined && last < max) ticks.push(roundTick(Math.ceil(max / step) * step));
  return ticks;
}

export function createLinearScale(domain: [number, number], range: [number, number], tickCount = 5): LinearScale {
  const rawDomain: [number, number] = domain[0] === domain[1] ? [domain[0], domain[0] + 1] : domain;
  const ticks = niceTicks(rawDomain[0], rawDomain[1], tickCount);
  const firstTick = ticks[0] ?? rawDomain[0];
  const lastTick = ticks[ticks.length - 1] ?? rawDomain[1];
  const [d0, d1] = firstTick === lastTick ? [firstTick, firstTick + 1] : [firstTick, lastTick];
  const [r0, r1] = range;
  const m = (r1 - r0) / (d1 - d0);
  return {
    domain: [d0, d1],
    range,
    ticks,
    scale: (value) => r0 + (value - d0) * m
  };
}

export function createCategoryScale(labels: readonly string[], range: [number, number], padding = 0.2): CategoryScale {
  const uniqueLabels = [...new Set(labels)];
  const [start, end] = range;
  const width = Math.max(0, end - start);
  const count = Math.max(1, uniqueLabels.length);
  const safePadding = Math.min(0.8, Math.max(0, padding));
  const step = width / count;
  const bandwidth = step * (1 - safePadding);
  const inset = (step - bandwidth) / 2;
  const indexByLabel = new Map(uniqueLabels.map((label, index) => [label, index]));

  return {
    labels: uniqueLabels,
    range,
    bandwidth,
    step,
    position: (label) => start + (indexByLabel.get(label) ?? 0) * step + inset,
    center: (label) => start + (indexByLabel.get(label) ?? 0) * step + step / 2
  };
}

function roundTick(value: number): number {
  return Number.parseFloat(value.toPrecision(12));
}
