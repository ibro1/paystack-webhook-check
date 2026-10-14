import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA512 (lowercase hex) of the raw body, as Paystack sends in x-paystack-signature. */
export function sign(rawBody: string, secret: string): string {
  return createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
}

/** Constant-time check; a malformed signature is simply false. */
export function verify(rawBody: string, signature: string, secret: string): boolean {
  if (!/^[0-9a-f]{128}$/i.test(signature)) return false;
  const expected = Buffer.from(sign(rawBody, secret), "hex");
  const given = Buffer.from(signature, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
