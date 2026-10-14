# paystack-webhook-check — spec

## What
A small, dependency-free tool that answers one question: "why does my Paystack webhook signature not match?"

Paystack signs every webhook with `x-paystack-signature`, the HMAC-SHA512 (hex) of the **raw request body** using your secret key. Frameworks that parse and re-serialise the JSON break the match. This tool:

1. signs and verifies bodies (library),
2. diagnoses a mismatch and names the likely cause,
3. produces signed sample events (`charge.success`, `transfer.success`, `refund.processed`) and can send them to your endpoint,
4. runs as a CLI and as a small stateless web page.

## Who
Developers at Nigerian businesses integrating Paystack webhooks.

## Privacy
Nothing is stored or logged. The web page and API keep no request data.

## Acceptance tests
1. `sign` returns the 128-character lowercase hex HMAC-SHA512 of the raw body for a known vector.
2. `verify` is true for a correct signature, false for a wrong secret, false for a changed body, and false (not an error) for a signature of the wrong length.
3. `diagnose` on a valid signature says `valid`.
4. `diagnose` finds the cause `trailing-whitespace` when the signature only matches after trimming the body.
5. `diagnose` finds the cause `reserialised-json` when the signature matches the compact `JSON.stringify` of the parsed body (the body was pretty-printed or re-ordered by a framework).
6. `diagnose` finds the cause `wrong-secret` when the signature is well formed but nothing matches; and `bad-signature-format` when the header is missing or not 128 hex characters.
7. `diagnose` reports `test-key-vs-live-key` when the signature matches one of the other secrets supplied.
8. `sampleEvent` returns valid JSON with the right `event` name for each supported event and throws for an unknown one.
9. `signedSample` returns a body and a signature that `verify` accepts.
10. The HTTP API `POST /api/diagnose` returns the diagnosis as JSON, rejects bad input with 400, and `GET /healthz` returns 200.
11. The CLI `verify` exits 0 for a valid signature and 1 for an invalid one.
