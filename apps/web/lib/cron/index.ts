import { Client } from "@upstash/qstash";

const isQstashAvailable = process.env.QSTASH_TOKEN && process.env.QSTASH_TOKEN !== "placeholder";

const noopQstash = new Proxy({} as Client, {
  get(_, prop) {
    if (typeof prop === "string") {
      return (..._args: unknown[]) => Promise.resolve(null);
    }
    return undefined;
  },
});

export const qstash = isQstashAvailable
  ? new Client({ token: process.env.QSTASH_TOKEN || "" })
  : noopQstash;

// Default batch size for cron jobs that process records in batches
export const CRON_BATCH_SIZE = 100;
