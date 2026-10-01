import type { Accessor } from "../types";
import { isDev } from "./env";

export function valueOf<TDatum, TValue>(datum: TDatum, index: number, accessor: Accessor<TDatum, TValue>): TValue {
  return typeof accessor === "function" ? accessor(datum, index) : (datum[accessor] as TValue);
}

function warnDev(message: string, value: unknown, index: number): void {
  if (isDev()) {
    console.warn(message, value, "Coercing to 0.");
  }
}

export function rawNumberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number | null {
  const value = valueOf(datum, index, accessor);
  const isInvalid =
    value == null ||
    (typeof value === "number" ? !Number.isFinite(value) : !Number.isFinite(Number(value)));

  if (isInvalid) {
    warnDev(
      `[@motion-charts/core] Received non-finite numerical value at index ${index}:`,
      value,
      index
    );
    return null;
  }
  return typeof value === "number" ? value : Number(value);
}

export function numberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number {
  const raw = rawNumberOf(datum, index, accessor);
  return raw ?? 0;
}

export function labelOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, unknown>): string {
  const value = valueOf(datum, index, accessor);
  if (value == null) return String(index + 1);
  if (typeof value === "object" && value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "Invalid Date";
    try {
      return value.toLocaleDateString();
    } catch {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
  }
  return String(value);
}
