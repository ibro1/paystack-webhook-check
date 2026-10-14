import { test } from "node:test";
import assert from "node:assert/strict";
import { sign, verify } from "../src/signature.ts";

const body = '{"event":"charge.success","data":{"amount":500000}}';
const secret = "sk_test_example";

test("sign returns 128 hex chars of HMAC-SHA512 (known vector, checked with openssl)", () => {
  const sig = sign("hello", "key");
  assert.match(sig, /^[0-9a-f]{128}$/);
  assert.equal(
    sig,
    "ff06ab36757777815c008d32c8e14a705b4e7bf310351a06a23b612dc4c7433e7757d20525a5593b71020ea2ee162d2311b247e9855862b270122419652c0c92",
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
