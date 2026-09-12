import fs from "fs";
import path from "path";

const apiDir = path.join(process.cwd(), "src", "app", "api");

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name === "route.ts") {
      let content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes('export const dynamic = "force-dynamic";')) {
        content = `export const dynamic = "force-dynamic";\n` + content;
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Added force-dynamic to: ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

processDir(apiDir);
console.log("All API routes updated with force-dynamic.");
