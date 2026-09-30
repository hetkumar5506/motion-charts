declare const process: { env?: Record<string, string> } | undefined;

export function isDev(): boolean {
  try {
    return typeof process !== "undefined" && process?.env?.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
