import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENT_NAMES, sampleEvent, signedSample } from "../src/events.ts";
import { verify } from "../src/signature.ts";

test("each supported event is valid JSON with its name", () => {
  assert.deepEqual([...EVENT_NAMES].sort(), ["charge.success", "refund.processed", "transfer.success"]);
  for (const name of EVENT_NAMES) {
    assert.equal(JSON.parse(sampleEvent(name)).event, name);
  }
});

test("unknown event throws", () => {
  assert.throws(() => sampleEvent("nope"), /unknown event/i);
});

test("signedSample verifies", () => {
  const s = signedSample("charge.success", "sk_test_example");
  assert.equal(verify(s.body, s.signature, "sk_test_example"), true);
});
