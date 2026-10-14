// Generates docker-compose.demo.yml: the stock node image plus the app files as inline
// compose configs, so the demo needs no image build and no host mounts.
// Usage: node scripts/make-demo-compose.mjs > docker-compose.demo.yml
import { readFileSync } from "node:fs";

const files = ["src/server.ts", "src/diagnose.ts", "src/signature.ts", "src/events.ts", "public/index.html", "package.json"];
const indent = (s) => s.split("\n").map((l) => (l ? "      " + l : l)).join("\n");

let out = "services:\n  app:\n    image: node:22-alpine\n    working_dir: /app\n    command: [\"node\", \"src/server.ts\"]\n    environment:\n      PORT: \"3000\"\n    expose:\n      - \"3000\"\n    configs:\n";
for (const f of files) out += `      - source: ${f.replace(/\W/g, "_")}\n        target: /app/${f}\n`;
out += "configs:\n";
for (const f of files) out += `  ${f.replace(/\W/g, "_")}:\n    content: |\n${indent(readFileSync(f, "utf8").replace(/\$/g, "$$$$"))}\n`;
process.stdout.write(out);
