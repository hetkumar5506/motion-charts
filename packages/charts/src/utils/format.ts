export function defaultValueFormatter(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function joinLabels(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}
