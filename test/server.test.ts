import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApp } from "../src/server.ts";
import { sign } from "../src/signature.ts";

let server: Server;
let base = "";
before(async () => {
  server = createApp();
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => server.close());

const body = '{"event":"charge.success"}';

test("healthz", async () => {
  assert.equal((await fetch(base + "/healthz")).status, 200);
});

test("POST /api/diagnose returns the diagnosis", async () => {
  const res = await fetch(base + "/api/diagnose", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body, signature: sign(body, "k"), secret: "k" }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).cause, "valid");
});

test("bad input is 400", async () => {
  const res = await fetch(base + "/api/diagnose", { method: "POST", body: "{}" });
  assert.equal(res.status, 400);
});

test("index page is served", async () => {
  const res = await fetch(base + "/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Paystack/);
});
