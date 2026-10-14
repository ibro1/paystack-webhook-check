import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { sign } from "../src/signature.ts";

const body = '{"event":"charge.success"}';
const run = (sig: string) =>
  spawnSync(process.execPath, ["src/cli.ts", "verify", "--secret", "k", "--signature", sig, "--body", body], {
    encoding: "utf8",
  });

test("cli verify exits 0 on valid", () => {
  assert.equal(run(sign(body, "k")).status, 0);
});

test("cli verify exits 1 on invalid and explains", () => {
  const r = run(sign(body, "other"));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /wrong-secret/);
});
