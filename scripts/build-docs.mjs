import { rmSync, cpSync } from "node:fs";
rmSync("docs-out", { recursive: true, force: true });
cpSync("docs", "docs-out", { recursive: true });
console.log("docs built -> docs-out");