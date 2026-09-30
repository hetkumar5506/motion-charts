import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

function walkAndFix(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndFix(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".d.ts")) {
      let content = fs.readFileSync(fullPath, "utf8");

      // Replace extensionless relative imports: from "./foo" -> from "./foo.js"
      const updated = content.replace(
        /from\s+["'](\.\.?\/[^"']+)["']/g,
        (match, specifier) => {
          if (specifier.endsWith(".js") || specifier.endsWith(".d.ts")) {
            return match;
          }
          return `from "${specifier}.js"`;
        }
      );

      if (updated !== content) {
        fs.writeFileSync(fullPath, updated, "utf8");
      }
    }
  }
}

// 1. Fix explicit .js extensions in all emitted .d.ts files
walkAndFix(distDir);

// 2. Generate dist/index.d.cts for CJS consumers under node16/nodenext
const indexDtsPath = path.join(distDir, "index.d.ts");
const indexDctsPath = path.join(distDir, "index.d.cts");

if (fs.existsSync(indexDtsPath)) {
  const dtsContent = fs.readFileSync(indexDtsPath, "utf8");
  // For index.d.cts, re-export declarations from the .js files
  fs.writeFileSync(indexDctsPath, dtsContent, "utf8");
}

console.log("Successfully prepared TypeScript declaration files with nodenext compatibility and CJS types.");
