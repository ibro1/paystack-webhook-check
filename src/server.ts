import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { diagnose } from "./diagnose.ts";
import { signedSample, EVENT_NAMES } from "./events.ts";

const page = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const MAX = 1_000_000;

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX) {
        reject(new Error("too large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Stateless: nothing from a request is stored or logged. */
export function createApp(): Server {
  return createServer(async (req, res) => {
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(value));
    };
    try {
      const url = new URL(req.url ?? "/", "http://x");
      if (req.method === "GET" && url.pathname === "/healthz") return json(200, { ok: true });
      if (req.method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return void res.end(page);
      }
      if (req.method === "POST" && url.pathname === "/api/diagnose") {
        let input: { body?: unknown; signature?: unknown; secret?: unknown; otherSecrets?: unknown };
        try {
          input = JSON.parse(await readBody(req));
        } catch {
          return json(400, { error: "Send JSON: { body, signature, secret }" });
        }
        if (typeof input.body !== "string" || typeof input.signature !== "string" || typeof input.secret !== "string" || !input.secret) {
          return json(400, { error: "body, signature and secret must be strings" });
        }
        const others = Array.isArray(input.otherSecrets) ? input.otherSecrets.filter((s): s is string => typeof s === "string") : [];
        return json(200, diagnose(input.body, input.signature, input.secret, others));
      }
      if (req.method === "POST" && url.pathname === "/api/sample") {
        let input: { event?: unknown; secret?: unknown };
        try {
          input = JSON.parse(await readBody(req));
        } catch {
          return json(400, { error: "Send JSON: { event, secret }" });
        }
        if (typeof input.event !== "string" || typeof input.secret !== "string" || !input.secret) {
          return json(400, { error: `event (${EVENT_NAMES.join(", ")}) and secret are required` });
        }
        try {
          return json(200, signedSample(input.event, input.secret));
        } catch (e) {
          return json(400, { error: (e as Error).message });
        }
      }
      json(404, { error: "not found" });
    } catch {
      json(500, { error: "error" });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, "0.0.0.0", () => console.log(`paystack-webhook-check on :${port}`));
}
