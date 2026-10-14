import { sign } from "./signature.ts";

export const EVENT_NAMES = ["charge.success", "transfer.success", "refund.processed"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

const reference = () => "T" + Date.now() + Math.floor(Math.random() * 1e4);

const samples: Record<EventName, () => unknown> = {
  "charge.success": () => ({
    event: "charge.success",
    data: {
      id: 302961,
      status: "success",
      reference: reference(),
      amount: 500000,
      currency: "NGN",
      channel: "card",
      paid_at: new Date().toISOString(),
      customer: { email: "customer@example.com" },
    },
  }),
  "transfer.success": () => ({
    event: "transfer.success",
    data: {
      id: 80227,
      status: "success",
      reference: reference(),
      amount: 1000000,
      currency: "NGN",
      reason: "Sample payout",
      transferred_at: new Date().toISOString(),
    },
  }),
  "refund.processed": () => ({
    event: "refund.processed",
    data: {
      id: 1203,
      status: "processed",
      transaction_reference: reference(),
      amount: 500000,
      currency: "NGN",
    },
  }),
};

/** A compact JSON sample event, shaped like Paystack's. Fake data only. */
export function sampleEvent(name: string): string {
  if (!(EVENT_NAMES as readonly string[]).includes(name)) {
    throw new Error("Unknown event \"" + name + "\". Supported: " + EVENT_NAMES.join(", "));
  }
  return JSON.stringify(samples[name as EventName]());
}

export function signedSample(name: string, secret: string): { body: string; signature: string } {
  const body = sampleEvent(name);
  return { body, signature: sign(body, secret) };
}
