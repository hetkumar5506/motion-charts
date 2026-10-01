let cachedFormatter: Intl.NumberFormat | null = null;

export function defaultValueFormatter(value: number): string {
  if (!cachedFormatter) {
    // Keep server-rendered labels identical to browser labels. Consumers that
    // need locale-specific output can provide valueFormatter explicitly.
    cachedFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
  }
  return cachedFormatter.format(value);
}

export function joinLabels(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}
