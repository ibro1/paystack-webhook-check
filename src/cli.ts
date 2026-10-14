#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { diagnose } from "./diagnose.ts";
import { EVENT_NAMES, signedSample } from "./events.ts";

const USAGE = `paystack-webhook-check

  verify --secret SK --signature SIG (--body JSON | --file PATH) [--other-secret SK2]
      Check a signature; on a mismatch, say why. Exit 0 if valid, 1 if not.
  send --url URL --secret SK [--event ${EVENT_NAMES[0]}]
      POST a signed sample event to your endpoint and print the response.
  sample [--event ${EVENT_NAMES[0]}] --secret SK
      Print a signed sample event (body and x-paystack-signature).
`;

function flags(args: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) (out[args[i].slice(2)] ??= []).push(args[++i] ?? "");
  }
  return out;
}

async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const f = flags(rest);
  const one = (k: string) => f[k]?.[0];
  if (cmd === "verify") {
    const secret = one("secret");
    const signature = one("signature");
    const body = one("body") ?? (one("file") ? readFileSync(one("file")!, "utf8") : undefined);
    if (!secret || signature === undefined || body === undefined) {
      console.error(USAGE);
      return 2;
    }
    const d = diagnose(body, signature, secret, f["other-secret"] ?? []);
    console.log(`${d.valid ? "VALID" : "INVALID"}: ${d.cause}\n${d.hint}`);
    return d.valid ? 0 : 1;
  }
  if (cmd === "sample" || cmd === "send") {
    const secret = one("secret");
    if (!secret) {
      console.error(USAGE);
      return 2;
    }
    const s = signedSample(one("event") ?? EVENT_NAMES[0], secret);
    if (cmd === "sample") {
      console.log(JSON.stringify(s, null, 2));
      return 0;
    }
    const url = one("url");
    if (!url) {
      console.error(USAGE);
      return 2;
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-paystack-signature": s.signature },
      body: s.body,
    });
    console.log(`${res.status} ${res.statusText}\n${await res.text()}`);
    return res.ok ? 0 : 1;
  }
  console.log(USAGE);
  return cmd ? 2 : 0;
}

main(process.argv.slice(2)).then((c) => process.exit(c));
