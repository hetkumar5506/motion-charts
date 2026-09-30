declare const process: any;

// Safely check if running in a development environment.
// Bundlers statically replace `process.env.NODE_ENV !== "production"`.
// Without a typeof process guard, bundlers can eliminate dead code while try/catch prevents ReferenceErrors in raw browser contexts without shims.
export function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

