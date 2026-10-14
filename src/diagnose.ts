import { verify } from "./signature.ts";

export type Cause =
  | "valid"
  | "bad-signature-format"
  | "trailing-whitespace"
  | "reserialised-json"
  | "test-key-vs-live-key"
  | "wrong-secret";

export interface Diagnosis {
  valid: boolean;
  cause: Cause;
  hint: string;
}

const result = (valid: boolean, cause: Cause, hint: string): Diagnosis => ({ valid, cause, hint });

/**
 * Explain why a signature does or does not match. `otherSecrets` are keys to try
 * when the main one fails (for example your live key while testing with the test key).
 */
export function diagnose(rawBody: string, signature: string, secret: string, otherSecrets: string[] = []): Diagnosis {
  const sig = signature.trim();
  if (!/^[0-9a-f]{128}$/i.test(sig)) {
    return result(
      false,
      "bad-signature-format",
      "The x-paystack-signature header should be 128 hex characters. Check that you read the header (not the body), that it is not empty, and that no quotes or prefix were added.",
    );
  }
  if (verify(rawBody, sig, secret)) {
    return result(true, "valid", "The signature matches the raw body and the secret key.");
  }
  if (rawBody !== rawBody.trim() && verify(rawBody.trim(), sig, secret)) {
    return result(
      false,
      "trailing-whitespace",
      "The signature matches only after removing leading or trailing whitespace. Your server adds or keeps a newline; sign the exact bytes Paystack sent.",
    );
  }
  try {
    const compact = JSON.stringify(JSON.parse(rawBody));
    if (compact !== rawBody && verify(compact, sig, secret)) {
      return result(
        false,
        "reserialised-json",
        "The signature matches the compact JSON, not the body you gave. A framework parsed and re-serialised the body. Capture the raw request bytes before any JSON middleware (for example express.raw or a verify callback in express.json).",
      );
    }
  } catch {
    // not JSON: nothing to re-serialise
  }
  for (const other of otherSecrets) {
    if (other && verify(rawBody, sig, other)) {
      return result(
        false,
        "test-key-vs-live-key",
        "The signature matches one of the other keys you supplied. You are verifying with the wrong environment key: Paystack signs with the secret key of the mode (test or live) that sent the event.",
      );
    }
  }
  return result(
    false,
    "wrong-secret",
    "The signature is well formed but matches nothing we tried. Check that you use the secret key (sk_...), not the public key, and that it belongs to the same mode (test or live) as the event.",
  );
}
