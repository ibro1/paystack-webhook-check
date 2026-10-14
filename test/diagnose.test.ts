import { test } from "node:test";
import assert from "node:assert/strict";
import { sign } from "../src/signature.ts";
import { diagnose } from "../src/diagnose.ts";

const secret = "sk_test_example";
const compact = '{"event":"charge.success","data":{"amount":500000}}';

test("valid signature is reported valid", () => {
  const d = diagnose(compact, sign(compact, secret), secret);
  assert.equal(d.valid, true);
  assert.equal(d.cause, "valid");
});

test("finds trailing whitespace", () => {
  const d = diagnose(compact + "\n", sign(compact, secret), secret);
  assert.equal(d.valid, false);
  assert.equal(d.cause, "trailing-whitespace");
});

test("finds re-serialised JSON", () => {
  const pretty = JSON.stringify(JSON.parse(compact), null, 2);
  const d = diagnose(pretty, sign(compact, secret), secret);
  assert.equal(d.cause, "reserialised-json");
});

test("wrong secret and bad signature format", () => {
  assert.equal(diagnose(compact, sign(compact, "sk_test_x"), secret).cause, "wrong-secret");
  assert.equal(diagnose(compact, "", secret).cause, "bad-signature-format");
  assert.equal(diagnose(compact, "nothex", secret).cause, "bad-signature-format");
});

test("detects a test key / live key mix-up", () => {
  const live = "sk_live_example";
  const d = diagnose(compact, sign(compact, live), secret, [live]);
  assert.equal(d.cause, "test-key-vs-live-key");
});

test("every diagnosis has a hint a person can act on", () => {
  const d = diagnose(compact, "", secret);
  assert.ok(d.hint.length > 20);
});
