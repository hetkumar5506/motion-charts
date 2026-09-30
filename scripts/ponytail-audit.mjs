import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const ignore = new Set(["node_modules", "dist", ".next", "coverage", ".agents"]);
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignore.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    if (!stat.isFile() || !/\.(ts|tsx|js|mjs)$/.test(name)) continue;
    if (path.endsWith("scripts/ponytail-audit.mjs")) continue;
    const text = readFileSync(path, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      if (/interface\s+I[A-Z]|Abstract|Factory|Manager/.test(line)) {
        hits.push(`${path.replace(root, "")}:L${index + 1}: yagni: suspicious abstraction word. Keep only if a real second implementation exists.`);
      }
      if (/lodash|moment|date-fns/.test(line)) {
        hits.push(`${path.replace(root, "")}:L${index + 1}: native: dependency likely replaceable with platform APIs.`);
      }
    });
  }
}

walk(root);
if (hits.length === 0) {
  console.log("Lean already. Ship.");
} else {
  console.log(hits.join("\n"));
  console.log(`net: review ${hits.length} possible simplifications.`);
}
