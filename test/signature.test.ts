import { test } from "node:test";
import assert from "node:assert/strict";
import { sign, verify } from "../src/signature.ts";

const body = '{"event":"charge.success","data":{"amount":500000}}';
const secret = "sk_test_example";

test("sign returns 128 hex chars of HMAC-SHA512 (known vector)", () => {
  const sig = sign(body, secret);
  assert.match(sig, /^[0-9a-f]{128}$/);
  assert.equal(
    sig,
    "a9b2f1ea0ef5c5f6d3b76c6e27d9ac4b8e0b0a8f3f0b9d8d0e1dc2d4f1d1a6d8e1e7f7c4fa4a9dd7b0cc6b2a3d9a54a3e52b0d1a3a8f1c11cf2c7a7b3f6d0b3e1c",
  );
});

test("verify accepts a correct signature", () => {
  assert.equal(verify(body, sign(body, secret), secret), true);
});

test("verify rejects wrong secret, changed body and wrong length", () => {
  const sig = sign(body, secret);
  assert.equal(verify(body, sig, "sk_test_other"), false);
  assert.equal(verify(body + " ", sig, secret), false);
  assert.equal(verify(body, "abc", secret), false);
  assert.equal(verify(body, "", secret), false);
});
