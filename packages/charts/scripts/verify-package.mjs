import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8"
});
if (result.status !== 0) throw new Error(result.stderr || "npm pack --dry-run failed");

const [{ files = [] } = {}] = JSON.parse(result.stdout);
const paths = files.map(({ path }) => path);
const allowedFiles = new Set(["CHANGELOG.md", "LICENSE", "README.md", "llms.txt", "package.json"]);
const allowedDist = /^dist\/.+\.(?:js|cjs|d\.ts|d\.cts)$/;
const unexpected = paths.filter((path) => !allowedFiles.has(path) && !allowedDist.test(path));
const required = [...allowedFiles, "dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts"];
const missing = required.filter((path) => !paths.includes(path));
if (unexpected.length || missing.length) {
  throw new Error(`package contents mismatch\nunexpected: ${unexpected.join(", ") || "none"}\nmissing: ${missing.join(", ") || "none"}`);
}

console.log(`Package contents verified: ${paths.length} files.`);
