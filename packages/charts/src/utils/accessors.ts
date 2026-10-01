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

    // Date constructors such as new Date(2026, 0, 2) express a local
    // calendar day. Format local parts by default so that day does not move
    // backward for users east of UTC. Consumers working with UTC instants can
    // pass dateFormatter explicitly (for example, date => date.toISOString()).
    const year = String(value.getFullYear()).padStart(4, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value);
}
