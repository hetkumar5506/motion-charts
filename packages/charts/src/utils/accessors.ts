import type { Accessor, DateFormatter } from "../types";
import { isDev } from "./env";

export function valueOf<TDatum, TValue>(datum: TDatum, index: number, accessor: Accessor<TDatum, TValue>): TValue {
  if (typeof accessor === "function") return accessor(datum, index);
  if (datum == null) return undefined as TValue;
  return datum[accessor] as TValue;
}

function warnDev(message: string, value: unknown, index: number): void {
  if (isDev()) {
    console.warn(message, value, "Coercing to 0.");
  }
}

export function rawNumberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number | null {
  const value = valueOf(datum, index, accessor);
  let numericValue: number;

  if (value == null) {
    warnDev(
      `[@motion-charts/core] Received non-finite numerical value at index ${index}:`,
      value,
      index
    );
    return null;
  }

  if (typeof value === "number") {
    numericValue = value;
  } else {
    try {
      numericValue = Number(value);
    } catch {
      warnDev(
        `[@motion-charts/core] Received non-finite numerical value at index ${index}:`,
        value,
        index
      );
      return null;
    }
  }

  if (!Number.isFinite(numericValue)) {
    warnDev(
      `[@motion-charts/core] Received non-finite numerical value at index ${index}:`,
      value,
      index
    );
    return null;
  }
  return numericValue;
}

export function numberOf<TDatum>(datum: TDatum, index: number, accessor: Accessor<TDatum, number>): number {
  const raw = rawNumberOf(datum, index, accessor);
  return raw ?? 0;
}

export function labelOf<TDatum>(
  datum: TDatum,
  index: number,
  accessor: Accessor<TDatum, unknown>,
  dateFormatter?: DateFormatter
): string {
  const value = valueOf(datum, index, accessor);
  if (value == null) return String(index + 1);
  if (typeof value === "object" && value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "Invalid Date";
    if (dateFormatter) return String(dateFormatter(value) ?? "");

    // ISO date-only strings (for example, new Date("2026-03-01")) are parsed
    // as UTC midnight. Use UTC calendar parts for that representation so the
    // date does not move backward in western timezones or forward in eastern
    // timezones. Other Date values represent local calendar dates/timestamps,
    // so keep using local parts for those values.
    const isUtcMidnight = value.getUTCHours() === 0
      && value.getUTCMinutes() === 0
      && value.getUTCSeconds() === 0
      && value.getUTCMilliseconds() === 0;
    const year = String(isUtcMidnight ? value.getUTCFullYear() : value.getFullYear()).padStart(4, "0");
    const month = String((isUtcMidnight ? value.getUTCMonth() : value.getMonth()) + 1).padStart(2, "0");
    const day = String(isUtcMidnight ? value.getUTCDate() : value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value);
}
