let cachedFormatter: Intl.NumberFormat | null = null;

export function defaultValueFormatter(value: number): string {
  if (!cachedFormatter) {
    cachedFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
  return cachedFormatter.format(value);
}

export function joinLabels(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}
