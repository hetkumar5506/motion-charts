import type { Accessor } from "../types";

export function valueOf<TDatum, TValue>(datum: TDatum, index: number, accessor: Accessor<TDatum, TValue>): TValue {
  return typeof accessor === "function" ? accessor(datum, index) : (datum[accessor] as TValue);
}

export function numberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number {
  const value = valueOf(datum, index, accessor);
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function labelOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, string | number>): string {
  const value = valueOf(datum, index, accessor);
  return value == null ? String(index + 1) : String(value);
}
