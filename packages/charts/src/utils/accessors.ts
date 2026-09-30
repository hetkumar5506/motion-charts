import type { Accessor } from "../types";

export function valueOf<TDatum, TValue>(datum: TDatum, index: number, accessor: Accessor<TDatum, TValue>): TValue {
  return typeof accessor === "function" ? accessor(datum, index) : (datum[accessor] as TValue);
}

export function numberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number {
  const value = valueOf(datum, index, accessor);
  if (value == null || (typeof value !== "number" && !Number.isFinite(Number(value)))) {
    const isDev = typeof (globalThis as Record<string, unknown>).process !== "undefined" &&
      ((globalThis as Record<string, unknown>).process as { env?: Record<string, string> })?.env?.NODE_ENV !== "production";
    if (isDev) {
      console.warn(
        `[@motion-charts/core] Received non-finite numerical value at index ${index}:`,
        value,
        "Coercing to 0."
      );
    }
    return 0;
  }
  return typeof value === "number" ? value : Number(value);
}

export function labelOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, string | number>): string {
  const value = valueOf(datum, index, accessor);
  return value == null ? String(index + 1) : String(value);
}
